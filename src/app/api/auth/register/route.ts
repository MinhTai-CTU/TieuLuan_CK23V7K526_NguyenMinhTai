import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { ROLES } from "@/lib/permissions";
import { generateVerificationToken } from "@/lib/verification";
import { sendVerificationEmail } from "@/lib/email";
import { generateAvatarFromInitial } from "@/lib/avatar";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

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

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Tài khoản với email này đã tồn tại",
        },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate verification token
    const verificationToken = generateVerificationToken();

    // Get CUSTOMER role
    const customerRole = await prisma.role.findUnique({
      where: { name: ROLES.CUSTOMER },
    });

    if (!customerRole) {
      return NextResponse.json(
        {
          success: false,
          error: "Vai trò khách hàng không tồn tại. Vui lòng chạy script seed.",
        },
        { status: 500 }
      );
    }

    // Generate avatar from initial letter if name is provided
    const avatarUrl = name ? generateAvatarFromInitial(name) : null;

    // Create user with CUSTOMER role
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        password: hashedPassword,
        avatar: avatarUrl, // Generated avatar from initial
        emailVerified: false,
        verificationToken,
        userRoles: {
          create: {
            roleId: customerRole.id,
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        emailVerified: true,
        createdAt: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    // Send verification email (don't wait for it to complete)
    sendVerificationEmail(email, verificationToken, name).catch((error) => {
      console.error("Failed to send verification email:", error);
      // Don't fail registration if email fails
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Tài khoản đã được tạo thành công. Vui lòng kiểm tra email để xác minh tài khoản.",
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            emailVerified: user.emailVerified,
            roles: user.userRoles.map((ur) => ur.role.name),
          },
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error registering user:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Đã xảy ra lỗi khi đăng ký tài khoản",
      },
      { status: 500 }
    );
  }
}
