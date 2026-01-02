import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

/**
 * OAuth callback API handler
 * Called by the OAuth callback page to get token
 * Returns JWT token to frontend
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      console.error("OAuth callback: No session found");
      return NextResponse.json(
        {
          success: false,
          error: "Không tìm thấy phiên đăng nhập",
        },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      console.error("OAuth callback: User not found in database");
      return NextResponse.json(
        {
          success: false,
          error: "Tài khoản không tồn tại",
        },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      console.error("OAuth callback: User account is banned");
      return NextResponse.json(
        {
          success: false,
          error: "Tài khoản của bạn đã bị khóa",
        },
        { status: 403 }
      );
    }

    // Get JWT token from session
    const token = (session as any).token;

    if (!token) {
      console.error("OAuth callback: JWT token not found in session");
      return NextResponse.json(
        {
          success: false,
          error: "Đã xảy ra lỗi khi tạo token",
        },
        { status: 500 }
      );
    }

    // Create response with token
    const response = NextResponse.json({
      success: true,
      token,
    });

    // Set cookie for server-side access
    const isProduction = process.env.NODE_ENV === "production";
    response.cookies.set("auth_token", token, {
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      sameSite: "lax",
      secure: isProduction,
    });

    return response;
  } catch (error: any) {
    console.error("OAuth callback error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Đã xảy ra lỗi khi đăng nhập qua OAuth",
      },
      { status: 500 }
    );
  }
}
