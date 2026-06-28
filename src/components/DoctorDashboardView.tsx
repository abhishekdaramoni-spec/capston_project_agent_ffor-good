import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Bell,
  User,
  Clock,
  Heart,
  Activity,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Layers,
  Stethoscope,
  Shield,
  Download,
  Send,
  Calendar,
  ArrowRight,
  ChevronRight,
  Database,
  Settings,
  TrendingUp,
  X,
  FileCheck,
  Maximize2,
  Plus,
  Phone,
  FileText,
  Filter,
  Check,
  Brain,
  Sparkles,
  Eye,
  RefreshCw,
  MapPin,
  Ambulance,
  Info
} from "lucide-react";
import { RiskLevel } from "../types";

// Define the Patient interface to perfectly match original logic
export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  visitTime: string;
  appointmentDate: string;
  mobile: string;
  disease: string;
  riskLevel: RiskLevel;
  status: "Completed" | "Consultation Active" | "Awaiting Review" | "Pending AI Scan";
  bloodGroup: string;
  weight: string;
  height: string;
  allergies: string;
  medicalHistory: string;
  chronicDiseases: string;
  currentMedications: string;
  emergencyContact: string;
  symptoms: string;
  possibleConditions: {
    condition: string;
    likelihood: "High" | "Medium" | "Low";
    description: string;
  }[];
  drugInteraction: {
    hasInteraction: boolean;
    severity: "None" | "Mild" | "Moderate" | "Serious" | "Critical";
    explanation: string;
  };
  scannedMedicine?: {
    image: string;
    name: string;
    genericName: string;
    dosage: string;
    manufacturer: string;
    expiry: string;
    warnings: string[];
    sideEffects: string[];
  };
  riskAssessment: string;
  aiConfidence: number;
  emergencyFlags: string;
  workflow: {
    [agent: string]: {
      status: "idle" | "running" | "success" | "failed";
      confidence: number;
      timeSpent: number;
    };
  };
  timeline: {
    time: string;
    event: string;
    done: boolean;
  }[];
  notes: string;
  diagnosis: string;
  requestLabTests: string[];
  followUpDate: string;
}

interface DoctorDashboardViewProps {
  theme: "light" | "dark" | "contrast";
  fontSize: "normal" | "large";
  userName?: string;
  onLogout: () => void;
}

