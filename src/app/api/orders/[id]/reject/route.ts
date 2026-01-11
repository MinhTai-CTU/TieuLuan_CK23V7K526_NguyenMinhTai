import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, getUserId } from "@/middleware/auth";
import { ROLES } from "@/lib/permissions";
import { createNotification } from "@/lib/notifications";

// POST /api/orders/[id]/reject - Reject a pending order (ADMIN only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Only ADMIN can reject orders
    const roleCheck = await requireRole(request, ROLES.ADMIN);
    if (roleCheck) {
      return roleCheck;
    }

    const adminId = getUserId(request);
    if (!adminId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    // Get the order
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
            productVariant: true,
          },
        },
        shipping: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Chỉ có thể từ chối đơn khi chưa thanh toán
    if (order.status !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot reject order with status: ${order.status}. Only PENDING orders can be rejected.`,
        },
        { status: 400 }
      );
    }

    if (order.paymentMethod !== "cod") {
      return NextResponse.json(
        {
          success: false,
          error: "Chỉ có thể hủy đơn hàng COD ở trạng thái 'Chờ xử lý'",
        },
        { status: 400 }
      );
    }

    // Lý do hủy đơn
    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Vui lòng nhập lý do hủy đơn hàng",
        },
        { status: 400 }
      );
    }

    // Lấy mã khuyến mãi trước khi cập nhật
    const promotionCode = order.promotionCode;
    const wasAlreadyCancelled = (order.status as string) === "CANCELLED";

    // Cập nhật trạng thái đơn hàng thành CANCELLED (bị từ chối) và lưu lý do hủy đơn.”
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancellationReason: reason.trim(),
      },
      include: {
        items: {
          include: {
            product: true,
            productVariant: true,
          },
        },
        shipping: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Giảm số lần sử dụng của mã khuyến mãi nếu đơn hàng có áp dụng mã khuyến mãi và trước đó chưa bị hủy.
    if (promotionCode && !wasAlreadyCancelled) {
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

    // If payment was made, mark payment status as REFUNDED
    if (order.paymentStatus === "PAID") {
      await prisma.order.update({
        where: { id },
        data: {
          paymentStatus: "REFUNDED",
        },
      });
    }

    // Fetch final order with all relations to ensure cancellationReason is included
    const finalOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
            productVariant: true,
          },
        },
        shipping: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Gửi thông báo khách hàng
    try {
      if (finalOrder.user?.id) {
        await createNotification({
          userId: finalOrder.user.id,
          type: "ORDER_REJECTED",
          title: "Đơn hàng bị từ chối",
          message: `Đơn hàng ${finalOrder.orderId} đã bị từ chối${reason ? `: ${reason}` : ""}`,
          orderId: finalOrder.id,
        });
        console.log("✅ Notification sent to customer:", finalOrder.user.email);
      }
    } catch (notificationError) {
      console.error("Error sending notification:", notificationError);
      // Don't fail the order rejection if notification fails
    }

    return NextResponse.json({
      success: true,
      message: "Order rejected successfully",
      data: finalOrder,
    });
  } catch (error: any) {
    console.error("Error rejecting order:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to reject order",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
