"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Drug Schema
const drugSchema = z.object({
  name: z.string().min(1, "Drug name is required"),
  genericName: z.string().min(1, "Generic name is required"),
  manufacturer: z.string().min(1, "Manufacturer is required"),
  dosageForm: z.string().min(1, "Dosage form is required"),
  strength: z.string().min(1, "Strength is required"),
  price: z.number().positive("Price must be positive"),
  currentStock: z.number().int().nonnegative("Stock quantity must be non-negative"),
  minStock: z.number().int().nonnegative("Minimum stock must be non-negative"),
  maxStock: z.number().int().nonnegative("Maximum stock must be non-negative"),
  expiryDate: z.date().optional(),
})

// Get all drugs
export async function getDrugs() {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const drugs = await db.drug.findMany({
      orderBy: { name: "asc" },
    })

    return { success: true, data: drugs }
  } catch (error) {
    console.error("Error fetching drugs:", error)
    return { success: false, error: "Failed to fetch drugs" }
  }
}

// Get drug by ID
export async function getDrugById(drugId: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const drug = await db.drug.findUnique({
      where: { id: drugId },
    })

    if (!drug) {
      return { success: false, error: "Drug not found" }
    }

    return { success: true, data: drug }
  } catch (error) {
    console.error("Error fetching drug:", error)
    return { success: false, error: "Failed to fetch drug" }
  }
}

// Create new drug
export async function createDrug(data: z.infer<typeof drugSchema>) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    // Only admins and pharmacists can create drugs
    if (!["ADMIN", "PHARMACIST"].includes(session.user.role)) {
      return { success: false, error: "Insufficient permissions" }
    }

    const validatedData = drugSchema.parse(data)

    const drug = await db.drug.create({
      data: validatedData,
    })

    revalidatePath("/dashboard/pharmacy")
    return { success: true, data: drug }
  } catch (error) {
    console.error("Error creating drug:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    return { success: false, error: "Failed to create drug" }
  }
}

// Update drug
export async function updateDrug(drugId: string, data: Partial<z.infer<typeof drugSchema>>) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    // Only admins and pharmacists can update drugs
    if (!["ADMIN", "PHARMACIST"].includes(session.user.role)) {
      return { success: false, error: "Insufficient permissions" }
    }

    const drug = await db.drug.update({
      where: { id: drugId },
      data,
    })

    revalidatePath("/dashboard/pharmacy")
    return { success: true, data: drug }
  } catch (error) {
    console.error("Error updating drug:", error)
    return { success: false, error: "Failed to update drug" }
  }
}

// Delete drug
export async function deleteDrug(drugId: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    // Only admins can delete drugs
    if (session.user.role !== "ADMIN") {
      return { success: false, error: "Insufficient permissions" }
    }

    await db.drug.delete({
      where: { id: drugId },
    })

    revalidatePath("/dashboard/pharmacy")
    return { success: true }
  } catch (error) {
    console.error("Error deleting drug:", error)
    return { success: false, error: "Failed to delete drug" }
  }
}

// Update drug stock
export async function updateDrugStock(drugId: string, quantity: number, operation: "add" | "subtract") {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const drug = await db.drug.findUnique({
      where: { id: drugId },
    })

    if (!drug) {
      return { success: false, error: "Drug not found" }
    }

    const newQuantity = operation === "add" 
      ? drug.currentStock + quantity 
      : Math.max(0, drug.currentStock - quantity)

    const updatedDrug = await db.drug.update({
      where: { id: drugId },
      data: { currentStock: newQuantity },
    })

    revalidatePath("/dashboard/pharmacy")
    return { success: true, data: updatedDrug }
  } catch (error) {
    console.error("Error updating drug stock:", error)
    return { success: false, error: "Failed to update drug stock" }
  }
}

// Get low stock drugs
export async function getLowStockDrugs() {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const lowStockDrugs = await db.drug.findMany({
      where: {
        currentStock: {
          lte: db.drug.fields.minStock,
        },
      },
      orderBy: { currentStock: "asc" },
    })

    return { success: true, data: lowStockDrugs }
  } catch (error) {
    console.error("Error fetching low stock drugs:", error)
    return { success: false, error: "Failed to fetch low stock drugs" }
  }
}

// Search drugs
export async function searchDrugs(query: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const drugs = await db.drug.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { genericName: { contains: query } },
          { manufacturer: { contains: query } },
          { dosageForm: { contains: query } },
        ],
      },
      orderBy: { name: "asc" },
    })

    return { success: true, data: drugs }
  } catch (error) {
    console.error("Error searching drugs:", error)
    return { success: false, error: "Failed to search drugs" }
  }
}

