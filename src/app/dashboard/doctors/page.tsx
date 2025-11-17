import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDoctors } from "@/lib/actions/doctor";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DoctorList } from "@/components/doctors/doctor-list";

export default async function DoctorsPage() {
  const session = await auth();
  
  if (!session) {
    redirect("/auth/signin");
  }

  const doctorsResult = await getDoctors();
  const doctors = doctorsResult.success ? doctorsResult.data || [] : [];
  const userRole = session.user?.role;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Doctors</h1>
            <p className="text-gray-600">
              Manage doctor accounts and information
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Doctors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{doctors.length}</div>
              <p className="text-xs text-muted-foreground">
                Active registrations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Available Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {doctors.filter(doctor => doctor.isAvailable).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Ready for appointments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Specializations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(doctors.map(doctor => doctor.specialization)).size}
              </div>
              <p className="text-xs text-muted-foreground">
                Different specialties
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg. Experience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {doctors.length > 0 
                  ? Math.round(doctors.reduce((sum, doctor) => sum + doctor.experience, 0) / doctors.length)
                  : 0
                } yrs
              </div>
              <p className="text-xs text-muted-foreground">
                Years of practice
              </p>
            </CardContent>
          </Card>
        </div>

        <DoctorList initialDoctors={doctors} userRole={userRole} />
      </div>
    </DashboardLayout>
  );
}