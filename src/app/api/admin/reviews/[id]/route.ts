import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/middleware/auth";
import { PERMISSIONS } from "@/lib/permissions";

// PATCH /api/admin/reviews/[id] - Admin trả lời đánh giá
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permissionCheck = await requirePermission(
      request,
      PERMISSIONS.USERS_MANAGE
    );
    if (permissionCheck) {
      return permissionCheck;
    }

    const { id } = await params;
    const body = await request.json();
    const { adminResponse } = body;

    if (!adminResponse || adminResponse.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "Nội dung phản hồi không được để trống",
        },
        { status: 400 }
      );
    }

    // Kiểm tra review có tồn tại không
    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      return NextResponse.json(
        {
          success: false,
          error: "Đánh giá không tồn tại",
        },
        { status: 404 }
      );
    }

    // Cập nhật phản hồi của admin
    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        adminResponse: adminResponse.trim(),
        adminResponseAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        orderItem: {
          select: {
            id: true,
            selectedOptions: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Đã cập nhật phản hồi thành công",
      data: updatedReview,
    });
  } catch (error: any) {
    console.error("Error updating review response:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể cập nhật phản hồi",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/reviews/[id]/response - Xóa phản hồi của admin
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permissionCheck = await requirePermission(
      request,
      PERMISSIONS.USERS_MANAGE
    );
    if (permissionCheck) {
      return permissionCheck;
    }

    const { id } = await params;

    // Kiểm tra review có tồn tại không
    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      return NextResponse.json(
        {
          success: false,
          error: "Đánh giá không tồn tại",
        },
        { status: 404 }
      );
    }

    // Xóa phản hồi của admin
    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        adminResponse: null,
        adminResponseAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        orderItem: {
          select: {
            id: true,
            selectedOptions: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Đã xóa phản hồi thành công",
      data: updatedReview,
    });
  } catch (error: any) {
    console.error("Error deleting review response:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Không thể xóa phản hồi",
      },
      { status: 500 }
    );
  }
}
