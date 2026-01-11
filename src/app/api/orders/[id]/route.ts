import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/middleware/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { notifyAllAdmins, createNotification } from "@/lib/notifications";

// GET /api/orders/[id] - Get single order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check permission
    const permissionCheck = await requirePermission(
      request,
      PERMISSIONS.ORDERS_VIEW_ALL
    );
    if (permissionCheck) {
      return permissionCheck;
    }

    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
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

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

// PATCH /api/orders/[id] - Update order status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check permission
    const permissionCheck = await requirePermission(
      request,
      PERMISSIONS.ORDERS_UPDATE
    );
    if (permissionCheck) {
      return permissionCheck;
    }

    const { id } = await params;
    const body = await request.json();

    // Lấy trạng thái hiện tại của đơn hàng
    const currentOrder = await prisma.order.findUnique({
      where: { id },
      select: {
        paymentMethod: true,
        paymentStatus: true,
        status: true,
      },
    });

    if (!currentOrder) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Validate luồng trạng thái - chỉ cho phép chuyển sang bước tiếp theo
    const validNextStatuses: Record<string, string[]> = {
      PENDING: ["PROCESSING", "CANCELLED"], // Chỉ có thể chuyển sang Đang chuẩn bị hoặc Hủy
      PROCESSING: ["SHIPPED", "CANCELLED"], // Chỉ có thể chuyển sang Đang giao hàng hoặc Hủy
      SHIPPED: ["DELIVERED", "CANCELLED"], // Chỉ có thể chuyển sang Đã giao hoặc Hủy
      DELIVERED: [], // Đã giao rồi, không thể chuyển sang trạng thái nào khác
      CANCELLED: [], // Đã hủy, không thể chuyển sang trạng thái nào khác
    };

    const allowedStatuses = validNextStatuses[currentOrder.status] || [];

    // Cho phép giữ nguyên trạng thái hiện tại
    if (body.status === currentOrder.status) {
    } else if (!allowedStatuses.includes(body.status)) {
      const statusLabels: Record<string, string> = {
        PENDING: "Chờ xử lý",
        PROCESSING: "Đang chuẩn bị",
        SHIPPED: "Đang giao hàng",
        DELIVERED: "Đã giao",
        CANCELLED: "Đã hủy",
      };
      return NextResponse.json(
        {
          success: false,
          error: `Không thể chuyển từ "${statusLabels[currentOrder.status]}" sang "${statusLabels[body.status] || body.status}". Chỉ có thể chuyển sang bước tiếp theo.`,
        },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      status: body.status,
    };

    // Khi đơn hàng DELIVERED(đã giao) và là COD → cập nhật paymentStatus = PAID
    if (body.status === "DELIVERED" && currentOrder.paymentMethod === "cod") {
      if (currentOrder.paymentStatus === "PENDING") {
        updateData.paymentStatus = "PAID";
      }
    }

    // Get order with promotionCode before update
    const orderBeforeUpdate = await prisma.order.findUnique({
      where: { id },
      select: {
        promotionCode: true,
        status: true,
      },
    });

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            product: true,
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

    // Send notification to customer about order status update
    try {
      const statusLabels: Record<string, string> = {
        PENDING: "Chờ xử lý",
        PROCESSING: "Đang chuẩn bị",
        SHIPPED: "Đang giao hàng",
        DELIVERED: "Đã giao",
        CANCELLED: "Đã hủy",
      };

      // Send notification to the customer who placed the order
      if (order.user?.id) {
        await createNotification({
          userId: order.user.id,
          type: "ORDER_UPDATED",
          title: "Cập nhật đơn hàng",
          message: `Đơn hàng ${order.orderId} đã được cập nhật trạng thái thành "${statusLabels[order.status] || order.status}"`,
          orderId: order.id,
        });
        console.log("✅ Notification sent to customer:", order.user.email);
      }
    } catch (notificationError) {
      console.error("Error sending notification:", notificationError);
      // Don't fail the order update if notification fails
    }

    // Decrease promotion usedCount if order is cancelled and had a promotion code
    // Only decrease if order was not already cancelled before
    if (
      body.status === "CANCELLED" &&
      orderBeforeUpdate?.status !== "CANCELLED" &&
      orderBeforeUpdate?.promotionCode
    ) {
      const promotion = await prisma.promotion.findUnique({
        where: { code: orderBeforeUpdate.promotionCode.toUpperCase() },
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

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update order" },
      { status: 500 }
    );
  }
}
