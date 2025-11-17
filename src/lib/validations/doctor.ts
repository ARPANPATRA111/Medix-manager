import { z } from "zod";

export const doctorSchema = z.object({
  // User information
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  
  // Doctor-specific information
  licenseNumber: z.string().min(5, "License number must be at least 5 characters"),
  specialization: z.string().min(2, "Specialization is required"),
  qualification: z.string().min(2, "Qualification is required"),
  experience: z.number().min(0, "Experience cannot be negative"),
  consultationFee: z.number().min(0, "Consultation fee cannot be negative"),
  availableFrom: z.string().min(1, "Available from time is required"),
  availableTo: z.string().min(1, "Available to time is required"),
  department: z.string().min(2, "Department is required"),
  maxPatientsPerDay: z.number().min(1, "Must accept at least 1 patient per day"),
  phone: z.string().optional(),
  doctorEmail: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  workingDays: z.array(z.number().min(0).max(6)).optional(),
});

export type DoctorForm = z.infer<typeof doctorSchema>;