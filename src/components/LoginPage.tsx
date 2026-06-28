import React, { useState } from "react";
import {
  Heart,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  Sparkles,
  User,
  AlertCircle,
  Key,
  CheckCircle2,
  LockKeyhole
} from "lucide-react";

interface LoginPageProps {
  onLogin: (user: { email: string; name: string }) => void;
  theme: "light" | "dark" | "contrast";
  fontSize: "normal" | "large";
}

export function LoginPage({ onLogin, theme, fontSize }: LoginPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(true);
  
  // UI feedback & simulation states
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Preset accounts for frictionless testing
  const presets = [
    {
      email: "patient@healthmate.ai",
      password: "securepassword123",
      name: "Alex Mercer",
      role: "Standard Patient"
    },
    {
      email: "doctor.demo@healthmate.ai",
      password: "clinicalaccess789",
      name: "Dr. Sarah Chen",
      role: "Consulting Practitioner"
    }
  ];

  const handlePresetClick = (preset: typeof presets[0]) => {
    setEmail(preset.email);
    setPassword(preset.password);
    setName(preset.name);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Standard client side validation
    if (isSignUp && !name.trim()) {
      setError("Please provide your full legal name for medical record coherence.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid clinical or personal email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must consist of at least 6 secure characters.");
      return;
    }
    if (isSignUp && !agreeToTerms) {
      setError("You must agree to the medical data privacy terms and disclaimer.");
      return;
    }

    setIsLoading(true);

    // Simulate standard cloud credential hashing and validation delay
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      
      const displayName = isSignUp ? name : email.split("@")[0].split(".")[0];
      const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
      
      setSuccess(true);
      await new Promise((resolve) => setTimeout(resolve, 600));
      
      onLogin({
        email: email.toLowerCase().trim(),
        name: capitalizedName
      });
    } catch (err) {
      setError("Unable to establish secure handshake with authentication nodes.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="w-full flex items-center justify-center p-4 min-h-[calc(100vh-140px)] select-none" 
      id="login-page-root"
    >
      <div 
        className={`w-full max-w-md rounded-[32px] border overflow-hidden transition-all duration-300 ${
          theme === "light" 
            ? "bg-white border-slate-200/80 shadow-[0_15px_30px_rgba(148,163,184,0.1)]" 
            : theme === "contrast" 
            ? "bg-black border-white shadow-none" 
            : "bg-gradient-to-b from-slate-900/90 via-[#0D1527] to-[#040812] border-white/10 shadow-[0_20px_50px_rgba(4,8,18,0.6)]"
        }`}
      >
        {/* Decorative Top Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600"></div>

        <div className="p-8 space-y-6">
          
          {/* Header Brand */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-2xl shadow-md shadow-blue-500/20 mb-2">
              <Heart className="w-6 h-6 text-white animate-pulse" />
            </div>
            <h2 className={`font-bold font-display tracking-tight text-white ${fontSize === "large" ? "text-2xl" : "text-xl"}`}>
              Welcome to HealthMate AI
            </h2>
            <p className="text-xs text-slate-400 max-w-[280px] mx-auto">
              Access your personal symptom checker, clinical scanner, and medical cabinet securely.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Success Animation Banner */}
            {success && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-400 animate-pulse">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-medium">Secure credentials authenticated. Proceeding...</span>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-tight">{error}</span>
              </div>
            )}

            {/* SignUp Name field */}
            {isSignUp && (
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block pl-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError(null);
                    }}
                    placeholder="e.g. Dr. Jane Doe"
                    className={`w-full text-xs pl-10 pr-4 py-3 rounded-2xl border outline-none transition-all ${
                      theme === "light"
                        ? "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 focus:bg-white"
                        : "bg-slate-950/80 border-white/5 text-slate-200 focus:border-blue-500/50 focus:bg-slate-950"
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block pl-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="name@example.com"
                  className={`w-full text-xs pl-10 pr-4 py-3 rounded-2xl border outline-none transition-all ${
                    theme === "light"
                      ? "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 focus:bg-white"
                      : "bg-slate-950/80 border-white/5 text-slate-200 focus:border-blue-500/50 focus:bg-slate-950"
                  }`}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="flex justify-between items-center pl-1">
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  Password
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => setError("Password recovery link dispatched to your recorded email (simulated).")}
                    className="text-[10px] text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="••••••••"
                  className={`w-full text-xs pl-10 pr-10 py-3 rounded-2xl border outline-none transition-all ${
                    theme === "light"
                      ? "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 focus:bg-white"
                      : "bg-slate-950/80 border-white/5 text-slate-200 focus:border-blue-500/50 focus:bg-slate-950"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Compliance Consent Terms (Only for sign up) */}
            {isSignUp && (
              <label className="flex items-start gap-2.5 pl-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="mt-0.5 rounded border-white/5 bg-slate-950 text-blue-600 focus:ring-blue-500/20 focus:ring-offset-0"
                />
                <span className="text-[10px] text-slate-400 leading-normal">
                  I agree to standard HIPPA/privacy disclaimers and confirm this evaluation sandbox does not replace professional medical consulting.
                </span>
              </label>
            )}

            {/* Submit Action Trigger */}
            <button
              type="submit"
              disabled={isLoading || success}
              className={`w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50`}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Hashing Secure Handshake...
                </span>
              ) : (
                <>
                  {isSignUp ? "Initialize Clinical Account" : "Access Sandbox Panel"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Tab Footer */}
          <div className="text-center pt-2">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              {isSignUp ? (
                <>
                  Already registered? <span className="text-blue-400 font-bold underline">Log In Here</span>
                </>
              ) : (
                <>
                  New to the platform? <span className="text-blue-400 font-bold underline">Create Sandbox Account</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Preset Sandbox Credentials Tray */}
          <div className="pt-4 border-t border-white/5 space-y-2.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block text-center">
              Frictionless Presets for Evaluators
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              {presets.map((p) => (
                <button
                  key={p.email}
                  type="button"
                  onClick={() => handlePresetClick(p)}
                  className={`p-2.5 rounded-xl border text-left transition-all hover:bg-white/[0.04] cursor-pointer ${
                    email === p.email 
                      ? "border-blue-500 bg-blue-500/5 shadow-[0_0_10px_rgba(59,130,246,0.1)]" 
                      : "border-white/5 bg-white/[0.01]"
                  }`}
                >
                  <p className="text-[10px] font-bold text-slate-200 leading-tight">{p.name}</p>
                  <p className="text-[8px] text-slate-400 font-mono mt-0.5">{p.role}</p>
                  <span className="text-[8px] text-blue-400/80 mt-1 block hover:underline">Apply Preset</span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Security / Decrypted Footer info */}
        <div className="px-8 py-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-emerald-400" />
            AES-256 Decrypted Endpoint
          </span>
          <span className="font-mono">v1.4.2-Secure</span>
        </div>
      </div>
    </div>
  );
}
