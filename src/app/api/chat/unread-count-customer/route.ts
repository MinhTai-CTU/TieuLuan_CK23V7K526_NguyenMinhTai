import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/middleware/auth";
import { getUserRoles } from "@/lib/permissions";
import { ROLES } from "@/lib/permissions";

/**
 * GET /api/chat/unread-count-customer
 * Đếm số tin nhắn chưa đọc cho customer
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const roles = await getUserRoles(userId);
    const isAdmin = roles.includes(ROLES.ADMIN);

    // Chỉ customer mới dùng endpoint này
    if (isAdmin) {
      return NextResponse.json({
        success: true,
        data: { unreadCount: 0 },
      });
    }

    // Đếm số tin nhắn chưa đọc từ admin (sender không phải là customer này)
    const unreadCount = await prisma.message.count({
      where: {
        conversation: {
          userId: userId,
          isActive: true,
        },
        isRead: false,
        senderId: { not: userId }, // Tin nhắn không phải từ chính customer
      },
    });

    return NextResponse.json({
      success: true,
      data: { unreadCount },
    });
  } catch (error: any) {
    console.error("Error counting unread messages:", error);
    return NextResponse.json(
      { success: false, error: "Failed to count unread messages" },
      { status: 500 }
    );
  }
}

