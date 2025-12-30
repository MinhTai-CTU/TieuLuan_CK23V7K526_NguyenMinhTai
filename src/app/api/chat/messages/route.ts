import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";
import { getUserRoles } from "@/lib/permissions";
import { ROLES } from "@/lib/permissions";
import { pusherServer } from "@/lib/pusher";

/**
 * POST /api/chat/messages
 * Gửi tin nhắn mới
 */
export async function POST(request: NextRequest) {
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
    const body = await request.json();
    const { conversationId, content, imageUrl } = body;

    if (!conversationId || (!content && !imageUrl)) {
      return NextResponse.json(
        {
          success: false,
          error: "conversationId and either content or imageUrl are required",
        },
        { status: 400 }
      );
    }

    // Kiểm tra cuộc trò chuyện
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        user: true,
        admin: true,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Kiểm tra quyền truy cập
    const roles = await getUserRoles(userId);
    const isAdmin = roles.includes(ROLES.ADMIN);

    if (!isAdmin && conversation.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Tạo tin nhắn
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: content || (imageUrl ? "[Hình ảnh]" : ""),
        imageUrl: imageUrl || null,
        isRead: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    // Cập nhật lastMessageAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    // Gửi real-time notification qua Pusher
    const targetUserId = isAdmin ? conversation.userId : conversation.adminId;
    if (targetUserId) {
      await pusherServer.trigger(`user-${targetUserId}`, "new-message", {
        conversationId,
        message,
      });
    }

    // Gửi cho cả admin (nếu là customer gửi)
    if (!isAdmin) {
      await pusherServer.trigger("admin-chat", "new-message", {
        conversationId,
        message,
      });
    }

    return NextResponse.json({
      success: true,
      data: message,
    });
  } catch (error: any) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send message" },
      { status: 500 }
    );
  }
}
