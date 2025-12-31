import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // 1. Lấy tham số type từ URL
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    // 2. Nếu type là FLASH_SALE -> Trả về 1 Object duy nhất
    if (type === "FLASH_SALE") {
      const flashSaleBanner = await prisma.banner.findFirst({
        where: {
          type: "FLASH_SALE",
        },
      });

      // Quan trọng: Trả về data là Object (flashSaleBanner), không phải mảng
      return NextResponse.json({
        success: true,
        data: flashSaleBanner,
      });
    }

    // 3. Nếu type là SLIDER -> Trả về Mảng các slider
    if (type === "SLIDER") {
      const sliders = await prisma.banner.findMany({
        where: { type: "SLIDER" },
        orderBy: { order: "asc" },
      });
      return NextResponse.json({ success: true, data: sliders });
    }

    // 4. Mặc định (nếu không truyền type) -> Trả về tất cả (cho mục đích debug hoặc list tổng)
    const allBanners = await prisma.banner.findMany({
      orderBy: { order: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: allBanners,
    });
  } catch (error) {
    console.error("Error fetching banners:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi Server" },
      { status: 500 }
    );
  }
}
