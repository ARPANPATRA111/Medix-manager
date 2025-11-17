"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

// Ward Actions
export async function getWards() {
  try {
    const session = await auth()
    if (!session) {
      return { success: false, error: "Unauthorized" }
    }

    const wards = await db.ward.findMany({
      where: { isActive: true },
      include: {
        beds: {
          where: { isActive: true },
          orderBy: { bedNumber: "asc" }
        }
      },
      orderBy: { name: "asc" }
    })

    return { success: true, data: wards }
  } catch (error) {
    console.error("Error fetching wards:", error)
    return { success: false, error: "Failed to fetch wards" }
  }
}

export async function createWard(data: {
  name: string
  wardType: string
  totalBeds: number
}) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" }
    }

    const ward = await db.ward.create({
      data: {
        name: data.name,
        wardType: data.wardType,
        totalBeds: data.totalBeds,
      }
    })

    revalidatePath("/dashboard/wards")
    return { success: true, data: ward }
  } catch (error) {
    console.error("Error creating ward:", error)
    return { success: false, error: "Failed to create ward" }
  }
}

export async function updateWard(wardId: string, data: {
  name?: string
  wardType?: string
  totalBeds?: number
  isActive?: boolean
}) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" }
    }

    const ward = await db.ward.update({
      where: { id: wardId },
      data
    })

    revalidatePath("/dashboard/wards")
    return { success: true, data: ward }
  } catch (error) {
    console.error("Error updating ward:", error)
    return { success: false, error: "Failed to update ward" }
  }
}

// Bed Actions
export async function getBeds(wardId?: string) {
  try {
    const session = await auth()
    if (!session) {
      return { success: false, error: "Unauthorized" }
    }

    const beds = await db.bed.findMany({
      where: {
        isActive: true,
        ...(wardId && { wardId })
      },
      include: {
        ward: true,
        admissions: {
          where: {
            status: "ADMITTED"
          },
          include: {
            patient: true
          }
        }
      },
      orderBy: [
        { ward: { name: "asc" } },
        { bedNumber: "asc" }
      ]
    })

    return { success: true, data: beds }
  } catch (error) {
    console.error("Error fetching beds:", error)
    return { success: false, error: "Failed to fetch beds" }
  }
}

export async function createBed(data: {
  wardId: string
  bedNumber: string
  bedType: string
}) {
  try {
    const session = await auth()
    if (!session || !["ADMIN", "NURSE"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" }
    }

    const bed = await db.bed.create({
      data: {
        wardId: data.wardId,
        bedNumber: data.bedNumber,
        bedType: data.bedType,
      }
    })

    revalidatePath("/dashboard/wards")
    return { success: true, data: bed }
  } catch (error: any) {
    console.error("Error creating bed:", error)
    if (error.code === "P2002") {
      return { success: false, error: "Bed number already exists in this ward" }
    }
    return { success: false, error: "Failed to create bed" }
  }
}

export async function updateBedStatus(bedId: string, isOccupied: boolean) {
  try {
    const session = await auth()
    if (!session || !["ADMIN", "NURSE", "DOCTOR"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" }
    }

    const bed = await db.bed.update({
      where: { id: bedId },
      data: { isOccupied }
    })

    revalidatePath("/dashboard/wards")
    return { success: true, data: bed }
  } catch (error) {
    console.error("Error updating bed status:", error)
    return { success: false, error: "Failed to update bed status" }
  }
}

// Admission Actions
export async function createAdmission(data: {
  patientId: string
  bedId: string
  reason: string
  admittingDoctorId: string
  expectedDays?: number
  notes?: string
}) {
  try {
    const session = await auth()
    if (!session || !["ADMIN", "DOCTOR", "NURSE"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if bed is available
    const bed = await db.bed.findUnique({
      where: { id: data.bedId }
    })

    if (!bed || bed.isOccupied) {
      return { success: false, error: "Bed is not available" }
    }

    // Calculate expected discharge date and charges
    const expectedDischargeDate = data.expectedDays 
      ? new Date(Date.now() + data.expectedDays * 24 * 60 * 60 * 1000)
      : null
    
    const totalBedCharges = data.expectedDays 
      ? bed.pricePerDay * data.expectedDays
      : 0

    // Create admission, update bed status, and add billing in a transaction
    const admission = await db.$transaction(async (tx) => {
      const newAdmission = await tx.admission.create({
        data: {
          patientId: data.patientId,
          bedId: data.bedId,
          reason: data.reason,
          admittingDoctorId: data.admittingDoctorId,
          expectedDischargeDate,
          totalBedCharges,
          notes: data.notes,
        },
        include: {
          patient: true,
          bed: {
            include: {
              ward: true
            }
          }
        }
      })

      await tx.bed.update({
        where: { id: data.bedId },
        data: { isOccupied: true }
      })

      // Add to patient billing if there are bed charges
      if (totalBedCharges > 0) {
        await tx.patientBilling.create({
          data: {
            patientId: data.patientId,
            description: `Ward Admission - ${newAdmission.bed.ward.name} (Bed ${newAdmission.bed.bedNumber}) - ${data.expectedDays} day(s)`,
            chargeType: "ADMISSION",
            amount: totalBedCharges,
            isPaid: false,
            relatedId: newAdmission.id,
          }
        });
      }

      return newAdmission
    })

    revalidatePath("/dashboard/wards")
    revalidatePath("/dashboard/billing")
    return { success: true, data: admission }
  } catch (error) {
    console.error("Error creating admission:", error)
    return { success: false, error: "Failed to create admission" }
  }
}

export async function dischargePatient(admissionId: string) {
  try {
    const session = await auth()
    if (!session || !["ADMIN", "DOCTOR"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" }
    }

    const admission = await db.admission.findUnique({
      where: { id: admissionId }
    })

    if (!admission) {
      return { success: false, error: "Admission not found" }
    }

    // Update admission and free the bed
    await db.$transaction(async (tx) => {
      await tx.admission.update({
        where: { id: admissionId },
        data: {
          status: "DISCHARGED",
          dischargeDate: new Date()
        }
      })

      await tx.bed.update({
        where: { id: admission.bedId },
        data: { isOccupied: false }
      })
    })

    revalidatePath("/dashboard/wards")
    return { success: true }
  } catch (error) {
    console.error("Error discharging patient:", error)
    return { success: false, error: "Failed to discharge patient" }
  }
}

export async function getAdmissions(status?: string) {
  try {
    const session = await auth()
    if (!session) {
      return { success: false, error: "Unauthorized" }
    }

    const admissions = await db.admission.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        patient: true,
        bed: {
          include: {
            ward: true
          }
        }
      },
      orderBy: { admissionDate: "desc" }
    })

    return { success: true, data: admissions }
  } catch (error) {
    console.error("Error fetching admissions:", error)
    return { success: false, error: "Failed to fetch admissions" }
  }
}
