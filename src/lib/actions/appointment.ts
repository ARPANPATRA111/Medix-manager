"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { AppointmentStatus } from "@prisma/client";
import { 
  appointmentSchema, 
  rescheduleAppointmentSchema,
  type AppointmentFormData,
  type RescheduleAppointmentData
} from "@/lib/validations/appointment";
import { parse, format, isAfter, isBefore, addMinutes } from "date-fns";
import { revalidatePath } from "next/cache";

// Helper function to get doctor's schedule for a date
async function getDoctorSchedule(doctorId: string, date: Date) {
  // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayOfWeek = date.getDay();
  
  return await db.doctorSchedule.findFirst({
    where: {
      doctorId,
      dayOfWeek,
      isActive: true
    }
  });
}

// Helper function to check appointment conflicts
async function checkTimeConflicts(
  doctorId: string, 
  appointmentDate: Date, 
  appointmentTime: string, 
  duration: number, 
  excludeAppointmentId?: string
) {
  const existingAppointments = await db.appointment.findMany({
    where: {
      doctorId,
      appointmentDate,
      status: {
        not: "CANCELLED"
      },
      ...(excludeAppointmentId && { id: { not: excludeAppointmentId } })
    }
  });

  if (existingAppointments.length === 0) {
    return false;
  }

  const newStart = parse(appointmentTime, "HH:mm", appointmentDate);
  const newEnd = addMinutes(newStart, duration);

  for (const existing of existingAppointments) {
    const existingStart = parse(existing.appointmentTime, "HH:mm", appointmentDate);
    const existingEnd = addMinutes(existingStart, existing.duration);

    // Check if appointments overlap
    if (
      (newStart < existingEnd && newEnd > existingStart)
    ) {
      return true;
    }
  }

  return false;
}

export async function createAppointment(data: AppointmentFormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: "Unauthorized"
      };
    }

    const validatedData = appointmentSchema.parse(data);

    // Check if doctor is available at that time
    const schedule = await getDoctorSchedule(validatedData.doctorId, validatedData.appointmentDate);
    
    if (!schedule) {
      return {
        success: false,
        error: "Doctor is not available on this day"
      };
    }

    // Check if appointment time is within doctor's working hours
    const appointmentStart = parse(validatedData.appointmentTime, "HH:mm", validatedData.appointmentDate);
    const appointmentEnd = addMinutes(appointmentStart, validatedData.duration);
    const workStart = parse(schedule.startTime, "HH:mm", validatedData.appointmentDate);
    const workEnd = parse(schedule.endTime, "HH:mm", validatedData.appointmentDate);

    if (isBefore(appointmentStart, workStart) || isAfter(appointmentEnd, workEnd)) {
      return {
        success: false,
        error: `Appointment time must be between ${schedule.startTime} and ${schedule.endTime}`
      };
    }

    // Check for time conflicts with other appointments
    const hasConflict = await checkTimeConflicts(
      validatedData.doctorId,
      validatedData.appointmentDate,
      validatedData.appointmentTime,
      validatedData.duration
    );

    if (hasConflict) {
      return {
        success: false,
        error: "This time slot conflicts with another appointment"
      };
    }

    // Get doctor's consultation fee
    const doctor = await db.doctor.findUnique({
      where: { id: validatedData.doctorId },
      select: { consultationFee: true }
    });

    // Create the appointment and billing in transaction
    const appointment = await db.$transaction(async (tx) => {
      const newAppointment = await tx.appointment.create({
        data: {
          patientId: validatedData.patientId,
          doctorId: validatedData.doctorId,
          appointmentDate: validatedData.appointmentDate,
          appointmentTime: validatedData.appointmentTime,
          duration: validatedData.duration,
          reason: validatedData.reason,
          notes: validatedData.notes,
          fee: doctor?.consultationFee || 0,
          status: "SCHEDULED"
        },
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
              mrn: true,
              phoneNumber: true
            }
          },
          doctor: {
            select: {
              specialization: true,
              user: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      });

      // Add to patient billing if fee > 0
      if (newAppointment.fee > 0) {
        await tx.patientBilling.create({
          data: {
            patientId: validatedData.patientId,
            description: `Consultation - Dr. ${newAppointment.doctor.user.name}`,
            chargeType: "APPOINTMENT",
            amount: newAppointment.fee,
            isPaid: false,
            relatedId: newAppointment.id,
          }
        });
      }

      return newAppointment;
    });

    // Log the activity (non-blocking)
    try {
      await db.activityLog.create({
        data: {
          userId: session.user.id!,
          module: "APPOINTMENT",
          action: "CREATE",
          recordId: appointment.id,
          description: `Created appointment for ${appointment.patient.firstName} ${appointment.patient.lastName} with Dr. ${appointment.doctor.user.name}`,
        }
      });
    } catch (error) {
      console.error("Error logging activity:", error);
    }

    revalidatePath("/dashboard/appointments");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/billing");

    return {
      success: true,
      data: appointment
    };
  } catch (error) {
    console.error("Error creating appointment:", error);
    return {
      success: false,
      error: "Failed to create appointment"
    };
  }
}

