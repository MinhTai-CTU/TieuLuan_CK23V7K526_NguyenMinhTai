import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

/**
 * Serve images dynamically from both /uploads/ and /images/
 * This route handles serving images in production mode
 * GET /api/uploads/banners/filename.jpg
 * GET /api/uploads/products/filename.jpg
 * GET /api/images/products/filename.png (for seed data)
 * etc.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathArray } = await params;
    const filePath = pathArray.join("/");

    // Security: Prevent path traversal attacks
    if (
      filePath.includes("..") ||
      filePath.includes("~") ||
      filePath.startsWith("/")
    ) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    // Try uploads first, then images (for seed data)
    // This allows serving both uploaded files and seed images
    let fullPath = join(process.cwd(), "public", "uploads", filePath);

    // If file doesn't exist in uploads, try images folder (for seed data)
    if (!existsSync(fullPath)) {
      const imagesPath = join(process.cwd(), "public", "images", filePath);
      if (existsSync(imagesPath)) {
        fullPath = imagesPath;
      }
    }

    // Check if file exists
    if (!existsSync(fullPath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Read file
    const fileBuffer = await readFile(fullPath);

    // Determine content type from file extension
    const extension = filePath.split(".").pop()?.toLowerCase();
    const contentTypeMap: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      gif: "image/gif",
      svg: "image/svg+xml",
    };
    const contentType =
      contentTypeMap[extension || ""] || "application/octet-stream";

    // Return file with appropriate headers
    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    console.error("Error serving file:", error);
    return NextResponse.json(
      { error: "Failed to serve file" },
      { status: 500 }
    );
  }
}
