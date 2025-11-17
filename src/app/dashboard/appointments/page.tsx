import { Suspense } from "react"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AppointmentList } from "@/components/appointments/appointment-list"
import { redirect } from "next/navigation"

async function getAppointmentStats() {
  try {
    const totalAppointments = await db.appointment.count()
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const todayAppointments = await db.appointment.count({
      where: {
        appointmentDate: {
          gte: today,
          lt: tomorrow
        }
      }
    })
    
    const thisMonth = await db.appointment.count({
      where: {
        appointmentDate: {
          gte: new Date(today.getFullYear(), today.getMonth(), 1),
          lt: new Date(today.getFullYear(), today.getMonth() + 1, 1)
        }
      }
    })

    const upcoming = await db.appointment.count({
      where: {
        appointmentDate: {
          gte: today
        },
        status: {
          in: ["SCHEDULED", "CONFIRMED"]
        }
      }
    })

    return { totalAppointments, todayAppointments, thisMonth, upcoming }
  } catch (error) {
    console.error("Error fetching appointment stats:", error)
    return { totalAppointments: 0, todayAppointments: 0, thisMonth: 0, upcoming: 0 }
  }
}

export default async function AppointmentsPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/auth/signin")
  }

  const { totalAppointments, todayAppointments, thisMonth, upcoming } = await getAppointmentStats()

  return (
    <DashboardLayout>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600">
            Manage patient appointments and doctor schedules
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAppointments}</div>
            <p className="text-xs text-muted-foreground">
              All appointments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayAppointments}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled today
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
            <div className="text-2xl font-bold">{thisMonth}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcoming}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled ahead
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appointment Records</CardTitle>
          <CardDescription>
            View and manage all patient appointments and schedules.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading appointments...</div>}>
            <AppointmentList />
          </Suspense>
        </CardContent>
      </Card>
      </div>
    </DashboardLayout>
  )
}