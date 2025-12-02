import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/middleware/auth";
import { PERMISSIONS } from "@/lib/permissions";

/**
 * Unban a user account
 * PUT /api/admin/users/[id]/unban
 * Requires: USERS_MANAGE permission
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check permission
    const permissionCheck = await requirePermission(
      request,
      PERMISSIONS.USERS_MANAGE
    );
    if (permissionCheck) {
      return permissionCheck;
    }

    const { id } = await params;

    // Update user to active
    const user = await prisma.user.update({
      where: { id },
      data: {
        isActive: true,
        bannedAt: null,
        bannedReason: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        bannedAt: true,
        bannedReason: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "User has been unbanned",
      data: { user },
    });
  } catch (error: any) {
    console.error("Error unbanning user:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to unban user",
      },
      { status: 500 }
    );
  }
}
