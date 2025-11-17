"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validations/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";

export async function createDoctor(data: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  // Check if user is admin
  if (session.user.role !== 'ADMIN') {
    return { success: false, error: "Only admins can create doctors" };
  }

  try {
    const formData = Object.fromEntries(data.entries());
    
    // Validate user data
    const userData = {
      name: formData.name as string,
      email: formData.email as string,
      password: formData.password as string,
      role: 'DOCTOR' as UserRole,
    };

    const validatedUserData = registerSchema.parse(userData);

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedUserData.email },
    });

    if (existingUser) {
      return { success: false, error: "Email already exists" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedUserData.password, 10);

    // Create user first
    const user = await db.user.create({
      data: {
        ...validatedUserData,
        password: hashedPassword,
      },
    });

    // Create doctor profile
    const doctor = await db.doctor.create({
      data: {
        userId: user.id,
        licenseNumber: formData.licenseNumber as string,
        specialization: formData.specialization as string,
        qualification: formData.qualification as string,
        experience: parseInt(formData.experience as string) || 0,
        consultationFee: parseFloat(formData.consultationFee as string) || 0,
        availableFrom: formData.availableFrom as string,
        availableTo: formData.availableTo as string,
        department: formData.department as string,
        maxPatientsPerDay: parseInt(formData.maxPatientsPerDay as string) || 20,
        phone: formData.phone as string || null,
        email: formData.doctorEmail as string || null,
        isAvailable: true,
      },
    });

    // Create working day schedules if provided
    if (formData.workingDays) {
      const workingDays = JSON.parse(formData.workingDays as string) as number[];
      
      for (const dayOfWeek of workingDays) {
        await db.doctorSchedule.create({
          data: {
            doctorId: doctor.id,
            dayOfWeek,
            startTime: formData.availableFrom as string,
            endTime: formData.availableTo as string,
            isActive: true,
          }
        });
      }
    }

    // Log activity (non-blocking)
    try {
      if (session.user.id) {
        await db.activityLog.create({
          data: {
            userId: session.user.id,
            action: "CREATE",
            module: "DOCTOR",
            recordId: doctor.id,
            description: `Created new doctor: ${user.name} (${doctor.licenseNumber})`,
          },
        });
      }
    } catch (error) {
      console.error("Error logging activity:", error);
    }

    revalidatePath("/dashboard/doctors");
    revalidatePath("/dashboard");
    return { success: true, data: { user, doctor } };

  } catch (error) {
    console.error("Error creating doctor:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create doctor" 
    };
  }
}

export async function getDoctors() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const doctors = await db.doctor.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        doctorSchedules: true
      },
      orderBy: [
        { specialization: "asc" }
      ]
    });

    return { success: true, data: doctors };

  } catch (error) {
    console.error("Error fetching doctors:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch doctors" 
    };
  }
}

export async function getDoctorById(doctorId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const doctor = await db.doctor.findUnique({
      where: { id: doctorId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        doctorSchedules: true
      }
    });

    if (!doctor) {
      return { success: false, error: "Doctor not found" };
    }

    return { success: true, data: doctor };

  } catch (error) {
    console.error("Error fetching doctor:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch doctor" 
    };
  }
}

export async function updateDoctor(doctorId: string, data: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  // Check if user is admin
  if (session.user.role !== 'ADMIN') {
    return { success: false, error: "Only admins can update doctors" };
  }

  try {
    const formData = Object.fromEntries(data.entries());
    
    // Get existing doctor
    const existingDoctor = await db.doctor.findUnique({
      where: { id: doctorId },
      include: { user: true }
    });

    if (!existingDoctor) {
      return { success: false, error: "Doctor not found" };
    }

    // Update user information
    const userUpdate: any = {
      name: formData.name as string,
      email: formData.email as string,
    };

    // Only update password if provided
    if (formData.password && (formData.password as string).length > 0) {
      userUpdate.password = await bcrypt.hash(formData.password as string, 10);
    }

    await db.user.update({
      where: { id: existingDoctor.userId },
      data: userUpdate,
    });

    // Update doctor profile
    const doctor = await db.doctor.update({
      where: { id: doctorId },
      data: {
        licenseNumber: formData.licenseNumber as string,
        specialization: formData.specialization as string,
        qualification: formData.qualification as string,
        experience: parseInt(formData.experience as string) || 0,
        consultationFee: parseFloat(formData.consultationFee as string) || 0,
        availableFrom: formData.availableFrom as string,
        availableTo: formData.availableTo as string,
        department: formData.department as string,
        maxPatientsPerDay: parseInt(formData.maxPatientsPerDay as string) || 20,
        phone: formData.phone as string || null,
        email: formData.doctorEmail as string || null,
      },
    });

    // Handle working days if provided
    if (formData.workingDays) {
      const workingDays = JSON.parse(formData.workingDays as string) as number[];
      
      // Delete existing schedules
      await db.doctorSchedule.deleteMany({
        where: { doctorId }
      });

      // Create new schedules
      for (const dayOfWeek of workingDays) {
        await db.doctorSchedule.create({
          data: {
            doctorId,
            dayOfWeek,
            startTime: formData.availableFrom as string,
            endTime: formData.availableTo as string,
            isActive: true,
          }
        });
      }
    }

    // Log activity (non-blocking)
    try {
      await db.activityLog.create({
        data: {
          userId: session.user.id,
          action: "UPDATE",
          module: "DOCTOR",
          recordId: doctor.id,
          description: `Updated doctor: ${formData.name} (${doctor.licenseNumber})`,
        },
      });
    } catch (error) {
      console.error("Error logging activity:", error);
    }

    revalidatePath("/dashboard/doctors");
    revalidatePath("/dashboard");
    return { success: true, data: doctor };

  } catch (error) {
    console.error("Error updating doctor:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update doctor" 
    };
  }
}