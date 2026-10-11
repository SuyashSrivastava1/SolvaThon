"use server";

import prisma from "@/lib/prisma";

const ADMIN_KEY = process.env.ADMIN_ACCESS_KEY || "warden_cyft_2025";

export async function verifyAdminAccess(key: string) {
  return key.trim() === ADMIN_KEY;
}

export async function getAdminData(key: string) {
  if (key.trim() !== ADMIN_KEY) {
    return { success: false, error: "Unauthorized access. Invalid Admin Access Key." };
  }

  try {
    const [participants, teams] = await Promise.all([
      prisma.participant.findMany({
        include: {
          team: {
            select: { name: true, teamCode: true, problemStatement: true, submittedAt: true }
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
      })
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

    const submissionsCount = teams.filter((t: any) => !!t.pptUrl).length;

    return {
      success: true,
      stats: {
        totalParticipants: participants.length,
        totalTeams: teams.length,
        fullTeams: teams.filter((t: any) => t.participants.length >= 4).length,
        submissionsCount,
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
