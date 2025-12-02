import { NextRequest, NextResponse } from "next/server";
import { hasPermission, hasRole, PERMISSIONS, ROLES } from "@/lib/permissions";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";

/**
 * Middleware to check if user is authenticated
 * Verifies JWT token from Authorization header
 */
export function requireAuth(
  request: NextRequest
): { userId: string; email: string } | null {
  // Try to get token from Authorization header
  const authHeader = request.headers.get("authorization");
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    // Fallback: Check x-user-id header for development/testing
    const userId = request.headers.get("x-user-id");
    if (userId) {
      return { userId, email: "" };
    }
    return null;
  }

  // Verify JWT token
  const decoded = verifyToken(token);
  if (!decoded) {
    return null;
  }

  return { userId: decoded.userId, email: decoded.email };
}

/**
 * Middleware to check if user has required permission
 */
export async function requirePermission(
  request: NextRequest,
  permission: string
): Promise<NextResponse | null> {
  const auth = requireAuth(request);
  if (!auth) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const hasPerm = await hasPermission(auth.userId, permission);
  if (!hasPerm) {
    return NextResponse.json(
      { success: false, error: "Forbidden: Insufficient permissions" },
      { status: 403 }
    );
  }

  return null; // User has permission, continue
}

/**
 * Middleware to check if user has required role
 */
export async function requireRole(
  request: NextRequest,
  role: string
): Promise<NextResponse | null> {
  const auth = requireAuth(request);
  if (!auth) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const hasUserRole = await hasRole(auth.userId, role);
  if (!hasUserRole) {
    return NextResponse.json(
      { success: false, error: "Forbidden: Insufficient role" },
      { status: 403 }
    );
  }

  return null; // User has role, continue
}

/**
 * Helper to get userId from request (for use in API routes)
 */
export function getUserId(request: NextRequest): string | null {
  const auth = requireAuth(request);
  return auth?.userId || null;
}
