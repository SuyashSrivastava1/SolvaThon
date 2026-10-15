"use server";

import prisma, { getDatabaseUrl } from "@/lib/prisma";
import { isAdminEmail, isSuperAdminEmail } from "@/config/admin";

const ADMIN_KEY = process.env.ADMIN_ACCESS_KEY || "warden_solvathon_2026";

export async function checkIsAdmin(email?: string | null) {
  return isAdminEmail(email);
}

export async function checkIsSuperAdmin(email?: string | null) {
  return isSuperAdminEmail(email);
}

export async function verifyAdminAccess(tokenOrEmail?: string | null) {
  if (!tokenOrEmail) return false;
  return tokenOrEmail.trim() === ADMIN_KEY || isAdminEmail(tokenOrEmail);
}

export async function getAdminData(tokenOrEmail?: string | null) {
  if (!tokenOrEmail) {
    return { success: false, error: "Unauthorized access. Credentials required." };
  }
  const isKeyValid = tokenOrEmail.trim() === ADMIN_KEY;
  const isEmailAdmin = isAdminEmail(tokenOrEmail);

  if (!isKeyValid && !isEmailAdmin) {
    return { success: false, error: "Unauthorized access. Invalid Admin Access Key or credentials." };
  }

  const isSuperAdmin = isSuperAdminEmail(tokenOrEmail) || isKeyValid;

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
          where: { key: { in: ["submission_phase", "target_date", "timer_paused", "active_review_round"] } }
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
    const activeReviewRound = activeRoundConfig ? parseInt(activeRoundConfig.value, 10) || 1 : 1;

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
          pptUrl: t.pptUrl,
          understanding: t.understanding,
          solutionSummary: t.solutionSummary,
          submittedAt: t.submittedAt ? t.submittedAt.toISOString() : null,
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
export async function toggleSubmissionPhase(adminEmail: string, phase: "IDEA" | "FINAL") {
  if (!isSuperAdminEmail(adminEmail) && adminEmail !== ADMIN_KEY) {
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
  adminEmail: string,
  targetDate: string,
  isPaused?: boolean
) {
  if (!isSuperAdminEmail(adminEmail) && adminEmail !== ADMIN_KEY) {
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
export async function setActiveReviewRound(adminEmail: string, round: number) {
  if (!isSuperAdminEmail(adminEmail) && adminEmail !== ADMIN_KEY) {
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
  adminEmail: string,
  teamId: string,
  round: number,
  isFrozen: boolean
) {
  if (!isSuperAdminEmail(adminEmail) && adminEmail !== ADMIN_KEY) {
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
 * Note: Super Admins are prohibited from submitting marks.
 * Once submitted, marks are automatically frozen until Super Admin unfreezes them.
 */
export async function saveTeamEvaluation(
  adminEmail: string,
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
  if (!isAdminEmail(adminEmail) && adminEmail !== ADMIN_KEY) {
    return { success: false, error: "Unauthorized access: Admin privileges required to evaluate participants." };
  }

  // Super Admin should NOT mark teams
  if (isSuperAdminEmail(adminEmail) && adminEmail !== ADMIN_KEY) {
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
        isFrozen: true, // Automatically frozen!
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
        isFrozen: true, // Automatically frozen!
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
