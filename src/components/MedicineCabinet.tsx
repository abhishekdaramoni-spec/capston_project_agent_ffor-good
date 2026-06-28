import React, { useState } from "react";
import {
  BookOpen,
  Plus,
  Trash2,
  X,
  CheckCircle,
  Clock
} from "lucide-react";
import { SavedMedicine } from "../types";

interface MedicineCabinetProps {
  savedMedicines: SavedMedicine[];
  onAddMedicine: (med: SavedMedicine) => void;
  onDeleteMedicine: (id: string) => void;
  theme: "light" | "dark" | "contrast";
}

export function MedicineCabinet({
  savedMedicines,
  onAddMedicine,
  onDeleteMedicine,
  theme
}: MedicineCabinetProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddMedicine({
      id: "med_" + Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      purpose: purpose.trim() || "General health support",
      dosage: dosage.trim() || "As needed",
      frequency: frequency.trim() || "Once daily",
      addedAt: new Date().toISOString()
    });

    setName("");
    setPurpose("");
    setDosage("");
    setFrequency("");
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-100 font-display">Virtual Medicine Cabinet</h3>
          <p className="text-xs text-slate-400">
            Keep track of your current prescription list to support active multi-agent interaction auditing.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? "Cancel" : "Add Medicine"}
        </button>
      </div>

      {/* Manual Entry Form */}
      {showForm && (
        <form 
          onSubmit={handleSubmit} 
          className={`p-5 rounded-2xl border space-y-4 transition-all duration-300 ${
            theme === "light" ? "bg-slate-50 border-slate-200" : "bg-white/5 border-white/5"
          }`}
        >
          <p className="text-xs font-bold text-slate-200 uppercase tracking-wide font-mono">Register New Medication</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cab-med-name" className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Medication Brand / Name</label>
              <input
                id="cab-med-name"
                type="text"
                placeholder="e.g. Tylenol (500mg)"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="cab-med-purpose" className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Purpose / Indication</label>
              <input
                id="cab-med-purpose"
                type="text"
                placeholder="e.g. Fever reduction & pain"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cab-med-dosage" className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Dosage Strengths</label>
              <input
                id="cab-med-dosage"
                type="text"
                placeholder="e.g. 1 pill as needed"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="cab-med-freq" className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Timing Schedule instructions</label>
              <input
                id="cab-med-freq"
                type="text"
                placeholder="e.g. Every 6 hours with food"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Save to My Cabinet
          </button>
        </form>
      )}

      {/* Medicines list Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {savedMedicines.map((med) => (
          <div 
            key={med.id} 
            className={`p-5 rounded-3xl border flex items-start justify-between transition-all duration-300 ${
              theme === "light" ? "bg-white border-slate-200" : "bg-white/5 border-white/5 hover:bg-white/[0.08]"
            }`}
          >
            <div className="space-y-1.5 flex-1 min-w-0 pr-3">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-slate-100 truncate">{med.name}</p>
                <span className="text-[9px] font-mono font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0">
                  {med.dosage}
                </span>
              </div>
              <p className="text-xs text-slate-300"><strong className="text-slate-500">Purpose:</strong> {med.purpose}</p>
              <p className="text-xs text-slate-400 flex items-center gap-1"><strong className="text-slate-500">Timing:</strong> {med.frequency}</p>
            </div>

            <button
              onClick={() => onDeleteMedicine(med.id)}
              className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 rounded-xl border border-transparent transition-all cursor-pointer shrink-0"
              title="Delete drug entry"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        {savedMedicines.length === 0 && (
          <div className="col-span-2 p-12 text-center bg-white/5 rounded-3xl border border-white/5 text-slate-400 italic text-xs">
            No registered medicines in your cabinet database. Upload a label photo scan to instantly verify and save the drug monograph information.
          </div>
        )}
      </div>

    </div>
  );
}
