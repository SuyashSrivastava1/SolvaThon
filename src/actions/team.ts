"use server";

import prisma from "@/lib/prisma";

export async function createTeam(firebaseUid: string, teamName: string) {
  try {
    const participant = await prisma.participant.findUnique({ where: { firebaseUid } });
    if (!participant) return { success: false, error: "Participant not found. Please register first." };
    if (participant.teamId) return { success: false, error: "You are already in a team." };

    if (!teamName || teamName.length < 3) return { success: false, error: "Team name must be at least 3 characters." };

    const existingTeam = await prisma.team.findUnique({ where: { name: teamName } });
    if (existingTeam) return { success: false, error: "Team name already taken." };

    let newTeamCode = "";
    let isUnique = false;
    while (!isUnique) {
      newTeamCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      newTeamCode = newTeamCode.padEnd(6, 'X'); 
      const existingCode = await prisma.team.findUnique({ where: { teamCode: newTeamCode } });
      if (!existingCode) isUnique = true;
    }

    const team = await prisma.team.create({
      data: { name: teamName, teamCode: newTeamCode },
    });

    await prisma.participant.update({
      where: { id: participant.id },
      data: { teamId: team.id },
    });

    return { success: true, teamCode: team.teamCode };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to create team." };
  }
}

export async function joinTeam(firebaseUid: string, teamCode: string) {
  try {
    const participant = await prisma.participant.findUnique({ where: { firebaseUid } });
    if (!participant) return { success: false, error: "Participant not found." };
    if (participant.teamId) return { success: false, error: "You are already in a team." };

    const team = await prisma.team.findUnique({ where: { teamCode } });
    if (!team) return { success: false, error: "Invalid Team Code." };

    const memberCount = await prisma.participant.count({ where: { teamId: team.id } });
    if (memberCount >= 4) return { success: false, error: "This team has reached the maximum limit of 4 members." };

    await prisma.participant.update({
      where: { id: participant.id },
      data: { teamId: team.id },
    });

    return { success: true, teamId: team.id };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to join team." };
  }
}

export async function getTeamDetails(firebaseUid: string) {
  try {
    const [participant, phaseConfig] = await Promise.all([
      prisma.participant.findUnique({
        where: { firebaseUid },
        include: { team: { include: { participants: true } } }
      }),
      prisma.systemConfig.findUnique({ where: { key: "submission_phase" } })
    ]);
    
    if (!participant) return { success: false, error: "Participant not found." };
    
    const submissionPhase = (phaseConfig?.value as "IDEA" | "FINAL") || "IDEA";

    if (!participant.team) {
      return { 
        success: true, 
        hasTeam: false, 
        participant,
        submissionPhase
      };
    }

    return { 
      success: true, 
      hasTeam: true, 
      submissionPhase,
      team: {
        id: participant.team.id,
        name: participant.team.name,
        teamCode: participant.team.teamCode,
        problemStatement: participant.team.problemStatement,
        pptUrl: participant.team.pptUrl,
        understanding: participant.team.understanding,
        solutionSummary: participant.team.solutionSummary,
        submittedAt: participant.team.submittedAt,
        finalDocUrl: participant.team.finalDocUrl,
        finalRepoUrl: participant.team.finalRepoUrl,
        finalDemoUrl: participant.team.finalDemoUrl,
        finalSummary: participant.team.finalSummary,
        finalSubmittedAt: participant.team.finalSubmittedAt,
        members: participant.team.participants.map((p: any) => ({
          name: p.fullName,
          ticketId: p.ticketId
        }))
      },
      participant
    };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to fetch team details." };
  }
}

export async function selectProblemStatement(firebaseUid: string, problemStatement: string) {
  try {
    const participant = await prisma.participant.findUnique({ where: { firebaseUid } });
    if (!participant || !participant.teamId) {
      return { success: false, error: "You must be in a team to choose a problem statement." };
    }

    await prisma.team.update({
      where: { id: participant.teamId },
      data: { problemStatement },
    });

    return { success: true };
  } catch (error) {
    console.error("Select problem statement error:", error);
    return { success: false, error: "Failed to update problem statement." };
  }
}

export async function submitProject(
  firebaseUid: string,
  data: { pptUrl: string; understanding: string; solutionSummary: string }
) {
  try {
    const participant = await prisma.participant.findUnique({ where: { firebaseUid } });
    if (!participant || !participant.teamId) {
      return { success: false, error: "You must be in a team to submit." };
    }

    if (!data.pptUrl || (!data.pptUrl.startsWith("http://") && !data.pptUrl.startsWith("https://"))) {
      return { success: false, error: "Please provide a valid presentation link (Google Slides, Canva, Drive)." };
    }

    if (!data.understanding || data.understanding.trim().length < 10) {
      return { success: false, error: "Please provide a detailed explanation of your problem understanding." };
    }

    if (!data.solutionSummary || data.solutionSummary.trim().length < 10) {
      return { success: false, error: "Please provide a brief description of your proposed solution." };
    }

    await prisma.team.update({
      where: { id: participant.teamId },
      data: {
        pptUrl: data.pptUrl.trim(),
        understanding: data.understanding.trim(),
        solutionSummary: data.solutionSummary.trim(),
        submittedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Submit project error:", error);
    return { success: false, error: "Failed to submit presentation." };
  }
}

export async function submitFinalProject(
  firebaseUid: string,
  data: {
    finalDocUrl: string;
    finalRepoUrl?: string;
    finalDemoUrl?: string;
    finalSummary?: string;
  }
) {
  try {
    const participant = await prisma.participant.findUnique({ where: { firebaseUid } });
    if (!participant || !participant.teamId) {
      return { success: false, error: "You must be in a team to submit the final project." };
    }

    if (!data.finalDocUrl || (!data.finalDocUrl.startsWith("http://") && !data.finalDocUrl.startsWith("https://"))) {
      return { success: false, error: "Please provide a valid document link (Google Docs, Drive, PDF URL, Notion)." };
    }

    await prisma.team.update({
      where: { id: participant.teamId },
      data: {
        finalDocUrl: data.finalDocUrl.trim(),
        finalRepoUrl: data.finalRepoUrl?.trim() || null,
        finalDemoUrl: data.finalDemoUrl?.trim() || null,
        finalSummary: data.finalSummary?.trim() || null,
        finalSubmittedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Submit final project error:", error);
    return { success: false, error: "Failed to submit final project deliverable." };
  }
}

export async function getSystemSettings() {
  try {
    const [phaseConfig, timerConfig, pauseConfig] = await Promise.all([
      prisma.systemConfig.findUnique({ where: { key: "submission_phase" } }),
      prisma.systemConfig.findUnique({ where: { key: "target_date" } }),
      prisma.systemConfig.findUnique({ where: { key: "timer_paused" } }),
    ]);

    return {
      success: true,
      submissionPhase: (phaseConfig?.value as "IDEA" | "FINAL") || "IDEA",
      targetDate: timerConfig?.value || "2026-12-01T23:59:59+05:30",
      isPaused: pauseConfig?.value === "true",
    };
  } catch (error) {
    console.error("getSystemSettings error:", error);
    return {
      success: true,
      submissionPhase: "IDEA" as const,
      targetDate: "2026-12-01T23:59:59+05:30",
      isPaused: false,
    };
  }
}
