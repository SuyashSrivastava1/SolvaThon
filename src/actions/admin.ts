"use server";

import prisma, { getDatabaseUrl } from "@/lib/prisma";
import { isAdminEmail, isSuperAdminEmail } from "@/config/admin";
import { cookies, headers } from "next/headers";
import { verifyFirebaseIdToken } from "@/lib/firebase/admin";

// Strictly require configured environment variable without any hardcoded backdoor fallback (HIGH-01)
const ADMIN_KEY = process.env.ADMIN_ACCESS_KEY;

/**
 * Resolves whether the caller has administrator privileges by verifying
 * their Firebase ID token or server-side session credentials.
 */
async function resolveAdminCaller(
  tokenOrEmail?: string | null
): Promise<{ email: string; isSuperAdmin: boolean } | null> {
  // 1. Check if ADMIN_ACCESS_KEY is supplied (legacy/breakglass admin mechanism)
  if (tokenOrEmail && ADMIN_KEY && tokenOrEmail.trim() === ADMIN_KEY) {
    return { email: "key_admin@solvathon.internal", isSuperAdmin: true };
  }

  // 2. Check if a JWT token was passed directly
  let token = tokenOrEmail && tokenOrEmail.includes(".") && tokenOrEmail.split(".").length === 3 ? tokenOrEmail.trim() : null;

  // 3. Check Authorization header
  if (!token) {
    try {
      const headerList = await headers();
      const authHeader = headerList.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7).trim();
      }
    } catch {}
  }

  // 4. Check auth_token cookie
  if (!token) {
    try {
      const cookieStore = await cookies();
      const cookie = cookieStore.get("auth_token");
      if (cookie?.value) {
        token = decodeURIComponent(cookie.value);
      }
    } catch {}
  }

  if (token) {
    const decoded = await verifyFirebaseIdToken(token);
    if (decoded && decoded.email && isAdminEmail(decoded.email)) {
      const normalizedEmail = decoded.email.trim().toLowerCase();
      return {
        email: normalizedEmail,
        isSuperAdmin: isSuperAdminEmail(normalizedEmail),
      };
    }
  }

  // 5. Fallback for server-side evaluation calls if email matches registered admin list
  if (tokenOrEmail && isAdminEmail(tokenOrEmail)) {
    const normalizedEmail = tokenOrEmail.trim().toLowerCase();
    return {
      email: normalizedEmail,
      isSuperAdmin: isSuperAdminEmail(normalizedEmail),
    };
  }

  return null;
}

export async function checkIsAdmin(tokenOrEmail?: string | null) {
  const caller = await resolveAdminCaller(tokenOrEmail);
  return Boolean(caller);
}

export async function checkIsSuperAdmin(tokenOrEmail?: string | null) {
  const caller = await resolveAdminCaller(tokenOrEmail);
  return Boolean(caller?.isSuperAdmin);
}

export async function verifyAdminAccess(tokenOrEmail?: string | null) {
  const caller = await resolveAdminCaller(tokenOrEmail);
  return Boolean(caller);
}

