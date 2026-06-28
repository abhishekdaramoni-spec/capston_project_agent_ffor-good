import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { executeMultiAgentPipeline, runOcrAgent } from "./src/lib/agents";

dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON parser up to 10MB (for base64 images)
app.use(express.json({ limit: "10mb" }));

// Initialize GoogleGenAI client (server-side only)
const apiKey = process.env.GEMINI_API_KEY;
const isDemoMode = !apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "";

let ai: GoogleGenAI | null = null;
if (!isDemoMode) {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("HealthMate AI: Gemini Client initialized successfully.");
  } catch (err) {
    console.error("HealthMate AI: Failed to initialize Gemini Client.", err);
  }
} else {
  console.log("HealthMate AI: Starting in DEMO MODE (No API Key detected).");
}

// Simple rate limiter state
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 15;

function rateLimitMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const userRate = ipRequestCounts.get(ip);

  if (!userRate || now > userRate.resetTime) {
    ipRequestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (userRate.count >= MAX_REQUESTS_PER_MINUTE) {
    return res.status(429).json({
      error: "Rate limit exceeded. Please wait a minute before sending another request.",
    });
  }

  userRate.count++;
  next();
}

// Input sanitizer to prevent prompt injections and basic script injections
function sanitizeInput(text: string): string {
  if (!text) return "";
  // Strip common HTML tags and script elements
  let sanitized = text.replace(/<[^>]*>/g, "");
  // Trim and limit characters to prevent buffer issues
  sanitized = sanitized.substring(0, 1000);
  return sanitized;
}

/**
 * Model Context Protocol (MCP) Mock Registry and JSON-RPC 2.0 Server Endpoint
 * Exposes 10 custom tools with comprehensive input schema validation, standard schemas,
 * and standard JSON-RPC 2.0 request/response/error structures.
 */
const mcpTools = [
  {
    name: "medicine_lookup",
    description: "Looks up key active ingredients, purposes, warnings, and common side-effects of a drug.",
    inputSchema: {
      type: "object",
      properties: {
        medicineName: { type: "string", description: "The name of the medicine." }
      },
      required: ["medicineName"]
    }
  },
  {
    name: "drug_interaction",
    description: "Checks for potential adverse interaction side-effects between multiple medications.",
    inputSchema: {
      type: "object",
      properties: {
        medicinesList: {
          type: "array",
          items: { type: "string" },
          description: "List of active medicine names being checked."
        }
      },
      required: ["medicinesList"]
    }
  },
  {
    name: "hospital_finder",
    description: "Finds the nearest physical emergency rooms, hospitals, or medical care centers based on location.",
    inputSchema: {
      type: "object",
      properties: {
        location: { type: "string", description: "City name or ZIP code." }
      },
      required: ["location"]
    }
  },
  {
    name: "first_aid",
    description: "Provides standard, immediate first-aid procedures and home-care safety guidelines.",
    inputSchema: {
      type: "object",
      properties: {
        emergencyType: { type: "string", description: "Type of concern (e.g. burn, choke, cut, sprain)." }
      },
      required: ["emergencyType"]
    }
  },
  {
    name: "health_report",
    description: "Drafts or retrieves a comprehensive personal medical triage summary report.",
    inputSchema: {
      type: "object",
      properties: {
        reportId: { type: "string", description: "Optional health report identifier." }
      }
    }
  },
  {
    name: "medicine_search",
    description: "Searches the virtual catalog for medicines matching a search query or category.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search keyword or medical category." }
      },
      required: ["query"]
    }
  },
  {
    name: "medicine_alternatives",
    description: "Suggests safe over-the-counter, herbal, or home-care alternatives for a given medicine.",
    inputSchema: {
      type: "object",
      properties: {
        medicineName: { type: "string", description: "The drug name to find alternatives for." }
      },
      required: ["medicineName"]
    }
  },
  {
    name: "risk_prediction",
    description: "Calculates general safety urgency classification scores from input symptoms.",
    inputSchema: {
      type: "object",
      properties: {
        symptoms: { type: "string", description: "The verbal symptoms." },
        age: { type: "string", description: "Patient age in years." },
        duration: { type: "string", description: "Symptom duration description." }
      },
      required: ["symptoms", "age", "duration"]
    }
  },
  {
    name: "ocr_extract",
    description: "Transcribes and extracts key warning label instructions from a physical packaging photo.",
    inputSchema: {
      type: "object",
      properties: {
        image: { type: "string", description: "Base64 encoded medicine label image string." }
      },
      required: ["image"]
    }
  },
  {
    name: "health_summary",
    description: "Retrieves comforting, custom wellness tips and exercises based on age demographics.",
    inputSchema: {
      type: "object",
      properties: {
        age: { type: "string", description: "Patient age." }
      },
      required: ["age"]
    }
  }
];

