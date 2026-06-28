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
  CheckCircle,
  MessageSquare,
  Send,
  AlertTriangle
} from "lucide-react";
import {
  RiskLevel,
  SavedMedicine,
  SavedReminder,
  SavedReport,
  HealthReport
} from "./types";

// Import modular components
import { LoginPage } from "./components/LoginPage";
import { DashboardView } from "./components/DashboardView";
import { DoctorDashboardView } from "./components/DoctorDashboardView";
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
  // Authentication State
  const [user, setUser] = useState<{ email: string; name: string } | null>(() => {
    const local = safeStorage.getItem("healthmate-auth-user");
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        console.error("Failed to parse user session", e);
      }
    }
    return null;
  });

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

  const [dispatchedAlerts, setDispatchedAlerts] = useState<{ id: string; message: string; timestamp: string; status: 'sent' | 'acknowledged'; reply?: string }[]>(() => {
    const local = safeStorage.getItem("healthmate-emergency-alerts");
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        console.error("Failed to parse emergency alerts", e);
      }
    }
    return [
      {
        id: "alert_init1",
        message: "SYSTEM INTEGRITY CHECK: Secure clinical messaging channel established with On-Call dashboard.",
        timestamp: "Today at 08:30 AM",
        status: "acknowledged",
        reply: "Welcome to the clinical dispatch deck. All auto-alerts are compiled and relayed instantly to Dr. Sarah Chen's active dashboard."
      }
    ];
  });

  const [newAlertText, setNewAlertText] = useState("");
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  const [autoAttachMetrics, setAutoAttachMetrics] = useState(true);

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

  useEffect(() => {
    safeStorage.setItem("healthmate-emergency-alerts", JSON.stringify(dispatchedAlerts));
  }, [dispatchedAlerts]);

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

  const handleLogin = (userInfo: { email: string; name: string }) => {
    setUser(userInfo);
    safeStorage.setItem("healthmate-auth-user", JSON.stringify(userInfo));
  };

  const handleLogout = () => {
    setUser(null);
    safeStorage.setItem("healthmate-auth-user", "");
  };

  const handleSendEmergencyAlert = (text: string) => {
    if (!text.trim()) return;
    setIsSendingAlert(true);

    const alertId = "alert_" + Math.random().toString(36).substring(2, 9);
    const newAlert = {
      id: alertId,
      message: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " (Direct Alert)",
      status: 'sent' as const
    };

    setDispatchedAlerts(prev => [newAlert, ...prev]);
    setNewAlertText("");

    // Simulate clinical handshake, encryption, and automatic doctor notification
    setTimeout(() => {
      setDispatchedAlerts(prev => prev.map(alert => {
        if (alert.id === alertId) {
          const docName = user?.email === "doctor.demo@healthmate.ai" ? "Dr. Marcus Vance (Chief of Duty)" : "Dr. Sarah Chen (On-Call Practitioner)";
          return {
            ...alert,
            status: 'acknowledged' as const,
            reply: `Automated Dispatch Reception: ${docName} has received this emergency telemetry payload. Your logged Medicine Cabinet records (${savedMedicines.map(m => m.name).join(", ") || "None"}) and active symptoms list are now queued in Dr. Chen's next active clinical panel dashboard.`
          };
        }
        return alert;
      }));
      setIsSendingAlert(false);
    }, 1500);
  };

  if (!user) {
    return (
      <div className={`min-h-screen flex flex-col justify-center transition-all duration-300 ${
        fontSize === "large" ? "text-lg" : "text-sm"
      } ${
        theme === "light" 
          ? "bg-[#F8FAFC] text-slate-900" 
          : theme === "contrast" 
          ? "bg-black text-white" 
          : "bg-[#040812] text-slate-300"
      }`}>
        <LoginPage 
          onLogin={handleLogin} 
          theme={theme} 
          fontSize={fontSize} 
        />
      </div>
    );
  }

  const isDoctor = user?.name?.toLowerCase().startsWith("dr.") || user?.email?.toLowerCase().includes("doctor") || user?.email === "doctor.demo@healthmate.ai";

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
              { id: "dashboard", label: isDoctor ? "Patient Management" : "Dashboard" },
              { id: "checker", label: isDoctor ? "Clinical Triage Tool" : "Symptom Checker" },
              { id: "scanner", label: isDoctor ? "Smart Pill Scan" : "Medicine Scanner" },
              { id: "medicines", label: isDoctor ? "Pharmacy Database" : "My Cabinet" },
              { id: "reports", label: isDoctor ? "Audit Triage Logs" : "Triage Logs" }
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
            {/* User Profile Badge & Logout */}
            <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border ${
              theme === "light" 
                ? "bg-slate-100 border-slate-200" 
                : theme === "contrast" 
                ? "bg-black border-white" 
                : "bg-white/5 border-white/5"
            }`}>
              <span className={`text-[10px] sm:text-[11px] font-bold ${theme === "light" ? "text-slate-700" : "text-slate-200"}`}>
                {user.name}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">|</span>
              <button
                onClick={handleLogout}
                className="text-[10px] text-rose-400 hover:text-rose-300 transition-colors font-bold cursor-pointer font-sans"
                title="Log out of HealthMate"
              >
                Log Out
              </button>
            </div>

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
          
          {/* Main Stage Panel (9 Columns, or 12 Columns for Doctor Dashboard) */}
          <main className={`${isDoctor && activeTab === "dashboard" ? "lg:col-span-12" : "lg:col-span-9"} space-y-6`}>
            
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
                  isDoctor ? (
                    <DoctorDashboardView
                      theme={theme}
                      fontSize={fontSize}
                      userName={user.name}
                      onLogout={handleLogout}
                    />
                  ) : (
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
                      userName={user.name}
                    />
                  )
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
          {(!isDoctor || activeTab !== "dashboard") && (
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

            {/* Emergency Alerts & On-Call Doctor Dispatcher */}
            <div className={`p-6 rounded-3xl border border-rose-500/10 ${
              theme === "light" ? "bg-rose-50/50 text-slate-900 animate-fade-in" : theme === "contrast" ? "bg-black border-white text-white" : "bg-rose-950/5 text-slate-300"
            }`}>
              <h3 className="text-xs font-bold uppercase tracking-widest text-rose-400 mb-3 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-rose-400" /> On-Call Doctor Dispatch
              </h3>

              {/* Doctor Status Badge */}
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5 mb-3 text-xs flex items-center gap-2.5">
                <div className="relative">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block animate-ping absolute top-0 right-0"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block relative"></span>
                </div>
                <div>
                  <p className="font-bold text-[11px] text-slate-200">
                    {user?.email === "doctor.demo@healthmate.ai" ? "Dr. Marcus Vance (Chief of Duty)" : "Dr. Sarah Chen (Consulting Practitioner)"}
                  </p>
                  <p className="text-[9px] text-slate-500 font-mono">NEXT ACTIVE CLINICAL PANEL DASHBOARD</p>
                </div>
              </div>

              {/* Input for dispatch message */}
              <div className="space-y-2 mb-3">
                <textarea
                  value={newAlertText}
                  onChange={(e) => setNewAlertText(e.target.value)}
                  placeholder="Type symptoms or select quick presets below..."
                  className={`w-full h-16 p-2.5 text-xs rounded-xl border outline-none resize-none font-sans transition-all ${
                    theme === "light"
                      ? "bg-white border-slate-200 text-slate-900 focus:border-rose-500"
                      : "bg-slate-950/40 border-white/5 text-slate-200 focus:border-rose-500/40 focus:bg-slate-950"
                  }`}
                />

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "🚨 Adverse medication interaction",
                    "⚠️ Intense migraine & dizziness",
                    "🛑 Sudden vitals fluctuation",
                    "📞 Callback request"
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNewAlertText(preset)}
                      className="text-[9px] px-2 py-1 bg-white/5 border border-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
                    >
                      {preset.split(" ")[0]} {preset.substring(preset.indexOf(" ") + 1)}
                    </button>
                  ))}
                </div>

                {/* Auto Attach Checkbox */}
                <label className="flex items-center gap-1.5 pl-0.5 mt-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoAttachMetrics}
                    onChange={(e) => setAutoAttachMetrics(e.target.checked)}
                    className="rounded border-white/5 bg-slate-950 text-rose-500 focus:ring-rose-500/20"
                  />
                  <span className="text-[9px] text-slate-500">
                    Auto-attach cabinet meds & triage telemetry logs
                  </span>
                </label>
              </div>

              {/* Action dispatch trigger */}
              <button
                type="button"
                onClick={() => handleSendEmergencyAlert(newAlertText)}
                disabled={isSendingAlert || !newAlertText.trim()}
                className={`w-full py-2.5 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white rounded-xl font-bold text-xs transition-colors shadow-lg shadow-rose-950/25 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50`}
              >
                {isSendingAlert ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Encrypting & Dispatching...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Transmit Auto-Alert to Doctor
                  </>
                )}
              </button>

              {/* Dispatch Alert logs list */}
              {dispatchedAlerts.length > 0 && (
                <div className="mt-4 pt-3 border-t border-white/5 space-y-2.5 max-h-[160px] overflow-y-auto pr-0.5">
                  <span className="text-[9px] font-bold text-slate-500 block tracking-wider uppercase">Active Dispatch Telemetry</span>
                  {dispatchedAlerts.map((alert) => (
                    <div key={alert.id} className="p-2.5 bg-white/5 border border-white/5 rounded-xl space-y-1 text-[10px]">
                      <div className="flex justify-between items-center">
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase font-mono ${
                          alert.status === "acknowledged" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10" : "bg-amber-500/10 text-amber-400"
                        }`}>
                          {alert.status === "acknowledged" ? "● ACKNOWLEDGED" : "● DISPATCHED"}
                        </span>
                        <span className="text-[8px] text-slate-500">{alert.timestamp}</span>
                      </div>
                      <p className="text-slate-300 font-sans italic">"{alert.message}"</p>
                      
                      {alert.reply && (
                        <div className="mt-1.5 p-1.5 bg-emerald-500/5 border border-emerald-500/10 rounded text-[9px] text-emerald-300">
                          <p className="font-bold mb-0.5">Doctor Automated Response:</p>
                          <p className="leading-tight text-slate-300 font-sans">{alert.reply}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
          )}

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
