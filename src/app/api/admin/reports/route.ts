import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/middleware/auth";
import { PERMISSIONS } from "@/lib/permissions";

// GET /api/admin/reports - Get reports data with date range
export async function GET(request: NextRequest) {
  try {
    const permissionCheck = await requirePermission(
      request,
      PERMISSIONS.REPORTS_VIEW
    );
    if (permissionCheck) {
      return permissionCheck;
    }

    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    const startDate = startDateStr
      ? new Date(startDateStr)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = endDateStr ? new Date(endDateStr) : new Date();

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // Revenue statistics
    const [
      totalRevenueResult,
      promotionCostResult,
      cancelledOrders,
      allOrders,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: {
          paymentStatus: "PAID",
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: {
          paymentStatus: "PAID",
          discountAmount: {
            not: null,
          },
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: { discountAmount: true },
      }),
      prisma.order.count({
        where: {
          status: "CANCELLED",
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      prisma.order.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
    ]);

    const totalRevenue = totalRevenueResult._sum.total || 0;
    const promotionCost = promotionCostResult._sum.discountAmount || 0;
    const cancelRate = allOrders > 0 ? (cancelledOrders / allOrders) * 100 : 0;

    // Daily revenue
    const dailyRevenue = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const dayRevenue = await prisma.order.aggregate({
        where: {
          paymentStatus: "PAID",
          createdAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
        _sum: { total: true },
      });

      dailyRevenue.push({
        date: dayStart.toISOString(),
        revenue: dayRevenue._sum.total || 0,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Best sellers
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          paymentStatus: "PAID",
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    const productSales = new Map<
      string,
      { id: string; title: string; totalSold: number; revenue: number }
    >();

    orderItems.forEach((item) => {
      const productId = item.productId;
      const existing = productSales.get(productId) || {
        id: item.product.id,
        title: item.product.title,
        totalSold: 0,
        revenue: 0,
      };
      existing.totalSold += item.quantity;
      existing.revenue += item.price * item.quantity;
      productSales.set(productId, existing);
    });

    const bestSellers = Array.from(productSales.values())
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 10);

    // Dead stock (products with stock > 0 but not sold in date range)
    // Improved logic: Find products that haven't been sold in the selected date range
    const soldProductIds = Array.from(productSales.keys());

    // Get all products with stock > 0 that were NOT sold in the date range
    const allProductsWithStock = await prisma.product.findMany({
      where: {
        stock: {
          gt: 0,
        },
        NOT: {
          id: {
            in: soldProductIds,
          },
        },
      },
      select: {
        id: true,
        title: true,
        stock: true,
      },
    });

    // Get last sold date for each product and calculate days since last sale
    const deadStockWithLastSold = await Promise.all(
      allProductsWithStock.map(async (product) => {
        const lastOrderItem = await prisma.orderItem.findFirst({
          where: {
            productId: product.id,
            order: {
              paymentStatus: "PAID", // Only count paid orders
            },
          },
          orderBy: {
            order: {
              createdAt: "desc",
            },
          },
          include: {
            order: {
              select: {
                createdAt: true,
              },
            },
          },
        });

        const lastSoldAt = lastOrderItem?.order.createdAt || null;
        const daysSinceLastSale = lastSoldAt
          ? Math.floor(
              (endDate.getTime() - lastSoldAt.getTime()) / (1000 * 60 * 60 * 24)
            )
          : null;

        return {
          id: product.id,
          title: product.title,
          stock: product.stock,
          lastSoldAt: lastSoldAt?.toISOString() || null,
          daysSinceLastSale,
        };
      })
    );

    // Filter: Only show products that haven't been sold in at least 30 days
    // or never sold at all
    const MIN_DAYS_SINCE_LAST_SALE = 30;
    const filteredDeadStock = deadStockWithLastSold.filter(
      (product) =>
        product.daysSinceLastSale === null ||
        product.daysSinceLastSale >= MIN_DAYS_SINCE_LAST_SALE
    );

    // Sort by days since last sale (longest first), then by stock (highest first)
    const sortedDeadStock = filteredDeadStock
      .sort((a, b) => {
        // Never sold products come first
        if (a.daysSinceLastSale === null && b.daysSinceLastSale !== null)
          return -1;
        if (a.daysSinceLastSale !== null && b.daysSinceLastSale === null)
          return 1;
        if (a.daysSinceLastSale === null && b.daysSinceLastSale === null)
          return b.stock - a.stock; // Sort by stock if both never sold

        // Sort by days since last sale (descending)
        if (a.daysSinceLastSale! !== b.daysSinceLastSale!) {
          return b.daysSinceLastSale! - a.daysSinceLastSale!;
        }
        // If same days, sort by stock (descending)
        return b.stock - a.stock;
      })
      .slice(0, 20) // Take top 20
      .map(({ daysSinceLastSale, ...rest }) => rest); // Remove daysSinceLastSale from response

    // Promotions statistics
    const ordersWithPromotions = await prisma.order.findMany({
      where: {
        promotionCode: {
          not: null,
        },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        promotionCode: true,
        total: true,
        discountAmount: true,
      },
    });

    const promotionStats = new Map<
      string,
      { usedCount: number; revenue: number; discountAmount: number }
    >();

    ordersWithPromotions.forEach((order) => {
      if (order.promotionCode) {
        const existing = promotionStats.get(order.promotionCode) || {
          usedCount: 0,
          revenue: 0,
          discountAmount: 0,
        };
        existing.usedCount += 1;
        existing.revenue += order.total;
        existing.discountAmount += order.discountAmount || 0;
        promotionStats.set(order.promotionCode, existing);
      }
    });

    // Get promotion details
    const promotionCodes = Array.from(promotionStats.keys());
    const promotions = await prisma.promotion.findMany({
      where: {
        code: {
          in: promotionCodes,
        },
      },
      select: {
        id: true,
        code: true,
      },
    });

    const promotionsData = promotions.map((promo) => {
      const stats = promotionStats.get(promo.code) || {
        usedCount: 0,
        revenue: 0,
        discountAmount: 0,
      };
      return {
        id: promo.id,
        code: promo.code,
        usedCount: stats.usedCount,
        revenue: stats.revenue,
        discountAmount: stats.discountAmount,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        revenue: {
          totalRevenue,
          promotionCost,
          cancelRate,
          dailyRevenue,
        },
        products: {
          bestSellers,
          deadStock: sortedDeadStock,
        },
        promotions: promotionsData.sort((a, b) => b.usedCount - a.usedCount),
      },
    });
  } catch (error: any) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { success: false, error: "Không thể tải dữ liệu báo cáo" },
      { status: 500 }
    );
  }
}
