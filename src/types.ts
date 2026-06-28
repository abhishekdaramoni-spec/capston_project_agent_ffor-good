export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Critical';

export interface MedicineInfo {
  name: string;
  purpose: string;
  commonUses: string;
  sideEffects: string[];
  warnings: string[];
  confidenceLevel: number; // 0-100
  confidenceText: string;

  // Extended OCR fields
  genericName?: string;
  strength?: string;
  dosageForm?: string;
  manufacturer?: string;
  batchNumber?: string;
  manufacturingDate?: string;
  expiryDate?: string;
  composition?: string;
  storageInstructions?: string;

  // Extended AI Analysis fields
  howItWorks?: string;
  pregnancyWarning?: string;
  childSafety?: string;
  storageAdvice?: string;

  // Interactions list for the scanned medicine
  interactions?: {
    medicineName: string;
    severity: "None" | "Mild" | "Moderate" | "Serious";
    explanation: string;
  }[];
}

export interface DrugInteractionResult {
  hasInteraction: boolean;
  severity: 'None' | 'Mild' | 'Moderate' | 'High';
  explanation: string; // explained in very simple terms
}

export interface PossibleCause {
  condition: string;
  explanation: string; // in simple everyday language
  likelihood: 'Low' | 'Medium' | 'High';
}

export interface HealthReport {
  id: string;
  timestamp: string;
  age: string;
  symptoms: string;
  duration: string;
  allergies: string;
  existingMedicines: string[];
  scannedMedicine?: MedicineInfo;
  
  // Multi-Agent Analysis Output
  symptomsSummary: string;
  possibleCauses: PossibleCause[];
  drugInteraction: DrugInteractionResult;
  riskLevel: RiskLevel;
  riskLevelExplanation: string; // warm, simple terms
  whatToDoNext: string[];
  emergencyWarning?: string; // high warning or undefined
}

export interface AgentStep {
  id: string;
  name: string;
  icon: string;
  status: 'idle' | 'running' | 'success' | 'failed';
  explanation: string;
  progress: number; // 0-100
  timeSpent?: number; // in milliseconds
  confidence?: number;
  reasoning?: string;
  warning?: string;
}

export interface SavedMedicine {
  id: string;
  name: string;
  purpose: string;
  dosage: string;
  frequency: string;
  addedAt: string;
}

export interface SavedReminder {
  id: string;
  time: string;
  medicineName: string;
  completed: boolean;
}

export interface SavedReport {
  id: string;
  date: string;
  symptoms: string;
  riskLevel: RiskLevel;
}

export interface AppState {
  currentStep: number; // For step-by-step symptom checker
  theme: 'light' | 'dark' | 'contrast';
  fontSize: 'normal' | 'large';
  reports: HealthReport[];
  medicines: SavedMedicine[];
  reminders: SavedReminder[];
}
