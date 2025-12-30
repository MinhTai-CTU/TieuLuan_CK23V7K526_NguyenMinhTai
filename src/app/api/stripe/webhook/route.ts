import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Disable body parsing for webhook - Stripe needs raw body for signature verification
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "No signature found" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSuccess(paymentIntent);
        break;

      case "payment_intent.payment_failed":
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailure(failedPayment);
        break;

      case "payment_intent.canceled":
        const canceledPayment = event.data.object as Stripe.PaymentIntent;
        await handlePaymentCanceled(canceledPayment);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook handler failed", details: error.message },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  try {
    const orderId = paymentIntent.metadata.orderId;

    if (!orderId) {
      console.error("No orderId found in payment intent metadata");
      return;
    }

    // Check if order exists and get current status (idempotency check)
    const existingOrder = await prisma.order.findUnique({
      where: { orderId },
      select: {
        paymentStatus: true,
        stripePaymentIntentId: true,
      },
    });

    if (!existingOrder) {
      console.error(`Order not found: ${orderId}`);
      return;
    }

    // Idempotency: Only update if not already paid
    if (existingOrder.paymentStatus === "PAID") {
      console.log(`Order ${orderId} already marked as paid, skipping update`);
      return;
    }

    // Verify payment intent ID matches (security check)
    if (
      existingOrder.stripePaymentIntentId &&
      existingOrder.stripePaymentIntentId !== paymentIntent.id
    ) {
      console.error(
        `Payment intent mismatch for order ${orderId}. Expected: ${existingOrder.stripePaymentIntentId}, Got: ${paymentIntent.id}`
      );
      return;
    }

    // Update order payment status
    // Theo quy trình: Sau khi thanh toán thành công (pre-paid) → tự động chuyển sang PROCESSING
    // Vì đã thanh toán rồi nên có thể bắt đầu chuẩn bị hàng ngay
    await prisma.order.update({
      where: { orderId },
      data: {
        paymentStatus: "PAID",
        status: "PROCESSING", // Tự động chuyển sang PROCESSING vì đã thanh toán
        stripePaymentIntentId: paymentIntent.id, // Ensure it's saved
      },
    });

    console.log(`✅ Payment succeeded for order: ${orderId} (via webhook)`);
  } catch (error) {
    console.error("Error handling payment success:", error);
    throw error;
  }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  try {
    const orderId = paymentIntent.metadata.orderId;

    if (!orderId) {
      console.error("No orderId found in payment intent metadata");
      return;
    }

    // Check if order exists (idempotency check)
    const existingOrder = await prisma.order.findUnique({
      where: { orderId },
      select: {
        paymentStatus: true,
      },
    });

    if (!existingOrder) {
      console.error(`Order not found: ${orderId}`);
      return;
    }

    // Only update if not already in a final state
    if (existingOrder.paymentStatus === "PAID") {
      console.log(
        `Order ${orderId} is already paid, not updating to failed status`
      );
      return;
    }

    // Update order payment status
    await prisma.order.update({
      where: { orderId },
      data: {
        paymentStatus: "FAILED",
      },
    });

    console.log(`❌ Payment failed for order: ${orderId} (via webhook)`);
  } catch (error) {
    console.error("Error handling payment failure:", error);
    throw error;
  }
}

async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
  try {
    const orderId = paymentIntent.metadata.orderId;

    if (!orderId) {
      console.error("No orderId found in payment intent metadata");
      return;
    }

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { orderId },
      select: {
        paymentStatus: true,
      },
    });

    if (!existingOrder) {
      console.error(`Order not found: ${orderId}`);
      return;
    }

    // Only update if not already paid
    if (existingOrder.paymentStatus === "PAID") {
      console.log(
        `Order ${orderId} is already paid, not updating to pending status`
      );
      return;
    }

    // Update order payment status
    await prisma.order.update({
      where: { orderId },
      data: {
        paymentStatus: "PENDING",
      },
    });

    console.log(`⚠️ Payment canceled for order: ${orderId} (via webhook)`);
  } catch (error) {
    console.error("Error handling payment canceled:", error);
    throw error;
  }
}
