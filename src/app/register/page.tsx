"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { registerParticipant, checkIsRegistered } from "@/actions/register";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import Link from "next/link";
import { isAdminEmail, isValidAuthDomain } from "@/config/admin";
import { saveParticipantSession, clearParticipantSession } from "@/lib/authSession";
import blocksData from "@/data/blocks.json";
import messTypesData from "@/data/messTypes.json";
import caterersData from "@/data/caterers.json";

export default function RegisterPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: "",
    mobileNumber: "",
    hostelBlock: "",
    roomNumber: "",
    messCaterer: "",
    messType: "",
    consentAgreed: false,
  });

  const [checkingReg, setCheckingReg] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const handleGoogleSignUp = async () => {
    setAuthLoading(true);
    setAuthError("");

    try {
      const provider = new GoogleAuthProvider();

      const result = await signInWithPopup(auth, provider);
      const email = result.user.email;
      const isAdmin = isAdminEmail(email);

      if (!isValidAuthDomain(email)) {
        await auth.signOut();
        clearParticipantSession();
        setAuthError("You must use your @vitstudent.ac.in email address to register.");
        setAuthLoading(false);
        return;
      }

      // If user is an Admin, redirect to Admin Portal (permanent, no token)
      if (isAdmin) {
        clearParticipantSession();
        router.replace("/admin");
        return;
      }

      // Tokenize participant login (1 hour session)
      const token = await result.user.getIdToken(true);
      saveParticipantSession(result.user, token);

      const alreadyReg = await checkIsRegistered(result.user.uid);
      if (alreadyReg) {
        setIsRegistered(true);
        router.replace("/profile");
      } else {
        setCheckingReg(false);
        setAuthLoading(false);
      }
    } catch (error: any) {
      console.error(error);
      setAuthLoading(false);
      if (error.code === "auth/popup-closed-by-user") {
        setAuthError("Sign up was cancelled.");
      } else {
        setAuthError(error.message || "Failed to sign up with Google.");
      }
    }
  };

  useEffect(() => {
    if (user) {
      const isAdmin = isAdminEmail(user.email);

      if (!isValidAuthDomain(user.email)) {
        auth.signOut();
        setAuthError("You must use your @vitstudent.ac.in email address to register.");
        setCheckingReg(false);
        return;
      }

      // If already logged in admin opens register page, redirect to admin console
      if (isAdmin) {
        router.replace("/admin");
        return;
      }

      checkIsRegistered(user.uid).then((alreadyReg) => {
        if (alreadyReg) {
          setIsRegistered(true);
          router.replace("/profile");
        } else {
          setCheckingReg(false);
        }
      });
    } else if (!loading) {
      setCheckingReg(false);
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.displayName && !formData.fullName) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || user.displayName || "",
      }));
    }
  }, [user]);

  if (loading || checkingReg || isRegistered) {
    return (
      <div className="min-h-screen bg-[#050B14] flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mb-4"></div>
        <p className="text-white/60 font-mono text-sm tracking-wider">
          {isRegistered ? "VERIFIED. REDIRECTING TO YOUR DASHBOARD..." : "INITIALIZING SESSION..."}
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050B14] flex flex-col items-center justify-center text-white px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
        <div className="relative z-10 max-w-md w-full bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl text-center shadow-2xl">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <span className="material-symbols-outlined text-3xl">lock</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
          <p className="text-white/60 text-sm mb-6">
            Please sign in with your verified <span className="text-cyan-400">@vitstudent.ac.in</span> Google account to register for Hostelle Solvathon.
          </p>

          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={authLoading}
            className="w-full bg-white hover:bg-slate-100 text-slate-900 font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3 shadow-lg shadow-white/5"
          >
            {authLoading ? (
              <span className="material-symbols-outlined animate-spin text-xl text-slate-900">refresh</span>
            ) : (
              <>
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="text-[15px] tracking-wide">Sign up using Google</span>
              </>
            )}
          </button>

          <p className="text-white/40 text-xs mt-3">
            Already registered? Signing in will redirect you to your dashboard automatically.
          </p>

          {authError && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center">
              {authError}
            </div>
          )}

          <div className="mt-6">
            <Link href="/" className="text-xs text-white/50 hover:text-white transition-colors inline-flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (name === "roomNumber") {
      // Only numbers accepted, 3 to 4 digits
      const digitsOnly = value.replace(/\D/g, "").slice(0, 4);
      setFormData((prev) => ({ ...prev, roomNumber: digitsOnly }));
      return;
    }
    if (name === "mobileNumber") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, mobileNumber: digitsOnly }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    if (!/^\d{3,4}$/.test(formData.roomNumber.trim())) {
      setStatus("error");
      setErrorMessage("Enter a valid room number.");
      return;
    }

    const result = await registerParticipant({
      firebaseUid: user.uid,
      emailId: user.email!,
      ...formData,
    });

    if (result.success) {
      setStatus("success");
      setTimeout(() => router.replace("/profile"), 1800);
    } else {
      setStatus("error");
      setErrorMessage(result.error || "Registration failed");
    }
  };

  const isFormValid =
    formData.fullName.trim().length >= 2 &&
    /^\d{10}$/.test(formData.mobileNumber.trim()) &&
    formData.hostelBlock !== "" &&
    /^\d{3,4}$/.test(formData.roomNumber.trim()) &&
    formData.messCaterer !== "" &&
    formData.messType !== "" &&
    formData.consentAgreed;

  return (
    <div className="min-h-screen bg-[#050B14] relative text-white font-sans selection:bg-cyan-500/30">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="container mx-auto px-4 py-16 relative z-10 flex flex-col items-center">
        {/* Header */}
        <div className="text-center max-w-2xl mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono uppercase tracking-widest mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            SOLVATHON 2026
          </div>
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight pb-3.5 mb-3 bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent leading-[1.3] inline-block">
              Participant Registration
            </h1>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80">
            <span className="material-symbols-outlined text-cyan-400 text-base">verified_user</span>
            <span>Signed in as <strong className="text-cyan-400 font-mono">{user.email}</strong></span>
          </div>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-2xl bg-white/[0.04] backdrop-blur-2xl border border-white/10 p-6 md:p-10 rounded-2xl shadow-2xl space-y-6"
        >
          <div className="border-b border-white/10 pb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Personal &amp; Hostel Details</h2>
              <span className="text-xs font-mono text-white/40">VIT HOSTELLITE VERIFICATION</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                Full Name <span className="text-cyan-400">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all"
                placeholder="e.g. Rahul Sharma"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                Mobile Number <span className="text-cyan-400">*</span>
              </label>
              <input
                type="tel"
                name="mobileNumber"
                required
                pattern="[0-9]{10}"
                title="Please enter a valid 10-digit mobile number"
                onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Please enter a valid 10-digit mobile number")}
                onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
                value={formData.mobileNumber}
                onChange={handleInputChange}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all"
                placeholder="10-digit mobile number"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                Hostel Block <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <select
                  name="hostelBlock"
                  required
                  value={formData.hostelBlock}
                  onChange={handleInputChange}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-11 py-3 text-white appearance-none focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all cursor-pointer [&>option]:bg-[#050B14]"
                >
                  <option value="" disabled>Select assigned block</option>
                  {blocksData.map((b: any) => (
                    <option key={b.id} value={b.label}>
                      {b.label}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none text-xl">
                  expand_more
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                Room Number <span className="text-cyan-400">*</span>
              </label>
              <input
                type="text"
                name="roomNumber"
                inputMode="numeric"
                pattern="[0-9]{3,4}"
                maxLength={4}
                required
                value={formData.roomNumber}
                onChange={handleInputChange}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all font-mono"
                placeholder="e.g. 412"
              />
              {formData.roomNumber.length > 0 && !/^\d{3,4}$/.test(formData.roomNumber) && (
                <p className="text-[11px] text-amber-400 font-mono">
                  Enter a valid room number
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                Mess Caterer <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <select
                  name="messCaterer"
                  required
                  value={formData.messCaterer}
                  onChange={handleInputChange}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-11 py-3 text-white appearance-none focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all cursor-pointer [&>option]:bg-[#050B14]"
                >
                  <option value="" disabled>Select Caterer</option>
                  {caterersData.map((c: any) => (
                    <option key={c.id} value={c.label}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none text-xl">
                  expand_more
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                Mess Diet Type <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <select
                  name="messType"
                  required
                  value={formData.messType}
                  onChange={handleInputChange}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-11 py-3 text-white appearance-none focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all cursor-pointer [&>option]:bg-[#050B14]"
                >
                  <option value="" disabled>Select Type</option>
                  {messTypesData.map((m: any) => (
                    <option key={m.id} value={m.label}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none text-xl">
                  expand_more
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
            <input
              type="checkbox"
              id="consentAgreed"
              name="consentAgreed"
              required
              checked={formData.consentAgreed}
              onChange={handleInputChange}
              className="mt-1 w-5 h-5 accent-cyan-500 rounded cursor-pointer"
            />
            <label htmlFor="consentAgreed" className="text-xs text-white/70 leading-relaxed cursor-pointer">
              I verify that I am currently a residential student residing on the VIT campus. I agree to abide by all the hackathon guidelines, overnight attendance checks, and lab protocols.
            </label>
          </div>

          {status === "error" && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
              {errorMessage}
            </div>
          )}

          {status === "success" && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm text-center font-medium">
              Registration successful! Redirecting to your team dashboard...
            </div>
          )}

          <button
            type="submit"
            disabled={!isFormValid || status === "loading" || status === "success"}
            className={`w-full font-bold py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
              !isFormValid || status === "loading" || status === "success"
                ? "bg-slate-800/80 text-white/30 border border-white/5 cursor-not-allowed shadow-none"
                : "bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 cursor-pointer"
            }`}
          >
            {status === "loading" ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Registering...</span>
              </>
            ) : (
              <span>Register</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
