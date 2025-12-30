import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/middleware/auth";
import { PERMISSIONS } from "@/lib/permissions";

// GET /api/admin/promotions - Get all promotions
export async function GET(request: NextRequest) {
  try {
    // Check permission
    const permissionCheck = await requirePermission(
      request,
      PERMISSIONS.USERS_MANAGE
    );
    if (permissionCheck) {
      return permissionCheck;
    }

    const promotions = await prisma.promotion.findMany({
      include: {
        targets: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
            variant: {
              select: {
                id: true,
                sku: true,
                options: true,
                product: {
                  select: {
                    id: true,
                    title: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ success: true, data: promotions });
  } catch (error) {
    console.error("Error fetching promotions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch promotions" },
      { status: 500 }
    );
  }
}

// POST /api/admin/promotions - Create new promotion
export async function POST(request: NextRequest) {
  try {
    // Check permission
    const permissionCheck = await requirePermission(
      request,
      PERMISSIONS.USERS_MANAGE
    );
    if (permissionCheck) {
      return permissionCheck;
    }

    const body = await request.json();
    const {
      code,
      name,
      description,
      scope,
      type,
      value,
      maxDiscount,
      startDate,
      endDate,
      usageLimit,
      perUserLimit,
      minOrderValue,
      isActive,
      targets,
    } = body;

    // Validate required fields
    if (
      !code ||
      !scope ||
      !type ||
      value === undefined ||
      !startDate ||
      !endDate
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return NextResponse.json(
        {
          success: false,
          error: "End date must be after start date",
        },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existingPromotion = await prisma.promotion.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existingPromotion) {
      return NextResponse.json(
        {
          success: false,
          error: "Mã khuyến mãi đã tồn tại",
        },
        { status: 400 }
      );
    }

    // Create promotion
    const promotion = await prisma.promotion.create({
      data: {
        code: code.toUpperCase(),
        name,
        description,
        scope,
        type,
        value: parseFloat(value),
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        startDate: start,
        endDate: end,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        perUserLimit: perUserLimit ? parseInt(perUserLimit) : null,
        minOrderValue: minOrderValue ? parseFloat(minOrderValue) : null,
        isActive: isActive !== undefined ? isActive : true,
        targets: targets
          ? {
              create: targets.map((target: any) => ({
                productId: target.productId || null,
                variantId: target.variantId || null,
                specificValue: target.specificValue
                  ? parseFloat(target.specificValue)
                  : null,
              })),
            }
          : undefined,
      },
      include: {
        targets: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
            variant: {
              select: {
                id: true,
                sku: true,
                options: true,
                product: {
                  select: {
                    id: true,
                    title: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Promotion created successfully",
      data: promotion,
    });
  } catch (error: any) {
    console.error("Error creating promotion:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create promotion",
      },
      { status: 500 }
    );
  }
}
