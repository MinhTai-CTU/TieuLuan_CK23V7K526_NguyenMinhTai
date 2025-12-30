import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/momo/confirm-payment - Confirm payment from redirect URL
// Được gọi từ frontend khi MoMo redirect về với resultCode
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, resultCode, message } = body;

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
        shipping: true,
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

    // Nếu đã thanh toán rồi, không cần cập nhật lại
    if (order.paymentStatus === "PAID") {
      return NextResponse.json({
        success: true,
        message: "Payment already confirmed",
        data: order,
      });
    }

    // resultCode = 0 nghĩa là thanh toán thành công
    if (resultCode === 0 || resultCode === "0") {
      // Cập nhật trạng thái thanh toán và đơn hàng
      // Theo quy trình: Sau khi thanh toán thành công (pre-paid) → tự động chuyển sang PROCESSING
      await prisma.order.update({
        where: { orderId },
        data: {
          paymentStatus: "PAID",
          status: "PROCESSING", // Tự động chuyển sang PROCESSING vì đã thanh toán
        },
      });

      console.log(
        `✅ MoMo payment confirmed from redirect for order: ${orderId}`
      );

      return NextResponse.json({
        success: true,
        message: "Payment confirmed successfully",
        data: {
          orderId,
          paymentStatus: "PAID",
          status: "PROCESSING",
        },
      });
    } else {
      // Thanh toán thất bại
      // Chỉ cập nhật paymentStatus = FAILED, giữ nguyên status = PENDING
      // (Không chuyển sang PROCESSING vì chưa có tiền)
      await prisma.order.update({
        where: { orderId },
        data: {
          paymentStatus: "FAILED",
          status: "PENDING", // Đảm bảo status vẫn là PENDING khi thanh toán thất bại
        },
      });

      console.log(
        `❌ MoMo payment failed from redirect for order: ${orderId}, message: ${message}`
      );

      return NextResponse.json({
        success: false,
        message: message || "Payment failed",
        data: {
          orderId,
          paymentStatus: "FAILED",
          status: "PENDING",
        },
      });
    }
  } catch (error: any) {
    console.error("Error confirming MoMo payment:", error);
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
