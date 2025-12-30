import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

/**
 * Serve static images from public/images/ (seed data)
 * This route handles serving seed images in production mode
 * GET /api/images/products/product-1-sm-1.png
 * GET /api/images/categories/categories-01.png
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

    // Construct full file path
    const fullPath = join(process.cwd(), "public", "images", filePath);

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
    console.error("Error serving image:", error);
    return NextResponse.json(
      { error: "Failed to serve image" },
      { status: 500 }
    );
  }
}

