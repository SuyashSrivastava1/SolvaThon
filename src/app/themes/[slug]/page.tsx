"use client";

import { use, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getThemeBySlug, ProblemStatement } from "@/data/themes";

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
  <title>${theme.title}</title>
  <style>
    @page {
      size: 8.5in 11in;
      margin: 1.0in 1.0in 1.0in 1.0in;
      mso-header-margin: 0.5in;
      mso-footer-margin: 0.5in;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #000000;
      background: #ffffff;
      margin: 1.0in;
    }
    h1 {
      font-family: 'Times New Roman', Times, serif;
      font-size: 16pt;
      font-weight: bold;
      color: #000000;
      text-align: center;
      margin-bottom: 4pt;
    }
    h2 {
      font-family: 'Times New Roman', Times, serif;
      font-size: 14pt;
      font-weight: bold;
      color: #000000;
      text-align: center;
      margin-top: 0;
      margin-bottom: 16pt;
    }
    h3 {
      font-family: 'Times New Roman', Times, serif;
      font-size: 13pt;
      font-weight: bold;
      color: #000000;
      margin-top: 18pt;
      margin-bottom: 6pt;
    }
    h4 {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      font-weight: bold;
      color: #000000;
      margin-top: 12pt;
      margin-bottom: 4pt;
    }
    p {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      color: #000000;
      margin: 0 0 8pt 0;
      text-align: justify;
    }
    ul {
      margin: 4pt 0 12pt 0;
      padding-left: 24pt;
    }
    li {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      color: #000000;
      margin-bottom: 4pt;
      text-align: justify;
    }
    hr {
      border: 0;
      border-top: 1px solid #000000;
      margin: 20pt 0;
    }
  </style>
</head>
<body>
  <h1>SOLVE-A-THON 2026</h1>
  <h2>${theme.title}</h2>
  <p><strong>Overview:</strong> ${theme.detailedDescription}</p>
  <hr/>

  ${theme.problemStatements
    .map(
      (ps, index) => `
    <div style="margin-bottom: 24pt; page-break-inside: avoid;">
      <h3>PS ${ps.psNumber || index + 1}: ${ps.title}</h3>
      <p><strong>Description:</strong> ${ps.description}</p>
      
      <h4>Problem Background &amp; Context</h4>
      <p>${ps.detailedDescription}</p>

      <h4>Existing System Challenges</h4>
      <ul>
        ${ps.challenges.map((c) => `<li>${c}</li>`).join("")}
      </ul>

      <h4>Key Requirements &amp; Deliverables</h4>
      <ul>
        ${ps.requirements.map((r) => `<li>${r}</li>`).join("")}
      </ul>

      ${
        ps.guidelines && ps.guidelines.length > 0
          ? `
        <h4>Guidelines &amp; Constraints</h4>
        <ul>
          ${ps.guidelines.map((g) => `<li>${g}</li>`).join("")}
        </ul>
      `
          : ""
      }
    </div>
  `
    )
    .join("<hr/>")}
</body>
</html>
`;

    const blob = new Blob([docContent], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Solve-A-Thon-2026-${theme.slug}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setTimeout(() => setDownloading(false), 800);
  };

  return (
    <div className="min-h-screen bg-[#030712] relative text-white font-sans selection:bg-cyan-500/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-4xl relative z-10 space-y-8">
        {/* Navigation */}
        <div className="border-b border-white/10 pb-4">
          <Link
            href="/#problems"
            className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back to Themes
          </Link>
        </div>

        {/* Theme Header */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
            {theme.title}
          </h1>

          <p className="text-white/70 text-sm leading-relaxed">
            {theme.detailedDescription}
          </p>

          <div className="pt-2">
            <span className="text-xs font-mono text-white/40">
              {theme.problemStatements.length} Problem Statements
            </span>
          </div>
        </div>

        {/* Problem Statements */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-white border-b border-white/10 pb-2">
            Problem Statements
          </h2>

          <div className="space-y-6">
            {theme.problemStatements.map((ps: ProblemStatement, index: number) => (
              <div
                key={ps.id}
                id={ps.id.toLowerCase()}
                className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-5"
              >
                {/* Header */}
                <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                  <span className="font-mono text-xs font-bold text-cyan-400">
                    PS {ps.psNumber || index + 1}
                  </span>
                  <span className="text-white/30 text-xs">•</span>
                  <span className="text-xs font-mono text-white/50 uppercase tracking-wider">
                    {ps.track}
                  </span>
                </div>

                {/* Title & Summary */}
                <div className="space-y-1.5">
                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    {ps.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                    {ps.description}
                  </p>
                </div>

                {/* Context */}
                <div className="space-y-1.5 pt-1">
                  <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                    Background &amp; Context
                  </h4>
                  <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                    {ps.detailedDescription}
                  </p>
                </div>

                {/* Challenges & Requirements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                      Challenges
                    </h4>
                    <ul className="list-disc pl-4 space-y-1.5 text-xs text-white/70 leading-relaxed">
                      {ps.challenges.map((c, idx) => (
                        <li key={idx}>{c}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                      Key Requirements
                    </h4>
                    <ul className="list-disc pl-4 space-y-1.5 text-xs text-white/70 leading-relaxed">
                      {ps.requirements.map((r, idx) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Guidelines */}
                {ps.guidelines && ps.guidelines.length > 0 && (
                  <div className="pt-2 border-t border-white/5 text-xs text-white/60 leading-relaxed">
                    <span className="font-semibold text-white/80">Guidelines: </span>
                    {ps.guidelines.join(" ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Download Button Only */}
        <div className="pt-6 pb-12 flex justify-center">
          <button
            onClick={handleDownloadDocument}
            disabled={downloading}
            className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base">
              {downloading ? "hourglass_empty" : "download"}
            </span>
            <span>{downloading ? "Preparing Document..." : "Download Problem Statements (.doc)"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
