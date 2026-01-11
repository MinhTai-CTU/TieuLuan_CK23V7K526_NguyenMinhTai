import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/middleware/auth";
import { PERMISSIONS } from "@/lib/permissions";

const calculateSold = (product: any) => {
  let totalSold = 0;
  if (product.hasVariants) {
    totalSold = product.variants.reduce((acc: number, v: any) => {
      const variantSold =
        v.orderItems?.reduce(
          (sum: number, item: any) => sum + item.quantity,
          0
        ) || 0;
      return acc + variantSold;
    }, 0);
  } else {
    totalSold =
      product.orderItems?.reduce(
        (sum: number, item: any) => sum + item.quantity,
        0
      ) || 0;
  }
  return totalSold;
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort");

    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");

    const where: any = {
      isActive: true,
      ...(categoryId && { categoryId }),
    };

    if (search && search.trim()) {
      where.title = { contains: search.trim(), mode: "insensitive" };
    }

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
                      {
                        discountedPrice: {
                          gte: parseFloat(minPrice),
                          lte: parseFloat(maxPrice),
                        },
                      },
                    ],
                  },
                  {
                    AND: [
                      {
                        OR: [
                          { discountedPrice: null },
                          { discountedPrice: { equals: null } },
                        ],
                      },
                      {
                        price: {
                          gte: parseFloat(minPrice),
                          lte: parseFloat(maxPrice),
                        },
                      },
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
                          {
                            discountedPrice: {
                              gte: parseFloat(minPrice),
                              lte: parseFloat(maxPrice),
                            },
                          },
                        ],
                      },
                      {
                        AND: [
                          {
                            OR: [
                              { discountedPrice: null },
                              { discountedPrice: { equals: null } },
                            ],
                          },
                          {
                            price: {
                              gte: parseFloat(minPrice),
                              lte: parseFloat(maxPrice),
                            },
                          },
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
                      {
                        OR: [
                          { discountedPrice: null },
                          { discountedPrice: { equals: null } },
                        ],
                      },
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
                          {
                            OR: [
                              { discountedPrice: null },
                              { discountedPrice: { equals: null } },
                            ],
                          },
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
                      {
                        OR: [
                          { discountedPrice: null },
                          { discountedPrice: { equals: null } },
                        ],
                      },
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
                          {
                            OR: [
                              { discountedPrice: null },
                              { discountedPrice: { equals: null } },
                            ],
                          },
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

    let pagedProducts = [];
    let totalCount = 0;

    if (sort === "bestseller") {
      const allMatchingProducts = await prisma.product.findMany({
        where,
        include: {
          category: true,
          images: true,
          orderItems: { select: { quantity: true } },
          variants: {
            include: {
              orderItems: { select: { quantity: true } },
            },
            orderBy: { price: "asc" },
          },
        },
      });

      const productsWithSold = allMatchingProducts.map((p) => {
        let displayPrice = p.price;
        let displayDiscountedPrice = p.discountedPrice;
        if (p.hasVariants && p.variants.length > 0) {
          displayPrice = p.variants[0].price;
          displayDiscountedPrice = p.variants[0].discountedPrice;
        }

        return {
          ...p,
          price: displayPrice,
          discountedPrice: displayDiscountedPrice,
          sold: calculateSold(p),
          orderItems: undefined,
        };
      });

      productsWithSold.sort((a, b) => b.sold - a.sold);

      totalCount = productsWithSold.length;
      pagedProducts = productsWithSold.slice(offset, offset + limit);
    } else {
      let orderBy: any = { createdAt: "desc" };
      if (sort === "oldest") orderBy = { createdAt: "asc" };
      if (sort === "price_asc") orderBy = { price: "asc" };
      if (sort === "price_desc") orderBy = { price: "desc" };

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            category: true,
            images: true,
            variants: {
              orderBy: { price: "asc" },
            },
          },
          take: limit,
          skip: offset,
          orderBy: orderBy,
        }),
        prisma.product.count({ where }),
      ]);

      totalCount = total;

      pagedProducts = products.map((product) => {
        let displayPrice = product.price;
        let displayDiscountedPrice = product.discountedPrice;
        if (product.hasVariants && product.variants.length > 0) {
          const lowestVariant = product.variants[0];
          displayPrice = lowestVariant.price;
          displayDiscountedPrice = lowestVariant.discountedPrice;
        }
        return {
          ...product,
          price: displayPrice,
          discountedPrice: displayDiscountedPrice,
          sold: 0,
        };
      });
    }

    return NextResponse.json({
      success: true,
      data: pagedProducts,
      total: totalCount,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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

    if (!title || !slug) {
      return NextResponse.json(
        {
          success: false,
          error: "Title and slug are required",
        },
        { status: 400 }
      );
    }

    if (!hasVariants && (!price || parseFloat(price) <= 0)) {
      return NextResponse.json(
        {
          success: false,
          error: "Price is required for products without variants",
        },
        { status: 400 }
      );
    }

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

    const productData: any = {
      title,
      slug,
      description: description || null,
      hasVariants: hasVariants || false,
      categoryId: categoryId || null,
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
