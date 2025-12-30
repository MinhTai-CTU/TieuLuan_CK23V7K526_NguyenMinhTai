import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, getUserId } from "@/middleware/auth";
import { PERMISSIONS } from "@/lib/permissions";

// GET /api/categories/[id] - Get single category
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch category" },
      { status: 500 }
    );
  }
}

// PATCH /api/categories/[id] - Update category
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check permission
    const permissionCheck = await requirePermission(
      request,
      PERMISSIONS.CATEGORIES_MANAGE
    );
    if (permissionCheck) {
      return permissionCheck;
    }

    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check user roles - only ADMIN can update categories
    const { getUserRoles, ROLES } = await import("@/lib/permissions");
    const userRoles = await getUserRoles(userId);
    const isAdmin = userRoles.includes(ROLES.ADMIN);

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Only ADMIN can update categories." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { title, slug, img, description } = body;

    // ADMIN updates directly
    const category = await prisma.category.update({
      where: { id },
      data: {
        title: title || undefined,
        slug: slug || undefined,
        img: img !== undefined ? img : undefined,
        description: description !== undefined ? description : undefined,
      },
    });

    return NextResponse.json({ success: true, data: category });
  } catch (error: any) {
    console.error("Error updating category:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          error: "Category with this slug already exists",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/[id] - Delete category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check permission
    const permissionCheck = await requirePermission(
      request,
      PERMISSIONS.CATEGORIES_MANAGE
    );
    if (permissionCheck) {
      return permissionCheck;
    }

    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check user roles - only ADMIN can delete categories
    const { getUserRoles, ROLES } = await import("@/lib/permissions");
    const userRoles = await getUserRoles(userId);
    const isAdmin = userRoles.includes(ROLES.ADMIN);

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Only ADMIN can delete categories." },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      );
    }

    // Check if category has products
    if (category._count.products > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete category. It has ${category._count.products} product(s).`,
        },
        { status: 400 }
      );
    }

    // ADMIN deletes directly
    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