// Dispense/Sell drugs to patients
export async function dispenseDrug(data: {
  drugId: string
  patientId: string
  quantity: number
  notes?: string
}) {
  try {
    const session = await auth()
    if (!session?.user || !session.user.id) {
      return { success: false, error: "Unauthorized" }
    }

    const userId = session.user.id

    if (!["ADMIN", "PHARMACIST"].includes(session.user.role)) {
      return { success: false, error: "Only pharmacists can dispense drugs" }
    }

    // Get drug and check stock
    const drug = await db.drug.findUnique({
      where: { id: data.drugId }
    })

    if (!drug) {
      return { success: false, error: "Drug not found" }
    }

    if (drug.currentStock < data.quantity) {
      return { success: false, error: `Insufficient stock. Available: ${drug.currentStock}` }
    }

    const totalPrice = drug.price * data.quantity

    // Create dispense record and update stock
    const dispense = await db.$transaction(async (tx) => {
      const newDispense = await tx.pharmacyDispense.create({
        data: {
          drugId: data.drugId,
          patientId: data.patientId,
          quantity: data.quantity,
          unitPrice: drug.price,
          totalPrice,
          dispensedBy: userId,
          notes: data.notes,
        },
        include: {
          drug: true,
          patient: {
            select: {
              id: true,
              mrn: true,
              firstName: true,
              lastName: true,
            }
          }
        }
      })

      await tx.drug.update({
        where: { id: data.drugId },
        data: { currentStock: { decrement: data.quantity } }
      })

      // Add to patient billing
      await tx.patientBilling.create({
        data: {
          patientId: data.patientId,
          description: `Pharmacy - ${drug.name} (${data.quantity}x)`,
          chargeType: "PHARMACY",
          amount: totalPrice,
          isPaid: false,
          relatedId: newDispense.id,
        }
      })

      return newDispense
    })

    revalidatePath("/dashboard/pharmacy")
    revalidatePath("/dashboard/billing")
    return { success: true, data: dispense }
  } catch (error) {
    console.error("Error dispensing drug:", error)
    return { success: false, error: "Failed to dispense drug" }
  }
}

// Get pharmacy dispense history
export async function getDispenseHistory(filters?: {
  patientId?: string
  drugId?: string
  startDate?: Date
  endDate?: Date
}) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const where: any = {}
    
    if (filters?.patientId) {
      where.patientId = filters.patientId
    }
    
    if (filters?.drugId) {
      where.drugId = filters.drugId
    }
    
    if (filters?.startDate || filters?.endDate) {
      where.dispensedAt = {}
      if (filters.startDate) {
        where.dispensedAt.gte = filters.startDate
      }
      if (filters.endDate) {
        where.dispensedAt.lte = filters.endDate
      }
    }

    const dispenses = await db.pharmacyDispense.findMany({
      where,
      include: {
        drug: {
          select: {
            id: true,
            name: true,
            genericName: true,
            strength: true,
            dosageForm: true,
          }
        },
        patient: {
          select: {
            id: true,
            mrn: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: { dispensedAt: "desc" }
    })

    return { success: true, data: dispenses }
  } catch (error) {
    console.error("Error fetching dispense history:", error)
    return { success: false, error: "Failed to fetch dispense history" }
  }
}

// Dispense multiple drugs to a patient in one transaction
export async function dispenseMultipleDrugs(data: {
  patientId: string
  drugs: Array<{ drugId: string; quantity: number }>
  notes?: string
}) {
  try {
    const session = await auth()
    if (!session?.user || !session.user.id) {
      return { success: false, error: "Unauthorized" }
    }

    const userId = session.user.id

    if (!["ADMIN", "PHARMACIST"].includes(session.user.role)) {
      return { success: false, error: "Only pharmacists can dispense drugs" }
    }

    // Validate and get all drugs
    const drugDetails = await Promise.all(
      data.drugs.map(item => db.drug.findUnique({ where: { id: item.drugId } }))
    )

    // Check if all drugs exist and have sufficient stock
    for (let i = 0; i < drugDetails.length; i++) {
      const drug = drugDetails[i]
      const item = data.drugs[i]
      
      if (!drug) {
        return { success: false, error: "One or more drugs not found" }
      }
      
      if (drug.currentStock < item.quantity) {
        return { success: false, error: `Insufficient stock for ${drug.name}. Available: ${drug.currentStock}` }
      }
    }

    let totalAmount = 0

    // Create dispense records and update stock in transaction
    const dispenses = await db.$transaction(async (tx) => {
      const records = []

      for (let i = 0; i < data.drugs.length; i++) {
        const item = data.drugs[i]
        const drug = drugDetails[i]!
        const itemTotal = drug.price * item.quantity
        totalAmount += itemTotal

        const dispense = await tx.pharmacyDispense.create({
          data: {
            drugId: item.drugId,
            patientId: data.patientId,
            quantity: item.quantity,
            unitPrice: drug.price,
            totalPrice: itemTotal,
            dispensedBy: userId,
            notes: data.notes,
          },
        })

        await tx.drug.update({
          where: { id: item.drugId },
          data: { currentStock: { decrement: item.quantity } }
        })

        records.push(dispense)
      }

      // Add to patient billing
      await tx.patientBilling.create({
        data: {
          patientId: data.patientId,
          description: `Pharmacy - ${data.drugs.length} drug(s) dispensed`,
          chargeType: "PHARMACY",
          amount: totalAmount,
          isPaid: false,
        }
      })

      return records
    })

    revalidatePath("/dashboard/pharmacy")
    revalidatePath("/dashboard/billing")
    return { success: true, data: dispenses }
  } catch (error) {
    console.error("Error dispensing drugs:", error)
    return { success: false, error: "Failed to dispense drugs" }
  }
}
