import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { prisma } from "@/lib/prisma";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";

/**
 * Upload avatar file
 * Accepts multipart/form-data with 'avatar' field
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
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

    // Get form data
    const formData = await request.formData();
    const file = formData.get("avatar") as File;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: "Không có file được cung cấp",
        },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Định dạng file không hợp lệ. Chỉ cho phép JPEG, PNG và WebP.",
        },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: "Kích thước file quá lớn. Kích thước tối đa là 5MB.",
        },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "avatars");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split(".").pop() || "jpg";
    const filename = `${decoded.userId}-${timestamp}-${randomString}.${fileExtension}`;
    const filepath = join(uploadsDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, new Uint8Array(buffer));

    // Generate public URL
    // In production, use API route to serve images
    const avatarUrl =
      process.env.NODE_ENV === "production"
        ? `/api/uploads/avatars/${filename}`
        : `/uploads/avatars/${filename}`;

    // Update user avatar in database
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { avatar: avatarUrl },
    });

    return NextResponse.json({
      success: true,
      message: "Ảnh đại diện đã được tải lên thành công",
      data: {
        avatarUrl,
      },
    });
  } catch (error: any) {
    console.error("Error uploading avatar:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Đã xảy ra lỗi khi tải lên ảnh đại diện",
      },
      { status: 500 }
    );
  }
}
