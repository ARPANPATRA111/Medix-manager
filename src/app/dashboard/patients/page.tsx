import { Suspense } from "react"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { PatientsTable } from "@/components/patients/patients-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/lib/db"

async function getPatients() {
  try {
    const patients = await db.patient.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    const totalPatients = await db.patient.count({ where: { isActive: true } })
    
    return { patients, totalPatients }
  } catch (error) {
    console.error("Error fetching patients:", error)
    return { patients: [], totalPatients: 0 }
  }
}

export default async function PatientsPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/auth/signin")
  }

  const { patients, totalPatients } = await getPatients()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
            <p className="text-gray-600">
              Manage patient records and information
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Patients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPatients}</div>
              <p className="text-xs text-muted-foreground">
                Active registrations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                New Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {patients.filter(p => 
                  new Date(p.createdAt).toDateString() === new Date().toDateString()
                ).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Registered today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {patients.filter(p => {
                  const created = new Date(p.createdAt)
                  const now = new Date()
                  return created.getMonth() === now.getMonth() && 
                         created.getFullYear() === now.getFullYear()
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Age Groups
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Mixed</div>
              <p className="text-xs text-muted-foreground">
                All age ranges
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Patient Records</CardTitle>
            <CardDescription>
              View and manage patient information, medical records, and history.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div>Loading patients...</div>}>
              <PatientsTable patients={patients} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}