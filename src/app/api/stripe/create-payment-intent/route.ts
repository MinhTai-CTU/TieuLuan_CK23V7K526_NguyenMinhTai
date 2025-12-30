import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

// Check if Stripe is configured
if (!process.env.STRIPE_SECRET_KEY) {
  console.error(
    "❌ STRIPE_SECRET_KEY is not configured in environment variables"
  );
}

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-11-17.clover",
    })
  : null;

// POST /api/stripe/create-payment-intent - Create a Stripe Payment Intent
export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      console.error(
        "❌ Stripe is not configured. STRIPE_SECRET_KEY is missing."
      );
      return NextResponse.json(
        {
          success: false,
          error:
            "Stripe chưa được cấu hình. Vui lòng thêm STRIPE_SECRET_KEY vào file .env",
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { amount, currency = "vnd", orderId, metadata } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Amount is required and must be greater than 0",
        },
        { status: 400 }
      );
    }

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          error: "Order ID is required",
        },
        { status: 400 }
      );
    }

    // Verify order exists
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

    // Convert VND to smallest currency unit (cents for VND, but Stripe uses smallest unit)
    // For VND, amount is already in the smallest unit (đồng)
    const amountInSmallestUnit = Math.round(amount);

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInSmallestUnit,
      currency: currency.toLowerCase(),
      metadata: {
        orderId,
        ...metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Update order with payment intent ID
    await prisma.order.update({
      where: { orderId },
      data: {
        stripePaymentIntentId: paymentIntent.id,
        paymentMethod: "stripe",
        paymentStatus: "PENDING",
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create payment intent",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