export function DoctorDashboardView({
  theme,
  fontSize,
  userName,
  onLogout
}: DoctorDashboardViewProps) {
  // Current Active Sidebar Page
  const [activePage, setActivePage] = useState<
    "dashboard" | "patients" | "reports" | "emergency" | "settings"
  >("dashboard");

  // Roster database of 6 static mock patients with deep clinically relevant features
  const [patients, setPatients] = useState<Patient[]>([
    {
      id: "PT-8291",
      name: "Eleanor Vance",
      age: 68,
      gender: "Female",
      visitTime: "08:15 AM",
      appointmentDate: "2026-06-28",
      mobile: "+1-555-0144",
      disease: "Adverse Drug Reaction",
      riskLevel: "Critical",
      status: "Consultation Active",
      bloodGroup: "A+",
      weight: "62 kg",
      height: "158 cm",
      allergies: "Penicillin, Sulfa drugs",
      medicalHistory: "Type 2 Diabetes (HbA1c 7.4), Chronic Kidney Disease (Stage 3a, eGFR 48), Congestive Heart Failure (EF 45%)",
      chronicDiseases: "Congestive Heart Failure, CKD, Diabetes",
      currentMedications: "Metformin 500mg BID, Lisinopril 10mg daily, Spironolactone 25mg daily, Furosemide 40mg as needed",
      emergencyContact: "John Vance (Son) - +1-555-0145",
      symptoms: "Reports sudden deep wheezing, moderate ankle swelling, persistent dry metallic cough, and extreme dizzy spells after taking new over-the-counter medicine.",
      possibleConditions: [
        { condition: "Lisinopril-Induced Cough & Spironolactone Hyperkalemia", likelihood: "High", description: "Cough is a classic bradykinin-mediated side effect. Spironolactone with CKD increases severe hyperkalemia risks." },
        { condition: "Congestive Heart Failure Acute Decompensation", likelihood: "High", description: "Indicated by bilateral ankle edema, pulmonary congestion/wheezing. OTC NSAIDs trigger acute fluid retention." },
        { condition: "Metformin-Associated Lactic Acidosis (MALA)", likelihood: "Low", description: "Low risk but serious; exacerbated by acute renal perfusion drop." }
      ],
      drugInteraction: {
        hasInteraction: true,
        severity: "Critical",
        explanation: "Lisinopril + Spironolactone + OTC Advil (Ibuprofen) creates a 'Triple Whammy' effect. This combination cuts glomerular perfusion, triggering acute kidney failure (AKI) and dangerous potassium spikes (hyperkalemia)."
      },
      scannedMedicine: {
        image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=60",
        name: "Advil Liquid Gels",
        genericName: "Ibuprofen 200mg Solubilized Capsules",
        dosage: "Take 1-2 capsules every 4-6 hours as needed for joint aches",
        manufacturer: "Pfizer Consumer Health",
        expiry: "2027-12",
        warnings: [
          "Do not use if you have kidney disease or heart failure unless directed.",
          "NSAID: increases risk of serious gastrointestinal bleeding and acute renal vasoconstriction."
        ],
        sideEffects: ["Elevated Blood Pressure", "Fluid Retention", "Glomerular Filtration Drop", "Peptic Ulceration"]
      },
      riskAssessment: "Critical danger of hyperkalemic cardiac arrest. Immediate suspension of Lisinopril, Spironolactone, and Ibuprofen required. Stat chemistry panel requested.",
      aiConfidence: 97,
      emergencyFlags: "Fluid retention (edema), Triple Whammy AKI risk, eGFR below 45, hyperkalemia risk.",
      workflow: {
        planner: { status: "success", confidence: 99, timeSpent: 50 },
        ocr: { status: "success", confidence: 98, timeSpent: 120 },
        medicine: { status: "success", confidence: 95, timeSpent: 80 },
        symptom: { status: "success", confidence: 96, timeSpent: 110 },
        drugInteraction: { status: "success", confidence: 99, timeSpent: 70 },
        riskPrediction: { status: "success", confidence: 91, timeSpent: 65 },
        emergencyDetection: { status: "success", confidence: 99, timeSpent: 45 },
        reflection: { status: "success", confidence: 96, timeSpent: 110 },
        report: { status: "success", confidence: 97, timeSpent: 130 }
      },
      timeline: [
        { time: "10:30 AM", event: "Patient checked-in for prenatal drug clearance.", done: true },
        { time: "10:35 AM", event: "Sudafed container scanned by patient in clinic lobby.", done: true },
        { time: "10:40 AM", event: "Pregnancy alert flag raised in doctor's portal.", done: true },
        { time: "10:45 AM", event: "Assigned for clinical consultation on safe alternatives.", done: true }
      ],
      notes: "Discussed teratogenic risk profiles. Advised to cease Sudafed completely. Replaced with safe saline nasal sprays, warm steam inhalations, and occasional Tylenol (Paracetamol) if severe head tension occurs.",
      diagnosis: "Hormonal Gestational Congestion seeking safe relief.",
      requestLabTests: [],
      followUpDate: "2026-07-15"
    },
    {
      id: "PT-2041",
      name: "David Kim",
      age: 55,
      gender: "Male",
      visitTime: "11:15 AM",
      appointmentDate: "2026-06-28",
      mobile: "+1-555-0211",
      disease: "Geriatric Refill Audit",
      riskLevel: "Low",
      status: "Completed",
      bloodGroup: "O+",
      weight: "74 kg",
      height: "172 cm",
      allergies: "Mold spores, dust mites",
      medicalHistory: "Hyperlipidemia controlled by statins, routine checks clear",
      chronicDiseases: "Hyperlipidemia",
      currentMedications: "Lipitor 20mg once daily at bedtime",
      emergencyContact: "Ji-Young Kim (Spouse) - +1-555-0212",
      symptoms: "Reports mild fatigue, but denies any muscular pain (myalgia), tenderness, or dark brown urine. Requested simple statin refill audit.",
      possibleConditions: [
        { condition: "Normal fatigue secondary to altered sleep cycle", likelihood: "High", description: "Transient fatigue without evidence of statin-induced muscle degradation." },
        { condition: "Statin-Induced Myopathy", likelihood: "Low", description: "Lacks classical presentation of muscle aches or weakness." }
      ],
      drugInteraction: {
        hasInteraction: false,
        severity: "None",
        explanation: "Lipitor shows zero interactive substances in patient's current active record. Refill is cleared for approval."
      },
      scannedMedicine: {
        image: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400&auto=format&fit=crop&q=60",
        name: "Lipitor (Atorvastatin)",
        genericName: "Atorvastatin Calcium 20mg Tablets",
        dosage: "Take 1 tablet daily at night",
        manufacturer: "Pfizer Industries",
        expiry: "2028-01",
        warnings: [
          "Avoid grapefruit juice completely (increases serum levels).",
          "Report any unexpected muscle aches, tenderness, or weakness immediately.",
          "Check liver function tests periodically."
        ],
        sideEffects: [
          "Mild headache",
          "Reversible transaminase elevations",
          "Myalgia",
          "Gastrointestinal flatulence"
        ]
      },
      riskAssessment: "Low clinical risk profile. Normal lipid panel follow-up. Statin refill authorized.",
      aiConfidence: 98,
      emergencyFlags: "None. Patient is highly stable and asymptomatic.",
      workflow: {
        planner: { status: "success", confidence: 99, timeSpent: 30 },
        ocr: { status: "success", confidence: 99, timeSpent: 90 },
        medicine: { status: "success", confidence: 98, timeSpent: 60 },
        symptom: { status: "success", confidence: 97, timeSpent: 100 },
        drugInteraction: { status: "success", confidence: 99, timeSpent: 50 },
        riskPrediction: { status: "success", confidence: 98, timeSpent: 50 },
        emergencyDetection: { status: "success", confidence: 99, timeSpent: 35 },
        reflection: { status: "success", confidence: 98, timeSpent: 80 },
        report: { status: "success", confidence: 99, timeSpent: 110 }
      },
      timeline: [
        { time: "11:00 AM", event: "Clinic check-in for routine lipid review.", done: true },
        { time: "11:05 AM", event: "Lipitor container scanned for verification.", done: true },
        { time: "11:10 AM", event: "AI safety verification reports no conflicts.", done: true },
        { time: "11:15 AM", event: "Doctor authorized 90-day statin refill.", done: true }
      ],
      notes: "Patient is highly compliant. Muscle enzymes (CPK) are completely normal. Authorized 90-day refill. Encouraged continuing Mediterranean low-fat diet.",
      diagnosis: "Controlled hyperlipidemia, stable on atorvastatin.",
      requestLabTests: ["Lipid Panel"],
      followUpDate: "2026-12-28"
    },
    {
      id: "PT-3091",
      name: "Robert Chen",
      age: 73,
      gender: "Male",
      visitTime: "Yesterday",
      appointmentDate: "2026-06-27",
      mobile: "+1-555-0322",
      disease: "Digoxin Toxicity Crisis",
      riskLevel: "Critical",
      status: "Completed",
      bloodGroup: "AB-",
      weight: "70 kg",
      height: "175 cm",
      allergies: "Contrast iodine dye",
      medicalHistory: "Chronic Atrial Fibrillation, Left Ventricular Heart Failure",
      chronicDiseases: "Heart Failure, A-Fib",
      currentMedications: "Digoxin 0.125mg daily, Furosemide (Lasix) 40mg daily",
      emergencyContact: "Susan Chen (Wife) - +1-555-0323",
      symptoms: "Reports severe nausea, vomiting, dizziness, and strange visual disturbances described as 'yellow-green halos' around light sources.",
      possibleConditions: [
        { condition: "Acute Digoxin Toxicity", likelihood: "High", description: "Elevated serum digoxin secondary to loop diuretic-induced hypokalemia, causing abnormal automaticity of myocardial cells." },
        { condition: "Gastroenteritis", likelihood: "Low", description: "Unrelated stomach bug, highly unlikely given visual aura." }
      ],
      drugInteraction: {
        hasInteraction: true,
        severity: "Critical",
        explanation: "Furosemide depletes potassium (hypokalemia), which increases digoxin's binding affinity to Na+/K+ ATPase pumps, exponentially raising the risk of fatal cardiac arrhythmias."
      },
      scannedMedicine: {
        image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=60",
        name: "Furosemide (Lasix)",
        genericName: "Furosemide USP 40mg",
        dosage: "Take 1 tablet every morning",
        manufacturer: "Sandoz Generic Division",
        expiry: "2027-10",
        warnings: [
          "Loop diuretic: triggers severe depletion of potassium and magnesium.",
          "Must perform regular serum potassium measurements.",
          "High interaction risk with cardiac glycosides."
        ],
        sideEffects: [
          "Hypokalemia",
          "Orthostatic hypotension",
          "Dehydration / dry mucous membranes",
          "Photosensitivity"
        ]
      },
      riskAssessment: "Critical risk of ventricular tachycardia. Serum Digoxin levels and serum potassium require urgent stat labs.",
      aiConfidence: 99,
      emergencyFlags: "Halos around lights, high digoxin toxicity risk, persistent vomiting.",
      workflow: {
        planner: { status: "success", confidence: 99, timeSpent: 40 },
        ocr: { status: "success", confidence: 98, timeSpent: 100 },
        medicine: { status: "success", confidence: 99, timeSpent: 80 },
        symptom: { status: "success", confidence: 98, timeSpent: 120 },
        drugInteraction: { status: "success", confidence: 99, timeSpent: 90 },
        riskPrediction: { status: "success", confidence: 99, timeSpent: 80 },
        emergencyDetection: { status: "success", confidence: 99, timeSpent: 45 },
        reflection: { status: "success", confidence: 97, timeSpent: 100 },
        report: { status: "success", confidence: 99, timeSpent: 130 }
      },
      timeline: [
        { time: "Yesterday 08:00 AM", event: "Checked-in with toxic signs.", done: true },
        { time: "Yesterday 08:15 AM", event: "Emergency labs ordered.", done: true },
        { time: "Yesterday 08:30 AM", event: "Digoxin toxicity confirmed by AI and lab levels.", done: true },
        { time: "Yesterday 08:45 AM", event: "Transferred to coronary intensive care (CCU).", done: true }
      ],
      notes: "Digibind (digoxin immune Fab) was prepared. Serum potassium was low at 3.1 mEq/L. Corrected immediately via careful intravenous potassium replacement. Rhythm stabilized.",
      diagnosis: "Digoxin toxicity precipitated by Furosemide-induced hypokalemia.",
      requestLabTests: ["Basic Metabolic Panel", "Arterial Blood Gas"],
      followUpDate: "2026-07-05"
    },
    {
      id: "PT-4210",
      name: "Julia Roberts",
      age: 34,
      gender: "Female",
      visitTime: "This Week",
      appointmentDate: "2026-06-25",
      mobile: "+1-555-0899",
      disease: "Allergy Season Audit",
      riskLevel: "Low",
      status: "Completed",
      bloodGroup: "A-",
      weight: "58 kg",
      height: "163 cm",
      allergies: "Pollen, Shellfish",
      medicalHistory: "Allergic asthma, mild chronic eczema",
      chronicDiseases: "Allergic Asthma",
      currentMedications: "Claritin once daily as needed",
      emergencyContact: "Eric Roberts (Spouse) - +1-555-0898",
      symptoms: "Mild sneezing, itchy eyes, runny nose. Seeking confirmation on antihistamine safety.",
      possibleConditions: [
        { condition: "Seasonal Allergic Rhinitis", likelihood: "High", description: "Exposure to elevated airborne pollen counts." }
      ],
      drugInteraction: {
        hasInteraction: false,
        severity: "None",
        explanation: "No active adverse prescription chemical interactions found. Safe to continue."
      },
      scannedMedicine: {
        image: "https://images.unsplash.com/photo-1607619056574-7b8d304f3b24?w=400&auto=format&fit=crop&q=60",
        name: "Claritin Tablets",
        genericName: "Loratadine USP 10mg",
        dosage: "Take 1 tablet daily",
        manufacturer: "Bayer Healthcare LLC",
        expiry: "2028-06",
        warnings: [
          "Safe at recommended daily dose.",
          "Do not combine with other oral antihistamines.",
          "Consult physician if symptoms persist over 14 days."
        ],
        sideEffects: [
          "Dry mouth",
          "Mild drowsiness (rare)",
          "Headache"
        ]
      },
      riskAssessment: "Low risk. Stable allergy control with Loratadine.",
      aiConfidence: 99,
      emergencyFlags: "None. Vitals stable.",
      workflow: {
        planner: { status: "success", confidence: 99, timeSpent: 25 },
        ocr: { status: "success", confidence: 99, timeSpent: 80 },
        medicine: { status: "success", confidence: 99, timeSpent: 55 },
        symptom: { status: "success", confidence: 99, timeSpent: 90 },
        drugInteraction: { status: "success", confidence: 99, timeSpent: 40 },
        riskPrediction: { status: "success", confidence: 99, timeSpent: 40 },
        emergencyDetection: { status: "success", confidence: 99, timeSpent: 30 },
        reflection: { status: "success", confidence: 99, timeSpent: 70 },
        report: { status: "success", confidence: 99, timeSpent: 90 }
      },
      timeline: [
        { time: "June 25", event: "Allergy clinic triage check.", done: true },
        { time: "June 25", event: "Claritin scanned successfully.", done: true },
        { time: "June 25", event: "AI verified low-risk, no-interaction status.", done: true },
        { time: "June 25", event: "Consultation finalized and closed.", done: true }
      ],
      notes: "Symptoms fully managed. Loratadine clearance confirmed. Recommended allergen avoidance strategies.",
      diagnosis: "Mild seasonal allergic rhinitis.",
      requestLabTests: [],
      followUpDate: "2026-10-15"
    }
  ]);

  // Selected Patient State
  const [selectedPatientId, setSelectedPatientId] = useState<string>("PT-8291");

  // Filter and Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("all");

  // UI States
  const [isWorkflowExpanded, setIsWorkflowExpanded] = useState(false);
  const [isFullAnalysisModalOpen, setIsFullAnalysisModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Notification States
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsList, setNotificationsList] = useState([
    { id: 1, title: "Critical Alert: Eleanor Vance", desc: "Triple Whammy AKI risk detected in scanned NSAID Advil.", time: "10 mins ago", unread: true },
    { id: 2, title: "System Ready", desc: "EHR database integration fully synced with hospital mainframe.", time: "1 hour ago", unread: false },
    { id: 3, title: "Refill Cleared: David Kim", desc: "90-day statin refill approved with 98% AI confidence.", time: "3 hours ago", unread: false }
  ]);

  // Active Selected Patient object lookup
  const selectedPatient = useMemo(() => {
    return patients.find(p => p.id === selectedPatientId) || patients[0];
  }, [patients, selectedPatientId]);

  // Consultation editable fields mapped to active state
  const [activeNotes, setActiveNotes] = useState(selectedPatient.notes || "");
  const [activeDiagnosis, setActiveDiagnosis] = useState(selectedPatient.diagnosis || "");
  const [activeTests, setActiveTests] = useState<string[]>(selectedPatient.requestLabTests || []);
  const [activeFollowUp, setActiveFollowUp] = useState(selectedPatient.followUpDate || "");

  // Update form fields when selected patient changes
  useEffect(() => {
    setActiveNotes(selectedPatient.notes || "");
    setActiveDiagnosis(selectedPatient.diagnosis || "");
    setActiveTests(selectedPatient.requestLabTests || []);
    setActiveFollowUp(selectedPatient.followUpDate || "");
  }, [selectedPatientId, selectedPatient]);

  // Handle saving clinical consultation notes inside state
  const handleSaveConsultation = () => {
    setPatients(prev => prev.map(p => {
      if (p.id === selectedPatient.id) {
        return {
          ...p,
          notes: activeNotes,
          diagnosis: activeDiagnosis,
          requestLabTests: activeTests,
          followUpDate: activeFollowUp,
          status: "Completed" // Auto complete consultation on save
        };
      }
      return p;
    }));
    alert(`Clinical records committed to hospital EHR system for patient ${selectedPatient.name}.`);
  };

  // Toggle lab test selections
  const handleToggleLabTest = (test: string) => {
    if (activeTests.includes(test)) {
      setActiveTests(prev => prev.filter(t => t !== test));
    } else {
      setActiveTests(prev => [...prev, test]);
    }
  };

  // Simulated emergency dispatch warning state
  const [dispatchConfirmId, setDispatchConfirmId] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState<string | null>(null);
  const [dispatchLogs, setDispatchLogs] = useState<{ time: string; msg: string }[]>([
    { time: "08:30 AM", msg: "Hospital trauma bay alerted on Eleanor Vance acute fluid overload state." }
  ]);

  // Handles transmitting emergency alert
  const handleConfirmEmergencyAlert = (p: Patient) => {
    setIsDispatching(p.id);
    setTimeout(() => {
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setDispatchLogs(prev => [
        { time: timestamp, msg: `CRITICAL DISPATCH RELAYED: Ambulance and ICU bed synchronized for ${p.name}. Symptoms: "${p.symptoms.substring(0, 35)}..."` },
        ...prev
      ]);
      setIsDispatching(null);
      setDispatchConfirmId(null);
      alert(`Emergency Dispatch Sent! Hospital ICU desk has acknowledged secure telemetry payload for ${p.name}.`);
    }, 1200);
  };

  // Search and filter logical processing
  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = query === "" || 
        p.name.toLowerCase().includes(query) ||
        p.id.toLowerCase().includes(query) ||
        p.mobile.includes(query) ||
        p.disease.toLowerCase().includes(query) ||
        p.appointmentDate.includes(query);

      const matchesRisk = riskFilter === "all" || p.riskLevel.toLowerCase() === riskFilter.toLowerCase();

      let matchesTime = true;
      if (timeFilter === "today") {
        matchesTime = p.appointmentDate === "2026-06-28";
      } else if (timeFilter === "week") {
        matchesTime = ["2026-06-28", "2026-06-27", "2026-06-25"].includes(p.appointmentDate);
      }

      return matchesSearch && matchesRisk && matchesTime;
    });
  }, [patients, searchQuery, riskFilter, timeFilter]);

  // Roster metrics calculations
  const metrics = useMemo(() => {
    const total = patients.length;
    const critical = patients.filter(p => p.riskLevel === "Critical").length;
    const completed = patients.filter(p => p.status === "Completed").length;
    const pendingReviews = patients.filter(p => p.status === "Awaiting Review" || p.status === "Consultation Active").length;
    return { total, critical, completed, pendingReviews };
  }, [patients]);

  // Helper colors mapping for risk levels
  const getRiskStyles = (level: RiskLevel) => {
    switch (level) {
      case "Low":
        return {
          badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
          dot: "bg-emerald-500",
          text: "text-emerald-600 dark:text-emerald-400 font-medium",
          border: "border-emerald-500/10",
          bg: "bg-emerald-50/50 dark:bg-emerald-950/20"
        };
      case "Moderate":
        return {
          badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
          dot: "bg-amber-500",
          text: "text-amber-600 dark:text-amber-400 font-medium",
          border: "border-amber-500/10",
          bg: "bg-amber-50/50 dark:bg-amber-950/20"
        };
      case "High":
        return {
          badge: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
          dot: "bg-orange-500",
          text: "text-orange-600 dark:text-orange-400 font-medium",
          border: "border-orange-500/10",
          bg: "bg-orange-50/50 dark:bg-orange-950/20"
        };
      case "Critical":
        default:
        return {
          badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
          dot: "bg-rose-500 animate-pulse",
          text: "text-rose-600 dark:text-rose-400 font-semibold",
          border: "border-rose-500/10",
          bg: "bg-rose-50/50 dark:bg-rose-950/20"
        };
    }
  };

  const handleDownloadPatientReport = (p: Patient) => {
    const dataString = `=====================================================
HEALTHMATE AI - SECURE MEDICAL EHR REPORT DOWNLOAD
=====================================================
Date Generated : 2026-06-28
Facility       : HealthMate AI Hospital Core Nodes
Attending MD   : Dr. Sarah Chen / Staff Consulting Group

PATIENT REGISTER DETAILS
-------------------------------------------
Patient ID     : ${p.id}
Full Legal Name: ${p.name}
Age / Gender   : ${p.age} y/o / ${p.gender}
Blood Group    : ${p.bloodGroup}
Weight / Height: ${p.weight} / ${p.height}
System Allergies: ${p.allergies}
Chronic Diseases: ${p.chronicDiseases}
Active History : ${p.medicalHistory}
Current Meds   : ${p.currentMedications}
Emergency Cont.: ${p.emergencyContact}

AI MULTI-AGENT TRIAGE LOGS
-------------------------------------------
Assessed Risk  : ${p.riskLevel} (Confidence ${p.aiConfidence}%)
Symptom Input  : "${p.symptoms}"
Emergency Flags: ${p.emergencyFlags || "None detected"}
Adverse Combo  : ${p.drugInteraction.hasInteraction ? "YES - ADVERSE REACTION FLAG" : "NO KNOWN INTERACTION"}
Details        : ${p.drugInteraction.explanation}

SCANNER METRICS (OCR VERIFICATION)
-------------------------------------------
Bottle Logged  : ${p.scannedMedicine ? p.scannedMedicine.name : "None scanned"}
Generic Drug   : ${p.scannedMedicine ? p.scannedMedicine.genericName : "N/A"}
Manufacturer   : ${p.scannedMedicine ? p.scannedMedicine.manufacturer : "N/A"}
Warnings       : ${p.scannedMedicine ? p.scannedMedicine.warnings.join(", ") : "None"}

DOCTOR CLINICAL REVIEWS
-------------------------------------------
Diagnosis Given: ${p.diagnosis || activeDiagnosis || "Pending Entry"}
Clinical Notes : ${p.notes || activeNotes || "Pending Entry"}
Tests Requested: ${p.requestLabTests ? p.requestLabTests.join(", ") : "None"}
Follow Up Date : ${p.followUpDate || "Not Scheduled"}

Report Handshake Signature: AES-256 System Integrity Checked.
=====================================================`;

    const blob = new Blob([dataString], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `EHR-Report-${p.id}-${p.name.replace(/\s+/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Color mapping based on general applet themes
  const appBg = theme === "light" ? "bg-slate-50 text-slate-900" : theme === "contrast" ? "bg-black text-white border-white" : "bg-[#0B0F19] text-slate-100";
  const cardBg = theme === "light" ? "bg-white border-slate-100 text-slate-800 shadow-sm" : theme === "contrast" ? "bg-black border border-white text-white" : "bg-[#141A29]/95 border-white/5 text-slate-200";
  const textHeading = theme === "light" ? "text-slate-900 font-semibold" : "text-white font-medium";
  const borderCol = theme === "light" ? "border-slate-100" : theme === "contrast" ? "border-white" : "border-white/5";

  return (
    <div className={`w-full min-h-screen ${appBg} flex flex-col antialiased transition-colors duration-200 ${fontSize === 'large' ? 'text-base' : 'text-xs'}`}>
      
      {/* GLOBAL HEADER */}
      <header className={`h-16 shrink-0 border-b ${borderCol} ${theme === "light" ? "bg-white" : theme === "contrast" ? "bg-black" : "bg-[#0E1422]"} flex items-center justify-between px-6 z-30 sticky top-0`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
              HealthMate AI <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-mono tracking-wide">EHR PORTAL</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">Secured Clinical Mainframe</p>
          </div>
        </div>

        {/* Global Patient Search Input */}
        <div className="hidden md:flex items-center w-80 relative">
          <Search className="w-3.5 h-3.5 absolute left-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search roster database, symptoms, ID..."
            className={`w-full h-9 pl-9 pr-3 rounded-lg border text-xs outline-none transition-all ${
              theme === "light"
                ? "bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-blue-500"
                : "bg-white/5 border-white/10 text-slate-200 focus:bg-white/10 focus:border-blue-500/50"
            }`}
          />
        </div>

        {/* Header Right Utilities */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex flex-col items-end text-right">
            <span className="text-[10px] text-slate-400 font-medium">Sunday, June 28, 2026</span>
            <span className="text-xs font-semibold text-white">Dr. Sarah Chen</span>
          </div>

          {/* Notifications Dropdown Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2 rounded-lg transition-colors hover:bg-white/5 relative cursor-pointer ${theme === "light" ? "hover:bg-slate-100" : ""}`}
            >
              <Bell className="w-4 h-4 text-slate-300" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            </button>
            {showNotifications && (
              <div className={`absolute right-0 mt-2 w-80 rounded-xl border p-4 shadow-xl z-50 ${cardBg} ${theme === "light" ? "bg-white" : "bg-[#161D30]"}`}>
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/10">
                  <h4 className="font-semibold text-xs text-white">Clinical Notifications</h4>
                  <button onClick={() => setShowNotifications(false)} className="text-[10px] text-blue-400 hover:underline">Mark as read</button>
                </div>
                <div className="space-y-3">
                  {notificationsList.map(notif => (
                    <div key={notif.id} className="text-xs space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold ${notif.unread ? 'text-blue-400' : 'text-slate-200'}`}>{notif.title}</span>
                        <span className="text-[9px] text-slate-500">{notif.time}</span>
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">{notif.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-bold text-xs text-blue-400">
            SC
          </div>

          <button
            onClick={onLogout}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 transition-all cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* THREE SECTION WORKSPACE */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* SIDEBAR NAVIGATION PANEL */}
        <aside className={`w-full md:w-60 shrink-0 border-r ${borderCol} ${theme === "light" ? "bg-white" : "bg-[#0E1320]"} flex flex-col justify-between p-4 z-20`}>
          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider px-3">Clinical Care Modules</span>
              <nav className="space-y-1">
                {[
                  { id: "dashboard", label: "Dashboard", icon: Activity },
                  { id: "patients", label: "Patient Roster", icon: User },
                  { id: "reports", label: "AI Reports Hub", icon: FileText },
                  { id: "emergency", label: "Emergency Alerts", icon: Ambulance },
                  { id: "settings", label: "Settings", icon: Settings }
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActivePage(item.id as any);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                        isActive
                          ? theme === "light"
                            ? "bg-blue-50 text-blue-600 font-semibold"
                            : "bg-blue-600/10 text-blue-400 border-l-2 border-blue-500"
                          : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? "text-blue-500" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                      {item.id === "emergency" && metrics.critical > 0 && (
                        <span className="ml-auto px-1.5 py-0.5 text-[9px] bg-rose-500 text-white rounded-full font-bold animate-pulse">
                          {metrics.critical}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Quick Metrics Widget in Sidebar */}
            <div className={`p-4 rounded-2xl border ${borderCol} ${theme === "light" ? "bg-slate-50" : "bg-white/5"} space-y-2.5`}>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Today's Roster Status</span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-xl bg-white/5 text-center">
                  <span className="text-[9px] text-slate-500 block">Critical</span>
                  <span className="font-bold text-rose-400">{metrics.critical}</span>
                </div>
                <div className="p-2 rounded-xl bg-white/5 text-center">
                  <span className="text-[9px] text-slate-500 block">Pending</span>
                  <span className="font-bold text-amber-400">{metrics.pendingReviews}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Secure Environment Disclaimer */}
          <div className="pt-4 border-t border-white/5 text-[9px] text-slate-500 space-y-1">
            <p className="font-semibold text-slate-400">EHR System HIPAA V2</p>
            <p>End-to-end telemetry encryption active. All diagnostic steps audited.</p>
          </div>
        </aside>

        {/* MAIN WORKSPACE SECTION */}
        <main className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6">
          
          {/* SEARCH BAR (MOBILE ONLY) */}
          <div className="md:hidden flex items-center w-full relative mb-2">
            <Search className="w-3.5 h-3.5 absolute left-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patients, symptoms, IDs..."
              className="w-full h-10 pl-9 pr-3 rounded-lg bg-white/5 border border-white/10 text-slate-200 text-xs outline-none"
            />
          </div>

          {/* PAGE CONTENT RENDERING */}

          {/* SUB-PAGE: DASHBOARD (MAIN REDESIGN CORE) */}
          {activePage === "dashboard" && (
            <div className="space-y-6">
              
              {/* Top Summary Banner */}
              <div className={`p-6 rounded-2xl border ${borderCol} ${cardBg} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}>
                <div className="space-y-1">
                  <span className="text-[10px] tracking-wider uppercase font-bold text-blue-400">Secure Consultation Portal</span>
                  <h2 className="text-xl font-bold tracking-tight text-white">Active Clinical Workspace</h2>
                  <p className="text-slate-400 text-xs">Analyze real-time symptom data, scan medicine bottles, and commit direct diagnosis to patient records.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownloadPatientReport(selectedPatient)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 text-blue-400 cursor-pointer transition-all"
                  >
                    <Download className="w-3.5 h-3.5" /> Export EHR (.TXT)
                  </button>
                </div>
              </div>

              {/* Roster & Detail Splitting */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                
                {/* COMPACT PATIENT LIST COLUMN (3 columns on desktop) */}
                <section className="xl:col-span-4 space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Patient Roster</h3>
                    <span className="text-[10px] text-slate-500 font-medium">{filteredPatients.length} shown</span>
                  </div>

                  {/* Filter Toolbar */}
                  <div className="flex gap-2 mb-2">
                    <select
                      value={riskFilter}
                      onChange={(e) => setRiskFilter(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-slate-300 text-[10px] outline-none"
                    >
                      <option value="all" className="bg-[#141A29]">All Risks</option>
                      <option value="low" className="bg-[#141A29]">Low Risk</option>
                      <option value="moderate" className="bg-[#141A29]">Moderate Risk</option>
                      <option value="high" className="bg-[#141A29]">High Risk</option>
                      <option value="critical" className="bg-[#141A29]">Critical Risk</option>
                    </select>

                    <select
                      value={timeFilter}
                      onChange={(e) => setTimeFilter(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-slate-300 text-[10px] outline-none"
                    >
                      <option value="all" className="bg-[#141A29]">All Visits</option>
                      <option value="today" className="bg-[#141A29]">Today</option>
                      <option value="week" className="bg-[#141A29]">This Week</option>
                    </select>
                  </div>

                  {/* Patients List */}
                  <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                    {filteredPatients.length === 0 ? (
                      <div className="text-center py-12 text-slate-500 border border-dashed border-white/10 rounded-2xl">
                        No patients matching search query.
                      </div>
                    ) : (
                      filteredPatients.map(p => {
                        const isSelected = p.id === selectedPatientId;
                        const risk = getRiskStyles(p.riskLevel);
                        return (
                          <div
                            key={p.id}
                            onClick={() => setSelectedPatientId(p.id)}
                            className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
                              isSelected
                                ? "bg-blue-600/10 border-blue-500/50 shadow-md"
                                : "bg-white/5 border-white/5 hover:bg-white/10"
                            }`}
                          >
                            <div className="flex justify-between items-start mb-1.5">
                              <div>
                                <h4 className="font-bold text-white text-xs">{p.name}</h4>
                                <span className="text-[10px] text-slate-400">{p.age} y/o • {p.gender}</span>
                              </div>
                              <span className={`px-2 py-0.5 text-[9px] font-semibold rounded-full ${risk.badge}`}>
                                {p.riskLevel}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-300 line-clamp-1 mb-2 italic">
                              "{p.disease}"
                            </p>

                            <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {p.visitTime}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[8px] ${
                                p.status === "Completed" ? "bg-emerald-500/10 text-emerald-400" :
                                p.status === "Consultation Active" ? "bg-blue-500/10 text-blue-400 animate-pulse" :
                                "bg-amber-500/10 text-amber-400"
                              }`}>
                                {p.status}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </section>

                {/* CENTRAL PRIMARY PATIENT WORKSPACE (8 columns on desktop) */}
                <section className="xl:col-span-8 space-y-6">
                  
                  {/* Selected Patient Overview Card */}
                  <div className={`p-6 rounded-2xl border ${borderCol} ${cardBg} space-y-4`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-white/10">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-white tracking-tight">{selectedPatient.name}</h3>
                          <span className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full ${getRiskStyles(selectedPatient.riskLevel).badge}`}>
                            {selectedPatient.riskLevel} Risk
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs">
                          Patient ID: <span className="font-mono text-slate-300">{selectedPatient.id}</span> • {selectedPatient.gender} • {selectedPatient.age} years old • Blood Group: <span className="font-semibold text-slate-300">{selectedPatient.bloodGroup}</span>
                        </p>
                      </div>

                      {/* Immediate Emergency dispatch button */}
                      {selectedPatient.riskLevel === "Critical" && (
                        <button
                          onClick={() => setDispatchConfirmId(selectedPatient.id)}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg animate-pulse"
                        >
                          <Ambulance className="w-3.5 h-3.5" /> Dispatch Emergency Alert
                        </button>
                      )}
                    </div>

                    {/* Quick Triage Symptoms Header */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Presenting Symptoms</span>
                        <p className="text-slate-200 leading-normal line-clamp-2 italic">"{selectedPatient.symptoms}"</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Vitals & Body Stats</span>
                        <p className="text-slate-200">Weight: <span className="font-bold">{selectedPatient.weight}</span> • Height: <span className="font-bold">{selectedPatient.height}</span></p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">EHR Medical History</span>
                        <p className="text-slate-200 leading-normal line-clamp-2">{selectedPatient.medicalHistory}</p>
                      </div>
                    </div>
                  </div>

                  {/* AI SUMMARY CARD (PREMIUM PROGRESSIVE DISCLOSURE DESIGN) */}
                  <div className={`p-6 rounded-2xl border ${borderCol} bg-[#111625] text-slate-200 space-y-4`}>
                    <div className="flex items-center justify-between pb-3 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-400" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">AI Medical Insights Summary</h4>
                      </div>
                      <span className="text-[10px] font-semibold text-blue-400 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                        {selectedPatient.aiConfidence}% AI Confidence
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-slate-400 font-semibold block">Primary AI Assessment</span>
                        <p className="text-xs text-slate-200 leading-relaxed font-semibold">
                          {selectedPatient.riskAssessment}
                        </p>
                      </div>

                      {/* Recommended Next Steps */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] text-slate-400 font-semibold block">Recommended Next Steps (Max 5 points)</span>
                        <ul className="space-y-1 text-xs">
                          {selectedPatient.possibleConditions.slice(0, 3).map((pc, i) => (
                            <li key={i} className="flex items-start gap-2 text-slate-300">
                              <span className="text-blue-400 font-bold mt-0.5">•</span>
                              <span>
                                <strong className="text-white">{pc.condition}</strong> (Likelihood: <span className="text-blue-400 font-bold">{pc.likelihood}</span>) — {pc.description}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-2 flex justify-between items-center">
                        <span className="text-[9px] text-slate-500 font-mono">Triage verified by 9-agent Clinical System</span>
                        <button
                          onClick={() => setIsFullAnalysisModalOpen(true)}
                          className="text-xs font-semibold text-blue-400 hover:underline flex items-center gap-1"
                        >
                          View Full Analysis <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* MIDDLE SECTION: SCANNER + INTERACTIONS & DRUG SAFETY */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Compact Drug Interaction Safety Card */}
                    <div className={`p-5 rounded-2xl border ${borderCol} ${cardBg} space-y-4`}>
                      <div className="flex items-center justify-between pb-2 border-b border-white/5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Drug Interaction Check</span>
                        <span className={`px-2 py-0.5 text-[8px] font-bold rounded ${
                          selectedPatient.drugInteraction.hasInteraction ? "bg-rose-500 text-white animate-pulse" : "bg-emerald-500 text-white"
                        }`}>
                          {selectedPatient.drugInteraction.hasInteraction ? "ALERT" : "STABLE"}
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                          {selectedPatient.drugInteraction.hasInteraction ? (
                            <>
                              <AlertTriangle className="w-4 h-4 text-rose-400" />
                              Serious Interaction Detected
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              No Serious Interactions Detected
                            </>
                          )}
                        </p>
                        
                        <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-3">
                          {selectedPatient.drugInteraction.explanation}
                        </p>

                        <button
                          onClick={() => alert(`Active medication records audit: ${selectedPatient.drugInteraction.explanation}`)}
                          className="text-xs text-blue-400 hover:underline font-semibold block pt-1"
                        >
                          View Interaction Breakdown
                        </button>
                      </div>
                    </div>

                    {/* Compact Scanned Medicine Card */}
                    <div className={`p-5 rounded-2xl border ${borderCol} ${cardBg} space-y-4`}>
                      <div className="flex items-center justify-between pb-2 border-b border-white/5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Last Scanned Medicine</span>
                        <span className="text-[8px] px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded border border-amber-500/20 font-bold">OCR VERIFIED</span>
                      </div>

                      {selectedPatient.scannedMedicine ? (
                        <div className="space-y-3">
                          <div className="flex gap-3">
                            <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-white/10">
                              <img
                                src={selectedPatient.scannedMedicine.image}
                                alt="Scanned medicine bottle"
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="space-y-0.5">
                              <h5 className="font-bold text-white text-xs leading-tight">{selectedPatient.scannedMedicine.name}</h5>
                              <p className="text-[10px] text-slate-400 italic font-medium">Gen: {selectedPatient.scannedMedicine.genericName}</p>
                              <p className="text-[9px] text-slate-500 font-mono">Mfg: {selectedPatient.scannedMedicine.manufacturer}</p>
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-1 border-t border-white/5">
                            <span className="text-[9px] text-slate-400">Scan Time: Today 10:35 AM</span>
                          </div>
                        </div>
                      ) : (
                        <div className="py-6 text-center text-slate-500 italic text-xs">
                          No active bottle scan registered for this patient.
                        </div>
                      )}
                    </div>

                  </div>

                  {/* INTERACTIVE EHR CONSULTATION NOTES FORM */}
                  <div className={`p-6 rounded-2xl border ${borderCol} ${cardBg} space-y-4`}>
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="w-4 h-4 text-teal-400" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Commit Consultation Records</h4>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">Hospital Database Handshake</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        {/* Diagnosis */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Clinical Diagnosis</label>
                          <input
                            type="text"
                            value={activeDiagnosis}
                            onChange={(e) => setActiveDiagnosis(e.target.value)}
                            placeholder="Enter ICD-10 Diagnosis"
                            className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-blue-500/50"
                          />
                        </div>

                        {/* Follow Up Date */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Scheduled Follow-up Date</label>
                          <input
                            type="date"
                            value={activeFollowUp}
                            onChange={(e) => setActiveFollowUp(e.target.value)}
                            className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-blue-500/50"
                          />
                        </div>
                      </div>

                      {/* Clinical notes textarea */}
                      <div className="space-y-1.5 flex flex-col justify-between">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Clinical Notes & Treatment Plan</label>
                          <textarea
                            value={activeNotes}
                            onChange={(e) => setActiveNotes(e.target.value)}
                            placeholder="Type patient care directives, medication alterations, dosage directions..."
                            className="w-full h-24 p-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-blue-500/50 resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Labs selection */}
                    <div className="space-y-2 pt-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Order Lab Analytics</span>
                      <div className="flex flex-wrap gap-2">
                        {["Basic Metabolic Panel", "Complete Blood Count", "Lipid Panel", "Arterial Blood Gas", "Renal Function Panels"].map((test) => {
                          const isSelected = activeTests.includes(test);
                          return (
                            <button
                              key={test}
                              onClick={() => handleToggleLabTest(test)}
                              className={`px-3 py-1 rounded-full text-[10px] font-medium transition-all ${
                                isSelected
                                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold"
                                  : "bg-white/5 border border-white/10 text-slate-400 hover:text-white"
                              }`}
                            >
                              {test}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                      <span className="text-[10px] text-slate-500">Record auto-saves locally until EHR commit</span>
                      <button
                        onClick={handleSaveConsultation}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <FileCheck className="w-3.5 h-3.5" /> Commit to EHR Database
                      </button>
                    </div>

                  </div>

                  {/* PROGRESSIVE DISCLOSURE: COLLAPSIBLE AI WORKFLOW PANEL */}
                  <div className={`p-4 rounded-xl border ${borderCol} ${cardBg}`}>
                    <button
                      onClick={() => setIsWorkflowExpanded(!isWorkflowExpanded)}
                      className="w-full flex items-center justify-between font-semibold text-slate-300 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-blue-400" />
                        <span>AI Multi-Agent Execution Status</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-blue-400">
                        <span>✔ AI Workflow Completed Successfully</span>
                        <ChevronRight className={`w-3.5 h-3.5 transform transition-transform ${isWorkflowExpanded ? 'rotate-90' : ''}`} />
                      </div>
                    </button>

                    {isWorkflowExpanded && (
                      <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        {Object.entries(selectedPatient.workflow).map(([agentName, rawData]) => {
                          const data = rawData as { status: string; confidence: number; timeSpent: number };
                          return (
                            <div key={agentName} className="p-2.5 rounded-lg bg-white/5 space-y-1">
                              <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                                {agentName.replace(/([A-Z])/g, ' $1')} Agent
                              </span>
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                  {data.status}
                                </span>
                                <span className="text-slate-500 font-mono">{data.timeSpent}ms</span>
                              </div>
                              <span className="text-[9px] text-slate-500 block">Conf: {data.confidence}%</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* CLINICAL BEAUTIFUL TIMELINE */}
                  <div className={`p-6 rounded-2xl border ${borderCol} ${cardBg} space-y-4`}>
                    <div className="flex items-center justify-between pb-3 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Patient Case Timeline</h4>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Real-time Telemetry logs</span>
                    </div>

                    <div className="space-y-4 pl-2 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-white/10">
                      {selectedPatient.timeline.map((step, i) => (
                        <div key={i} className="flex gap-4 items-start relative z-10">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                            step.done 
                              ? "bg-blue-600/20 border-blue-500 text-blue-400" 
                              : "bg-[#141A29] border-white/10 text-slate-500"
                          }`}>
                            {step.done ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          </div>
                          <div className="space-y-0.5 pt-0.5">
                            <span className="text-[10px] text-slate-400 font-semibold block">{step.time}</span>
                            <p className="text-xs text-slate-200">{step.event}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </section>

              </div>
            </div>
          )}

          {/* SUB-PAGE: PATIENT ROSTER DATABASE */}
          {activePage === "patients" && (
            <div className={`p-6 rounded-2xl border ${borderCol} ${cardBg} space-y-4`}>
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <div>
                  <h3 className="text-base font-bold text-white">Full HIPAA Patient Database</h3>
                  <p className="text-xs text-slate-400">Manage, export clinical summaries, or trigger direct ICU alerts for patients.</p>
                </div>
                <span className="text-xs text-slate-400 font-semibold">{patients.length} Registered patients</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-slate-400">
                      <th className="py-3 px-4 font-bold">Patient ID</th>
                      <th className="py-3 px-4 font-bold">Full Legal Name</th>
                      <th className="py-3 px-4 font-bold">Risk Level</th>
                      <th className="py-3 px-4 font-bold">Symptoms Category</th>
                      <th className="py-3 px-4 font-bold">Last Appointment</th>
                      <th className="py-3 px-4 font-bold text-right">EHR Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {patients.map(p => {
                      const risk = getRiskStyles(p.riskLevel);
                      return (
                        <tr key={p.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-blue-400">{p.id}</td>
                          <td className="py-3 px-4 font-semibold text-white">{p.name} ({p.age} y/o {p.gender})</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 text-[9px] font-semibold rounded-full ${risk.badge}`}>
                              {p.riskLevel}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-300">{p.disease}</td>
                          <td className="py-3 px-4 text-slate-400">{p.appointmentDate} • {p.visitTime}</td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedPatientId(p.id);
                                setActivePage("dashboard");
                              }}
                              className="px-2.5 py-1 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 font-bold text-[10px] rounded-lg border border-blue-500/20 mr-2 transition-all cursor-pointer"
                            >
                              Open Profile
                            </button>
                            <button
                              onClick={() => handleDownloadPatientReport(p)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] rounded-lg border border-white/10 transition-all cursor-pointer"
                            >
                              Download Report
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}



          {/* SUB-PAGE: AI REPORTS HUB */}
          {activePage === "reports" && (
            <div className={`p-6 rounded-2xl border ${borderCol} ${cardBg} space-y-4`}>
              <div className="pb-3 border-b border-white/10">
                <h3 className="text-base font-bold text-white">Secure HIPAA EHR Report Hub</h3>
                <p className="text-xs text-slate-400">Download cryptographically sealed diagnostic reports or sync profiles with hospital servers.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {patients.map(p => (
                  <div key={p.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-400 font-mono">Patient EHR Document</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      </div>
                      <h4 className="font-bold text-white text-xs">{p.name}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2">"Diagnosis: {p.diagnosis || "Awaiting Clinical Notes Commitment..."}"</p>
                    </div>

                    <button
                      onClick={() => handleDownloadPatientReport(p)}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/20 text-blue-400 rounded-lg text-xs font-semibold cursor-pointer transition-all"
                    >
                      <Download className="w-3.5 h-3.5" /> Download EHR (.txt)
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUB-PAGE: EMERGENCY ALERTS */}
          {activePage === "emergency" && (
            <div className={`p-6 rounded-2xl border ${borderCol} ${cardBg} space-y-6`}>
              <div className="pb-3 border-b border-white/10">
                <h3 className="text-base font-bold text-rose-400">Hospital ICU Emergency Dispatch Console</h3>
                <p className="text-xs text-slate-400">Rapid telemetry links, critical ambulance synchronizations, and emergency trauma alert systems.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Active Alerts */}
                <div className="space-y-4">
                  <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5 uppercase tracking-wider block">
                    <AlertTriangle className="w-4 h-4 animate-pulse" /> Urgent Cases Needing Response
                  </span>

                  <div className="space-y-3">
                    {patients.filter(p => p.riskLevel === 'Critical' || p.riskLevel === 'High').map(p => (
                      <div key={p.id} className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-white">{p.name} ({p.id})</span>
                          <span className="text-[9px] px-2 py-0.5 bg-rose-500 text-white rounded font-bold uppercase tracking-wider">
                            {p.riskLevel} CASE
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-normal italic">
                          "{p.symptoms}"
                        </p>

                        <button
                          onClick={() => setDispatchConfirmId(p.id)}
                          className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow"
                        >
                          <Ambulance className="w-4 h-4" /> Trigger Emergency ICU Alert
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dispatch Logs */}
                <div className="space-y-4">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Dispatch Relays Log</span>
                  <div className="p-4 rounded-xl bg-[#0B0F19] border border-white/5 h-[320px] overflow-y-auto space-y-3 font-mono text-[10px]">
                    {dispatchLogs.map((log, i) => (
                      <div key={i} className="space-y-0.5 border-b border-white/5 pb-2">
                        <span className="text-slate-500">{log.time}</span>
                        <p className="text-rose-400 leading-normal">{log.msg}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* SUB-PAGE: SETTINGS */}
          {activePage === "settings" && (
            <div className={`p-6 rounded-2xl border ${borderCol} ${cardBg} space-y-6`}>
              <div className="pb-3 border-b border-white/10">
                <h3 className="text-base font-bold text-white">EHR Portal Security & Configurations</h3>
                <p className="text-xs text-slate-400">Configure interface presets, cryptographic handshake keys, and electronic medical record preferences.</p>
              </div>

              <div className="space-y-4 max-w-xl text-xs">
                <div className="p-4 rounded-xl bg-white/5 space-y-3">
                  <span className="text-xs font-bold text-white block">EHR Metadata Configuration</span>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block text-[10px] uppercase font-bold">Primary Hospital Facility Name</label>
                    <input
                      type="text"
                      disabled
                      value="HealthMate AI Hospital Core Nodes"
                      className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-xs outline-none cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/5 space-y-3">
                  <span className="text-xs font-bold text-white block">Secure Cryptographic Auditing</span>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    This clinical station uses AES-256 secure encryption handshakes to communicate with Cerner and Epic EHR protocols automatically on diagnosis save actions.
                  </p>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                    <span>EHR PROTOCOLS CONFIRMED</span>
                    <span className="text-teal-400 font-bold">ONLINE</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>

        {/* RIGHT UTILITY PANEL (Show only: Critical Alerts, Upcoming Appointments, Recent Notifications) */}
        {activePage === "dashboard" && (
          <aside className={`w-full md:w-72 shrink-0 border-l ${borderCol} ${theme === "light" ? "bg-white" : "bg-[#0E1320]"} p-4 space-y-6 z-10 hidden xl:block`}>
            
            {/* Critical Alerts section */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">Critical Active Flags</span>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
              </div>
              <div className="space-y-2">
                {patients.filter(p => p.riskLevel === 'Critical').slice(0, 3).map(p => (
                  <div key={p.id} className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/10 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white text-[11px]">{p.name}</span>
                      <span className="text-[9px] text-rose-400 font-mono">{p.id}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal line-clamp-2">"{p.symptoms}"</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Appointments section */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Upcoming Consultations</span>
              <div className="space-y-2">
                {patients.slice(0, 3).map(p => (
                  <div key={p.id} className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white">{p.name}</span>
                      <span className="text-[9px] text-slate-400 font-mono">{p.visitTime}</span>
                    </div>
                    <p className="text-[10px] text-slate-500">Status: <span className="text-slate-300 font-medium">{p.status}</span></p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent System Notifications */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mainframe Health Logs</span>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="text-[10px] text-blue-400 hover:underline"
                >
                  View All
                </button>
              </div>
              <div className="space-y-2.5 text-[11px]">
                <div className="p-2.5 rounded-lg bg-white/5 border-l-2 border-emerald-500 space-y-0.5">
                  <span className="text-white font-semibold">EHR Link Safe</span>
                  <p className="text-slate-400 text-[10px]">Secure AES link finalized successfully.</p>
                </div>
                <div className="p-2.5 rounded-lg bg-white/5 border-l-2 border-blue-500 space-y-0.5">
                  <span className="text-white font-semibold">Triage Update</span>
                  <p className="text-slate-400 text-[10px]">9-agent multi-layered pipeline initialized.</p>
                </div>
              </div>
            </div>

          </aside>
        )}

      </div>

      {/* DISPATCH EMERGENCY ALERT CONFIRMATION MODAL */}
      {dispatchConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#111625] border border-white/10 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex gap-3 items-start">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Transmit ICU Trauma Dispatch Warning?</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Are you absolutely sure you want to trigger emergency dispatch protocols for <strong className="text-white">{patients.find(p => p.id === dispatchConfirmId)?.name}</strong>? This immediately alerts the hospital CCU desk and relays encrypted telemetry payloads.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3 text-xs">
              <button
                onClick={() => setDispatchConfirmId(null)}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const targetPatient = patients.find(p => p.id === dispatchConfirmId);
                  if (targetPatient) {
                    handleConfirmEmergencyAlert(targetPatient);
                  }
                }}
                disabled={isDispatching !== null}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 shadow-lg"
              >
                {isDispatching ? "Transmitting..." : "Yes, Dispatch Alarm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRE-DISCLOSURE FULL MEDICAL ANALYSIS MODAL */}
      {isFullAnalysisModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-[#111625] border border-white/10 rounded-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <h4 className="text-sm font-bold text-white">Full AI Clinical Analysis Triage Report</h4>
              </div>
              <button onClick={() => setIsFullAnalysisModalOpen(false)} className="p-1 rounded hover:bg-white/5 cursor-pointer">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-slate-300">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Comprehensive Risk Assessment</span>
                <p className="text-sm text-white font-medium">{selectedPatient.riskAssessment}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">OCR Bottle Recognition Details</span>
                  {selectedPatient.scannedMedicine ? (
                    <div className="space-y-1">
                      <p><strong className="text-white">Active Generic Compound:</strong> {selectedPatient.scannedMedicine.genericName}</p>
                      <p><strong className="text-white">Prescribed Dosage:</strong> {selectedPatient.scannedMedicine.dosage}</p>
                      <p><strong className="text-white">Warnings Excerpt:</strong> {selectedPatient.scannedMedicine.warnings[0]}</p>
                    </div>
                  ) : (
                    <p className="text-slate-500 italic">No OCR Scanned Meds</p>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Adverse Chemical Interactions</span>
                  <p className="text-rose-400 font-semibold">{selectedPatient.drugInteraction.hasInteraction ? "Serious Interactions Discovered" : "No serious interactions detected"}</p>
                  <p className="text-[11px] text-slate-400">{selectedPatient.drugInteraction.explanation}</p>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">9-Agent Telemetry Confidence</span>
                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="text-base font-bold text-blue-400">{selectedPatient.aiConfidence}%</span>
                  <p className="text-[11px] text-slate-400">
                    Confidence is generated via consensus matching between Planner, OCR, Medicine, Symptoms, Drug Interaction, Risk Prediction, Emergency Detection, Reflection, and Report agents.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setIsFullAnalysisModalOpen(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
              >
                Close Analysis
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
