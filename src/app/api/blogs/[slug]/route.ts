import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId, requireRole } from "@/middleware/auth";
import { ROLES } from "@/lib/permissions";

// GET - Lấy blog theo slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const userId = getUserId(request);
    let isAdmin = false;
    if (userId) {
      const roleCheck = await requireRole(request, ROLES.ADMIN);
      isAdmin = roleCheck === null; // null means user has role
    }

    const where: any = { slug };
    // Nếu không phải admin, chỉ lấy published blogs
    if (!isAdmin) {
      where.published = true;
    }

    const blog = await prisma.blog.findFirst({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    if (!blog) {
      return NextResponse.json(
        {
          success: false,
          error: "Blog not found",
        },
        { status: 404 }
      );
    }

    // Tăng views khi xem (chỉ khi published và không có flag noIncrement)
    const noIncrement =
      request.nextUrl.searchParams.get("noIncrement") === "true";
    if (blog.published && !noIncrement) {
      await prisma.blog.update({
        where: { id: blog.id },
        data: { views: { increment: 1 } },
      });
      // Fetch lại blog để có views mới nhất
      const updatedBlog = await prisma.blog.findFirst({
        where: { id: blog.id },
        include: {
          author: {
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
        data: updatedBlog || blog,
      });
    }

    return NextResponse.json({
      success: true,
      data: blog,
    });
  } catch (error: any) {
    console.error("Error fetching blog:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch blog",
      },
      { status: 500 }
    );
  }
}
