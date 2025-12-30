import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/middleware/auth";
import { PERMISSIONS } from "@/lib/permissions";

// GET /api/products - Get all products
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search"); // Search query parameter
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");

    const where: any = {
      isActive: true,
      ...(categoryId && { categoryId }),
    };

    // Add search filter if search query is provided
    if (search && search.trim()) {
      where.title = {
        contains: search.trim(),
        mode: "insensitive", // Case-insensitive search
      };
    }

    // Add price filter
    // Filter products where price or discountedPrice falls within range
    // For products with variants, we'll filter after mapping to check variant prices
    if (minPrice || maxPrice) {
      const priceConditions: any[] = [];
      
      if (minPrice && maxPrice) {
        priceConditions.push(
          {
            AND: [
              { hasVariants: false },
              {
                OR: [
                  {
                    AND: [
                      { discountedPrice: { not: null } },
                      { discountedPrice: { gte: parseFloat(minPrice), lte: parseFloat(maxPrice) } },
                    ],
                  },
                  {
                    AND: [
                      { OR: [{ discountedPrice: null }, { discountedPrice: { equals: null } }] },
                      { price: { gte: parseFloat(minPrice), lte: parseFloat(maxPrice) } },
                    ],
                  },
                ],
              },
            ],
          },
          {
            AND: [
              { hasVariants: true },
              {
                variants: {
                  some: {
                    OR: [
                      {
                        AND: [
                          { discountedPrice: { not: null } },
                          { discountedPrice: { gte: parseFloat(minPrice), lte: parseFloat(maxPrice) } },
                        ],
                      },
                      {
                        AND: [
                          { OR: [{ discountedPrice: null }, { discountedPrice: { equals: null } }] },
                          { price: { gte: parseFloat(minPrice), lte: parseFloat(maxPrice) } },
                        ],
                      },
                    ],
                  },
                },
              },
            ],
          }
        );
      } else if (minPrice) {
        priceConditions.push(
          {
            AND: [
              { hasVariants: false },
              {
                OR: [
                  { discountedPrice: { gte: parseFloat(minPrice) } },
                  {
                    AND: [
                      { OR: [{ discountedPrice: null }, { discountedPrice: { equals: null } }] },
                      { price: { gte: parseFloat(minPrice) } },
                    ],
                  },
                ],
              },
            ],
          },
          {
            AND: [
              { hasVariants: true },
              {
                variants: {
                  some: {
                    OR: [
                      { discountedPrice: { gte: parseFloat(minPrice) } },
                      {
                        AND: [
                          { OR: [{ discountedPrice: null }, { discountedPrice: { equals: null } }] },
                          { price: { gte: parseFloat(minPrice) } },
                        ],
                      },
                    ],
                  },
                },
              },
            ],
          }
        );
      } else if (maxPrice) {
        priceConditions.push(
          {
            AND: [
              { hasVariants: false },
              {
                OR: [
                  { discountedPrice: { lte: parseFloat(maxPrice) } },
                  {
                    AND: [
                      { OR: [{ discountedPrice: null }, { discountedPrice: { equals: null } }] },
                      { price: { lte: parseFloat(maxPrice) } },
                    ],
                  },
                ],
              },
            ],
          },
          {
            AND: [
              { hasVariants: true },
              {
                variants: {
                  some: {
                    OR: [
                      { discountedPrice: { lte: parseFloat(maxPrice) } },
                      {
                        AND: [
                          { OR: [{ discountedPrice: null }, { discountedPrice: { equals: null } }] },
                          { price: { lte: parseFloat(maxPrice) } },
                        ],
                      },
                    ],
                  },
                },
              },
            ],
          }
        );
      }
      
      if (priceConditions.length > 0) {
        where.OR = priceConditions;
      }
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          images: true,
          variants: {
            orderBy: {
              price: "asc", // Order variants by price ascending
            },
          },
        },
        take: limit ? parseInt(limit) : undefined,
        skip: offset ? parseInt(offset) : undefined,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Map products to include calculated prices from variants if needed
    const mappedProducts = products.map((product) => {
      let displayPrice = product.price;
      let displayDiscountedPrice = product.discountedPrice;

      // If product has variants, use the lowest price from variants
      if (product.hasVariants && product.variants.length > 0) {
        const lowestVariant = product.variants[0]; // Already sorted by price asc
        displayPrice = lowestVariant.price;
        displayDiscountedPrice = lowestVariant.discountedPrice;
      }

      return {
        ...product,
        price: displayPrice,
        discountedPrice: displayDiscountedPrice,
      };
    });

    return NextResponse.json({
      success: true,
      data: mappedProducts,
      total,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch products",
      },
      { status: 500 }
    );
  }
}

