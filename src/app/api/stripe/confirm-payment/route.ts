import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/stripe/confirm-payment - Confirm payment and update order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, paymentIntentId } = body;

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          error: "Order ID is required",
        },
        { status: 400 }
      );
    }

    // Find order
    const order = await prisma.order.findUnique({
      where: { orderId },
      include: {
        items: true,
      },
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

    // If payment intent ID is provided, verify it matches
    if (paymentIntentId && order.stripePaymentIntentId !== paymentIntentId) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment intent mismatch",
        },
        { status: 400 }
      );
    }

    // Check if already paid (idempotency - webhook might have already updated)
    if (order.paymentStatus === "PAID") {
      // Return existing order without updating
      const existingOrder = await prisma.order.findUnique({
        where: { orderId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: true,
                },
              },
            },
          },
          shipping: true,
        },
      });

      return NextResponse.json(
        {
          success: true,
          data: existingOrder,
          message: "Order already confirmed (likely by webhook)",
        },
        { status: 200 }
      );
    }

    // Update order to paid status (fallback if webhook hasn't processed yet)
    // Theo quy trình: Sau khi thanh toán thành công (pre-paid) → tự động chuyển sang PROCESSING
    const updatedOrder = await prisma.order.update({
      where: { orderId },
      data: {
        paymentStatus: "PAID",
        status: "PROCESSING", // Tự động chuyển sang PROCESSING vì đã thanh toán
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
          },
        },
        shipping: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: updatedOrder,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error confirming payment:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to confirm payment",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
