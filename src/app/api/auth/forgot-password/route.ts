import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateVerificationToken } from "@/lib/verification"; // Tái sử dụng hàm sinh token random
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập email" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Email này chưa được đăng ký trong hệ thống.",
        },
        { status: 404 }
      );
    }

    // Sinh token và thời gian hết hạn (1 giờ)
    const resetToken = generateVerificationToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Lưu token vào cơ sở dữ liệu
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      },
    });

    try {
      await sendPasswordResetEmail(user.email, resetToken, user.name);

      return NextResponse.json(
        {
          success: true,
          message:
            "Email khôi phục đã được gửi. Vui lòng kiểm tra hộp thư đến.",
        },
        { status: 200 }
      );
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
      return NextResponse.json(
        { success: false, error: "Không thể gửi email. Vui lòng thử lại sau." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, error: "Đã xảy ra lỗi hệ thống." },
      { status: 500 }
    );
  }
}
