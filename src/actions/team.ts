"use server";

import prisma from "@/lib/prisma";
import { randomBytes, randomInt } from "crypto";
import { getAuthenticatedUser } from "@/lib/firebase/admin";
import { checkRateLimit } from "@/lib/rateLimit";
import { validatePresentationUrl, validateDeliverableUrl } from "@/lib/urlValidator";

function generateSecureTeamCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const bytes = randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

function getTeamLeader(team: any) {
  if (!team || !team.participants || team.participants.length === 0) return null;
  if (team.leaderId) {
    const found = team.participants.find(
      (p: any) => p.id === team.leaderId || p.firebaseUid === team.leaderId
    );
    if (found) return found;
  }
  return team.participants[0];
}

function normalizeTeamName(name: string): string {
  return (name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export async function cleanupEmptyTeams() {
  try {
    const emptyTeams = await prisma.team.findMany({
      where: {
        participants: { none: {} }
      },
      select: { id: true }
    });
    for (const t of emptyTeams) {
      await prisma.teamEvaluation.deleteMany({ where: { teamId: t.id } });
      await prisma.team.delete({ where: { id: t.id } });
    }
  } catch (e) {
    console.error("cleanupEmptyTeams error:", e);
  }
}

export async function createTeam(firebaseUid: string, teamName: string) {
  try {
    // 1. Server-Side Identity Verification (CRIT-01)
    const authResult = await getAuthenticatedUser(firebaseUid);
    if (!authResult.user) {
      return { success: false, error: authResult.error || "Authentication required. Please log in." };
    }
    const verifiedUid = authResult.user.uid;

    // 2. Rate Limiting (MED-03)
    const rateCheck = checkRateLimit(`team_create_${verifiedUid}`, 5, 60000);
    if (!rateCheck.allowed) {
      return { success: false, error: "Too many team creation attempts. Please wait a minute." };
    }

    const participant = await prisma.participant.findUnique({ where: { firebaseUid: verifiedUid } });
    if (!participant) return { success: false, error: "Participant not found. Please register first." };
    if (participant.teamId) return { success: false, error: "You are already in a team." };

    const trimmed = (teamName || "").trim();
    if (!trimmed || trimmed.length < 3 || trimmed.length > 50) {
      return { success: false, error: "Team name must be between 3 and 50 characters." };
    }

    const normalizedInput = normalizeTeamName(trimmed);
    if (normalizedInput.length < 2) {
      return { success: false, error: "Team name must contain at least 2 alphanumeric characters." };
    }

    // Check all existing teams by normalized name (ignoring casing, underscores, hyphens, spaces, and all special characters)
    const existingTeams = await prisma.team.findMany({ select: { id: true, name: true } });
    const duplicate = existingTeams.find((t: any) => normalizeTeamName(t.name) === normalizedInput);
    if (duplicate) {
      return { success: false, error: "Team name is already taken. Please choose a different name." };
    }

    // 3. Cryptographically Secure Random Team Code (MED-02)
    let newTeamCode = "";
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      attempts++;
      newTeamCode = generateSecureTeamCode();
      const existingCode = await prisma.team.findUnique({ where: { teamCode: newTeamCode } });
      if (!existingCode) isUnique = true;
    }

    const team = await prisma.team.create({
      data: { name: trimmed, teamCode: newTeamCode, leaderId: participant.id },
    });

    await prisma.participant.update({
      where: { id: participant.id },
      data: { teamId: team.id },
    });

    return { success: true, teamCode: team.teamCode };
  } catch (error) {
    console.error("createTeam error:", error);
    return { success: false, error: "Failed to create team." };
  }
}

export async function joinTeam(firebaseUid: string, teamCode: string) {
  try {
    // 1. Server-Side Identity Verification (CRIT-01)
    const authResult = await getAuthenticatedUser(firebaseUid);
    if (!authResult.user) {
      return { success: false, error: authResult.error || "Authentication required. Please log in." };
    }
    const verifiedUid = authResult.user.uid;

    // 2. Rate Limiting to prevent brute-forcing team codes (MED-03)
    const rateCheck = checkRateLimit(`team_join_${verifiedUid}`, 8, 60000);
    if (!rateCheck.allowed) {
      return { success: false, error: "Too many team join attempts. Please wait a minute." };
    }

    const cleanCode = teamCode?.trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 5 || cleanCode.length > 8) {
      return { success: false, error: "Invalid Team Code format." };
    }

    const participant = await prisma.participant.findUnique({ where: { firebaseUid: verifiedUid } });
    if (!participant) return { success: false, error: "Participant not found." };
    if (participant.teamId) return { success: false, error: "You are already in a team." };

    const team = await prisma.team.findUnique({ where: { teamCode: cleanCode } });
    if (!team) return { success: false, error: "Invalid Team Code." };

    const memberCount = await prisma.participant.count({ where: { teamId: team.id } });
    if (memberCount >= 4) return { success: false, error: "This team has reached the maximum limit of 4 members." };

    await prisma.participant.update({
      where: { id: participant.id },
      data: { teamId: team.id },
    });

    return { success: true, teamId: team.id };
  } catch (error) {
    console.error("joinTeam error:", error);
    return { success: false, error: "Failed to join team." };
  }
}