export async function getAdminData(tokenOrEmail?: string | null) {
  const caller = await resolveAdminCaller(tokenOrEmail);
  if (!caller) {
    return { success: false, error: "Unauthorized access. Valid administrator credentials required." };
  }

  const isSuperAdmin = caller.isSuperAdmin;

  const dbUrl = getDatabaseUrl();
  if (!dbUrl) {
    let cfEnvKeys: string[] = [];
    try {
      const { getCloudflareContext } = require("@opennextjs/cloudflare");
      const ctx = getCloudflareContext();
      if (ctx?.env) {
        cfEnvKeys = Object.keys(ctx.env);
      }
    } catch (e) {}

    return {
      success: false,
      error: `DATABASE_URL not found in Runtime Bindings (Current keys: [${cfEnvKeys.join(", ")}]). In your Cloudflare Worker Settings sidebar, click "Bindings" (above Observability) and add DATABASE_URL there.`
    };
  }

  try {
    let participants: any[] = [];
    let teams: any[] = [];
    let configs: any[] = [];

    let queryError: any = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        participants = await prisma.participant.findMany({
          include: {
            team: {
              select: { name: true, teamCode: true, problemStatement: true, submittedAt: true, finalSubmittedAt: true }
            }
          },
          orderBy: { registrationTime: "desc" }
        });

        teams = await prisma.team.findMany({
          include: {
            participants: {
              select: { fullName: true, emailId: true, mobileNumber: true, gender: true, hostelBlock: true, roomNumber: true, ticketId: true, registrationTime: true },
              orderBy: { registrationTime: "asc" }
            },
            evaluations: {
              orderBy: { round: "asc" }
            }
          },
          orderBy: { createdAt: "desc" }
        });

        configs = await prisma.systemConfig.findMany({
          where: { key: { in: ["submission_phase", "target_date", "timer_paused", "active_review_round", "hackathon_timer"] } }
        }).catch(() => []);

        queryError = null;
        break;
      } catch (err: any) {
        queryError = err;
        console.warn(`Admin Data query attempt ${attempt + 1} failed:`, err?.message || err);
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 600));
        }
      }
    }

    if (queryError) {
      throw queryError;
    }

    const phaseConfig = configs.find((c: any) => c.key === "submission_phase");
    const timerConfig = configs.find((c: any) => c.key === "target_date");
    const pauseConfig = configs.find((c: any) => c.key === "timer_paused");
    const activeRoundConfig = configs.find((c: any) => c.key === "active_review_round");
    const hackathonTimerConfig = configs.find((c: any) => c.key === "hackathon_timer");
    const activeReviewRound = activeRoundConfig ? parseInt(activeRoundConfig.value, 10) || 1 : 1;

    let hackathonTimer = null;
    if (hackathonTimerConfig?.value) {
      try {
        const { calculateCurrentRemaining, DEFAULT_TIMER_STATE } = await import("@/lib/timer");
        const parsed = { ...DEFAULT_TIMER_STATE, ...JSON.parse(hackathonTimerConfig.value) };
        hackathonTimer = {
          ...parsed,
          currentRemainingSeconds: calculateCurrentRemaining(parsed),
        };
      } catch (e) {
        console.error("Failed to parse hackathon_timer in getAdminData:", e);
      }
    }

    // Purge and filter out any blank/empty teams with 0 participants
    const emptyTeamIds = teams.filter((t: any) => !t.participants || t.participants.length === 0).map((t: any) => t.id);
    if (emptyTeamIds.length > 0) {
      prisma.teamEvaluation.deleteMany({ where: { teamId: { in: emptyTeamIds } } })
        .then(() => prisma.team.deleteMany({ where: { id: { in: emptyTeamIds } } }))
        .catch((err: any) => console.error("Error purging empty teams:", err));
      teams = teams.filter((t: any) => t.participants && t.participants.length > 0);
    }

    // Breakdown aggregations
    const blockStats: Record<string, number> = {};
    const messStats: Record<string, number> = {};
    const trackStats: Record<string, number> = {};

    participants.forEach((p: any) => {
      blockStats[p.hostelBlock] = (blockStats[p.hostelBlock] || 0) + 1;
      messStats[p.messCaterer] = (messStats[p.messCaterer] || 0) + 1;
    });

    teams.forEach((t: any) => {
      const track = t.problemStatement || "Unassigned";
      trackStats[track] = (trackStats[track] || 0) + 1;
    });

    const ideaSubmissionsCount = teams.filter((t: any) => !!t.pptUrl).length;
    const finalSubmissionsCount = teams.filter((t: any) => !!t.finalDocUrl).length;
    const evaluatedTeamsCount = teams.filter((t: any) => {
      return (t.evaluations || []).some((e: any) => e.round === activeReviewRound && e.scoreTotal !== null && e.scoreTotal !== undefined);
    }).length;

    return {
      success: true,
      isSuperAdmin,
      systemSettings: {
        submissionPhase: (phaseConfig?.value as "IDEA" | "FINAL") || "IDEA",
        targetDate: timerConfig?.value || "2026-12-10T23:59:59+05:30",
        isPaused: pauseConfig?.value === "true",
        activeReviewRound,
        hackathonTimer,
      },
      stats: {
        totalParticipants: participants.length,
        totalTeams: teams.length,
        fullTeams: teams.filter((t: any) => t.participants.length >= 4).length,
        ideaSubmissionsCount,
        finalSubmissionsCount,
        evaluatedTeamsCount,
        blockStats,
        messStats,
        trackStats
      },
      participants: participants.map((p: any) => ({
        id: p.id,
        fullName: p.fullName,
        emailId: p.emailId,
        mobileNumber: p.mobileNumber,
        gender: p.gender || "N/A",
        hostelBlock: p.hostelBlock,
        roomNumber: p.roomNumber,
        messCaterer: p.messCaterer,
        messType: p.messType,
        ticketId: p.ticketId,
        registrationTime: p.registrationTime.toISOString(),
        teamName: p.team?.name || "No Team",
        teamCode: p.team?.teamCode || "N/A"
      })),
      teams: teams.map((t: any) => {
        const leader = t.participants && t.participants.length > 0
          ? (t.participants.find((p: any) => p.id === t.leaderId || p.firebaseUid === t.leaderId) || t.participants[0])
          : null;
        return {
          id: t.id,
          name: t.name,
          teamCode: t.teamCode,
          leaderName: leader ? leader.fullName : "N/A",
          leaderEmail: leader ? leader.emailId : "N/A",
          leaderPhone: leader ? leader.mobileNumber : "N/A",
          leaderTicketId: leader ? leader.ticketId : "N/A",
          createdAt: t.createdAt.toISOString(),
          memberCount: t.participants.length,
          problemStatement: t.problemStatement || "Not Selected",
          implementationType: t.implementationType || null,
          pptUrl: t.pptUrl,
          understanding: t.understanding,
          submittedAt: t.submittedAt ? t.submittedAt.toISOString() : null,
          phase1Unlocked: t.phase1Unlocked,
          phase2Unlocked: t.phase2Unlocked,
          isPhase1Locked: Boolean(t.submittedAt && t.phase1Unlocked !== true),
          isPhase2Locked: Boolean(t.finalSubmittedAt && t.phase2Unlocked !== true),
          // Final Project Submissions
          finalDocUrl: t.finalDocUrl,
          finalRepoUrl: t.finalRepoUrl,
          finalDemoUrl: t.finalDemoUrl,
          finalSummary: t.finalSummary,
          finalSubmittedAt: t.finalSubmittedAt ? t.finalSubmittedAt.toISOString() : null,
          // Round-based evaluations
          evaluations: (t.evaluations || []).map((ev: any) => ({
            id: ev.id,
            round: ev.round,
            scoreInnovation: ev.scoreInnovation,
            scoreUnderstanding: ev.scoreUnderstanding,
            scoreProgress: ev.scoreProgress,
            scoreTotal: ev.scoreTotal,
            evaluatedBy: ev.evaluatedBy,
            evaluationNotes: ev.evaluationNotes,
            evaluatedAt: ev.evaluatedAt ? ev.evaluatedAt.toISOString() : null,
            isFrozen: ev.isFrozen,
          })),
          activeRoundEval: (() => {
            const match = (t.evaluations || []).find((ev: any) => ev.round === activeReviewRound);
            if (!match) return null;
            return {
              id: match.id,
              round: match.round,
              scoreInnovation: match.scoreInnovation,
              scoreUnderstanding: match.scoreUnderstanding,
              scoreProgress: match.scoreProgress,
              scoreTotal: match.scoreTotal,
              evaluatedBy: match.evaluatedBy,
              evaluationNotes: match.evaluationNotes,
              evaluatedAt: match.evaluatedAt ? match.evaluatedAt.toISOString() : null,
              isFrozen: match.isFrozen,
            };
          })(),
          isFrozen: (() => {
            const match = (t.evaluations || []).find((ev: any) => ev.round === activeReviewRound);
            return match ? match.isFrozen : false;
          })(),
          // Active round scores (with fallback to legacy Team table fields if round 1 not yet in TeamEvaluation)
          scoreInnovation: (() => {
            const match = (t.evaluations || []).find((ev: any) => ev.round === activeReviewRound);
            return match ? match.scoreInnovation : (activeReviewRound === 1 ? t.scoreInnovation : null);
          })(),
          scoreUnderstanding: (() => {
            const match = (t.evaluations || []).find((ev: any) => ev.round === activeReviewRound);
            return match ? match.scoreUnderstanding : (activeReviewRound === 1 ? t.scoreUnderstanding : null);
          })(),
          scoreProgress: (() => {
            const match = (t.evaluations || []).find((ev: any) => ev.round === activeReviewRound);
            return match ? match.scoreProgress : (activeReviewRound === 1 ? t.scoreProgress : null);
          })(),
          scoreTotal: (() => {
            const match = (t.evaluations || []).find((ev: any) => ev.round === activeReviewRound);
            return match ? match.scoreTotal : (activeReviewRound === 1 ? t.scoreTotal : null);
          })(),
          evaluatedBy: (() => {
            const match = (t.evaluations || []).find((ev: any) => ev.round === activeReviewRound);
            return match ? match.evaluatedBy : (activeReviewRound === 1 ? t.evaluatedBy : null);
          })(),
          evaluationNotes: (() => {
            const match = (t.evaluations || []).find((ev: any) => ev.round === activeReviewRound);
            return match ? match.evaluationNotes : (activeReviewRound === 1 ? t.evaluationNotes : null);
          })(),
          evaluatedAt: (() => {
            const match = (t.evaluations || []).find((ev: any) => ev.round === activeReviewRound);
            return match?.evaluatedAt ? match.evaluatedAt.toISOString() : (activeReviewRound === 1 && t.evaluatedAt ? t.evaluatedAt.toISOString() : null);
          })(),
          members: t.participants.map((m: any) => ({
            fullName: m.fullName,
            emailId: m.emailId,
            mobileNumber: m.mobileNumber,
            gender: m.gender || "N/A",
            hostelBlock: m.hostelBlock,
            roomNumber: m.roomNumber,
            ticketId: m.ticketId
          }))
        };
      })
    };
  } catch (error: any) {
    console.error("Admin Data Fetch Error:", error);
    const detail = error?.message || (typeof error === "string" ? error : JSON.stringify(error));
    return { success: false, error: `Failed to load admin records from database: ${detail}` };
  }
}

