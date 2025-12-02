import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, generateToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Email and password are required",
        },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        avatar: true,
        dateOfBirth: true,
        emailVerified: true,
        isActive: true,
        bannedAt: true,
        bannedReason: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please verify your email before logging in. Check your inbox for the verification link.",
          requiresVerification: true,
        },
        { status: 403 }
      );
    }

    // Check if user account is active
    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Your account has been banned. Please contact support for more information.",
          isBanned: true,
          bannedAt: user.bannedAt,
          bannedReason: user.bannedReason,
        },
        { status: 403 }
      );
    }

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    // Return user data and token
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
          roles: user.userRoles.map((ur) => ur.role.name),
        },
        token,
      },
    });
  } catch (error: any) {
    console.error("Error logging in:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to login",
      },
      { status: 500 }
    );
  }
}
