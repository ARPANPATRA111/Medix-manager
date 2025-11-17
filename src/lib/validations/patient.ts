import { z } from "zod"

export const patientSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  dateOfBirth: z.date(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  address: z.string().min(5, "Address must be at least 5 characters"),
  emergencyContact: z.string().min(2, "Emergency contact name is required"),
  emergencyPhone: z.string().min(10, "Emergency phone must be at least 10 characters"),
  bloodGroup: z.string().optional(),
  allergies: z.string().optional(),
})

export const patientSearchSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  searchType: z.enum(["name", "mrn", "phone", "email"]).default("name"),
})

export type PatientForm = z.infer<typeof patientSchema>
export type PatientSearch = z.infer<typeof patientSearchSchema>