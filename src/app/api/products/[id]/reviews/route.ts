import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/middleware/auth";

// GET /api/products/[id]/reviews - Lấy danh sách đánh giá của sản phẩm
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;

    const reviews = await prisma.review.findMany({
      where: {
        productId,
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
        orderItem: {
          select: {
            id: true,
            selectedOptions: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: reviews,
    });
  } catch (error: any) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch reviews",
      },
      { status: 500 }
    );
  }
}

// POST /api/products/[id]/reviews - Tạo đánh giá mới
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
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

    const body = await request.json();
    const { rating, content, images, orderItemId } = body;

    // Validate required fields
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        {
          success: false,
          error: "Rating must be between 1 and 5",
        },
        { status: 400 }
      );
    }

    if (!orderItemId) {
      return NextResponse.json(
        {
          success: false,
          error: "OrderItemId is required",
        },
        { status: 400 }
      );
    }

    // Validate that content or images must be provided
    if (!content && (!images || images.length === 0)) {
      return NextResponse.json(
        {
          success: false,
          error: "Either content or images must be provided",
        },
        { status: 400 }
      );
    }

    // Kiểm tra orderItem có tồn tại và thuộc về user này không
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: {
        order: {
          select: {
            id: true,
            userId: true,
            status: true,
          },
        },
        product: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!orderItem) {
      return NextResponse.json(
        {
          success: false,
          error: "Order item not found",
        },
        { status: 404 }
      );
    }

    // Kiểm tra orderItem thuộc về user này
    if (orderItem.order.userId !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: "You can only review your own orders",
        },
        { status: 403 }
      );
    }

    // Kiểm tra đơn hàng đã giao chưa
    if (orderItem.order.status !== "DELIVERED") {
      return NextResponse.json(
        {
          success: false,
          error: "You can only review products from delivered orders",
        },
        { status: 400 }
      );
    }

    // Kiểm tra sản phẩm có khớp không
    if (orderItem.productId !== productId) {
      return NextResponse.json(
        {
          success: false,
          error: "Order item does not match this product",
        },
        { status: 400 }
      );
    }

    // Kiểm tra đã đánh giá chưa
    const existingReview = await prisma.review.findUnique({
      where: { orderItemId },
    });

    if (existingReview) {
      return NextResponse.json(
        {
          success: false,
          error: "You have already reviewed this order item",
        },
        { status: 400 }
      );
    }

    // Tạo đánh giá
    const review = await prisma.review.create({
      data: {
        productId,
        userId,
        orderItemId,
        rating,
        content: content || null,
        images: images || [],
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
        orderItem: {
          select: {
            id: true,
            selectedOptions: true,
          },
        },
      },
    });

    // Cập nhật số lượng reviews của sản phẩm
    const reviewCount = await prisma.review.count({
      where: { productId },
    });

    await prisma.product.update({
      where: { id: productId },
      data: {
        reviews: reviewCount,
      },
    });

    return NextResponse.json({
      success: true,
      data: review,
    });
  } catch (error: any) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create review",
      },
      { status: 500 }
    );
  }
}
