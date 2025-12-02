import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isTokenExpired } from "@/lib/verification";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Verification token is required",
        },
        { status: 400 }
      );
    }

    // Find user by verification token
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired verification token",
        },
        { status: 400 }
      );
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return NextResponse.json(
        {
          success: true,
          message: "Email already verified",
          data: {
            email: user.email,
          },
        },
        { status: 200 }
      );
    }

    // Check if token is expired (24 hours)
    if (user.createdAt && isTokenExpired(user.createdAt)) {
      // Generate new token
      const { randomBytes } = await import("crypto");
      const newToken = randomBytes(32).toString("hex");

      await prisma.user.update({
        where: { id: user.id },
        data: {
          verificationToken: newToken,
        },
      });

      return NextResponse.json(
        {
          success: false,
          error:
            "Verification token has expired. A new verification email has been sent.",
        },
        { status: 400 }
      );
    }

    // Verify email
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verifiedAt: new Date(),
        verificationToken: null, // Clear token after verification
      },
    });

    return NextResponse.json({
      success: true,
      message: "Email verified successfully",
      data: {
        email: user.email,
      },
    });
  } catch (error: any) {
    console.error("Error verifying email:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to verify email",
      },
      { status: 500 }
    );
  }
}
