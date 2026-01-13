import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  // For now, we'll handle auth protection on the client side
  // This middleware can be extended later for server-side protection
  
  // Protected routes that require authentication
  const protectedRoutes = ['/admin', '/dashboard']
  
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )

  // For protected routes, we'll let the client-side handle the redirect
  // This is a simple approach that works well with Supabase client-side auth
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}