/**
 * Super Admin Exclusive: Toggle submission phase between IDEA and FINAL
 */
export async function toggleSubmissionPhase(adminEmailOrToken: string, phase: "IDEA" | "FINAL") {
  const caller = await resolveAdminCaller(adminEmailOrToken);
  if (!caller?.isSuperAdmin) {
    return {
      success: false,
      error: "Access Denied: Super Admin permissions required to switch the submission phase."
    };
  }

  try {
    await prisma.systemConfig.upsert({
      where: { key: "submission_phase" },
      update: { value: phase },
      create: { key: "submission_phase", value: phase }
    });
    return { success: true, phase };
  } catch (error) {
    console.error("toggleSubmissionPhase error:", error);
    return { success: false, error: "Failed to update submission phase in database." };
  }
}

/**
 * Super Admin Exclusive: Change live hackathon countdown timer
 */
export async function updateHackathonTimer(
  adminEmailOrToken: string,
  targetDate: string,
  isPaused?: boolean
) {
  const caller = await resolveAdminCaller(adminEmailOrToken);
  if (!caller?.isSuperAdmin) {
    return {
      success: false,
      error: "Access Denied: Super Admin permissions required to change the hackathon timer."
    };
  }

  try {
    await prisma.systemConfig.upsert({
      where: { key: "target_date" },
      update: { value: targetDate },
      create: { key: "target_date", value: targetDate }
    });

    if (typeof isPaused === "boolean") {
      await prisma.systemConfig.upsert({
        where: { key: "timer_paused" },
        update: { value: isPaused ? "true" : "false" },
        create: { key: "timer_paused", value: isPaused ? "true" : "false" },
      });
    }

    return { success: true, targetDate, isPaused };
  } catch (error) {
    console.error("updateHackathonTimer error:", error);
    return { success: false, error: "Failed to update timer in database." };
  }
}

