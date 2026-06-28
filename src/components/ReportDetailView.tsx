import React from "react";
import {
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Activity,
  Shield,
  ShieldAlert,
  Info
} from "lucide-react";
import { HealthReport, RiskLevel } from "../types";

interface ReportDetailViewProps {
  report: HealthReport;
  onClose: () => void;
  theme: "light" | "dark" | "contrast";
}

export function ReportDetailView({
  report,
  onClose,
  theme
}: ReportDetailViewProps) {
  
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

  const colors = getRiskColors(report.riskLevel);

  return (
    <div id="historical-report-detail-card" className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-xl text-xs text-slate-300 font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to History
        </button>

        <span className="text-xs text-slate-500 font-mono">ID: {report.id}</span>
      </div>

      <div className={`p-6 sm:p-8 rounded-[40px] border shadow-2xl relative overflow-hidden transition-all duration-300 ${
        theme === "light" ? "bg-white border-slate-200" : "bg-gradient-to-br from-slate-900 via-[#0D1527] to-[#0A1220] border-white/10"
      }`}>
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-600"></div>

        {/* Header Metadata */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 border-b border-white/5 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
              <CheckCircle className="w-3.5 h-3.5" /> Historical Diagnostics Loaded
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-100 font-display">Triage Evaluation Report</h3>
            <p className="text-xs text-slate-400 mt-1 font-mono">Compiled on {new Date(report.timestamp).toLocaleString()}</p>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
            <span className={`text-xs font-bold px-3.5 py-2 rounded-full border flex items-center gap-1.5 ${colors.bg}`}>
              <span className={`w-2 h-2 rounded-full ${colors.dot}`}></span>
              {report.riskLevel} Triage Urgency
            </span>
          </div>
        </div>

        <div className="space-y-6 font-sans">
          
          {/* Section: Patient Overview */}
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
            <h4 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2 font-mono">Clinical Profile Overview</h4>
            <p className="text-sm text-slate-200 leading-relaxed font-serif italic">
              "{report.symptomsSummary}"
            </p>
          </div>

          {/* Emergency Alert */}
          {report.emergencyWarning && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3 animate-pulse">
              <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-rose-300 uppercase tracking-widest font-mono">🚨 IMMEDIATE ADVISORY NOTICE</h5>
                <p className="text-xs text-rose-200 mt-1 leading-relaxed font-semibold">
                  {report.emergencyWarning}
                </p>
              </div>
            </div>
          )}

          {/* Two Column details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Causes matches */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-300 flex items-center gap-1 font-mono">
                <Activity className="w-4 h-4 text-emerald-400" /> Diagnostic Explanations
              </h4>

              <div className="space-y-3">
                {report.possibleCauses.map((cause, i) => (
                  <div key={i} className="p-3.5 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-bold text-slate-100">{cause.condition}</p>
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        cause.likelihood === "High" ? "bg-orange-500/10 text-orange-400 border border-orange-500/10" : "bg-blue-500/10 text-blue-300"
                      }`}>
                        {cause.likelihood} Match
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {cause.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactions results */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-300 flex items-center gap-1 font-mono">
                <Shield className="w-4 h-4 text-amber-400" /> Compound Conflict Audit
              </h4>

              <div className={`p-4 rounded-2xl border ${
                report.drugInteraction.hasInteraction 
                  ? "bg-amber-500/5 border-amber-500/20" 
                  : "bg-emerald-500/5 border-emerald-500/10"
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className={`w-4 h-4 ${report.drugInteraction.hasInteraction ? "text-amber-400" : "text-emerald-400"}`} />
                  <p className="text-xs font-bold text-slate-200 font-mono">
                    OVERLAP SEVERITY: {report.drugInteraction.severity}
                  </p>
                </div>
                
                <p className="text-xs text-slate-300 leading-relaxed italic border-l border-white/20 pl-3">
                  "{report.drugInteraction.explanation}"
                </p>
              </div>
            </div>

          </div>

          {/* Urgency justification */}
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-300 mb-1.5 font-mono">Safety Index Justification</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {report.riskLevelExplanation}
            </p>
          </div>

          {/* Next actions list */}
          <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-blue-300 font-mono">Recommended Care Procedures</h4>
            <ul className="space-y-2">
              {report.whatToDoNext.map((step, idx) => (
                <li key={idx} className="text-xs text-slate-300 flex gap-2 items-start leading-relaxed">
                  <span className="text-blue-400 font-bold shrink-0 mt-0.5">•</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Optional scanned medicine detail if present in report */}
          {report.scannedMedicine && (
            <div className="p-4 bg-emerald-500/[0.02] border border-emerald-500/15 rounded-2xl space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-400 font-mono">Scanned Label Profile</h4>
              <p className="text-xs text-slate-100 font-semibold">{report.scannedMedicine.name}</p>
              <p className="text-xs text-slate-300"><strong className="text-slate-400">Purpose:</strong> {report.scannedMedicine.purpose}</p>
              <p className="text-xs text-slate-300"><strong className="text-slate-400">Warnings:</strong> {report.scannedMedicine.warnings.join(", ")}</p>
            </div>
          )}

          {/* Footer medical notice */}
          <div className="border-t border-white/10 pt-4 text-center">
            <p className="text-[10px] text-slate-500 leading-normal italic max-w-lg mx-auto">
              Always verify the drug monographs printed physically on packaging boxes. This tool is designed for educational triage assessments and is not a professional diagnostic replacement.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
