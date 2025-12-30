import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/middleware/auth";
import { PERMISSIONS } from "@/lib/permissions";

// PUT /api/admin/banners/[id] - Update banner
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check permission
    const permissionCheck = await requirePermission(
      request,
      PERMISSIONS.PRODUCTS_CREATE
    );
    if (permissionCheck) {
      return permissionCheck;
    }

    const { id } = await params;
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

    // Check if banner exists
    const existingBanner = await prisma.banner.findUnique({
      where: { id },
    });

    if (!existingBanner) {
      return NextResponse.json(
        { success: false, error: "Banner không tồn tại" },
        { status: 404 }
      );
    }

    // Validation
    if (title !== undefined && !title) {
      return NextResponse.json(
        { success: false, error: "Tiêu đề không được để trống" },
        { status: 400 }
      );
    }

    if (image !== undefined && !image) {
      return NextResponse.json(
        { success: false, error: "Hình ảnh không được để trống" },
        { status: 400 }
      );
    }

    // Xử lý logic order khi cập nhật
    if (order !== undefined && order !== existingBanner.order) {
      const oldOrder = existingBanner.order;
      const newOrder = order;

      if (newOrder < oldOrder) {
        // Di chuyển lên trên: tăng order của các banner từ newOrder đến oldOrder-1 lên 1
        await prisma.banner.updateMany({
          where: {
            id: { not: id },
            order: {
              gte: newOrder,
              lt: oldOrder,
            },
          },
          data: {
            order: {
              increment: 1,
            },
          },
        });
      } else {
        // Di chuyển xuống dưới: giảm order của các banner từ oldOrder+1 đến newOrder xuống 1
        await prisma.banner.updateMany({
          where: {
            id: { not: id },
            order: {
              gt: oldOrder,
              lte: newOrder,
            },
          },
          data: {
            order: {
              decrement: 1,
            },
          },
        });
      }
    }

    const banner = await prisma.banner.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(subtitle !== undefined && { subtitle: subtitle || null }),
        ...(description !== undefined && { description: description || null }),
        ...(image !== undefined && { image }),
        ...(link !== undefined && { link: link || null }),
        ...(buttonText !== undefined && { buttonText: buttonText || null }),
        ...(bgGradient !== undefined && { bgGradient: bgGradient || null }),
        ...(order !== undefined && { order }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ success: true, data: banner });
  } catch (error) {
    console.error("Error updating banner:", error);
    return NextResponse.json(
      { success: false, error: "Không thể cập nhật banner" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/banners/[id] - Delete banner
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check permission
    const permissionCheck = await requirePermission(
      request,
      PERMISSIONS.PRODUCTS_CREATE
    );
    if (permissionCheck) {
      return permissionCheck;
    }

    const { id } = await params;

    // Check if banner exists
    const existingBanner = await prisma.banner.findUnique({
      where: { id },
    });

    if (!existingBanner) {
      return NextResponse.json(
        { success: false, error: "Banner không tồn tại" },
        { status: 404 }
      );
    }

    await prisma.banner.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Đã xóa banner" });
  } catch (error) {
    console.error("Error deleting banner:", error);
    return NextResponse.json(
      { success: false, error: "Không thể xóa banner" },
      { status: 500 }
    );
  }
}
