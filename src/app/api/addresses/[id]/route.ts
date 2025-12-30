import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/middleware/auth";

// GET /api/addresses/[id] - Get a specific address
export async function GET(
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
    const address = await prisma.address.findFirst({
      where: {
        id,
        userId: auth.userId, // Ensure user owns this address
      },
    });

    if (!address) {
      return NextResponse.json(
        { success: false, error: "Address not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: address,
    });
  } catch (error: any) {
    console.error("Error fetching address:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch address",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// PUT /api/addresses/[id] - Update an address
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
    const body = await request.json();
    const {
      fullName,
      phone,
      address: detailedAddress,
      city,
      cityId,
      district,
      districtId,
      ward,
      wardId,
      addressType,
      isDefault,
    } = body;

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

    // If setting as default, unset all other default addresses
    if (isDefault && !existingAddress.isDefault) {
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
    }

    // Update address
    const updatedAddress = await prisma.address.update({
      where: { id },
      data: {
        fullName: fullName ?? existingAddress.fullName,
        phone: phone !== undefined ? phone : existingAddress.phone,
        address: detailedAddress ?? existingAddress.address,
        city: city ?? existingAddress.city,
        cityId: cityId !== undefined ? cityId : existingAddress.cityId,
        district: district ?? existingAddress.district,
        districtId:
          districtId !== undefined ? districtId : existingAddress.districtId,
        ward: ward ?? existingAddress.ward,
        wardId: wardId !== undefined ? wardId : existingAddress.wardId,
        addressType: addressType ?? existingAddress.addressType,
        isDefault: isDefault !== undefined ? isDefault : existingAddress.isDefault,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedAddress,
    });
  } catch (error: any) {
    console.error("Error updating address:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update address",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE /api/addresses/[id] - Delete an address
export async function DELETE(
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

    // Delete address
    await prisma.address.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting address:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete address",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

