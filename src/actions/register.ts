"use server";

import prisma from "@/lib/prisma";
import { registrationSchema } from "@/lib/schemas";
import { z } from "zod";

export async function registerParticipant(data: z.infer<typeof registrationSchema>) {
  try {
    const parsedData = registrationSchema.parse(data);

    // Check if user already exists based on UID, email or mobile
    const existing = await prisma.participant.findFirst({
      where: {
        OR: [
          { firebaseUid: parsedData.firebaseUid },
          { emailId: parsedData.emailId },
          { mobileNumber: parsedData.mobileNumber }
        ]
      }
    });

    if (existing) {
      if (existing.emailId === parsedData.emailId) return { success: false, error: "Email is already registered." };
      if (existing.mobileNumber === parsedData.mobileNumber) return { success: false, error: "Mobile number is already registered." };
      return { success: false, error: "You are already registered." };
    }

    let newTicketId = "";
    let isUnique = false;
    while (!isUnique) {
      newTicketId = "TKT-" + Math.random().toString(36).substring(2, 8).toUpperCase().padEnd(6, 'X');
      const existingTicket = await prisma.participant.findUnique({ where: { ticketId: newTicketId } });
      if (!existingTicket) isUnique = true;
    }

    const participant = await prisma.participant.create({
      data: { ...parsedData, ticketId: newTicketId },
    });

    return { success: true, ticketId: participant.ticketId };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error("Registration Error:", error);
    return { success: false, error: "Something went wrong during registration." };
  }
}

export async function checkIsRegistered(firebaseUid: string) {
  try {
    const user = await prisma.participant.findUnique({ where: { firebaseUid } });
    return !!user;
  } catch (error) {
    console.error("Check Registration Error:", error);
    return false;
  }
}
