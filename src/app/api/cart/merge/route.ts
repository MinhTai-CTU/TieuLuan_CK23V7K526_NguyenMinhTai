import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// POST /api/cart/merge - Merge guest cart (from localStorage) into user's database cart
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
    const { items } = body; // Array of { productId, productVariantId, quantity, selectedOptions }

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: "Items must be an array" },
        { status: 400 }
      );
    }

    const mergedItems = [];
    const errors = [];

    for (const item of items) {
      try {
        const { productId, productVariantId, quantity, selectedOptions } = item;

        if (!productId || !quantity || quantity < 1) {
          errors.push({ item, error: "Invalid item data" });
          continue;
        }

        // Check if item already exists in user's cart
        // Use findFirst instead of findUnique because productVariantId can be null
        const existingItem = await prisma.cartItem.findFirst({
          where: {
            userId: decoded.userId,
            productId,
            productVariantId: productVariantId || null,
          },
        });

        if (existingItem) {
          // Update quantity (merge)
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
          mergedItems.push(updated);
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
          mergedItems.push(newItem);
        }
      } catch (error: any) {
        console.error("Error merging cart item:", error);
        errors.push({ item, error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      data: mergedItems,
      errors: errors.length > 0 ? errors : undefined,
      message: `Merged ${mergedItems.length} item(s) to cart`,
    });
  } catch (error) {
    console.error("Error merging cart:", error);
    return NextResponse.json(
      { success: false, error: "Failed to merge cart" },
      { status: 500 }
    );
  }
}
