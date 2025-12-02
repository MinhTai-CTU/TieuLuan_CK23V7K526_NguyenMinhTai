import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Extract token from Authorization header
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

    // Verify token
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

    // Get user with roles and permissions
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        dateOfBirth: true,
        emailVerified: true,
        isActive: true,
        bannedAt: true,
        bannedReason: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
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

    // Check if user account is active
    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: "Your account has been banned",
          isBanned: true,
          bannedAt: user.bannedAt,
          bannedReason: user.bannedReason,
        },
        { status: 403 }
      );
    }

    // Collect all permissions
    const permissions = new Set<string>();
    user.userRoles.forEach((userRole) => {
      userRole.role.rolePermissions.forEach((rolePermission) => {
        permissions.add(rolePermission.permission.name);
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          dateOfBirth: user.dateOfBirth?.toISOString() || null,
          emailVerified: user.emailVerified,
          isActive: user.isActive,
          roles: user.userRoles.map((ur) => ur.role.name),
          permissions: Array.from(permissions),
        },
      },
    });
  } catch (error: any) {
    console.error("Error getting user:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get user",
      },
      { status: 500 }
    );
  }
}
