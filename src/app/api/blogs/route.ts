import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId, requireRole } from "@/middleware/auth";
import { ROLES } from "@/lib/permissions";
// Helper function to create slug
const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
};

// GET - Lấy danh sách blog (published only cho customer, all cho admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const published = searchParams.get("published");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    const userId = getUserId(request);
    let isAdmin = false;
    if (userId) {
      const roleCheck = await requireRole(request, ROLES.ADMIN);
      isAdmin = roleCheck === null; // null means user has role
    }

    // Nếu không phải admin, chỉ lấy published blogs
    const where: any = {};
    if (!isAdmin) {
      where.published = true;
    } else if (published !== null) {
      where.published = published === "true";
    }

    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        take: limit ? parseInt(limit) : undefined,
        skip: offset ? parseInt(offset) : undefined,
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
      }),
      prisma.blog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: blogs,
      total,
    });
  } catch (error: any) {
    console.error("Error fetching blogs:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch blogs",
      },
      { status: 500 }
    );
  }
}

// POST - Tạo blog mới (mọi user đã đăng nhập)
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, content, excerpt, img, published = false } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      );
    }

    // Tạo slug từ title
    const slug = slugify(title);

    // Kiểm tra slug đã tồn tại chưa
    const existingBlog = await prisma.blog.findUnique({
      where: { slug },
    });

    let finalSlug = slug;
    if (existingBlog) {
      finalSlug = `${slug}-${Date.now()}`;
    }

    const blog = await prisma.blog.create({
      data: {
        title,
        slug: finalSlug,
        content: content || null,
        excerpt: excerpt || null,
        img: img || null,
        published: published === true,
        authorId: userId, // Lưu ID tác giả
      },
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
      data: blog,
    });
  } catch (error: any) {
    console.error("Error creating blog:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create blog",
      },
      { status: 500 }
    );
  }
}
