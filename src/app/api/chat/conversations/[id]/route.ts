import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";
import { getUserRoles } from "@/lib/permissions";
import { ROLES } from "@/lib/permissions";

/**
 * GET /api/chat/conversations/[id]
 * Lấy thông tin cuộc trò chuyện và tin nhắn
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: conversationId } = await params;
    const userId = decoded.userId;

    const roles = await getUserRoles(userId);
    const isAdmin = roles.includes(ROLES.ADMIN);

    // Lấy cuộc trò chuyện
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            phone: true,
          },
        },
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Kiểm tra quyền truy cập
    if (!isAdmin && conversation.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Lấy tin nhắn
    // Admin: chỉ thấy tin nhắn từ khách hàng (không thấy tin nhắn của chính mình)
    // Customer: thấy tất cả tin nhắn
    const messages = await prisma.message.findMany({
      where: {
        conversationId: conversationId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    // Đánh dấu tin nhắn đã đọc
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        conversation,
        messages,
      },
    });
  } catch (error: any) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/chat/conversations/[id]
 * Cập nhật cuộc trò chuyện (admin assign, close, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: conversationId } = await params;
    const userId = decoded.userId;
    const body = await request.json();
    const { adminId, isActive } = body;

    const roles = await getUserRoles(userId);
    const isAdmin = roles.includes(ROLES.ADMIN);

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (adminId !== undefined) updateData.adminId = adminId;
    if (isActive !== undefined) updateData.isActive = isActive;

    const conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            phone: true,
          },
        },
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: conversation,
    });
  } catch (error: any) {
    console.error("Error updating conversation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update conversation" },
      { status: 500 }
    );
  }
}
