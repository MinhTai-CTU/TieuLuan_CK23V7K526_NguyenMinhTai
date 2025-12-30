import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/middleware/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { sendBanNotificationEmail } from "@/lib/email";

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

    // Get user info before updating (for email and role check)
    const userBeforeUpdate = await prisma.user.findUnique({
      where: { id },
      select: {
        email: true,
        name: true,
        userRoles: {
          include: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!userBeforeUpdate) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    // Prevent banning ADMIN users
    const hasAdminRole = userBeforeUpdate.userRoles.some(
      (ur) => ur.role.name === "ADMIN"
    );
    if (hasAdminRole) {
      return NextResponse.json(
        {
          success: false,
          error: "Không thể khóa tài khoản có vai trò ADMIN",
        },
        { status: 403 }
      );
    }

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

    // Send notification email
    try {
      await sendBanNotificationEmail(user.email, user.name, reason || null);
      console.log(`✅ Ban notification email sent to ${user.email}`);
    } catch (emailError) {
      console.error("❌ Failed to send ban notification email:", emailError);
      // Don't fail the request if email fails, just log the error
    }

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
