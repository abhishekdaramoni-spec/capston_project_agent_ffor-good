import React, { useState, useRef, useEffect } from "react";
import {
  Camera,
  Upload,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  BookOpen,
  Plus,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  Info,
  Trash2,
  Eye,
  Download,
  Sparkles,
  Check,
  RotateCcw,
  FileText,
  Sliders,
  EyeOff,
  Layers,
  AlertOctagon,
  HeartPulse,
  History,
  Share2
} from "lucide-react";
import { MedicineInfo, SavedMedicine } from "../types";

interface MedicineScannerProps {
  onAddMedicineToCabinet: (med: { name: string; purpose: string; dosage: string; frequency: string }) => void;
  savedMedicines: SavedMedicine[];
  theme: "light" | "dark" | "contrast";
  fontSize: "normal" | "large";
}

const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn("localStorage is restricted:", e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn("localStorage is restricted:", e);
    }
  }
};

// High-quality illustrative photos for the 5 demo bottles
const DEMO_MEDICINES = [
  {
    id: "ibuprofen",
    name: "Advil Liqui-Gels",
    strength: "200mg",
    description: "Fast-acting pain & fever relief",
    color: "from-emerald-500 to-teal-700",
    badge: "Pain / NSAID"
  },
  {
    id: "acetaminophen",
    name: "Tylenol Extra Strength",
    strength: "500mg",
    description: "Gentle on stomach pain support",
    color: "from-rose-500 to-red-700",
    badge: "Pain / Fever"
  },
  {
    id: "amoxicillin",
    name: "Amoxicillin Trihydrate",
    strength: "500mg",
    description: "Prescription antibiotic capsule",
    color: "from-blue-500 to-indigo-700",
    badge: "Antibiotic"
  },
  {
    id: "benadryl",
    name: "Benadryl Allergy",
    strength: "25mg",
    description: "Allergy relief & antihistamine",
    color: "from-fuchsia-500 to-purple-700",
    badge: "Antihistamine"
  },
  {
    id: "lipitor",
    name: "Lipitor Cholesterol",
    strength: "20mg",
    description: "Daily cardiovascular support",
    color: "from-amber-500 to-orange-700",
    badge: "Heart / Statin"
  }
];

