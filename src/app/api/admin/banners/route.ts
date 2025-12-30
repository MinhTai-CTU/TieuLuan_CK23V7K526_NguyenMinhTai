import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/middleware/auth";
import { PERMISSIONS } from "@/lib/permissions";

// GET /api/admin/banners - Get all banners (for admin)
export async function GET(request: NextRequest) {
  try {
    // Check permission - use PRODUCTS_CREATE as it's similar content management
    const permissionCheck = await requirePermission(
      request,
      PERMISSIONS.PRODUCTS_CREATE
    );
    if (permissionCheck) {
      return permissionCheck;
    }

    const banners = await prisma.banner.findMany({
      orderBy: {
        order: "asc",
      },
    });

    return NextResponse.json({ success: true, data: banners });
  } catch (error) {
    console.error("Error fetching banners:", error);
    return NextResponse.json(
      { success: false, error: "Không thể tải danh sách banners" },
      { status: 500 }
    );
  }
}

// POST /api/admin/banners - Create new banner
export async function POST(request: NextRequest) {
  try {
    // Check permission
    const permissionCheck = await requirePermission(
      request,
      PERMISSIONS.PRODUCTS_CREATE
    );
    if (permissionCheck) {
      return permissionCheck;
    }

    const body = await request.json();
    const {
      title,
      subtitle,
      description,
      image,
      link,
      buttonText,
      bgGradient,
      order,
      isActive,
    } = body;

    // Validation
    if (!title || !image) {
      return NextResponse.json(
        { success: false, error: "Tiêu đề và hình ảnh là bắt buộc" },
        { status: 400 }
      );
    }

    const newOrder = order || 0;

    // Nếu order mới nhỏ hơn order của banner hiện có, cần tăng order của các banner >= newOrder lên 1
    if (newOrder > 0) {
      await prisma.banner.updateMany({
        where: {
          order: {
            gte: newOrder,
          },
        },
        data: {
          order: {
            increment: 1,
          },
        },
      });
    }

    const banner = await prisma.banner.create({
      data: {
        title,
        subtitle: subtitle || null,
        description: description || null,
        image,
        link: link || null,
        buttonText: buttonText || null,
        bgGradient: bgGradient || null,
        order: newOrder,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({ success: true, data: banner });
  } catch (error) {
    console.error("Error creating banner:", error);
    return NextResponse.json(
      { success: false, error: "Không thể tạo banner" },
      { status: 500 }
    );
  }
}
