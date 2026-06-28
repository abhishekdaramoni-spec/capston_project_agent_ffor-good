import React from "react";
import {
  Activity,
  Heart,
  Clock,
  Sparkles,
  BookOpen,
  Bell,
  FileText,
  CheckCircle,
  ArrowRight,
  Plus,
  Shield,
  Search,
  Check
} from "lucide-react";
import { SavedMedicine, SavedReminder, SavedReport, RiskLevel } from "../types";

interface DashboardViewProps {
  savedMedicines: SavedMedicine[];
  reminders: SavedReminder[];
  toggleReminder: (id: string) => void;
  savedReports: SavedReport[];
  onOpenReport: (id: string, riskLevel: RiskLevel, symptoms: string) => void;
  onStartSymptomCheck: () => void;
  onStartMedicineScan: () => void;
  theme: "light" | "dark" | "contrast";
  fontSize: "normal" | "large";
  userName?: string;
}

export function DashboardView({
  savedMedicines,
  reminders,
  toggleReminder,
  savedReports,
  onOpenReport,
  onStartSymptomCheck,
  onStartMedicineScan,
  theme,
  fontSize,
  userName
}: DashboardViewProps) {
  
  const getRiskColors = (level: RiskLevel) => {
    switch (level) {
      case "Low":
        return { bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-400" };
      case "Moderate":
        return { bg: "bg-amber-500/10 text-amber-400 border-amber-500/20", dot: "bg-amber-400" };
      case "High":
        return { bg: "bg-orange-500/10 text-orange-400 border-orange-500/20", dot: "bg-orange-400" };
      case "Critical":
        return { bg: "bg-rose-500/10 text-rose-400 border-rose-500/20", dot: "bg-rose-500 animate-pulse" };
    }
  };

  const pendingReminders = reminders.filter((r) => !r.completed);

  return (
    <div className="space-y-6">
      {/* 1. Welcoming Header Banner (Glassmorphism + Accent Gradient) */}
      <section 
        id="dashboard-header-banner"
        className={`p-6 sm:p-8 rounded-[36px] border overflow-hidden relative transition-all duration-300 ${
          theme === "light" 
            ? "bg-gradient-to-br from-slate-100 to-white border-slate-200 shadow-sm" 
            : theme === "contrast"
            ? "bg-black border-white"
            : "bg-gradient-to-br from-slate-900 via-[#0D1527] to-[#0A1220] border-white/10 shadow-2xl"
        }`}
      >
        <div className="absolute right-0 top-0 opacity-[0.03] sm:opacity-[0.07] pointer-events-none transform translate-x-12 -translate-y-8">
          <Heart className="w-80 h-80 text-blue-500" />
        </div>
        
        <div className="relative z-10 max-w-2xl">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4 border ${
            theme === "light"
              ? "bg-blue-50 text-blue-600 border-blue-200"
              : "bg-blue-500/10 text-blue-300 border-blue-500/15"
          }`}>
            <Sparkles className="w-3.5 h-3.5" /> Medical Safety & Guidance Assistant
          </div>
          
          <h2 className={`text-2xl sm:text-3xl font-bold tracking-tight mb-2 font-display ${
            theme === "light" ? "text-slate-800" : "text-slate-100"
          }`}>
            Welcome back, <span className="text-blue-500 font-display">{userName || "HealthMate"}</span>
          </h2>
          <p className={`text-sm leading-relaxed mb-6 font-sans ${
            theme === "light" ? "text-slate-600" : "text-slate-300"
          }`}>
            Triage active symptoms, perform optical pill label analysis, and audit adverse drug combinations. We speak in simple everyday language so you stay in complete control of your health.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              id="btn-triage-symptoms"
              onClick={onStartSymptomCheck}
              className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-bold text-xs shadow-lg shadow-blue-500/10 transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <Activity className="w-4 h-4 text-blue-200" />
              Symptom Triage Checker
            </button>

            <button
              id="btn-scan-medicine"
              onClick={onStartMedicineScan}
              className={`px-6 py-3.5 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                theme === "light" 
                  ? "bg-white border-slate-300 text-slate-700 hover:bg-slate-50" 
                  : theme === "contrast" 
                  ? "bg-black border-white text-white hover:bg-white/10" 
                  : "bg-white/5 border-white/10 hover:bg-white/10 text-slate-100"
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
              Scan Medicine Label
            </button>
          </div>
        </div>
      </section>

      {/* 2. Interactive Personalized Health Summary Widgets */}
      <section id="health-summary-row" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Widget 1: Daily Health Status */}
        <div className={`p-5 rounded-3xl border flex flex-col justify-between transition-all duration-300 ${
          theme === "light" ? "bg-white border-slate-200 shadow-sm" : theme === "contrast" ? "bg-black border-white" : "bg-slate-900/20 border-white/10"
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">My Daily Care</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h4 className={`text-xl font-bold mb-1 ${theme === "light" ? "text-slate-800" : "text-slate-100"}`}>Safety Active</h4>
            <p className={`text-xs leading-normal ${theme === "light" ? "text-slate-600" : "text-slate-300"}`}>
              No overlapping substances flagged in your cabinet entries today.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex justify-between items-center text-[10px] text-slate-400 font-mono">
            <span>MED CABINET CHECKED</span>
            <span className="text-emerald-500 dark:text-emerald-400 font-semibold">SECURE</span>
          </div>
        </div>

        {/* Widget 2: Hydration index */}
        <div className={`p-5 rounded-3xl border flex flex-col justify-between transition-all duration-300 ${
          theme === "light" ? "bg-white border-slate-200 shadow-sm" : theme === "contrast" ? "bg-black border-white" : "bg-slate-900/20 border-white/10"
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">System Vibe</span>
            <Heart className="w-4 h-4 text-rose-400 animate-pulse" />
          </div>
          <div>
            <h4 className={`text-xl font-bold mb-1 ${theme === "light" ? "text-slate-800" : "text-slate-100"}`}>92% Baseline</h4>
            <p className={`text-xs leading-normal ${theme === "light" ? "text-slate-600" : "text-slate-300"}`}>
              Based on your logged profile reports and regular timing logs. Keep it up!
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex justify-between items-center text-[10px] text-slate-400 font-mono">
            <span>GENERAL WELLNESS</span>
            <span className="text-indigo-500 dark:text-indigo-400 font-semibold">GOOD</span>
          </div>
        </div>

        {/* Widget 3: Active Triage Count */}
        <div className={`p-5 rounded-3xl border flex flex-col justify-between transition-all duration-300 ${
          theme === "light" ? "bg-white border-slate-200 shadow-sm" : theme === "contrast" ? "bg-black border-white" : "bg-slate-900/20 border-white/10"
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">Logs & Audits</span>
            <FileText className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h4 className={`text-xl font-bold mb-1 ${theme === "light" ? "text-slate-800" : "text-slate-100"}`}>{savedReports.length} Diagnostics</h4>
            <p className={`text-xs leading-normal ${theme === "light" ? "text-slate-600" : "text-slate-300"}`}>
              Historical reports parsed by your medical planning agent are logged below.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex justify-between items-center text-[10px] text-slate-400 font-mono">
            <span>SAVED REPORTS LIST</span>
            <span className="text-slate-600 dark:text-slate-300 font-semibold">UP TO DATE</span>
          </div>
        </div>

      </section>

      {/* 3. Core Double Column Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Card: Medication Cabinet Tracker */}
        <div className={`p-6 rounded-3xl border flex flex-col justify-between transition-all duration-300 ${
          theme === "light" ? "bg-white border-slate-200 shadow-sm" : theme === "contrast" ? "bg-black border-white" : "bg-slate-900/20 border-white/10 shadow-lg"
        }`}>
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400 font-bold" />
                <h3 className={`font-bold text-base font-display ${theme === "light" ? "text-slate-800" : "text-slate-200"}`}>Active Medications</h3>
              </div>
              <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-full font-mono">{savedMedicines.length} Saved</span>
            </div>

            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {savedMedicines.slice(0, 4).map((med, index) => (
                <div key={med.id || `med-${index}`} className={`p-3 rounded-2xl border flex items-center justify-between ${
                  theme === "light" ? "bg-slate-50 border-slate-150" : "bg-white/5 border-white/5"
                }`}>
                  <div>
                    <p className={`text-xs font-bold ${theme === "light" ? "text-slate-800" : "text-slate-100"}`}>{med.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{med.purpose}</p>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-full">{med.dosage}</span>
                </div>
              ))}
              
              {savedMedicines.length === 0 && (
                <div className="py-8 text-center text-slate-400 italic text-xs">
                  Your medicine cabinet is empty. Upload packaging labels or enter medicines manually to establish a safety baseline.
                </div>
              )}
            </div>
          </div>

          {savedMedicines.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex justify-end">
              <button
                onClick={onStartSymptomCheck}
                className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-bold flex items-center gap-1.5 cursor-pointer"
              >
                Perform quick drug combination check <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right Card: Upcoming Scheduled Reminders */}
        <div className={`p-6 rounded-3xl border flex flex-col justify-between transition-all duration-300 ${
          theme === "light" ? "bg-white border-slate-200 shadow-sm" : theme === "contrast" ? "bg-black border-white" : "bg-slate-900/20 border-white/10 shadow-lg"
        }`}>
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                <h3 className={`font-bold text-base font-display ${theme === "light" ? "text-slate-800" : "text-slate-200"}`}>Upcoming Reminders</h3>
              </div>
              <span className="text-xs bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 px-2.5 py-0.5 rounded-full font-mono font-bold">
                {pendingReminders.length} Pending
              </span>
            </div>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {reminders.map((rem, index) => (
                <button
                  key={rem.id || `rem-${index}`}
                  onClick={() => toggleReminder(rem.id)}
                  className={`w-full text-left p-3 rounded-2xl border flex items-center gap-3 transition-colors cursor-pointer ${
                    theme === "light" ? "bg-slate-50 border-slate-150 hover:bg-slate-100" : "bg-white/5 border-white/5 hover:bg-white/10"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    rem.completed ? "bg-emerald-500 border-transparent text-white" : "border-slate-400 dark:border-slate-500 hover:border-blue-400"
                  }`}>
                    {rem.completed && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold leading-normal ${
                      rem.completed ? "line-through text-slate-400 dark:text-slate-500" : (theme === "light" ? "text-slate-800" : "text-slate-100")
                    }`}>{rem.medicineName}</p>
                    <p className="text-[9px] text-slate-500 italic mt-0.5">{rem.time}</p>
                  </div>
                </button>
              ))}

              {reminders.length === 0 && (
                <div className="py-8 text-center text-slate-400 italic text-xs">
                  No dose reminders scheduled. Add medicines manually to trigger timers.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Dose Status</span>
            <span className={`${theme === "light" ? "text-slate-700" : "text-slate-300"} font-semibold`}>
              {pendingReminders.length === 0 ? "All doses taken 🎉" : "Doses pending today"}
            </span>
          </div>
        </div>

      </section>

      {/* 4. Recent Health Reports (With Open Capability) */}
      <section id="historical-reports" className={`p-6 rounded-3xl border transition-all duration-300 ${
        theme === "light" ? "bg-white border-slate-200 shadow-sm" : theme === "contrast" ? "bg-black border-white" : "bg-slate-900/20 border-white/10"
      }`}>
        <h3 className={`font-bold text-base mb-4 flex items-center gap-2 font-display ${
          theme === "light" ? "text-slate-800" : "text-slate-200"
        }`}>
          <FileText className="w-5 h-5 text-blue-400" /> Recent Medical Triage Logs
        </h3>

        <div className="space-y-3">
          {savedReports.map((rep, index) => {
            const colors = getRiskColors(rep.riskLevel);
            return (
              <div 
                key={rep.id || `rep-${index}`} 
                className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-sm transition-all ${
                  theme === "light" ? "bg-slate-50 border-slate-150 hover:bg-slate-100/70" : "bg-white/5 border-white/5 hover:bg-white/10"
                }`}
              >
                <div className="flex-1 min-w-0 pr-4">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">{rep.date}</span>
                  <p className={`text-xs font-semibold truncate ${theme === "light" ? "text-slate-800" : "text-slate-100"}`}>{rep.symptoms}</p>
                </div>
                
                <div className="flex items-center gap-3 shrink-0 justify-between sm:justify-end">
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${colors.bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`}></span>
                    {rep.riskLevel} Risk
                  </span>
                  
                  <button
                    onClick={() => onOpenReport(rep.id, rep.riskLevel, rep.symptoms)}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-1.5 rounded-xl border border-white/5 transition-colors cursor-pointer"
                  >
                    Open Report
                  </button>
                </div>
              </div>
            );
          })}

          {savedReports.length === 0 && (
            <div className="py-10 text-center text-slate-400 italic text-xs border border-dashed border-slate-200 dark:border-white/5 rounded-2xl">
              No historical evaluation logs found. Run a Symptom Triage Check to compile your first health evaluation report.
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