export async function updateAppointmentStatus(appointmentId: string, status: AppointmentStatus) {
  try {
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: "Unauthorized"
      };
    }

    const appointment = await db.appointment.update({
      where: { id: appointmentId },
      data: { status },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Log the activity (non-blocking)
    try {
      await db.activityLog.create({
        data: {
          userId: session.user.id!,
          module: "APPOINTMENT",
          action: "UPDATE",
          recordId: appointment.id,
          description: `Updated appointment status to ${status} for ${appointment.patient.firstName} ${appointment.patient.lastName}`,
        }
      });
    } catch (error) {
      console.error("Error logging activity:", error);
    }

    revalidatePath("/dashboard/appointments");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: appointment
    };
  } catch (error) {
    console.error("Error updating appointment status:", error);
    return {
      success: false,
      error: "Failed to update appointment status"
    };
  }
}

export async function getTodayAppointments() {
  try {
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: "Unauthorized"
      };
    }

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const appointments = await db.appointment.findMany({
      where: {
        appointmentDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            mrn: true,
            phoneNumber: true
          }
        },
        doctor: {
          select: {
            specialization: true,
            user: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        appointmentTime: 'asc'
      }
    });

    return {
      success: true,
      data: appointments
    };
  } catch (error) {
    console.error("Error fetching today's appointments:", error);
    return {
      success: false,
      error: "Failed to fetch today's appointments"
    };
  }
}

export async function rescheduleAppointment(data: RescheduleAppointmentData) {
  try {
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: "Unauthorized"
      };
    }

    const validatedData = rescheduleAppointmentSchema.parse(data);

    // Check for time conflicts
    const hasConflict = await checkTimeConflicts(
      validatedData.doctorId,
      validatedData.newDate,
      validatedData.newTime,
      validatedData.duration || 30,
      validatedData.appointmentId
    );

    if (hasConflict) {
      return {
        success: false,
        error: "The new time slot conflicts with another appointment"
      };
    }

    // Get existing appointment for logging
    const existingAppointment = await db.appointment.findUnique({
      where: { id: validatedData.appointmentId },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!existingAppointment) {
      return {
        success: false,
        error: "Appointment not found"
      };
    }

    // Update the appointment
    const appointment = await db.appointment.update({
      where: { id: validatedData.appointmentId },
      data: {
        appointmentDate: validatedData.newDate,
        appointmentTime: validatedData.newTime,
        ...(validatedData.reason && { reason: validatedData.reason })
      }
    });

    // Log the activity (non-blocking)
    try {
      await db.activityLog.create({
        data: {
          userId: session.user.id!,
          module: "APPOINTMENT",
          action: "UPDATE",
          recordId: appointment.id,
          description: `Rescheduled appointment for ${existingAppointment.patient.firstName} ${existingAppointment.patient.lastName} to ${format(validatedData.newDate, "PPP")} at ${validatedData.newTime}`,
        }
      });
    } catch (error) {
      console.error("Error logging activity:", error);
    }

    revalidatePath("/dashboard/appointments");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: appointment
    };
  } catch (error) {
    console.error("Error rescheduling appointment:", error);
    return {
      success: false,
      error: "Failed to reschedule appointment"
    };
  }
}

export async function searchAppointments(query: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: "Unauthorized"
      };
    }

    const whereCondition = query.trim() === "" 
      ? {} 
      : {
          OR: [
            {
              patient: {
                firstName: {
                  contains: query
                }
              }
            },
            {
              patient: {
                lastName: {
                  contains: query
                }
              }
            },
            {
              patient: {
                mrn: {
                  contains: query
                }
              }
            },
            {
              reason: {
                contains: query
              }
            }
          ]
        };

    const appointments = await db.appointment.findMany({
      where: whereCondition,
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            mrn: true,
            phoneNumber: true
          }
        },
        doctor: {
          select: {
            specialization: true,
            user: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        appointmentDate: 'desc'
      },
      take: 50
    });

    return {
      success: true,
      data: appointments
    };
  } catch (error) {
    console.error("Error searching appointments:", error);
    return {
      success: false,
      error: "Failed to search appointments"
    };
  }
}

