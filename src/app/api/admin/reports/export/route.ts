import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/middleware/auth";
import { PERMISSIONS } from "@/lib/permissions";

// GET /api/admin/reports/export - Export reports to CSV
export async function GET(request: NextRequest) {
  try {
    const permissionCheck = await requirePermission(
      request,
      PERMISSIONS.REPORTS_VIEW
    );
    if (permissionCheck) {
      return permissionCheck;
    }

    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    const startDate = startDateStr
      ? new Date(startDateStr)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = endDateStr ? new Date(endDateStr) : new Date();

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // Get all orders in date range
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Build CSV content
    const csvRows: string[] = [];

    // Header
    csvRows.push(
      "Mã đơn hàng,Ngày đặt,Trạng thái,Trạng thái thanh toán,Khách hàng,Email,Tổng tiền,Giảm giá,Mã khuyến mãi,Sản phẩm,Số lượng,Giá"
    );

    // Data rows
    orders.forEach((order) => {
      const customerName = order.user?.name || "Khách vãng lai";
      const customerEmail = order.user?.email || "";

      if (order.items.length === 0) {
        csvRows.push(
          `"${order.orderId}","${order.createdAt.toLocaleDateString("vi-VN")}","${order.status}","${order.paymentStatus}","${customerName}","${customerEmail}","${order.total}","${order.discountAmount || 0}","${order.promotionCode || ""}","","",""`
        );
      } else {
        order.items.forEach((item, index) => {
          if (index === 0) {
            csvRows.push(
              `"${order.orderId}","${order.createdAt.toLocaleDateString("vi-VN")}","${order.status}","${order.paymentStatus}","${customerName}","${customerEmail}","${order.total}","${order.discountAmount || 0}","${order.promotionCode || ""}","${item.product.title}","${item.quantity}","${item.price}"`
            );
          } else {
            csvRows.push(
              `"","","","","","","","","","${item.product.title}","${item.quantity}","${item.price}"`
            );
          }
        });
      }
    });

    const csvContent = csvRows.join("\n");
    const csvBuffer = Buffer.from("\uFEFF" + csvContent, "utf-8"); // BOM for Excel

    return new NextResponse(new Uint8Array(csvBuffer), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="bao-cao-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Error exporting reports:", error);
    return NextResponse.json(
      { success: false, error: "Không thể xuất dữ liệu" },
      { status: 500 }
    );
  }
}
