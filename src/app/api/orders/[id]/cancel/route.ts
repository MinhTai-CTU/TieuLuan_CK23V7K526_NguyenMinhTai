import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";
import { notifyAllAdmins } from "@/lib/notifications";

/**
 * Cancel an order
 * POST /api/orders/[id]/cancel
 * Note: [id] here refers to orderId (the order identifier string, not the database id)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "No token provided",
        },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired token",
        },
        { status: 401 }
      );
    }

    const { id: orderId } = await params;

    // Find order
    const order = await prisma.order.findUnique({
      where: { orderId },
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: "Order not found",
        },
        { status: 404 }
      );
    }

    // Check if user owns this order
    if (order.userId !== decoded.userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 403 }
      );
    }

    // Check if order can be cancelled
    // Only allow cancellation if status is PENDING and payment is not PAID
    if (order.status !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          error: "Chỉ có thể hủy đơn hàng ở trạng thái 'Chờ xử lý'",
        },
        { status: 400 }
      );
    }

    if (order.paymentStatus === "PAID") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Không thể hủy đơn hàng đã thanh toán. Vui lòng liên hệ hỗ trợ.",
        },
        { status: 400 }
      );
    }

    // Get promotionCode before update
    const promotionCode = order.promotionCode;

    // Cancel order
    await prisma.order.update({
      where: { orderId },
      data: {
        status: "CANCELLED",
      },
    });

    // Decrease promotion usedCount if order had a promotion code
    if (promotionCode) {
      const promotion = await prisma.promotion.findUnique({
        where: { code: promotionCode.toUpperCase() },
      });

      if (promotion && promotion.usedCount > 0) {
        await prisma.promotion.update({
          where: { id: promotion.id },
          data: {
            usedCount: {
              decrement: 1,
            },
          },
        });
      }
    }

    // Send notification to all admins
    try {
      await notifyAllAdmins({
        type: "ORDER_CANCELLED",
        title: "Đơn hàng đã bị hủy",
        message: `Đơn hàng ${order.orderId} đã bị hủy bởi khách hàng`,
        orderId: order.id,
      });
    } catch (notificationError) {
      console.error("Error sending notification:", notificationError);
      // Don't fail the order cancellation if notification fails
    }

    return NextResponse.json({
      success: true,
      message: "Order cancelled successfully",
    });
  } catch (error: any) {
    console.error("Error cancelling order:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to cancel order",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
