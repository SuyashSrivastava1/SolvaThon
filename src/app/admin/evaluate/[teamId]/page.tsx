"use client";

import { useEffect, useState, use } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getAdminData, saveTeamEvaluation } from "@/actions/admin";
import { isAdminEmail } from "@/config/admin";
import Link from "next/link";

interface PageProps {
  params: Promise<{ teamId: string }>;
}

export default function TeamEvaluationPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const currentTeamId = resolvedParams.teamId;

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [teams, setTeams] = useState<any[]>([]);
  const [currentTeam, setCurrentTeam] = useState<any>(null);

  // Evaluation Form State
  const [scoreInnovation, setScoreInnovation] = useState<string>("");
  const [scoreUnderstanding, setScoreUnderstanding] = useState<string>("");
  const [scoreProgress, setScoreProgress] = useState<string>("");
  const [evaluationNotes, setEvaluationNotes] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  const adminIdentifier = user?.email || "unknown_admin";

  const loadEvaluationData = async (userEmail: string) => {
    setLoading(true);
    setErrorMsg("");

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await getAdminData(userEmail);
        if (res.success && res.teams) {
          setTeams(res.teams);
          const matched = res.teams.find((t: any) => t.id === currentTeamId);
          if (matched) {
            setCurrentTeam(matched);
            loadTeamScores(matched);
          } else if (res.teams.length > 0) {
            router.replace(`/admin/evaluate/${res.teams[0].id}`);
          } else {
            setErrorMsg("No registered teams found in the database.");
          }
          setLoading(false);
          return;
        }

        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 800));
          continue;
        }

        setErrorMsg(res.error || "Failed to load team evaluation data.");
      } catch (err: any) {
        console.error(`Evaluation data load error (attempt ${attempt + 1}):`, err);
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 800));
          continue;
        }
        setErrorMsg("Failed to load evaluation data: " + (err?.message || "Connection timeout"));
      }
    }
    setLoading(false);
  };

  // Load Admin Telemetry & Teams
  useEffect(() => {
    if (authLoading) return;

    if (!user || !user.email || !isAdminEmail(user.email)) {
      router.replace("/admin");
      return;
    }

    loadEvaluationData(user.email);
  }, [user, authLoading, router, currentTeamId]);

  const loadTeamScores = (team: any) => {
    setScoreInnovation(
      team.scoreInnovation !== null && team.scoreInnovation !== undefined
        ? String(team.scoreInnovation)
        : ""
    );
    setScoreUnderstanding(
      team.scoreUnderstanding !== null && team.scoreUnderstanding !== undefined
        ? String(team.scoreUnderstanding)
        : ""
    );
    setScoreProgress(
      team.scoreProgress !== null && team.scoreProgress !== undefined
        ? String(team.scoreProgress)
        : ""
    );
    setEvaluationNotes(team.evaluationNotes || "");
    setSaveSuccessMsg("");
  };

  // Find index in teams array for Left/Right navigation
  const currentIndex = teams.findIndex((t) => t.id === currentTeamId);
  const prevTeam = currentIndex > 0 ? teams[currentIndex - 1] : null;
  const nextTeam = currentIndex >= 0 && currentIndex < teams.length - 1 ? teams[currentIndex + 1] : null;

  // Keyboard navigation: Left Arrow -> Previous, Right Arrow -> Next
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        return;
      }

      if (e.key === "ArrowLeft" && prevTeam) {
        router.push(`/admin/evaluate/${prevTeam.id}`);
      } else if (e.key === "ArrowRight" && nextTeam) {
        router.push(`/admin/evaluate/${nextTeam.id}`);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prevTeam, nextTeam, router]);

  // Live total calculation with decimals
  const currentTotal = Number(
    (
      (parseFloat(scoreInnovation) || 0) +
      (parseFloat(scoreUnderstanding) || 0) +
      (parseFloat(scoreProgress) || 0)
    ).toFixed(2)
  );

  // Save Marks
  const handleSaveMarks = async (goToNextAfterSave = false) => {
    if (!currentTeam) return;

    const inn = Number((Math.max(0, Math.min(10, parseFloat(scoreInnovation) || 0))).toFixed(2));
    const und = Number((Math.max(0, Math.min(10, parseFloat(scoreUnderstanding) || 0))).toFixed(2));
    const pro = Number((Math.max(0, Math.min(10, parseFloat(scoreProgress) || 0))).toFixed(2));
    const total = Number((inn + und + pro).toFixed(2));

    setSaving(true);
    setSaveSuccessMsg("");

    const res = await saveTeamEvaluation(adminIdentifier, currentTeam.id, {
      scoreInnovation: inn,
      scoreUnderstanding: und,
      scoreProgress: pro,
      evaluationNotes: evaluationNotes.trim(),
    });

    if (res.success) {
      setSaveSuccessMsg(`✓ Marks successfully saved! Total Score: ${total}/30`);

      // Update local team state
      const updatedTeam = {
        ...currentTeam,
        scoreInnovation: inn,
        scoreUnderstanding: und,
        scoreProgress: pro,
        scoreTotal: total,
        evaluatedBy: adminIdentifier,
        evaluationNotes: evaluationNotes.trim(),
        evaluatedAt: new Date().toISOString(),
      };

      setCurrentTeam(updatedTeam);
      setTeams((prev) => prev.map((t) => (t.id === currentTeam.id ? updatedTeam : t)));

      if (goToNextAfterSave && nextTeam) {
        setTimeout(() => {
          router.push(`/admin/evaluate/${nextTeam.id}`);
        }, 600);
      }
    } else {
      alert(res.error || "Failed to save evaluation.");
    }
    setSaving(false);
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#050B14] flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-400 rounded-full animate-spin mb-4"></div>
        <p className="text-white/60 font-mono text-xs tracking-widest uppercase">
          LOADING JURY EVALUATION WORKBENCH...
        </p>
      </div>
    );
  }

  if (errorMsg || !currentTeam) {
    return (
      <div className="min-h-screen bg-[#050B14] flex flex-col items-center justify-center text-white px-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 max-w-md text-center space-y-4">
          <span className="material-symbols-outlined text-4xl text-red-400">error</span>
          <h2 className="text-xl font-bold">Evaluation Workbench Error</h2>
          <p className="text-xs text-white/70">{errorMsg || "Requested team could not be found."}</p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                if (user?.email) loadEvaluationData(user.email);
              }}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-lg shadow-purple-600/30"
            >
              Retry Connection
            </button>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Return to Admin Panel
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isEvaluated = currentTeam.scoreTotal !== null && currentTeam.scoreTotal !== undefined;

  return (
    <div className="min-h-screen bg-[#030712] relative text-white font-sans selection:bg-purple-500/30 pb-20">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none"></div>

      {/* ═════════ STICKY TOP NAVIGATION BAR ═════════ */}
      <header className="sticky top-0 z-50 bg-[#030712]/90 backdrop-blur-2xl border-b border-white/10 px-4 md:px-8 py-3.5 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Left: Back Link & Counter */}
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-400 hover:text-cyan-300 transition-all text-xs font-semibold cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Back to Admin Panel
            </Link>

            <span className="h-5 w-[1px] bg-white/10 hidden sm:block"></span>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 font-mono text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
              TEAM {currentIndex + 1} OF {teams.length}
            </div>
          </div>

          {/* Center: Quick Team Selector */}
          <div className="hidden md:flex items-center gap-2">
            <span className="text-[11px] font-mono text-white/40 uppercase">Jump to:</span>
            <select
              value={currentTeamId}
              onChange={(e) => router.push(`/admin/evaluate/${e.target.value}`)}
              className="bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer [&>option]:bg-[#030712]"
            >
              {teams.map((t, idx) => (
                <option key={t.id} value={t.id}>
                  {idx + 1}. {t.name} (Code: {t.teamCode}) {t.scoreTotal !== null ? `✓ ${t.scoreTotal}/30` : "• Pending"}
                </option>
              ))}
            </select>
          </div>

          {/* Right: Left & Right Navigation Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => prevTeam && router.push(`/admin/evaluate/${prevTeam.id}`)}
              disabled={!prevTeam}
              title="Previous Team (Arrow Left)"
              className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer text-white"
            >
              <span className="material-symbols-outlined text-base">chevron_left</span>
              <span className="hidden sm:inline">Previous</span>
              <span className="text-[10px] font-mono text-white/40 hidden md:inline">[←]</span>
            </button>

            <button
              type="button"
              onClick={() => nextTeam && router.push(`/admin/evaluate/${nextTeam.id}`)}
              disabled={!nextTeam}
              title="Next Team (Arrow Right)"
              className="px-3.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="hidden sm:inline">Next</span>
              <span className="text-[10px] font-mono text-purple-300/60 hidden md:inline">[→]</span>
              <span className="material-symbols-outlined text-base">chevron_right</span>
            </button>
          </div>
        </div>
      </header>

      {/* ═════════ MAIN CONTENT CONTAINER ═════════ */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-8 space-y-8 relative z-10">

        {/* ─── TEAM SUMMARY HERO HEADER ─── */}
        <div className="bg-gradient-to-br from-purple-950/40 via-slate-900/60 to-indigo-950/40 border border-purple-500/30 rounded-3xl p-6 md:p-8 backdrop-blur-2xl shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold tracking-wide">
                  CODE: {currentTeam.teamCode}
                </span>
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs font-mono">
                  {currentTeam.memberCount}/4 Members Joined
                </span>
                {isEvaluated ? (
                  <span className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-mono font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">verified</span>
                    EVALUATED: {currentTeam.scoreTotal}/30
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">hourglass_top</span>
                    PENDING EVALUATION
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                {currentTeam.name}
              </h1>

              <div className="flex items-center gap-2 text-sm text-cyan-400 font-semibold font-mono">
                <span className="material-symbols-outlined text-lg">deployed_code</span>
                <span>Track: {currentTeam.problemStatement || "Not Selected"}</span>
              </div>
            </div>

            {/* Quick Status / Total Score Widget */}
            <div className="bg-black/60 border border-purple-500/30 rounded-2xl p-5 text-center min-w-[200px] shadow-xl">
              <span className="text-[10px] font-mono uppercase text-purple-300/80 tracking-widest block mb-1">
                CURRENT TOTAL MARKS
              </span>
              <div className="text-3xl md:text-4xl font-black text-white font-mono">
                {currentTotal}
                <span className="text-lg text-white/40 font-normal"> / 30</span>
              </div>
              <p className="text-[10px] text-white/40 font-mono mt-1">
                {isEvaluated ? "Saved in Database" : "Unsaved Draft"}
              </p>
            </div>
          </div>

          {/* ─── TEAM LEADER & ROSTER CARDS ─── */}
          <div className="space-y-3">
            <span className="text-xs font-mono text-white/50 uppercase tracking-wider block font-semibold">
              Team Roster &amp; Leadership
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {currentTeam.members.map((m: any, idx: number) => {
                const isLeader = idx === 0 || m.fullName === currentTeam.leaderName;
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all ${
                      isLeader
                        ? "bg-gradient-to-br from-amber-500/10 via-black/40 to-black/60 border-amber-500/40 ring-1 ring-amber-500/30 shadow-lg"
                        : "bg-black/40 border-white/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white/5 text-cyan-400">
                        0{idx + 1}
                      </span>
                      {isLeader && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-black uppercase flex items-center gap-1">
                          👑 TEAM LEADER
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-white truncate">{m.fullName}</h4>
                    <p className="text-[11px] font-mono text-white/50 truncate mt-0.5">{m.emailId}</p>
                    <div className="mt-2.5 pt-2 border-t border-white/5 text-[11px] font-mono text-cyan-300/80 flex items-center justify-between">
                      <span>{m.hostelBlock} • {m.roomNumber}</span>
                      <span className="text-white/40">{m.ticketId}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── JURY EVALUATION SCORECARD CONSOLE ─── */}
        <section className="bg-white/[0.03] border-2 border-purple-500/40 rounded-3xl p-6 md:p-8 backdrop-blur-2xl shadow-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-xs font-mono text-purple-400 uppercase tracking-widest font-bold">
                <span className="material-symbols-outlined text-base">fact_check</span>
                OFFICIAL JURY EVALUATION CONSOLE
              </div>
              <h2 className="text-2xl font-black text-white">Score Team on 3 Core Criteria</h2>
              <p className="text-xs text-white/60">
                Grades are scored from 0 to 10 points per criterion. Decimals are fully supported (e.g., 8.5).
              </p>
            </div>

            {isEvaluated && (
              <div className="text-right">
                <span className="text-xs font-mono text-purple-300 block">
                  Last Graded by: <strong className="text-white">{currentTeam.evaluatedBy}</strong>
                </span>
                <span className="text-[10px] font-mono text-white/40">
                  {new Date(currentTeam.evaluatedAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* 3 Criteria Interactive Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Criterion 1: Innovation */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-purple-400 uppercase font-bold block">
                    CRITERION 01
                  </span>
                  <label className="text-sm font-black text-white">Innovation</label>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 font-mono text-xs font-bold">
                  0 - 10
                </span>
              </div>

              <input
                type="number"
                min="0"
                max="10"
                step="any"
                value={scoreInnovation}
                onChange={(e) => setScoreInnovation(e.target.value)}
                placeholder="Score (0-10)"
                className="w-full bg-white/5 border border-white/10 focus:border-purple-500 rounded-xl px-4 py-3 text-white font-mono text-lg font-bold focus:ring-2 focus:ring-purple-500/50 outline-none transition-all placeholder-white/20"
              />

              <p className="text-xs text-white/50 leading-relaxed">
                Creativity, novelty, uniqueness of concept, and technical originality.
              </p>
            </div>

            {/* Criterion 2: Understanding of Problem Statement */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-purple-400 uppercase font-bold block">
                    CRITERION 02
                  </span>
                  <label className="text-sm font-black text-white">Problem Understanding</label>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 font-mono text-xs font-bold">
                  0 - 10
                </span>
              </div>

              <input
                type="number"
                min="0"
                max="10"
                step="any"
                value={scoreUnderstanding}
                onChange={(e) => setScoreUnderstanding(e.target.value)}
                placeholder="Score (0-10)"
                className="w-full bg-white/5 border border-white/10 focus:border-purple-500 rounded-xl px-4 py-3 text-white font-mono text-lg font-bold focus:ring-2 focus:ring-purple-500/50 outline-none transition-all placeholder-white/20"
              />

              <p className="text-xs text-white/50 leading-relaxed">
                Clarity of hostel campus challenges, edge cases, scope, and technical constraints.
              </p>
            </div>

            {/* Criterion 3: Progress & Execution */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-purple-400 uppercase font-bold block">
                    CRITERION 03
                  </span>
                  <label className="text-sm font-black text-white">Progress &amp; Execution</label>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 font-mono text-xs font-bold">
                  0 - 10
                </span>
              </div>

              <input
                type="number"
                min="0"
                max="10"
                step="any"
                value={scoreProgress}
                onChange={(e) => setScoreProgress(e.target.value)}
                placeholder="Score (0-10)"
                className="w-full bg-white/5 border border-white/10 focus:border-purple-500 rounded-xl px-4 py-3 text-white font-mono text-lg font-bold focus:ring-2 focus:ring-purple-500/50 outline-none transition-all placeholder-white/20"
              />

              <p className="text-xs text-white/50 leading-relaxed">
                Prototype quality, functional demo, GitHub source implementation, and delivery.
              </p>
            </div>
          </div>

          {/* Jury Notes / Feedback */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-white uppercase tracking-wider block">
              Jury Remarks &amp; Feedback Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={evaluationNotes}
              onChange={(e) => setEvaluationNotes(e.target.value)}
              placeholder="Constructive feedback, notable strengths, architectural feedback for the team..."
              className="w-full bg-black/40 border border-white/10 focus:border-purple-500 rounded-xl px-4 py-3 text-white font-mono text-xs outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder-white/30"
            />
          </div>

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-purple-500/20 border border-purple-500/40 rounded-xl font-mono text-center">
                <span className="text-[10px] text-purple-300 uppercase block font-bold">TOTAL SCORE</span>
                <span className="text-xl font-black text-white">{currentTotal} / 30</span>
              </div>
              <span className="text-xs text-white/40 font-mono hidden md:inline">
                (Tip: Use keyboard arrow keys ← and → to navigate teams)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => handleSaveMarks(false)}
                disabled={saving}
                className="flex-1 sm:flex-none px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-purple-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                    <span>Saving Marks...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">save</span>
                    <span>Save Marks</span>
                  </>
                )}
              </button>

              {nextTeam && (
                <button
                  type="button"
                  onClick={() => handleSaveMarks(true)}
                  disabled={saving}
                  className="flex-1 sm:flex-none px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Save &amp; Next Team</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
              )}
            </div>
          </div>

          {saveSuccessMsg && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs font-mono text-center">
              {saveSuccessMsg}
            </div>
          )}
        </section>

        {/* ─── DELIVERABLES SHOWCASE: STAGE 1 VS STAGE 2 ─── */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-cyan-400">inventory_2</span>
            Team Submissions &amp; Project Deliverables
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stage 1 Deliverables Card */}
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-mono text-cyan-400 uppercase font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">lightbulb</span>
                  STAGE 01 // IDEA &amp; ABSTRACT SUBMISSION
                </span>
                <span className="text-[11px] font-mono text-white/40">
                  {currentTeam.submittedAt ? new Date(currentTeam.submittedAt).toLocaleString() : "Not submitted"}
                </span>
              </div>

              {currentTeam.pptUrl ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-[11px] font-mono text-white/40 block mb-1">PRESENTATION LINK:</span>
                    <a
                      href={currentTeam.pptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-mono rounded-xl transition-all"
                    >
                      <span className="material-symbols-outlined text-base">open_in_new</span>
                      Open Presentation / Slides ↗
                    </a>
                  </div>

                  {currentTeam.understanding && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-mono text-white/40 block uppercase">Understanding of Problem:</span>
                      <p className="text-xs text-white/80 bg-black/40 border border-white/5 rounded-xl p-3.5 leading-relaxed font-mono whitespace-pre-wrap">
                        {currentTeam.understanding}
                      </p>
                    </div>
                  )}

                  {currentTeam.solutionSummary && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-mono text-white/40 block uppercase">Proposed Architecture &amp; Novelty:</span>
                      <p className="text-xs text-white/80 bg-black/40 border border-white/5 rounded-xl p-3.5 leading-relaxed font-mono whitespace-pre-wrap">
                        {currentTeam.solutionSummary}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-white/30 font-mono text-xs">
                  No Stage 1 idea presentation submitted yet.
                </div>
              )}
            </div>

            {/* Stage 2 Deliverables Card */}
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-mono text-emerald-400 uppercase font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">rocket_launch</span>
                  STAGE 02 // FINAL PROJECT DELIVERABLE
                </span>
                <span className="text-[11px] font-mono text-white/40">
                  {currentTeam.finalSubmittedAt ? new Date(currentTeam.finalSubmittedAt).toLocaleString() : "Not submitted"}
                </span>
              </div>

              {currentTeam.finalDocUrl || currentTeam.finalRepoUrl ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2.5">
                    {currentTeam.finalDocUrl && (
                      <a
                        href={currentTeam.finalDocUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-mono rounded-xl transition-all"
                      >
                        <span className="material-symbols-outlined text-base">description</span>
                        Final Report ↗
                      </a>
                    )}
                    {currentTeam.finalRepoUrl && (
                      <a
                        href={currentTeam.finalRepoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-mono rounded-xl transition-all"
                      >
                        <span className="material-symbols-outlined text-base">code</span>
                        Source Code Repo ↗
                      </a>
                    )}
                    {currentTeam.finalDemoUrl && (
                      <a
                        href={currentTeam.finalDemoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-mono rounded-xl transition-all"
                      >
                        <span className="material-symbols-outlined text-base">play_circle</span>
                        Live Demo / Video ↗
                      </a>
                    )}
                  </div>

                  {currentTeam.finalSummary && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-mono text-white/40 block uppercase">Progress &amp; Implementation Summary:</span>
                      <p className="text-xs text-white/80 bg-black/40 border border-white/5 rounded-xl p-3.5 leading-relaxed font-mono whitespace-pre-wrap">
                        {currentTeam.finalSummary}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-white/30 font-mono text-xs">
                  No Stage 2 final project documentation or repository submitted yet.
                </div>
              )}
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
