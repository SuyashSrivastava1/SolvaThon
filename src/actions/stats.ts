"use server";

import prisma from "@/lib/prisma";

export async function getParticipantCount(): Promise<number> {
  try {
    const count = await prisma.participant.count();
    return count < 100 ? 100 : count;
  } catch {
    return 100;
  }
}
