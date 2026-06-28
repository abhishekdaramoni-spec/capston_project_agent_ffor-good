import React from "react";
import { FileText, CheckCircle, AlertTriangle } from "lucide-react";
import { SavedReport, RiskLevel } from "../types";

interface ReportsHistoryProps {
  savedReports: SavedReport[];
  onOpenReport: (id: string, riskLevel: RiskLevel, symptoms: string) => void;
  theme: "light" | "dark" | "contrast";
}

export function ReportsHistory({
  savedReports,
  onOpenReport,
  theme
}: ReportsHistoryProps) {

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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-100 font-display">Historical Diagnostics & Triage Logs</h3>
        <p className="text-xs text-slate-400">
          Review past safety and symptom evaluation reports compiled by your HealthMate AI agent system.
        </p>
      </div>

      <div className="space-y-3">
        {savedReports.map((rep, index) => {
          const colors = getRiskColors(rep.riskLevel);
          return (
            <div 
              key={rep.id || `rep-${index}`} 
              className={`p-4 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.08] transition-colors ${
                theme === "light" ? "bg-white border-slate-200" : "bg-white/5 border-white/5"
              }`}
            >
              <div className="flex-1 min-w-0 pr-4">
                <span className="text-[10px] text-slate-400 block font-mono mb-0.5">{rep.date}</span>
                <p className="text-xs font-semibold text-slate-100 truncate">{rep.symptoms}</p>
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
          <div className="p-12 text-center bg-white/5 rounded-3xl border border-white/5 text-slate-400 italic text-xs">
            No historical reports found in database. Compile your first report inside the Symptom Triage Checker.
          </div>
        )}
      </div>
    </div>
  );
}
