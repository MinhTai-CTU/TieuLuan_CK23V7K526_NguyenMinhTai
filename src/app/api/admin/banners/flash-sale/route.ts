import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// XÓA dòng này vì API chạy trên server không dùng được localStorage
// import { getToken } from "@/lib/auth-storage";

export async function POST(request: NextRequest) {
  try {
    // --- 1. BẢO MẬT (Kiểm tra Token từ Header gửi lên) ---
    // Frontend gửi: headers: { Authorization: `Bearer ${token}` }
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split(" ")[1]; // Lấy phần token sau chữ Bearer

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Bạn chưa đăng nhập (Thiếu Token)" },
        { status: 401 }
      );
    }

    // Ở đây bạn có thể verify token nếu muốn (dùng jwt.verify...),
    // hoặc tạm thời bỏ qua nếu chỉ đang test logic lưu DB.
    // -----------------------------------------------------

    const body = await request.json();

    const {
      tagline,
      title,
      description,
      endDate,
      buttonText,
      image,
      isActive,
      link,
    } = body;

    // Validate
    if (!title) {
      return NextResponse.json(
        { success: false, error: "Tiêu đề không được để trống" },
        { status: 400 }
      );
    }

    // Tìm banner Flash Sale cũ
    const existingBanner = await prisma.banner.findFirst({
      where: {
        type: "FLASH_SALE", // Đảm bảo Schema Prisma đã có enum này và bạn đã chạy npx prisma generate
      },
    });

    let result;

    if (existingBanner) {
      // === UPDATE ===
      result = await prisma.banner.update({
        where: { id: existingBanner.id },
        data: {
          tagline,
          title,
          description,
          subtitle: description,
          // Chuyển đổi ngày an toàn hơn
          endDate: endDate ? new Date(endDate) : null,
          buttonText,
          image,
          link: link || "/flash-sale",
          isActive,
          type: "FLASH_SALE",
        },
      });
    } else {
      // === CREATE ===
      result = await prisma.banner.create({
        data: {
          tagline,
          title,
          description,
          endDate: endDate ? new Date(endDate) : null,
          buttonText,
          image: image || "",
          link: link || "/flash-sale",
          isActive: isActive !== undefined ? isActive : true,
          type: "FLASH_SALE", // Enum
          order: 1,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: existingBanner
        ? "Đã cập nhật cấu hình Flash Sale"
        : "Đã tạo mới cấu hình Flash Sale",
      data: result,
    });
  } catch (error) {
    console.error("Error saving flash sale:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Có lỗi xảy ra khi lưu cấu hình",
      },
      { status: 500 }
    );
  }
}
