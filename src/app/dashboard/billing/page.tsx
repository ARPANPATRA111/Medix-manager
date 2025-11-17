import { Suspense } from "react"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getBillingStats } from "@/lib/actions/billing"
import { BillingList } from "@/components/billing/billing-list"

async function BillingStatsCards() {
  const result = await getBillingStats()
  
  if (!result.success || !result.data) {
    return (
      <div className="text-center text-red-600">
        Failed to load billing stats
      </div>
    )
  }

  const { totalRevenue, totalOutstanding, todayRevenue, pendingCount } = result.data

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">All collected payments</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Outstanding Amount</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">₹{totalOutstanding.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Pending payments</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">₹{todayRevenue.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Collected today</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Bills</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingCount}</div>
          <p className="text-xs text-muted-foreground">Unpaid charges</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default async function BillingPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Patient Billing</h1>
            <p className="text-gray-600">
              Manage patient charges and payments
            </p>
          </div>
        </div>

        <Suspense fallback={<div>Loading statistics...</div>}>
          <BillingStatsCards />
        </Suspense>

        <Card>
          <CardHeader>
            <CardTitle>Patient Billing Records</CardTitle>
            <CardDescription>View all patient charges and mark payments as completed.</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div>Loading billing records...</div>}>
              <BillingList />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
