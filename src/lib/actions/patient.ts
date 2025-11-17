"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { patientSchema } from "@/lib/validations/patient"
import { auth } from "@/auth"
import { Gender } from "@prisma/client"

export async function createPatient(data: FormData) {
  const session = await auth()
  if (!session) {
    return { error: "Unauthorized" }
  }

  try {
    const formData = Object.fromEntries(data.entries())
    
    // Convert date string to Date object
    const validatedData = patientSchema.parse({
      ...formData,
      dateOfBirth: new Date(formData.dateOfBirth as string),
      gender: formData.gender as Gender,
    })

    // Generate unique MRN
    const lastPatient = await db.patient.findFirst({
      orderBy: { createdAt: "desc" },
      select: { mrn: true }
    })
    
    let mrnNumber = 1
    if (lastPatient) {
      const lastMrnNumber = parseInt(lastPatient.mrn.substring(3))
      mrnNumber = lastMrnNumber + 1
    }
    
    const mrn = `MRN${mrnNumber.toString().padStart(3, "0")}`

    // Check for existing patient with same phone or email
    const existingPatient = await db.patient.findFirst({
      where: {
        OR: [
          { phoneNumber: validatedData.phoneNumber },
          ...(validatedData.email ? [{ email: validatedData.email }] : []),
        ],
        isActive: true,
      },
    })

    if (existingPatient) {
      return { error: "Patient with this phone number or email already exists" }
    }

    const patient = await db.patient.create({
      data: {
        mrn,
        ...validatedData,
        email: validatedData.email || null,
        bloodGroup: validatedData.bloodGroup || null,
        allergies: validatedData.allergies || null,
      },
    })

    // Log activity (non-blocking)
    try {
      if (session.user.id) {
        await db.activityLog.create({
          data: {
            userId: session.user.id,
            action: "CREATE",
            module: "PATIENT",
            recordId: patient.id,
            description: `Created new patient: ${patient.firstName} ${patient.lastName} (${patient.mrn})`,
          },
        });
      }
    } catch (error) {
      console.error("Error logging activity:", error);
    }

    revalidatePath("/dashboard/patients")
    return { success: true, patient }
  } catch (error) {
    console.error("Error creating patient:", error)
    return { error: "Failed to create patient" }
  }
}

export async function updatePatient(id: string, data: FormData) {
  const session = await auth()
  if (!session) {
    return { error: "Unauthorized" }
  }

  try {
    const formData = Object.fromEntries(data.entries())
    
    const validatedData = patientSchema.parse({
      ...formData,
      dateOfBirth: new Date(formData.dateOfBirth as string),
      gender: formData.gender as Gender,
    })

    const existingPatient = await db.patient.findUnique({
      where: { id },
    })

    if (!existingPatient) {
      return { error: "Patient not found" }
    }

    // Check for conflicts with other patients
    const conflictingPatient = await db.patient.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          {
            OR: [
              { phoneNumber: validatedData.phoneNumber },
              ...(validatedData.email ? [{ email: validatedData.email }] : []),
            ],
          },
        ],
        isActive: true,
      },
    })

    if (conflictingPatient) {
      return { error: "Another patient with this phone number or email already exists" }
    }

    const patient = await db.patient.update({
      where: { id },
      data: {
        ...validatedData,
        email: validatedData.email || null,
        bloodGroup: validatedData.bloodGroup || null,
        allergies: validatedData.allergies || null,
      },
    })

    // Log activity
    if (session.user.id) {
      await db.activityLog.create({
        data: {
          userId: session.user.id,
          action: "UPDATE",
          module: "PATIENT",
          recordId: patient.id,
          description: `Updated patient: ${patient.firstName} ${patient.lastName} (${patient.mrn})`,
        },
      })
    }

    revalidatePath("/dashboard/patients")
    return { success: true, patient }
  } catch (error) {
    console.error("Error updating patient:", error)
    return { error: "Failed to update patient" }
  }
}

export async function searchPatients(query: string, searchType: string = "name") {
  const session = await auth()
  if (!session) {
    return { error: "Unauthorized" }
  }

  try {
    let whereClause: any = { isActive: true }

    switch (searchType) {
      case "mrn":
        whereClause.mrn = { contains: query }
        break
      case "phone":
        whereClause.phoneNumber = { contains: query }
        break
      case "email":
        whereClause.email = { contains: query }
        break
      default: // name
        whereClause.OR = [
          { firstName: { contains: query } },
          { lastName: { contains: query } },
        ]
        break
    }

    const patients = await db.patient.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    return { success: true, patients }
  } catch (error) {
    console.error("Error searching patients:", error)
    return { error: "Failed to search patients" }
  }
}

export async function getPatientById(id: string) {
  const session = await auth()
  if (!session) {
    return { error: "Unauthorized" }
  }

  try {
    const patient = await db.patient.findUnique({
      where: { id },
      include: {
        visits: {
          include: {
            doctor: {
              include: { user: true }
            }
          },
          orderBy: { visitDate: "desc" },
          take: 10,
        },
        appointments: {
          include: {
            doctor: {
              include: { user: true }
            }
          },
          orderBy: { appointmentDate: "desc" },
          take: 10,
        },
        labOrders: {
          include: {
            orderItems: {
              include: {
                test: true
              }
            }
          },
          orderBy: { orderDate: "desc" },
          take: 5,
        },
        bills: {
          orderBy: { billDate: "desc" },
          take: 5,
        },
      },
    })

    if (!patient) {
      return { error: "Patient not found" }
    }

    return { success: true, patient }
  } catch (error) {
    console.error("Error fetching patient:", error)
    return { error: "Failed to fetch patient details" }
  }
}