import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/products - Get all products
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search"); // Search query parameter
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

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
    } = body;

    // Validate required fields
    if (!title || !slug || !price) {
      return NextResponse.json(
        {
          success: false,
          error: "Title, slug, and price are required",
        },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        title,
        slug,
        description,
        price: parseFloat(price),
        discountedPrice: discountedPrice ? parseFloat(discountedPrice) : null,
        stock: stock ? parseInt(stock) : 0,
        categoryId: categoryId || null,
        images: images
          ? {
              create: images.map((img: { url: string; type?: string }) => ({
                url: img.url,
                type: img.type || "THUMBNAIL",
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        images: true,
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
