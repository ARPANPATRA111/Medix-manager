import { auth } from "@/auth"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  
  const publicRoutes = ["/", "/auth/signin", "/auth/signup"]
  const isPublicRoute = publicRoutes.includes(pathname)

  // Redirect to signin if accessing protected route while not logged in
  if (!isPublicRoute && !isLoggedIn) {
    const url = new URL("/auth/signin", req.url)
    url.searchParams.set("callbackUrl", pathname)
    return Response.redirect(url)
  }

  return
})

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