import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";
import { generateAvatarFromInitial } from "@/lib/avatar";

/**
 * Get user profile
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

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        dateOfBirth: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          ...user,
          dateOfBirth: user.dateOfBirth?.toISOString() || null,
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch profile",
      },
      { status: 500 }
    );
  }
}

/**
 * Update user profile
 */
export async function PUT(request: NextRequest) {
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
    const { name, dateOfBirth, avatar } = body;

    // Build update data
    const updateData: any = {};

    if (name !== undefined) {
      updateData.name = name || null;

      // If name changed and no avatar (or avatar is generated), regenerate avatar
      const currentUser = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { avatar: true },
      });

      // Only regenerate if avatar is a generated one (starts with http and contains ui-avatars)
      // or if user doesn't have an avatar
      if (
        !currentUser?.avatar ||
        currentUser.avatar.includes("ui-avatars.com")
      ) {
        updateData.avatar = generateAvatarFromInitial(name);
      }
    }

    if (dateOfBirth !== undefined) {
      updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    }

    // If avatar is explicitly provided (from upload), use it
    if (avatar !== undefined) {
      updateData.avatar = avatar || null;
    }

    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        dateOfBirth: true,
        emailVerified: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: {
          ...updatedUser,
          dateOfBirth: updatedUser.dateOfBirth?.toISOString() || null,
        },
      },
    });
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update profile",
      },
      { status: 500 }
    );
  }
}
