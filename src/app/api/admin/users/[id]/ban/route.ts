import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/middleware/auth";
import { PERMISSIONS } from "@/lib/permissions";

/**
 * Ban a user account
 * PUT /api/admin/users/[id]/ban
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
    const body = await request.json();
    const { reason } = body;

    // Update user to banned
    const user = await prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        bannedAt: new Date(),
        bannedReason: reason || null,
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
      message: "User has been banned",
      data: { user },
    });
  } catch (error: any) {
    console.error("Error banning user:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to ban user",
      },
      { status: 500 }
    );
  }
}
