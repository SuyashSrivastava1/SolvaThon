"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { registerParticipant } from "@/actions/register";
import Link from "next/link";
import blocksData from "@/data/blocks.json";
import messTypesData from "@/data/messTypes.json";
import caterersData from "@/data/caterers.json";

export default function RegistrationPage() {
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

  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  if (loading) return <div className="min-h-screen bg-[#050B14] flex items-center justify-center text-white">Loading...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050B14] flex flex-col items-center justify-center text-white">
        <h2 className="text-2xl mb-4">You must authenticate first</h2>
        <Link href="/login" className="px-6 py-3 bg-cyan-500 rounded-xl">Go to Login</Link>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const result = await registerParticipant({
      firebaseUid: user.uid,
      emailId: user.email!,
      ...formData
    });

    if (result.success) {
      setStatus("success");
      setTimeout(() => router.push("/profile"), 2000);
    } else {
      setStatus("error");
      setErrorMessage(result.error || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#050B14] relative text-white font-sans overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none mix-blend-overlay"></div>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="container mx-auto px-4 py-20 relative z-10 flex flex-col items-center">
        <div className="text-center max-w-2xl mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Participant Registration
          </h1>
          <p className="text-white/60 text-lg mb-4">
            Complete your profile to join the Hostellite Solvathon. You are authenticated as <span className="text-cyan-400">{user.email}</span>
          </p>
          <button 
            onClick={() => {
              import("firebase/auth").then(({ signOut }) => {
                import("@/lib/firebase/config").then(({ auth }) => {
                  signOut(auth);
                });
              });
            }} 
            className="px-4 py-2 border border-white/20 hover:bg-white/10 rounded-xl text-sm transition-all"
          >
            Sign out of this account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Full Name</label>
              <input type="text" name="fullName" required value={formData.fullName} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all" placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Mobile Number</label>
              <input type="tel" name="mobileNumber" required pattern="[0-9]{10}" value={formData.mobileNumber} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all" placeholder="10-digit number" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Hostel Block</label>
              <select name="hostelBlock" required value={formData.hostelBlock} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500/50 outline-none text-white [&>option]:bg-[#050B14]">
                <option value="" disabled>Select Block</option>
                {blocksData.map((b: any) => <option key={b.id} value={b.label}>{b.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Room Number</label>
              <input type="text" name="roomNumber" required value={formData.roomNumber} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500/50 outline-none" placeholder="e.g. 412" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Mess Caterer</label>
              <select name="messCaterer" required value={formData.messCaterer} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500/50 outline-none text-white [&>option]:bg-[#050B14]">
                <option value="" disabled>Select Caterer</option>
                {caterersData.map((c: any) => <option key={c.id} value={c.label}>{c.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Mess Type</label>
              <select name="messType" required value={formData.messType} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500/50 outline-none text-white [&>option]:bg-[#050B14]">
                <option value="" disabled>Select Type</option>
                {messTypesData.map((m: any) => <option key={m.id} value={m.label}>{m.label}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
            <input type="checkbox" name="consentAgreed" required checked={formData.consentAgreed} onChange={handleInputChange} className="mt-1 w-5 h-5 accent-cyan-500" />
            <p className="text-sm text-white/70">I confirm that all provided details are correct and I agree to the rules and regulations of the Hostellite Solvathon.</p>
          </div>

          {status === "error" && <div className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-lg">{errorMessage}</div>}
          {status === "success" && <div className="text-emerald-400 text-sm text-center bg-emerald-500/10 py-2 rounded-lg">Registration successful! Redirecting to dashboard...</div>}

          <button type="submit" disabled={status === "loading" || status === "success"} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold py-4 rounded-xl transition-all duration-300 shadow-lg shadow-cyan-500/20 disabled:opacity-50">
            {status === "loading" ? "Registering..." : "Complete Registration"}
          </button>
        </form>
      </div>
    </div>
  );
}
