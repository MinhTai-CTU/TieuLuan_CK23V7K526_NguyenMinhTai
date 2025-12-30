import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/middleware/auth";
import { PERMISSIONS } from "@/lib/permissions";
import * as XLSX from "xlsx";

// GET /api/admin/reports/export/excel - Export reports to Excel
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

    // Prepare data for Excel
    type ExcelRow = {
      "Mã đơn hàng": string;
      "Ngày đặt": string;
      "Trạng thái": string;
      "Trạng thái thanh toán": string;
      "Khách hàng": string;
      Email: string;
      "Tổng tiền": number;
      "Giảm giá": number;
      "Mã khuyến mãi": string;
      "Sản phẩm": string;
      "Số lượng": number;
      Giá: number;
    };

    const ordersData: ExcelRow[] = orders.flatMap((order) => {
      const customerName = order.user?.name || "Khách vãng lai";
      const customerEmail = order.user?.email || "";

      if (order.items.length === 0) {
        return [
          {
            "Mã đơn hàng": order.orderId,
            "Ngày đặt": order.createdAt.toLocaleDateString("vi-VN"),
            "Trạng thái": String(order.status),
            "Trạng thái thanh toán": String(order.paymentStatus),
            "Khách hàng": customerName,
            Email: customerEmail,
            "Tổng tiền": order.total,
            "Giảm giá": order.discountAmount || 0,
            "Mã khuyến mãi": order.promotionCode || "",
            "Sản phẩm": "",
            "Số lượng": 0,
            Giá: 0,
          },
        ];
      }

      return order.items.map(
        (item, index): ExcelRow => ({
          "Mã đơn hàng": index === 0 ? order.orderId : "",
          "Ngày đặt":
            index === 0 ? order.createdAt.toLocaleDateString("vi-VN") : "",
          "Trạng thái": index === 0 ? String(order.status) : "",
          "Trạng thái thanh toán":
            index === 0 ? String(order.paymentStatus) : "",
          "Khách hàng": index === 0 ? customerName : "",
          Email: index === 0 ? customerEmail : "",
          "Tổng tiền": index === 0 ? order.total : 0,
          "Giảm giá": index === 0 ? order.discountAmount || 0 : 0,
          "Mã khuyến mãi": index === 0 ? order.promotionCode || "" : "",
          "Sản phẩm": item.product.title,
          "Số lượng": item.quantity,
          Giá: item.price,
        })
      );
    });

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(ordersData);

    // Set column widths
    const colWidths = [
      { wch: 15 }, // Mã đơn hàng
      { wch: 12 }, // Ngày đặt
      { wch: 12 }, // Trạng thái
      { wch: 15 }, // Trạng thái thanh toán
      { wch: 20 }, // Khách hàng
      { wch: 25 }, // Email
      { wch: 12 }, // Tổng tiền
      { wch: 12 }, // Giảm giá
      { wch: 15 }, // Mã khuyến mãi
      { wch: 30 }, // Sản phẩm
      { wch: 10 }, // Số lượng
      { wch: 12 }, // Giá
    ];
    ws["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "Báo cáo đơn hàng");

    // Generate buffer
    const excelBuffer = XLSX.write(wb, {
      type: "buffer",
      bookType: "xlsx",
    });

    const dateStr = new Date().toISOString().split("T")[0];

    return new NextResponse(excelBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="bao-cao-${dateStr}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error("Error exporting Excel:", error);
    return NextResponse.json(
      { success: false, error: "Không thể xuất dữ liệu Excel" },
      { status: 500 }
    );
  }
}
