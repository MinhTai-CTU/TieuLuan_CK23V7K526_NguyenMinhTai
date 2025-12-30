import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";

/**
 * Remove product from wishlist
 * DELETE /api/wishlist/[productId]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> | { productId: string } }
) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "No token provided",
        },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired token",
        },
        { status: 401 }
      );
    }

    // Handle both Promise and direct params (Next.js 13+ vs older versions)
    const resolvedParams = params instanceof Promise ? await params : params;
    const { productId } = resolvedParams;
    const searchParams = request.nextUrl.searchParams;
    const productVariantId = searchParams.get("productVariantId");
    const selectedOptionsParam = searchParams.get("selectedOptions");

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          error: "Product ID is required",
        },
        { status: 400 }
      );
    }

    // Parse selectedOptions if provided
    let selectedOptions: any = null;
    if (selectedOptionsParam) {
      try {
        selectedOptions = JSON.parse(selectedOptionsParam);
      } catch (e) {
        // Invalid JSON, ignore
      }
    }

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

    // Find all wishlist items for this product
    const allWishlistItems = await prisma.wishlistItem.findMany({
      where: {
        userId: decoded.userId,
        productId,
        productVariantId: productVariantId || null,
      },
    });

    if (allWishlistItems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Sản phẩm không tìm thấy trong danh sách yêu thích",
        },
        { status: 404 }
      );
    }

    // If variantId and selectedOptions provided, find exact match
    let wishlistItem = null;
    if (productVariantId || selectedOptions) {
      const normalizedTargetOptions = normalizeOptions(selectedOptions);
      wishlistItem = allWishlistItems.find((item) => {
        const normalizedItemOptions = normalizeOptions(item.selectedOptions);
        return normalizedItemOptions === normalizedTargetOptions;
      });
    } else {
      // If no variant/options, use first item with this productId (backward compatible)
      wishlistItem = allWishlistItems[0];
    }

    if (!wishlistItem) {
      return NextResponse.json(
        {
          success: false,
          error: "Sản phẩm không tìm thấy trong danh sách yêu thích",
        },
        { status: 404 }
      );
    }

    // Verify that the wishlist item belongs to the current user
    if (wishlistItem.userId !== decoded.userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Không có quyền xóa sản phẩm này",
        },
        { status: 403 }
      );
    }

    // Remove from wishlist using id (simpler and works with null productVariantId)
    await prisma.wishlistItem.delete({
      where: {
        id: wishlistItem.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Product removed from wishlist",
    });
  } catch (error: any) {
    console.error("Error removing from wishlist:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to remove from wishlist",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
