import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/middleware/auth"; // Giả sử path đúng

// GET /api/products/[id]/reviewable-orders
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const userId = getUserId(request); // Kiểm tra lại hàm này có cần await không nhé

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Lấy các order items:
    // 1. Của user này
    // 2. Trạng thái đã giao (DELIVERED)
    // 3. CHƯA có review nào (Lọc ngay tại đây)
    const orderItems = await prisma.orderItem.findMany({
      where: {
        productId,
        order: {
          userId,
          status: "DELIVERED",
        },
        // SỬA Ở ĐÂY: Lọc những item chưa có review
        // Nếu quan hệ là 1-1 (tên là reviews), dùng: reviews: null
        // Nếu quan hệ là 1-N (tên là reviews), dùng: reviews: { none: {} }
        // Dựa vào lỗi của bạn (nó là object), mình dùng cú pháp cho quan hệ 1-1:
        reviews: null,
      },
      include: {
        order: {
          select: {
            id: true,
            orderId: true,
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
        // Không cần select reviews nữa vì ta đã lọc ở where rồi
      },
    });

    // Map dữ liệu trả về client
    const reviewableItems = orderItems.map((item) => ({
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