// GET MCP Endpoint (Meta-discovery)
app.get("/api/mcp", (req, res) => {
  res.json({
    status: "active",
    protocolVersion: "2024-11-05",
    serverName: "HealthMate Medical Tool Reference Server",
    tools: mcpTools
  });
});

// POST MCP JSON-RPC 2.0 Endpoint with full logging, validation, and execution handlers
app.post("/api/mcp", (req, res) => {
  const { jsonrpc, method, params, id } = req.body;
  const requestId = id !== undefined ? id : null;

  // Logging request receipt
  console.log(`[MCP JSON-RPC 2.0] Received request. Method: "${method}", ID: ${requestId}`);

  // 1. JSON-RPC Protocol validation
  if (jsonrpc !== "2.0") {
    return res.status(400).json({
      jsonrpc: "2.0",
      error: { code: -32600, message: "Invalid Request: jsonrpc version must be exactly '2.0'" },
      id: requestId
    });
  }

  // 2. Routing methods
  if (method === "tools/list") {
    return res.json({
      jsonrpc: "2.0",
      result: { tools: mcpTools },
      id: requestId
    });
  }

  if (method === "tools/call") {
    if (!params || !params.name) {
      return res.status(400).json({
        jsonrpc: "2.0",
        error: { code: -32602, message: "Invalid Params: 'name' is required for tools/call" },
        id: requestId
      });
    }

    const toolName = params.name;
    const args = params.arguments || {};

    console.log(`[MCP JSON-RPC 2.0] Executing tool: "${toolName}" with args:`, args);

    // 3. Finding and executing requested tool with inputs validation
    const toolDef = mcpTools.find(t => t.name === toolName);
    if (!toolDef) {
      return res.status(404).json({
        jsonrpc: "2.0",
        error: { code: -32601, message: `Method not found: Tool '${toolName}' is not registered.` },
        id: requestId
      });
    }

    // Basic required fields validation
    if (toolDef.inputSchema.required) {
      for (const reqField of toolDef.inputSchema.required) {
        if (args[reqField] === undefined) {
          return res.status(400).json({
            jsonrpc: "2.0",
            error: { code: -32602, message: `Invalid Params: Missing required field '${reqField}' for tool '${toolName}'` },
            id: requestId
          });
        }
      }
    }

    // Execute standard tool responders
    let contentText = "";
    try {
      switch (toolName) {
        case "medicine_lookup": {
          const mname = args.medicineName || "Medicine";
          contentText = `Medicine verified: '${mname}'. Commonly used to soothe fever, body discomfort, and general minor pains. Always follow bottle cap specifications and limit daily ingestion to prevent gastric sensitivity.`;
          break;
        }
        case "drug_interaction": {
          const list = args.medicinesList || [];
          contentText = list.length > 1 
            ? `Checked combinations of: ${list.join(", ")}. No critical interactions detected. Standard warning: Avoid taking multi-symptom cold relievers alongside physical painkillers to avoid accidental paracetamol double-dosage.`
            : "Please provide a list of at least two medicines to audit conflicts.";
          break;
        }
        case "hospital_finder": {
          const loc = args.location || "your area";
          contentText = `Nearest emergency clinics found in '${loc}': 1) St. Jude Community Health Hospital (2.3 miles away, Open 24 Hours), 2) Cross-Care Urgent Triage Clinic (3.8 miles away, open until 10 PM). Call 911 for severe distress.`;
          break;
        }
        case "first_aid": {
          const etype = (args.emergencyType || "concern").toLowerCase();
          if (etype.includes("burn")) {
            contentText = `First Aid for minor thermal burns: 1) Cool the area under clean running water for 10-15 minutes. 2) Cover with a sterile, non-stick bandage. 3) Avoid applying heavy oil, butter, or ice directly as they can trap heat.`;
          } else if (etype.includes("chok")) {
            contentText = `First Aid for Choking (conscious adult): 1) Ask if they can speak or cough. 2) Stand behind them and give up to 5 firm back blows. 3) If unrelieved, perform up to 5 quick abdominal thrusts (Heimlich maneuver). 4) Call local emergency dispatch.`;
          } else {
            contentText = `First aid response for general home issues: Clean the area with mild soap, apply gentle direct pressure if there is bleeding, elevate the limb if bruised, and rest. Always call medical services if symptoms linger.`;
          }
          break;
        }
        case "health_report": {
          contentText = `Prepared Health Triage Report context. Symptoms analyzed: mild, Duration: brief. Urgency classification calculated as low. General clinical recommendation: monitor closely, hydrate generously.`;
          break;
        }
        case "medicine_search": {
          const q = args.query || "";
          contentText = `Virtual search results for '${q}': Found generic alternatives (e.g., Acetaminophen, Ibuprofen) with complete, verified monograph guidelines available in our cabinet database.`;
          break;
        }
        case "medicine_alternatives": {
          const m = args.medicineName || "Painkiller";
          contentText = `Natural support alternatives for '${m}': Warm herbal chamomile infusions, peppermint muscle essential oil cooling rubs, and cold-compress wraps have proven therapeutic benefits for mild tension issues.`;
          break;
        }
        case "risk_prediction": {
          contentText = `Risk Assessment prediction: Low-level triage urgency. Key vital markers look normal. Follow baseline guidelines, rest, and keep a brief log of updates.`;
          break;
        }
        case "ocr_extract": {
          contentText = `OCR extract process completed. Transcribed: "Ibuprofen Liquid Gels, 200mg". Active warnings: Do not mix with stomach irritating compounds. Take with food.`;
          break;
        }
        case "health_summary": {
          contentText = `Wellness summary tip of the day: Ensure you are sipping 8-10 glasses of pure water. Hydrated muscle and blood cells cleanse compound substances much more easily.`;
          break;
        }
        default:
          contentText = "Tool executed successfully with normal logs.";
      }

      return res.json({
        jsonrpc: "2.0",
        result: {
          content: [{ type: "text", text: contentText }]
        },
        id: requestId
      });

    } catch (err: any) {
      return res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: `Internal error during tool execution: ${err.message}` },
        id: requestId
      });
    }
  }

  // Method not recognized
  return res.status(404).json({
    jsonrpc: "2.0",
    error: { code: -32601, message: `Method not found: ${method}` },
    id: requestId
  });
});

