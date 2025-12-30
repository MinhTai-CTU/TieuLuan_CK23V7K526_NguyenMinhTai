import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/middleware/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { sendUnbanNotificationEmail } from "@/lib/email";

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

    // Get user info before updating (for email)
    const userBeforeUpdate = await prisma.user.findUnique({
      where: { id },
      select: {
        email: true,
        name: true,
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

    // Send notification email
    try {
      await sendUnbanNotificationEmail(user.email, user.name);
      console.log(`✅ Unban notification email sent to ${user.email}`);
    } catch (emailError) {
      console.error("❌ Failed to send unban notification email:", emailError);
      // Don't fail the request if email fails, just log the error
    }

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