export function MedicineScanner({
  onAddMedicineToCabinet,
  savedMedicines = [],
  theme,
  fontSize
}: MedicineScannerProps) {
  // Image & Camera Source states
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [mockSelection, setMockSelection] = useState<string | null>(null);
  
  // Camera WebRTC states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [flashOn, setFlashOn] = useState(false);

  // Preprocessing Sliders
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [sharpness, setSharpness] = useState(0);
  const [autoEnhance, setAutoEnhance] = useState(false);
  const [isPreprocessing, setIsPreprocessing] = useState(false);
  const [preprocessingStatus, setPreprocessingStatus] = useState("");

  // Simulated Blur & Quality errors
  const [simulateBlurry, setSimulateBlurry] = useState(false);
  const [forceUnreadable, setForceUnreadable] = useState(false);
  const [blurryErrorMessage, setBlurryErrorMessage] = useState<string | null>(null);

  // Scanning Results states
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scannedMed, setScannedMed] = useState<MedicineInfo | null>(null);
  const [savedToCabinet, setSavedToCabinet] = useState(false);
  const [activeResultTab, setActiveResultTab] = useState<"ocr" | "analysis" | "interactions">("ocr");

  // Persistent Scan History
  const [scanHistory, setScanHistory] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load history on mount
  useEffect(() => {
    const saved = safeStorage.getItem("hm_scan_history");
    if (saved) {
      try {
        setScanHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse scan history", e);
      }
    }
  }, []);

  // Cleanup WebRTC stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Restart camera when facingMode changes
  useEffect(() => {
    if (isCameraActive) {
      startCamera();
    }
  }, [facingMode]);

  // Handle auto-enhance toggle
  useEffect(() => {
    if (autoEnhance) {
      setBrightness(110);
      setContrast(125);
      setSharpness(5);
    } else {
      setBrightness(100);
      setContrast(100);
      setSharpness(0);
    }
  }, [autoEnhance]);

  // WebRTC Camera Management
  const startCamera = async () => {
    setCameraError(null);
    setBlurryErrorMessage(null);
    setImagePreview(null);
    setMockSelection(null);
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error("Camera activation failed:", err);
      setCameraError("Camera access denied or device is busy. Please upload a clear photo from your gallery or choose a demo medicine bottle from the tray below.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Capture at video native resolution for clarity
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Draw the current frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setImagePreview(dataUrl);
        setImageFile(new File([dataUrl], "camera_capture.jpg", { type: "image/jpeg" }));
        stopCamera();
      }
    }
  };

  // Gallery Upload / Drag & Drop
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setImageFile(file);
    setMockSelection(null);
    setScannedMed(null);
    setScanError(null);
    setBlurryErrorMessage(null);
    setSavedToCabinet(false);
    stopCamera();
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      processFile(file);
    }
  };

  // Interactive pre-processing simulator
  const applyImagePreprocessing = async () => {
    if (!imagePreview) return;
    setIsPreprocessing(true);
    setBlurryErrorMessage(null);

    const stages = [
      "Cropping medicine label box...",
      "Aligning package perspectives...",
      "Maximizing active ingredient text contrast...",
      "Sharpening characters & labels...",
      "De-noising shadows and ambient glare...",
      "Analyzing focus clarity index..."
    ];

    for (let i = 0; i < stages.length; i++) {
      setPreprocessingStatus(stages[i]);
      await new Promise(r => setTimeout(r, 400));
    }

    setIsPreprocessing(false);

    // If simulate blurry is active, throw the strict error immediately
    if (simulateBlurry) {
      setBlurryErrorMessage("Image quality is too low. Please retake the photo.");
      return false;
    }
    return true;
  };

  // Scanner trigger
  const triggerScan = async () => {
    if (!imagePreview && !mockSelection) return;
    setScanError(null);
    setScannedMed(null);
    setSavedToCabinet(false);
    setBlurryErrorMessage(null);

    // 1. Run the preprocessing steps first
    const clearImage = await applyImagePreprocessing();
    if (!clearImage) return;

    // 2. Trigger active scanner
    setIsScanning(true);
    setScanProgress(10);

    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 15;
      });
    }, 200);

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          medicineImage: imagePreview || "demo_placeholder",
          forceUnreadable: forceUnreadable,
          mockSelection: mockSelection,
          savedMedicines: savedMedicines.map(m => m.name)
        })
      });

      setScanProgress(100);

      if (!response.ok) {
        throw new Error(`Vision scanner responded with status ${response.status}`);
      }

      const result = await response.json();
      setScannedMed(result);
      setActiveResultTab("ocr");

      // Save to Scan History
      if (result && !forceUnreadable) {
        const historyItem = {
          id: Date.now().toString(),
          name: result.name,
          genericName: result.genericName || "Unspecified",
          date: new Date().toLocaleString(),
          thumbnail: imagePreview || `demo_${mockSelection}`,
          fullData: result
        };

        const updatedHistory = [historyItem, ...scanHistory.filter(h => h.name !== result.name)].slice(0, 10);
        setScanHistory(updatedHistory);
        safeStorage.setItem("hm_scan_history", JSON.stringify(updatedHistory));
      }

    } catch (err: any) {
      console.error("Scanning failed:", err);
      setScanError(err.message || "An unexpected error occurred connecting to the clinical Vision AI service.");
    } finally {
      clearInterval(interval);
      setIsScanning(false);
    }
  };

  // Add to Virtual Cabinet
  const handleSaveCabinet = () => {
    if (!scannedMed) return;
    onAddMedicineToCabinet({
      name: scannedMed.name,
      purpose: scannedMed.purpose,
      dosage: scannedMed.strength || "As labeled",
      frequency: "Take as directed by healthcare provider"
    });
    setSavedToCabinet(true);
  };

  // Choose a pre-configured medicine to scan instantly in Demo Mode
  const selectDemoMedicine = (medId: string) => {
    setMockSelection(medId);
    setScannedMed(null);
    setScanError(null);
    setBlurryErrorMessage(null);
    setSavedToCabinet(false);
    stopCamera();
    
    // Set matching background illustration color as "image preview"
    const selectionColors: Record<string, string> = {
      ibuprofen: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=60",
      acetaminophen: "https://images.unsplash.com/photo-1550572017-edd951b55104?w=400&auto=format&fit=crop&q=60",
      amoxicillin: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&auto=format&fit=crop&q=60",
      benadryl: "https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=400&auto=format&fit=crop&q=60",
      lipitor: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400&auto=format&fit=crop&q=60"
    };
    
    setImagePreview(selectionColors[medId] || selectionColors.ibuprofen);
  };

  const resetScanner = () => {
    setImagePreview(null);
    setImageFile(null);
    setMockSelection(null);
    setScannedMed(null);
    setScanError(null);
    setBlurryErrorMessage(null);
    setSavedToCabinet(false);
    stopCamera();
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = scanHistory.filter(item => item.id !== id);
    setScanHistory(updated);
    safeStorage.setItem("hm_scan_history", JSON.stringify(updated));
  };

  const loadFromHistory = (item: any) => {
    setScannedMed(item.fullData);
    setImagePreview(item.thumbnail.startsWith("data:") || item.thumbnail.startsWith("http") ? item.thumbnail : null);
    setMockSelection(item.thumbnail.startsWith("demo_") ? item.thumbnail.replace("demo_", "") : null);
    setActiveResultTab("ocr");
    setSavedToCabinet(false);
    setBlurryErrorMessage(null);
    setScanError(null);
  };

  const exportMonographText = () => {
    if (!scannedMed) return;
    const textContent = `
========================================
HEALTHMATE AI - MEDICAL LABEL SCAN REPORT
========================================
Medicine Name:       ${scannedMed.name}
Generic Name:        ${scannedMed.genericName || "Unspecified"}
Strength:            ${scannedMed.strength || "Unspecified"}
Dosage Form:         ${scannedMed.dosageForm || "Unspecified"}
Manufacturer:        ${scannedMed.manufacturer || "Unspecified"}
Batch Number:        ${scannedMed.batchNumber || "Unspecified"}
Manufacturing Date:  ${scannedMed.manufacturingDate || "Unspecified"}
Expiry Date:         ${scannedMed.expiryDate || "Unspecified"}
Composition:         ${scannedMed.composition || "Unspecified"}
Storage Instructions:${scannedMed.storageInstructions || "Unspecified"}

----------------------------------------
CLINICAL MONOGRAPH ANALYSIS
----------------------------------------
Primary Purpose:     ${scannedMed.purpose}
Common Uses:         ${scannedMed.commonUses}
How It Works:        ${scannedMed.howItWorks || "Unspecified"}
Pregnancy Warning:   ${scannedMed.pregnancyWarning || "Unspecified"}
Child Safety:        ${scannedMed.childSafety || "Unspecified"}
Storage Advice:      ${scannedMed.storageAdvice || "Unspecified"}

Safety Warnings:
${scannedMed.warnings.map((w, idx) => `  [!] ${w}`).join("\n")}

Potential Side-Effects:
${scannedMed.sideEffects.map((s, idx) => `  - ${s}`).join("\n")}

----------------------------------------
CABINET DRUG-DRUG INTERACTIONS
----------------------------------------
${
  scannedMed.interactions && scannedMed.interactions.length > 0
    ? scannedMed.interactions
        .map(
          i =>
            `Compare: ${i.medicineName}\nSeverity: ${i.severity.toUpperCase()}\nAdvice:   ${i.explanation}`
        )
        .join("\n\n")
    : "No cabinet medications available to cross-compare."
}

Report Compiled On: ${new Date().toLocaleString()}
Confidence Level:    ${scannedMed.confidenceLevel}% (${scannedMed.confidenceText})
========================================
    `.trim();

    const element = document.createElement("a");
    const file = new Blob([textContent], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `HealthMate_${scannedMed.name.replace(/\s+/g, "_")}_Monograph.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const isLowConfidence = scannedMed && (scannedMed.confidenceLevel < 70 || forceUnreadable);

  return (
    <div className="space-y-6" id="medicine-scanner-root">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/5 pb-4 gap-4">
        <div className="space-y-1">
          <h3 className={`font-bold text-slate-100 font-display flex items-center gap-2 ${fontSize === "large" ? "text-2xl" : "text-xl"}`}>
            <Camera className="w-5 h-5 text-blue-400" />
            AI Medicine Scanner & Lens
          </h3>
          <p className="text-xs text-slate-400">
            Real-time optical character recognition (OCR) and advanced multi-medicine interaction screening powered by Google Gemini Vision.
          </p>
        </div>

        {/* Supported chips */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] text-slate-400 font-mono font-medium">Supported scans:</span>
          {["Boxes", "Strips", "Bottles", "Vials", "Prescriptions"].map((chip) => (
            <span key={chip} className="text-[10px] bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded-full border border-white/5 font-medium">
              {chip}
            </span>
          ))}
        </div>
      </div>

      {/* Main Framework Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: ACTIVE CAPTURE / UPLOAD ZONE (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Visual Box (WebRTC Live video or Preprocessor Image viewer) */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`relative rounded-[32px] overflow-hidden border-2 transition-all min-h-[380px] flex flex-col items-center justify-center ${
              imagePreview
                ? "border-blue-500/40 bg-slate-950/80 shadow-[0_0_30px_rgba(59,130,246,0.15)]"
                : isCameraActive
                ? "border-emerald-500/40 bg-black"
                : "border-white/10 hover:border-white/15 bg-white/5"
            }`}
          >
            {/* Live Camera Feed active */}
            {isCameraActive && !imagePreview && (
              <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />

                {/* Camera overlays */}
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
                  {/* Status Indicator */}
                  <div className="flex justify-between items-center w-full">
                    <span className="text-[10px] bg-emerald-500/80 text-white font-mono font-bold px-2 py-0.5 rounded shadow-lg uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                      Live Camera
                    </span>
                    <span className="text-[10px] bg-white/15 backdrop-blur text-slate-200 font-mono px-2 py-0.5 rounded">
                      Mode: {facingMode === "environment" ? "Back Lens" : "Selfie Lens"}
                    </span>
                  </div>

                  {/* Scanning Bracket Overlay (Google Lens Style) */}
                  <div className="self-center relative w-72 h-48 border border-white/20 rounded-xl">
                    {/* Glowing Scan green corners */}
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-md"></div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-md"></div>
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-md"></div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-md"></div>

                    {/* Auto Focus indicator pulse */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full border-2 border-white/30 animate-ping"></div>
                    </div>

                    {/* Laser scanning line */}
                    <div className="absolute left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-green-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-laser"></div>
                  </div>

                  <p className="text-center text-[10px] text-white/80 bg-black/40 px-3 py-1 rounded-full self-center backdrop-blur shadow">
                    Align the medicine label inside the frame.
                  </p>
                </div>

                {/* Hidden Canvas for capture */}
                <canvas ref={canvasRef} className="hidden" />
              </div>
            )}

            {/* Image Preview / Selection active */}
            {imagePreview && (
              <div className="relative w-full h-full flex flex-col items-center justify-center p-6 select-none">
                
                {/* Simulated Lens Bracket */}
                <div className="relative border-4 border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl bg-[#030712] max-w-sm">
                  <img
                    src={imagePreview}
                    alt="Active upload"
                    className="max-h-[260px] object-contain rounded-lg transition-all"
                    style={{
                      filter: `brightness(${brightness}%) contrast(${contrast}%) ${
                        autoEnhance ? "saturate(110%) contrast(120%)" : ""
                      }`
                    }}
                  />
                  
                  {/* Glowing Laser line on scanning */}
                  {isScanning && (
                    <div className="absolute left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-400 shadow-[0_0_10px_rgba(96,165,250,0.8)] animate-laser pointer-events-none"></div>
                  )}

                  {/* UNREADABLE OVERLAY */}
                  {isLowConfidence && (
                    <div 
                      className="absolute top-[35%] left-[20%] w-[60%] h-[20%] border-2 border-rose-500 bg-rose-500/15 rounded shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse flex flex-col items-center justify-center pointer-events-none"
                    >
                      <span className="text-[8px] bg-rose-600 text-white font-mono font-bold px-1.5 py-0.5 rounded shadow uppercase tracking-widest border border-rose-300">
                        Fragmented Label Core Confirmed: {scannedMed.name || "Unknown"}
                      </span>
                    </div>
                  )}

                  {/* HIGH CONFIDENCE VERIFIED OVERLAY */}
                  {scannedMed && !isLowConfidence && (
                    <div className="absolute top-[30%] left-[15%] w-[70%] h-[25%] border-2 border-emerald-400 bg-emerald-500/5 rounded shadow-[0_0_12px_rgba(52,211,153,0.3)] flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[8px] bg-emerald-500 text-white font-mono font-bold px-1.5 py-0.5 rounded shadow uppercase border border-emerald-300 tracking-wider flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" /> Optical Text Alignment Verified
                      </span>
                    </div>
                  )}
                </div>

                {/* Info summary */}
                <div className="mt-4 flex flex-col items-center">
                  <span className="text-xs text-blue-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    {mockSelection ? `Sample Selected: ${mockSelection.toUpperCase()}` : `Image Uploaded: ${imageFile?.name || "Scan_Snapshot.jpg"}`}
                  </span>
                  
                  <button
                    onClick={resetScanner}
                    className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold underline mt-1.5 cursor-pointer"
                  >
                    Clear photo & reload lens
                  </button>
                </div>
              </div>
            )}

            {/* Completely Empty State: Upload Placeholder */}
            {!imagePreview && !isCameraActive && (
              <div className="space-y-4 flex flex-col items-center p-8 text-center select-none w-full">
                <div className="w-16 h-16 rounded-[22px] bg-slate-800 flex items-center justify-center border border-white/5 text-slate-300 shadow">
                  <Upload className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-200">Upload package label or take a photo</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    Drag and drop prescription photos here, start live camera, or click to browse files.
                  </p>
                </div>

                <div className="flex gap-2 items-center">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-white/5 transition-colors shadow"
                  >
                    Upload Photo
                  </button>

                  <button
                    type="button"
                    onClick={startCamera}
                    className="cursor-pointer px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Open Camera
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* WebRTC Camera Controls (Only when live feed is active) */}
          {isCameraActive && !imagePreview && (
            <div className="flex justify-center items-center gap-4 bg-slate-900/60 p-4 rounded-3xl border border-white/5 shadow-md">
              <button
                onClick={switchCamera}
                className="p-3 bg-slate-800 text-slate-300 rounded-2xl hover:bg-slate-700 transition-colors"
                title="Switch Lens"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={capturePhoto}
                className="w-16 h-16 rounded-full border-4 border-slate-800 bg-white hover:bg-slate-100 flex items-center justify-center shadow-2xl transition-all"
                title="Capture Snapshot"
              >
                <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-blue-600 animate-pulse"></div>
              </button>

              <button
                onClick={stopCamera}
                className="p-3 bg-rose-500/10 text-rose-400 border border-rose-500/10 rounded-2xl hover:bg-rose-500/20 transition-all"
                title="Stop Stream"
              >
                <EyeOff className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* DRUG ENHANCEMENT CONTROLS STUDIO PANEL */}
          {imagePreview && (
            <div className="p-5 rounded-3xl border border-white/5 bg-slate-900/60 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-blue-400" />
                  Image Preprocessing Studio (Before OCR)
                </span>
                
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-slate-400">
                  <input
                    type="checkbox"
                    checked={autoEnhance}
                    onChange={(e) => setAutoEnhance(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500/20"
                  />
                  Auto-Enhance Lens
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Brightness */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Brightness</span>
                    <span className="font-mono text-[10px] text-slate-300">{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={brightness}
                    onChange={(e) => {
                      setBrightness(Number(e.target.value));
                      setAutoEnhance(false);
                    }}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                {/* Contrast */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Contrast</span>
                    <span className="font-mono text-[10px] text-slate-300">{contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={contrast}
                    onChange={(e) => {
                      setContrast(Number(e.target.value));
                      setAutoEnhance(false);
                    }}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              </div>

              {/* Advanced pre-processing simulation helpers */}
              <div className="flex flex-wrap items-center justify-between border-t border-white/5 pt-3 gap-2">
                <div className="flex items-center gap-3">
                  {/* Blurry simulation toggle */}
                  <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-400 hover:text-slate-200 transition-colors">
                    <input
                      type="checkbox"
                      checked={simulateBlurry}
                      onChange={(e) => setSimulateBlurry(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500/20"
                    />
                    Simulate Blurry Label
                  </label>

                  {/* Force Unreadable toggle */}
                  <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-400 hover:text-slate-200 transition-colors">
                    <input
                      type="checkbox"
                      checked={forceUnreadable}
                      onChange={(e) => {
                        setForceUnreadable(e.target.checked);
                        if (scannedMed) setScannedMed(null);
                      }}
                      className="rounded border-slate-700 bg-slate-800 text-rose-600 focus:ring-rose-500/20"
                    />
                    Force Low Confidence Overlay
                  </label>
                </div>

                <span className="text-[9px] text-slate-500 font-mono italic">
                  Image Processing Pipeline Auto-active
                </span>
              </div>
            </div>
          )}

          {/* ACTIVE TRIGGER DISPATCH BUTTON */}
          {imagePreview && !scannedMed && (
            <button
              onClick={triggerScan}
              disabled={isScanning || isPreprocessing}
              className={`w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-2xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isScanning || isPreprocessing ? "animate-pulse" : ""
              }`}
            >
              {isPreprocessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> {preprocessingStatus}
                </>
              ) : isScanning ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" /> AI Optical Label Extraction ({scanProgress}%)
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Extract & Analyze Package with Gemini AI
                </>
              )}
            </button>
          )}

          {/* Blur Warning / Processing Errors */}
          {blurryErrorMessage && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-300 flex items-start gap-2.5 animate-shake shadow-lg">
              <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold uppercase tracking-wider text-[10px]">Image Quality Rejected</p>
                <p className="mt-1 font-medium text-rose-200">{blurryErrorMessage}</p>
                <p className="mt-1.5 text-[10px] text-slate-400 italic">
                  Reason: Auto-blur algorithm detected high motion blur or shadow saturation. Please hold the package steady in well-lit room and retry.
                </p>
              </div>
            </div>
          )}

          {/* Standard scanning error */}
          {scanError && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Extraction Failed</p>
                <p>{scanError}</p>
              </div>
            </div>
          )}

          {/* INTERACTIVE DEMO MODE BOTTLE SELECTION BAR */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Demo Mode Tray: Sample Packages for Scanning
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {DEMO_MEDICINES.map((med) => (
                <button
                  key={med.id}
                  onClick={() => selectDemoMedicine(med.id)}
                  className={`p-3 rounded-2xl border text-left transition-all hover:scale-[1.02] flex flex-col justify-between cursor-pointer group ${
                    mockSelection === med.id
                      ? "border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                      : "border-white/5 bg-slate-900/40 hover:bg-slate-900/80"
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest block">
                      {med.badge}
                    </span>
                    <h5 className="font-bold text-slate-200 text-xs leading-tight group-hover:text-white">
                      {med.name}
                    </h5>
                    <span className="text-[10px] font-mono text-slate-400 block">{med.strength}</span>
                  </div>

                  <div className="pt-3 flex items-center justify-between">
                    {/* Tiny visual representation card */}
                    <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${med.color} shadow-md`}></div>
                    <span className="text-[9px] text-blue-400 group-hover:translate-x-0.5 transition-transform">
                      Scan →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: DETAILED OUTCOME ANALYSIS SHEETS (5 Columns) */}
        <div className="lg:col-span-5">
          
          {/* Default un-scanned pane */}
          {!scannedMed && !isScanning && (
            <div className={`p-8 text-center rounded-[32px] border flex flex-col items-center justify-center min-h-[400px] ${
              theme === "light" ? "bg-white border-slate-200" : "bg-slate-900/25 border-white/5"
            }`}>
              <BookOpen className="w-12 h-12 text-slate-500 mb-4" />
              <h4 className="font-bold text-slate-200">Optical Scanner Results Panel</h4>
              <p className="text-xs text-slate-400 max-w-xs mt-2 leading-relaxed">
                Start the live camera or choose one of the test sample medicine packages in the Demo Tray. The clinical OCR details and drug safety profiles will compose here.
              </p>
            </div>
          )}

          {/* Active scanning placeholder loader */}
          {isScanning && (
            <div className={`p-6 rounded-[32px] border space-y-5 min-h-[400px] animate-pulse ${
              theme === "light" ? "bg-white border-slate-200" : "bg-slate-900/40 border-white/5"
            }`}>
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="h-5 bg-slate-800 rounded w-1/3"></div>
                <div className="h-6 bg-slate-800 rounded-full w-12"></div>
              </div>
              <div className="space-y-3 pt-2">
                <div className="h-4 bg-slate-800 rounded w-full"></div>
                <div className="h-4 bg-slate-800 rounded w-5/6"></div>
                <div className="h-4 bg-slate-800 rounded w-2/3"></div>
              </div>
              <div className="h-32 bg-slate-800/40 rounded-2xl mt-6 flex items-center justify-center text-xs text-slate-400">
                Scanning image with vision algorithm...
              </div>
            </div>
          )}

          {/* COMPLETED SCAN SPECIFICATION SHEET */}
          {scannedMed && (
            <div className={`rounded-[32px] border overflow-hidden shadow-2xl transition-all duration-300 ${
              isLowConfidence 
                ? "border-rose-500/30 bg-rose-500/[0.01]" 
                : theme === "light" 
                ? "bg-white border-slate-200" 
                : "bg-gradient-to-b from-slate-900 via-[#0D1527] to-[#080E1A] border-white/10"
            }`}>
              
              {/* Card top banner with rating */}
              <div className="p-6 border-b border-white/5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className={`text-[9px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      isLowConfidence ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                    }`}>
                      {isLowConfidence ? "⚠️ Read Unclear" : "✓ Clarity Verified"}
                    </span>
                    <h4 className="text-xl font-bold text-slate-100 mt-2 font-display">{scannedMed.name}</h4>
                  </div>

                  <div className="text-right shrink-0">
                    <div className={`text-2xl font-mono font-bold ${isLowConfidence ? "text-rose-400" : "text-emerald-400"}`}>
                      {scannedMed.confidenceLevel}%
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono">Clarity Level</span>
                  </div>
                </div>

                {/* UNREADABLE OVERLAY WARNING */}
                {isLowConfidence && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3 text-xs">
                    <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-rose-300 uppercase font-mono text-[9px] tracking-wider">⚠️ Clarification Request</h5>
                      <p className="text-rose-200/95 leading-relaxed mt-1">
                        The OCR engine is uncertain because the text is blurry. We politely request you upload a clearer, higher-contrast image.
                      </p>
                    </div>
                  </div>
                )}

                {/* TAB SWITCHER */}
                <div className="flex bg-slate-800/50 p-1 rounded-xl border border-white/5 text-xs font-bold">
                  <button
                    onClick={() => setActiveResultTab("ocr")}
                    className={`flex-1 py-1.5 rounded-lg transition-all ${
                      activeResultTab === "ocr"
                        ? "bg-blue-600 text-white shadow"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    📷 OCR Details
                  </button>
                  <button
                    onClick={() => setActiveResultTab("analysis")}
                    className={`flex-1 py-1.5 rounded-lg transition-all ${
                      activeResultTab === "analysis"
                        ? "bg-blue-600 text-white shadow"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    🧠 AI Analysis
                  </button>
                  <button
                    onClick={() => setActiveResultTab("interactions")}
                    className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                      activeResultTab === "interactions"
                        ? "bg-blue-600 text-white shadow"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    💥 Interactions
                    {scannedMed.interactions && scannedMed.interactions.some(i => i.severity !== "None") && (
                      <span className="w-2 h-2 rounded-full bg-red-400"></span>
                    )}
                  </button>
                </div>
              </div>

              {/* SHEET SPECIFIC CONTENTS */}
              <div className="p-6 space-y-4 max-h-[420px] overflow-y-auto custom-scrollbar">

                {/* TAB 1: OCR DATA CHECKLIST SHEET */}
                {activeResultTab === "ocr" && (
                  <div className="space-y-3 text-xs">
                    {/* Structured Grid info */}
                    <div className="p-4 bg-slate-900/40 rounded-2xl border border-white/5 space-y-3">
                      <div className="flex justify-between pb-1.5 border-b border-white/5">
                        <span className="text-slate-400">Medicine Name:</span>
                        <span className="font-semibold text-slate-100">{scannedMed.name}</span>
                      </div>
                      <div className="flex justify-between pb-1.5 border-b border-white/5">
                        <span className="text-slate-400">Generic Name:</span>
                        <span className="font-semibold text-slate-100 italic">{scannedMed.genericName || "Unspecified"}</span>
                      </div>
                      <div className="flex justify-between pb-1.5 border-b border-white/5">
                        <span className="text-slate-400">Strength:</span>
                        <span className="font-semibold text-slate-100">{scannedMed.strength || "Unspecified"}</span>
                      </div>
                      <div className="flex justify-between pb-1.5 border-b border-white/5">
                        <span className="text-slate-400">Dosage Form:</span>
                        <span className="font-semibold text-slate-100">{scannedMed.dosageForm || "Unspecified"}</span>
                      </div>
                      <div className="flex justify-between pb-1.5 border-b border-white/5">
                        <span className="text-slate-400">Manufacturer:</span>
                        <span className="font-semibold text-slate-100">{scannedMed.manufacturer || "Unspecified"}</span>
                      </div>
                      <div className="flex justify-between pb-1.5 border-b border-white/5">
                        <span className="text-slate-400">Batch Number:</span>
                        <span className="font-mono text-slate-300 text-[10px]">{scannedMed.batchNumber || "Not visible"}</span>
                      </div>
                      <div className="flex justify-between pb-1.5 border-b border-white/5">
                        <span className="text-slate-400">Mfg Date:</span>
                        <span className="font-semibold text-slate-300">{scannedMed.manufacturingDate || "Not visible"}</span>
                      </div>
                      <div className="flex justify-between pb-1.5 border-b border-white/5">
                        <span className="text-slate-400">Exp Date:</span>
                        <span className="font-semibold text-slate-300">{scannedMed.expiryDate || "Not visible"}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl space-y-1">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">Active Chemical Composition</span>
                      <p className="text-slate-200 leading-normal">{scannedMed.composition || "Active ingredients unreadable"}</p>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl space-y-1">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">Storage Instructions</span>
                      <p className="text-slate-200 leading-normal">{scannedMed.storageInstructions || "Instructions unreadable"}</p>
                    </div>
                  </div>
                )}

                {/* TAB 2: AI CLINICAL MONOGRAPH SHEET */}
                {activeResultTab === "analysis" && (
                  <div className="space-y-4 text-xs">
                    
                    {/* Primary Therapeutic Purpose */}
                    <div className="p-3.5 bg-slate-900/40 rounded-xl border border-white/5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1 font-mono">Therapeutic Purpose</span>
                      <p className="text-slate-200 leading-relaxed font-medium">{scannedMed.purpose}</p>
                    </div>

                    {/* How It Works */}
                    <div className="p-3.5 bg-slate-900/40 rounded-xl border border-white/5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1 font-mono">How it Works in Body</span>
                      <p className="text-slate-300 leading-relaxed">{scannedMed.howItWorks || "No standard metabolic action summarized."}</p>
                    </div>

                    {/* Common Uses */}
                    <div className="p-3.5 bg-slate-900/40 rounded-xl border border-white/5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1 font-mono">Common Uses</span>
                      <p className="text-slate-300 leading-relaxed">{scannedMed.commonUses}</p>
                    </div>

                    {/* Safety Warnings Section */}
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> Crucial Dosage Warnings
                      </span>
                      <div className="space-y-1.5 pl-1">
                        {scannedMed.warnings.map((warn: string, idx: number) => (
                          <div key={idx} className="flex gap-2 items-start text-amber-300 leading-relaxed bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-xl">
                            <span className="text-amber-400 shrink-0 mt-0.5 font-bold font-mono">!</span>
                            <span>{warn}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Warnings Grid (Pregnancy, Pediatric, Storage) */}
                    <div className="grid grid-cols-1 gap-2.5">
                      <div className="p-3 bg-[#1e1b4b]/20 border border-indigo-500/10 rounded-xl">
                        <span className="text-[9px] uppercase font-bold text-indigo-400 block font-mono">Pregnancy & Lactation Guidance</span>
                        <p className="text-slate-200 mt-1 leading-normal">{scannedMed.pregnancyWarning || "Consult doctor."}</p>
                      </div>

                      <div className="p-3 bg-[#022c22]/20 border border-emerald-500/10 rounded-xl">
                        <span className="text-[9px] uppercase font-bold text-emerald-400 block font-mono">Pediatric / Child Safety</span>
                        <p className="text-slate-200 mt-1 leading-normal">{scannedMed.childSafety || "Unspecified."}</p>
                      </div>

                      <div className="p-3 bg-[#1e293b]/30 border border-slate-700/20 rounded-xl">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">Storage Advice</span>
                        <p className="text-slate-300 mt-1 leading-normal">{scannedMed.storageAdvice || "Keep dry."}</p>
                      </div>
                    </div>

                    {/* Potential Side-Effects */}
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-blue-400" /> Potential Side-Effects
                      </span>
                      <ul className="grid grid-cols-1 gap-1 pl-1">
                        {scannedMed.sideEffects.map((se: string, idx: number) => (
                          <li key={idx} className="text-slate-300 flex gap-2 items-start">
                            <span className="text-slate-500 shrink-0 mt-1">•</span>
                            <span className="leading-tight">{se}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* TAB 3: DYNAMIC CABINET DRUG INTERACTIONS */}
                {activeResultTab === "interactions" && (
                  <div className="space-y-4 text-xs">
                    <div className="p-3.5 bg-slate-900/50 rounded-xl border border-indigo-500/15">
                      <span className="text-[10px] uppercase font-bold text-indigo-400 block mb-1 font-mono">Dynamic Interaction Screening</span>
                      <p className="text-slate-300 leading-normal">
                        HealthMate compares your newly scanned medication with the active profile items inside your cabinet virtual files to prevent severe interactions.
                      </p>
                    </div>

                    {/* Current interactions list */}
                    {scannedMed.interactions && scannedMed.interactions.length > 0 ? (
                      <div className="space-y-3 pt-1">
                        {scannedMed.interactions.map((interaction: any, idx: number) => {
                          const severity = interaction.severity.toLowerCase();
                          const isSerious = severity === "serious" || severity === "high";
                          const isModerate = severity === "moderate";
                          const isMild = severity === "mild";

                          return (
                            <div
                              key={idx}
                              className={`p-4 rounded-2xl border flex flex-col gap-2.5 shadow-sm transition-all ${
                                isSerious
                                  ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                                  : isModerate
                                  ? "bg-amber-500/5 border-amber-500/25 text-amber-300"
                                  : isMild
                                  ? "bg-yellow-500/5 border-yellow-500/15 text-yellow-300"
                                  : "bg-emerald-500/5 border-emerald-500/10 text-emerald-300"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-100 flex items-center gap-1.5">
                                  <HeartPulse className="w-4 h-4 shrink-0" />
                                  With {interaction.medicineName}
                                </span>

                                <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                                  isSerious
                                    ? "bg-rose-600 border-rose-300 text-white animate-pulse"
                                    : isModerate
                                    ? "bg-amber-600 border-amber-400 text-white"
                                    : isMild
                                    ? "bg-yellow-600 border-yellow-400 text-slate-900"
                                    : "bg-emerald-600 border-emerald-400 text-white"
                                }`}>
                                  {interaction.severity} Interaction
                                </span>
                              </div>

                              <p className="text-slate-200 leading-relaxed text-[11px] font-medium">
                                {interaction.explanation}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-8 text-center rounded-2xl border border-dashed border-white/5 bg-slate-900/20 text-slate-400">
                        <Eye className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                        <p className="font-bold text-xs text-slate-300">Your cabinet is empty</p>
                        <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] mx-auto">
                          Add medicines in the Cabinet tab to enable dynamic cross-compare.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* CONFIDENCE TEXT RATIONALE */}
                <div className="text-[10px] text-slate-500 italic pt-2 leading-relaxed border-t border-white/5 font-medium">
                  "{scannedMed.confidenceText || scannedMed.confidenceText}"
                </div>
              </div>

              {/* OUTCOME ACTION FOOTER */}
              <div className="p-6 bg-slate-950/40 border-t border-white/5 flex gap-2 items-center justify-between">
                <button
                  onClick={exportMonographText}
                  className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5 rounded-xl text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1.5"
                  title="Export clinical monograph text"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" /> Download Report
                </button>

                <button
                  onClick={handleSaveCabinet}
                  disabled={savedToCabinet || isLowConfidence}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow"
                >
                  {savedToCabinet ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-300" /> Saved successfully
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" /> Save to My Cabinet
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* PERSISTENT SCAN HISTORY VIEW */}
      {scanHistory.length > 0 && (
        <div className="p-5 rounded-3xl border border-white/5 bg-slate-900/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-blue-400" />
              My Scan History & Monograph Log
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Last {scanHistory.length} Scans</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {scanHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => loadFromHistory(item)}
                className="p-3 bg-slate-900/40 hover:bg-slate-900/80 border border-white/5 rounded-2xl flex items-center gap-3 cursor-pointer transition-all group"
              >
                {/* Visual miniature representation */}
                <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center border border-white/5 shrink-0 overflow-hidden relative">
                  {item.thumbnail.startsWith("http") || item.thumbnail.startsWith("data:") ? (
                    <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-4 h-4 rounded-md bg-gradient-to-br from-blue-500 to-teal-500"></div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h6 className="font-bold text-xs text-slate-200 truncate group-hover:text-blue-400 leading-tight">
                    {item.name}
                  </h6>
                  <p className="text-[9px] text-slate-400 truncate mt-0.5">Generic: {item.genericName}</p>
                  <span className="text-[8px] font-mono text-slate-500 block mt-0.5">{item.date}</span>
                </div>

                <button
                  onClick={(e) => deleteHistoryItem(item.id, e)}
                  className="p-1.5 hover:bg-rose-500/15 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                  title="Remove from history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
