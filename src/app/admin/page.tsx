"use client";

import { useState, useEffect } from "react";
import {
  getAdminData,
  toggleSubmissionPhase,
  updateHackathonTimer,
  saveTeamEvaluation,
  setActiveReviewRound,
  toggleTeamFreezeStatus,
  toggleTeamSubmissionLock,
  controlHackathonTimer,
  getTimerState,
  type TimerControlAction,
} from "@/actions/admin";
import type { HackathonTimerState } from "@/lib/timer";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { REVIEW_ROUNDS, getRoundInfo } from "@/config/rubrics";
import { auth } from "@/lib/firebase/config";
import { clearParticipantSession } from "@/lib/authSession";
import ExcelJS from "exceljs";
import eventConfig from "@/data/eventConfig.json";

function toDatetimeLocal(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

export default function AdminPortalPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = useAuth();
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
  const [customTimerDate, setCustomTimerDate] = useState(() => toDatetimeLocal(eventConfig.targetDate));
  const [currentNow, setCurrentNow] = useState(() => Date.now());
  const [roundUpdating, setRoundUpdating] = useState(false);
  const [roundMsg, setRoundMsg] = useState("");
  const [togglingFreezeId, setTogglingFreezeId] = useState<string | null>(null);
  const [togglingSubLockId, setTogglingSubLockId] = useState<string | null>(null);

  // Hackathon Live Auditorium Timer States (timer.solvathon26.co.in)
  const [hackathonTimer, setHackathonTimer] = useState<HackathonTimerState | null>(null);
  const [timerCtrlLoading, setTimerCtrlLoading] = useState(false);
  const [timerCtrlMsg, setTimerCtrlMsg] = useState("");
  const [customDurationHours, setCustomDurationHours] = useState(24);
  const [customDurationMinutes, setCustomDurationMinutes] = useState(0);
  const [phaseLabelInput, setPhaseLabelInput] = useState("Official Hackathon Countdown");
  const [liveDisplaySeconds, setLiveDisplaySeconds] = useState<number>(24 * 3600);

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

  // Super Admin status is securely determined server-side
  const isCurrentUserSuperAdmin = Boolean(data?.isSuperAdmin);

  const adminIdentifier = user?.email || "admin";

  const loadData = async () => {
    setLoading(true);
    setErrorMsg("");

    let tokenOrEmail = user?.email || "";
    try {
      if (user) {
        tokenOrEmail = (await user.getIdToken()) || user.email || "";
      }
    } catch {}

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
        const res = await Promise.race([getAdminData(tokenOrEmail), timeoutPromise]);
        if (res.success) {
          setData(res);
          initEvalForms(res.teams);
          if (res.systemSettings?.targetDate) {
            setCustomTimerDate(toDatetimeLocal(res.systemSettings.targetDate));
          }
          if (res.systemSettings?.hackathonTimer) {
            const ht = res.systemSettings.hackathonTimer;
            setHackathonTimer(ht);
            setLiveDisplaySeconds(ht.currentRemainingSeconds ?? ht.remainingSeconds);
            setCustomDurationHours(Math.floor(ht.durationSeconds / 3600));
            setCustomDurationMinutes(Math.floor((ht.durationSeconds % 3600) / 60));
            if (ht.phaseLabel) setPhaseLabelInput(ht.phaseLabel);
          } else {
            getTimerState(tokenOrEmail).then((tres) => {
              if (tres.success && tres.state) {
                setHackathonTimer(tres.state);
                setLiveDisplaySeconds(tres.state.currentRemainingSeconds ?? tres.state.remainingSeconds);
                setCustomDurationHours(Math.floor(tres.state.durationSeconds / 3600));
                setCustomDurationMinutes(Math.floor((tres.state.durationSeconds % 3600) / 60));
                if (tres.state.phaseLabel) setPhaseLabelInput(tres.state.phaseLabel);
              }
            }).catch(() => {});
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

    if (!isAdmin) {
      router.replace("/profile");
      return;
    }

    loadData();
  }, [user, authLoading, isAdmin, router]);

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

  const handleRefresh = async () => {
    if (!user?.email) return;
    setLoading(true);
    let tokenOrEmail = user?.email || "";
    try {
      tokenOrEmail = (await user.getIdToken()) || user.email || "";
    } catch {}

    const res = await getAdminData(tokenOrEmail);
    if (res.success) {
      setData(res);
      initEvalForms(res.teams);
      if (res.systemSettings?.targetDate) {
        setCustomTimerDate(toDatetimeLocal(res.systemSettings.targetDate));
      }
      if (res.systemSettings?.hackathonTimer) {
        const ht = res.systemSettings.hackathonTimer;
        setHackathonTimer(ht);
        setLiveDisplaySeconds(ht.currentRemainingSeconds ?? ht.remainingSeconds);
      }
    }
    setLoading(false);
  };

  // Live ticking for the Hackathon Timer & Homepage Target Preview in the Super Admin dashboard
  useEffect(() => {
    const interval = setInterval(() => setCurrentNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!hackathonTimer) return;
    if (hackathonTimer.status === "RUNNING" && hackathonTimer.targetTimestamp) {
      const updateClock = () => {
        const diff = Math.max(0, Math.floor((hackathonTimer.targetTimestamp! - Date.now()) / 1000));
        setLiveDisplaySeconds(diff);
      };
      updateClock();
      const interval = setInterval(updateClock, 1000);
      return () => clearInterval(interval);
    } else {
      setLiveDisplaySeconds(hackathonTimer.remainingSeconds);
    }
  }, [hackathonTimer]);

  const formatTimerClock = (totalSec: number) => {
    const s = Math.max(0, totalSec);
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const seconds = s % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  const formatDurationDHMS = (diffMs: number) => {
    const s = Math.max(0, Math.floor(diffMs / 1000));
    const days = Math.floor(s / 86400);
    const hours = Math.floor((s % 86400) / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const seconds = s % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${days}d : ${pad(hours)}h : ${pad(minutes)}m : ${pad(seconds)}s`;
  };

  // Super Admin: Hackathon Timer Master Controller (timer.solvathon26.co.in)
  const handleTimerControl = async (
    action: TimerControlAction,
    payload: {
      durationSeconds?: number;
      deltaSeconds?: number;
      phaseLabel?: string;
      title?: string;
    } = {}
  ) => {
    if (!isCurrentUserSuperAdmin) {
      setTimerCtrlMsg("Access Denied: Only Super Admin can control the hackathon countdown timer.");
      return;
    }
    setTimerCtrlLoading(true);
    setTimerCtrlMsg("");

    let tokenOrEmail = user?.email || "";
    try {
      if (user) {
        tokenOrEmail = (await user.getIdToken()) || user.email || "";
      }
    } catch {}

    const res = await controlHackathonTimer(tokenOrEmail, { action, ...payload });
    if (res.success && res.state) {
      setHackathonTimer(res.state);
      setLiveDisplaySeconds(res.state.currentRemainingSeconds ?? res.state.remainingSeconds);
      if (payload.phaseLabel !== undefined) {
        setPhaseLabelInput(payload.phaseLabel);
      }
      setTimerCtrlMsg(`✓ ${res.message || "Timer command executed successfully!"}`);
    } else {
      setTimerCtrlMsg(res.error || "Failed to update timer.");
    }
    setTimerCtrlLoading(false);
  };

  const handleFullSignOut = async () => {
    try {
      clearParticipantSession();
      await auth.signOut();
    } catch (e) {
      console.error("Sign out error:", e);
    }
    window.location.replace("/");
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

  // Super Admin: Switch the active review round
  const handleSetActiveRound = async (roundNum: number) => {
    if (!isCurrentUserSuperAdmin) {
      setRoundMsg("Access Denied: Super Admin permissions required to switch the active review round.");
      return;
    }
    setRoundUpdating(true);
    setRoundMsg("");
    const res = await setActiveReviewRound(adminIdentifier, roundNum);
    if (res.success) {
      setData((prev: any) => ({
        ...prev,
        systemSettings: {
          ...prev.systemSettings,
          activeReviewRound: roundNum,
        },
      }));
      setRoundMsg(`✓ Active Review Round updated to Review ${roundNum} (${getRoundInfo(roundNum).subtitle}). Evaluators are now constrained to Review ${roundNum}!`);
    } else {
      setRoundMsg(res.error || "Failed to switch active review round.");
    }
    setRoundUpdating(false);
  };

  // Super Admin: Toggle Team Freeze Status for the active round
  const handleToggleTeamFreeze = async (teamId: string, targetFrozen: boolean) => {
    if (!isCurrentUserSuperAdmin) return;
    const currentRound = data?.systemSettings?.activeReviewRound || 1;
    setTogglingFreezeId(teamId);

    const res = await toggleTeamFreezeStatus(adminIdentifier, teamId, currentRound, targetFrozen);
    if (res.success) {
      setData((prev: any) => ({
        ...prev,
        teams: prev.teams.map((t: any) => {
          if (t.id !== teamId) return t;
          const evals = t.evaluations || [];
          const exists = evals.find((e: any) => e.round === currentRound);
          let updatedEvals: any[];
          if (exists) {
            updatedEvals = evals.map((e: any) => (e.round === currentRound ? { ...e, isFrozen: targetFrozen } : e));
          } else {
            updatedEvals = evals.concat({ round: currentRound, isFrozen: targetFrozen });
          }
          return {
            ...t,
            evaluations: updatedEvals,
            isFrozen: targetFrozen,
          };
        }),
      }));
    } else {
      alert(res.error || "Failed to toggle freeze state.");
    }
    setTogglingFreezeId(null);
  };

  // Super Admin: Toggle Team Submission Lock/Unlock (Phase 1 or Phase 2)
  const handleToggleSubmissionLock = async (teamId: string, phase: "IDEA" | "FINAL", unlock: boolean) => {
    if (!isCurrentUserSuperAdmin) return;
    setTogglingSubLockId(`${teamId}_${phase}`);

    const res = await toggleTeamSubmissionLock(adminIdentifier, teamId, phase, unlock);
    if (res.success) {
      setData((prev: any) => ({
        ...prev,
        teams: prev.teams.map((t: any) => {
          if (t.id !== teamId) return t;
          const updatedPhase1Unlocked = phase === "IDEA" ? unlock : t.phase1Unlocked;
          const updatedPhase2Unlocked = phase === "FINAL" ? unlock : t.phase2Unlocked;
          return {
            ...t,
            phase1Unlocked: updatedPhase1Unlocked,
            phase2Unlocked: updatedPhase2Unlocked,
            isPhase1Locked: Boolean(t.submittedAt && updatedPhase1Unlocked !== true),
            isPhase2Locked: Boolean(t.finalSubmittedAt && updatedPhase2Unlocked !== true),
          };
        }),
      }));
    } else {
      alert(res.error || "Failed to update team submission lock status.");
    }
    setTogglingSubLockId(null);
  };

  // Export full evaluation report in native Excel (.xlsx) using ExcelJS
  // Strictly contains: Team Name, Team Leader Name, Review 1 Rubrics & Total, Review 2 Rubrics & Total, Review 3 Rubrics & Total, Rubric Averages, and Total Average Marks
  const exportEvaluationsExcel = async () => {
    if (!data?.teams) return;

    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Hostel Solvathon Evaluation System";
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet("Review Evaluations & Averages");

      worksheet.columns = [
        { header: "Team Name", key: "teamName", width: 25 },
        { header: "Team Leader Name", key: "leaderName", width: 25 },
        { header: "Review 1 - Innovation", key: "r1Innovation", width: 24 },
        { header: "Review 1 - Problem Understanding", key: "r1Understanding", width: 32 },
        { header: "Review 1 - Progress & Execution", key: "r1Progress", width: 30 },
        { header: "Review 1 - Total Marks", key: "r1Total", width: 22 },
        { header: "Review 2 - Innovation", key: "r2Innovation", width: 24 },
        { header: "Review 2 - Problem Understanding", key: "r2Understanding", width: 32 },
        { header: "Review 2 - Progress & Execution", key: "r2Progress", width: 30 },
        { header: "Review 2 - Total Marks", key: "r2Total", width: 22 },
        { header: "Review 3 - Innovation", key: "r3Innovation", width: 24 },
        { header: "Review 3 - Problem Understanding", key: "r3Understanding", width: 32 },
        { header: "Review 3 - Progress & Execution", key: "r3Progress", width: 30 },
        { header: "Review 3 - Total Marks", key: "r3Total", width: 22 },
        { header: "Average - Innovation", key: "avgInnovation", width: 24 },
        { header: "Average - Problem Understanding", key: "avgUnderstanding", width: 32 },
        { header: "Average - Progress & Execution", key: "avgProgress", width: 30 },
        { header: "Total Average Marks", key: "avgTotal", width: 22 },
      ];

      // Format header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.alignment = { vertical: "middle", horizontal: "center" };

      data.teams.forEach((t: any) => {
        const leaderName = t.leaderName || "N/A";

        const evals = t.evaluations || [];
        const r1 = evals.find((e: any) => e.round === 1) || (t.scoreTotal !== null && t.scoreTotal !== undefined ? {
          scoreInnovation: t.scoreInnovation,
          scoreUnderstanding: t.scoreUnderstanding,
          scoreProgress: t.scoreProgress,
          scoreTotal: t.scoreTotal,
        } : null);
        const r2 = evals.find((e: any) => e.round === 2) || null;
        const r3 = evals.find((e: any) => e.round === 3) || null;

        const scoredRounds = [r1, r2, r3].filter((r) => r && r.scoreTotal !== null && r.scoreTotal !== undefined);
        const count = scoredRounds.length;

        const avgInnovation = count > 0
          ? Number((scoredRounds.reduce((acc, r) => acc + (parseFloat(r.scoreInnovation) || 0), 0) / count).toFixed(2))
          : "N/A";

        const avgUnderstanding = count > 0
          ? Number((scoredRounds.reduce((acc, r) => acc + (parseFloat(r.scoreUnderstanding) || 0), 0) / count).toFixed(2))
          : "N/A";

        const avgProgress = count > 0
          ? Number((scoredRounds.reduce((acc, r) => acc + (parseFloat(r.scoreProgress) || 0), 0) / count).toFixed(2))
          : "N/A";

        const avgTotal = count > 0
          ? Number((scoredRounds.reduce((acc, r) => acc + (parseFloat(r.scoreTotal) || 0), 0) / count).toFixed(2))
          : "N/A";

        worksheet.addRow({
          teamName: t.name,
          leaderName,
          r1Innovation: r1 && r1.scoreInnovation !== null && r1.scoreInnovation !== undefined ? r1.scoreInnovation : "Pending",
          r1Understanding: r1 && r1.scoreUnderstanding !== null && r1.scoreUnderstanding !== undefined ? r1.scoreUnderstanding : "Pending",
          r1Progress: r1 && r1.scoreProgress !== null && r1.scoreProgress !== undefined ? r1.scoreProgress : "Pending",
          r1Total: r1 && r1.scoreTotal !== null && r1.scoreTotal !== undefined ? r1.scoreTotal : "Pending",
          r2Innovation: r2 && r2.scoreInnovation !== null && r2.scoreInnovation !== undefined ? r2.scoreInnovation : "Pending",
          r2Understanding: r2 && r2.scoreUnderstanding !== null && r2.scoreUnderstanding !== undefined ? r2.scoreUnderstanding : "Pending",
          r2Progress: r2 && r2.scoreProgress !== null && r2.scoreProgress !== undefined ? r2.scoreProgress : "Pending",
          r2Total: r2 && r2.scoreTotal !== null && r2.scoreTotal !== undefined ? r2.scoreTotal : "Pending",
          r3Innovation: r3 && r3.scoreInnovation !== null && r3.scoreInnovation !== undefined ? r3.scoreInnovation : "Pending",
          r3Understanding: r3 && r3.scoreUnderstanding !== null && r3.scoreUnderstanding !== undefined ? r3.scoreUnderstanding : "Pending",
          r3Progress: r3 && r3.scoreProgress !== null && r3.scoreProgress !== undefined ? r3.scoreProgress : "Pending",
          r3Total: r3 && r3.scoreTotal !== null && r3.scoreTotal !== undefined ? r3.scoreTotal : "Pending",
          avgInnovation,
          avgUnderstanding,
          avgProgress,
          avgTotal,
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Hostel_Solvathon_Evaluations_Summary_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export Excel file:", err);
    }
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
                loadData();
              }}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-lg shadow-purple-600/30"
            >
              Retry Connection
            </button>
            <button
              onClick={handleFullSignOut}
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
  const activeReviewRound: number = systemSettings?.activeReviewRound || 1;

  const isTeamEvaluatedInActiveRound = (t: any) => {
    const ev = (t.evaluations || []).find((e: any) => e.round === activeReviewRound);
    if (ev) return ev.scoreTotal !== null && ev.scoreTotal !== undefined;
    return activeReviewRound === 1 && t.scoreTotal !== null && t.scoreTotal !== undefined;
  };

  // Filtered teams based on search & state
  const filteredTeams = teams.filter((t: any) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.teamCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.problemStatement?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.members.some((m: any) => m.fullName.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (teamFilter === "FINAL_SUBMITTED") return !!t.finalDocUrl;
    if (teamFilter === "EVALUATED") return isTeamEvaluatedInActiveRound(t);
    if (teamFilter === "PENDING_EVAL") return !isTeamEvaluatedInActiveRound(t);
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
                <h1 className="text-xl md:text-2xl font-black">Evaluator Portal</h1>
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
            {isCurrentUserSuperAdmin && (
              <button
                onClick={exportParticipantsCSV}
                className="px-3.5 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 rounded-xl text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                Participants CSV
              </button>
            )}
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Left Column: Feature 1 (Submission Route) & Feature 3 (Homepage Countdown) */}
            <div className="space-y-6 flex flex-col">
              {/* Feature 1: Toggle Submission Phase */}
              <div className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block font-bold">
                      CONTROL 01: PARTICIPANT SUBMISSION ROUTE
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

              {/* Feature 3: Homepage Countdown Timer Console (solvathon26.co.in) */}
              <div className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest block font-bold">
                      CONTROL 03: HOMEPAGE COUNTDOWN TIMER (solvathon26.co.in)
                    </span>
                    <h3 className="text-base font-bold text-white mt-0.5">
                      Homepage Target Date &amp; Kickoff Clock
                    </h3>
                    <p className="text-xs text-white/60 mt-1 leading-relaxed">
                      Master controls for the registration &amp; hackathon countdown displayed on the main landing page (<code className="text-purple-300 font-mono">solvathon26.co.in</code>). Synchronizes in real time across all participant browsers.
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 font-mono text-[11px] font-bold flex items-center gap-1.5 shadow-lg shadow-purple-500/10">
                      <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                      LIVE SYNCED
                    </span>
                    <a
                      href="/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-mono text-purple-400 hover:text-purple-300 underline flex items-center gap-1 transition-colors"
                    >
                      <span>Open Homepage</span>
                      <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                    </a>
                  </div>
                </div>

                {/* Live Digital Readout & Current Target */}
                <div className="p-4 bg-black/60 border border-purple-500/20 rounded-xl relative overflow-hidden">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
                    <div className="text-3xl sm:text-4xl font-mono font-black text-purple-400 tracking-wider drop-shadow-[0_0_12px_rgba(168,85,247,0.4)]">
                      {formatDurationDHMS(Math.max(0, new Date(data?.systemSettings?.targetDate || eventConfig.targetDate).getTime() - currentNow))}
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-white/40 uppercase block">Configured Target (IST)</span>
                      <span className="text-xs font-mono font-semibold text-white/80">
                        {new Date(data?.systemSettings?.targetDate || eventConfig.targetDate).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-white/50 truncate">
                    <span className="text-purple-400/80">STATUS:</span>{" "}
                    {new Date(data?.systemSettings?.targetDate || eventConfig.targetDate).getTime() > currentNow
                      ? "Countdown In Progress (Active on Homepage)"
                      : "Countdown Expired / Kickoff Complete"}
                  </div>
                </div>

                {/* Master Controls: Presets and Date Picker */}
                <div className="space-y-3 pt-1">
                  {/* Presets */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-mono text-white/50 mr-1">Quick Add:</span>
                    <button
                      type="button"
                      disabled={timerUpdating || !isCurrentUserSuperAdmin}
                      onClick={() => handleTimerPreset(24)}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[11px] font-mono text-purple-300 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
                    >
                      +24 Hours
                    </button>
                    <button
                      type="button"
                      disabled={timerUpdating || !isCurrentUserSuperAdmin}
                      onClick={() => handleTimerPreset(72)}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[11px] font-mono text-purple-300 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
                    >
                      +3 Days
                    </button>
                    <button
                      type="button"
                      disabled={timerUpdating || !isCurrentUserSuperAdmin}
                      onClick={() => handleTimerPreset(168)}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[11px] font-mono text-purple-300 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
                    >
                      +7 Days
                    </button>
                    <button
                      type="button"
                      disabled={timerUpdating || !isCurrentUserSuperAdmin}
                      onClick={() => {
                        setCustomTimerDate(toDatetimeLocal(eventConfig.targetDate));
                        handleUpdateTimer(eventConfig.targetDate);
                      }}
                      className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg text-[11px] font-mono text-purple-300 transition-colors cursor-pointer disabled:opacity-40 ml-auto"
                    >
                      Reset Default
                    </button>
                  </div>

                  {/* Custom Date Picker & Save Button */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="datetime-local"
                      value={customTimerDate}
                      onChange={(e) => setCustomTimerDate(e.target.value)}
                      disabled={!isCurrentUserSuperAdmin || timerUpdating}
                      className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:ring-1 focus:ring-purple-500 outline-none flex-1 disabled:opacity-50"
                    />
                    <button
                      type="button"
                      disabled={timerUpdating || !customTimerDate || !isCurrentUserSuperAdmin}
                      onClick={() => {
                        if (!customTimerDate) return;
                        handleUpdateTimer(new Date(customTimerDate).toISOString());
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                    >
                      {timerUpdating ? (
                        <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                      ) : (
                        <span className="material-symbols-outlined text-base">save</span>
                      )}
                      <span>Apply Date</span>
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

            {/* Feature 2: Official Hackathon Countdown Timer Console (timer.solvathon26.co.in) */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block font-bold">
                    CONTROL 02: HACKATHON LIVE TIMER (timer.solvathon26.co.in)
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    Live Hackathon Clock &amp; Auditorium Screen
                  </h3>
                  <p className="text-xs text-white/60 mt-1 leading-relaxed">
                    Master controls for the live hackathon countdown clock on{" "}
                    <code className="text-cyan-300 font-mono">timer.solvathon26.co.in</code> and auditorium screens.
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  {hackathonTimer?.status === "RUNNING" ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/10">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      LIVE RUNNING
                    </span>
                  ) : hackathonTimer?.status === "PAUSED" ? (
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[11px] font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      PAUSED
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-white/60 font-mono text-[11px] font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-white/40"></span>
                      STANDBY / STOPPED
                    </span>
                  )}
                  <a
                    href="/timer"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 underline flex items-center gap-1 transition-colors"
                  >
                    <span>Open Timer Screen</span>
                    <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                  </a>
                </div>
              </div>

              {/* Live Digital Readout & Elapsed Bar */}
              <div className="p-4 bg-black/60 border border-cyan-500/20 rounded-xl relative overflow-hidden">
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
                  <div className="text-3xl sm:text-4xl font-mono font-black text-cyan-400 tracking-wider drop-shadow-[0_0_12px_rgba(56,189,248,0.4)]">
                    {formatTimerClock(liveDisplaySeconds)}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-white/40 uppercase block">Configured Duration</span>
                    <span className="text-xs font-mono font-semibold text-white/80">
                      {Math.floor((hackathonTimer?.durationSeconds ?? 86400) / 3600)}h{" "}
                      {Math.floor(((hackathonTimer?.durationSeconds ?? 86400) % 3600) / 60)}m
                    </span>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-white/50 truncate mb-2">
                  <span className="text-cyan-400/80">BANNER:</span> {hackathonTimer?.phaseLabel || "Official 24-Hour Hackathon Clock"}
                </div>

                {/* Micro Progress Bar */}
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          (((hackathonTimer?.durationSeconds ?? 86400) - liveDisplaySeconds) /
                            (hackathonTimer?.durationSeconds ?? 86400)) *
                            100
                        )
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Master Control Buttons */}
              <div className="space-y-3 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  {hackathonTimer?.status !== "RUNNING" ? (
                    <button
                      type="button"
                      disabled={timerCtrlLoading || !isCurrentUserSuperAdmin}
                      onClick={() => handleTimerControl(hackathonTimer?.status === "PAUSED" ? "RESUME" : "START")}
                      className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-black text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {timerCtrlLoading ? (
                        <span className="w-3.5 h-3.5 border-2 border-black/40 border-t-black rounded-full animate-spin"></span>
                      ) : (
                        <span className="material-symbols-outlined text-base">play_arrow</span>
                      )}
                      <span>{hackathonTimer?.status === "PAUSED" ? "Resume Timer" : "Start Hackathon Timer"}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={timerCtrlLoading || !isCurrentUserSuperAdmin}
                      onClick={() => handleTimerControl("PAUSE")}
                      className="flex-1 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs rounded-xl shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {timerCtrlLoading ? (
                        <span className="w-3.5 h-3.5 border-2 border-black/40 border-t-black rounded-full animate-spin"></span>
                      ) : (
                        <span className="material-symbols-outlined text-base">pause</span>
                      )}
                      <span>Pause Timer</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={timerCtrlLoading || !isCurrentUserSuperAdmin}
                    onClick={() => {
                      if (window.confirm("Are you sure you want to RESET the Hackathon Countdown Timer?")) {
                        handleTimerControl("RESET");
                      }
                    }}
                    className="py-2.5 px-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-base">restart_alt</span>
                    <span>Reset</span>
                  </button>
                </div>

                {/* Quick Add / Subtract Time */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-mono text-white/50 mr-1">Adjust Time:</span>
                  <button
                    type="button"
                    disabled={timerCtrlLoading || !isCurrentUserSuperAdmin}
                    onClick={() => handleTimerControl("ADJUST_TIME", { deltaSeconds: 15 * 60 })}
                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[11px] font-mono text-cyan-300 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
                  >
                    +15m
                  </button>
                  <button
                    type="button"
                    disabled={timerCtrlLoading || !isCurrentUserSuperAdmin}
                    onClick={() => handleTimerControl("ADJUST_TIME", { deltaSeconds: 30 * 60 })}
                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[11px] font-mono text-cyan-300 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
                  >
                    +30m
                  </button>
                  <button
                    type="button"
                    disabled={timerCtrlLoading || !isCurrentUserSuperAdmin}
                    onClick={() => handleTimerControl("ADJUST_TIME", { deltaSeconds: 3600 })}
                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[11px] font-mono text-cyan-300 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
                  >
                    +1 Hour
                  </button>
                  <button
                    type="button"
                    disabled={timerCtrlLoading || !isCurrentUserSuperAdmin}
                    onClick={() => handleTimerControl("ADJUST_TIME", { deltaSeconds: -15 * 60 })}
                    className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-[11px] font-mono text-red-300 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    -15m
                  </button>
                  <button
                    type="button"
                    disabled={timerCtrlLoading || !isCurrentUserSuperAdmin}
                    onClick={() => handleTimerControl("ADJUST_TIME", { deltaSeconds: -30 * 60 })}
                    className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-[11px] font-mono text-red-300 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    -30m
                  </button>
                </div>

                {/* Custom Total Duration Setting */}
                <div className="flex items-center gap-2 pt-1">
                  <div className="flex items-center gap-1.5 flex-1 bg-black/60 border border-white/10 rounded-xl px-2.5 py-1.5">
                    <span className="text-[10px] font-mono text-white/40">DURATION:</span>
                    <input
                      type="number"
                      min={0}
                      max={168}
                      value={customDurationHours}
                      onChange={(e) => setCustomDurationHours(Math.max(0, parseInt(e.target.value) || 0))}
                      disabled={!isCurrentUserSuperAdmin || timerCtrlLoading}
                      className="w-12 bg-transparent text-center text-xs font-mono font-bold text-white outline-none border-b border-white/20 focus:border-cyan-400"
                    />
                    <span className="text-[11px] font-mono text-white/50">hrs</span>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={customDurationMinutes}
                      onChange={(e) => setCustomDurationMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                      disabled={!isCurrentUserSuperAdmin || timerCtrlLoading}
                      className="w-10 bg-transparent text-center text-xs font-mono font-bold text-white outline-none border-b border-white/20 focus:border-cyan-400"
                    />
                    <span className="text-[11px] font-mono text-white/50">mins</span>
                  </div>
                  <button
                    type="button"
                    disabled={timerCtrlLoading || !isCurrentUserSuperAdmin}
                    onClick={() => {
                      const totalSec = customDurationHours * 3600 + customDurationMinutes * 60;
                      if (totalSec <= 0) return alert("Duration must be greater than 0");
                      handleTimerControl("SET_TIME", { durationSeconds: totalSec });
                    }}
                    className="px-3.5 py-2 bg-white/10 hover:bg-white/15 border border-white/15 text-white font-mono text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
                  >
                    Set Time
                  </button>
                </div>

                {/* Banner / Phase Customizer */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={phaseLabelInput}
                    onChange={(e) => setPhaseLabelInput(e.target.value)}
                    placeholder="Auditorium Banner (e.g. Coding Phase - 24 Hours)"
                    disabled={!isCurrentUserSuperAdmin || timerCtrlLoading}
                    className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono text-white focus:ring-1 focus:ring-cyan-500 outline-none"
                  />
                  <button
                    type="button"
                    disabled={timerCtrlLoading || !isCurrentUserSuperAdmin}
                    onClick={() => handleTimerControl("SET_LABEL", { phaseLabel: phaseLabelInput })}
                    className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-mono text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
                  >
                    Set Banner
                  </button>
                </div>
              </div>

              {timerCtrlMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-mono border ${
                    timerCtrlMsg.startsWith("✓")
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : "bg-red-500/10 border-red-500/30 text-red-300"
                  }`}
                >
                  {timerCtrlMsg}
                </div>
              )}
            </div>

            {/* Feature 4: Active Review Round Selector */}
            <div className="lg:col-span-2 bg-black/40 border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block font-bold">
                    CONTROL 04: JURY REVIEW ROUND TOGGLE (3 STAGES)
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    Select Active Review Round
                  </h3>
                  <p className="text-xs text-white/60 mt-1 leading-relaxed">
                    Toggle which review round is currently active. When you switch rounds (e.g. to Review 1, Review 2, or Review 3), evaluators in the admin dashboard will strictly be restricted to submitting marks for that selected round.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-white/40 block">CURRENTLY ACTIVE</span>
                  <span className="text-xs font-mono font-bold text-amber-300">
                    Review {activeReviewRound}: {getRoundInfo(activeReviewRound).subtitle}
                  </span>
                </div>
              </div>

              {/* Review Round Selection Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {REVIEW_ROUNDS.map((r) => {
                  const isActive = activeReviewRound === r.round;
                  return (
                    <button
                      key={r.round}
                      type="button"
                      onClick={() => handleSetActiveRound(r.round)}
                      disabled={roundUpdating || !isCurrentUserSuperAdmin}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        isActive
                          ? "bg-amber-500/20 border-amber-500/50 text-white shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30"
                          : "bg-black/40 border-white/10 text-white/60 hover:text-white hover:border-white/20"
                      } disabled:opacity-50`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-xs font-bold uppercase text-amber-300">{r.title}</span>
                        {isActive && (
                          <span className="px-2 py-0.5 rounded bg-amber-500/30 text-amber-300 text-[10px] font-mono font-bold">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-white">{r.subtitle}</p>
                      <p className="text-[11px] text-white/40 font-mono mt-1">
                        {r.round <= 2 ? "Internal Faculty / Mentor Judging" : "External Industry Jury Judging"}
                      </p>
                    </button>
                  );
                })}
              </div>

              {roundMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-mono border ${
                    roundMsg.startsWith("✓")
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : "bg-red-500/10 border-red-500/30 text-red-300"
                  }`}
                >
                  {roundMsg}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

        {/* Overview Stats Grid */}
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

          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 backdrop-blur-xl space-y-1 col-span-2 md:col-span-1">
            <span className="text-[11px] font-mono text-white/40 uppercase">Evaluation Frame</span>
            <div className="text-3xl font-black text-purple-400 tracking-tight">
              {stats.evaluatedTeamsCount || 0} / {stats.totalTeams}
            </div>
            <p className="text-[10px] text-white/50">Teams Graded</p>
          </div>
        </div>

        {/* Tab Controls: Visible ONLY to Super Admin */}
        {isCurrentUserSuperAdmin && (
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
        )}

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
                  Evaluated ({teams.filter(isTeamEvaluatedInActiveRound).length})
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
                  Pending Eval ({teams.filter((t: any) => !isTeamEvaluatedInActiveRound(t)).length})
                </button>
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
                        const roundEval = (t.evaluations || []).find((e: any) => e.round === activeReviewRound);
                        const score = roundEval ? roundEval.scoreTotal : (activeReviewRound === 1 ? t.scoreTotal : null);
                        const isRoundEvaluated = score !== null && score !== undefined;
                        const isTeamFrozen = roundEval ? roundEval.isFrozen : false;
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
                                  className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-mono text-xs font-bold shrink-0 shadow-sm shadow-cyan-500/10"
                                  title="Team Creator & Leader"
                                >
                                  {leaderName.charAt(0).toUpperCase()}
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

                            {/* Deliverables & Submission Lock Status */}
                            <td className="py-4 px-5">
                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full ${t.pptUrl ? "bg-emerald-400" : "bg-white/20"}`} />
                                    <span className={`text-[10px] font-mono ${t.pptUrl ? "text-emerald-300" : "text-white/40"}`}>
                                      S1: {t.pptUrl ? (t.isPhase1Locked ? "Submitted (🔒)" : "Submitted (🔓)") : "Pending"}
                                    </span>
                                  </div>
                                  {t.pptUrl && isCurrentUserSuperAdmin && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleSubmissionLock(t.id, "IDEA", t.isPhase1Locked);
                                      }}
                                      disabled={togglingSubLockId === `${t.id}_IDEA`}
                                      title={t.isPhase1Locked ? "Unlock Phase 1 idea submission for this team" : "Lock Phase 1 idea submission"}
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase transition-all cursor-pointer ${
                                        t.isPhase1Locked
                                          ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40"
                                          : "bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40"
                                      } disabled:opacity-50`}
                                    >
                                      {togglingSubLockId === `${t.id}_IDEA` ? "..." : (t.isPhase1Locked ? "🔓 Unlock" : "🔒 Lock")}
                                    </button>
                                  )}
                                </div>

                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full ${t.finalDocUrl ? "bg-emerald-400" : "bg-white/20"}`} />
                                    <span className={`text-[10px] font-mono ${t.finalDocUrl ? "text-emerald-300" : "text-white/40"}`}>
                                      S2: {t.finalDocUrl ? (t.isPhase2Locked ? "Submitted (🔒)" : "Submitted (🔓)") : "Pending"}
                                    </span>
                                  </div>
                                  {t.finalDocUrl && isCurrentUserSuperAdmin && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleSubmissionLock(t.id, "FINAL", t.isPhase2Locked);
                                      }}
                                      disabled={togglingSubLockId === `${t.id}_FINAL`}
                                      title={t.isPhase2Locked ? "Unlock Phase 2 final deliverables for this team" : "Lock Phase 2 deliverables"}
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase transition-all cursor-pointer ${
                                        t.isPhase2Locked
                                          ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40"
                                          : "bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40"
                                      } disabled:opacity-50`}
                                    >
                                      {togglingSubLockId === `${t.id}_FINAL` ? "..." : (t.isPhase2Locked ? "🔓 Unlock" : "🔒 Lock")}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Evaluation Status & Score */}
                            <td className="py-4 px-5">
                              {isRoundEvaluated ? (
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono font-bold text-xs w-fit">
                                      <span className="material-symbols-outlined text-xs">verified</span>
                                      {score} / 30
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                                      isTeamFrozen
                                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                        : "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                                    }`}>
                                      {isTeamFrozen ? "🔒 Locked" : "🔓 Unlocked"}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[11px] w-fit">
                                  <span className="material-symbols-outlined text-xs">schedule</span>
                                  Pending R{activeReviewRound}
                                </span>
                              )}
                            </td>

                            {/* Action Button & Super Admin Freeze Toggle */}
                            <td className="py-4 px-5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {isCurrentUserSuperAdmin && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleTeamFreeze(t.id, !isTeamFrozen);
                                    }}
                                    disabled={togglingFreezeId === t.id}
                                    title={isTeamFrozen ? "Click to unfreeze marks for evaluators" : "Click to freeze marks"}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase border transition-all cursor-pointer ${
                                      isTeamFrozen
                                        ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30 shadow-sm shadow-amber-500/10"
                                        : "bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/30 shadow-sm shadow-cyan-500/10"
                                    } disabled:opacity-50`}
                                  >
                                    <span className="material-symbols-outlined text-xs">
                                      {isTeamFrozen ? "lock_open" : "lock"}
                                    </span>
                                    <span>{togglingFreezeId === t.id ? "..." : (isTeamFrozen ? "Unfreeze" : "Freeze")}</span>
                                  </button>
                                )}

                                <Link
                                  href={`/admin/evaluate/${t.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/40 hover:border-transparent rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm"
                                >
                                  <span>{isCurrentUserSuperAdmin ? "Inspect" : (isRoundEvaluated ? "Review" : "Evaluate")}</span>
                                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </Link>
                              </div>
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
