import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/middleware/auth";

// PUT /api/addresses/[id]/default - Set an address as default
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if address exists and belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: {
        id,
        userId: auth.userId,
      },
    });

    if (!existingAddress) {
      return NextResponse.json(
        { success: false, error: "Address not found" },
        { status: 404 }
      );
    }

    // Unset all other default addresses
    await prisma.address.updateMany({
      where: {
        userId: auth.userId,
        isDefault: true,
        id: { not: id }, // Exclude current address
      },
      data: {
        isDefault: false,
      },
    });

    // Set this address as default
    const updatedAddress = await prisma.address.update({
      where: { id },
      data: {
        isDefault: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedAddress,
    });
  } catch (error: any) {
    console.error("Error setting default address:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to set default address",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

