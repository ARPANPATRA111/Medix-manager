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
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  DollarSign,
  Clock,
  UserPlus
} from "lucide-react"
import { db } from "@/lib/db"
import { DashboardCharts } from "@/components/dashboard/dashboard-charts"

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getDashboardData() {
  const now = new Date()
  const startOfToday = new Date(now.setHours(0, 0, 0, 0))
  const endOfToday = new Date(now.setHours(23, 59, 59, 999))
  
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  const [
    totalPatients,
    patientsLastMonth,
    patientsMonthBefore,
    todayAppointments,
    tomorrowAppointments,
    pendingLabOrders,
    completedLabOrders,
    lowStockDrugs,
    totalBeds,
    occupiedBeds,
    unpaidBills,
    totalRevenue,
    revenueLastMonth,
    recentAppointments,
    recentBills,
    appointmentTrend,
    revenueTrend
  ] = await Promise.all([
    db.patient.count({ where: { isActive: true } }),
    db.patient.count({ 
      where: { 
        isActive: true,
        createdAt: { gte: thirtyDaysAgo }
      } 
    }),
    db.patient.count({ 
      where: { 
        isActive: true,
        createdAt: { 
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo
        }
      } 
    }),
    db.appointment.count({
      where: {
        appointmentDate: {
          gte: startOfToday,
          lt: endOfToday
        }
      }
    }),
    db.appointment.count({
      where: {
        appointmentDate: {
          gte: new Date(new Date().setDate(new Date().getDate() + 1)),
          lt: new Date(new Date().setDate(new Date().getDate() + 2))
        }
      }
    }),
    db.labOrder.count({ where: { status: "PENDING" } }),
    db.labOrder.count({ 
      where: { 
        status: "COMPLETED",
        createdAt: { gte: thirtyDaysAgo }
      } 
    }),
    db.drug.count({ 
      where: { 
        AND: [
          { currentStock: { lte: 10 } },
          { isActive: true }
        ]
      } 
    }),
    db.bed.count({ where: { isActive: true } }),
    db.bed.count({ where: { isOccupied: true, isActive: true } }),
    db.patientBilling.count({ where: { isPaid: false } }),
    db.patientBilling.aggregate({
      _sum: { amount: true },
      where: { isPaid: true }
    }),
    db.patientBilling.aggregate({
      _sum: { amount: true },
      where: { 
        isPaid: true,
        paidAt: { gte: thirtyDaysAgo }
      }
    }),
    db.appointment.findMany({
      take: 5,
      orderBy: { appointmentDate: "desc" },
      include: {
        patient: { select: { firstName: true, lastName: true } },
        doctor: { 
          select: { 
            user: {
              select: { name: true }
            }
          } 
        }
      }
    }),
    db.bill.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        patient: { select: { firstName: true, lastName: true } }
      }
    }),
    // Get last 7 days appointments for chart
    db.$queryRaw`
      SELECT 
        DATE("appointmentDate") as date,
        COUNT(*) as count
      FROM "appointments"
      WHERE "appointmentDate" >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE("appointmentDate")
      ORDER BY date
    `,
    // Get last 7 days revenue for chart
    db.$queryRaw`
      SELECT 
        DATE("paidAt") as date,
        SUM("amount") as amount
      FROM "patient_billing"
      WHERE "isPaid" = true AND "paidAt" >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE("paidAt")
      ORDER BY date
    `
  ])

  const patientGrowth = patientsMonthBefore > 0 
    ? ((patientsLastMonth - patientsMonthBefore) / patientsMonthBefore * 100).toFixed(1)
    : 0

  return {
    totalPatients,
    patientsLastMonth,
    patientGrowth,
    todayAppointments,
    tomorrowAppointments,
    pendingLabOrders,
    completedLabOrders,
    lowStockDrugs,
    totalBeds,
    occupiedBeds,
    unpaidBills,
    totalRevenue: totalRevenue._sum.amount || 0,
    revenueLastMonth: revenueLastMonth._sum.amount || 0,
    bedOccupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
    recentAppointments,
    recentBills,
    appointmentTrend,
    revenueTrend
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
      change: `+${dashboardData.patientGrowth}%`,
      changeType: Number(dashboardData.patientGrowth) >= 0 ? "increase" : "decrease",
      description: "vs last month",
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      iconBg: "bg-blue-100",
      link: "/dashboard/patients"
    },
    {
      title: "Today's Appointments",
      value: dashboardData.todayAppointments,
      icon: Calendar,
      change: `${dashboardData.tomorrowAppointments} tomorrow`,
      changeType: "neutral",
      description: "Scheduled appointments",
      color: "bg-gradient-to-br from-green-500 to-green-600",
      iconBg: "bg-green-100",
      link: "/dashboard/appointments"
    },
    {
      title: "Total Revenue",
      value: `₹${(dashboardData.totalRevenue / 1000).toFixed(1)}k`,
      icon: DollarSign,
      change: `₹${(dashboardData.revenueLastMonth / 1000).toFixed(1)}k`,
      changeType: "neutral",
      description: "Last 30 days",
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
      iconBg: "bg-purple-100",
      link: "/dashboard/billing"
    },
    {
      title: "Bed Occupancy",
      value: `${dashboardData.bedOccupancyRate}%`,
      icon: Bed,
      change: `${dashboardData.occupiedBeds}/${dashboardData.totalBeds}`,
      changeType: dashboardData.bedOccupancyRate > 80 ? "warning" : "neutral",
      description: "Beds occupied",
      color: "bg-gradient-to-br from-indigo-500 to-indigo-600",
      iconBg: "bg-indigo-100",
      link: "/dashboard/ward"
    },
    {
      title: "Lab Orders",
      value: dashboardData.pendingLabOrders,
      icon: TestTube,
      change: `${dashboardData.completedLabOrders} completed`,
      changeType: "neutral",
      description: "Pending processing",
      color: "bg-gradient-to-br from-orange-500 to-orange-600",
      iconBg: "bg-orange-100",
      link: "/dashboard/pharmacy"
    },
    {
      title: "Low Stock Alert",
      value: dashboardData.lowStockDrugs,
      icon: AlertCircle,
      change: "Reorder needed",
      changeType: dashboardData.lowStockDrugs > 5 ? "decrease" : "neutral",
      description: "Items below threshold",
      color: "bg-gradient-to-br from-red-500 to-red-600",
      iconBg: "bg-red-100",
      link: "/dashboard/pharmacy"
    }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-8">
        {/* Welcome Section with enhanced design */}
        <div className="relative overflow-hidden rounded-xl bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 text-white shadow-xl">
          <div className="absolute right-0 top-0 h-full w-1/3 opacity-10">
            <Activity className="h-full w-full" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2 animate-fade-in">
                  Welcome back, {session.user.name}! 👋
                </h1>
                <p className="text-blue-100 text-lg mb-4">
                  Here's your hospital overview for {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  <UserPlus className="mr-1 h-3 w-3" />
                  {session.user.role.replace("_", " ")}
                </Badge>
              </div>
              <div className="hidden md:flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span className="text-sm">{new Date().toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon
            return (
              <Link key={index} href={stat.link}>
                <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-0 overflow-hidden">
                  <div className={`h-2 ${stat.color}`} />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </CardTitle>
                    <div className={`${stat.iconBg} p-2 rounded-lg group-hover:scale-110 transition-transform`}>
                      <IconComponent className="h-5 w-5 text-gray-700" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {stat.value}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        {stat.changeType === "increase" && (
                          <ArrowUpRight className="h-4 w-4 text-green-500" />
                        )}
                        {stat.changeType === "decrease" && (
                          <ArrowDownRight className="h-4 w-4 text-red-500" />
                        )}
                        <span className={`text-sm font-medium ${
                          stat.changeType === "increase" ? "text-green-600" :
                          stat.changeType === "decrease" ? "text-red-600" :
                          stat.changeType === "warning" ? "text-orange-600" :
                          "text-gray-600"
                        }`}>
                          {stat.change}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">{stat.description}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Charts Section */}
        <DashboardCharts 
          appointmentTrend={dashboardData.appointmentTrend}
          revenueTrend={dashboardData.revenueTrend}
        />

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <TrendingUp className="mr-2 h-5 w-5 text-green-500" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Frequently used operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/patients">
                <div className="group p-4 border rounded-xl hover:bg-linear-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer transition-all duration-200 hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                        <UserPlus className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">Register New Patient</div>
                        <div className="text-xs text-gray-500">Add patient to system</div>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
              </Link>
              <Link href="/dashboard/appointments">
                <div className="group p-4 border rounded-xl hover:bg-linear-to-r hover:from-green-50 hover:to-emerald-50 cursor-pointer transition-all duration-200 hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                        <Calendar className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">Schedule Appointment</div>
                        <div className="text-xs text-gray-500">Book with doctor</div>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-green-600 transition-colors" />
                  </div>
                </div>
              </Link>
              <Link href="/dashboard/billing">
                <div className="group p-4 border rounded-xl hover:bg-linear-to-r hover:from-purple-50 hover:to-violet-50 cursor-pointer transition-all duration-200 hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                        <Receipt className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">Generate Bill</div>
                        <div className="text-xs text-gray-500">Create patient invoice</div>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <AlertCircle className="mr-2 h-5 w-5 text-orange-500" />
                System Alerts
              </CardTitle>
              <CardDescription>
                Important notifications requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {dashboardData.lowStockDrugs > 0 && (
                <Link href="/dashboard/pharmacy">
                  <div className="p-4 border-l-4 border-red-500 bg-linear-to-r from-red-50 to-orange-50 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <Pill className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                          <div className="font-semibold text-sm text-red-800">
                            {dashboardData.lowStockDrugs} drugs running low
                          </div>
                          <div className="text-xs text-red-600 mt-1">
                            Review inventory and reorder immediately
                          </div>
                        </div>
                      </div>
                      <Badge variant="destructive" className="text-xs">Urgent</Badge>
                    </div>
                  </div>
                </Link>
              )}
              {dashboardData.pendingLabOrders > 0 && (
                <Link href="/dashboard/laboratory">
                  <div className="p-4 border-l-4 border-blue-500 bg-linear-to-r from-blue-50 to-cyan-50 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <TestTube className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <div className="font-semibold text-sm text-blue-800">
                            {dashboardData.pendingLabOrders} lab orders pending
                          </div>
                          <div className="text-xs text-blue-600 mt-1">
                            Process results and update patient records
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">Action needed</Badge>
                    </div>
                  </div>
                </Link>
              )}
              {dashboardData.unpaidBills > 0 && (
                <Link href="/dashboard/billing">
                  <div className="p-4 border-l-4 border-yellow-500 bg-linear-to-r from-yellow-50 to-amber-50 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <Receipt className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <div className="font-semibold text-sm text-yellow-800">
                            {dashboardData.unpaidBills} unpaid bills
                          </div>
                          <div className="text-xs text-yellow-600 mt-1">
                            Follow up with patients for payment
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">Follow up</Badge>
                    </div>
                  </div>
                </Link>
              )}
              <div className="p-4 border-l-4 border-green-500 bg-linear-to-r from-green-50 to-emerald-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Activity className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-semibold text-sm text-green-800">
                      System running smoothly
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      All services operational • Last backup: Today at 2:00 AM
                    </div>
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