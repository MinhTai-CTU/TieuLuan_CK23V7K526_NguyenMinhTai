import { NextRequest, NextResponse } from "next/server";
import { requirePermission, requireRole, getUserId } from "@/middleware/auth";
import {
  getUserPermissions,
  getUserRoles,
  PERMISSIONS,
  ROLES,
} from "@/lib/permissions";

/**
 * Test endpoint to check authentication and permissions
 * GET /api/test-auth
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated. Please login first.",
          hint: "Add Authorization: Bearer <token> header or x-user-id header",
        },
        { status: 401 }
      );
    }

    // Get user roles and permissions
    const [roles, permissions] = await Promise.all([
      getUserRoles(userId),
      getUserPermissions(userId),
    ]);

    // Test permission checks
    const canCreateProduct = await requirePermission(
      request,
      PERMISSIONS.PRODUCTS_CREATE
    );
    const canManageUsers = await requirePermission(
      request,
      PERMISSIONS.USERS_MANAGE
    );

    // Test role checks
    const isAdmin = await requireRole(request, ROLES.ADMIN);
    const isStaff = await requireRole(request, ROLES.STAFF);

    return NextResponse.json({
      success: true,
      data: {
        userId,
        roles,
        permissions,
        permissionChecks: {
          canCreateProduct: !canCreateProduct, // null means has permission
          canManageUsers: !canManageUsers,
        },
        roleChecks: {
          isAdmin: !isAdmin,
          isStaff: !isStaff,
        },
      },
    });
  } catch (error: any) {
    console.error("Error in test-auth:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to test authentication",
      },
      { status: 500 }
    );
  }
}
