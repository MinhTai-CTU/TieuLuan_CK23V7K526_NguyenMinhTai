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
          error: "Email và mật khẩu là bắt buộc",
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
          error: "Email hoặc mật khẩu không chính xác",
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
            "Vui lòng xác minh email trước khi đăng nhập. Kiểm tra hộp thư đến của bạn để lấy liên kết xác minh.",
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
            "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ để biết thêm thông tin.",
          isBanned: true,
          bannedAt: user.bannedAt,
          bannedReason: user.bannedReason,
        },
        { status: 403 }
      );
    }

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    // Create response with user data and token
    const response = NextResponse.json({
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

    // Set cookie for server-side access
    const isProduction = process.env.NODE_ENV === "production";
    const cookieOptions = isProduction
      ? `Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax; Secure`
      : `Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`;

    response.cookies.set("auth_token", token, {
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      sameSite: "lax",
      secure: isProduction,
    });

    return response;
  } catch (error: any) {
    console.error("Error logging in:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Đã xảy ra lỗi khi đăng nhập",
      },
      { status: 500 }
    );
  }
}
