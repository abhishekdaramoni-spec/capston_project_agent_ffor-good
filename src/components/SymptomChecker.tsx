import React, { useState, useEffect } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Clock,
  Shield,
  ShieldAlert,
  Brain,
  RefreshCw,
  FileText,
  User,
  Heart,
  Plus,
  Trash2
} from "lucide-react";
import { SavedMedicine, SavedReport, HealthReport, RiskLevel, AgentStep } from "../types";

interface SymptomCheckerProps {
  savedMedicines: SavedMedicine[];
  onReportCreated: (report: HealthReport) => void;
  theme: "light" | "dark" | "contrast";
  fontSize: "normal" | "large";
}

export function SymptomChecker({
  savedMedicines,
  onReportCreated,
  theme,
  fontSize
}: SymptomCheckerProps) {
  // Wizard flow states
  const [wizardStep, setWizardStep] = useState(1);
  const [age, setAge] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [duration, setDuration] = useState("");
  const [allergies, setAllergies] = useState("");
  const [selectedMedicines, setSelectedMedicines] = useState<string[]>([]);
  const [additionalMedicines, setAdditionalMedicines] = useState("");

  // Running and stream states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [currentStepId, setCurrentStepId] = useState<string>("planning");
  const [reportResult, setReportResult] = useState<HealthReport | null>(null);

  // Multi-Agent Monitor steps
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([
    { id: "planning", name: "Planner Agent", icon: "🧠", status: "idle", explanation: "Analyzes inputs and chooses appropriate medical sub-agents.", progress: 0 },
    { id: "reading_label", name: "OCR Label Reader Agent", icon: "📷", status: "idle", explanation: "Reads physical packaging photos to extract instructions.", progress: 0 },
    { id: "checking_info", name: "Medicine Information Agent", icon: "💊", status: "idle", explanation: "Gathers official monograph details and guidelines.", progress: 0 },
    { id: "understanding_symptoms", name: "Symptom Analysis Agent", icon: "🤒", status: "idle", explanation: "Cross-references symptoms with care metrics.", progress: 0 },
    { id: "checking_interactions", name: "Drug Interaction Agent", icon: "⚠", status: "idle", explanation: "Scans for negative active compound conflicts.", progress: 0 },
    { id: "checking_dosage", name: "Dosage Safety Agent", icon: "📏", status: "idle", explanation: "Checks age-specific maximum schedules and rules.", progress: 0 },
    { id: "emergency_signs", name: "Emergency Detection Agent", icon: "🚑", status: "idle", explanation: "Audits for severe red-flags needing urgent care.", progress: 0 },
    { id: "assessing_risk", name: "Risk Prediction Agent", icon: "📊", status: "idle", explanation: "Computes baseline triage urgency rating levels.", progress: 0 },
    { id: "reviewing_results", name: "Reflection Agent", icon: "🔍", status: "idle", explanation: "Audits outputs to remove jargon and contradictions.", progress: 0 },
    { id: "preparing_report", name: "Report Builder Agent", icon: "📄", status: "idle", explanation: "Constructs friendly personal report summaries.", progress: 0 }
  ]);

  // Handle defaults from saved medicines
  useEffect(() => {
    setSelectedMedicines(savedMedicines.map(m => m.name));
  }, [savedMedicines]);

  // Toggle medicine check
  const toggleSelectMedicine = (name: string) => {
    if (selectedMedicines.includes(name)) {
      setSelectedMedicines(selectedMedicines.filter((m) => m !== name));
    } else {
      setSelectedMedicines([...selectedMedicines, name]);
    }
  };

  const handleNext = () => {
    if (wizardStep === 1 && (!age || parseInt(age) <= 0)) return;
    if (wizardStep === 2 && !symptoms.trim()) return;
    if (wizardStep === 3 && !duration.trim()) return;
    setWizardStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (wizardStep > 1) {
      setWizardStep((prev) => prev - 1);
    }
  };

  // Helper to append quick tag values
  const addQuickTag = (tagType: "duration" | "allergy", value: string) => {
    if (tagType === "duration") {
      setDuration(value);
    } else {
      setAllergies((prev) => (prev ? `${prev}, ${value}` : value));
    }
  };

  // Run multi-agent stream
  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setReportResult(null);

    // Combine manual and checklist medications
    const combinedMedicines = [...selectedMedicines];
    if (additionalMedicines.trim()) {
      additionalMedicines.split(",").forEach(m => {
        const cleaned = m.trim();
        if (cleaned && !combinedMedicines.includes(cleaned)) {
          combinedMedicines.push(cleaned);
        }
      });
    }

    // Reset Agent Step Monitors
    setAgentSteps((steps) => steps.map((s) => ({ ...s, status: "idle", progress: 0, timeSpent: undefined })));

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          age: age || "30",
          symptoms: symptoms || "Unspecified",
          duration: duration || "A brief period",
          allergies: allergies || "None declared",
          existingMedicines: combinedMedicines
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned error status ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      if (!reader) {
        throw new Error("No readable stream response found.");
      }

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const eventData = JSON.parse(line.substring(6));
              
              if (eventData.error) {
                throw new Error(eventData.error);
              }

              const { stepId, status, explanation, progress, timeSpent, data } = eventData;

              // Update corresponding agent step visually
              setAgentSteps((prevSteps) =>
                prevSteps.map((step) => {
                  if (step.id === stepId) {
                    // Extract extra metadata from data if present
                    let conf = data?.confidence || data?.confidenceLevel;
                    let reason = data?.reasoning;
                    let warn = data?.warning || undefined;
                    if (!warn) {
                      if (stepId === "checking_interactions" && data?.severity !== "None") {
                        warn = `${data?.severity} interaction found!`;
                      } else if (stepId === "emergency_signs" && data?.isEmergency) {
                        warn = "🚨 Severe indicators found!";
                      }
                    }

                    return {
                      ...step,
                      status,
                      explanation: explanation || step.explanation,
                      progress,
                      timeSpent: timeSpent !== undefined ? timeSpent : step.timeSpent,
                      confidence: conf !== undefined ? conf : step.confidence,
                      reasoning: reason !== undefined ? reason : step.reasoning,
                      warning: warn !== undefined ? warn : step.warning
                    };
                  }
                  
                  // Auto mark previous steps as checked
                  if (status === "running" || status === "success") {
                    const stepSequence = [
                      "planning", "reading_label", "checking_info", "understanding_symptoms",
                      "checking_interactions", "checking_dosage", "emergency_signs", "assessing_risk",
                      "reviewing_results", "preparing_report"
                    ];
                    const currentIndex = stepSequence.indexOf(stepId);
                    const iterIndex = stepSequence.indexOf(step.id);
                    if (iterIndex !== -1 && iterIndex < currentIndex && step.status !== "success") {
                      return { ...step, status: "success", progress: 100 };
                    }
                  }
                  return step;
                })
              );

              if (stepId) {
                setCurrentStepId(stepId);
              }

              if (stepId === "preparing_report" && status === "success" && data) {
                setReportResult(data);
                onReportCreated(data);
              }

            } catch (err) {
              console.error("Error parsing streamed chunk:", err);
            }
          }
        }
      }

    } catch (err: any) {
      console.error("Analysis streaming failed:", err);
      setAnalysisError(err.message || "An error occurred connecting to the medical AI agent service.");
    } finally {
      setIsAnalyzing(false);
    }
  };

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
      {/* Step Indicators */}
      {!reportResult && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-blue-500/15 text-blue-300 px-3 py-1 rounded-full font-mono">
              Step {wizardStep} of 6
            </span>
            <span className="text-xs text-slate-400">
              {wizardStep === 1 && "Patient Demographics"}
              {wizardStep === 2 && "Primary Symptoms"}
              {wizardStep === 3 && "Symptom Duration"}
              {wizardStep === 4 && "Allergy Ledger"}
              {wizardStep === 5 && "Medication Baseline"}
              {wizardStep === 6 && "Begin AI Assessment"}
            </span>
          </div>
          
          <div className="w-32 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${(wizardStep / 6) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Main Form Box */}
      {!reportResult && (
        <div className={`p-6 sm:p-8 rounded-[32px] border transition-all duration-300 ${
          theme === "light" ? "bg-white border-slate-200 shadow-sm" : theme === "contrast" ? "bg-black border-white" : "bg-white/5 border-white/10"
        }`}>
          
          {/* Step 1: Age */}
          {wizardStep === 1 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-100">What is your age?</h3>
                <p className="text-xs text-slate-400">We utilize your age to calibrate specialized pediatric or geriatric safety indexes.</p>
              </div>

              <div className="pt-2 max-w-xs">
                <label htmlFor="input-age" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Age (in years)</label>
                <input
                  id="input-age"
                  type="number"
                  placeholder="e.g. 35"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  min="1"
                  max="120"
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:border-blue-500 text-slate-100 text-sm outline-none transition-all font-mono"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleNext}
                  disabled={!age || parseInt(age) <= 0}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  Next Question <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Symptoms */}
          {wizardStep === 2 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-100">Describe your symptoms</h3>
                <p className="text-xs text-slate-400">Tell us how you are feeling in simple, everyday conversational terms.</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="input-symptoms" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">How do you feel?</label>
                <textarea
                  id="input-symptoms"
                  rows={4}
                  placeholder="e.g., I have a dull headache around my eyes, slightly stiff neck, and light sensitivity since I woke up."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  required
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl focus:border-blue-500 text-slate-100 text-sm outline-none transition-all resize-none"
                />
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  onClick={handleBack}
                  className="px-5 py-3 border border-white/10 rounded-2xl text-slate-300 text-xs font-semibold hover:bg-white/5 transition-all cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={!symptoms.trim()}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  Next Question <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Duration */}
          {wizardStep === 3 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-100">How long have you had this?</h3>
                <p className="text-xs text-slate-400">Duration helps our planning agent identify chronic or acute conditions.</p>
              </div>

              <div className="space-y-3">
                <label htmlFor="input-duration" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimated Duration</label>
                <input
                  id="input-duration"
                  type="text"
                  placeholder="e.g. 2 days, since yesterday, one week"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required
                  className="w-full max-w-sm px-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:border-blue-500 text-slate-100 text-sm outline-none transition-all"
                />

                <div className="flex flex-wrap gap-2 pt-1">
                  {["Since this morning", "Just a few hours", "2 days", "5 days", "More than a week"].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => addQuickTag("duration", d)}
                      className="px-3 py-1.5 bg-white/5 border border-white/5 hover:bg-blue-500/10 rounded-xl text-xs text-slate-300 transition-colors cursor-pointer"
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  onClick={handleBack}
                  className="px-5 py-3 border border-white/10 rounded-2xl text-slate-300 text-xs font-semibold hover:bg-white/5 transition-all cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={!duration.trim()}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  Next Question <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Allergies */}
          {wizardStep === 4 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-100">Do you have any allergies?</h3>
                <p className="text-xs text-slate-400">Our safety check cross-references active chemical compound classes against your allergen ledger.</p>
              </div>

              <div className="space-y-3">
                <label htmlFor="input-allergies" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">List Allergies</label>
                <input
                  id="input-allergies"
                  type="text"
                  placeholder="e.g. Penicillin, Peanuts, none"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  className="w-full max-w-md px-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:border-blue-500 text-slate-100 text-sm outline-none transition-all"
                />

                <div className="flex flex-wrap gap-2 pt-1">
                  {["None", "Penicillin", "Sulfa drugs", "Aspirin allergy", "Peanuts", "Dairy"].map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => addQuickTag("allergy", a)}
                      className="px-3 py-1.5 bg-white/5 border border-white/5 hover:bg-blue-500/10 rounded-xl text-xs text-slate-300 transition-colors cursor-pointer"
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  onClick={handleBack}
                  className="px-5 py-3 border border-white/10 rounded-2xl text-slate-300 text-xs font-semibold hover:bg-white/5 transition-all cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  Next Question <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Existing Medications */}
          {wizardStep === 5 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-100">Are you currently taking medications?</h3>
                <p className="text-xs text-slate-400">To check for conflicts, select items from your virtual cabinet or type them below.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Check medications from cabinet:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
                    {savedMedicines.map((med) => {
                      const selected = selectedMedicines.includes(med.name);
                      return (
                        <button
                          key={med.id}
                          type="button"
                          onClick={() => toggleSelectMedicine(med.name)}
                          className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                            selected 
                              ? "bg-blue-600/15 border-blue-500 text-white" 
                              : "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          <div>
                            <p className="text-xs font-bold">{med.name}</p>
                            <p className="text-[9px] text-slate-400 truncate max-w-[150px]">{med.purpose}</p>
                          </div>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            selected ? "bg-blue-500 border-transparent text-white" : "border-slate-500"
                          }`}>
                            {selected && <CheckCircle className="w-3 h-3 text-white" />}
                          </div>
                        </button>
                      );
                    })}

                    {savedMedicines.length === 0 && (
                      <div className="p-4 text-center text-slate-500 text-xs italic border border-white/5 rounded-xl col-span-2">
                        Cabinet is currently empty.
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="input-additional-meds" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Other Medications (Comma separated)</label>
                  <input
                    id="input-additional-meds"
                    type="text"
                    placeholder="e.g. Aspirin, Ibuprofen, Vitamin C"
                    value={additionalMedicines}
                    onChange={(e) => setAdditionalMedicines(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:border-blue-500 text-slate-100 text-sm outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  onClick={handleBack}
                  className="px-5 py-3 border border-white/10 rounded-2xl text-slate-300 text-xs font-semibold hover:bg-white/5 transition-all cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  Review Details <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 6: Confirmation Review */}
          {wizardStep === 6 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-100 font-display">Confirm & Run Analysis</h3>
                <p className="text-xs text-slate-400">Review your compiled details before triggering the medical AI planning agent.</p>
              </div>

              {/* Triage summary list */}
              <div className="p-4 bg-slate-800/20 border border-white/5 rounded-2xl space-y-3 text-xs text-slate-300 font-sans">
                <div className="grid grid-cols-2 gap-3">
                  <p><strong className="text-slate-400">Age profile:</strong> {age} years</p>
                  <p><strong className="text-slate-400">Duration:</strong> {duration}</p>
                </div>
                <p><strong className="text-slate-400">Symptoms summary:</strong> "{symptoms}"</p>
                <p><strong className="text-slate-400">Allergies listed:</strong> {allergies || "None declared"}</p>
                <p><strong className="text-slate-400">Coordinated medicines:</strong> {[...selectedMedicines, ...(additionalMedicines ? additionalMedicines.split(",").map(m=>m.trim()) : [])].filter(Boolean).join(", ") || "None"}</p>
              </div>

              {analysisError && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-xs text-rose-300 flex items-start gap-2 animate-shake">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Stream Error</p>
                    <p>{analysisError}</p>
                  </div>
                </div>
              )}

              {/* High-End Real-Time Multi-Agent Monitor Grid */}
              {isAnalyzing && (
                <div className="p-5 bg-slate-900/40 border border-blue-500/20 rounded-3xl space-y-4 shadow-inner">
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <span className="text-xs font-mono text-blue-400 flex items-center gap-2 uppercase font-bold tracking-wider">
                      <Brain className="w-4 h-4 animate-spin text-blue-400" /> Coordinated Multi-Agent Execution Panel
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                      ACTIVE REAL-TIME PIPELINE
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
                    {agentSteps.map((step) => {
                      const isActive = currentStepId === step.id;
                      const isSuccess = step.status === "success";
                      const isRunning = step.status === "running" || (isActive && step.status !== "success");
                      const isSkipped = step.status === "success" && step.timeSpent === 0 && step.explanation.includes("skipped");
                      
                      let statusText = "Waiting";
                      let statusColor = "text-slate-500 bg-slate-500/10 border-slate-500/10";
                      
                      if (isRunning) {
                        statusText = "Running";
                        statusColor = "text-blue-400 bg-blue-500/10 border-blue-500/20 animate-pulse font-bold";
                      } else if (isSkipped) {
                        statusText = "Skipped";
                        statusColor = "text-amber-500/75 bg-amber-500/5 border-amber-500/10";
                      } else if (isSuccess) {
                        statusText = "Completed";
                        statusColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 font-bold";
                      } else if (step.status === "failed") {
                        statusText = "Failed";
                        statusColor = "text-rose-400 bg-rose-500/10 border-rose-500/20 font-bold";
                      }

                      return (
                        <div key={step.id} className={`p-3 rounded-2xl border transition-all duration-300 ${
                          isRunning ? "bg-blue-500/5 border-blue-500/30 shadow-md scale-[1.01]" : "bg-white/5 border-white/5"
                        }`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg shrink-0">{step.icon}</span>
                              <div>
                                <h5 className="text-xs font-bold text-slate-200">{step.name}</h5>
                                <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{step.explanation}</p>
                              </div>
                            </div>
                            <span className={`text-[9px] font-mono px-2 py-0.5 rounded border shrink-0 uppercase tracking-wide ${statusColor}`}>
                              {statusText}
                            </span>
                          </div>

                          {/* Progress bar / Confidence & timing for completed or running agents */}
                          {(isRunning || isSuccess) && !isSkipped && (
                            <div className="mt-2.5 pt-2 border-t border-white/5 space-y-2">
                              {/* Progress bar */}
                              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-500 ${isSuccess ? "bg-emerald-500" : "bg-blue-500 animate-pulse"}`}
                                  style={{ width: `${step.progress}%` }}
                                ></div>
                              </div>

                              <div className="flex flex-wrap items-center justify-between text-[9px] font-mono text-slate-400 gap-2">
                                {step.timeSpent !== undefined && step.timeSpent > 0 && (
                                  <span>Time Spent: <strong className="text-slate-200">{(step.timeSpent / 1000).toFixed(2)}s</strong></span>
                                )}
                                {step.confidence !== undefined && step.confidence > 0 && (
                                  <span>Confidence: <strong className={step.confidence > 90 ? "text-emerald-400" : "text-blue-400"}>{step.confidence}%</strong></span>
                                )}
                              </div>

                              {/* Warning notifications */}
                              {step.warning && (
                                <div className="p-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[9px] text-amber-300 font-medium flex items-center gap-1 animate-pulse">
                                  <span>⚠️</span> {step.warning}
                                </div>
                              )}

                              {/* Reasoning notes */}
                              {step.reasoning && (
                                <p className="text-[9px] text-slate-400 italic bg-white/5 p-1.5 rounded-lg leading-tight border border-white/5">
                                  <strong className="text-blue-300 not-italic font-bold">Reasoning:</strong> {step.reasoning}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-between items-center">
                <button
                  onClick={handleBack}
                  disabled={isAnalyzing}
                  className="px-5 py-3 border border-white/10 rounded-2xl text-slate-300 text-xs font-semibold hover:bg-white/5 disabled:opacity-30 transition-all cursor-pointer"
                >
                  Back
                </button>

                <button
                  onClick={runAnalysis}
                  disabled={isAnalyzing}
                  className={`px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    isAnalyzing ? "opacity-50 cursor-not-allowed animate-pulse" : ""
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4.5 h-4.5 animate-spin" /> Stream-triage compiling...
                    </>
                  ) : (
                    <>
                      <Activity className="w-4 h-4" /> Start AI Health Assessment
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* 5. Live Comprehensive Diagnostic Output */}
      {reportResult && (
        <section id="compiled-health-report" className={`p-6 sm:p-8 rounded-[40px] border shadow-2xl relative overflow-hidden transition-all duration-500 ${
          theme === "light" ? "bg-white border-slate-200" : theme === "contrast" ? "bg-black border-white" : "bg-gradient-to-br from-slate-900/90 via-[#0E1729]/95 to-[#0A1220]/95 border-blue-500/20"
        }`}>
          
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-600"></div>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 border-b border-white/10 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
                <CheckCircle className="w-3.5 h-3.5" /> Assessment Compiled Successfully
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-100 font-display">Triage Evaluation Report</h3>
              <p className="text-xs text-slate-400 mt-1 font-mono">Completed {new Date(reportResult.timestamp).toLocaleTimeString()}</p>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
              <span className={`text-xs font-bold px-3.5 py-2 rounded-full border flex items-center gap-1.5 ${getRiskColors(reportResult.riskLevel).bg}`}>
                <span className={`w-2 h-2 rounded-full ${getRiskColors(reportResult.riskLevel).dot}`}></span>
                {reportResult.riskLevel} Triage Urgency
              </span>
              <p className="text-[10px] text-slate-500 font-mono mt-1">ID: {reportResult.id}</p>
            </div>
          </div>

          <div className="space-y-6 font-sans">
            
            {/* Section: Patient Overview */}
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <h4 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2 font-mono">Clinical Profile Overview</h4>
              <p className="text-sm text-slate-200 leading-relaxed font-serif italic">
                "{reportResult.symptomsSummary}"
              </p>
            </div>

            {/* Emergency Warn */}
            {reportResult.emergencyWarning && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3 animate-pulse">
                <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-rose-300 uppercase tracking-widest font-mono">🚨 IMMEDIATE ADVISORY NOTICE</h5>
                  <p className="text-xs text-rose-200 mt-1 leading-relaxed font-semibold">
                    {reportResult.emergencyWarning}
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
                  {reportResult.possibleCauses.map((cause, i) => (
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
                  reportResult.drugInteraction.hasInteraction 
                    ? "bg-amber-500/5 border-amber-500/20" 
                    : "bg-emerald-500/5 border-emerald-500/10"
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className={`w-4 h-4 ${reportResult.drugInteraction.hasInteraction ? "text-amber-400" : "text-emerald-400"}`} />
                    <p className="text-xs font-bold text-slate-200 font-mono">
                      OVERLAP SEVERITY: {reportResult.drugInteraction.severity}
                    </p>
                  </div>
                  
                  <p className="text-xs text-slate-300 leading-relaxed italic border-l border-white/20 pl-3">
                    "{reportResult.drugInteraction.explanation}"
                  </p>
                </div>
              </div>

            </div>

            {/* Urgency breakdown */}
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-300 mb-1.5 font-mono">Safety Index Justification</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {reportResult.riskLevelExplanation}
              </p>
            </div>

            {/* Next actions list */}
            <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-widest text-blue-300 font-mono">Recommended Care Procedures</h4>
              <ul className="space-y-2">
                {reportResult.whatToDoNext.map((step, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex gap-2 items-start leading-relaxed">
                    <span className="text-blue-400 font-bold shrink-0 mt-0.5">•</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Restart button */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  setReportResult(null);
                  setWizardStep(1);
                  setAge("");
                  setSymptoms("");
                  setDuration("");
                  setAllergies("");
                  setAdditionalMedicines("");
                }}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Run Another Symptom Check
              </button>
            </div>

            {/* Footer medical notice */}
            <div className="border-t border-white/10 pt-4 text-center">
              <p className="text-[10px] text-slate-500 leading-normal italic max-w-lg mx-auto">
                Always verify the drug monographs printed physically on packaging boxes. This tool is designed for educational triage assessments and is not a professional diagnostic replacement.
              </p>
            </div>

          </div>
        </section>
      )}

    </div>
  );
}
