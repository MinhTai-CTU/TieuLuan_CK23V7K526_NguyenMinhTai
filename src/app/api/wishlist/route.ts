import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";

/**
 * Get user's wishlist
 * GET /api/wishlist
 */
export async function GET(request: NextRequest) {
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

    const wishlistItems = await prisma.wishlistItem.findMany({
      where: { userId: decoded.userId },
      include: {
        product: {
          include: {
            images: true,
            category: true,
          },
        },
        productVariant: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format response
    const formattedItems = wishlistItems.map((item) => {
      const product = item.product;
      const variant = item.productVariant;
      const selectedOptions = (item.selectedOptions as any) || {};

      // Calculate base price from variant or product
      let basePrice = variant?.price ?? product.price;
      let baseDiscountedPrice =
        variant?.discountedPrice ?? product.discountedPrice ?? product.price;

      // Calculate additional price from selectedOptions (storage, type, sim)
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
      const price = basePrice + additionalPrice;
      const discountedPrice = baseDiscountedPrice + additionalPrice;

      const thumbnails = product.images
        .filter((img) => img.type === "THUMBNAIL")
        .map((img) => img.url);
      const previews = product.images
        .filter((img) => img.type === "PREVIEW")
        .map((img) => img.url);

      return {
        id: item.id,
        productId: product.id,
        productVariantId: item.productVariantId,
        selectedOptions: item.selectedOptions,
        title: product.title,
        slug: product.slug,
        price,
        discountedPrice,
        stock: variant?.stock ?? product.stock,
        hasVariants: product.hasVariants,
        reviews: product.reviews,
        imgs: {
          thumbnails:
            thumbnails.length > 0 ? thumbnails : ["/images/placeholder.png"],
          previews:
            previews.length > 0
              ? previews
              : thumbnails.length > 0
                ? thumbnails
                : ["/images/placeholder.png"],
        },
        category: product.category
          ? {
              id: product.category.id,
              title: product.category.title,
              slug: product.category.slug,
            }
          : null,
        createdAt: item.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedItems,
    });
  } catch (error: any) {
    console.error("Error fetching wishlist:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch wishlist",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Add product to wishlist
 * POST /api/wishlist
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { productId, productVariantId, selectedOptions } = body;

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          error: "Product ID is required",
        },
        { status: 400 }
      );
    }

    // Check if product exists and load variants if needed
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: true, // Load variants to find matching variant
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found",
        },
        { status: 404 }
      );
    }

    // If productVariantId is not provided but selectedOptions are provided,
    // try to find matching variant
    let finalVariantId = productVariantId || null;
    if (!finalVariantId && selectedOptions && product.hasVariants && product.variants) {
      const matchingVariant = product.variants.find((variant) => {
        const variantOptions = (variant.options as any) || {};
        const selectedOpts = selectedOptions || {};

        // Match by comparing options
        return Object.keys(selectedOpts).every((key) => {
          const variantValue = String(variantOptions[key] || "").trim();
          const selectedValue = String(selectedOpts[key] || "").trim();
          return (
            variantValue === selectedValue ||
            variantValue === selectedOpts[key] ||
            variantOptions[key] === selectedOpts[key]
          );
        });
      });

      if (matchingVariant) {
        finalVariantId = matchingVariant.id;
      } else if (product.variants.length > 0) {
        // If no exact match, use first variant as fallback
        finalVariantId = product.variants[0].id;
      }
    }

    // Check if already in wishlist
    // IMPORTANT: Compare by productId + productVariantId (similar to cart)
    // This ensures different variants/options create different wishlist items
    const allWishlistItems = await prisma.wishlistItem.findMany({
      where: {
        userId: decoded.userId,
        productId,
        productVariantId: finalVariantId || null,
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
    const existingItem = allWishlistItems.find((item) => {
      const normalizedItemOptions = normalizeOptions(item.selectedOptions);
      return normalizedItemOptions === normalizedNewOptions;
    });

    if (existingItem) {
      return NextResponse.json(
        {
          success: false,
          error: "Sản phẩm đã có trong danh sách yêu thích",
        },
        { status: 400 }
      );
    }

    // Add to wishlist
    const wishlistItem = await prisma.wishlistItem.create({
      data: {
        userId: decoded.userId,
        productId: productId,
        productVariantId: finalVariantId,
        selectedOptions: selectedOptions || null,
      },
      include: {
        product: {
          include: {
            images: true,
          },
        },
        productVariant: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Product added to wishlist",
      data: {
        id: wishlistItem.id,
        productId: wishlistItem.productId,
      },
    });
  } catch (error: any) {
    console.error("Error adding to wishlist:", error);

    // Handle unique constraint violation
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          error: "Product already in wishlist",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to add to wishlist",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
