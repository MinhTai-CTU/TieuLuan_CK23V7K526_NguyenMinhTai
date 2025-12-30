import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/middleware/auth";

/**
 * POST /api/promotions/validate - Validate and calculate promotion discount
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, subtotal, cartItems } = body;

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          error: "Mã khuyến mãi là bắt buộc",
        },
        { status: 400 }
      );
    }

    if (!subtotal || subtotal <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Giá trị đơn hàng không hợp lệ",
        },
        { status: 400 }
      );
    }

    // Find promotion by code
    const promotion = await prisma.promotion.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        targets: true,
      },
    });

    if (!promotion) {
      return NextResponse.json(
        {
          success: false,
          error: "Mã khuyến mãi không tồn tại",
        },
        { status: 404 }
      );
    }

    // Check if promotion is active
    if (!promotion.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: "Mã khuyến mãi đã bị vô hiệu hóa",
        },
        { status: 400 }
      );
    }

    // Check date validity
    const now = new Date();
    if (now < promotion.startDate || now > promotion.endDate) {
      return NextResponse.json(
        {
          success: false,
          error: "Mã khuyến mãi đã hết hạn hoặc chưa có hiệu lực",
        },
        { status: 400 }
      );
    }

    // Check usage limit
    if (
      promotion.usageLimit !== null &&
      promotion.usedCount >= promotion.usageLimit
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Mã khuyến mãi đã hết lượt sử dụng",
        },
        { status: 400 }
      );
    }

    // Check minimum order value
    if (promotion.minOrderValue && subtotal < promotion.minOrderValue) {
      return NextResponse.json(
        {
          success: false,
          error: `Đơn hàng tối thiểu ${promotion.minOrderValue.toLocaleString("vi-VN")} VNĐ để áp dụng mã này`,
        },
        { status: 400 }
      );
    }

    // Check per user limit
    const userId = getUserId(request);
    if (userId && promotion.perUserLimit !== null) {
      // Count how many times this user has used this promotion
      const userOrderCount = await prisma.order.count({
        where: {
          userId,
          promotionCode: promotion.code,
        },
      });

      if (userOrderCount >= promotion.perUserLimit) {
        return NextResponse.json(
          {
            success: false,
            error: "Bạn đã sử dụng hết lượt cho mã khuyến mãi này",
          },
          { status: 400 }
        );
      }
    }

    // Calculate discount based on promotion type
    let discountAmount = 0;
    let shippingDiscount = 0;
    let appliedToShipping = false;

    if (promotion.scope === "GLOBAL_ORDER") {
      // Apply to entire order or shipping
      if (
        promotion.type === "FREESHIP" ||
        promotion.type === "FREESHIP_PERCENTAGE"
      ) {
        // This is a shipping discount
        appliedToShipping = true;
        // Note: shippingDiscount will be calculated on frontend with actual shipping fee
      } else {
        // Regular discount on order
        if (promotion.type === "PERCENTAGE") {
          discountAmount = (subtotal * promotion.value) / 100;
          if (promotion.maxDiscount) {
            discountAmount = Math.min(discountAmount, promotion.maxDiscount);
          }
        } else if (promotion.type === "FIXED") {
          discountAmount = Math.min(promotion.value, subtotal);
        }
      }
    } else if (promotion.scope === "SPECIFIC_ITEMS") {
      // Apply to specific products in cart
      if (!cartItems || !Array.isArray(cartItems)) {
        return NextResponse.json(
          {
            success: false,
            error: "Thông tin giỏ hàng không hợp lệ",
          },
          { status: 400 }
        );
      }

      // Calculate discount for matching items
      for (const item of cartItems) {
        const matchingTarget = promotion.targets.find(
          (target) =>
            (target.productId === item.productId &&
              !target.variantId &&
              !item.productVariantId) ||
            (target.variantId === item.productVariantId &&
              item.productVariantId)
        );

        if (matchingTarget) {
          const itemPrice = item.discountedPrice || item.price;
          const itemSubtotal = itemPrice * item.quantity;
          const discountValue =
            matchingTarget.specificValue ?? promotion.value;

          if (promotion.type === "PERCENTAGE") {
            const itemDiscount = (itemSubtotal * discountValue) / 100;
            discountAmount += itemDiscount;
          } else if (promotion.type === "FIXED") {
            discountAmount += Math.min(discountValue, itemSubtotal);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        promotion: {
          id: promotion.id,
          code: promotion.code,
          name: promotion.name,
          scope: promotion.scope,
          type: promotion.type,
          value: promotion.value,
          maxDiscount: promotion.maxDiscount,
        },
        discountAmount,
        shippingDiscount,
        appliedToShipping,
      },
    });
  } catch (error: any) {
    console.error("Error validating promotion:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể kiểm tra mã khuyến mãi",
      },
      { status: 500 }
    );
  }
}

