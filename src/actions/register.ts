"use server";

import prisma from "@/lib/prisma";
import { registrationSchema } from "@/lib/schemas";
import { z } from "zod";
import { randomBytes } from "crypto";
import { checkRateLimit } from "@/lib/rateLimit";
import { getAuthenticatedUser } from "@/lib/firebase/admin";
import { headers } from "next/headers";

function generateSecureTicketId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  const bytes = randomBytes(6);
  for (let i = 0; i < 6; i++) {
    suffix += chars[bytes[i] % chars.length];
  }
  return `TKT-${suffix}`;
}

export async function registerParticipant(data: z.infer<typeof registrationSchema>) {
  try {
    // 1. Rate Limiting Check (MED-03)
    let clientIp = "unknown-ip";
    try {
      const headerList = await headers();
      clientIp = headerList.get("cf-connecting-ip") || headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown-ip";
    } catch {}

    const rateKey = `reg_${clientIp}_${data.firebaseUid || ""}`;
    const rateCheck = checkRateLimit(rateKey, 5, 60000); // 5 attempts per minute
    if (!rateCheck.allowed) {
      return {
        success: false,
        error: "Too many registration attempts. Please wait 1 minute before trying again.",
      };
    }

    // 2. Cryptographic Server-Side Auth Verification (CRIT-01)
    const authResult = await getAuthenticatedUser(data.firebaseUid);
    if (!authResult.user) {
      return {
        success: false,
        error: authResult.error || "Authentication required. Please sign in with your student Google account.",
      };
    }

    if (authResult.user.uid !== data.firebaseUid) {
      return {
        success: false,
        error: "Security validation failed: authenticated account mismatch.",
      };
    }

    // Validate email matches token
    if (authResult.user.email && data.emailId && authResult.user.email.toLowerCase() !== data.emailId.toLowerCase()) {
      return {
        success: false,
        error: "Registration email must match your verified Google account.",
      };
    }

    // 3. Schema Input Validation
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

    // 4. Cryptographically Secure Ticket ID Generation (MED-02)
    let newTicketId = "";
    let isUnique = false;
    while (!isUnique) {
      newTicketId = generateSecureTicketId();
      const existingTicket = await prisma.participant.findUnique({ where: { ticketId: newTicketId } });
      if (!existingTicket) isUnique = true;
    }

    const participant = await prisma.participant.create({
      data: { ...parsedData, ticketId: newTicketId },
    });

    return { success: true, ticketId: participant.ticketId };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || "Validation failed" };
    }
    console.error("Registration Error:", error?.message || error);
    const detail = error?.message ? `: ${error.message}` : "";
    return { success: false, error: `Something went wrong during registration${detail}` };
  }
}

export async function checkIsRegistered(firebaseUid: string) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const user = await prisma.participant.findUnique({ where: { firebaseUid } });
      // Removed PII / UID console logging (HIGH-05)
      return !!user;
    } catch (error) {
      console.error(`Check Registration Error (attempt ${attempt + 1}):`, error);
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }
  }
  return false;
}
