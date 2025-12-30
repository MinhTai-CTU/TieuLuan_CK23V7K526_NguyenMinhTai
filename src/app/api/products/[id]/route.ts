import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireRole } from "@/middleware/auth";
import { PERMISSIONS, ROLES } from "@/lib/permissions";

// GET /api/products/[id] - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: true,
        variants: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PATCH /api/products/[id] - Update product
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check permission
    const permissionCheck = await requirePermission(
      request,
      PERMISSIONS.PRODUCTS_UPDATE
    );
    if (permissionCheck) {
      return permissionCheck;
    }

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
      hasVariants,
      attributes,
      variants,
      additionalInfo,
      images,
    } = body;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: { variants: true },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    // Validate price for non-variant products
    if (hasVariants === false && (!price || parseFloat(price) <= 0)) {
      return NextResponse.json(
        {
          success: false,
          error: "Price is required for products without variants",
        },
        { status: 400 }
      );
    }

    // Validate variants for variant products
    if (hasVariants === true) {
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

    // Prepare update data
    const updateData: any = {
      title,
      slug,
      description: description !== undefined ? description : undefined,
      hasVariants: hasVariants !== undefined ? hasVariants : undefined,
      categoryId: categoryId !== undefined ? categoryId || null : undefined,
      isActive: isActive !== undefined ? isActive : undefined,
      attributes: attributes !== undefined ? attributes : undefined,
      additionalInfo: additionalInfo !== undefined ? additionalInfo : undefined,
    };

    // Handle price/stock based on hasVariants
    if (hasVariants === true) {
      // For variant products, set price/stock to 0
      updateData.price = 0;
      updateData.discountedPrice = null;
      updateData.stock = 0;
    } else if (hasVariants === false) {
      // For non-variant products, use provided values
      updateData.price = price ? parseFloat(price) : undefined;
      updateData.discountedPrice =
        discountedPrice !== undefined
          ? discountedPrice
            ? parseFloat(discountedPrice)
            : null
          : undefined;
      updateData.stock = stock !== undefined ? parseInt(stock) : undefined;
    } else if (existingProduct.hasVariants === false) {
      // Keep existing behavior if hasVariants is not being changed
      updateData.price = price ? parseFloat(price) : undefined;
      updateData.discountedPrice =
        discountedPrice !== undefined
          ? discountedPrice
            ? parseFloat(discountedPrice)
            : null
          : undefined;
      updateData.stock = stock !== undefined ? parseInt(stock) : undefined;
    }

    // Handle images update
    if (images && Array.isArray(images)) {
      // Delete all existing images first
      await prisma.productImage.deleteMany({
        where: { productId: id },
      });

      // Create new images
      updateData.images = {
        create: images.map((img: { url: string; type?: string }) => ({
          url: img.url,
          type: img.type || "THUMBNAIL",
        })),
      };
    }

    // Handle variants update
    if (hasVariants === true && variants && Array.isArray(variants)) {
      // Delete all existing variants first
      await prisma.productVariant.deleteMany({
        where: { productId: id },
      });

      // Create new variants
      updateData.variants = {
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
    } else if (hasVariants === false && existingProduct.hasVariants === true) {
      // If switching from variants to non-variant, delete all variants
      await prisma.productVariant.deleteMany({
        where: { productId: id },
      });
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        images: true,
        variants: true,
      },
    });

    return NextResponse.json({ success: true, data: product });
  } catch (error: any) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Delete product
// Only ADMIN can delete products
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Only ADMIN can delete products
    const roleCheck = await requireRole(request, ROLES.ADMIN);
    if (roleCheck) {
      return roleCheck;
    }

    // Check permission
    const permissionCheck = await requirePermission(
      request,
      PERMISSIONS.PRODUCTS_DELETE
    );
    if (permissionCheck) {
      return permissionCheck;
    }

    const { id } = await params;

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Product deleted" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
