import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/middleware/auth";
import { PERMISSIONS } from "@/lib/permissions";

// GET /api/admin/promotions/[id] - Get promotion by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permissionCheck = await requirePermission(
      request,
      PERMISSIONS.USERS_MANAGE
    );
    if (permissionCheck) {
      return permissionCheck;
    }

    const { id } = await params;

    const promotion = await prisma.promotion.findUnique({
      where: { id },
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

    if (!promotion) {
      return NextResponse.json(
        {
          success: false,
          error: "Promotion not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: promotion });
  } catch (error) {
    console.error("Error fetching promotion:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch promotion" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/promotions/[id] - Update promotion
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permissionCheck = await requirePermission(
      request,
      PERMISSIONS.USERS_MANAGE
    );
    if (permissionCheck) {
      return permissionCheck;
    }

    const { id } = await params;
    const body = await request.json();

    // Check if promotion exists
    const existingPromotion = await prisma.promotion.findUnique({
      where: { id },
    });

    if (!existingPromotion) {
      return NextResponse.json(
        {
          success: false,
          error: "Promotion not found",
        },
        { status: 404 }
      );
    }

    // Handle toggle active (simple update)
    if (body.action === "toggleActive") {
      const updated = await prisma.promotion.update({
        where: { id },
        data: {
          isActive: !existingPromotion.isActive,
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
        message: "Promotion status updated",
        data: updated,
      });
    }

    // Full update
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

    // Validate dates if provided
    if (startDate && endDate) {
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
    }

    // Check if code already exists (if code is being changed)
    if (code && code.toUpperCase() !== existingPromotion.code) {
      const codeExists = await prisma.promotion.findUnique({
        where: { code: code.toUpperCase() },
      });

      if (codeExists) {
        return NextResponse.json(
          {
            success: false,
            error: "Mã khuyến mãi đã tồn tại",
          },
          { status: 400 }
        );
      }
    }

    // Update promotion
    const updateData: any = {};
    if (code !== undefined) updateData.code = code.toUpperCase();
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (scope !== undefined) updateData.scope = scope;
    if (type !== undefined) updateData.type = type;
    if (value !== undefined) updateData.value = parseFloat(value);
    if (maxDiscount !== undefined)
      updateData.maxDiscount = maxDiscount ? parseFloat(maxDiscount) : null;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (usageLimit !== undefined)
      updateData.usageLimit = usageLimit ? parseInt(usageLimit) : null;
    if (perUserLimit !== undefined)
      updateData.perUserLimit = perUserLimit ? parseInt(perUserLimit) : null;
    if (minOrderValue !== undefined)
      updateData.minOrderValue = minOrderValue
        ? parseFloat(minOrderValue)
        : null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await prisma.promotion.update({
      where: { id },
      data: updateData,
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

    // Update targets if provided
    if (targets !== undefined) {
      // Delete existing targets
      await prisma.promotionTarget.deleteMany({
        where: { promotionId: id },
      });

      // Create new targets
      if (targets.length > 0) {
        await prisma.promotionTarget.createMany({
          data: targets.map((target: any) => ({
            promotionId: id,
            productId: target.productId || null,
            variantId: target.variantId || null,
            specificValue: target.specificValue
              ? parseFloat(target.specificValue)
              : null,
          })),
        });
      }

      // Fetch updated promotion with targets
      const promotionWithTargets = await prisma.promotion.findUnique({
        where: { id },
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
        message: "Promotion updated successfully",
        data: promotionWithTargets,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Promotion updated successfully",
      data: updated,
    });
  } catch (error: any) {
    console.error("Error updating promotion:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update promotion",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/promotions/[id] - Delete promotion
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permissionCheck = await requirePermission(
      request,
      PERMISSIONS.USERS_MANAGE
    );
    if (permissionCheck) {
      return permissionCheck;
    }

    const { id } = await params;

    await prisma.promotion.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Promotion deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting promotion:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete promotion",
      },
      { status: 500 }
    );
  }
}