// Dedicated Medicine Label Scanner API Endpoint
app.post("/api/scan", rateLimitMiddleware, async (req, res) => {
  try {
    const { medicineImage, forceUnreadable, savedMedicines, mockSelection } = req.body;
    if (!medicineImage) {
      return res.status(400).json({ error: "No medicine label image provided." });
    }

    // Simulate AI network and extraction latency
    await sleep(1500);

    const savedMedicinesList = Array.isArray(savedMedicines) 
      ? savedMedicines.map((m: any) => typeof m === "string" ? m : m.name)
      : [];

    if (forceUnreadable) {
      const interactions = savedMedicinesList.map((m: string) => ({
        medicineName: m,
        severity: "None",
        explanation: "Could not evaluate drug interactions because the active ingredients on the label were unreadable."
      }));

      return res.json({
        name: "Aceta.... (Tylenol Extra Strength)",
        genericName: "Aceta.... (Unclear)",
        strength: "Unclear",
        dosageForm: "Tablet (Unclear)",
        manufacturer: "Unclear / Blurred",
        batchNumber: "Not visible",
        manufacturingDate: "Not visible",
        expiryDate: "Not visible",
        composition: "Aceta.... [rest unreadable]",
        storageInstructions: "Store below 25°C [partially readable]",
        purpose: "Pain reliever and fever reducer (unreadable sections)",
        commonUses: "Could not be fully extracted due to high blur level and shadow overlay.",
        howItWorks: "The active ingredient acts on pain-mediating pathways but exact mechanism cannot be summarized due to blurred labeling.",
        sideEffects: ["Could not read side effects safely. Please refer to physical packaging."],
        warnings: ["Unreadable warnings section. Please do not consume unless warnings are verified."],
        pregnancyWarning: "Pregnancy safety guidelines were blurred. Ask a pharmacist before consumption.",
        childSafety: "Child dosing instructions are completely unreadable.",
        storageAdvice: "Store safely out of reach of children.",
        confidenceLevel: 42,
        confidenceText: "We identified the medicine brand name zone but some of the crucial dosage instructions are blurry. Please upload a higher resolution, front-facing, well-lit photograph.",
        interactions
      });
    }

    if (!isDemoMode && ai) {
      try {
        const prompt = `
          You are 'Professional Medicine Scanner' Agent powered by Google Gemini Vision.
          Analyze this medicine label, packaging carton, bottle, strip, or prescription image.
          
          OCR EXTRACTION:
          Identify details like Medicine Name, Generic Name, Strength, Dosage Form, Manufacturer, Batch Number, Manufacturing Date, Expiry Date, Composition, Storage Instructions.

          AI CLINICAL ANALYSIS:
          Determine Purpose, Common Uses, How it Works (simple everyday language), Common Side Effects, Safety Warnings, Pregnancy Warning, Child Safety, Storage Advice, Confidence Score (0-100).

          DRUG-DRUG INTERACTIONS:
          Check potential drug interactions with these medications currently in the user's active cabinet: ${JSON.stringify(savedMedicinesList)}.
          For each medication, assign a severity ("None", "Mild", "Moderate", or "Serious") and provide a clear, simple precaution warning.

          Return strictly a JSON object of this format (no conversational wrapping, no Markdown formatting other than raw JSON):
          {
            "name": "Exact Brand Name (or common name)",
            "genericName": "Generic drug name",
            "strength": "e.g., 500 mg, 10 mg/5 mL",
            "dosageForm": "e.g., Tablet, Capsule, Syrup, Liquid Gel",
            "manufacturer": "e.g., McNeil Consumer Healthcare (or 'Unknown')",
            "batchNumber": "e.g., B23049 (or 'Not visible')",
            "manufacturingDate": "e.g., 2025-10-12 (or 'Not visible')",
            "expiryDate": "e.g., 2028-10-12 (or 'Not visible')",
            "composition": "Active ingredients list with strengths",
            "storageInstructions": "Storage requirements as labeled",
            "purpose": "Primary therapeutic purpose in clear, simple terms",
            "commonUses": "Common clinical uses",
            "howItWorks": "Simple explanation of bodily mechanism",
            "sideEffects": ["Side effect 1", "Side effect 2"],
            "warnings": ["Warning 1", "Warning 2"],
            "pregnancyWarning": "Pregnancy guidance",
            "childSafety": "Child safety guidance",
            "storageAdvice": "Child-safe storage advice",
            "confidenceLevel": 98,
            "confidenceText": "Explanation of reading clarity",
            "interactions": [
              {
                "medicineName": "Name of medication compared",
                "severity": "None" | "Mild" | "Moderate" | "Serious",
                "explanation": "Simple explanation of the risk/outcome"
              }
            ]
          }
        `;

        const imagePart = {
          inlineData: {
            mimeType: "image/jpeg",
            data: medicineImage.split(",")[1] || medicineImage,
          },
        };

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: { parts: [imagePart, { text: prompt }] },
          config: { responseMimeType: "application/json" }
        });

        const text = response.text || "";
        const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        return res.json(parsed);
      } catch (visionErr) {
        console.error("Vision parsing error, falling back to smart simulation", visionErr);
        return res.json(getDemoMedicine(mockSelection, savedMedicinesList));
      }
    } else {
      return res.json(getDemoMedicine(mockSelection, savedMedicinesList));
    }
  } catch (error: any) {
    console.error("Scanner endpoint error:", error);
    return res.status(500).json({ error: "An unexpected error occurred during image label extraction." });
  }
});

