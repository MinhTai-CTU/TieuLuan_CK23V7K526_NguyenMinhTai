import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
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
            variants: true, // Include all variants for fallback logic
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
      const selectedOptions =
        (item.selectedOptions as Record<string, any>) || {};

      // Start with base price from variant or product
      let basePrice = variant?.price ?? product.price;
      let baseDiscountedPrice =
        variant?.discountedPrice ?? product.discountedPrice ?? basePrice;

      // Fallback: If product has variants but variant is null and price is 0,
      // try to find matching variant from product.variants (already loaded)
      if (product.hasVariants && !variant && basePrice === 0 && product.variants) {
        // Try to find matching variant by selectedOptions
        const matchingVariant = product.variants.find((v: any) => {
          const variantOptions = (v.options as any) || {};
          const selectedOpts = selectedOptions || {};

          // Match by comparing options
          const variantKeys = Object.keys(variantOptions).sort();
          const selectedKeys = Object.keys(selectedOpts).sort();

          if (variantKeys.length !== selectedKeys.length) return false;

          return variantKeys.every((key) => {
            const variantValue = String(variantOptions[key] || "").trim();
            const selectedValue = String(selectedOpts[key] || "").trim();
            return variantValue === selectedValue;
          });
        });

        if (matchingVariant) {
          basePrice = matchingVariant.price;
          baseDiscountedPrice =
            matchingVariant.discountedPrice ?? matchingVariant.price;
        } else if (product.variants.length > 0) {
          // If no exact match, use first variant as fallback
          basePrice = product.variants[0].price;
          baseDiscountedPrice =
            product.variants[0].discountedPrice ?? product.variants[0].price;
        }
      }

      // Calculate additional price from selected options (storage, type, sim)
      // Note: Color is usually part of variant, so we don't add color price separately
      let additionalPrice = 0;

      // Get product attributes to find option prices
      const attributes = (product.attributes as any) || {};
      const storages = attributes.storage || [];
      const types = attributes.type || [];
      const sims = attributes.sim || [];

      // Add storage price if selected
      if (selectedOptions.storage) {
        const storageOption = storages.find(
          (s: any) =>
            s.id === selectedOptions.storage ||
            s.title === selectedOptions.storage
        );
        if (storageOption?.price) {
          additionalPrice += storageOption.price;
        }
      }

      // Add type price if selected
      if (selectedOptions.type) {
        const typeOption = types.find(
          (t: any) =>
            t.id === selectedOptions.type || t.title === selectedOptions.type
        );
        if (typeOption?.price) {
          additionalPrice += typeOption.price;
        }
      }

      // Add sim price if selected
      if (selectedOptions.sim) {
        const simOption = sims.find(
          (s: any) =>
            s.id === selectedOptions.sim || s.title === selectedOptions.sim
        );
        if (simOption?.price) {
          additionalPrice += simOption.price;
        }
      }

      // Final price = base price + additional options price
      const finalPrice = basePrice + additionalPrice;
      const finalDiscountedPrice = baseDiscountedPrice + additionalPrice;

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
        price: finalPrice,
        discountedPrice: finalDiscountedPrice,
        quantity: item.quantity,
        selectedOptions: selectedOptions,
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
    // IMPORTANT: Compare by productId + productVariantId + selectedOptions
    // This ensures different options create different cart items
    // Fetch all cart items for this product to compare selectedOptions manually
    const allCartItems = await prisma.cartItem.findMany({
      where: {
        userId: decoded.userId,
        productId,
        productVariantId: productVariantId || null,
      },
    });

    // Normalize selectedOptions for comparison
    const normalizeOptions = (opts: any): string => {
      if (!opts || typeof opts !== "object") return "";
      return JSON.stringify(
        Object.entries(opts)
          .sort(([a], [b]) => a.localeCompare(b))
          .reduce(
            (acc, [key, value]) => {
              acc[key] = String(value || "").trim();
              return acc;
            },
            {} as Record<string, string>
          )
      );
    };

    const normalizedNewOptions = normalizeOptions(selectedOptions);

    // Find exact match: same productId, same variantId, AND same selectedOptions
    const existingItem = allCartItems.find((item) => {
      const normalizedItemOptions = normalizeOptions(item.selectedOptions);
      return normalizedItemOptions === normalizedNewOptions;
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
