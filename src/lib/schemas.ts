import { z } from "zod";

export const registrationSchema = z.object({
  firebaseUid: z.string().min(1, "User ID is required"),
  emailId: z.string().email("Must be a valid email").endsWith("@vitstudent.ac.in", "Must be a VIT student email"),
  fullName: z.string().min(2, "Name is too short"),
  mobileNumber: z.string().regex(/^\d{10}$/, "Mobile number must be exactly 10 digits"),
  hostelBlock: z.string().min(1, "Block is required"),
  roomNumber: z.string().min(1, "Room number is required"),
  messCaterer: z.string().min(1, "Caterer is required"),
  messType: z.string().min(1, "Mess type is required"),
  consentAgreed: z.boolean().refine(val => val === true, "You must agree to the rules"),
});
