import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/orders/auto-cancel - Auto cancel unpaid orders after timeout
// This should be called by a cron job or scheduled task
export async function POST(request: NextRequest) {
  try {
    // Get timeout from query params or use default (15 minutes)
    const searchParams = request.nextUrl.searchParams;
    const timeoutMinutes = parseInt(searchParams.get("timeout") || "15", 10);

    // Calculate cutoff time
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - timeoutMinutes);

    // Find orders that:
    // 1. Are PENDING status
    // 2. Have paymentStatus = PENDING (not paid)
    // 3. Are NOT COD (paymentMethod !== "cod")
    // 4. Were created before cutoff time
    const ordersToCancel = await prisma.order.findMany({
      where: {
        status: "PENDING",
        paymentStatus: "PENDING",
        paymentMethod: {
          not: "cod", // Only cancel prepaid orders, not COD
        },
        createdAt: {
          lt: cutoffTime,
        },
      },
      select: {
        id: true,
        orderId: true,
        createdAt: true,
        promotionCode: true,
      },
    });

    if (ordersToCancel.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No orders to cancel",
        cancelled: 0,
      });
    }

    // Cancel all found orders
    const result = await prisma.order.updateMany({
      where: {
        id: {
          in: ordersToCancel.map((o) => o.id),
        },
      },
      data: {
        status: "CANCELLED",
        paymentStatus: "FAILED",
      },
    });

    // Decrease promotion usedCount for cancelled orders that had promotion codes
    const promotionCodesToDecrement = ordersToCancel
      .filter((o) => o.promotionCode)
      .map((o) => o.promotionCode!.toUpperCase());

    if (promotionCodesToDecrement.length > 0) {
      // Get unique promotion codes
      const uniquePromotionCodes = [...new Set(promotionCodesToDecrement)];

      // Count how many times each promotion code was used
      const promotionCounts: Record<string, number> = {};
      ordersToCancel.forEach((order) => {
        if (order.promotionCode) {
          const code = order.promotionCode.toUpperCase();
          promotionCounts[code] = (promotionCounts[code] || 0) + 1;
        }
      });

      // Decrement usedCount for each promotion
      for (const code of uniquePromotionCodes) {
        const promotion = await prisma.promotion.findUnique({
          where: { code },
        });

        if (promotion && promotion.usedCount > 0) {
          const decrementAmount = Math.min(
            promotionCounts[code],
            promotion.usedCount
          );
          if (decrementAmount > 0) {
            await prisma.promotion.update({
              where: { id: promotion.id },
              data: {
                usedCount: {
                  decrement: decrementAmount,
                },
              },
            });
          }
        }
      }
    }

    console.log(
      `✅ Auto-cancelled ${result.count} unpaid orders older than ${timeoutMinutes} minutes`
    );

    return NextResponse.json({
      success: true,
      message: `Cancelled ${result.count} unpaid orders`,
      cancelled: result.count,
      orders: ordersToCancel.map((o) => ({
        orderId: o.orderId,
        createdAt: o.createdAt,
      })),
    });
  } catch (error: any) {
    console.error("Error auto-cancelling orders:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to auto-cancel orders",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// GET /api/orders/auto-cancel - Check how many orders would be cancelled (dry run)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeoutMinutes = parseInt(searchParams.get("timeout") || "15", 10);

    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - timeoutMinutes);

    const ordersToCancel = await prisma.order.findMany({
      where: {
        status: "PENDING",
        paymentStatus: "PENDING",
        paymentMethod: {
          not: "cod",
        },
        createdAt: {
          lt: cutoffTime,
        },
      },
      select: {
        id: true,
        orderId: true,
        createdAt: true,
        paymentMethod: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Found ${ordersToCancel.length} orders that would be cancelled`,
      count: ordersToCancel.length,
      timeoutMinutes,
      orders: ordersToCancel,
    });
  } catch (error: any) {
    console.error("Error checking orders to cancel:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check orders",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
