import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/products/[id] - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: {
        id: id,
      },
      include: {
        category: true,
        images: true,
        variants: {
          orderBy: {
            price: "asc", // Order variants by price ascending
          },
        },
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

    // Calculate display price from variants if needed
    let displayPrice = product.price;
    let displayDiscountedPrice = product.discountedPrice;

    // If product has variants, use the lowest price from variants
    if (product.hasVariants && product.variants.length > 0) {
      const lowestVariant = product.variants[0]; // Already sorted by price asc
      displayPrice = lowestVariant.price;
      displayDiscountedPrice = lowestVariant.discountedPrice;
    }

    return NextResponse.json({
      success: true,
      data: {
        ...product,
        price: displayPrice,
        discountedPrice: displayDiscountedPrice,
      },
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch product",
      },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      title,
      slug,
      description,
      price,
      discountedPrice,
      stock,
      categoryId,
      isActive,
    } = body;

    const product = await prisma.product.update({
      where: {
        id: id,
      },
      data: {
        ...(title && { title }),
        ...(slug && { slug }),
        ...(description !== undefined && { description }),
        ...(price && { price: parseFloat(price) }),
        ...(discountedPrice !== undefined && {
          discountedPrice: discountedPrice ? parseFloat(discountedPrice) : null,
        }),
        ...(stock !== undefined && { stock: parseInt(stock) }),
        ...(categoryId !== undefined && { categoryId: categoryId || null }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        category: true,
        images: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    console.error("Error updating product:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update product",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.product.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting product:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete product",
      },
      { status: 500 }
    );
  }
}
