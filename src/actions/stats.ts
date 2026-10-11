"use server";

import prisma from "@/lib/prisma";

export async function getParticipantCount(): Promise<number> {
  try {
    const count = await prisma.participant.count();
    return count;
  } catch {
    return 0;
  }
}
