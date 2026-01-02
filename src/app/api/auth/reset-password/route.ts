import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    // Validate dữ liệu đầu vào
    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: "Thiếu thông tin xác thực." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Liên kết xác thực không hợp lệ hoặc đã hết hạn.",
        },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return NextResponse.json(
      { success: true, message: "Đổi mật khẩu thành công!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, error: "Đã xảy ra lỗi hệ thống." },
      { status: 500 }
    );
  }
}
