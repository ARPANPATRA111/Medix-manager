import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/auth"
import { UserRole } from "@prisma/client"

const publicRoutes = ["/", "/auth/signin", "/auth/signup"]
const adminRoutes = ["/admin"]
const doctorRoutes = ["/dashboard/doctor", "/dashboard/patients", "/dashboard/appointments", "/dashboard/visits"]
const nurseRoutes = ["/dashboard/nurse", "/dashboard/patients", "/dashboard/visits", "/dashboard/wards"]
const labRoutes = ["/dashboard/lab"]
const pharmacyRoutes = ["/dashboard/pharmacy"]
const generalRoutes = ["/dashboard"]

const roleBasedRoutes = {
  [UserRole.ADMIN]: [...adminRoutes, ...doctorRoutes, ...nurseRoutes, ...labRoutes, ...pharmacyRoutes, ...generalRoutes],
  [UserRole.DOCTOR]: [...doctorRoutes, ...generalRoutes],
  [UserRole.NURSE]: [...nurseRoutes, ...generalRoutes],
  [UserRole.LAB_TECHNICIAN]: [...labRoutes, ...generalRoutes],
  [UserRole.RADIOLOGIST]: [...labRoutes, ...generalRoutes],
  [UserRole.PHARMACIST]: [...pharmacyRoutes, ...generalRoutes],
  [UserRole.RECEPTIONIST]: [...generalRoutes, "/dashboard/appointments", "/dashboard/patients"],
  [UserRole.ACCOUNTANT]: [...generalRoutes, "/dashboard/billing"],
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Get the session
  const session = await auth()

  // Redirect to signin if not authenticated
  if (!session) {
    const url = new URL("/auth/signin", request.url)
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  // Check role-based access
  const userRole = session.user.role
  const allowedRoutes = roleBasedRoutes[userRole] || []

  // Check if the current path is allowed for the user's role
  const isAllowed = allowedRoutes.some(route => pathname.startsWith(route))

  if (!isAllowed) {
    // Redirect to appropriate dashboard based on role
    if (userRole === UserRole.ADMIN) {
      return NextResponse.redirect(new URL("/admin", request.url))
    } else if (userRole === UserRole.DOCTOR) {
      return NextResponse.redirect(new URL("/dashboard/doctor", request.url))
    } else if (userRole === UserRole.NURSE) {
      return NextResponse.redirect(new URL("/dashboard/nurse", request.url))
    } else if (userRole === UserRole.LAB_TECHNICIAN || userRole === UserRole.RADIOLOGIST) {
      return NextResponse.redirect(new URL("/dashboard/lab", request.url))
    } else if (userRole === UserRole.PHARMACIST) {
      return NextResponse.redirect(new URL("/dashboard/pharmacy", request.url))
    } else {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}