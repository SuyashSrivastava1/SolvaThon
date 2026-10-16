"use client";

import { useEffect, useState, use } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getAdminData, saveTeamEvaluation, toggleTeamFreezeStatus } from "@/actions/admin";
import { RUBRICS, getRoundInfo } from "@/config/rubrics";
import Link from "next/link";

interface PageProps {
  params: Promise<{ teamId: string }>;
}

export default function TeamEvaluationPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const currentTeamId = resolvedParams.teamId;

  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [teams, setTeams] = useState<any[]>([]);
  const [currentTeam, setCurrentTeam] = useState<any>(null);
  const [activeReviewRound, setActiveReviewRound] = useState<number>(1);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Evaluation Form State (weights out of 10 for each rubric)
  const [scoreInnovation, setScoreInnovation] = useState<string>("");
  const [scoreUnderstanding, setScoreUnderstanding] = useState<string>("");
  const [scoreProgress, setScoreProgress] = useState<string>("");
  const [evaluationNotes, setEvaluationNotes] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const [togglingFreeze, setTogglingFreeze] = useState(false);
  const [freezeMsg, setFreezeMsg] = useState("");

  const adminIdentifier = user?.email || "unknown_admin";
  const isCurrentUserSuperAdmin = isSuperAdmin;

  const loadEvaluationData = async () => {
    setLoading(true);
    setErrorMsg("");

    let tokenOrEmail = user?.email || "";
    try {
      if (user) {
        tokenOrEmail = (await user.getIdToken()) || user.email || "";
      }
    } catch {}

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await getAdminData(tokenOrEmail);
        if (res.success && res.teams) {
          setIsSuperAdmin(Boolean(res.isSuperAdmin));
          const currentRound = res.systemSettings?.activeReviewRound || 1;
          setActiveReviewRound(currentRound);
          setTeams(res.teams);

          const matched = res.teams.find((t: any) => t.id === currentTeamId);
          if (matched) {
            setCurrentTeam(matched);
            loadTeamScores(matched, currentRound);
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

    if (!user || !isAdmin) {
      router.replace("/admin");
      return;
    }

    loadEvaluationData();
  }, [user, authLoading, isAdmin, router, currentTeamId]);

  const loadTeamScores = (team: any, roundNum: number) => {
    const roundEval = (team.evaluations || []).find((e: any) => e.round === roundNum);
    if (roundEval) {
      setScoreInnovation(roundEval.scoreInnovation !== null && roundEval.scoreInnovation !== undefined ? String(roundEval.scoreInnovation) : "");
      setScoreUnderstanding(roundEval.scoreUnderstanding !== null && roundEval.scoreUnderstanding !== undefined ? String(roundEval.scoreUnderstanding) : "");
      setScoreProgress(roundEval.scoreProgress !== null && roundEval.scoreProgress !== undefined ? String(roundEval.scoreProgress) : "");
      setEvaluationNotes(roundEval.evaluationNotes || "");
    } else {
      // Fallback for round 1 if only legacy fields exist
      if (roundNum === 1 && team.scoreInnovation !== null && team.scoreInnovation !== undefined) {
        setScoreInnovation(String(team.scoreInnovation));
        setScoreUnderstanding(team.scoreUnderstanding !== null && team.scoreUnderstanding !== undefined ? String(team.scoreUnderstanding) : "");
        setScoreProgress(team.scoreProgress !== null && team.scoreProgress !== undefined ? String(team.scoreProgress) : "");
        setEvaluationNotes(team.evaluationNotes || "");
      } else {
        setScoreInnovation("");
        setScoreUnderstanding("");
        setScoreProgress("");
        setEvaluationNotes("");
      }
    }
    setSaveSuccessMsg("");
    setFreezeMsg("");
  };

  // Find index in teams array for Left/Right navigation
  const currentIndex = teams.findIndex((t) => t.id === currentTeamId);
  const prevTeam = currentIndex > 0 ? teams[currentIndex - 1] : null;
  const nextTeam = currentIndex >= 0 && currentIndex < teams.length - 1 ? teams[currentIndex + 1] : null;

  // Keyboard navigation: Left Arrow -> Previous, Right Arrow -> Next
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") {
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

  // Live total score calculation (0 - 30)
  const innVal = parseFloat(scoreInnovation) || 0;
  const undVal = parseFloat(scoreUnderstanding) || 0;
  const proVal = parseFloat(scoreProgress) || 0;
  const currentTotal = Number((innVal + undVal + proVal).toFixed(2));

  // Determine current team evaluation state for active round
  const currentRoundEval = currentTeam?.evaluations?.find((e: any) => e.round === activeReviewRound);
  const isEvaluated = Boolean(
    (currentRoundEval && currentRoundEval.scoreTotal !== null && currentRoundEval.scoreTotal !== undefined) ||
    (activeReviewRound === 1 && currentTeam?.scoreTotal !== null && currentTeam?.scoreTotal !== undefined)
  );

  // Is frozen?
  const isFrozen = currentRoundEval ? currentRoundEval.isFrozen : false;

  // Evaluator: Submit & automatically freeze marks
  const handleSaveMarks = async (goToNextAfterSave = false) => {
    if (!currentTeam || isCurrentUserSuperAdmin) return;

    if (!scoreInnovation || !scoreUnderstanding || !scoreProgress) {
      alert("Please select a rating option for all 3 rubrics before submitting.");
      return;
    }

    setSaving(true);
    setSaveSuccessMsg("");

    const res = await saveTeamEvaluation(adminIdentifier, currentTeam.id, activeReviewRound, {
      scoreInnovation: innVal,
      scoreUnderstanding: undVal,
      scoreProgress: proVal,
      evaluationNotes: evaluationNotes.trim(),
    });

    if (res.success) {
      setSaveSuccessMsg(`✓ Marks successfully locked! Total Score: ${currentTotal}/30`);

      // Update local team state
      const updatedEval = {
        round: activeReviewRound,
        scoreInnovation: innVal,
        scoreUnderstanding: undVal,
        scoreProgress: proVal,
        scoreTotal: currentTotal,
        evaluatedBy: adminIdentifier,
        evaluationNotes: evaluationNotes.trim(),
        evaluatedAt: new Date().toISOString(),
        isFrozen: true,
      };

      const existingEvals = currentTeam.evaluations || [];
      const updatedEvals = existingEvals.filter((e: any) => e.round !== activeReviewRound).concat(updatedEval);

      const updatedTeam = {
        ...currentTeam,
        evaluations: updatedEvals,
        activeRoundEval: updatedEval,
        isFrozen: true,
        scoreInnovation: innVal,
        scoreUnderstanding: undVal,
        scoreProgress: proVal,
        scoreTotal: currentTotal,
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

  // Super Admin Exclusive: Toggle Freeze Status
  const handleToggleFreeze = async (targetFreeze: boolean) => {
    if (!isCurrentUserSuperAdmin || !currentTeam) return;

    setTogglingFreeze(true);
    setFreezeMsg("");

    const res = await toggleTeamFreezeStatus(adminIdentifier, currentTeam.id, activeReviewRound, targetFreeze);
    if (res.success) {
      setFreezeMsg(targetFreeze ? "✓ Marks are now LOCKED." : "✓ Marks are now UNLOCKED. Evaluators may now modify and resubmit.");

      // Update state locally
      const existingEvals = currentTeam.evaluations || [];
      const targetEval = existingEvals.find((e: any) => e.round === activeReviewRound);
      let updatedEvals: any[];

      if (targetEval) {
        updatedEvals = existingEvals.map((e: any) =>
          e.round === activeReviewRound ? { ...e, isFrozen: targetFreeze } : e
        );
      } else {
        updatedEvals = existingEvals.concat({
          round: activeReviewRound,
          scoreInnovation: innVal || null,
          scoreUnderstanding: undVal || null,
          scoreProgress: proVal || null,
          scoreTotal: isEvaluated ? currentTotal : null,
          evaluatedBy: currentTeam.evaluatedBy || null,
          evaluationNotes: evaluationNotes || "",
          evaluatedAt: currentTeam.evaluatedAt || new Date().toISOString(),
          isFrozen: targetFreeze,
        });
      }

      const updatedTeam = {
        ...currentTeam,
        evaluations: updatedEvals,
        isFrozen: targetFreeze,
      };

      setCurrentTeam(updatedTeam);
      setTeams((prev) => prev.map((t) => (t.id === currentTeam.id ? updatedTeam : t)));
    } else {
      alert(res.error || "Failed to toggle freeze state.");
    }
    setTogglingFreeze(false);
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#07050e] flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-violet-500/20 border-t-violet-400 rounded-full animate-spin mb-4"></div>
        <p className="text-white/60 font-mono text-xs tracking-widest uppercase">
          LOADING JURY EVALUATION WORKBENCH...
        </p>
      </div>
    );
  }

  if (errorMsg || !currentTeam) {
    return (
      <div className="min-h-screen bg-[#07050e] flex flex-col items-center justify-center text-white px-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 max-w-md text-center space-y-4">
          <span className="material-symbols-outlined text-4xl text-red-400">error</span>
          <h2 className="text-xl font-bold">Evaluation Workbench Error</h2>
          <p className="text-xs text-white/70">{errorMsg || "Requested team could not be found."}</p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                loadEvaluationData();
              }}
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-lg shadow-violet-600/30"
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

  const roundInfo = getRoundInfo(activeReviewRound);

  return (
    <div className="min-h-screen bg-[#07050e] relative text-white font-sans selection:bg-violet-500/30 pb-20">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-violet-600/15 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-fuchsia-600/12 rounded-full blur-[140px] pointer-events-none"></div>

      {/* ═════════ STICKY TOP NAVIGATION BAR ═════════ */}
      <header className="sticky top-0 z-50 bg-[#07050e]/90 backdrop-blur-2xl border-b border-white/10 px-4 md:px-8 py-3.5 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Left: Back Link & Counter */}
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-violet-400 hover:text-violet-300 transition-all text-xs font-semibold cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Back to Admin Panel
            </Link>

            <span className="h-5 w-[1px] bg-white/10 hidden sm:block"></span>

            <div className="inline-flex items-center px-3 py-1 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-300 font-mono text-xs font-bold">
              TEAM {currentIndex + 1} OF {teams.length}
            </div>

            {/* Active Round Indicator Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300 font-mono text-xs font-bold uppercase">
              <span className="material-symbols-outlined text-sm">schedule</span>
              <span>{roundInfo.title}: {roundInfo.subtitle}</span>
            </div>
          </div>

          {/* Center: Quick Team Selector */}
          <div className="hidden md:flex items-center gap-2">
            <span className="text-[11px] font-mono text-white/40 uppercase">Jump to:</span>
            <select
              value={currentTeamId}
              onChange={(e) => router.push(`/admin/evaluate/${e.target.value}`)}
              className="bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer [&>option]:bg-[#0e091c]"
            >
              {teams.map((t, idx) => {
                const teamRoundEval = (t.evaluations || []).find((e: any) => e.round === activeReviewRound);
                const score = teamRoundEval ? teamRoundEval.scoreTotal : (activeReviewRound === 1 ? t.scoreTotal : null);
                const isTeamFrozen = teamRoundEval ? teamRoundEval.isFrozen : false;
                return (
                  <option key={t.id} value={t.id}>
                    {idx + 1}. {t.name} (Code: {t.teamCode}) {score !== null && score !== undefined ? `✓ ${score}/30 ${isTeamFrozen ? '[🧊]' : ''}` : "• Pending"}
                  </option>
                );
              })}
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

      {/* ═════════ MAIN WORKBENCH CONTENT ═════════ */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-8 space-y-8">
        
        {/* ─── TEAM SUMMARY CARD & ROSTER ─── */}
        <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl relative overflow-hidden space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 font-mono text-xs font-bold uppercase tracking-wider">
                  TEAM CLUSTER: {currentTeam.teamCode}
                </span>
                <span className="px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300 font-mono text-xs">
                  {currentTeam.memberCount} / 4 Members
                </span>
                {isEvaluated && (
                  <span className={`px-3 py-1 rounded-full font-mono text-xs font-bold flex items-center gap-1 ${
                    isFrozen
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    <span className="material-symbols-outlined text-xs">{isFrozen ? 'lock' : 'verified'}</span>
                    {roundInfo.title}: {currentTotal}/30 {isFrozen ? '[FROZEN]' : '[UNFROZEN]'}
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight pt-1">
                {currentTeam.name}
              </h1>
              <p className="text-xs text-white/60 font-mono flex items-center gap-2">
                <span className="text-emerald-400">Team Leader:</span>
                <span className="text-white font-bold">{currentTeam.leaderName}</span>
                <span>({currentTeam.leaderEmail} • {currentTeam.leaderPhone})</span>
              </p>
            </div>

            {/* Track Badge */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-4 text-right min-w-[200px]">
              <span className="text-[10px] font-mono uppercase text-white/40 block">PROBLEM STATEMENT TRACK</span>
              <span className="text-sm font-bold text-violet-300 block truncate max-w-[280px]">
                {currentTeam.problemStatement || "Not Selected"}
              </span>
            </div>
          </div>

          {/* Members Grid */}
          <div>
            <h4 className="text-xs font-mono text-white/50 uppercase tracking-widest mb-3">
              VERIFIED TEAM ROSTER ({currentTeam.members.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {currentTeam.members.map((m: any, idx: number) => {
                const isLeader = m.fullName === currentTeam.leaderName || m.emailId === currentTeam.leaderEmail;
                return (
                  <div key={idx} className="bg-black/30 border border-white/5 rounded-xl p-3 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-mono text-xs text-purple-300 font-bold shrink-0">
                      0{idx + 1}
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-white truncate">{m.fullName}</p>
                        {isLeader && (
                          <span className="text-[9px] font-mono px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            LEADER
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-mono text-white/40 truncate">{m.hostelBlock} • Rm {m.roomNumber}</p>
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
                OFFICIAL JURY WORKBENCH: {roundInfo.title.toUpperCase()} ({roundInfo.subtitle.toUpperCase()})
              </div>
              <h2 className="text-2xl font-black text-white">
                {isCurrentUserSuperAdmin ? "Evaluation Oversight & Lock Governance" : "Score Team via 5-Tier Rubrics (Out of 10)"}
              </h2>
              <p className="text-xs text-white/60">
                {isCurrentUserSuperAdmin
                  ? "Super Admin Governance Mode: Marking is conducted exclusively by evaluators. You may review submitted marks and toggle lock state."
                  : "Select an evaluation tier for each rubric. Total marks will compute automatically. Marks will be locked upon submission."}
              </p>
            </div>

            {isEvaluated && (
              <div className="text-right">
                <span className="text-xs font-mono text-purple-300 block">
                  Status: <strong className="text-white">Evaluated &amp; Locked</strong>
                </span>
                <span className="text-[10px] font-mono text-white/40">
                  {currentRoundEval?.evaluatedAt ? new Date(currentRoundEval.evaluatedAt).toLocaleString() : new Date(currentTeam.evaluatedAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* ─── SUPER ADMIN GOVERNANCE CONTROLS ─── */}
          {isCurrentUserSuperAdmin && (
            <div className="p-5 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-400 text-lg">admin_panel_settings</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-300">Super Admin Lock Control</span>
                  </div>
                  <p className="text-xs text-white/70">
                    {isFrozen
                      ? "Marks for this team are currently LOCKED. Evaluators cannot edit or change their submission."
                      : "Marks for this team are currently UNLOCKED. Evaluators can edit and resubmit marks."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleFreeze(!isFrozen)}
                  disabled={togglingFreeze}
                  className={`px-5 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg ${
                    isFrozen
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black shadow-amber-500/20"
                      : "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-purple-500/20"
                  }`}
                >
                  {togglingFreeze ? (
                    <>
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                      <span>Updating Lock State...</span>
                    </>
                  ) : isFrozen ? (
                    <>
                      <span className="material-symbols-outlined text-base">lock_open</span>
                      <span>Unlock Marks for Evaluator Editing</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">lock</span>
                      <span>Lock Marks</span>
                    </>
                  )}
                </button>
              </div>

              {freezeMsg && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-mono text-center">
                  {freezeMsg}
                </div>
              )}
            </div>
          )}

          {/* ─── LOCKED BANNER FOR EVALUATORS ─── */}
          {!isCurrentUserSuperAdmin && isFrozen && (
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0">
                  <span className="material-symbols-outlined text-2xl">lock</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-300">Evaluation Locked</h4>
                  <p className="text-xs text-white/70">
                    Marks for this team in {roundInfo.title} have been submitted and locked. Only Super Admin has permissions to unlock marks.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-mono font-bold uppercase shrink-0">
                LOCKED BY SYSTEM
              </span>
            </div>
          )}

          {/* ─── 3 RUBRICS 5-TIER DROPDOWNS ─── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {RUBRICS.map((rubric, rIdx) => {
              const currentScore = rubric.id === "scoreInnovation" ? scoreInnovation : (rubric.id === "scoreUnderstanding" ? scoreUnderstanding : scoreProgress);
              const setScore = rubric.id === "scoreInnovation" ? setScoreInnovation : (rubric.id === "scoreUnderstanding" ? setScoreUnderstanding : setScoreProgress);
              const selectedTier = rubric.tiers.find((t) => String(t.weight) === String(currentScore));

              const isDisabled = isCurrentUserSuperAdmin || (!isCurrentUserSuperAdmin && isFrozen);

              return (
                <div key={rubric.id} className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-purple-400 uppercase font-bold">
                        RUBRIC 0{rIdx + 1}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 font-mono text-xs font-bold">
                        {currentScore ? `${currentScore} / 10 Marks` : "0 - 10"}
                      </span>
                    </div>

                    <label className="text-sm font-black text-white block">
                      {rubric.criterionName}
                    </label>
                    <p className="text-[11px] text-white/50 leading-relaxed">
                      {rubric.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-mono uppercase text-white/40 block">
                      Select Rating Tier (Weight Denotes Marks):
                    </label>
                    <select
                      value={currentScore}
                      disabled={isDisabled}
                      onChange={(e) => setScore(e.target.value)}
                      className="w-full bg-black/60 border border-white/15 focus:border-purple-500 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl px-3.5 py-3 text-white text-xs font-medium outline-none focus:ring-2 focus:ring-purple-500/50 transition-all cursor-pointer [&>option]:bg-[#030712] [&>option]:text-white"
                    >
                      <option value="">-- Choose Rating (5 Options) --</option>
                      {rubric.tiers.map((tier) => (
                        <option key={tier.weight} value={tier.weight}>
                          {tier.label}
                        </option>
                      ))}
                    </select>

                    {selectedTier && (
                      <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-200 leading-relaxed font-sans">
                        <strong className="text-white block font-semibold mb-0.5">{selectedTier.label}</strong>
                        {selectedTier.description}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ─── REVIEW FEEDBACK / NOTES (OPTIONAL) ─── */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-white uppercase tracking-wider block">
              Evaluator Review Remarks &amp; Feedback Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={evaluationNotes}
              disabled={isCurrentUserSuperAdmin || (!isCurrentUserSuperAdmin && isFrozen)}
              onChange={(e) => setEvaluationNotes(e.target.value)}
              placeholder="Provide constructive feedback, architectural insights, or highlights for the team..."
              className="w-full bg-black/40 border border-white/10 focus:border-purple-500 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl px-4 py-3 text-white font-mono text-xs outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder-white/30"
            />
          </div>

          {/* ─── ACTION FOOTER ─── */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="px-5 py-2.5 bg-purple-500/20 border border-purple-500/40 rounded-xl font-mono text-center">
                <span className="text-[10px] text-purple-300 uppercase block font-bold">TOTAL SCORE ({roundInfo.title})</span>
                <span className="text-2xl font-black text-white">{currentTotal} / 30</span>
              </div>
              <span className="text-xs text-white/40 font-mono hidden md:inline">
                (Tip: Use keyboard arrow keys ← and → to navigate teams)
              </span>
            </div>

            {/* Evaluator Action Buttons: Exactly One Button per user specifications */}
            {!isCurrentUserSuperAdmin && (
              <div className="flex flex-wrap items-center gap-3">
                {isFrozen ? (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled
                      className="px-6 py-3.5 bg-white/10 text-white/50 font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-not-allowed flex items-center justify-center gap-2 border border-white/10"
                    >
                      <span className="material-symbols-outlined text-base">lock</span>
                      <span>Marks Locked</span>
                    </button>
                    {nextTeam && (
                      <button
                        type="button"
                        onClick={() => router.push(`/admin/evaluate/${nextTeam.id}`)}
                        className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span>Next Team</span>
                        <span className="material-symbols-outlined text-base">arrow_forward</span>
                      </button>
                    )}
                  </div>
                ) : nextTeam ? (
                  <button
                    type="button"
                    onClick={() => handleSaveMarks(true)}
                    disabled={saving}
                    className="flex-1 sm:flex-none px-7 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-emerald-500/25 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <span className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin"></span>
                        <span>Locking Marks...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-base">lock</span>
                        <span>Lock and Next</span>
                        <span className="material-symbols-outlined text-base">arrow_forward</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSaveMarks(false)}
                    disabled={saving}
                    className="flex-1 sm:flex-none px-7 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-purple-500/25 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                        <span>Locking Marks...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-base">lock</span>
                        <span>Lock and Save</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
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
            <span className="material-symbols-outlined text-violet-400">inventory_2</span>
            Team Submissions &amp; Project Deliverables
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stage 1 Deliverables Card */}
            <div className="bg-[#0e091c]/80 border border-violet-500/20 rounded-3xl p-6 backdrop-blur-xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-mono text-violet-400 uppercase font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">lightbulb</span>
                  STAGE 01: IDEA &amp; ABSTRACT SUBMISSION
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
                      className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-mono rounded-xl transition-all"
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
            <div className="bg-[#0e091c]/80 border border-violet-500/20 rounded-3xl p-6 backdrop-blur-xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-mono text-emerald-400 uppercase font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">rocket_launch</span>
                  STAGE 02: FINAL PROJECT DELIVERABLE
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
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-mono rounded-xl transition-all"
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
