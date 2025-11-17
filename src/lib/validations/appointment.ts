import { z } from "zod";

export const appointmentSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  doctorId: z.string().min(1, "Doctor is required"),
  appointmentDate: z.date({
    message: "Appointment date is required",
  }),
  appointmentTime: z.string().min(1, "Appointment time is required"),
  duration: z.number().min(15).max(240).default(30),
  reason: z.string().min(1, "Reason for appointment is required"),
  notes: z.string().optional(),
});

export const rescheduleAppointmentSchema = z.object({
  appointmentId: z.string().min(1, "Appointment ID is required"),
  doctorId: z.string().min(1, "Doctor ID is required"), 
  newDate: z.date({
    message: "New appointment date is required",
  }),
  newTime: z.string().min(1, "New appointment time is required"),
  reason: z.string().optional(),
  duration: z.number().min(15).max(240).default(30),
});

export const appointmentSearchSchema = z.object({
  patientId: z.string().optional(),
  doctorId: z.string().optional(),
  status: z.enum(["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
  date: z.date().optional(),
});

export const doctorScheduleSchema = z.object({
  doctorId: z.string().min(1, "Doctor ID is required"),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  isActive: z.boolean().default(true),
});

export const appointmentAvailabilitySchema = z.object({
  doctorId: z.string().min(1, "Doctor ID is required"),
  date: z.date({
    message: "Date is required",
  }),
  duration: z.number().min(15).max(240).default(30),
});

export type AppointmentFormData = z.infer<typeof appointmentSchema>;
export type RescheduleAppointmentData = z.infer<typeof rescheduleAppointmentSchema>;
export type AppointmentSearchData = z.infer<typeof appointmentSearchSchema>;
export type DoctorScheduleData = z.infer<typeof doctorScheduleSchema>;
export type AppointmentAvailabilityData = z.infer<typeof appointmentAvailabilitySchema>;