import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  Calendar, 
  TestTube, 
  Pill, 
  Receipt, 
  Bed, 
  TrendingUp,
  AlertCircle
} from "lucide-react"
import { db } from "@/lib/db"

async function getDashboardData() {
  const [
    totalPatients,
    todayAppointments,
    pendingLabOrders,
    lowStockDrugs,
    totalBeds,
    occupiedBeds,
    unpaidBills
  ] = await Promise.all([
    db.patient.count({ where: { isActive: true } }),
    db.appointment.count({
      where: {
        appointmentDate: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }
    }),
    db.labOrder.count({ where: { status: "PENDING" } }),
    db.drug.count({ 
      where: { 
        AND: [
          { currentStock: { lte: 10 } }, // Simple check for low stock
          { isActive: true }
        ]
      } 
    }),
    db.bed.count({ where: { isActive: true } }),
    db.bed.count({ where: { isOccupied: true, isActive: true } }),
    db.bill.count({ where: { status: { in: ["PENDING", "PARTIALLY_PAID"] } } })
  ])

  return {
    totalPatients,
    todayAppointments,
    pendingLabOrders,
    lowStockDrugs,
    totalBeds,
    occupiedBeds,
    unpaidBills,
    bedOccupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0
  }
}

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/auth/signin")
  }

  const dashboardData = await getDashboardData()

  const stats = [
    {
      title: "Total Patients",
      value: dashboardData.totalPatients,
      icon: Users,
      trend: "+12% from last month",
      color: "text-blue-600"
    },
    {
      title: "Today's Appointments",
      value: dashboardData.todayAppointments,
      icon: Calendar,
      trend: "5 upcoming",
      color: "text-green-600"
    },
    {
      title: "Pending Lab Orders",
      value: dashboardData.pendingLabOrders,
      icon: TestTube,
      trend: "Process today",
      color: "text-orange-600"
    },
    {
      title: "Low Stock Drugs",
      value: dashboardData.lowStockDrugs,
      icon: Pill,
      trend: "Reorder needed",
      color: "text-red-600"
    },
    {
      title: "Bed Occupancy",
      value: `${dashboardData.bedOccupancyRate}%`,
      icon: Bed,
      trend: `${dashboardData.occupiedBeds}/${dashboardData.totalBeds} occupied`,
      color: "text-purple-600"
    },
    {
      title: "Unpaid Bills",
      value: dashboardData.unpaidBills,
      icon: Receipt,
      trend: "Follow up required",
      color: "text-yellow-600"
    }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-linear-to-r from-blue-500 to-indigo-600 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">
            Welcome back, {session.user.name}!
          </h1>
          <p className="text-blue-100">
            Here's what's happening at the hospital today.
          </p>
          <Badge variant="secondary" className="mt-2">
            {session.user.role.replace("_", " ")}
          </Badge>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <IconComponent className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {stat.trend}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-green-500" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Common tasks you can perform quickly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link href="/dashboard/patients">
                  <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className="font-medium text-sm">Register New Patient</div>
                    <div className="text-xs text-gray-500">Add a new patient to the system</div>
                  </div>
                </Link>
                <Link href="/dashboard/appointments">
                  <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className="font-medium text-sm">Schedule Appointment</div>
                    <div className="text-xs text-gray-500">Book an appointment with a doctor</div>
                  </div>
                </Link>
                <Link href="/dashboard/laboratory">
                  <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className="font-medium text-sm">Create Lab Order</div>
                    <div className="text-xs text-gray-500">Order laboratory tests for a patient</div>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="mr-2 h-5 w-5 text-orange-500" />
                Notifications
              </CardTitle>
              <CardDescription>
                Important updates and alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 border-l-4 border-orange-500 bg-orange-50">
                  <div className="font-medium text-sm text-orange-800">
                    {dashboardData.lowStockDrugs} drugs are running low
                  </div>
                  <div className="text-xs text-orange-600">
                    Check pharmacy inventory and reorder
                  </div>
                </div>
                <div className="p-3 border-l-4 border-blue-500 bg-blue-50">
                  <div className="font-medium text-sm text-blue-800">
                    {dashboardData.pendingLabOrders} lab orders pending
                  </div>
                  <div className="text-xs text-blue-600">
                    Process laboratory results today
                  </div>
                </div>
                <div className="p-3 border-l-4 border-green-500 bg-green-50">
                  <div className="font-medium text-sm text-green-800">
                    System backup completed
                  </div>
                  <div className="text-xs text-green-600">
                    Last backup: Today at 2:00 AM
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}