"use client";

import { useState, useEffect } from "react";
import {
  getAdminData,
  toggleSubmissionPhase,
  updateHackathonTimer,
  saveTeamEvaluation,
} from "@/actions/admin";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { isAdminEmail, isSuperAdminEmail } from "@/config/admin";
import { auth } from "@/lib/firebase/config";
import { clearParticipantSession } from "@/lib/authSession";
import * as XLSX from "xlsx";

export default function AdminPortalPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [data, setData] = useState<any>(null);

  // Search & Filter state
  const [activeTab, setActiveTab] = useState<"teams" | "participants" | "analytics">("teams");
  const [searchTerm, setSearchTerm] = useState("");
  const [blockFilter, setBlockFilter] = useState("ALL");
  const [teamFilter, setTeamFilter] = useState<"ALL" | "FINAL_SUBMITTED" | "EVALUATED" | "PENDING_EVAL">("ALL");

  // Super Admin Action States
  const [phaseUpdating, setPhaseUpdating] = useState(false);
  const [phaseMsg, setPhaseMsg] = useState("");
  const [timerUpdating, setTimerUpdating] = useState(false);
  const [timerMsg, setTimerMsg] = useState("");
  const [customTimerDate, setCustomTimerDate] = useState("");

  // Evaluator Marks State (by teamId)
  const [evalForms, setEvalForms] = useState<
    Record<
      string,
      {
        innovation: number | string;
        understanding: number | string;
        progress: number | string;
        notes: string;
      }
    >
  >({});
  const [savingEvalId, setSavingEvalId] = useState<string | null>(null);
  const [evalSuccessMap, setEvalSuccessMap] = useState<Record<string, string>>({});

  // Determine Super Admin status strictly via environment configuration
  const isCurrentUserSuperAdmin = Boolean(
    user ? isSuperAdminEmail(user.email) : data?.isSuperAdmin
  );

  const adminIdentifier = user?.email || "admin";

  const loadData = async (email: string) => {
    setLoading(true);
    setErrorMsg("");

    const timeoutPromise = new Promise<any>((resolve) =>
      setTimeout(
        () =>
          resolve({
            success: false,
            error: "Connection took longer than expected. Please check your connection and tap Retry Connection below.",
          }),
        35000
      )
    );

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await Promise.race([getAdminData(email), timeoutPromise]);
        if (res.success) {
          setData(res);
          initEvalForms(res.teams);
          if (res.systemSettings?.targetDate) {
            setCustomTimerDate(toDatetimeLocal(res.systemSettings.targetDate));
          }
          setLoading(false);
          return;
        }

        if (res.error && res.error.includes("Unauthorized access")) {
          setErrorMsg(res.error);
          setLoading(false);
          return;
        }

        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 800));
          continue;
        }

        setErrorMsg(res.error || "Failed to load admin records from database.");
        setLoading(false);
        return;
      } catch (err: any) {
        console.error(`Error loading admin data (attempt ${attempt + 1}):`, err);
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 800));
          continue;
        }
        setErrorMsg(err?.message ? `Failed to connect to the database: ${err.message}` : "Failed to connect to the database. Please verify your connection.");
        setLoading(false);
      }
    }
  };

  // Guard route: Only verified admin users are allowed
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!isAdminEmail(user.email)) {
      router.replace("/profile");
      return;
    }

    if (user.email) {
      loadData(user.email);
    }
  }, [user, authLoading, router]);

  const initEvalForms = (teams?: any[]) => {
    if (!teams || !Array.isArray(teams)) return;
    const initialMap: Record<string, any> = {};
    teams.forEach((t) => {
      initialMap[t.id] = {
        innovation: t.scoreInnovation !== null && t.scoreInnovation !== undefined ? t.scoreInnovation : "",
        understanding: t.scoreUnderstanding !== null && t.scoreUnderstanding !== undefined ? t.scoreUnderstanding : "",
        progress: t.scoreProgress !== null && t.scoreProgress !== undefined ? t.scoreProgress : "",
        notes: t.evaluationNotes || "",
      };
    });
    setEvalForms(initialMap);
  };

  const toDatetimeLocal = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return "";
    }
  };

  const handleRefresh = async () => {
    if (!user?.email) return;
    setLoading(true);
    const res = await getAdminData(user.email);
    if (res.success) {
      setData(res);
      initEvalForms(res.teams);
      if (res.systemSettings?.targetDate) {
        setCustomTimerDate(toDatetimeLocal(res.systemSettings.targetDate));
      }
    }
    setLoading(false);
  };

  const handleFullSignOut = async () => {
    try {
      clearParticipantSession();
      await auth.signOut();
    } catch (e) {
      console.error("Sign out error:", e);
    }
    router.replace("/register");
  };

  // Super Admin: Toggle Submission Phase
  const handleTogglePhase = async (targetPhase: "IDEA" | "FINAL") => {
    if (!isCurrentUserSuperAdmin) {
      setPhaseMsg("Access Denied: Super Admin permissions required to toggle the submission phase.");
      return;
    }
    setPhaseUpdating(true);
    setPhaseMsg("");
    const res = await toggleSubmissionPhase(adminIdentifier, targetPhase);
    if (res.success) {
      setData((prev: any) => ({
        ...prev,
        systemSettings: {
          ...prev.systemSettings,
          submissionPhase: targetPhase,
        },
      }));
      setPhaseMsg(`✓ Phase successfully toggled to ${targetPhase === "FINAL" ? "STAGE 2: FINAL PROJECT SUBMISSION" : "STAGE 1: IDEA SUBMISSION"}. Participants will now see this stage on login!`);
    } else {
      setPhaseMsg(res.error || "Failed to update phase.");
    }
    setPhaseUpdating(false);
  };

  // Super Admin: Update Timer
  const handleUpdateTimer = async (newDateISO: string, isPaused?: boolean) => {
    if (!isCurrentUserSuperAdmin) {
      setTimerMsg("Access Denied: Super Admin permissions required to adjust the hackathon timer.");
      return;
    }
    setTimerUpdating(true);
    setTimerMsg("");
    const res = await updateHackathonTimer(adminIdentifier, newDateISO, isPaused);
    if (res.success) {
      setData((prev: any) => ({
        ...prev,
        systemSettings: {
          ...prev.systemSettings,
          targetDate: newDateISO,
          isPaused: typeof isPaused === "boolean" ? isPaused : prev.systemSettings?.isPaused,
        },
      }));
      setCustomTimerDate(toDatetimeLocal(newDateISO));
      setTimerMsg(`✓ Live hackathon countdown updated! New target: ${new Date(newDateISO).toLocaleString()}`);
    } else {
      setTimerMsg(res.error || "Failed to update countdown timer.");
    }
    setTimerUpdating(false);
  };

  const handleTimerPreset = (hoursToAdd: number) => {
    // Increment existing countdown target date instead of restarting from Date.now()
    const currentTargetStr = data?.systemSettings?.targetDate || customTimerDate;
    let baseTime = Date.now();
    if (currentTargetStr) {
      const parsed = new Date(currentTargetStr).getTime();
      if (!isNaN(parsed) && parsed > Date.now()) {
        baseTime = parsed;
      }
    }
    const target = new Date(baseTime + hoursToAdd * 60 * 60 * 1000);
    setCustomTimerDate(toDatetimeLocal(target.toISOString()));
    handleUpdateTimer(target.toISOString());
  };

  // Save Team Evaluation
  const handleSaveEvaluation = async (teamId: string) => {
    const form = evalForms[teamId] || { innovation: 0, understanding: 0, progress: 0, notes: "" };
    const inn = Number((Math.max(0, Math.min(10, parseFloat(String(form.innovation)) || 0))).toFixed(2));
    const und = Number((Math.max(0, Math.min(10, parseFloat(String(form.understanding)) || 0))).toFixed(2));
    const pro = Number((Math.max(0, Math.min(10, parseFloat(String(form.progress)) || 0))).toFixed(2));

    setSavingEvalId(teamId);
    setEvalSuccessMap((prev) => ({ ...prev, [teamId]: "" }));

    const res = await saveTeamEvaluation(adminIdentifier, teamId, {
      scoreInnovation: inn,
      scoreUnderstanding: und,
      scoreProgress: pro,
      evaluationNotes: form.notes,
    });

    if (res.success) {
      const total = Number((inn + und + pro).toFixed(2));
      setData((prev: any) => ({
        ...prev,
        teams: prev.teams.map((t: any) =>
          t.id === teamId
            ? {
                ...t,
                scoreInnovation: inn,
                scoreUnderstanding: und,
                scoreProgress: pro,
                scoreTotal: total,
                evaluatedBy: adminIdentifier,
                evaluationNotes: form.notes,
                evaluatedAt: new Date().toISOString(),
              }
            : t
        ),
      }));
      setEvalSuccessMap((prev) => ({
        ...prev,
        [teamId]: `✓ Marks saved! Total: ${total}/30`,
      }));
    } else {
      alert(res.error || "Failed to save evaluation.");
    }
    setSavingEvalId(null);
  };

  // Export full evaluation report in native Excel (.xlsx)
  const exportEvaluationsExcel = () => {
    if (!data?.teams) return;

    const rows = data.teams.map((t: any, idx: number) => {
      const roster = t.members
        .map((m: any) => `${m.fullName} [${m.emailId}, ${m.mobileNumber}, ${m.hostelBlock}-${m.roomNumber}, ${m.ticketId}]`)
        .join("; ");

      const isEvaluated = t.scoreTotal !== null && t.scoreTotal !== undefined;

      return {
        "Rank / S.No": idx + 1,
        "Team Name": t.name,
        "Team Code": t.teamCode,
        "Track / Problem Statement": t.problemStatement || "Not Selected",
        "Member Count": t.memberCount,
        "Team Roster": roster,
        "Stage 1 Idea PPT Link": t.pptUrl || "N/A",
        "Stage 1 Problem Understanding": t.understanding || "N/A",
        "Stage 1 Solution Architecture": t.solutionSummary || "N/A",
        "Stage 1 Submitted At": t.submittedAt ? new Date(t.submittedAt).toLocaleString() : "Pending",
        "Stage 2 Final Project Document Link": t.finalDocUrl || "N/A",
        "Stage 2 GitHub Repository": t.finalRepoUrl || "N/A",
        "Stage 2 Live Demo / Pitch URL": t.finalDemoUrl || "N/A",
        "Stage 2 Technical Summary & Progress": t.finalSummary || "N/A",
        "Stage 2 Final Submitted At": t.finalSubmittedAt ? new Date(t.finalSubmittedAt).toLocaleString() : "Pending",
        "Criterion 1: Innovation (0-10)": t.scoreInnovation !== null && t.scoreInnovation !== undefined ? t.scoreInnovation : "",
        "Criterion 2: Understanding (0-10)": t.scoreUnderstanding !== null && t.scoreUnderstanding !== undefined ? t.scoreUnderstanding : "",
        "Criterion 3: Progress (0-10)": t.scoreProgress !== null && t.scoreProgress !== undefined ? t.scoreProgress : "",
        "Total Score (0-30)": isEvaluated ? t.scoreTotal : "Unscored",
        "Evaluation Status": isEvaluated ? "EVALUATED" : "PENDING EVALUATION",
        "Evaluator Admin": t.evaluatedBy || "Pending",
        "Jury Notes / Remarks": t.evaluationNotes || "",
        "Evaluated At": t.evaluatedAt ? new Date(t.evaluatedAt).toLocaleString() : "Pending",
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);

    // Styling column widths
    ws["!cols"] = [
      { wch: 10 }, // S.No
      { wch: 22 }, // Team Name
      { wch: 12 }, // Team Code
      { wch: 28 }, // Track
      { wch: 12 }, // Count
      { wch: 45 }, // Roster
      { wch: 35 }, // Stage 1 PPT
      { wch: 35 }, // Stage 1 Und
      { wch: 35 }, // Stage 1 Sol
      { wch: 20 }, // Stage 1 At
      { wch: 35 }, // Stage 2 Doc
      { wch: 35 }, // Stage 2 Repo
      { wch: 35 }, // Stage 2 Demo
      { wch: 40 }, // Stage 2 Summary
      { wch: 20 }, // Stage 2 At
      { wch: 25 }, // Innovation
      { wch: 28 }, // Understanding
      { wch: 24 }, // Progress
      { wch: 20 }, // Total
      { wch: 20 }, // Status
      { wch: 32 }, // Evaluator
      { wch: 35 }, // Notes
      { wch: 22 }, // Evaluated At
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Solvathon Final Evaluations");
    XLSX.writeFile(
      wb,
      `Hostel_Solvathon_Final_Evaluations_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const exportParticipantsCSV = () => {
    if (!data?.participants) return;
    const headers = [
      "Full Name",
      "Email ID",
      "Mobile Number",
      "Gender",
      "Hostel Block",
      "Room Number",
      "Mess Caterer",
      "Mess Type",
      "Ticket ID",
      "Team Name",
      "Team Code",
      "Registration Time",
    ];

    const rows = data.participants.map((p: any) => [
      `"${p.fullName}"`,
      `"${p.emailId}"`,
      `"${p.mobileNumber}"`,
      `"${p.gender || "N/A"}"`,
      `"${p.hostelBlock}"`,
      `"${p.roomNumber}"`,
      `"${p.messCaterer}"`,
      `"${p.messType}"`,
      `"${p.ticketId}"`,
      `"${p.teamName}"`,
      `"${p.teamCode}"`,
      `"${p.registrationTime}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e: any[]) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `solvathon_participants_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (errorMsg && !data) {
    return (
      <div className="min-h-screen bg-[#050B14] flex flex-col items-center justify-center text-white font-sans px-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 max-w-md text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto text-2xl font-bold">
            ⚠️
          </div>
          <h2 className="text-xl font-bold">Admin Console Notice</h2>
          <p className="text-xs text-red-300 font-mono bg-black/40 p-3 rounded-lg border border-red-500/20 break-words">
            {errorMsg}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                if (user?.email) loadData(user.email);
              }}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-lg shadow-purple-600/30"
            >
              Retry Connection
            </button>
            <button
              onClick={() => auth?.signOut()}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold cursor-pointer transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (authLoading || loading || !data) {
    return (
      <div className="min-h-screen bg-[#050B14] flex flex-col items-center justify-center text-white font-sans selection:bg-cyan-500/30">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-white/50 uppercase tracking-widest">
            Loading Admin Console...
          </p>
        </div>
      </div>
    );
  }

  const { stats, participants, teams, systemSettings } = data;
  const currentPhase: "IDEA" | "FINAL" = systemSettings?.submissionPhase || "IDEA";

  // Filtered teams based on search & state
  const filteredTeams = teams.filter((t: any) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.teamCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.problemStatement?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.members.some((m: any) => m.fullName.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (teamFilter === "FINAL_SUBMITTED") return !!t.finalDocUrl;
    if (teamFilter === "EVALUATED") return t.scoreTotal !== null && t.scoreTotal !== undefined;
    if (teamFilter === "PENDING_EVAL") return t.scoreTotal === null || t.scoreTotal === undefined;
    return true;
  });

  const filteredParticipants = participants.filter((p: any) => {
    const matchesSearch =
      p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.emailId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.roomNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBlock = blockFilter === "ALL" || p.hostelBlock === blockFilter;
    return matchesSearch && matchesBlock;
  });

  const uniqueBlocks = Array.from(new Set(participants.map((p: any) => p.hostelBlock))) as string[];

  return (
    <div className="min-h-screen bg-[#050B14] relative text-white font-sans selection:bg-cyan-500/30 py-8 px-4">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

      <div className="container mx-auto max-w-7xl relative z-10 space-y-6">
        
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white/[0.04] border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">home</span>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black">Admin &amp; Evaluator Portal</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">
                  PERMANENT SESSION
                </span>
                {isCurrentUserSuperAdmin ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-500/40 text-purple-300 font-mono text-xs font-bold">
                    SUPER ADMIN
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono text-xs font-bold">
                    EVALUATOR ADMIN
                  </span>
                )}
              </div>
              <p className="text-white/50 text-xs font-mono">
                CYFT Hostellite Solvathon 2026 // Participant Management &amp; Judging Console
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {user && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <span className="material-symbols-outlined text-purple-400 text-base">verified_user</span>
                <span className="text-xs font-mono text-purple-300 font-semibold">{user.email}</span>
              </div>
            )}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/15 rounded-xl text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className={`material-symbols-outlined text-sm ${loading ? "animate-spin" : ""}`}>refresh</span>
              Refresh
            </button>
            <button
              onClick={exportEvaluationsExcel}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">table_view</span>
              Download Excel (.xlsx)
            </button>
            <button
              onClick={exportParticipantsCSV}
              className="px-3.5 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 rounded-xl text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Participants CSV
            </button>
            <button
              onClick={handleFullSignOut}
              className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              Sign Out
            </button>
          </div>
        </div>

        {/* ═══════════════ SUPER ADMIN COMMAND CENTER ═══════════════ */}
        {isCurrentUserSuperAdmin && (
          <div className="bg-gradient-to-br from-purple-950/40 via-[#0d1224] to-cyan-950/30 border border-purple-500/30 rounded-3xl p-6 backdrop-blur-2xl shadow-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                <span className="material-symbols-outlined text-xl">bolt</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white tracking-wide">
                    Super Admin Master Controls
                  </h2>
                  <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] font-mono rounded uppercase font-bold">
                    SUPER ADMIN EXCLUSIVE
                  </span>
                </div>
                <p className="text-xs text-white/50">
                  Global controls for participant submission redirection &amp; hackathon countdown synchronization.
                </p>
              </div>
            </div>

            {/* Current Phase Indicator */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-white/60">ACTIVE STAGE:</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                  currentPhase === "FINAL"
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                    : "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                }`}
              >
                {currentPhase === "FINAL"
                  ? "STAGE 2: FINAL PROJECT SUBMISSION"
                  : "STAGE 1: IDEA SUBMISSION"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Feature 1: Toggle Submission Phase */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block font-bold">
                    CONTROL 01 // PARTICIPANT SUBMISSION ROUTE
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    Toggle Submission Phase
                  </h3>
                  <p className="text-xs text-white/60 mt-1 leading-relaxed">
                    When toggled to <strong>FINAL PROJECT</strong>, participants logging into their dashboard will automatically be directed to the <strong>Final Project Submission Page</strong> to submit their document, code, &amp; demo.
                  </p>
                </div>
              </div>

              {/* Interactive Toggle Switch */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <div className="flex items-center p-1.5 bg-black/60 border border-white/10 rounded-xl flex-1">
                  <button
                    type="button"
                    onClick={() => handleTogglePhase("IDEA")}
                    disabled={phaseUpdating || !isCurrentUserSuperAdmin}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      currentPhase === "IDEA"
                        ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/30"
                        : "text-white/60 hover:text-white"
                    } disabled:opacity-50`}
                  >
                    <span className="material-symbols-outlined text-base">lightbulb</span>
                    Stage 1: Idea Submission
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTogglePhase("FINAL")}
                    disabled={phaseUpdating || !isCurrentUserSuperAdmin}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      currentPhase === "FINAL"
                        ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/30"
                        : "text-white/60 hover:text-white"
                    } disabled:opacity-50`}
                  >
                    <span className="material-symbols-outlined text-base">rocket_launch</span>
                    Stage 2: Final Project
                  </button>
                </div>

                {!isCurrentUserSuperAdmin && (
                  <span className="text-[11px] font-mono text-amber-400/90 self-center">
                    (Super Admin required)
                  </span>
                )}
              </div>

              {phaseMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-mono border ${
                    phaseMsg.startsWith("✓")
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : "bg-red-500/10 border-red-500/30 text-red-300"
                  }`}
                >
                  {phaseMsg}
                </div>
              )}
            </div>

            {/* Feature 2: Live Hackathon Countdown Timer Console */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest block font-bold">
                    CONTROL 02 // COUNTDOWN TIMER CONSOLE
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    Live Hackathon Countdown Timer
                  </h3>
                  <p className="text-xs text-white/60 mt-1 leading-relaxed">
                    Modify the live deadline synchronized across the homepage &amp; participant portals.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-white/40 block">TARGET SET TO</span>
                  <span className="text-xs font-mono font-bold text-purple-300">
                    {systemSettings?.targetDate
                      ? new Date(systemSettings.targetDate).toLocaleDateString() + " " + new Date(systemSettings.targetDate).toLocaleTimeString()
                      : "Dec 1, 2026"}
                  </span>
                </div>
              </div>

              {/* Timer Quick Presets & Custom Picker */}
              <div className="space-y-3 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-mono text-white/50">Presets:</span>
                  <button
                    type="button"
                    disabled={timerUpdating || !isCurrentUserSuperAdmin}
                    onClick={() => handleTimerPreset(1)}
                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-mono text-white/80 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
                  >
                    +1 Hour
                  </button>
                  <button
                    type="button"
                    disabled={timerUpdating || !isCurrentUserSuperAdmin}
                    onClick={() => handleTimerPreset(6)}
                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-mono text-white/80 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
                  >
                    +6 Hours
                  </button>
                  <button
                    type="button"
                    disabled={timerUpdating || !isCurrentUserSuperAdmin}
                    onClick={() => handleTimerPreset(24)}
                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-mono text-white/80 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
                  >
                    +24 Hours
                  </button>
                  <button
                    type="button"
                    disabled={timerUpdating || !isCurrentUserSuperAdmin}
                    onClick={() => handleUpdateTimer("2026-12-01T23:59:59+05:30")}
                    className="px-2.5 py-1 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-xs font-mono text-purple-300 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    Reset Default
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="datetime-local"
                    value={customTimerDate}
                    onChange={(e) => setCustomTimerDate(e.target.value)}
                    disabled={!isCurrentUserSuperAdmin}
                    className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:ring-2 focus:ring-purple-500/50 outline-none flex-1 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    disabled={timerUpdating || !customTimerDate || !isCurrentUserSuperAdmin}
                    onClick={() => handleUpdateTimer(new Date(customTimerDate).toISOString())}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                  >
                    {timerUpdating ? (
                      <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      <span className="material-symbols-outlined text-base">save</span>
                    )}
                    <span>Apply</span>
                  </button>
                </div>
              </div>

              {timerMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-mono border ${
                    timerMsg.startsWith("✓")
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : "bg-red-500/10 border-red-500/30 text-red-300"
                  }`}
                >
                  {timerMsg}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

        {/* Telemetry Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 backdrop-blur-xl space-y-1">
            <span className="text-[11px] font-mono text-white/40 uppercase">Verified Participants</span>
            <div className="text-3xl font-black text-cyan-400 tracking-tight">{stats.totalParticipants}</div>
            <p className="text-[10px] text-white/50">Unique Passes</p>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 backdrop-blur-xl space-y-1">
            <span className="text-[11px] font-mono text-white/40 uppercase">Teams Formed</span>
            <div className="text-3xl font-black text-blue-400 tracking-tight">{stats.totalTeams}</div>
            <p className="text-[10px] text-white/50">{stats.fullTeams} at full 4/4 cap</p>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 backdrop-blur-xl space-y-1">
            <span className="text-[11px] font-mono text-white/40 uppercase">Stage 1: Ideas</span>
            <div className="text-3xl font-black text-amber-400 tracking-tight">{stats.ideaSubmissionsCount || 0}</div>
            <p className="text-[10px] text-white/50">Presentations In</p>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 backdrop-blur-xl space-y-1">
            <span className="text-[11px] font-mono text-white/40 uppercase">Stage 2: Final Projects</span>
            <div className="text-3xl font-black text-emerald-400 tracking-tight">{stats.finalSubmissionsCount || 0}</div>
            <p className="text-[10px] text-white/50">Docs &amp; Repos Logged</p>
          </div>

          <div
            onClick={() => setActiveTab("teams")}
            className="bg-white/[0.03] border border-white/10 hover:border-purple-500/50 rounded-2xl p-5 backdrop-blur-xl space-y-1 col-span-2 md:col-span-1 cursor-pointer transition-all hover:scale-[1.02] group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-purple-300 uppercase font-semibold">Evaluation Frame</span>
              <span className="text-[10px] font-mono text-purple-400 opacity-70 group-hover:opacity-100 transition-opacity">Open Table ↗</span>
            </div>
            <div className="text-3xl font-black text-purple-400 tracking-tight">
              {stats.evaluatedTeamsCount || 0} / {stats.totalTeams}
            </div>
            <p className="text-[10px] text-white/50">Teams Graded • Click to view entries</p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-white/10 gap-4">
          <button
            onClick={() => setActiveTab("teams")}
            className={`pb-3 font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer border-b-2 ${
              activeTab === "teams"
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-white/60 hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-lg">rate_review</span>
            Evaluation Frame: Teams &amp; Leaders ({teams.length})
          </button>

          <button
            onClick={() => setActiveTab("participants")}
            className={`pb-3 font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer border-b-2 ${
              activeTab === "participants"
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-white/60 hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-lg">badge</span>
            Participants Directory ({participants.length})
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`pb-3 font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer border-b-2 ${
              activeTab === "analytics"
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-white/60 hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-lg">analytics</span>
            Demographics &amp; Tracks Breakdown
          </button>
        </div>

        {/* ═════════ TAB 1: TEAM ROSTERS & 3-CRITERIA EVALUATIONS ═════════ */}
        {activeTab === "teams" && (
          <div className="space-y-6">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <input
                type="text"
                placeholder="Search teams by name, code, track, or member name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-96 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono text-white/40 uppercase">Filter:</span>
                <button
                  type="button"
                  onClick={() => setTeamFilter("ALL")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                    teamFilter === "ALL"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "bg-white/5 text-white/60 hover:text-white"
                  }`}
                >
                  All ({teams.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTeamFilter("FINAL_SUBMITTED")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                    teamFilter === "FINAL_SUBMITTED"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-white/5 text-white/60 hover:text-white"
                  }`}
                >
                  Final Submitted ({teams.filter((t: any) => !!t.finalDocUrl).length})
                </button>
                <button
                  type="button"
                  onClick={() => setTeamFilter("EVALUATED")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                    teamFilter === "EVALUATED"
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                      : "bg-white/5 text-white/60 hover:text-white"
                  }`}
                >
                  Evaluated ({teams.filter((t: any) => t.scoreTotal !== null && t.scoreTotal !== undefined).length})
                </button>
                <button
                  type="button"
                  onClick={() => setTeamFilter("PENDING_EVAL")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                    teamFilter === "PENDING_EVAL"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-white/5 text-white/60 hover:text-white"
                  }`}
                >
                  Pending Eval ({teams.filter((t: any) => t.scoreTotal === null || t.scoreTotal === undefined).length})
                </button>
              </div>
            </div>

            {/* Quick Evaluation Launcher */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-cyan-950/20 border border-purple-500/25 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                  <span className="material-symbols-outlined text-2xl">rate_review</span>
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm tracking-wide flex items-center gap-2">
                    Official Evaluation Frame &amp; Directory
                    <span className="text-[10px] font-mono uppercase bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
                      Standalone Scoresheet
                    </span>
                  </h3>
                  <p className="text-white/60 text-xs">
                    Click any team below to open its dedicated evaluation page. Judges can toggle left or right between teams seamlessly.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <Link
                  href="/admin/evaluate"
                  className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:via-indigo-500 hover:to-cyan-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                  <span>Open Evaluation Workbench</span>
                </Link>
              </div>
            </div>

            {/* Teams & Leadership Directory Table */}
            <div className="bg-[#0b0f19]/80 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.03] text-white/50 font-mono text-[11px] uppercase tracking-wider">
                      <th className="py-4 px-4 w-12 text-center">#</th>
                      <th className="py-4 px-5">Team Name &amp; Code</th>
                      <th className="py-4 px-5">Team Leader (Creator)</th>
                      <th className="py-4 px-5">Track</th>
                      <th className="py-4 px-4 text-center">Members</th>
                      <th className="py-4 px-5">Deliverables</th>
                      <th className="py-4 px-5">Evaluation Status</th>
                      <th className="py-4 px-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredTeams.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-16 text-center text-white/40 font-mono">
                          No teams found matching current query or filters.
                        </td>
                      </tr>
                    ) : (
                      filteredTeams.map((t: any, idx: number) => {
                        const isEvaluated = t.scoreTotal !== null && t.scoreTotal !== undefined;
                        const leader = t.members && t.members.length > 0 ? t.members[0] : null;
                        const leaderName = t.leaderName || leader?.fullName || "N/A";
                        const leaderEmail = t.leaderEmail || leader?.emailId || "";
                        const leaderPhone = t.leaderPhone || leader?.mobileNumber || "";

                        return (
                          <tr
                            key={t.id}
                            onClick={() => router.push(`/admin/evaluate/${t.id}`)}
                            className="hover:bg-purple-500/5 transition-colors cursor-pointer group"
                          >
                            <td className="py-4 px-4 text-center font-mono text-white/40 group-hover:text-purple-300">
                              {idx + 1}
                            </td>

                            {/* Team Name & Code */}
                            <td className="py-4 px-5">
                              <div className="flex flex-col gap-1">
                                <span className="font-bold text-white text-sm tracking-wide group-hover:text-purple-300 transition-colors">
                                  {t.name}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[10px] text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 px-1.5 py-0.5 rounded">
                                    CODE: {t.teamCode}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Team Leader (Creator) */}
                            <td className="py-4 px-5">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-sm shadow-amber-500/10"
                                  title="Team Creator & Leader"
                                >
                                  <span className="text-sm">👑</span>
                                </div>
                                <div>
                                  <div className="font-semibold text-white flex items-center gap-1.5">
                                    <span>{leaderName}</span>
                                    <span className="text-[9px] font-mono uppercase bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30">
                                      Leader
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-white/50 font-mono">
                                    {leaderEmail}
                                  </div>
                                  {leaderPhone && (
                                    <div className="text-[10px] text-white/40 font-mono">
                                      📞 {leaderPhone}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Track */}
                            <td className="py-4 px-5">
                              {t.problemStatement && t.problemStatement !== "Not Selected" ? (
                                <span className="inline-block px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 rounded-md text-[11px] font-mono max-w-[200px] truncate" title={t.problemStatement}>
                                  {t.problemStatement}
                                </span>
                              ) : (
                                <span className="text-white/30 italic text-[11px]">
                                  Not Selected
                                </span>
                              )}
                            </td>

                            {/* Members */}
                            <td className="py-4 px-4 text-center">
                              <span className="inline-block font-mono text-[11px] px-2 py-0.5 rounded-full bg-white/5 text-white/80 border border-white/10">
                                {t.members?.length || t.memberCount || 0}/4
                              </span>
                            </td>

                            {/* Deliverables */}
                            <td className="py-4 px-5">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-1.5 h-1.5 rounded-full ${t.pptUrl ? "bg-emerald-400" : "bg-white/20"}`} />
                                  <span className={`text-[10px] font-mono ${t.pptUrl ? "text-emerald-300" : "text-white/40"}`}>
                                    S1: {t.pptUrl ? "Submitted" : "Pending"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-1.5 h-1.5 rounded-full ${t.finalDocUrl ? "bg-emerald-400" : "bg-white/20"}`} />
                                  <span className={`text-[10px] font-mono ${t.finalDocUrl ? "text-emerald-300" : "text-white/40"}`}>
                                    S2: {t.finalDocUrl ? "Submitted" : "Pending"}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Evaluation Status & Score */}
                            <td className="py-4 px-5">
                              {isEvaluated ? (
                                <div className="flex flex-col gap-0.5">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono font-bold text-xs w-fit">
                                    <span className="material-symbols-outlined text-xs">verified</span>
                                    {t.scoreTotal} / 30
                                  </span>
                                  {t.evaluatedBy && (
                                    <span className="text-[10px] text-white/40 font-mono truncate max-w-[150px]">
                                      by {t.evaluatedBy}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[11px] w-fit">
                                  <span className="material-symbols-outlined text-xs">schedule</span>
                                  Pending Eval
                                </span>
                              )}
                            </td>

                            {/* Action Button */}
                            <td className="py-4 px-5 text-right">
                              <Link
                                href={`/admin/evaluate/${t.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/40 hover:border-transparent rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm"
                              >
                                <span>{isEvaluated ? "Review" : "Evaluate"}</span>
                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═════════ TAB 2: PARTICIPANTS DIRECTORY ═════════ */}
        {activeTab === "participants" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <input
                type="text"
                placeholder="Search by name, email, ticket ID, or room..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-80 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-white/40 uppercase">Filter Block:</span>
                <div className="relative inline-block">
                  <select
                    value={blockFilter}
                    onChange={(e) => setBlockFilter(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-xl pl-3 pr-9 py-2 text-xs text-white appearance-none outline-none cursor-pointer [&>option]:bg-[#050B14]"
                  >
                    <option value="ALL">All Blocks ({participants.length})</option>
                    {uniqueBlocks.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none text-base">
                    expand_more
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-x-auto shadow-2xl backdrop-blur-xl">
              <table className="w-full text-left text-sm border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-white/10 text-xs font-mono text-cyan-400 uppercase bg-white/[0.02]">
                    <th className="p-4">Ticket ID</th>
                    <th className="p-4">Participant Name</th>
                    <th className="p-4">Hostel Allotment</th>
                    <th className="p-4">Mess &amp; Diet</th>
                    <th className="p-4">Team</th>
                    <th className="p-4">Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredParticipants.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-white/40 font-mono text-sm">
                        No participants found matching current query.
                      </td>
                    </tr>
                  ) : (
                    filteredParticipants.map((p: any) => (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 font-mono text-cyan-400 font-semibold">{p.ticketId}</td>
                        <td className="p-4">
                          <div className="font-bold text-white">{p.fullName}</div>
                          <div className="text-xs text-white/50 font-mono">{p.emailId}</div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {p.gender && p.gender !== "N/A" && (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${
                                p.gender === "Female"
                                  ? "bg-pink-500/10 text-pink-300 border-pink-500/30"
                                  : "bg-blue-500/10 text-blue-300 border-blue-500/30"
                              }`}>
                                {p.gender}
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-xs">
                              {p.hostelBlock} • Rm {p.roomNumber}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-xs">
                          <div className="text-white/80">{p.messCaterer}</div>
                          <div className="text-cyan-400/80 font-mono">{p.messType}</div>
                        </td>
                        <td className="p-4">
                          {p.teamName !== "No Team" ? (
                            <div>
                              <span className="font-semibold text-white">{p.teamName}</span>
                              <span className="block text-[11px] font-mono text-emerald-400">{p.teamCode}</span>
                            </div>
                          ) : (
                            <span className="text-white/30 text-xs font-mono">Individual</span>
                          )}
                        </td>
                        <td className="p-4 font-mono text-xs text-white/70">
                          {p.mobileNumber}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═════════ TAB 3: DEMOGRAPHICS & TRACKS BREAKDOWN ═════════ */}
        {activeTab === "analytics" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-4">
              <h3 className="text-base font-bold text-white border-b border-white/10 pb-3">
                Hostel Block Distribution
              </h3>
              <div className="space-y-2">
                {Object.entries(stats.blockStats).map(([block, count]) => (
                  <div key={block} className="flex items-center justify-between text-sm">
                    <span className="text-white/70">{block}</span>
                    <span className="font-mono font-bold text-cyan-400 bg-white/5 px-2.5 py-0.5 rounded">
                      {count as number}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-4">
              <h3 className="text-base font-bold text-white border-b border-white/10 pb-3">
                Mess Caterer Intake
              </h3>
              <div className="space-y-2">
                {Object.entries(stats.messStats).map(([mess, count]) => (
                  <div key={mess} className="flex items-center justify-between text-sm">
                    <span className="text-white/70">{mess}</span>
                    <span className="font-mono font-bold text-blue-400 bg-white/5 px-2.5 py-0.5 rounded">
                      {count as number}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-4">
              <h3 className="text-base font-bold text-white border-b border-white/10 pb-3">
                Problem Statement Tracks
              </h3>
              <div className="space-y-2">
                {Object.entries(stats.trackStats).map(([track, count]) => (
                  <div key={track} className="flex items-center justify-between text-sm">
                    <span className="text-white/70 truncate max-w-[200px]">{track}</span>
                    <span className="font-mono font-bold text-purple-400 bg-white/5 px-2.5 py-0.5 rounded">
                      {count as number}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