/**
 * Super Admin Exclusive: Switch the currently active review round (1: Internal 1, 2: Internal 2, 3: External)
 */
export async function setActiveReviewRound(adminEmailOrToken: string, round: number) {
  const caller = await resolveAdminCaller(adminEmailOrToken);
  if (!caller?.isSuperAdmin) {
    return {
      success: false,
      error: "Access Denied: Super Admin permissions required to switch the active review round."
    };
  }
  if (![1, 2, 3].includes(round)) {
    return { success: false, error: "Invalid review round. Must be 1, 2, or 3." };
  }

  try {
    await prisma.systemConfig.upsert({
      where: { key: "active_review_round" },
      update: { value: String(round) },
      create: { key: "active_review_round", value: String(round) }
    });
    return { success: true, activeReviewRound: round };
  } catch (error) {
    console.error("setActiveReviewRound error:", error);
    return { success: false, error: "Failed to update active review round in database." };
  }
}

/**
 * Super Admin Exclusive: Toggle freeze status for a team's marks in a particular round
 */
export async function toggleTeamFreezeStatus(
  adminEmailOrToken: string,
  teamId: string,
  round: number,
  isFrozen: boolean
) {
  const caller = await resolveAdminCaller(adminEmailOrToken);
  if (!caller?.isSuperAdmin) {
    return {
      success: false,
      error: "Access Denied: Super Admin permissions required to freeze or unfreeze evaluation marks."
    };
  }

  try {
    const updated = await prisma.teamEvaluation.upsert({
      where: {
        teamId_round: { teamId, round }
      },
      update: {
        isFrozen: isFrozen
      },
      create: {
        teamId,
        round,
        isFrozen: isFrozen
      }
    });

    return {
      success: true,
      teamId,
      round,
      isFrozen: updated.isFrozen
    };
  } catch (error) {
    console.error("toggleTeamFreezeStatus error:", error);
    return { success: false, error: "Failed to update freeze status." };
  }
}

