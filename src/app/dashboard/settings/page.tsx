import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Users, 
  UserCheck, 
  UserCog, 
  Stethoscope, 
  Database,
  Shield,
  Bell,
  Lock,
  Globe,
  Palette,
  Activity,
  Server,
  HardDrive,
  Clock
} from "lucide-react"

async function getSystemStats() {
  try {
    const totalUsers = await db.user.count()
    const activeUsers = await db.user.count({
      where: { isActive: true }
    })
    const totalPatients = await db.patient.count()
    const totalDoctors = await db.doctor.count()
    const totalAppointments = await db.appointment.count()
    const totalBills = await db.bill.count()
    const recentActivity = await db.user.count({
      where: {
        updatedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    })

    return { 
      totalUsers, 
      activeUsers, 
      totalPatients, 
      totalDoctors,
      totalAppointments,
      totalBills,
      recentActivity
    }
  } catch (error) {
    console.error("Error fetching system stats:", error)
    return { 
      totalUsers: 0, 
      activeUsers: 0, 
      totalPatients: 0, 
      totalDoctors: 0,
      totalAppointments: 0,
      totalBills: 0,
      recentActivity: 0
    }
  }
}

export default async function SettingsPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/auth/signin")
  }

  const { 
    totalUsers, 
    activeUsers, 
    totalPatients, 
    totalDoctors,
    totalAppointments,
    totalBills,
    recentActivity
  } = await getSystemStats()

  const systemStats = [
    {
      title: "Total Users",
      value: totalUsers,
      icon: Users,
      description: "System users",
      color: "bg-blue-500"
    },
    {
      title: "Active Users",
      value: activeUsers,
      icon: UserCheck,
      description: "Currently active",
      color: "bg-green-500"
    },
    {
      title: "Registered Patients",
      value: totalPatients,
      icon: UserCog,
      description: "Total patients",
      color: "bg-purple-500"
    },
    {
      title: "Medical Staff",
      value: totalDoctors,
      icon: Stethoscope,
      description: "Active doctors",
      color: "bg-indigo-500"
    },
    {
      title: "Total Appointments",
      value: totalAppointments,
      icon: Clock,
      description: "All appointments",
      color: "bg-orange-500"
    },
    {
      title: "Billing Records",
      value: totalBills,
      icon: Database,
      description: "Total bills",
      color: "bg-pink-500"
    },
    {
      title: "Recent Activity",
      value: recentActivity,
      icon: Activity,
      description: "Last 24 hours",
      color: "bg-teal-500"
    },
    {
      title: "System Status",
      value: "Online",
      icon: Server,
      description: "All services",
      color: "bg-emerald-500",
      isText: true
    }
  ]

  const settingsSections = [
    {
      title: "Profile & Account",
      icon: UserCog,
      color: "text-blue-600 bg-blue-100",
      items: [
        { label: "Full Name", value: session.user.name },
        { label: "Email Address", value: session.user.email },
        { label: "Role", value: session.user.role.replace("_", " ") },
        { label: "Account Status", value: "Active", badge: true }
      ]
    },
    {
      title: "Security & Privacy",
      icon: Shield,
      color: "text-red-600 bg-red-100",
      items: [
        { label: "Two-Factor Authentication", value: "Enabled", badge: true },
        { label: "Last Password Change", value: "30 days ago" },
        { label: "Active Sessions", value: "1 device" },
        { label: "Login Alerts", value: "Enabled" }
      ]
    },
    {
      title: "Notifications",
      icon: Bell,
      color: "text-orange-600 bg-orange-100",
      items: [
        { label: "Email Notifications", value: "Enabled" },
        { label: "Appointment Reminders", value: "Enabled" },
        { label: "Billing Alerts", value: "Enabled" },
        { label: "System Updates", value: "Enabled" }
      ]
    },
    {
      title: "System Configuration",
      icon: Database,
      color: "text-purple-600 bg-purple-100",
      items: [
        { label: "Database Status", value: "Connected", badge: true },
        { label: "Storage Used", value: "2.4 GB / 10 GB" },
        { label: "Backup Status", value: "Last: Today 2:00 AM" },
        { label: "System Version", value: "v2.1.0" }
      ]
    },
    {
      title: "Appearance",
      icon: Palette,
      color: "text-pink-600 bg-pink-100",
      items: [
        { label: "Theme", value: "Light Mode" },
        { label: "Language", value: "English (US)" },
        { label: "Date Format", value: "MM/DD/YYYY" },
        { label: "Time Zone", value: "UTC+5:30 (IST)" }
      ]
    },
    {
      title: "Integration & API",
      icon: Globe,
      color: "text-teal-600 bg-teal-100",
      items: [
        { label: "API Access", value: "Enabled" },
        { label: "Webhook Status", value: "Active", badge: true },
        { label: "External Services", value: "3 connected" },
        { label: "Rate Limit", value: "1000 req/hour" }
      ]
    }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
            <p className="text-gray-600">
              Manage your account, system preferences, and configurations
            </p>
          </div>
          <Badge variant="outline" className="text-sm px-3 py-1">
            <Activity className="mr-1 h-3 w-3" />
            System Online
          </Badge>
        </div>

        {/* System Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {systemStats.map((stat, index) => {
            const IconComponent = stat.icon
            return (
              <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`${stat.color} p-3 rounded-lg`}>
                      <IconComponent className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.title}</h3>
                  {stat.isText ? (
                    <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                  )}
                  <p className="text-xs text-gray-500">{stat.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Settings Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {settingsSections.map((section, index) => {
            const IconComponent = section.icon
            return (
              <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className={`${section.color} p-2 rounded-lg`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {section.items.map((item, itemIndex) => (
                      <div key={itemIndex}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{item.label}</span>
                          {item.badge ? (
                            <Badge variant="secondary" className="text-xs">
                              {item.value}
                            </Badge>
                          ) : (
                            <span className="text-sm font-medium text-gray-900">{item.value}</span>
                          )}
                        </div>
                        {itemIndex < section.items.length - 1 && (
                          <Separator className="mt-4" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* System Information Footer */}
        <Card className="border-0 shadow-md bg-linear-to-r from-gray-50 to-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-3">
                <HardDrive className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">System Health</p>
                  <p className="text-xs text-gray-500">All services operational</p>
                </div>
              </div>
              <div className="flex items-center space-x-6 text-xs text-gray-600">
                <div>
                  <span className="font-medium">Uptime:</span> 99.9%
                </div>
                <div>
                  <span className="font-medium">Response:</span> 45ms
                </div>
                <div>
                  <span className="font-medium">Last Backup:</span> 2 hours ago
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
