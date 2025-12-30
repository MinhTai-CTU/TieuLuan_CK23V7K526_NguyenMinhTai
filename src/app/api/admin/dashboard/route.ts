import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/middleware/auth";
import { PERMISSIONS } from "@/lib/permissions";

// GET /api/admin/dashboard - Get dashboard data (real-time)
export async function GET(request: NextRequest) {
  try {
    const permissionCheck = await requirePermission(
      request,
      PERMISSIONS.REPORTS_VIEW
    );
    if (permissionCheck) {
      return permissionCheck;
    }

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Calculate today's revenue
    const todayRevenueResult = await prisma.order.aggregate({
      where: {
        paymentStatus: "PAID",
        createdAt: {
          gte: today,
        },
      },
      _sum: { total: true },
    });
    const todayRevenue = todayRevenueResult._sum.total || 0;

    // Calculate yesterday's revenue
    const yesterdayRevenueResult = await prisma.order.aggregate({
      where: {
        paymentStatus: "PAID",
        createdAt: {
          gte: yesterday,
          lt: today,
        },
      },
      _sum: { total: true },
    });
    const yesterdayRevenue = yesterdayRevenueResult._sum.total || 0;

    // Calculate revenue change percent
    const revenueChangePercent =
      yesterdayRevenue > 0
        ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
        : todayRevenue > 0
          ? 100
          : 0;

    // Get new orders count (PENDING)
    const newOrdersCount = await prisma.order.count({
      where: {
        status: "PENDING",
      },
    });

    // Get low stock products count (including products with and without variants)
    // Logic: Hiển thị CẢ sản phẩm có variants VÀ không có variants
    // 1. Products WITHOUT variants: hasVariants = false, stock < 10
    const productsWithoutVariants = await prisma.product.findMany({
      where: {
        hasVariants: false,
        stock: {
          lt: 10,
        },
      },
      select: {
        id: true,
      },
    });

    // 2. Products WITH variants: hasVariants = true, có ít nhất 1 variant có stock < 10
    const productsWithVariants = await prisma.product.findMany({
      where: {
        hasVariants: true,
        variants: {
          some: {
            stock: {
              lt: 10,
            },
          },
        },
      },
      select: {
        id: true,
      },
    });

    // Tổng số sản phẩm tồn kho thấp = sản phẩm không có variants + sản phẩm có variants
    const lowStockCount =
      productsWithoutVariants.length + productsWithVariants.length;

    // Get detailed low stock products list
    // Query CẢ 2 loại: sản phẩm có variants VÀ không có variants
    const lowStockProducts = await prisma.product.findMany({
      where: {
        OR: [
          // Loại 1: Sản phẩm KHÔNG có variants (hasVariants = false) và stock < 10
          {
            hasVariants: false,
            stock: {
              lt: 10,
            },
          },
          // Loại 2: Sản phẩm CÓ variants (hasVariants = true) và có ít nhất 1 variant stock < 10
          {
            hasVariants: true,
            variants: {
              some: {
                stock: {
                  lt: 10,
                },
              },
            },
          },
        ],
      },
      include: {
        category: {
          select: {
            title: true,
          },
        },
        variants: {
          where: {
            stock: {
              lt: 10,
            },
          },
          select: {
            id: true,
            stock: true,
            options: true,
            sku: true,
          },
        },
        images: {
          where: {
            type: "THUMBNAIL",
          },
          take: 1,
          select: {
            url: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc", // Order by creation date instead of stock (stock may not be used for products with variants)
      },
      take: 50, // Limit to 50 products
    });

    // Get revenue for last 7 days
    const revenueLast7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const dayRevenue = await prisma.order.aggregate({
        where: {
          paymentStatus: "PAID",
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        _sum: { total: true },
      });

      revenueLast7Days.push({
        date: startOfDay.toISOString(),
        revenue: dayRevenue._sum.total || 0,
      });
    }

    // Get top 10 recent orders (PENDING)
    const recentOrders = await prisma.order.findMany({
      where: {
        status: "PENDING",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    // Get top 10 recent reviews
    const recentReviews = await prisma.review.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      data: {
        todayRevenue,
        yesterdayRevenue,
        revenueChangePercent,
        newOrdersCount,
        lowStockCount,
        lowStockProducts: lowStockProducts.map((product) => ({
          id: product.id,
          title: product.title,
          slug: product.slug,
          stock: product.stock,
          hasVariants: product.hasVariants,
          category: product.category?.title || null,
          image: product.images[0]?.url || null,
          variants: product.variants.map((variant) => ({
            id: variant.id,
            stock: variant.stock,
            options: variant.options,
            sku: variant.sku,
          })),
        })),
        revenueLast7Days,
        recentOrders: recentOrders.map((order) => ({
          id: order.id,
          orderId: order.orderId,
          total: order.total,
          status: order.status,
          createdAt: order.createdAt.toISOString(),
          user: order.user,
        })),
        recentReviews: recentReviews.map((review) => ({
          id: review.id,
          rating: review.rating,
          content: review.content,
          createdAt: review.createdAt.toISOString(),
          user: review.user,
          product: review.product,
        })),
      },
    });
  } catch (error: any) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Không thể tải dữ liệu dashboard",
      },
      { status: 500 }
    );
  }
}
