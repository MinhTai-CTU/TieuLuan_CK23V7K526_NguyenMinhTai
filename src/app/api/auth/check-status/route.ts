import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";

/**
 * Check if user is still active and valid
 * GET /api/auth/check-status
 */
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
          isValid: false,
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
          isValid: false,
        },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        isActive: true,
        bannedAt: true,
        bannedReason: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
          isValid: false,
        },
        { status: 404 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: "Your account has been banned",
          isValid: false,
          isBanned: true,
          bannedAt: user.bannedAt,
          bannedReason: user.bannedReason,
        },
        { status: 403 }
      );
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return NextResponse.json(
        {
          success: false,
          error: "Email not verified",
          isValid: false,
          requiresVerification: true,
        },
        { status: 403 }
      );
    }

    // User is valid
    return NextResponse.json({
      success: true,
      isValid: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        isActive: user.isActive,
      },
    });
  } catch (error: any) {
    console.error("Error checking user status:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check user status",
        isValid: false,
      },
      { status: 500 }
    );
  }
}