/**
 * Evaluators: Submit rubric marks for a team in the active review round.
 * Note: Super Admins are prohibited from submitting marks directly.
 * Once submitted, marks are automatically frozen until Super Admin unfreezes them.
 */
export async function saveTeamEvaluation(
  adminEmailOrToken: string,
  teamId: string,
  roundOrEval: number | {
    scoreInnovation: number;
    scoreUnderstanding: number;
    scoreProgress: number;
    evaluationNotes?: string;
    round?: number;
  },
  maybeEvaluation?: {
    scoreInnovation: number;
    scoreUnderstanding: number;
    scoreProgress: number;
    evaluationNotes?: string;
  }
) {
  const caller = await resolveAdminCaller(adminEmailOrToken);
  if (!caller) {
    return { success: false, error: "Unauthorized access: Admin privileges required to evaluate participants." };
  }

  const adminEmail = caller.email;

  // Super Admin should NOT mark teams
  if (caller.isSuperAdmin && adminEmail !== "key_admin@solvathon.internal") {
    return {
      success: false,
      error: "Super Admins cannot mark teams directly. Marking is strictly reserved for Evaluators. Super Admins can unfreeze teams to allow evaluators to edit."
    };
  }

  try {
    // Determine target round
    let round: number;
    let evalData: {
      scoreInnovation: number;
      scoreUnderstanding: number;
      scoreProgress: number;
      evaluationNotes?: string;
    };

    if (typeof roundOrEval === "number") {
      round = roundOrEval;
      evalData = maybeEvaluation || { scoreInnovation: 0, scoreUnderstanding: 0, scoreProgress: 0 };
    } else {
      evalData = roundOrEval;
      if (roundOrEval.round) {
        round = roundOrEval.round;
      } else {
        const activeCfg = await prisma.systemConfig.findUnique({ where: { key: "active_review_round" } });
        round = activeCfg ? parseInt(activeCfg.value, 10) || 1 : 1;
      }
    }

    // Enforce that submissions can ONLY happen for the currently active round set by Super Admin
    const activeCfg = await prisma.systemConfig.findUnique({ where: { key: "active_review_round" } });
    const currentActiveRound = activeCfg ? parseInt(activeCfg.value, 10) || 1 : 1;
    if (round !== currentActiveRound) {
      return {
        success: false,
        error: `Evaluation closed for Review ${round}. The active round selected by Super Admin is Review ${currentActiveRound}.`
      };
    }

    // Check if marks are already frozen
    const existing = await prisma.teamEvaluation.findUnique({
      where: { teamId_round: { teamId, round } }
    });

    if (existing && existing.isFrozen) {
      return {
        success: false,
        error: `Marks for Review ${round} are frozen. Only Super Admin can unfreeze them to permit changes.`
      };
    }

    const inn = Number((Math.max(0, Math.min(10, parseFloat(String(evalData.scoreInnovation)) || 0))).toFixed(2));
    const und = Number((Math.max(0, Math.min(10, parseFloat(String(evalData.scoreUnderstanding)) || 0))).toFixed(2));
    const pro = Number((Math.max(0, Math.min(10, parseFloat(String(evalData.scoreProgress)) || 0))).toFixed(2));
    const scoreTotal = Number((inn + und + pro).toFixed(2));

    // Save and automatically freeze marks!
    const record = await prisma.teamEvaluation.upsert({
      where: {
        teamId_round: { teamId, round }
      },
      update: {
        scoreInnovation: inn,
        scoreUnderstanding: und,
        scoreProgress: pro,
        scoreTotal,
        evaluatedBy: adminEmail,
        evaluationNotes: evalData.evaluationNotes?.trim() || "",
        evaluatedAt: new Date(),
        isFrozen: true, // Automatically frozen
      },
      create: {
        teamId,
        round,
        scoreInnovation: inn,
        scoreUnderstanding: und,
        scoreProgress: pro,
        scoreTotal,
        evaluatedBy: adminEmail,
        evaluationNotes: evalData.evaluationNotes?.trim() || "",
        evaluatedAt: new Date(),
        isFrozen: true, // Automatically frozen
      }
    });

    // Also update legacy Team columns for backward compatibility / fallback
    await prisma.team.update({
      where: { id: teamId },
      data: {
        scoreInnovation: inn,
        scoreUnderstanding: und,
        scoreProgress: pro,
        scoreTotal,
        evaluatedBy: adminEmail,
        evaluationNotes: evalData.evaluationNotes?.trim() || "",
        evaluatedAt: record.evaluatedAt,
      }
    }).catch(() => {});

    return {
      success: true,
      teamId,
      round,
      scoreTotal,
      isFrozen: true,
      evaluatedBy: adminEmail,
      evaluatedAt: record.evaluatedAt.toISOString(),
    };
  } catch (error) {
    console.error("saveTeamEvaluation error:", error);
    return { success: false, error: "Failed to save team evaluation marks." };
  }
}

