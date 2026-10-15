"use server";

import prisma from "@/lib/prisma";

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
      data: { name: teamName, teamCode: newTeamCode, leaderId: participant.id },
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
  let lastError: any = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const participant = await prisma.participant.findUnique({
        where: { firebaseUid },
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
          finalDocUrl: participant.team.finalDocUrl,
          finalRepoUrl: participant.team.finalRepoUrl,
          finalDemoUrl: participant.team.finalDemoUrl,
          finalSummary: participant.team.finalSummary,
          finalSubmittedAt: participant.team.finalSubmittedAt,
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
    const participant = await prisma.participant.findUnique({
      where: { firebaseUid },
      include: { team: { include: { participants: { orderBy: { registrationTime: "asc" } } } } }
    });
    if (!participant || !participant.team) {
      return { success: false, error: "You must be in a team to choose a problem statement." };
    }

    const leader = getTeamLeader(participant.team);
    if (leader && leader.id !== participant.id && leader.firebaseUid !== participant.firebaseUid) {
      return { success: false, error: `Only the team leader (${leader.fullName}) can select the problem statement.` };
    }

    await prisma.team.update({
      where: { id: participant.team.id },
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
    const participant = await prisma.participant.findUnique({
      where: { firebaseUid },
      include: { team: { include: { participants: { orderBy: { registrationTime: "asc" } } } } }
    });
    if (!participant || !participant.team) {
      return { success: false, error: "You must be in a team to submit." };
    }

    const leader = getTeamLeader(participant.team);
    if (leader && leader.id !== participant.id && leader.firebaseUid !== participant.firebaseUid) {
      return { success: false, error: `Only the team leader (${leader.fullName}) can submit the presentation.` };
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
      where: { id: participant.team.id },
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
    const participant = await prisma.participant.findUnique({
      where: { firebaseUid },
      include: { team: { include: { participants: { orderBy: { registrationTime: "asc" } } } } }
    });
    if (!participant || !participant.team) {
      return { success: false, error: "You must be in a team to submit the final project." };
    }

    const leader = getTeamLeader(participant.team);
    if (leader && leader.id !== participant.id && leader.firebaseUid !== participant.firebaseUid) {
      return { success: false, error: `Only the team leader (${leader.fullName}) can submit the final project deliverable.` };
    }

    if (!data.finalDocUrl || (!data.finalDocUrl.startsWith("http://") && !data.finalDocUrl.startsWith("https://"))) {
      return { success: false, error: "Please provide a valid document link (Google Docs, Drive, PDF URL, Notion)." };
    }

    await prisma.team.update({
      where: { id: participant.team.id },
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
    const leaderParticipant = await prisma.participant.findUnique({
      where: { firebaseUid: leaderFirebaseUid },
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
    const participant = await prisma.participant.findUnique({
      where: { firebaseUid },
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

    if (!isLeader) {
      // Normal member leaving
      await prisma.participant.update({
        where: { id: participant.id },
        data: { teamId: null }
      });
      return { success: true, message: `You have successfully left team ${team.name}.` };
    }

    // Leader is leaving
    if (otherMembers.length > 0) {
      // Randomly allocate a new team leader from remaining members
      const randomIndex = Math.floor(Math.random() * otherMembers.length);
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

      return {
        success: true,
        message: `You have left the team. Leadership has been randomly assigned to ${newLeader.fullName}.`
      };
    } else {
      // Leader is the sole member: unassign participant, delete evaluations and team
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

      return {
        success: true,
        message: `You were the sole member of ${team.name}. The team has been disbanded.`
      };
    }
  } catch (error: any) {
    console.error("leaveTeam error:", error);
    return { success: false, error: "Failed to leave the team: " + (error?.message || "Unknown error") };
  }
}

