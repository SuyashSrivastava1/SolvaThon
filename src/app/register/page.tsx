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
    gender: "",
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
        window.location.replace("/admin");
        return;
      }

      // Tokenize participant login (1 hour session)
      const token = await result.user.getIdToken(true);
      saveParticipantSession(result.user, token);

      const alreadyReg = await checkIsRegistered(result.user.uid);
      if (alreadyReg) {
        setIsRegistered(true);
        window.location.replace("/profile");
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
        window.location.replace("/admin");
        return;
      }

      checkIsRegistered(user.uid)
        .then((alreadyReg) => {
          if (alreadyReg) {
            setIsRegistered(true);
            window.location.replace("/profile");
          } else {
            setCheckingReg(false);
          }
        })
        .catch((err) => {
          console.error("checkIsRegistered Error:", err);
          setCheckingReg(false);
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

const CATERERS_BY_BLOCK: Record<string, string[]> = {
  "Men's Block A": ["CRCL", "Fusion", "Proodle", "Sri Rajalakshmi Food Products"],
  "Men's Block D": ["CRCL", "Fusion", "Proodle", "Sri Rajalakshmi Food Products"],
  "Men's Block E": ["CRCL", "Fusion", "Proodle", "Sri Rajalakshmi Food Products"],
  "Men's Block F": ["SRRC", "J Sathya PR"],
  "Ladies' Block B": ["Zenith", "Food Exo", "Sakti"],
  "Ladies' Block C": ["Zenith", "Food Exo", "Sakti"],
};

const MESS_TYPES_BY_CATERER: Record<string, string[]> = {
  "CRCL": ["Veg", "Non-Veg", "Food Park"],
  "Fusion": ["Veg", "Non-Veg", "Special"],
  "Proodle": ["Veg", "Non-Veg", "Food Park"],
  "Sri Rajalakshmi Food Products": ["Veg", "Non-Veg", "Special"],
  "SRRC": ["Veg", "Non-Veg", "Special", "Food Park"],
  "J Sathya PR": ["Veg", "Non-Veg", "Special", "Food Park"],
  "Zenith": ["Veg", "Non-Veg", "Food Park"],
  "Food Exo": ["Veg", "Non-Veg", "Special"],
  "Sakti": ["Veg", "Non-Veg"],
  "Shakthi": ["Veg", "Non-Veg"],
  "Shakti": ["Veg", "Non-Veg"],
};

  const availableBlocks = formData.gender
    ? blocksData.filter((b: any) => b.gender === formData.gender)
    : [];

  const availableCaterers = formData.hostelBlock
    ? (CATERERS_BY_BLOCK[formData.hostelBlock] || [])
    : [];

  const availableMessTypes = formData.messCaterer
    ? (MESS_TYPES_BY_CATERER[formData.messCaterer] || [])
    : [];

  const handleGenderSelect = (selectedGender: "Male" | "Female") => {
    setFormData((prev) => {
      const validBlocks = blocksData
        .filter((b: any) => b.gender === selectedGender)
        .map((b: any) => b.label);
      const newBlock = validBlocks.includes(prev.hostelBlock) ? prev.hostelBlock : "";
      const validCaterers = newBlock ? (CATERERS_BY_BLOCK[newBlock] || []) : [];
      const newCaterer = validCaterers.includes(prev.messCaterer) ? prev.messCaterer : "";
      const validMessTypes = newCaterer ? (MESS_TYPES_BY_CATERER[newCaterer] || []) : [];
      const newMessType = validMessTypes.includes(prev.messType) ? prev.messType : "";

      return {
        ...prev,
        gender: selectedGender,
        hostelBlock: newBlock,
        messCaterer: newCaterer,
        messType: newMessType,
      };
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (name === "roomNumber") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 4);
      setFormData((prev) => ({ ...prev, roomNumber: digitsOnly }));
      return;
    }
    if (name === "mobileNumber") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, mobileNumber: digitsOnly }));
      return;
    }
    if (name === "hostelBlock") {
      const newBlock = value;
      const validCaterers = CATERERS_BY_BLOCK[newBlock] || [];
      const newCaterer = validCaterers.includes(formData.messCaterer) ? formData.messCaterer : "";
      const validMessTypes = newCaterer ? (MESS_TYPES_BY_CATERER[newCaterer] || []) : [];
      const newMessType = validMessTypes.includes(formData.messType) ? formData.messType : "";
      setFormData((prev) => ({
        ...prev,
        hostelBlock: newBlock,
        messCaterer: newCaterer,
        messType: newMessType,
      }));
      return;
    }
    if (name === "messCaterer") {
      const newCaterer = value;
      const validMessTypes = MESS_TYPES_BY_CATERER[newCaterer] || [];
      const newMessType = validMessTypes.includes(formData.messType) ? formData.messType : "";
      setFormData((prev) => ({
        ...prev,
        messCaterer: newCaterer,
        messType: newMessType,
      }));
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

    if (!formData.gender) {
      setStatus("error");
      setErrorMessage("Please select your gender.");
      return;
    }

    if (!/^\d{3,4}$/.test(formData.roomNumber.trim())) {
      setStatus("error");
      setErrorMessage("Enter a valid room number.");
      return;
    }

    const result = await registerParticipant({
      firebaseUid: user.uid,
      emailId: user.email!,
      ...formData,
      gender: formData.gender as "Male" | "Female",
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
    (formData.gender === "Male" || formData.gender === "Female") &&
    formData.hostelBlock !== "" &&
    /^\d{3,4}$/.test(formData.roomNumber.trim()) &&
    formData.messCaterer !== "" &&
    formData.messType !== "" &&
    formData.consentAgreed;

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen lg:overflow-hidden bg-[#050B14] relative text-white font-sans selection:bg-cyan-500/30 flex flex-col justify-center items-center px-4 py-3 sm:py-5">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="w-full max-w-3xl relative z-10 flex flex-col items-center my-auto">
        {/* Header */}
        <div className="text-center max-w-xl mb-3">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight pb-1 mb-1.5 bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent leading-tight inline-block">
            Participant Registration
          </h1>
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-white/80">
              <span className="material-symbols-outlined text-cyan-400 text-sm">verified_user</span>
              <span>Signed in as <strong className="text-cyan-400 font-mono">{user.email}</strong></span>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="w-full bg-white/[0.04] backdrop-blur-2xl border border-white/10 p-5 sm:p-6 md:p-7 rounded-2xl shadow-2xl space-y-3.5"
        >
          <div className="border-b border-white/10 pb-2">
            <h2 className="text-sm md:text-base font-bold text-white">Personal &amp; Hostel Details</h2>
          </div>

          {/* Row 1: Personal Contact Info (2 Equal Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-white/80 uppercase tracking-wider block">
                Full Name <span className="text-cyan-400">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full h-11 bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white placeholder-white/30 focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all"
                placeholder="e.g. Rahul Sharma"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-white/80 uppercase tracking-wider block">
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
                className="w-full h-11 bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white placeholder-white/30 focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all"
                placeholder="10-digit mobile number"
              />
            </div>
          </div>

          {/* Row 2: Hostel Assignment (3 Equal Columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-white/80 uppercase tracking-wider block">
                Gender <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <select
                  name="gender"
                  required
                  value={formData.gender}
                  onChange={(e) => handleGenderSelect(e.target.value as "Male" | "Female")}
                  className="w-full h-11 bg-black/40 border border-white/10 rounded-xl pl-3.5 pr-9 py-2 text-sm text-white appearance-none focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all cursor-pointer [&>option]:bg-[#050B14]"
                >
                  <option value="" disabled>Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none text-lg">
                  expand_more
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-white/80 uppercase tracking-wider block">
                Hostel Block <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <select
                  name="hostelBlock"
                  required
                  disabled={!formData.gender}
                  value={formData.hostelBlock}
                  onChange={handleInputChange}
                  className="w-full h-11 bg-black/40 border border-white/10 rounded-xl pl-3.5 pr-9 py-2 text-sm text-white appearance-none focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed [&>option]:bg-[#050B14]"
                >
                  <option value="" disabled>
                    {!formData.gender ? "Select Gender first" : "Select assigned block"}
                  </option>
                  {availableBlocks.map((b: any) => (
                    <option key={b.id} value={b.label}>
                      {b.label}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none text-lg">
                  expand_more
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-white/80 uppercase tracking-wider block">
                Room Number <span className="text-cyan-400">*</span>
              </label>
              <input
                type="text"
                name="roomNumber"
                inputMode="numeric"
                pattern="[0-9]{3,4}"
                maxLength={4}
                required
                disabled={!formData.gender}
                value={formData.roomNumber}
                onChange={handleInputChange}
                className="w-full h-11 bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white placeholder-white/30 focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all font-mono disabled:opacity-40 disabled:cursor-not-allowed"
                placeholder={!formData.gender ? "Select Gender first" : "e.g. 412"}
              />
            </div>
          </div>

          {/* Row 3: Mess Assignment (2 Equal Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-white/80 uppercase tracking-wider block">
                Mess Caterer <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <select
                  name="messCaterer"
                  required
                  disabled={!formData.hostelBlock}
                  value={formData.messCaterer}
                  onChange={handleInputChange}
                  className="w-full h-11 bg-black/40 border border-white/10 rounded-xl pl-3.5 pr-9 py-2 text-sm text-white appearance-none focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed [&>option]:bg-[#050B14]"
                >
                  <option value="" disabled>
                    {!formData.gender
                      ? "Select Gender first"
                      : !formData.hostelBlock
                      ? "Select Block first"
                      : "Select Caterer"}
                  </option>
                  {availableCaterers.map((c: string) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none text-lg">
                  expand_more
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-white/80 uppercase tracking-wider block">
                Mess Type <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <select
                  name="messType"
                  required
                  disabled={!formData.messCaterer}
                  value={formData.messType}
                  onChange={handleInputChange}
                  className="w-full h-11 bg-black/40 border border-white/10 rounded-xl pl-3.5 pr-9 py-2 text-sm text-white appearance-none focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed [&>option]:bg-[#050B14]"
                >
                  <option value="" disabled>
                    {!formData.gender
                      ? "Select Gender first"
                      : !formData.messCaterer
                      ? "Select Caterer first"
                      : "Select Mess Type"}
                  </option>
                  {availableMessTypes.map((m: string) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none text-lg">
                  expand_more
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 px-3 bg-white/5 rounded-xl border border-white/10">
            <input
              type="checkbox"
              id="consentAgreed"
              name="consentAgreed"
              required
              checked={formData.consentAgreed}
              onChange={handleInputChange}
              className="mt-0.5 w-4 h-4 accent-cyan-500 rounded cursor-pointer shrink-0"
            />
            <label htmlFor="consentAgreed" className="text-[11px] text-white/70 leading-snug cursor-pointer">
              I verify that I am currently a residential student residing on the VIT campus. I agree to abide by all the hackathon guidelines, overnight attendance checks, and lab protocols.
            </label>
          </div>

          {status === "error" && (
            <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs text-center">
              {errorMessage}
            </div>
          )}

          {status === "success" && (
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs text-center font-medium">
              Registration successful! Redirecting to your team dashboard...
            </div>
          )}

          <button
            type="submit"
            disabled={!isFormValid || status === "loading" || status === "success"}
            className={`w-full font-bold py-2.5 md:py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm ${
              !isFormValid || status === "loading" || status === "success"
                ? "bg-slate-800/80 text-white/30 border border-white/5 cursor-not-allowed shadow-none"
                : "bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 cursor-pointer"
            }`}
          >
            {status === "loading" ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
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