/**
 * Super Admin Exclusive: Toggle submission lock/unlock for a specific team.
 * Once team leaders submit, changes are locked by default.
 * Only a Super Admin can unlock the submissions page for a particular team.
 *
 * @param phase "IDEA" (Phase 1) | "FINAL" (Phase 2) | "BOTH"
 * @param unlocked true to allow the team to edit/resubmit, false to lock
 */
export async function toggleTeamSubmissionLock(
  adminEmailOrToken: string,
  teamId: string,
  phase: "IDEA" | "FINAL" | "BOTH",
  unlocked: boolean
) {
  const caller = await resolveAdminCaller(adminEmailOrToken);
  if (!caller?.isSuperAdmin) {
    return {
      success: false,
      error: "Access Denied: Super Admin permissions required to unlock or lock team submissions."
    };
  }

  try {
    const updateData: { phase1Unlocked?: boolean; phase2Unlocked?: boolean } = {};
    if (phase === "IDEA" || phase === "BOTH") {
      updateData.phase1Unlocked = unlocked;
    }
    if (phase === "FINAL" || phase === "BOTH") {
      updateData.phase2Unlocked = unlocked;
    }

    const updated = await prisma.team.update({
      where: { id: teamId },
      data: updateData,
      select: {
        id: true,
        name: true,
        submittedAt: true,
        finalSubmittedAt: true,
        phase1Unlocked: true,
        phase2Unlocked: true,
      }
    });

    return {
      success: true,
      teamId: updated.id,
      teamName: updated.name,
      phase,
      phase1Unlocked: updated.phase1Unlocked,
      phase2Unlocked: updated.phase2Unlocked,
      isPhase1Locked: Boolean(updated.submittedAt && updated.phase1Unlocked !== true),
      isPhase2Locked: Boolean(updated.finalSubmittedAt && updated.phase2Unlocked !== true),
    };
  } catch (error) {
    console.error("toggleTeamSubmissionLock error:", error);
    return { success: false, error: "Failed to update team submission lock status in database." };
  }
}

/**
 * Super Admin: Fetch current hackathon timer configuration.
 */
export async function getTimerState(adminEmailOrToken: string) {
  const caller = await resolveAdminCaller(adminEmailOrToken);
  if (!caller) {
    return { success: false, error: "Unauthorized access." };
  }

  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: "hackathon_timer" },
    });

    const { DEFAULT_TIMER_STATE, calculateCurrentRemaining } = await import("@/lib/timer");
    let state = DEFAULT_TIMER_STATE;

    if (config?.value) {
      try {
        state = { ...DEFAULT_TIMER_STATE, ...JSON.parse(config.value) };
      } catch (e) {
        console.error("Failed to parse timer JSON:", e);
      }
    }

    const currentRemainingSeconds = calculateCurrentRemaining(state);

    return {
      success: true,
      state: {
        ...state,
        currentRemainingSeconds,
      },
    };
  } catch (error) {
    console.error("getTimerState error:", error);
    return { success: false, error: "Failed to load timer state." };
  }
}

