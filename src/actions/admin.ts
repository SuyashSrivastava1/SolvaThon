"use server";

import prisma, { getDatabaseUrl } from "@/lib/prisma";
import { isAdminEmail, isSuperAdminEmail } from "@/config/admin";

const ADMIN_KEY = process.env.ADMIN_ACCESS_KEY || "warden_cyft_2025";

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
            }
          },
          orderBy: { createdAt: "desc" }
        });

        configs = await prisma.systemConfig.findMany({
          where: { key: { in: ["submission_phase", "target_date", "timer_paused"] } }
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
    const evaluatedTeamsCount = teams.filter((t: any) => t.scoreTotal !== null && t.scoreTotal !== undefined).length;

    return {
      success: true,
      isSuperAdmin,
      systemSettings: {
        submissionPhase: (phaseConfig?.value as "IDEA" | "FINAL") || "IDEA",
        targetDate: timerConfig?.value || "2026-12-01T23:59:59+05:30",
        isPaused: pauseConfig?.value === "true"
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
        const leader = t.participants && t.participants.length > 0 ? t.participants[0] : null;
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
          // 3 Evaluation Criteria Scores
          scoreInnovation: t.scoreInnovation,
          scoreUnderstanding: t.scoreUnderstanding,
          scoreProgress: t.scoreProgress,
          scoreTotal: t.scoreTotal,
          evaluatedBy: t.evaluatedBy,
          evaluationNotes: t.evaluationNotes,
          evaluatedAt: t.evaluatedAt ? t.evaluatedAt.toISOString() : null,
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
 * All Admins: Evaluate team on the 3 criteria (Innovation, Understanding, Progress)
 */
export async function saveTeamEvaluation(
  adminEmail: string,
  teamId: string,
  evaluation: {
    scoreInnovation: number;
    scoreUnderstanding: number;
    scoreProgress: number;
    evaluationNotes?: string;
  }
) {
  if (!isAdminEmail(adminEmail) && adminEmail !== ADMIN_KEY) {
    return { success: false, error: "Unauthorized access: Admin privileges required to evaluate participants." };
  }

  try {
    const inn = Number((Math.max(0, Math.min(10, parseFloat(String(evaluation.scoreInnovation)) || 0))).toFixed(2));
    const und = Number((Math.max(0, Math.min(10, parseFloat(String(evaluation.scoreUnderstanding)) || 0))).toFixed(2));
    const pro = Number((Math.max(0, Math.min(10, parseFloat(String(evaluation.scoreProgress)) || 0))).toFixed(2));
    const scoreTotal = Number((inn + und + pro).toFixed(2));

    const updated = await prisma.team.update({
      where: { id: teamId },
      data: {
        scoreInnovation: inn,
        scoreUnderstanding: und,
        scoreProgress: pro,
        scoreTotal,
        evaluatedBy: adminEmail,
        evaluationNotes: evaluation.evaluationNotes?.trim() || "",
        evaluatedAt: new Date(),
      },
    });

    return {
      success: true,
      teamId,
      scoreTotal,
      evaluatedBy: adminEmail,
      evaluatedAt: updated.evaluatedAt?.toISOString(),
    };
  } catch (error) {
    console.error("saveTeamEvaluation error:", error);
    return { success: false, error: "Failed to save team evaluation marks." };
  }
}