export async function getTeamDetails(firebaseUid: string) {
  // 1. Server-Side Identity Verification (CRIT-01)
  const authResult = await getAuthenticatedUser(firebaseUid);
  if (!authResult.user) {
    return { success: false, error: authResult.error || "Authentication required." };
  }
  const verifiedUid = authResult.user.uid;

  let lastError: any = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const participant = await prisma.participant.findUnique({
        where: { firebaseUid: verifiedUid },
        include: {
          team: {
            include: {
              participants: {
                orderBy: { registrationTime: "asc" }
              }
            }
          }
        }
      });
      const phaseConfig = await prisma.systemConfig.findUnique({ where: { key: "submission_phase" } }).catch(() => null);
      
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

      const leader = getTeamLeader(participant.team);
      const isLeader = !!leader && (leader.id === participant.id || leader.firebaseUid === participant.firebaseUid);

      return { 
        success: true, 
        hasTeam: true, 
        submissionPhase,
        isLeader,
        leaderName: leader?.fullName || "Team Leader",
        team: {
          id: participant.team.id,
          name: participant.team.name,
          teamCode: participant.team.teamCode,
          leaderId: participant.team.leaderId,
          problemStatement: participant.team.problemStatement,
          pptUrl: participant.team.pptUrl,
          understanding: participant.team.understanding,
          solutionSummary: participant.team.solutionSummary,
          submittedAt: participant.team.submittedAt,
          phase1Unlocked: participant.team.phase1Unlocked || false,
          isPhase1Locked: Boolean(participant.team.submittedAt && !participant.team.phase1Unlocked),
          finalDocUrl: participant.team.finalDocUrl,
          finalRepoUrl: participant.team.finalRepoUrl,
          finalDemoUrl: participant.team.finalDemoUrl,
          finalSummary: participant.team.finalSummary,
          finalSubmittedAt: participant.team.finalSubmittedAt,
          phase2Unlocked: participant.team.phase2Unlocked || false,
          isPhase2Locked: Boolean(participant.team.finalSubmittedAt && !participant.team.phase2Unlocked),
          members: participant.team.participants.map((p: any) => ({
            id: p.id,
            name: p.fullName,
            ticketId: p.ticketId,
            isLeader: !!leader && (p.id === leader.id || p.firebaseUid === leader.firebaseUid)
          }))
        },
        participant
      };
    } catch (error: any) {
      lastError = error;
      console.error(`getTeamDetails attempt ${attempt + 1} error:`, error);
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }
  }
  return { success: false, error: "Failed to fetch team details: " + (lastError?.message || "connection error") };
}

