import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";
import { getUserRoles } from "@/lib/permissions";
import { ROLES } from "@/lib/permissions";

/**
 * GET /api/chat/conversations
 * Lấy danh sách cuộc trò chuyện
 * - Customer: chỉ thấy cuộc trò chuyện của mình
 * - Admin: thấy tất cả cuộc trò chuyện
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

    // Admin: chỉ lấy cuộc trò chuyện có tin nhắn từ khách hàng (không phải từ chính admin đó)
    // Customer: chỉ lấy cuộc trò chuyện của mình
    const conversations = await prisma.conversation.findMany({
      where: isAdmin
        ? {
            isActive: true,
            messages: {
              some: {
                sender: {
                  userRoles: {
                    none: {
                      role: {
                        name: "ADMIN",
                      },
                    },
                  },
                },
              },
            },
          }
        : { userId, isActive: true },
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
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            messages: {
              where: {
                isRead: false,
                senderId: { not: userId }, // Chỉ đếm tin nhắn chưa đọc từ người khác
              },
            },
          },
        },
      },
      orderBy: {
        lastMessageAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: conversations,
    });
  } catch (error: any) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/conversations
 * Tạo cuộc trò chuyện mới (chỉ customer)
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

    // Kiểm tra xem đã có cuộc trò chuyện active chưa
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        userId,
        isActive: true,
      },
    });

    if (existingConversation) {
      return NextResponse.json({
        success: true,
        data: existingConversation,
      });
    }

    // Tạo cuộc trò chuyện mới
    const conversation = await prisma.conversation.create({
      data: {
        userId,
        isActive: true,
      },
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
      },
    });

    return NextResponse.json({
      success: true,
      data: conversation,
    });
  } catch (error: any) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
