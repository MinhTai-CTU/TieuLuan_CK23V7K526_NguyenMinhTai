import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/middleware/auth";

// GET - Lấy comments của blog
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

    // Fetch tất cả comments của blog
    const allComments = await prisma.blogComment.findMany({
      where: {
        blogId: blog.id,
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
      orderBy: {
        createdAt: "asc",
      },
    });

    // Xây dựng cấu trúc nested comments
    const buildCommentTree = (
      comments: typeof allComments,
      parentId: string | null = null
    ) => {
      return comments
        .filter((comment) => comment.parentId === parentId)
        .map((comment) => ({
          ...comment,
          replies: buildCommentTree(comments, comment.id),
        }));
    };

    const comments = buildCommentTree(allComments);

    // Sắp xếp lại top-level comments theo thời gian mới nhất
    comments.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({
      success: true,
      data: comments,
    });
  } catch (error: any) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST - Tạo comment mới
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
    const { content, parentId } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, error: "Content is required" },
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

    // Nếu có parentId, kiểm tra parent comment có tồn tại không
    if (parentId) {
      const parent = await prisma.blogComment.findUnique({
        where: { id: parentId },
        select: { blogId: true },
      });

      if (!parent || parent.blogId !== blog.id) {
        return NextResponse.json(
          { success: false, error: "Invalid parent comment" },
          { status: 400 }
        );
      }
    }

    const comment = await prisma.blogComment.create({
      data: {
        blogId: blog.id,
        userId,
        content: content.trim(),
        parentId: parentId || null,
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

    return NextResponse.json({
      success: true,
      data: comment,
    });
  } catch (error: any) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
