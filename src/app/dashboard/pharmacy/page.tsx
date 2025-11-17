import { Suspense } from "react"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DrugList } from "@/components/pharmacy/drug-list"
import { DispenseDialog } from "@/components/pharmacy/dispense-dialog"
import { MultiDispenseDialog } from "@/components/pharmacy/multi-dispense-dialog"

async function getPharmacyStats() {
  try {
    const totalDrugs = await db.drug.count()
    
    // Find drugs where currentStock is less than or equal to minStock
    const drugs = await db.drug.findMany({
      select: {
        currentStock: true,
        minStock: true
      }
    })
    
    const lowStockDrugs = drugs.filter(drug => drug.currentStock <= drug.minStock).length
    
    const totalValue = await db.drug.aggregate({
      _sum: {
        currentStock: true
      }
    })
    
    const outOfStock = await db.drug.count({
      where: {
        currentStock: 0
      }
    })

    return {
      totalDrugs,
      lowStockDrugs,
      totalItems: totalValue._sum.currentStock || 0,
      outOfStock
    }
  } catch (error) {
    console.error("Error fetching pharmacy stats:", error)
    return { totalDrugs: 0, lowStockDrugs: 0, totalItems: 0, outOfStock: 0 }
  }
}

export default async function PharmacyPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/auth/signin")
  }

  const { totalDrugs, lowStockDrugs, totalItems, outOfStock } = await getPharmacyStats()

  return (
    <DashboardLayout>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pharmacy</h1>
          <p className="text-gray-600">
            Manage medications, inventory, and dispensing
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Medications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDrugs}</div>
            <p className="text-xs text-muted-foreground">In inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockDrugs}</div>
            <p className="text-xs text-muted-foreground">Need reordering</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">Items in stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outOfStock}</div>
            <p className="text-xs text-muted-foreground">Need restocking</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Medication Inventory</CardTitle>
            <CardDescription>View and manage all medications in the pharmacy.</CardDescription>
          </div>
          <div className="flex gap-2">
            <DispenseDialog />
            <MultiDispenseDialog />
          </div>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading medications...</div>}>
            <DrugList />
          </Suspense>
        </CardContent>
      </Card>
      </div>
    </DashboardLayout>
  )
}
