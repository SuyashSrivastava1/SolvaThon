"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import committeeMembers from "@/data/committee.json";
import hostelTeam from "@/data/hostelTeam.json";

export default function HostelTeamPage() {
  const { user, isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-[#050B14] relative text-white font-sans selection:bg-cyan-500/30 py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none mix-blend-overlay"></div>
      <div className="absolute top-10 left-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[160px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[160px] pointer-events-none"></div>

      <div className="max-w-[1400px] mx-auto relative z-10 space-y-16">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-mono font-medium"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Back to Home
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/#faq"
              className="hidden sm:inline-flex text-xs font-mono text-slate-400 hover:text-white transition-colors"
            >
              FAQs
            </Link>
            <Link
              href="/rules"
              className="hidden sm:inline-flex text-xs font-mono text-slate-400 hover:text-white transition-colors"
            >
              Rules
            </Link>
            {isAdmin ? (
              <Link
                href="/admin"
                className="px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 font-semibold text-xs rounded-xl transition-all shadow-md shadow-purple-500/20 text-white font-mono"
              >
                Admin Portal
              </Link>
            ) : user ? (
              <Link
                href="/profile"
                className="px-4 py-2 bg-white/10 hover:bg-white/15 rounded-xl text-xs font-mono transition-all text-white"
              >
                Team Dashboard
              </Link>
            ) : (
              <Link
                href="/register"
                className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-semibold text-xs rounded-xl transition-all shadow-md shadow-cyan-500/20 text-white font-mono"
              >
                Register
              </Link>
            )}
          </div>
        </div>

        {/* Page Title */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono uppercase tracking-widest"
          >
            <span className="material-symbols-outlined text-sm">apartment</span>
            VIT Chennai Hostel Administration
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            style={{ fontFamily: "'Outfit', sans-serif" }}
            className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white uppercase"
          >
            Hostel Directorate &amp; Team
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-slate-400 text-sm sm:text-base leading-relaxed"
          >
            Meet the leadership, wardens, superintendents, and supervisors overseeing residential life and hackathon operations.
          </motion.p>
        </div>

        {/* ── TOP SECTION: DIRECTORATE (Janardhan, Felix, Velmathi) ── */}
        <div className="space-y-6">
          <div className="flex flex-col items-center sm:items-start">
            <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-widest">
              Directorate Leadership
            </span>
            <h2
              style={{ fontFamily: "'Outfit', sans-serif" }}
              className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight"
            >
              Directors &amp; Deputy Directors
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {committeeMembers.map((leader, idx) => (
              <motion.div
                key={leader.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.1 + idx * 0.08, ease: "easeOut" }}
                className="glass-card card-pop rounded-2xl overflow-hidden flex flex-col bg-[#090f1d]/80 border border-white/10 hover:border-cyan-500/30 transition-all duration-300"
              >
                <div className="w-full h-56 overflow-hidden relative bg-[#0b1329]">
                  <img
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    src={leader.img}
                    alt={leader.name}
                  />
                  <div
                    className="absolute top-3 right-3 px-2.5 py-1 rounded-md"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      fontWeight: 700,
                      background: "rgba(0,0,0,0.65)",
                      backdropFilter: "blur(8px)",
                      color: "#38bdf8",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {leader.tag}
                  </div>
                </div>

                <div className="p-5 sm:p-6 flex flex-col gap-2 flex-1">
                  <h3
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    className="font-bold text-lg text-slate-100"
                  >
                    {leader.name}
                  </h3>
                  <span
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    className="text-xs font-semibold text-cyan-400"
                  >
                    {leader.role}
                  </span>
                  <p
                    style={{ fontFamily: "'Inter', sans-serif" }}
                    className="text-sm text-slate-400 leading-relaxed flex-1 mt-1"
                  >
                    {leader.desc}
                  </p>

                  <div
                    className="mt-4 pt-4 border-t border-white/[0.06] flex flex-col gap-1 text-xs font-mono"
                    style={{ color: "#64748b" }}
                  >
                    <span className="text-slate-300">{leader.jurisdiction}</span>
                    <span className="text-cyan-400/80">{leader.email}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── SIMULTANEOUS ANIMATING HOSTEL TEAM SECTION ── */}
        <div className="space-y-8 pt-6 border-t border-white/10">
          <div className="flex flex-col items-center sm:items-start gap-1">
            <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-widest">
              Residential Administration
            </span>
            <h2
              style={{ fontFamily: "'Outfit', sans-serif" }}
              className="text-2xl sm:text-4xl font-black text-slate-100 tracking-tight"
            >
              Hostel Team
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">
            {hostelTeam.map((colGroup, colIdx) => (
              <div key={colIdx} className="flex flex-col">
                {colGroup.members.map((member, idx) => (
                  <motion.div
                    key={member.name}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.35,
                      delay: 0.15 + idx * 0.045, // Identical delay per row across both columns for simultaneous entry!
                      ease: "easeOut",
                    }}
                    className="flex items-center justify-between py-3.5 sm:py-4 border-b border-white/[0.04] hover:bg-white/[0.03] px-3 rounded-lg transition-colors gap-4"
                  >
                    <span
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontWeight: 600,
                        fontSize: "clamp(0.92rem, 1.15vw, 1.05rem)",
                        color: "#f8fafc",
                      }}
                    >
                      {member.name}
                    </span>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "clamp(0.78rem, 1vw, 0.88rem)",
                        color: "#64748b",
                        letterSpacing: "0.02em",
                      }}
                      className="text-right shrink-0"
                    >
                      {member.role}
                    </span>
                  </motion.div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="pt-10 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>Solve-a-thon 2026-27 · VIT Chennai</span>
          </div>
          <span>© 2026 SOLVE-A-THON. ALL RIGHTS RESERVED.</span>
        </footer>
      </div>
    </div>
  );
}
