"use server";

import prisma from "@/lib/prisma";
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

  try {
    const [participants, teams, phaseConfig, timerConfig, pauseConfig] = await Promise.all([
      prisma.participant.findMany({
        include: {
          team: {
            select: { name: true, teamCode: true, problemStatement: true, submittedAt: true, finalSubmittedAt: true }
          }
        },
        orderBy: { registrationTime: "desc" }
      }),
      prisma.team.findMany({
        include: {
          participants: {
            select: { fullName: true, emailId: true, mobileNumber: true, hostelBlock: true, roomNumber: true, ticketId: true }
          }
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.systemConfig.findUnique({ where: { key: "submission_phase" } }),
      prisma.systemConfig.findUnique({ where: { key: "target_date" } }),
      prisma.systemConfig.findUnique({ where: { key: "timer_paused" } })
    ]);

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
        hostelBlock: p.hostelBlock,
        roomNumber: p.roomNumber,
        messCaterer: p.messCaterer,
        messType: p.messType,
        ticketId: p.ticketId,
        registrationTime: p.registrationTime.toISOString(),
        teamName: p.team?.name || "No Team",
        teamCode: p.team?.teamCode || "N/A"
      })),
      teams: teams.map((t: any) => ({
        id: t.id,
        name: t.name,
        teamCode: t.teamCode,
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
          hostelBlock: m.hostelBlock,
          roomNumber: m.roomNumber,
          ticketId: m.ticketId
        }))
      }))
    };
  } catch (error) {
    console.error("Admin Data Fetch Error:", error);
    return { success: false, error: "Failed to load admin records from database." };
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
