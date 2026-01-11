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

    // Kiểm tra xem người dùng có phải là chủ của đơn hàng này hay không
    if (order.userId !== decoded.userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 403 }
      );
    }

    //Kiểm tra xem đơn hàng có thể bị hủy hay không — chỉ cho phép hủy nếu trạng thái là PENDING và chưa được thanh toán.
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

    // Khi xử lý (thường là hủy đơn), nếu đơn hàng đã dùng voucher, thì cần hoàn lại 1 lượt sử dụng voucher.
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
