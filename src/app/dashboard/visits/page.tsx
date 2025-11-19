import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Calendar, Clock, User, FileText } from "lucide-react"

async function getDoctorVisits(doctorId: string) {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const appointments = await db.appointment.findMany({
      where: {
        doctor: {
          userId: doctorId
        },
        appointmentDate: {
          gte: today
        }
      },
      include: {
        patient: {
          select: {
            id: true,
            mrn: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            dateOfBirth: true
          }
        },
        visit: {
          select: {
            id: true,
            diagnosis: true,
            treatment: true
          }
        }
      },
      orderBy: [
        { appointmentDate: "asc" },
        { appointmentTime: "asc" }
      ]
    })

    const todayAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.appointmentDate)
      aptDate.setHours(0, 0, 0, 0)
      return aptDate.getTime() === today.getTime()
    })

    const upcomingAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.appointmentDate)
      aptDate.setHours(0, 0, 0, 0)
      return aptDate.getTime() > today.getTime()
    })

    return {
      today: todayAppointments,
      upcoming: upcomingAppointments,
      total: appointments.length
    }
  } catch (error) {
    console.error("Error fetching doctor visits:", error)
    return { today: [], upcoming: [], total: 0 }
  }
}

export default async function VisitsPage() {
  const session = await auth()
  
  if (!session || !session.user.id) {
    redirect("/auth/signin")
  }

  if (session.user.role !== "DOCTOR") {
    redirect("/dashboard")
  }

  const visits = await getDoctorVisits(session.user.id)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-blue-100 text-blue-800"
      case "CONFIRMED":
        return "bg-green-100 text-green-800"
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800"
      case "COMPLETED":
        return "bg-gray-100 text-gray-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Visits</h1>
            <p className="text-gray-600">
              View your appointments and patient visits
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{visits.today.length}</div>
              <p className="text-xs text-muted-foreground">Scheduled for today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{visits.upcoming.length}</div>
              <p className="text-xs text-muted-foreground">Future appointments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{visits.total}</div>
              <p className="text-xs text-muted-foreground">All upcoming visits</p>
            </CardContent>
          </Card>
        </div>

        {/* Today's Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Appointments</CardTitle>
            <CardDescription>Patients scheduled for today</CardDescription>
          </CardHeader>
          <CardContent>
            {visits.today.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="mx-auto h-12 w-12 mb-4" />
                <p>No appointments scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-4">
                {visits.today.map((appointment) => (
                  <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold">
                                {appointment.patient.firstName} {appointment.patient.lastName}
                              </span>
                            </div>
                            <Badge variant="outline">{appointment.patient.mrn}</Badge>
                            <Badge className={getStatusColor(appointment.status)}>
                              {appointment.status}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{appointment.appointmentTime} ({appointment.duration} min)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span>{appointment.reason}</span>
                            </div>
                          </div>

                          {appointment.notes && (
                            <p className="text-sm text-muted-foreground">
                              <strong>Notes:</strong> {appointment.notes}
                            </p>
                          )}

                          {appointment.visit && (
                            <div className="mt-2 p-3 bg-muted rounded-lg text-sm">
                              <p><strong>Diagnosis:</strong> {appointment.visit.diagnosis || "Not yet recorded"}</p>
                              {appointment.visit.treatment && (
                                <p className="mt-1"><strong>Treatment:</strong> {appointment.visit.treatment}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>Future scheduled visits</CardDescription>
          </CardHeader>
          <CardContent>
            {visits.upcoming.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="mx-auto h-12 w-12 mb-4" />
                <p>No upcoming appointments</p>
              </div>
            ) : (
              <div className="space-y-4">
                {visits.upcoming.map((appointment) => (
                  <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold">
                                {format(new Date(appointment.appointmentDate), "MMM dd, yyyy")}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{appointment.appointmentTime}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold">
                                {appointment.patient.firstName} {appointment.patient.lastName}
                              </span>
                            </div>
                            <Badge variant="outline">{appointment.patient.mrn}</Badge>
                            <Badge className={getStatusColor(appointment.status)}>
                              {appointment.status}
                            </Badge>
                          </div>

                          <div className="text-sm text-muted-foreground">
                            <FileText className="h-4 w-4 inline mr-2" />
                            {appointment.reason}
                          </div>

                          {appointment.notes && (
                            <p className="text-sm text-muted-foreground">
                              <strong>Notes:</strong> {appointment.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