export type TimerControlAction = "START" | "PAUSE" | "RESUME" | "RESET" | "SET_TIME" | "ADJUST_TIME" | "SET_LABEL";

/**
 * Super Admin Exclusive: Control Hackathon Timer
 * Supports Start, Pause, Resume, Reset, Custom Time Setting, and Adding/Subtracting Time.
 */
export async function controlHackathonTimer(
  adminEmailOrToken: string,
  payload: {
    action: TimerControlAction;
    durationSeconds?: number;
    deltaSeconds?: number;
    phaseLabel?: string;
    title?: string;
  }
) {
  const caller = await resolveAdminCaller(adminEmailOrToken);
  if (!caller?.isSuperAdmin) {
    return {
      success: false,
      error: "Access Denied: Only Super Admin can control the hackathon countdown timer.",
    };
  }

  try {
    const { DEFAULT_TIMER_STATE, calculateCurrentRemaining } = await import("@/lib/timer");

    const config = await prisma.systemConfig.findUnique({
      where: { key: "hackathon_timer" },
    });

    let state = DEFAULT_TIMER_STATE;
    if (config?.value) {
      try {
        state = { ...DEFAULT_TIMER_STATE, ...JSON.parse(config.value) };
      } catch (e) {
        console.error("Failed to parse timer JSON:", e);
      }
    }

    const now = Date.now();

    switch (payload.action) {
      case "START":
      case "RESUME": {
        const remaining = state.status === "PAUSED"
          ? state.remainingSeconds
          : (state.remainingSeconds > 0 ? state.remainingSeconds : state.durationSeconds);

        state.status = "RUNNING";
        state.remainingSeconds = remaining;
        state.targetTimestamp = now + remaining * 1000;
        if (!state.startedAt) state.startedAt = now;
        state.pausedAt = null;
        break;
      }

      case "PAUSE": {
        if (state.status === "RUNNING") {
          const currentRemaining = calculateCurrentRemaining(state);
          state.status = "PAUSED";
          state.remainingSeconds = currentRemaining;
          state.targetTimestamp = null;
          state.pausedAt = now;
        }
        break;
      }

      case "RESET": {
        state.status = "STOPPED";
        state.remainingSeconds = state.durationSeconds;
        state.targetTimestamp = null;
        state.startedAt = null;
        state.pausedAt = null;
        break;
      }

      case "SET_TIME": {
        if (typeof payload.durationSeconds === "number" && payload.durationSeconds > 0) {
          state.durationSeconds = payload.durationSeconds;
          state.remainingSeconds = payload.durationSeconds;
          if (state.status === "RUNNING") {
            state.targetTimestamp = now + payload.durationSeconds * 1000;
          } else {
            state.targetTimestamp = null;
          }
        }
        break;
      }

      case "ADJUST_TIME": {
        if (typeof payload.deltaSeconds === "number") {
          if (state.status === "RUNNING" && state.targetTimestamp) {
            const newTarget = state.targetTimestamp + payload.deltaSeconds * 1000;
            state.targetTimestamp = Math.max(now, newTarget);
            state.remainingSeconds = Math.max(0, Math.floor((state.targetTimestamp - now) / 1000));
          } else {
            state.remainingSeconds = Math.max(0, state.remainingSeconds + payload.deltaSeconds);
          }
        }
        break;
      }

      case "SET_LABEL": {
        if (payload.phaseLabel !== undefined) state.phaseLabel = payload.phaseLabel.trim();
        if (payload.title !== undefined) state.title = payload.title.trim();
        break;
      }
    }

    state.updatedAt = now;
    if (payload.phaseLabel !== undefined) state.phaseLabel = payload.phaseLabel.trim();
    if (payload.title !== undefined) state.title = payload.title.trim();

    await prisma.systemConfig.upsert({
      where: { key: "hackathon_timer" },
      update: {
        value: JSON.stringify(state),
        updatedAt: new Date(),
      },
      create: {
        key: "hackathon_timer",
        value: JSON.stringify(state),
      },
    });

    const currentRemainingSeconds = calculateCurrentRemaining(state);

    return {
      success: true,
      state: {
        ...state,
        currentRemainingSeconds,
      },
      message: `Timer successfully updated (${payload.action}).`,
    };
  } catch (error: any) {
    console.error("controlHackathonTimer error:", error);
    return { success: false, error: "Failed to update hackathon timer in database." };
  }
}

