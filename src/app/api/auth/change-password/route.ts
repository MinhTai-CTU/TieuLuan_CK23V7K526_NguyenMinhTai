import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  extractTokenFromHeader,
  verifyToken,
  generateToken,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";

/**
 * Change user password
 * POST /api/auth/change-password
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Không có token được cung cấp",
        },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        {
          success: false,
          error: "Token không hợp lệ hoặc đã hết hạn",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    // Basic validation
    if (!newPassword || !confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Mật khẩu mới và xác nhận mật khẩu là bắt buộc",
        },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Mật khẩu mới và xác nhận mật khẩu không khớp",
        },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: "Mật khẩu mới phải có ít nhất 6 ký tự",
        },
        { status: 400 }
      );
    }

    // Get user with password and provider
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        password: true,
        provider: true, // Check if OAuth user
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Tài khoản không tồn tại",
        },
        { status: 404 }
      );
    }

    // Check if user is OAuth user (Google/Facebook)
    const isOAuthUser =
      user.provider === "google" || user.provider === "facebook";

    // For OAuth users, currentPassword is not required
    if (!isOAuthUser) {
      // For regular users, currentPassword is required
      if (!currentPassword) {
        return NextResponse.json(
          {
            success: false,
            error: "Mật khẩu hiện tại là bắt buộc",
          },
          { status: 400 }
        );
      }

      // Verify current password for regular users
      if (!user.password) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Tài khoản chưa có mật khẩu. Vui lòng đặt mật khẩu trước khi đổi mật khẩu.",
          },
          { status: 400 }
        );
      }

      const isCurrentPasswordValid = await verifyPassword(
        currentPassword,
        user.password
      );

      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          {
            success: false,
            error: "Mật khẩu hiện tại không chính xác",
          },
          { status: 400 }
        );
      }
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        password: hashedPassword,
      },
    });

    // Generate new token
    const newToken = generateToken(user.id, user.email);

    // Set cookie for server-side access
    const isProduction = process.env.NODE_ENV === "production";
    const response = NextResponse.json({
      success: true,
      message: "Đổi mật khẩu thành công",
      data: {
        token: newToken,
      },
    });

    response.cookies.set("auth_token", newToken, {
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      sameSite: "lax",
      secure: isProduction,
    });

    return response;
  } catch (error: any) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Đã xảy ra lỗi khi đổi mật khẩu",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
