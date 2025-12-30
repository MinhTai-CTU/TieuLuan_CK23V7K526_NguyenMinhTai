import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const MOMO_SECRET_KEY = process.env.MOMO_SECRET_KEY || "";

// Helper function to verify MoMo signature
function verifyMoMoSignature(
  partnerCode: string,
  orderId: string,
  requestId: string,
  amount: number,
  orderInfo: string,
  orderType: string,
  transId: string,
  resultCode: number,
  message: string,
  payType: string,
  responseTime: number,
  extraData: string,
  secretKey: string,
  receivedSignature: string
): boolean {
  const rawSignature = `partnerCode=${partnerCode}&orderId=${orderId}&requestId=${requestId}&amount=${amount}&orderInfo=${orderInfo}&orderType=${orderType}&transId=${transId}&resultCode=${resultCode}&message=${message}&payType=${payType}&responseTime=${responseTime}&extraData=${extraData}`;

  const calculatedSignature = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");

  return calculatedSignature === receivedSignature;
}

// POST /api/momo/ipn - Handle MoMo IPN (Instant Payment Notification)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature,
    } = body;

    // Verify signature
    const isValidSignature = verifyMoMoSignature(
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      MOMO_SECRET_KEY,
      signature
    );

    if (!isValidSignature) {
      console.error("MoMo IPN signature verification failed");
      return NextResponse.json(
        {
          resultCode: 1001,
          message: "Signature verification failed",
        },
        { status: 400 }
      );
    }

    // Extract orderId from extraData if needed
    let extractedOrderId = orderId;
    try {
      const extraDataObj = JSON.parse(extraData || "{}");
      if (extraDataObj.orderId) {
        extractedOrderId = extraDataObj.orderId;
      }
    } catch (e) {
      console.error("Error parsing extraData:", e);
    }

    // Find order
    const order = await prisma.order.findUnique({
      where: { orderId: extractedOrderId },
    });

    if (!order) {
      console.error(`Order not found: ${extractedOrderId}`);
      return NextResponse.json(
        {
          resultCode: 1002,
          message: "Order not found",
        },
        { status: 404 }
      );
    }

    // Handle payment result
    // resultCode: 0 = success, other = failed
    if (resultCode === 0) {
      // Payment succeeded
      // Theo quy trình: Sau khi thanh toán thành công (pre-paid) → tự động chuyển sang PROCESSING
      await prisma.order.update({
        where: { orderId: extractedOrderId },
        data: {
          paymentStatus: "PAID",
          status: "PROCESSING", // Tự động chuyển sang PROCESSING vì đã thanh toán
          stripePaymentIntentId: transId || order.stripePaymentIntentId,
        },
      });

      console.log(`✅ MoMo payment succeeded for order: ${extractedOrderId}`);
    } else {
      // Payment failed
      // Chỉ cập nhật paymentStatus = FAILED, giữ nguyên status = PENDING
      // (Không chuyển sang PROCESSING vì chưa có tiền)
      await prisma.order.update({
        where: { orderId: extractedOrderId },
        data: {
          paymentStatus: "FAILED",
          status: "PENDING", // Đảm bảo status vẫn là PENDING khi thanh toán thất bại
        },
      });

      console.log(
        `❌ MoMo payment failed for order: ${extractedOrderId}, message: ${message}`
      );
    }

    // Return success response to MoMo
    return NextResponse.json({
      resultCode: 0,
      message: "Success",
    });
  } catch (error: any) {
    console.error("Error processing MoMo IPN:", error);
    return NextResponse.json(
      {
        resultCode: 1000,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
