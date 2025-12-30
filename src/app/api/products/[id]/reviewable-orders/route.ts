import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/middleware/auth";

// GET /api/products/[id]/reviewable-orders - Lấy danh sách order items có thể đánh giá
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const userId = getUserId(request);

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // Lấy các order items của user đã mua sản phẩm này và đã giao hàng
    const orderItems = await prisma.orderItem.findMany({
      where: {
        productId,
        order: {
          userId,
          status: "DELIVERED",
        },
      },
      include: {
        order: {
          select: {
            id: true,
            orderId: true,
            status: true,
            createdAt: true,
          },
        },
        product: {
          select: {
            id: true,
            title: true,
          },
        },
        productVariant: {
          select: {
            id: true,
            options: true,
          },
        },
        reviews: {
          select: {
            id: true,
          },
        },
      },
    });

    // Lọc các order items chưa được đánh giá
    const reviewableItems = orderItems
      .filter((item) => item.reviews.length === 0)
      .map((item) => ({
        id: item.id,
        orderId: item.order.orderId,
        quantity: item.quantity,
        selectedOptions: item.selectedOptions,
        productVariant: item.productVariant,
        orderDate: item.order.createdAt,
      }));

    return NextResponse.json({
      success: true,
      data: reviewableItems,
    });
  } catch (error: any) {
    console.error("Error fetching reviewable orders:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch reviewable orders",
      },
      { status: 500 }
    );
  }
}