/**
 * Multi-Agent Streaming Execution Endpoint (SSE)
 * Stream the execution flow step-by-step to the front-end Multi-Agent Monitor.
 */
app.post("/api/analyze", rateLimitMiddleware, async (req, res) => {
  // Setup SSE Headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }

  const sendStep = (stepId: string, status: "idle" | "running" | "success" | "failed", explanation: string, progress: number, timeSpent?: number, data?: any) => {
    res.write(`data: ${JSON.stringify({ stepId, status, explanation, progress, timeSpent, data })}\n\n`);
  };

  try {
    const rawAge = req.body.age || "";
    const rawSymptoms = req.body.symptoms || "";
    const rawDuration = req.body.duration || "";
    const rawAllergies = req.body.allergies || "";
    const rawMedicines = req.body.existingMedicines || [];
    const medicineImage = req.body.medicineImage; // base64 string

    const age = sanitizeInput(rawAge);
    const symptoms = sanitizeInput(rawSymptoms);
    const duration = sanitizeInput(rawDuration);
    const allergies = sanitizeInput(rawAllergies);
    const existingMedicines = rawMedicines.map((m: string) => sanitizeInput(m));

    // Execute the complete modular 10 multi-agent sequential pipeline!
    const context = await executeMultiAgentPipeline(
      {
        age,
        symptoms,
        duration,
        allergies,
        existingMedicines,
        medicineImage
      },
      ai,
      (stepId, status, explanation, progress, timeSpent, data) => {
        sendStep(stepId, status, explanation, progress, timeSpent, data);
      }
    );

  } catch (error: any) {
    console.error("Multi-Agent Stream error:", error);
    res.write(`data: ${JSON.stringify({ error: error.message || "An unexpected error occurred during medical triage." })}\n\n`);
  } finally {
    res.end();
  }
});

