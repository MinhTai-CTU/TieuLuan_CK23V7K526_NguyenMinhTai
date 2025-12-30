import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";
import { getUserRoles } from "@/lib/permissions";
import { ROLES } from "@/lib/permissions";

/**
 * GET /api/chat/unread-count
 * Lấy số tin nhắn chưa đọc cho admin
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    const userId = decoded.userId;
    const roles = await getUserRoles(userId);
    const isAdmin = roles.includes(ROLES.ADMIN);

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Đếm số tin nhắn chưa đọc từ khách hàng (không phải từ admin)
    const unreadCount = await prisma.message.count({
      where: {
        conversation: {
          isActive: true,
        },
        sender: {
          userRoles: {
            none: {
              role: {
                name: "ADMIN",
              },
            },
          },
        },
        isRead: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: { unreadCount },
    });
  } catch (error: any) {
    console.error("Error fetching unread count:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch unread count" },
      { status: 500 }
    );
  }
}
