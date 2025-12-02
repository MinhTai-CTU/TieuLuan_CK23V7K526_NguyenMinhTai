import { NextRequest, NextResponse } from "next/server";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";

/**
 * Next.js Middleware to check token validity
 * Runs on the Edge Runtime before the page is rendered
 * Note: Cannot use Prisma here (Edge Runtime limitation)
 * Full user status check is done in server component
 */
export async function middleware(request: NextRequest) {
  // Skip middleware for API routes, static files, and auth pages
  const { pathname } = request.nextUrl;

  // Skip for API routes
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Skip for static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  // Skip for auth pages (signin, signup, verify-email)
  if (
    pathname.startsWith("/signin") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/verify-email")
  ) {
    return NextResponse.next();
  }

  // Try to get token from cookie first (for SSR)
  const tokenFromCookie = request.cookies.get("auth_token")?.value;

  // Fallback to Authorization header
  const authHeader = request.headers.get("authorization");
  const tokenFromHeader = extractTokenFromHeader(authHeader);

  const token = tokenFromCookie || tokenFromHeader;

  // If no token, allow access (user is not logged in)
  if (!token) {
    return NextResponse.next();
  }

  // Verify token (only check if token is valid, not user status)
  // Full user status check will be done in server component
  const decoded = verifyToken(token);
  if (!decoded) {
    // Invalid token, clear cookie and continue
    const response = NextResponse.next();
    response.cookies.delete("auth_token");
    return response;
  }

  // Token is valid, continue to page
  // User status (banned, verified) will be checked in server component
  return NextResponse.next();
}

// Configure which routes to run middleware on
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
};
