import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/middleware/auth";

// GET - Lấy reactions của blog
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    const blog = await prisma.blog.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!blog) {
      return NextResponse.json(
        { success: false, error: "Blog not found" },
        { status: 404 }
      );
    }

    const reactions = await prisma.blogReaction.findMany({
      where: { blogId: blog.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    // Đếm số lượng theo từng loại reaction
    const reactionCounts: Record<string, number> = {};
    reactions.forEach((reaction) => {
      reactionCounts[reaction.type] = (reactionCounts[reaction.type] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      data: {
        reactions,
        counts: reactionCounts,
        total: reactions.length,
      },
    });
  } catch (error: any) {
    console.error("Error fetching reactions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch reactions" },
      { status: 500 }
    );
  }
}

// POST - Tạo hoặc cập nhật reaction
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { slug } = await params;
    const body = await request.json();
    const { type } = body;

    const validTypes = ["like", "love", "haha", "wow", "sad", "angry"];
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: "Invalid reaction type" },
        { status: 400 }
      );
    }

    const blog = await prisma.blog.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!blog) {
      return NextResponse.json(
        { success: false, error: "Blog not found" },
        { status: 404 }
      );
    }

    // Kiểm tra xem user đã có reaction chưa
    const existingReaction = await prisma.blogReaction.findUnique({
      where: {
        blogId_userId: {
          blogId: blog.id,
          userId,
        },
      },
    });

    let reaction;
    if (existingReaction) {
      // Nếu đã có reaction và cùng type, xóa reaction (toggle off)
      if (existingReaction.type === type) {
        await prisma.blogReaction.delete({
          where: { id: existingReaction.id },
        });
        return NextResponse.json({
          success: true,
          data: null,
          message: "Reaction removed",
        });
      } else {
        // Cập nhật reaction type
        reaction = await prisma.blogReaction.update({
          where: { id: existingReaction.id },
          data: { type },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        });
      }
    } else {
      // Tạo reaction mới
      reaction = await prisma.blogReaction.create({
        data: {
          blogId: blog.id,
          userId,
          type,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: reaction,
    });
  } catch (error: any) {
    console.error("Error creating reaction:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create reaction" },
      { status: 500 }
    );
  }
}

