import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, getUserId } from "@/middleware/auth";
import { ROLES } from "@/lib/permissions";
import { createNotification } from "@/lib/notifications";

// POST /api/orders/[id]/approve - Approve a pending order (ADMIN only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Only ADMIN can approve orders
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

    // Only approve PENDING orders
    if (order.status !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot approve order with status: ${order.status}. Only PENDING orders can be approved.`,
        },
        { status: 400 }
      );
    }

    // Check payment status based on payment method
    // COD: paymentStatus = PENDING (chưa thanh toán) - OK để duyệt
    // Trả trước: paymentStatus = PAID (đã thanh toán) - OK để duyệt
    // Không duyệt nếu paymentStatus = FAILED
    if (order.paymentStatus === "FAILED") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cannot approve order with failed payment. Please check payment status.",
        },
        { status: 400 }
      );
    }

    // For prepaid orders, must be PAID before approval
    if (order.paymentMethod && order.paymentMethod !== "cod") {
      if (order.paymentStatus !== "PAID") {
        return NextResponse.json(
          {
            success: false,
            error:
              "Cannot approve prepaid order. Payment must be completed first.",
          },
          { status: 400 }
        );
      }
    }

    // Check if order has items
    if (!order.items || order.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot approve order without items",
        },
        { status: 400 }
      );
    }

    // Check stock availability for each item
    for (const item of order.items) {
      if (item.productVariantId) {
        // Check variant stock
        const variant = await prisma.productVariant.findUnique({
          where: { id: item.productVariantId },
        });
        if (!variant || variant.stock < item.quantity) {
          return NextResponse.json(
            {
              success: false,
              error: `Insufficient stock for variant. Available: ${variant?.stock || 0}, Required: ${item.quantity}`,
            },
            { status: 400 }
          );
        }
      } else {
        // Check product stock
        if (item.product.stock < item.quantity) {
          return NextResponse.json(
            {
              success: false,
              error: `Insufficient stock for product "${item.product.title}". Available: ${item.product.stock}, Required: ${item.quantity}`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Update order status to PROCESSING (approved)
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: "PROCESSING",
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

    // Deduct stock for each item
    for (const item of order.items) {
      if (item.productVariantId) {
        // Deduct variant stock
        await prisma.productVariant.update({
          where: { id: item.productVariantId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      } else {
        // Deduct product stock
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }
    }

    // Send notification to customer about order approval
    try {
      if (updatedOrder.user?.id) {
        await createNotification({
          userId: updatedOrder.user.id,
          type: "ORDER_APPROVED",
          title: "Đơn hàng đã được duyệt",
          message: `Đơn hàng ${updatedOrder.orderId} đã được duyệt và đang được chuẩn bị`,
          orderId: updatedOrder.id,
        });
        console.log("✅ Notification sent to customer:", updatedOrder.user.email);
      }
    } catch (notificationError) {
      console.error("Error sending notification:", notificationError);
      // Don't fail the order approval if notification fails
    }

    return NextResponse.json({
      success: true,
      message: "Order approved successfully",
      data: updatedOrder,
    });
  } catch (error: any) {
    console.error("Error approving order:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to approve order",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
