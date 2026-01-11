import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId, requireAuth } from "@/middleware/auth";
import { hasRole, ROLES } from "@/lib/permissions";
import { notifyAllAdmins } from "@/lib/notifications";

// GET /api/orders - Get orders
// If userId in query params: return orders for that user (for My Account)
// If no userId but authenticated: return orders for current user
// If no userId and not authenticated: return empty array
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    let userId = searchParams.get("userId");
    const status = searchParams.get("status");

    // Check if user is admin
    const auth = requireAuth(request);
    let isAdmin = false;
    if (auth) {
      isAdmin = await hasRole(auth.userId, ROLES.ADMIN);
    }

    // If no userId in query params and user is not admin, filter by authenticated user
    // If user is admin, don't filter by userId (show all orders)
    if (!userId && !isAdmin) {
      const authenticatedUserId = getUserId(request);
      if (authenticatedUserId) {
        userId = authenticatedUserId;
      }
    }

    const where: any = {};
    // Only filter by userId if:
    // 1. userId is explicitly provided in query params, OR
    // 2. user is not admin (regular user sees only their orders)
    if (userId && !isAdmin) {
      where.userId = userId;
    }
    if (status) where.status = status;
    // Loại bỏ các đơn hàng có trạng thái thanh toán thất bại
    where.paymentStatus = {
      not: "FAILED",
    };

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
          },
        },
        shipping: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // In ra (log) danh sách đơn hàng để kiểm tra trường estimatedDeliveryDate
    if (orders.length > 0) {
      console.log("📋 Orders fetched from DB:", orders.length);
      orders.forEach((order, index) => {
        const estDate = order.shipping?.estimatedDeliveryDate;
        console.log(`Order ${index + 1} (${order.orderId}):`, {
          hasShipping: !!order.shipping,
          estimatedDeliveryDate: estDate,
          estimatedDeliveryDateType: typeof estDate,
          estimatedDeliveryDateValue: estDate
            ? new Date(estDate).toISOString()
            : null,
          estimatedDeliveryDateIsValid: estDate
            ? !isNaN(new Date(estDate).getTime())
            : false,
          shippingId: order.shipping?.id,
        });
      });
    }

    // Serialize orders to ensure DateTime fields are properly converted to ISO strings
    const serializedOrders = orders.map((order) => ({
      ...order,
      shipping: order.shipping
        ? {
            ...order.shipping,
            estimatedDeliveryDate: order.shipping.estimatedDeliveryDate
              ? new Date(order.shipping.estimatedDeliveryDate).toISOString()
              : null,
          }
        : null,
      createdAt: new Date(order.createdAt).toISOString(),
      updatedAt: new Date(order.updatedAt).toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: serializedOrders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch orders",
      },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create a new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      items,
      shipping,
      total,
      paymentMethod,
      promotionCode,
      discountAmount,
    } = body;

    console.log("📦 Creating order with promotionCode:", promotionCode);

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Order items are required",
        },
        { status: 400 }
      );
    }

    if (!total) {
      return NextResponse.json(
        {
          success: false,
          error: "Total is required",
        },
        { status: 400 }
      );
    }

    // Generate unique order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Determine initial status based on payment method
    // COD: PENDING (chờ xác nhận), paymentStatus: PENDING (chưa thanh toán)
    // Trả trước: PENDING (chờ thanh toán), paymentStatus: PENDING (chưa thanh toán)
    const isCOD = paymentMethod === "cod";
    const initialStatus = "PENDING"; // Cả COD và Trả trước đều bắt đầu từ PENDING
    const initialPaymentStatus = "PENDING"; // Cả hai đều chưa thanh toán ban đầu

    // Check stock availability and prepare for stock deduction
    const stockChecks = [];
    for (const item of items) {
      if (item.productVariantId) {
        // Check variant stock
        const variant = await prisma.productVariant.findUnique({
          where: { id: item.productVariantId },
        });
        if (!variant) {
          return NextResponse.json(
            {
              success: false,
              error: `Product variant not found for item`,
            },
            { status: 400 }
          );
        }
        if (variant.stock < item.quantity) {
          return NextResponse.json(
            {
              success: false,
              error: `Insufficient stock for variant. Available: ${variant.stock}, Required: ${item.quantity}`,
            },
            { status: 400 }
          );
        }
        stockChecks.push({
          type: "variant",
          id: item.productVariantId,
          quantity: item.quantity,
        });
      } else {
        // Check product stock
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });
        if (!product) {
          return NextResponse.json(
            {
              success: false,
              error: `Product not found`,
            },
            { status: 400 }
          );
        }

        // Nếu sản phẩm có biến thể nhưng request không có productVariantId -> Báo lỗi yêu cầu chọn phân loại
        if (product.hasVariants) {
          return NextResponse.json(
            {
              success: false,
              error: `Sản phẩm "${product.title}" cần chọn phân loại (màu sắc, dung lượng...). Vui lòng xóa khỏi giỏ và chọn lại.`,
            },
            { status: 400 }
          );
        }

        if (product.stock < item.quantity) {
          return NextResponse.json(
            {
              success: false,
              error: `Insufficient stock for product "${product.title}". Available: ${product.stock}, Required: ${item.quantity}`,
            },
            { status: 400 }
          );
        }
        stockChecks.push({
          type: "product",
          id: item.productId,
          quantity: item.quantity,
        });
      }
    }

    // Create order and deduct stock in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderId,
          userId: userId || null,
          total: parseFloat(total),
          status: initialStatus,
          paymentMethod: paymentMethod || null,
          paymentStatus: initialPaymentStatus,
          promotionCode: promotionCode || null,
          discountAmount: discountAmount ? parseFloat(discountAmount) : null,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              productVariantId: item.productVariantId || null,
              quantity: parseInt(item.quantity),
              price: parseFloat(item.price),
              discountedPrice: item.discountedPrice
                ? parseFloat(item.discountedPrice)
                : null,
              selectedOptions: item.selectedOptions || null,
            })),
          },
          ...(shipping && {
            shipping: {
              create: {
                fullName: shipping.fullName,
                email: shipping.email,
                phone: shipping.phone || null,
                address: shipping.address,
                city: shipping.city,
                postalCode: shipping.postalCode || null,
                country: shipping.country,
                method: shipping.method || null,
                estimatedDeliveryDate: shipping.estimatedDeliveryDate
                  ? (() => {
                      // Parse và validate estimatedDeliveryDate
                      const date = new Date(shipping.estimatedDeliveryDate);
                      if (isNaN(date.getTime())) {
                        console.error(
                          "❌ Invalid estimatedDeliveryDate:",
                          shipping.estimatedDeliveryDate
                        );
                        return null;
                      }
                      console.log("✅ Saving estimatedDeliveryDate:", {
                        input: shipping.estimatedDeliveryDate,
                        parsed: date.toISOString(),
                        date: date,
                      });
                      return date;
                    })()
                  : null,
              },
            },
          }),
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: true,
                },
              },
            },
          },
          shipping: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Deduct stock for each item
      for (const stockCheck of stockChecks) {
        if (stockCheck.type === "variant") {
          await tx.productVariant.update({
            where: { id: stockCheck.id },
            data: {
              stock: {
                decrement: stockCheck.quantity,
              },
            },
          });
        } else {
          await tx.product.update({
            where: { id: stockCheck.id },
            data: {
              stock: {
                decrement: stockCheck.quantity,
              },
            },
          });
        }
      }

      // Delete cart items for the user if userId is provided
      if (userId) {
        // Delete cart items that match the order items
        // If cartItemId is provided, delete by ID for precision
        // Otherwise, delete by productId and productVariantId
        const cartItemIdsToDelete: string[] = [];
        for (const item of items) {
          if ((item as any).cartItemId) {
            // Use specific cart item ID if provided
            cartItemIdsToDelete.push((item as any).cartItemId);
          } else {
            // Fallback: find and delete by productId and productVariantId
            const matchingCartItems = await tx.cartItem.findMany({
              where: {
                userId,
                productId: item.productId,
                productVariantId: item.productVariantId || null,
              },
            });
            matchingCartItems.forEach((cartItem) => {
              cartItemIdsToDelete.push(cartItem.id);
            });
          }
        }

        // Delete all matching cart items
        if (cartItemIdsToDelete.length > 0) {
          await tx.cartItem.deleteMany({
            where: {
              id: {
                in: cartItemIdsToDelete,
              },
            },
          });
        }
      }

      // Update promotion usedCount if promotionCode is provided
      if (promotionCode) {
        const promotionCodeUpper = promotionCode.toUpperCase().trim();
        console.log("🔍 Looking for promotion with code:", promotionCodeUpper);

        const promotion = await tx.promotion.findUnique({
          where: { code: promotionCodeUpper },
        });

        if (promotion) {
          console.log("✅ Found promotion:", {
            id: promotion.id,
            code: promotion.code,
            currentUsedCount: promotion.usedCount,
          });

          // Increment usedCount
          const updatedPromotion = await tx.promotion.update({
            where: { id: promotion.id },
            data: {
              usedCount: {
                increment: 1,
              },
            },
          });

          console.log("✅ Updated promotion usedCount:", {
            code: updatedPromotion.code,
            newUsedCount: updatedPromotion.usedCount,
          });
        } else {
          console.warn("⚠️ Promotion not found with code:", promotionCodeUpper);
        }
      } else {
        console.log("ℹ️ No promotion code provided for this order");
      }

      return newOrder;
    });

    // Debug: Log created order to verify estimatedDeliveryDate
    console.log("✅ Order created:", {
      orderId: order.orderId,
      hasShipping: !!order.shipping,
      estimatedDeliveryDate: order.shipping?.estimatedDeliveryDate,
      estimatedDeliveryDateType: typeof order.shipping?.estimatedDeliveryDate,
      estimatedDeliveryDateValue: order.shipping?.estimatedDeliveryDate
        ? new Date(order.shipping.estimatedDeliveryDate).toISOString()
        : null,
      shippingId: order.shipping?.id,
    });

    // Send notification to all admins about new order
    try {
      await notifyAllAdmins({
        type: "ORDER_CREATED",
        title: "Đơn hàng mới",
        message: `Đơn hàng ${order.orderId} đã được tạo bởi ${order.user.name || order.user.email}`,
        orderId: order.id,
      });
      console.log(
        "✅ Notification sent to all admins for order:",
        order.orderId
      );
    } catch (notificationError) {
      console.error("❌ Error sending notification:", notificationError);
      // Don't fail the order creation if notification fails
    }

    // Serialize order to ensure DateTime fields are properly converted to ISO strings
    const serializedOrder = {
      ...order,
      shipping: order.shipping
        ? {
            ...order.shipping,
            estimatedDeliveryDate: order.shipping.estimatedDeliveryDate
              ? new Date(order.shipping.estimatedDeliveryDate).toISOString()
              : null,
          }
        : null,
      createdAt: new Date(order.createdAt).toISOString(),
      updatedAt: new Date(order.updatedAt).toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        data: serializedOrder,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create order",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
