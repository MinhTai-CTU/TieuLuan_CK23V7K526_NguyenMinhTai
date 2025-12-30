import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/middleware/auth";

// GET /api/addresses - Get all addresses for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const addresses = await prisma.address.findMany({
      where: { userId: auth.userId },
      orderBy: [
        { isDefault: "desc" }, // Default address first
        { createdAt: "desc" }, // Then by creation date
      ],
    });

    return NextResponse.json({
      success: true,
      data: addresses,
    });
  } catch (error: any) {
    console.error("Error fetching addresses:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch addresses",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// POST /api/addresses - Create a new address
export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

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

    // Validate required fields
    if (
      !fullName ||
      !detailedAddress ||
      !city ||
      !district ||
      !ward ||
      fullName.trim() === "" ||
      detailedAddress.trim() === "" ||
      city.trim() === "" ||
      district.trim() === "" ||
      ward.trim() === ""
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
          details: {
            fullName: !fullName || fullName.trim() === "",
            address: !detailedAddress || detailedAddress.trim() === "",
            city: !city || city.trim() === "",
            district: !district || district.trim() === "",
            ward: !ward || ward.trim() === "",
          },
        },
        { status: 400 }
      );
    }

    // If setting as default, unset all other default addresses
    if (isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: auth.userId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Create new address
    const newAddress = await prisma.address.create({
      data: {
        userId: auth.userId,
        fullName,
        phone: phone || null,
        address: detailedAddress,
        city,
        cityId: cityId || null,
        district,
        districtId: districtId || null,
        ward,
        wardId: wardId || null,
        addressType: addressType || "home",
        isDefault: isDefault || false,
        country: "Vietnam",
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: newAddress,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating address:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create address",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
