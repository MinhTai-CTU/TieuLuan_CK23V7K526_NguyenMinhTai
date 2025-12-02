import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// GET /api/cart - Get user's cart items
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: decoded.userId },
      include: {
        product: {
          include: {
            images: true,
          },
        },
        productVariant: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Map to response format
    const items = cartItems.map((item) => {
      const product = item.product;
      const variant = item.productVariant;

      // Use variant price if available, otherwise product price
      const price = variant?.price ?? product.price;
      const discountedPrice =
        variant?.discountedPrice ?? product.discountedPrice;

      // Map images
      const images = product.images || [];
      const thumbnails = images
        .filter((img) => img.type === "THUMBNAIL")
        .map((img) => img.url);
      const previews = images
        .filter((img) => img.type === "PREVIEW")
        .map((img) => img.url);

      return {
        id: item.id,
        productId: product.id,
        productVariantId: variant?.id || null,
        title: product.title,
        price,
        discountedPrice: discountedPrice ?? price,
        quantity: item.quantity,
        selectedOptions: item.selectedOptions as Record<string, any> | null,
        imgs: {
          thumbnails: thumbnails.length > 0 ? thumbnails : previews,
          previews: previews.length > 0 ? previews : thumbnails,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch cart" },
      { status: 500 }
    );
  }
}

// POST /api/cart - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productId, productVariantId, quantity, selectedOptions } = body;

    if (!productId || !quantity || quantity < 1) {
      return NextResponse.json(
        { success: false, error: "Product ID and quantity are required" },
        { status: 400 }
      );
    }

    // Check if item already exists
    // Use findFirst instead of findUnique because productVariantId can be null
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        userId: decoded.userId,
        productId,
        productVariantId: productVariantId || null,
      },
    });

    if (existingItem) {
      // Update quantity
      const updated = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
        include: {
          product: {
            include: { images: true },
          },
          productVariant: true,
        },
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: "Cart item updated",
      });
    } else {
      // Create new item
      const newItem = await prisma.cartItem.create({
        data: {
          userId: decoded.userId,
          productId,
          productVariantId: productVariantId || null,
          quantity,
          selectedOptions: selectedOptions || null,
        },
        include: {
          product: {
            include: { images: true },
          },
          productVariant: true,
        },
      });

      return NextResponse.json({
        success: true,
        data: newItem,
        message: "Item added to cart",
      });
    }
  } catch (error: any) {
    console.error("Error adding to cart:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Item already in cart" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to add to cart" },
      { status: 500 }
    );
  }
}

// PUT /api/cart - Update cart item quantity
export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { cartItemId, quantity } = body;

    if (!cartItemId || !quantity || quantity < 1) {
      return NextResponse.json(
        { success: false, error: "Cart item ID and quantity are required" },
        { status: 400 }
      );
    }

    // First verify the item belongs to the user
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        userId: decoded.userId,
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        { success: false, error: "Cart item not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.cartItem.update({
      where: {
        id: cartItemId,
      },
      data: { quantity },
      include: {
        product: {
          include: { images: true },
        },
        productVariant: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error("Error updating cart:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Cart item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update cart" },
      { status: 500 }
    );
  }
}

// DELETE /api/cart - Remove item from cart
export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const cartItemId = searchParams.get("id");
    const clearAll = searchParams.get("clearAll") === "true";

    if (clearAll) {
      // Clear all cart items
      await prisma.cartItem.deleteMany({
        where: { userId: decoded.userId },
      });

      return NextResponse.json({
        success: true,
        message: "Cart cleared",
      });
    }

    if (!cartItemId) {
      return NextResponse.json(
        { success: false, error: "Cart item ID is required" },
        { status: 400 }
      );
    }

    // First verify the item belongs to the user
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        userId: decoded.userId,
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        { success: false, error: "Cart item not found" },
        { status: 404 }
      );
    }

    await prisma.cartItem.delete({
      where: {
        id: cartItemId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Item removed from cart",
    });
  } catch (error: any) {
    console.error("Error removing from cart:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Cart item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to remove from cart" },
      { status: 500 }
    );
  }
}
