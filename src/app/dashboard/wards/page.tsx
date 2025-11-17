import { Suspense } from "react"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getWards } from "@/lib/actions/ward"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Bed as BedIcon, Users, Activity } from "lucide-react"
import { WardList } from "@/components/wards/ward-list"
import { WardFormDialog } from "@/components/wards/ward-form-dialog"

export default async function WardsPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/auth/signin")
  }

  const wardsResult = await getWards()
  const wards = wardsResult.success ? (wardsResult.data || []) : []

  // Calculate statistics
  const totalBeds = wards.reduce((sum, ward) => sum + ward.totalBeds, 0)
  const occupiedBeds = wards.reduce((sum, ward) => sum + ward.beds.filter(b => b.isOccupied).length, 0)
  const availableBeds = totalBeds - occupiedBeds
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ward & Bed Management</h1>
            <p className="text-gray-600">
              Manage hospital wards, beds, and patient admissions
            </p>
          </div>
        {(session.user.role === "ADMIN") && (
          <WardFormDialog>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Ward
            </Button>
          </WardFormDialog>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Wards</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wards.length}</div>
            <p className="text-xs text-muted-foreground">
              Active hospital wards
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Beds</CardTitle>
            <BedIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBeds}</div>
            <p className="text-xs text-muted-foreground">
              All beds in hospital
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupied Beds</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupiedBeds}</div>
            <p className="text-xs text-muted-foreground">
              Currently in use
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupancyRate}%</div>
            <p className="text-xs text-muted-foreground">
              {availableBeds} beds available
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ward List */}
      <Card>
        <CardHeader>
          <CardTitle>All Wards</CardTitle>
          <CardDescription>
            View and manage hospital wards and their beds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading wards...</div>}>
            <WardList wards={wards} />
          </Suspense>
        </CardContent>
      </Card>
      </div>
    </DashboardLayout>
  )
}
