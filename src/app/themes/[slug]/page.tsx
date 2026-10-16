"use client";

import { use, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getThemeBySlug, themes, ProblemStatement } from "@/data/themes";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ThemePage({ params }: PageProps) {
  const { slug } = use(params);
  const theme = getThemeBySlug(slug);
  const [downloading, setDownloading] = useState(false);

  if (!theme) {
    notFound();
  }

  const handleDownloadDocument = () => {
    setDownloading(true);

    const docContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>${theme.title} - Solve-a-thon 2026</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; padding: 24px; }
    h1 { color: #0284c7; font-size: 24pt; margin-bottom: 4px; }
    h2 { color: #0369a1; font-size: 18pt; margin-top: 20px; border-bottom: 2px solid #0284c7; padding-bottom: 6px; }
    h3 { color: #0f172a; font-size: 14pt; margin-top: 18px; }
    h4 { color: #475569; font-size: 11pt; text-transform: uppercase; margin-top: 14px; margin-bottom: 4px; }
    p { margin: 8px 0; font-size: 10.5pt; }
    ul { margin: 6px 0 14px 20px; }
    li { margin-bottom: 4px; font-size: 10pt; }
    .badge { display: inline-block; padding: 3px 8px; background: #e0f2fe; color: #0369a1; font-weight: bold; font-size: 9pt; border-radius: 4px; margin-bottom: 8px; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 8px 12px; margin: 12px 0; font-size: 9.5pt; }
    .footer { margin-top: 40px; font-size: 9pt; color: #64748b; border-top: 1px solid #cbd5e1; padding-top: 10px; }
  </style>
</head>
<body>
  <h1>SOLVE-A-THON 2026</h1>
  <h2>${theme.title}</h2>
  <p><strong>Theme Overview:</strong> ${theme.detailedDescription}</p>
  <hr/>

  ${theme.problemStatements
    .map(
      (ps) => `
    <div style="margin-bottom: 30px; page-break-inside: avoid;">
      <span class="badge">${ps.id} | Track: ${ps.track} | Implementation: ${
        ps.mode === "both"
          ? "Hardware or Software (Participant's Choice)"
          : ps.mode === "hardware"
          ? "Hardware Only"
          : "Software Only"
      }</span>
      <h3>${ps.id}: ${ps.title}</h3>
      <p><strong>Description:</strong> ${ps.description}</p>
      
      <h4>Detailed Problem Statement</h4>
      <p>${ps.detailedDescription}</p>

      <h4>Existing System Challenges</h4>
      <ul>
        ${ps.challenges.map((c) => `<li>${c}</li>`).join("")}
      </ul>

      <h4>Key Requirements & Deliverables</h4>
      <ul>
        ${ps.requirements.map((r) => `<li>${r}</li>`).join("")}
      </ul>

      ${
        ps.guidelines && ps.guidelines.length > 0
          ? `
        <div class="warning">
          <strong>Important Guidelines & Constraints:</strong><br/>
          ${ps.guidelines.join("<br/>")}
        </div>
      `
          : ""
      }
    </div>
  `
    )
    .join("<hr/>")}

  <div class="footer">
    <p>Solve-a-thon 2026 | Official Problem Statements Dossier for ${theme.title}</p>
    <p>Confidential &amp; Proprietary — For Registered Participant Teams Only</p>
  </div>
</body>
</html>
`;

    const blob = new Blob([docContent], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Solve-A-Thon-2026-Theme-${theme.number}-${theme.slug}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setTimeout(() => setDownloading(false), 800);
  };

  return (
    <div className="min-h-screen bg-[#030712] relative text-white font-sans selection:bg-cyan-500/30 py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[160px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[160px] pointer-events-none"></div>

      <div className="container mx-auto max-w-5xl relative z-10 space-y-10">
        {/* Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <Link
            href="/#problems"
            className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Back to All Themes
          </Link>
          <div className="flex items-center gap-2 text-xs font-mono text-white/50">
            <span>THEME {theme.number} OF {themes.length}</span>
          </div>
        </div>

        {/* Theme Hero Header */}
        <div className="bg-gradient-to-br from-white/[0.05] via-white/[0.02] to-transparent border border-white/10 rounded-3xl p-6 sm:p-10 backdrop-blur-2xl shadow-2xl relative overflow-hidden space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold tracking-wider uppercase">
            <span className="material-symbols-outlined text-base">{theme.icon}</span>
            <span>THEME 0{theme.number}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            {theme.title}
          </h1>

          <p className="text-white/70 text-sm sm:text-base leading-relaxed max-w-3xl">
            {theme.detailedDescription}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <span className="px-3.5 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-white/80">
              {theme.problemStatements.length} Problem Statements
            </span>
            <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-400">
              Hardware &amp; Software Tracks Open
            </span>
          </div>
        </div>

        {/* Problem Statements Cards */}
        <div className="space-y-8">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-cyan-400">format_list_bulleted</span>
              Problem Statements under this Theme
            </h2>
            <span className="text-xs font-mono text-white/50">DETAILED SPECIFICATIONS</span>
          </div>

          <div className="space-y-8">
            {theme.problemStatements.map((ps: ProblemStatement) => {
              const isBoth = ps.mode === "both";
              const isHardware = ps.mode === "hardware";
              const isSoftware = ps.mode === "software";

              return (
                <div
                  key={ps.id}
                  id={ps.id.toLowerCase()}
                  className="bg-white/[0.03] border border-white/10 hover:border-cyan-500/40 rounded-3xl p-6 sm:p-8 backdrop-blur-xl transition-all shadow-xl space-y-6"
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-black tracking-wider">
                        {ps.id}
                      </span>
                      <span className="text-xs font-mono text-white/60 uppercase tracking-widest">
                        {ps.track}
                      </span>
                    </div>

                    {/* Implementation Mode Pill */}
                    <div>
                      {isBoth && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-mono font-semibold">
                          <span className="material-symbols-outlined text-sm">tune</span>
                          Hardware / Software (Participant's Choice)
                        </span>
                      )}
                      {isHardware && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-semibold">
                          <span className="material-symbols-outlined text-sm">memory</span>
                          Hardware Only Solution
                        </span>
                      )}
                      {isSoftware && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-semibold">
                          <span className="material-symbols-outlined text-sm">terminal</span>
                          Software Only Solution
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Short Description */}
                  <div className="space-y-2">
                    <h3 className="text-xl sm:text-2xl font-bold text-white">{ps.title}</h3>
                    <p className="text-xs sm:text-sm text-cyan-300/80 font-medium leading-relaxed">
                      {ps.description}
                    </p>
                  </div>

                  {/* Detailed Description */}
                  <div className="bg-black/30 border border-white/5 rounded-2xl p-4 sm:p-5 space-y-2">
                    <h4 className="text-xs font-mono uppercase text-white/50 tracking-wider font-semibold">
                      Problem Background &amp; Context
                    </h4>
                    <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                      {ps.detailedDescription}
                    </p>
                  </div>

                  {/* Challenges & Requirements Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                    {/* Challenges */}
                    <div className="bg-black/20 border border-white/5 rounded-2xl p-4 sm:p-5 space-y-3">
                      <h4 className="text-xs font-mono uppercase text-rose-400 tracking-wider font-bold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base">report_problem</span>
                        Existing System Challenges
                      </h4>
                      <ul className="space-y-2">
                        {ps.challenges.map((c, idx) => (
                          <li key={idx} className="text-xs text-white/70 flex items-start gap-2 leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0"></span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Requirements */}
                    <div className="bg-black/20 border border-white/5 rounded-2xl p-4 sm:p-5 space-y-3">
                      <h4 className="text-xs font-mono uppercase text-emerald-400 tracking-wider font-bold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base">check_circle</span>
                        Key Requirements &amp; Deliverables
                      </h4>
                      <ul className="space-y-2">
                        {ps.requirements.map((r, idx) => (
                          <li key={idx} className="text-xs text-white/70 flex items-start gap-2 leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Guidelines Warning Alert */}
                  {ps.guidelines && ps.guidelines.length > 0 && (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-base text-amber-400 shrink-0 mt-0.5">
                        warning
                      </span>
                      <div className="space-y-1">
                        <span className="font-bold uppercase tracking-wider block">Important Implementation Guideline:</span>
                        <p className="leading-relaxed">{ps.guidelines.join(" ")}</p>
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                    {ps.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-white/60"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Download Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-950/40 via-cyan-950/20 to-slate-900/50 border border-cyan-500/40 backdrop-blur-2xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-base">file_download</span>
              <span>Theme Problem Statements Dossier</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Download Problem Statements for {theme.shortTitle}
            </h3>
            <p className="text-xs sm:text-sm text-white/60 max-w-xl">
              Get an official document containing the complete problem statements, requirements, and constraints for this theme.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleDownloadDocument}
              disabled={downloading}
              className="px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">
                {downloading ? "hourglass_empty" : "download"}
              </span>
              <span>{downloading ? "Generating Document..." : "Download Theme Document"}</span>
            </button>

            <Link
              href="/register"
              className="px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-white/10 flex items-center gap-1.5"
            >
              <span>Register Team</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