export async function selectProblemStatement(firebaseUid: string, problemStatement: string) {
  try {
    // 1. Server-Side Identity Verification (CRIT-01)
    const authResult = await getAuthenticatedUser(firebaseUid);
    if (!authResult.user) {
      return { success: false, error: authResult.error || "Authentication required." };
    }
    const verifiedUid = authResult.user.uid;

    const participant = await prisma.participant.findUnique({
      where: { firebaseUid: verifiedUid },
      include: { team: { include: { participants: { orderBy: { registrationTime: "asc" } } } } }
    });
    if (!participant || !participant.team) {
      return { success: false, error: "You must be in a team to choose a problem statement." };
    }

    const leader = getTeamLeader(participant.team);
    if (leader && leader.id !== participant.id && leader.firebaseUid !== participant.firebaseUid) {
      return { success: false, error: `Only the team leader (${leader.fullName}) can select the problem statement.` };
    }

    const isLocked = Boolean(participant.team.submittedAt && !participant.team.phase1Unlocked);
    if (isLocked) {
      return {
        success: false,
        error: "Problem statement track is locked because your team has already submitted Phase 1. Only a Super Admin can unlock your team's submission."
      };
    }

    const cleanStatement = problemStatement?.trim();
    if (!cleanStatement || cleanStatement.length < 3 || cleanStatement.length > 200) {
      return { success: false, error: "Please choose a valid problem statement track." };
    }

    await prisma.team.update({
      where: { id: participant.team.id },
      data: { problemStatement: cleanStatement },
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
    // 1. Server-Side Identity Verification (CRIT-01)
    const authResult = await getAuthenticatedUser(firebaseUid);
    if (!authResult.user) {
      return { success: false, error: authResult.error || "Authentication required." };
    }
    const verifiedUid = authResult.user.uid;

    // Rate Limiting (MED-03)
    const rateCheck = checkRateLimit(`submit_${verifiedUid}`, 10, 60000);
    if (!rateCheck.allowed) {
      return { success: false, error: "Too many submission attempts. Please wait a minute." };
    }

    const participant = await prisma.participant.findUnique({
      where: { firebaseUid: verifiedUid },
      include: { team: { include: { participants: { orderBy: { registrationTime: "asc" } } } } }
    });
    if (!participant || !participant.team) {
      return { success: false, error: "You must be in a team to submit." };
    }

    const leader = getTeamLeader(participant.team);
    if (leader && leader.id !== participant.id && leader.firebaseUid !== participant.firebaseUid) {
      return { success: false, error: `Only the team leader (${leader.fullName}) can submit the presentation.` };
    }

    // Check if submission is already locked (team submitted and not unlocked by Super Admin)
    const isLocked = Boolean(participant.team.submittedAt && !participant.team.phase1Unlocked);
    if (isLocked) {
      return {
        success: false,
        error: "Idea submission is locked. Once submitted, changes cannot be undone. Only a Super Admin can unlock your team's submission."
      };
    }

    // 2. Strict URL Validation & Domain Allowlist (MED-01)
    const urlValidation = validatePresentationUrl(data.pptUrl);
    if (!urlValidation.valid) {
      return { success: false, error: urlValidation.error || "Invalid presentation link." };
    }

    if (!data.understanding || data.understanding.trim().length < 10 || data.understanding.trim().length > 3000) {
      return { success: false, error: "Please provide a detailed explanation of your problem understanding (10-3000 characters)." };
    }

    if (!data.solutionSummary || data.solutionSummary.trim().length < 10 || data.solutionSummary.trim().length > 3000) {
      return { success: false, error: "Please provide a brief description of your proposed solution (10-3000 characters)." };
    }

    await prisma.team.update({
      where: { id: participant.team.id },
      data: {
        pptUrl: data.pptUrl.trim(),
        understanding: data.understanding.trim(),
        solutionSummary: data.solutionSummary.trim(),
        submittedAt: new Date(),
        phase1Unlocked: false, // Automatically re-locks after submission!
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
    // 1. Server-Side Identity Verification (CRIT-01)
    const authResult = await getAuthenticatedUser(firebaseUid);
    if (!authResult.user) {
      return { success: false, error: authResult.error || "Authentication required." };
    }
    const verifiedUid = authResult.user.uid;

    // Rate Limiting (MED-03)
    const rateCheck = checkRateLimit(`submit_final_${verifiedUid}`, 10, 60000);
    if (!rateCheck.allowed) {
      return { success: false, error: "Too many submission attempts. Please wait a minute." };
    }

    const participant = await prisma.participant.findUnique({
      where: { firebaseUid: verifiedUid },
      include: { team: { include: { participants: { orderBy: { registrationTime: "asc" } } } } }
    });
    if (!participant || !participant.team) {
      return { success: false, error: "You must be in a team to submit the final project." };
    }

    const leader = getTeamLeader(participant.team);
    if (leader && leader.id !== participant.id && leader.firebaseUid !== participant.firebaseUid) {
      return { success: false, error: `Only the team leader (${leader.fullName}) can submit the final project deliverable.` };
    }

    // Check if final submission is already locked (team submitted and not unlocked by Super Admin)
    const isLocked = Boolean(participant.team.finalSubmittedAt && !participant.team.phase2Unlocked);
    if (isLocked) {
      return {
        success: false,
        error: "Final project submission is locked. Once submitted, changes cannot be undone. Only a Super Admin can unlock your team's submission."
      };
    }

    // 2. Strict URL Validations (MED-01)
    const docValidation = validateDeliverableUrl(data.finalDocUrl, "Final Document");
    if (!docValidation.valid) {
      return { success: false, error: docValidation.error || "Invalid document link." };
    }

    if (data.finalRepoUrl && data.finalRepoUrl.trim()) {
      const repoValidation = validateDeliverableUrl(data.finalRepoUrl, "Repository");
      if (!repoValidation.valid) {
        return { success: false, error: repoValidation.error };
      }
    }

    if (data.finalDemoUrl && data.finalDemoUrl.trim()) {
      const demoValidation = validateDeliverableUrl(data.finalDemoUrl, "Demo Video");
      if (!demoValidation.valid) {
        return { success: false, error: demoValidation.error };
      }
    }

    await prisma.team.update({
      where: { id: participant.team.id },
      data: {
        finalDocUrl: data.finalDocUrl.trim(),
        finalRepoUrl: data.finalRepoUrl?.trim() || null,
        finalDemoUrl: data.finalDemoUrl?.trim() || null,
        finalSummary: data.finalSummary?.trim() || null,
        finalSubmittedAt: new Date(),
        phase2Unlocked: false, // Automatically re-locks after submission!
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
      targetDate: timerConfig?.value || "2026-12-10T23:59:59+05:30",
      isPaused: pauseConfig?.value === "true",
    };
  } catch (error) {
    console.error("getSystemSettings error:", error);
    return {
      success: true,
      submissionPhase: "IDEA" as const,
      targetDate: "2026-12-10T23:59:59+05:30",
      isPaused: false,
    };
  }
}

export async function kickTeamMember(leaderFirebaseUid: string, targetParticipantId: string) {
  try {
    // 1. Server-Side Identity Verification (CRIT-01)
    const authResult = await getAuthenticatedUser(leaderFirebaseUid);
    if (!authResult.user) {
      return { success: false, error: authResult.error || "Authentication required." };
    }
    const verifiedUid = authResult.user.uid;

    const leaderParticipant = await prisma.participant.findUnique({
      where: { firebaseUid: verifiedUid },
      include: {
        team: {
          include: {
            participants: { orderBy: { registrationTime: "asc" } }
          }
        }
      }
    });

    if (!leaderParticipant || !leaderParticipant.team) {
      return { success: false, error: "You are not currently in a team." };
    }

    const leader = getTeamLeader(leaderParticipant.team);
    const isLeader = !!leader && (leader.id === leaderParticipant.id || leader.firebaseUid === leaderParticipant.firebaseUid);

    if (!isLeader) {
      return { success: false, error: "Only the team leader can kick members out of the team." };
    }

    if (targetParticipantId === leaderParticipant.id) {
      return { success: false, error: "The team leader cannot kick themselves. Use 'Leave Team' instead." };
    }

    const targetMember = leaderParticipant.team.participants.find((p: any) => p.id === targetParticipantId);
    if (!targetMember) {
      return { success: false, error: "Participant is not a member of your team." };
    }

    await prisma.participant.update({
      where: { id: targetParticipantId },
      data: { teamId: null }
    });

    return { success: true, message: `${targetMember.fullName} has been removed from the team.` };
  } catch (error: any) {
    console.error("kickTeamMember error:", error);
    return { success: false, error: "Failed to remove team member." };
  }
}

export async function leaveTeam(firebaseUid: string) {
  try {
    // 1. Server-Side Identity Verification (CRIT-01)
    const authResult = await getAuthenticatedUser(firebaseUid);
    if (!authResult.user) {
      return { success: false, error: authResult.error || "Authentication required." };
    }
    const verifiedUid = authResult.user.uid;

    const participant = await prisma.participant.findUnique({
      where: { firebaseUid: verifiedUid },
      include: {
        team: {
          include: {
            participants: { orderBy: { registrationTime: "asc" } }
          }
        }
      }
    });

    if (!participant || !participant.team) {
      return { success: false, error: "You are not currently in a team." };
    }

    const team = participant.team;
    const leader = getTeamLeader(team);
    const isLeader = !!leader && (leader.id === participant.id || leader.firebaseUid === participant.firebaseUid);

    const otherMembers = team.participants.filter((p: any) => p.id !== participant.id);

    // If NO other person is there in the team (whether current person is leader or sole member)
    if (otherMembers.length === 0) {
      await prisma.participant.update({
        where: { id: participant.id },
        data: { teamId: null }
      });
      await prisma.teamEvaluation.deleteMany({
        where: { teamId: team.id }
      });
      await prisma.team.delete({
        where: { id: team.id }
      });
      await cleanupEmptyTeams();

      return {
        success: true,
        message: `You have left ${team.name}. As no other members remained, the team has been removed.`
      };
    }

    if (!isLeader) {
      // Normal member leaving while other members remain
      await prisma.participant.update({
        where: { id: participant.id },
        data: { teamId: null }
      });
      await cleanupEmptyTeams();
      return { success: true, message: `You have successfully left team ${team.name}.` };
    }

    // Leader is leaving and other members exist: randomly assign a new leader (CSPRNG, MED-02)
    const randomIndex = randomInt(0, otherMembers.length);
    const newLeader = otherMembers[randomIndex];

    await prisma.$transaction([
      prisma.team.update({
        where: { id: team.id },
        data: { leaderId: newLeader.id }
      }),
      prisma.participant.update({
        where: { id: participant.id },
        data: { teamId: null }
      })
    ]);
    await cleanupEmptyTeams();

    return {
      success: true,
      message: `You have left the team. Leadership has been randomly assigned to ${newLeader.fullName}.`
    };
  } catch (error: any) {
    console.error("leaveTeam error:", error);
    return { success: false, error: "Failed to leave the team: " + (error?.message || "Unknown error") };
  }
}
