"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function RulesPage() {
  const { user, isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-[#07050e] relative text-white font-sans selection:bg-violet-500/30 py-16 px-4">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
      <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-fuchsia-600/12 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="container mx-auto max-w-4xl relative z-10 space-y-12">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Back to Home
          </Link>
          <div className="flex items-center gap-4">
            {isAdmin ? (
              <Link href="/admin" className="px-5 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 font-semibold text-sm rounded-xl transition-all shadow-md shadow-purple-500/20 text-white">
                Admin Portal
              </Link>
            ) : user ? (
              <Link href="/profile" className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/10 hover:border-violet-500/30 rounded-xl text-sm transition-all">
                Team Dashboard
              </Link>
            ) : (
              <Link
                href="/register"
                className="px-5 py-2 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 font-semibold text-sm rounded-xl transition-all shadow-md shadow-purple-500/20 text-white"
              >
                Register / Login
              </Link>
            )}
          </div>
        </div>

        <div className="text-center space-y-3">
          <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-400 text-xs font-mono uppercase tracking-widest">
            GUIDELINES
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-violet-400 via-fuchsia-300 to-indigo-400 bg-clip-text text-transparent">
            Rules &amp; Regulations
          </h1>
          <p className="text-white/60 max-w-2xl mx-auto text-base">
            Please review the residential policies, team configurations, and code freeze standards before registering.
          </p>
        </div>

        {/* Rules Grid */}
        <div className="space-y-6">
          {/* Rule 1 */}
          <div className="bg-[#0e091c]/80 border border-violet-500/20 rounded-2xl p-6 md:p-8 backdrop-blur-xl hover:border-violet-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] transition-all">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/25 flex items-center justify-center text-violet-400 shrink-0">
                <span className="material-symbols-outlined text-2xl">home_work</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-violet-400 uppercase tracking-wider">RULE 01</span>
                  <span className="text-xs text-white/40">•</span>
                  <span className="text-xs text-emerald-400 font-semibold uppercase">STRICT ELIGIBILITY GATE</span>
                </div>
                <h2 className="text-xl font-bold">Exclusively for VIT Hostel Residents</h2>
                <p className="text-white/70 text-sm leading-relaxed">
                  Only students actively residing in VIT hostel blocks with verified hostel allotments are permitted to participate. Day scholars and non-hostellites cannot participate due to overnight security protocols, physical access restrictions, and hostel warden roll call procedures.
                </p>
              </div>
            </div>
          </div>

          {/* Rule 2 */}
          <div className="bg-[#0e091c]/80 border border-violet-500/20 rounded-2xl p-6 md:p-8 backdrop-blur-xl hover:border-violet-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] transition-all">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/25 flex items-center justify-center text-fuchsia-400 shrink-0">
                <span className="material-symbols-outlined text-2xl">groups</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-fuchsia-400 uppercase tracking-wider">RULE 02</span>
                  <span className="text-xs text-white/40">•</span>
                  <span className="text-xs text-indigo-400 font-semibold uppercase">TEAM FORMATION</span>
                </div>
                <h2 className="text-xl font-bold">2 to 4 Members Cap per Team</h2>
                <p className="text-white/70 text-sm leading-relaxed">
                  Teams must consist of at least 2 member and no more than 4 members. Inter-block teams across Men&apos;s and Ladies&apos; blocks are permitted for collaborative development, but overnight lodging remains strictly confined to the allotted hackathon venue and respective hostel rooms.
                </p>
              </div>
            </div>
          </div>

          {/* Rule 3 */}
          <div className="bg-[#0e091c]/80 border border-violet-500/20 rounded-2xl p-6 md:p-8 backdrop-blur-xl hover:border-violet-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] transition-all">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <span className="material-symbols-outlined text-2xl">alarm</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-violet-400 uppercase tracking-wider">RULE 03</span>
                  <span className="text-xs text-white/40">•</span>
                  <span className="text-xs text-amber-400 font-semibold uppercase">24-HOUR TIMELINE</span>
                </div>
                <h2 className="text-xl font-bold">Mandatory Attendance &amp; Roll Calls</h2>
                <p className="text-white/70 text-sm leading-relaxed">
                  Physical presence is mandatory during scheduled check-in stations. Teams with absent or unverified members will be disqualified from final jury pitching.
                </p>
              </div>
            </div>
          </div>

          {/* Rule 4 */}
          <div className="bg-[#0e091c]/80 border border-violet-500/20 rounded-2xl p-6 md:p-8 backdrop-blur-xl hover:border-violet-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] transition-all">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                <span className="material-symbols-outlined text-2xl">code</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-violet-400 uppercase tracking-wider">RULE 04</span>
                  <span className="text-xs text-white/40">•</span>
                  <span className="text-xs text-purple-400 font-semibold uppercase">INTEGRITY &amp; CODE FREEZE</span>
                </div>
                <h2 className="text-xl font-bold">Original Development &amp; GitHub Commits</h2>
                <p className="text-white/70 text-sm leading-relaxed">
                  All solution code, hardware firmware, and AI architectures must be created during the official hackathon hacking window. Pre-built entire applications are strictly disallowed. Strict commit freeze occurs at 8:00 AM on Day 2 before jury evaluations begin.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-violet-950/60 via-purple-950/40 to-slate-900/60 border border-violet-500/30 rounded-2xl p-8 text-center space-y-4 shadow-[0_0_40px_rgba(168,85,247,0.15)]">
          <h2 className="text-2xl font-bold">Ready to Build for Your Hostel?</h2>
          <p className="text-white/70 text-sm max-w-lg mx-auto">
            Log in with your official VIT Google account, register your hostel room &amp; mess details, and invite your teammates.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-4">
            <Link
              href={isAdmin ? "/admin" : user ? "/profile" : "/register"}
              className="px-8 py-3.5 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/30"
            >
              {isAdmin ? "Open Admin Portal" : user ? "Go to Dashboard" : "Register / Login"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
