"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

// Get all patient billing records
export async function getAllPatientBilling(filters?: {
  patientId?: string
  isPaid?: boolean
  chargeType?: string
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
    
    if (filters?.isPaid !== undefined) {
      where.isPaid = filters.isPaid
    }
    
    if (filters?.chargeType) {
      where.chargeType = filters.chargeType
    }

    const billingRecords = await db.patientBilling.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            mrn: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return { success: true, data: billingRecords }
  } catch (error) {
    console.error("Error fetching billing records:", error)
    return { success: false, error: "Failed to fetch billing records" }
  }
}

// Get patient billing summary by patient
export async function getPatientBillingSummary() {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const patients = await db.patient.findMany({
      where: {
        billingRecords: {
          some: {}
        }
      },
      select: {
        id: true,
        mrn: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        billingRecords: {
          select: {
            id: true,
            amount: true,
            isPaid: true,
            chargeType: true,
            description: true,
            createdAt: true,
          }
        }
      }
    })

    const summary = patients.map(patient => {
      const totalCharges = patient.billingRecords.reduce((sum, record) => sum + record.amount, 0)
      const paidAmount = patient.billingRecords
        .filter(record => record.isPaid)
        .reduce((sum, record) => sum + record.amount, 0)
      const dueAmount = totalCharges - paidAmount
      const unpaidCount = patient.billingRecords.filter(record => !record.isPaid).length

      return {
        patient: {
          id: patient.id,
          mrn: patient.mrn,
          firstName: patient.firstName,
          lastName: patient.lastName,
          phoneNumber: patient.phoneNumber,
        },
        totalCharges,
        paidAmount,
        dueAmount,
        unpaidCount,
        records: patient.billingRecords
      }
    })

    return { success: true, data: summary }
  } catch (error) {
    console.error("Error fetching patient billing summary:", error)
    return { success: false, error: "Failed to fetch billing summary" }
  }
}

// Mark billing record as paid
export async function markBillingAsPaid(billingIds: string[]) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    if (!["ADMIN", "NURSE"].includes(session.user.role)) {
      return { success: false, error: "Only admins and nurses can process payments" }
    }

    await db.patientBilling.updateMany({
      where: {
        id: { in: billingIds }
      },
      data: {
        isPaid: true,
        paidAt: new Date()
      }
    })

    revalidatePath("/dashboard/billing")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Error marking billing as paid:", error)
    return { success: false, error: "Failed to process payment" }
  }
}

// Get billing statistics
export async function getBillingStats() {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const allRecords = await db.patientBilling.findMany()

    const totalRevenue = allRecords
      .filter(record => record.isPaid)
      .reduce((sum, record) => sum + record.amount, 0)

    const totalOutstanding = allRecords
      .filter(record => !record.isPaid)
      .reduce((sum, record) => sum + record.amount, 0)

    const todayRevenue = allRecords
      .filter(record => 
        record.isPaid && 
        record.paidAt && 
        new Date(record.paidAt).toDateString() === new Date().toDateString()
      )
      .reduce((sum, record) => sum + record.amount, 0)

    const pendingCount = allRecords.filter(record => !record.isPaid).length

    return {
      success: true,
      data: {
        totalRevenue,
        totalOutstanding,
        todayRevenue,
        pendingCount
      }
    }
  } catch (error) {
    console.error("Error fetching billing stats:", error)
    return { success: false, error: "Failed to fetch billing stats" }
  }
}
