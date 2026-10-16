import Link from "next/link";
import { themes } from "@/data/themes";

export const metadata = {
  title: "Themes & Problem Statements | Solve-a-thon 2026",
  description: "Explore all 5 official hackathon themes and 15 problem statements for Solve-a-thon 2026.",
};

export default function ThemesCatalogPage() {
  return (
    <div className="min-h-screen bg-[#030712] relative text-white font-sans selection:bg-cyan-500/30 py-14 px-4 sm:px-6 lg:px-8">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[160px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[160px] pointer-events-none"></div>

      <div className="container mx-auto max-w-5xl relative z-10 space-y-10">
        {/* Navigation */}
        <div className="flex items-center justify-between border-b border-white/10 pb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Back to Home
          </Link>
          <span className="text-xs font-mono text-white/50 uppercase tracking-widest">
            SOLVE-A-THON 2026 THEMES
          </span>
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold tracking-wider uppercase">
            <span>OFFICIAL TRACK DIRECTORY</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Hackathon Themes
          </h1>
          <p className="text-white/60 text-sm sm:text-base leading-relaxed">
            Select a theme below to view all assigned problem statements, technical requirements, implementation tracks, and download the official theme dossier.
          </p>
        </div>

        {/* Themes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {themes.map((theme) => (
            <Link
              key={theme.id}
              href={`/themes/${theme.slug}`}
              className="group p-6 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/50 hover:bg-white/[0.05] transition-all duration-300 shadow-xl flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-2xl">{theme.icon}</span>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors mb-2">
                    {theme.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                    {theme.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                <span className="text-white/40">{theme.problemStatements.length} Problem Statements</span>
                <span className="text-cyan-400 font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  View Statements <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
