import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { getUserId } from "@/middleware/auth";

/**
 * Upload review image
 * Accepts multipart/form-data with 'image' field
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: "No file provided",
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
          error: "Invalid file type. Only JPEG, PNG, and WebP are allowed.",
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
          error: "File size exceeds 5MB limit",
        },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split(".").pop();
    const filename = `review-${timestamp}-${randomString}.${extension}`;

    // Create uploads/reviews directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "reviews");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Save file
    const filePath = join(uploadsDir, filename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, new Uint8Array(buffer));

    // Return file URL
    // In production, use API route to serve images
    const fileUrl =
      process.env.NODE_ENV === "production"
        ? `/api/uploads/reviews/${filename}`
        : `/uploads/reviews/${filename}`;

    return NextResponse.json({
      success: true,
      data: {
        url: fileUrl,
      },
    });
  } catch (error: any) {
    console.error("Error uploading review image:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to upload image",
      },
      { status: 500 }
    );
  }
}
