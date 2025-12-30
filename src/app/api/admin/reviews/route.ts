import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/middleware/auth";
import { PERMISSIONS } from "@/lib/permissions";

// GET /api/admin/reviews - Lấy tất cả đánh giá (cho admin)
export async function GET(request: NextRequest) {
  try {
    const permissionCheck = await requirePermission(
      request,
      PERMISSIONS.USERS_MANAGE
    );
    if (permissionCheck) {
      return permissionCheck;
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    const reviews = await prisma.review.findMany({
      where: productId ? { productId } : undefined,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        orderItem: {
          select: {
            id: true,
            selectedOptions: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: reviews,
    });
  } catch (error: any) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Không thể tải danh sách đánh giá",
      },
      { status: 500 }
    );
  }
}