export async function getAppointmentsByDateRange(startDate: Date, endDate: Date) {
  try {
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: "Unauthorized"
      };
    }

    const appointments = await db.appointment.findMany({
      where: {
        appointmentDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        patient: true,
        doctor: {
          include: {
            user: true
          }
        }
      },
      orderBy: [
        { appointmentDate: 'asc' },
        { appointmentTime: 'asc' }
      ]
    });

    return {
      success: true,
      data: appointments
    };
  } catch (error) {
    console.error("Error fetching appointments by date range:", error);
    return {
      success: false,
      error: "Failed to fetch appointments"
    };
  }
}

export async function getAvailableTimeSlots(doctorId: string, date: Date) {
  try {
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: "Unauthorized"
      };
    }

    // Get doctor's schedule for the day
    const schedule = await getDoctorSchedule(doctorId, date);

    if (!schedule) {
      return {
        success: false,
        error: "Doctor is not available on this day"
      };
    }

    // Get existing appointments for the day
    const existingAppointments = await db.appointment.findMany({
      where: {
        doctorId,
        appointmentDate: date,
        status: {
          not: "CANCELLED"
        }
      }
    });

    // Generate time slots (30-minute intervals)
    const slots = [];
    const workStart = parse(schedule.startTime, "HH:mm", date);
    const workEnd = parse(schedule.endTime, "HH:mm", date);
    
    let currentTime = workStart;
    
    while (currentTime < workEnd) {
      const timeSlot = format(currentTime, "HH:mm");
      
      // Check if slot is available (no existing appointment)
      const isBooked = existingAppointments.some(apt => {
        const aptStart = parse(apt.appointmentTime, "HH:mm", date);
        const aptEnd = addMinutes(aptStart, apt.duration);
        const slotEnd = addMinutes(currentTime, 30);
        
        return (currentTime < aptEnd && slotEnd > aptStart);
      });
      
      slots.push({
        time: timeSlot,
        available: !isBooked
      });
      
      currentTime = addMinutes(currentTime, 30);
    }

    return {
      success: true,
      data: slots
    };
  } catch (error) {
    console.error("Error getting available time slots:", error);
    return {
      success: false,
      error: "Failed to get available time slots"
    };
  }
}

export async function getAppointmentStatistics() {
  try {
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: "Unauthorized"
      };
    }

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const [
      totalToday,
      scheduledToday,
      completedToday,
      cancelledToday
    ] = await Promise.all([
      db.appointment.count({
        where: {
          appointmentDate: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      }),
      db.appointment.count({
        where: {
          appointmentDate: {
            gte: startOfDay,
            lte: endOfDay
          },
          status: "SCHEDULED"
        }
      }),
      db.appointment.count({
        where: {
          appointmentDate: {
            gte: startOfDay,
            lte: endOfDay
          },
          status: "COMPLETED"
        }
      }),
      db.appointment.count({
        where: {
          appointmentDate: {
            gte: startOfDay,
            lte: endOfDay
          },
          status: "CANCELLED"
        }
      })
    ]);

    return {
      success: true,
      data: {
        totalToday,
        scheduledToday,
        completedToday,
        cancelledToday
      }
    };
  } catch (error) {
    console.error("Error getting appointment statistics:", error);
    return {
      success: false,
      error: "Failed to get appointment statistics"
    };
  }
}

// Helper functions to get data for appointment form
export async function getPatients() {
  try {
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: "Unauthorized"
      };
    }

    const patients = await db.patient.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        mrn: true,
        phoneNumber: true
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    });

    return {
      success: true,
      data: patients
    };
  } catch (error) {
    console.error("Error fetching patients:", error);
    return {
      success: false,
      error: "Failed to fetch patients"
    };
  }
}

export async function getDoctors() {
  try {
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: "Unauthorized"
      };
    }

    const doctors = await db.doctor.findMany({
      where: {
        isAvailable: true
      },
      select: {
        id: true,
        specialization: true,
        user: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        user: {
          name: 'asc'
        }
      }
    });

    return {
      success: true,
      data: doctors
    };
  } catch (error) {
    console.error("Error fetching doctors:", error);
    return {
      success: false,
      error: "Failed to fetch doctors"
    };
  }
}