// POST /api/products - Create a new product
export async function POST(request: NextRequest) {
  try {
    // Check permission
    const permissionCheck = await requirePermission(
      request,
      PERMISSIONS.PRODUCTS_CREATE
    );
    if (permissionCheck) {
      return permissionCheck;
    }

    const body = await request.json();
    const {
      title,
      slug,
      description,
      price,
      discountedPrice,
      stock,
      categoryId,
      images,
      hasVariants,
      attributes,
      variants,
      additionalInfo,
    } = body;

    // Validate required fields
    if (!title || !slug) {
      return NextResponse.json(
        {
          success: false,
          error: "Title and slug are required",
        },
        { status: 400 }
      );
    }

    // Validate price for non-variant products
    if (!hasVariants && (!price || parseFloat(price) <= 0)) {
      return NextResponse.json(
        {
          success: false,
          error: "Price is required for products without variants",
        },
        { status: 400 }
      );
    }

    // Validate variants for variant products
    if (hasVariants) {
      if (!variants || !Array.isArray(variants) || variants.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error:
              "At least one variant is required for products with variants",
          },
          { status: 400 }
        );
      }

      // Validate each variant
      for (const variant of variants) {
        if (!variant.options || typeof variant.options !== "object") {
          return NextResponse.json(
            {
              success: false,
              error: "Each variant must have options",
            },
            { status: 400 }
          );
        }
        if (!variant.price || parseFloat(variant.price) <= 0) {
          return NextResponse.json(
            {
              success: false,
              error: "Each variant must have a valid price",
            },
            { status: 400 }
          );
        }
      }
    }

    // Prepare product data
    const productData: any = {
      title,
      slug,
      description: description || null,
      hasVariants: hasVariants || false,
      categoryId: categoryId || null,
      // For variant products, set price/stock to 0 or placeholder
      // For non-variant products, use provided values
      price: hasVariants ? 0 : parseFloat(price),
      discountedPrice: hasVariants
        ? null
        : discountedPrice
          ? parseFloat(discountedPrice)
          : null,
      stock: hasVariants ? 0 : stock ? parseInt(stock) : 0,
      attributes: attributes || null,
      additionalInfo: additionalInfo || null,
      images: images
        ? {
            create: images.map((img: { url: string; type?: string }) => ({
              url: img.url,
              type: img.type || "THUMBNAIL",
            })),
          }
        : undefined,
    };

    // Add variants if hasVariants is true
    if (hasVariants && variants && variants.length > 0) {
      productData.variants = {
        create: variants.map((variant: any) => ({
          options: variant.options,
          price: parseFloat(variant.price),
          discountedPrice: variant.discountedPrice
            ? parseFloat(variant.discountedPrice)
            : null,
          stock: variant.stock ? parseInt(variant.stock) : 0,
          sku: variant.sku || null,
          image: variant.image || null,
        })),
      };
    }

    const product = await prisma.product.create({
      data: productData,
      include: {
        category: true,
        images: true,
        variants: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: product,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating product:", error);

    // Handle unique constraint violation
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          error: "Product with this slug already exists",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create product",
      },
      { status: 500 }
    );
  }
}
