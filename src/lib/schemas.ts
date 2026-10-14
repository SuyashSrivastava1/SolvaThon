import { z } from "zod";
import { isValidAuthDomain } from "@/config/admin";

export const registrationSchema = z.object({
  firebaseUid: z.string().min(1, "User ID is required"),
  emailId: z.string().email("Must be a valid email").refine(
    (val) => isValidAuthDomain(val),
    "Must be a valid @vitstudent.ac.in or @vit.ac.in email address"
  ),
  fullName: z.string().min(2, "Name is too short"),
  mobileNumber: z.string().regex(/^\d{10}$/, "Mobile number must be exactly 10 digits"),
  gender: z.enum(["Male", "Female"], {
    message: "Please select Male or Female",
  }),
  hostelBlock: z.string().min(1, "Block is required"),
  roomNumber: z.string().regex(/^\d{3,4}$/, "Enter a valid room number"),
  messCaterer: z.string().min(1, "Caterer is required"),
  messType: z.string().min(1, "Mess type is required"),
  consentAgreed: z.boolean().refine(val => val === true, "You must agree to the rules"),
});