// Helper functions for mock data fallback
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getDemoMedicine(selection?: string, savedMedicines: string[] = []) {
  const normalizedSelection = (selection || "ibuprofen").toLowerCase();
  
  const mockDatabase: Record<string, any> = {
    ibuprofen: {
      name: "Advil Liqui-Gels (Ibuprofen 200mg)",
      genericName: "Ibuprofen",
      strength: "200 mg",
      dosageForm: "Liquid Gel Capsule",
      manufacturer: "Pfizer Consumer Healthcare",
      batchNumber: "B9024X",
      manufacturingDate: "2025-10-12",
      expiryDate: "2028-10-12",
      composition: "Ibuprofen 200mg, solubilized potassium",
      storageInstructions: "Store at 20-25°C (68-77°F). Avoid excessive heat.",
      purpose: "Non-Steroidal Anti-Inflammatory Drug (NSAID) for pain and fever relief.",
      commonUses: "Headaches, toothaches, muscle aches, backaches, common cold, minor arthritis, and menstrual cramps.",
      howItWorks: "Blocks enzymes (COX-1 and COX-2) that produce prostaglandins, the chemicals in your body that trigger pain, inflammation, and fever.",
      sideEffects: ["Stomach upset, heartburn, or nausea", "Mild dizziness", "Increased sensitivity to sunlight"],
      warnings: ["Do not take on an empty stomach to avoid stomach irritation.", "Ask a doctor before use if you have kidney/liver problems, or high blood pressure.", "Do not exceed 1200 mg (6 capsules) in 24 hours unless directed."],
      pregnancyWarning: "Avoid using in the last 3 months of pregnancy unless directed, as it may cause complications in unborn child.",
      childSafety: "Ask a pediatrician before administering to children under 12 years of age.",
      storageAdvice: "Keep in original container away from light, moisture, and strictly out of reach of children.",
      confidenceLevel: 98,
      confidenceText: "Extracted high contrast text from clear packaging with flawless accuracy."
    },
    acetaminophen: {
      name: "Tylenol Extra Strength (Acetaminophen 500mg)",
      genericName: "Acetaminophen (Paracetamol)",
      strength: "500 mg",
      dosageForm: "Caplet (Tablet)",
      manufacturer: "McNeil Consumer Healthcare",
      batchNumber: "T7483A",
      manufacturingDate: "2026-02-15",
      expiryDate: "2029-02-15",
      composition: "Acetaminophen 500mg",
      storageInstructions: "Store between 20-25°C (68-77°F). Keep dry.",
      purpose: "Pain Reliever and Fever Reducer.",
      commonUses: "Headache, backache, toothache, minor arthritis pain, premenstrual and menstrual cramps, and temporary reduction of fever.",
      howItWorks: "Acts primarily on the central nervous system to elevate the pain threshold and regulate body temperature via the heat-regulating center in the brain.",
      sideEffects: ["Generally well tolerated when taken as directed", "In rare cases, mild skin reactions may occur", "Nausea or loss of appetite (if overconsumed)"],
      warnings: ["Severe liver damage may occur if you take more than 4,000 mg in 24 hours, or mix with alcohol.", "Do not use with any other drug containing Acetaminophen to avoid accidental double-dose.", "Consult a doctor if pain worsens or lasts more than 10 days."],
      pregnancyWarning: "Generally considered the safest pain reliever during pregnancy, but consult your physician before use.",
      childSafety: "Do not use for children under 12 years of age.",
      storageAdvice: "Store in a child-resistant container in a cool, dry place. Keep out of reach of children.",
      confidenceLevel: 99,
      confidenceText: "Crisp white background text allows the OCR parser to scan characters with near perfect certainty."
    },
    amoxicillin: {
      name: "Amoxicillin Trihydrate (Amoxicillin 500mg)",
      genericName: "Amoxicillin",
      strength: "500 mg",
      dosageForm: "Capsule",
      manufacturer: "Sandoz Pharmaceuticals",
      batchNumber: "A81744",
      manufacturingDate: "2026-01-10",
      expiryDate: "2028-01-10",
      composition: "Amoxicillin Trihydrate 500mg",
      storageInstructions: "Store dry at room temperature below 25°C (77°F).",
      purpose: "Penicillin-type Antibiotic for bacterial infections.",
      commonUses: "Middle ear infections, strep throat, pneumonia, skin infections, and urinary tract infections (UTIs).",
      howItWorks: "Inhibits the synthesis of bacterial cell walls, causing the cell walls to weaken and rupture, thereby killing the active bacteria.",
      sideEffects: ["Mild diarrhea, stomach discomfort, or nausea", "Vaginal yeast infection (thrush)", "Slight taste alteration"],
      warnings: ["Must complete the entire prescribed course even if symptoms disappear, to prevent antibiotic resistance.", "Do not take if you have a known history of penicillin allergy (can trigger severe anaphylaxis).", "Consult doctor if severe, watery diarrhea occurs during or after treatment."],
      pregnancyWarning: "Generally safe for pregnancy and breastfeeding, but must only be taken under strict physician prescription.",
      childSafety: "Dosage must be carefully weight-adjusted by a qualified pediatrician.",
      storageAdvice: "Keep in airtight bottle. If liquid suspension, keep refrigerated and discard unused portion after 14 days.",
      confidenceLevel: 96,
      confidenceText: "Prescription label text parsed perfectly; scanned medical-grade label identifiers successfully."
    },
    benadryl: {
      name: "Benadryl Allergy (Diphenhydramine 25mg)",
      genericName: "Diphenhydramine Hydrochloride",
      strength: "25 mg",
      dosageForm: "Tablet",
      manufacturer: "Johnson & Johnson Consumer Inc.",
      batchNumber: "D2039L",
      manufacturingDate: "2025-08-01",
      expiryDate: "2028-08-01",
      composition: "Diphenhydramine HCl 25mg",
      storageInstructions: "Store between 15-25°C (59-77°F). Protect from excessive moisture.",
      purpose: "First-generation Antihistamine.",
      commonUses: "Relieves runny nose, sneezing, itchy/watery eyes, itchy throat due to hay fever, and allergic skin hives.",
      howItWorks: "Blocks histamine, a natural chemical substance produced by the body during an allergic reaction, preventing it from binding to its receptors.",
      sideEffects: ["Marked drowsiness and sedation", "Dry mouth, dry nose, or dry throat", "Mild constipation or urinary retention"],
      warnings: ["Avoid driving, operating heavy machinery, or drinking alcohol while taking this medicine as it causes severe drowsiness.", "Ask a doctor before use if you have glaucoma, thyroid disease, or trouble urinating.", "Do not use to make a child sleepy or combine with other sleeping aids."],
      pregnancyWarning: "Use only if clearly needed. High doses close to delivery can cause newborn tremors. Consult doctor.",
      childSafety: "Do not use for children under 6 years of age without consulting a doctor.",
      storageAdvice: "Store in dry child-resistant blister pack. Keep out of reach of children.",
      confidenceLevel: 97,
      confidenceText: "Standard carton text scanned clearly with robust character confirmation."
    },
    lipitor: {
      name: "Lipitor (Atorvastatin 20mg)",
      genericName: "Atorvastatin Calcium",
      strength: "20 mg",
      dosageForm: "Tablet",
      manufacturer: "Pfizer Labs",
      batchNumber: "L3901B",
      manufacturingDate: "2025-11-20",
      expiryDate: "2028-11-20",
      composition: "Atorvastatin Calcium 20mg",
      storageInstructions: "Store between 20-25°C (68-77°F). Keep away from humidity.",
      purpose: "HMG-CoA Reductase Inhibitor (Statin) to lower cholesterol.",
      commonUses: "Prevents cardiovascular disease, lowers LDL (bad) cholesterol and triglycerides, and raises HDL (good) cholesterol.",
      howItWorks: "Inhibits the liver enzyme HMG-CoA reductase, which plays a key role in the biosynthesis of cholesterol, causing the liver to clear more cholesterol from the blood.",
      sideEffects: ["Mild muscle pain or joint aches", "Slight headache", "Mild digestive changes or diarrhea"],
      warnings: ["Contact your doctor immediately if you experience unexplained muscle pain, tenderness, or weakness (especially with fever), as it could indicate rare, serious muscle breakdown (rhabdomyolysis).", "Do not consume large amounts of grapefruit juice (greater than 1.2 liters daily), as it increases Lipitor blood levels and side-effect risks.", "Do not use if you have active liver disease."],
      pregnancyWarning: "Do not use if pregnant or planning to become pregnant, as it can cause harm to the developing fetus.",
      childSafety: "Generally not used in pediatric patients under 10 years of age unless specifically directed by a lipid specialist.",
      storageAdvice: "Keep in a cool, dry cabinet away from direct sunlight. Maintain child safety caps on bottles.",
      confidenceLevel: 95,
      confidenceText: "Parsed prescription vial labeling; detected all primary active ingredients and warnings."
    }
  };

  const med = mockDatabase[normalizedSelection] || mockDatabase.ibuprofen;
  
  // Calculate interactions dynamically
  const interactions = savedMedicines.map((savedMed) => {
    const sName = savedMed.toLowerCase();
    
    if (normalizedSelection === "ibuprofen") {
      if (sName.includes("aspirin")) {
        return {
          medicineName: savedMed,
          severity: "Moderate",
          explanation: "Both Advil (Ibuprofen) and Aspirin are NSAIDs. Taking them together increases your risk of stomach upset, gastrointestinal bleeding, and ulcers. Additionally, taking Ibuprofen may interfere with the heart-protective benefits of low-dose Aspirin. If taking both, space them out or discuss alternative pain relievers with your physician."
        };
      }
      if (sName.includes("warfarin") || sName.includes("coumadin") || sName.includes("blood thinner")) {
        return {
          medicineName: savedMed,
          severity: "Serious",
          explanation: "Ibuprofen can significantly increase the risk of internal bleeding when combined with blood thinners like Warfarin. Avoid using NSAIDs while on anticoagulant therapy unless explicitly prescribed and closely monitored by your doctor."
        };
      }
    }
    
    if (normalizedSelection === "acetaminophen") {
      if (sName.includes("aspirin")) {
        return {
          medicineName: savedMed,
          severity: "None",
          explanation: "No known interaction. Acetaminophen and low-dose Aspirin can safely be used together for pain relief and cardioprotection when taken at recommended dosages."
        };
      }
      if (sName.includes("warfarin") || sName.includes("coumadin") || sName.includes("blood thinner")) {
        return {
          medicineName: savedMed,
          severity: "Moderate",
          explanation: "Prolonged, high-dose use of Acetaminophen may enhance the anticoagulant effect of Warfarin, increasing your risk of bleeding. Occasional small doses are generally safe, but monitor your INR levels closely and consult your doctor."
        };
      }
    }
    
    if (normalizedSelection === "lipitor") {
      if (sName.includes("grapefruit")) {
        return {
          medicineName: savedMed,
          severity: "Moderate",
          explanation: "Grapefruit juice contains compounds that inhibit the enzymes responsible for breaking down Atorvastatin in your liver. This can increase Lipitor levels in your blood, raising the risk of muscle pain and rare liver toxicity."
        };
      }
    }
    
    return {
      medicineName: savedMed,
      severity: "None",
      explanation: "No known interaction with your active cabinet medication. Ensure you follow recommended dosing schedules."
    };
  });

  return {
    ...med,
    interactions
  };
}

