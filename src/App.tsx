import React, { useState, useEffect } from "react";
import {
  Activity,
  Heart,
  Shield,
  Clock,
  Sparkles,
  BookOpen,
  Bell,
  Phone,
  Sun,
  Moon,
  Eye,
  Type,
  FileText,
  CheckCircle
} from "lucide-react";
import {
  RiskLevel,
  SavedMedicine,
  SavedReminder,
  SavedReport,
  HealthReport
} from "./types";

// Import modular components
import { DashboardView } from "./components/DashboardView";
import { SymptomChecker } from "./components/SymptomChecker";
import { MedicineScanner } from "./components/MedicineScanner";
import { MedicineCabinet } from "./components/MedicineCabinet";
import { ReportsHistory } from "./components/ReportsHistory";
import { ReportDetailView } from "./components/ReportDetailView";

// Safe Storage wrapper to handle iframe third-party cookie/local storage blocking
const safeStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(`[Storage Warning] Failed to read ${key} from localStorage:`, e);
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`[Storage Warning] Failed to write ${key} to localStorage:`, e);
    }
  }
};

export default function App() {
  // Theme & Accessibility States
  const [theme, setTheme] = useState<"light" | "dark" | "contrast">(() => {
    return (safeStorage.getItem("healthmate-theme") as "light" | "dark" | "contrast") || "dark";
  });
  const [fontSize, setFontSize] = useState<"normal" | "large">(() => {
    return (safeStorage.getItem("healthmate-font-size") as "normal" | "large") || "normal";
  });

  // Main UI Navigation Tab
  const [activeTab, setActiveTab] = useState<"dashboard" | "checker" | "scanner" | "medicines" | "reports">("dashboard");

  // Selected historical report detail modal state
  const [selectedHistoricalReport, setSelectedHistoricalReport] = useState<HealthReport | null>(null);

  // Persistent States
  const [savedMedicines, setSavedMedicines] = useState<SavedMedicine[]>(() => {
    const local = safeStorage.getItem("healthmate-saved-medicines");
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        console.error("Failed to parse saved medicines from storage", e);
      }
    }
    return [
      { id: "1", name: "Vitamin D3", purpose: "Bone health & immune system support", dosage: "2000 IU", frequency: "Take 1 pill daily with breakfast", addedAt: new Date().toISOString() },
      { id: "2", name: "Aspirin", purpose: "Mild blood thinner & headache support", dosage: "81 mg", frequency: "As advised by cardiologist", addedAt: new Date().toISOString() }
    ];
  });

  const [reminders, setReminders] = useState<SavedReminder[]>(() => {
    const local = safeStorage.getItem("healthmate-reminders");
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        console.error("Failed to parse reminders from storage", e);
      }
    }
    return [
      { id: "rem1", time: "08:00 AM", medicineName: "Vitamin D3", completed: false },
      { id: "rem2", time: "02:00 PM", medicineName: "Calcium chew", completed: true },
      { id: "rem3", time: "09:00 PM", medicineName: "Heart Aspirin", completed: false }
    ];
  });

  const [savedReports, setSavedReports] = useState<SavedReport[]>(() => {
    const local = safeStorage.getItem("healthmate-saved-reports");
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        console.error("Failed to parse saved reports from storage", e);
      }
    }
    return [
      { id: "rep_prev1", date: "2026-06-25", symptoms: "Mild tension headache", riskLevel: "Low" },
      { id: "rep_prev2", date: "2026-06-20", symptoms: "Stomach burn after acidic meals", riskLevel: "Moderate" }
    ];
  });

  // Sync Tailwind & Document styling class lists
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark", "contrast");
    root.classList.add(theme);
    safeStorage.setItem("healthmate-theme", theme);
  }, [theme]);

  useEffect(() => {
    safeStorage.setItem("healthmate-font-size", fontSize);
  }, [fontSize]);

  // Sync Storage
  useEffect(() => {
    safeStorage.setItem("healthmate-saved-medicines", JSON.stringify(savedMedicines));
  }, [savedMedicines]);

  useEffect(() => {
    safeStorage.setItem("healthmate-reminders", JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    safeStorage.setItem("healthmate-saved-reports", JSON.stringify(savedReports));
  }, [savedReports]);

  // Handlers
  const handleToggleReminder = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r))
    );
  };

  const handleAddMedicine = (newMed: SavedMedicine) => {
    setSavedMedicines((prev) => [newMed, ...prev]);
    // Create automatic dose reminder for newly added meds
    const newRem: SavedReminder = {
      id: "rem_" + Math.random().toString(36).substring(2, 9),
      time: "09:00 AM",
      medicineName: newMed.name,
      completed: false
    };
    setReminders((prev) => [newRem, ...prev]);
  };

  const handleDeleteMedicine = (id: string) => {
    setSavedMedicines((prev) => prev.filter((m) => m.id !== id));
  };

  const handleAddScannedMedicineToCabinet = (med: { name: string; purpose: string; dosage: string; frequency: string }) => {
    const newMed: SavedMedicine = {
      id: "med_" + Math.random().toString(36).substring(2, 9),
      name: med.name,
      purpose: med.purpose,
      dosage: med.dosage,
      frequency: med.frequency,
      addedAt: new Date().toISOString()
    };
    handleAddMedicine(newMed);
  };

  const handleNewReportCreated = (report: HealthReport) => {
    const newSaved: SavedReport = {
      id: report.id,
      date: new Date().toISOString().split("T")[0],
      symptoms: report.symptomsSummary || report.symptoms,
      riskLevel: report.riskLevel
    };
    setSavedReports((prev) => [newSaved, ...prev]);
  };

  const handleOpenHistoricalReport = (id: string, riskLevel: RiskLevel, symptoms: string) => {
    // Generate a fallback structured report if opening an older log, otherwise mock detailed data
    const fullReport = getDemoMedicineReportForHistory(riskLevel, symptoms);
    setSelectedHistoricalReport(fullReport);
  };

  return (
    <div className={`min-h-screen flex flex-col transition-all duration-300 ${
      fontSize === "large" ? "text-lg" : "text-sm"
    } ${
      theme === "light" 
        ? "bg-[#F8FAFC] text-slate-900" 
        : theme === "contrast" 
        ? "bg-black text-white" 
        : "bg-[#040812] text-slate-300"
    }`}>
      
      {/* 1. Global Navigation Top Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors ${
        theme === "light" ? "bg-white/85 border-slate-200" : theme === "contrast" ? "bg-black border-white" : "bg-[#040812]/80 border-white/5"
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          
          {/* Logo Brand Brand */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/10">
              <Heart className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white font-display">HealthMate AI</h1>
              <p className="text-[10px] text-slate-400 font-mono">Multi-Agent Assistant</p>
            </div>
          </div>

          {/* Navigation Controls */}
          <nav className="flex items-center gap-1">
            {[
              { id: "dashboard", label: "Dashboard" },
              { id: "checker", label: "Symptom Checker" },
              { id: "scanner", label: "Medicine Scanner" },
              { id: "medicines", label: "My Cabinet" },
              { id: "reports", label: "Triage Logs" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSelectedHistoricalReport(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Theme & Accessibility Bar */}
          <div className="flex items-center gap-2.5">
            {/* Font size toggler */}
            <button
              onClick={() => setFontSize(fontSize === "normal" ? "large" : "normal")}
              className="p-2 bg-slate-800/55 hover:bg-slate-700/65 rounded-xl border border-white/5 transition-colors cursor-pointer"
              title="Toggle Large Fonts"
            >
              <Type className="w-4 h-4 text-slate-300" />
            </button>

            {/* Light / Dark / Contrast Toggles */}
            <div className="flex items-center bg-slate-800/50 p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setTheme("light")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${theme === "light" ? "bg-white text-blue-600" : "text-slate-400 hover:text-white"}`}
                title="Light Theme"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${theme === "dark" ? "bg-[#040812] text-blue-400" : "text-slate-400 hover:text-white"}`}
                title="Twilight Theme"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setTheme("contrast")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${theme === "contrast" ? "bg-black text-white border border-white/40" : "text-slate-400 hover:text-white"}`}
                title="High Contrast Theme"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* 2. Main Double Grid Framework */}
      <div className="max-w-7xl mx-auto w-full px-4 py-6 flex-1 flex flex-col gap-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Stage Panel (9 Columns) */}
          <main className="lg:col-span-9 space-y-6">
            
            {/* If a report detail view is actively chosen */}
            {selectedHistoricalReport ? (
              <ReportDetailView
                report={selectedHistoricalReport}
                onClose={() => setSelectedHistoricalReport(null)}
                theme={theme}
              />
            ) : (
              <>
                {activeTab === "dashboard" && (
                  <DashboardView
                    savedMedicines={savedMedicines}
                    reminders={reminders}
                    toggleReminder={handleToggleReminder}
                    savedReports={savedReports}
                    onOpenReport={handleOpenHistoricalReport}
                    onStartSymptomCheck={() => setActiveTab("checker")}
                    onStartMedicineScan={() => setActiveTab("scanner")}
                    theme={theme}
                    fontSize={fontSize}
                  />
                )}

                {activeTab === "checker" && (
                  <SymptomChecker
                    savedMedicines={savedMedicines}
                    onReportCreated={handleNewReportCreated}
                    theme={theme}
                    fontSize={fontSize}
                  />
                )}

                {activeTab === "scanner" && (
                  <MedicineScanner
                    onAddMedicineToCabinet={handleAddScannedMedicineToCabinet}
                    savedMedicines={savedMedicines}
                    theme={theme}
                    fontSize={fontSize}
                  />
                )}

                {activeTab === "medicines" && (
                  <MedicineCabinet
                    savedMedicines={savedMedicines}
                    onAddMedicine={handleAddMedicine}
                    onDeleteMedicine={handleDeleteMedicine}
                    theme={theme}
                  />
                )}

                {activeTab === "reports" && (
                  <ReportsHistory
                    savedReports={savedReports}
                    onOpenReport={handleOpenHistoricalReport}
                    theme={theme}
                  />
                )}
              </>
            )}

          </main>

          {/* Sidebar Panel (3 Columns) */}
          <aside className="lg:col-span-3 flex flex-col gap-6">
            
            {/* Daily Schedule Reminders card */}
            <div className={`p-6 rounded-3xl border ${theme === "light" ? "bg-white border-slate-200" : theme === "contrast" ? "bg-black border-white" : "bg-white/5 border-white/10"}`}>
              <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-400" /> Today's Reminders
                </h3>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-1.5 rounded-full font-mono">
                  {reminders.filter(r => !r.completed).length} Left
                </span>
              </div>

              <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
                {reminders.map((rem) => (
                  <button
                    key={rem.id}
                    onClick={() => handleToggleReminder(rem.id)}
                    className="w-full text-left p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${rem.completed ? "bg-emerald-500 border-transparent text-white" : "border-slate-500"}`}>
                      {rem.completed && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold leading-normal ${rem.completed ? "line-through text-slate-500" : "text-slate-100"}`}>{rem.medicineName}</p>
                      <p className="text-[9px] text-slate-500 italic mt-0.5">{rem.time}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Emergency Hotlines Contacts (Safety mandate) */}
            <div className={`p-6 rounded-3xl border border-rose-500/10 ${theme === "light" ? "bg-rose-50/50" : theme === "contrast" ? "bg-black border-white" : "bg-rose-950/5"}`}>
              <h3 className="text-xs font-bold uppercase tracking-widest text-rose-400 mb-3 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-rose-400" /> Emergency Hotline
              </h3>
              
              <div className="p-3 bg-white/5 rounded-xl border border-white/5 mb-3 text-xs">
                <p className="font-bold text-slate-200">National Emergency Services</p>
                <p className="text-blue-300 font-bold font-mono text-sm mt-1">911 (US / Global Standard)</p>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/5 mb-4 text-xs">
                <p className="font-bold text-slate-200">Poison Control Center Hotline</p>
                <p className="text-blue-300 font-bold font-mono text-sm mt-1">1-800-222-1222</p>
              </div>

              <a
                href="tel:911"
                className="block text-center w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-bold text-xs transition-colors shadow-lg shadow-rose-950/25 cursor-pointer"
              >
                Call Emergency Hotlines
              </a>
            </div>

            {/* Risk Colors Explanation Legend (UX layout) */}
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider mb-2">Urgency Triage Legend</span>
              <div className="space-y-1.5 text-[10px]">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Low Risk
                  </span>
                  <span className="text-slate-500">Standard home-care is sufficient.</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span> Moderate
                  </span>
                  <span className="text-slate-500">Monitor and contact practitioner.</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-orange-400"></span> High Risk
                  </span>
                  <span className="text-slate-500">Medical consult today advised.</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span> Critical
                  </span>
                  <span className="text-slate-500">Emergency hospital visit required.</span>
                </div>
              </div>
            </div>

          </aside>

        </div>

      </div>

      {/* Persistent Disclaimer Footer */}
      <footer className={`mt-auto py-6 text-center border-t transition-colors ${theme === "light" ? "bg-slate-100 border-slate-200" : theme === "contrast" ? "bg-black border-white" : "bg-[#0A1220]/60 border-white/5"}`}>
        <p className="text-[10px] text-slate-500 max-w-2xl mx-auto px-4 italic leading-relaxed">
          HealthMate AI is an advanced Model Context Protocol evaluation system and multi-agent assistant framework. This tool is intended exclusively for educational demonstrations and triage. Always consult with a certified medical doctor or pharmacist before introducing or combining any medications.
        </p>
      </footer>

    </div>
  );
}

// Helper to formulate a past report structure on clicks
function getDemoMedicineReportForHistory(riskLevel: RiskLevel, symptoms: string): HealthReport {
  return {
    id: "rep_" + Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    age: "35",
    symptoms: symptoms,
    duration: "2 days",
    allergies: "None",
    existingMedicines: ["Aspirin", "Vitamin D3"],
    symptomsSummary: symptoms,
    possibleCauses: [
      {
        condition: "Tension headache & dehydration stress",
        explanation: "Lack of constant fluid balance during intense cognitive activity can trigger vascular narrowing near head temples.",
        likelihood: "High"
      }
    ],
    drugInteraction: {
      hasInteraction: false,
      severity: "None",
      explanation: "No known conflicts between aspirin and vitamin D3 registered under standard dosages."
    },
    riskLevel: riskLevel,
    riskLevelExplanation: "The symptoms resemble a standard tension state. A short period of quiet rest is highly beneficial.",
    whatToDoNext: [
      "Drink 16oz of pure filtered water immediately.",
      "Take a 20 minute break from laptop or screen exposure.",
      "Track whether pain recedes or changes severity over next few hours."
    ]
  };
}