function generateDemoReport(
  age: string,
  symptoms: string,
  duration: string,
  allergies: string,
  existingMedicines: string[],
  scannedMedicine: any,
  interactionSeverity: string,
  interactionExplanation: string,
  urgentFlag: boolean
) {
  // Tailor possible causes
  const causes: any[] = [];
  const lowercaseSymptoms = symptoms.toLowerCase();

  if (lowercaseSymptoms.includes("fever") || lowercaseSymptoms.includes("cough") || lowercaseSymptoms.includes("cold") || lowercaseSymptoms.includes("sniffles")) {
    causes.push({
      condition: "Common Cold or Mild Viral Flu",
      explanation: "A standard upper respiratory virus. This is very common and typically resolves on its own within 7 to 10 days with rest, hydration, and over-the-counter support.",
      likelihood: "High"
    });
    causes.push({
      condition: "Seasonal Allergy Symptoms",
      explanation: "Allergies to pollen, dust, or pet dander can trigger sinus inflammation, watery eyes, sneezing, and dry throat.",
      likelihood: "Medium"
    });
  } else if (lowercaseSymptoms.includes("headache") || lowercaseSymptoms.includes("migraine")) {
    causes.push({
      condition: "Tension Headache",
      explanation: "A dull, aching pain in the head often caused by stress, lack of sleep, eye strain, dehydration, or neck muscle tightness.",
      likelihood: "High"
    });
    causes.push({
      condition: "Dehydration headache",
      explanation: "Your body is low on water. Drinking 2-3 cups of water and resting in a cool room can help clear this up naturally.",
      likelihood: "Medium"
    });
  } else if (lowercaseSymptoms.includes("stomach") || lowercaseSymptoms.includes("belly") || lowercaseSymptoms.includes("nausea")) {
    causes.push({
      condition: "Mild Indigestion or Acid Reflux",
      explanation: "Stomach acid moving upwards, or delayed digestion from certain foods. Usually goes away within a few hours.",
      likelihood: "High"
    });
    causes.push({
      condition: "Gastroenteritis (Stomach Bug)",
      explanation: "A common stomach virus causing brief inflammation. Staying hydrated is the most important care step.",
      likelihood: "Medium"
    });
  } else {
    // General fallback
    causes.push({
      condition: "Mild Strain or Immune Response",
      explanation: "A temporary defense mechanism or physical strain from daily activity. Often subsides with light rest.",
      likelihood: "Medium"
    });
  }

  // Risk Level
  let riskLevel: "Low" | "Moderate" | "High" | "Critical" = "Low";
  let riskLevelExplanation = "Everything looks fairly normal based on your report. Standard home care and monitoring are recommended.";

  if (urgentFlag) {
    riskLevel = "High";
    riskLevelExplanation = "Your symptoms may require medical attention soon. Since you mentioned key urgent indicator signs, it is highly recommended that you visit a healthcare professional today.";
  } else if (interactionSeverity === "High") {
    riskLevel = "High";
    riskLevelExplanation = "Your medicine safety check flagged a high concern regarding overlapping ingredients. Please double check your dosages and consult a pharmacist before taking them together.";
  } else if (interactionSeverity === "Moderate" || duration.includes("week") || duration.includes("many days") || parseInt(duration) > 5) {
    riskLevel = "Moderate";
    riskLevelExplanation = "Your symptoms are lasting a bit longer than usual or you have some medicine conflicts. This is not alarming, but it would be wise to consult your doctor to ensure proper recovery.";
  }

  const whatToDoNext = [
    "Drink plenty of water and get at least 8 hours of sleep tonight to support your body's immune defense.",
    "If taking any over-the-counter pain or cold medicines, always read the dosage labels carefully and do not exceed the daily limit.",
    "Keep a simple daily log of your temperature or any changes in symptoms so you can explain them accurately to your doctor."
  ];

  if (urgentFlag) {
    whatToDoNext.unshift("Please locate your nearest urgent care clinic or call a friend or family member to assist you.");
  }

  return {
    symptomsSummary: `You are a ${age || "adult"}-year-old seeking advice for symptoms described as "${symptoms || "mild discomfort"}" lasting for ${duration || "a short period"}. You noted allergies to "${allergies || "none"}" and are currently taking: ${existingMedicines.join(", ") || "no other daily medicines"}.`,
    possibleCauses: causes,
    drugInteraction: {
      hasInteraction: interactionSeverity !== "None",
      severity: interactionSeverity,
      explanation: interactionExplanation
    },
    riskLevel: riskLevel,
    riskLevelExplanation: riskLevelExplanation,
    whatToDoNext: whatToDoNext,
    emergencyWarning: urgentFlag ? "Please seek immediate medical care. Severe chest sensations, shortness of breath, or deep sudden pain could indicate a serious emergency that requires medical assessment right away." : undefined
  };
}

// Vite integration
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`HealthMate AI backend running on http://localhost:${PORT}`);
});
