"use client";
import React, { useState } from "react";
import Image from "next/image";
import { formatPrice } from "@/utils/formatPrice";
import { getAuthHeader } from "@/lib/auth-storage";
import toast from "react-hot-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface OrderItem {
  id: string;
  orderId: string;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  shipping: {
    fullName: string;
    address: string;
    city: string;
    phone: string | null;
    estimatedDeliveryDate: string | null;
  } | null;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    discountedPrice: number | null;
    product: {
      id: string;
      title: string;
      images: Array<{ url: string }>;
    };
  }>;
}

const OrderDetails = ({
  orderItem,
  onClose,
}: {
  orderItem: OrderItem;
  onClose: () => void;
}) => {
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Ngày không hợp lệ";
      }
      return date.toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Ngày không hợp lệ";
    }
  };

  // Get payment status label
  const getPaymentStatusLabel = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      PAID: { label: "Đã thanh toán", className: "text-green-600" },
      PENDING: { label: "Chờ thanh toán", className: "text-yellow-600" },
      FAILED: { label: "Thất bại", className: "text-red-600" },
      REFUNDED: { label: "Đã hoàn tiền", className: "text-blue-600" },
    };
    return statusMap[status] || { label: status, className: "text-gray-600" };
  };

  // Get order status label
  const getOrderStatusLabel = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      PENDING: { label: "Chờ xử lý", className: "text-yellow-600" },
      PROCESSING: {
        label: "Shop đang chuẩn bị hàng",
        className: "text-blue-600",
      },
      SHIPPED: { label: "Đang giao hàng", className: "text-purple-600" },
      DELIVERED: { label: "Đã nhận hàng", className: "text-green-600" },
      CANCELLED: { label: "Đã hủy", className: "text-red-600" },
    };
    return statusMap[status] || { label: status, className: "text-gray-600" };
  };

  // Get payment method label
  const getPaymentMethodLabel = (method: string | null) => {
    if (!method) return "N/A";
    const methodMap: Record<string, string> = {
      cod: "Thanh toán khi nhận hàng (COD)",
      momo: "MoMo",
      stripe: "Thẻ tín dụng/ghi nợ (Stripe)",
    };
    return methodMap[method] || method;
  };

  // Check if order can be cancelled
  const canCancel = () => {
    return (
      orderItem.status === "PENDING" &&
      (orderItem.paymentStatus === "PENDING" ||
        orderItem.paymentStatus === "FAILED")
    );
  };

  // Handle cancel order
  const handleCancelOrder = () => {
    setCancelDialogOpen(true);
  };

  const confirmCancelOrder = async () => {
    setIsCancelling(true);
    try {
      const authHeader = getAuthHeader();
      if (!authHeader) {
        toast.error("Vui lòng đăng nhập");
        setIsCancelling(false);
        setCancelDialogOpen(false);
        return;
      }

      const response = await fetch(`/api/orders/${orderItem.orderId}/cancel`, {
        method: "POST",
        headers: {
          Authorization: authHeader,
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Đã hủy đơn hàng thành công");
        setCancelDialogOpen(false);
        onClose();
        // Reload page to refresh orders list
        window.location.reload();
      } else {
        toast.error(result.error || "Không thể hủy đơn hàng");
        setCancelDialogOpen(false);
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error("Không thể hủy đơn hàng");
      setCancelDialogOpen(false);
    } finally {
      setIsCancelling(false);
    }
  };

  const paymentStatusInfo = getPaymentStatusLabel(orderItem.paymentStatus);
  const orderStatusInfo = getOrderStatusLabel(orderItem.status);

  return (
    <div className="py-6 px-7.5 bg-gray-50">
      <div className="space-y-6">
        {/* Order Info */}
        <div className="bg-white rounded-lg p-6">
          <h3 className="text-lg font-semibold text-dark mb-4">
            Thông tin đơn hàng
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-dark-4">Mã đơn hàng:</span>
              <span className="ml-2 font-medium text-dark">
                {orderItem.orderId}
              </span>
            </div>
            <div>
              <span className="text-dark-4">Ngày đặt:</span>
              <span className="ml-2 font-medium text-dark">
                {formatDate(orderItem.createdAt)}
              </span>
            </div>
            <div>
              <span className="text-dark-4">Phương thức thanh toán:</span>
              <span className="ml-2 font-medium text-dark">
                {getPaymentMethodLabel(orderItem.paymentMethod)}
              </span>
            </div>
            <div>
              <span className="text-dark-4">Trạng thái thanh toán:</span>
              <span
                className={`ml-2 font-medium ${paymentStatusInfo.className}`}
              >
                {paymentStatusInfo.label}
              </span>
            </div>
            <div>
              <span className="text-dark-4">Trạng thái vận chuyển:</span>
              <span className={`ml-2 font-medium ${orderStatusInfo.className}`}>
                {orderStatusInfo.label}
              </span>
            </div>
            <div>
              <span className="text-dark-4">Tổng tiền:</span>
              <span className="ml-2 font-semibold text-dark text-lg">
                {formatPrice(orderItem.total)}
              </span>
            </div>
            {orderItem.status === "CANCELLED" &&
              orderItem.cancellationReason && (
                <div className="md:col-span-2 mt-2 pt-2 border-t border-gray-3">
                  <span className="text-dark-4">Lý do hủy đơn:</span>
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800 font-medium">
                      {orderItem.cancellationReason}
                    </p>
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Products */}
        <div className="bg-white rounded-lg p-6">
          <h3 className="text-lg font-semibold text-dark mb-4">Sản phẩm</h3>
          <div className="space-y-4">
            {orderItem.items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 pb-4 border-b border-gray-3 last:border-0"
              >
                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-2">
                  {item.product.images && item.product.images.length > 0 ? (
                    <Image
                      src={item.product.images[0].url}
                      alt={item.product.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-dark-4">
                      No Image
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-dark mb-1">
                    {item.product.title}
                  </h4>
                  <div className="text-sm text-dark-4">
                    <span>Số lượng: {item.quantity}</span>
                    <span className="mx-2">•</span>
                    <span>
                      Giá: {formatPrice(item.discountedPrice || item.price)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-dark">
                    {formatPrice(
                      (item.discountedPrice || item.price) * item.quantity
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Address */}
        {orderItem.shipping && (
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold text-dark mb-4">
              Địa chỉ giao hàng
            </h3>
            <div className="text-sm text-dark-4 space-y-1">
              <p className="font-medium text-dark">
                {orderItem.shipping.fullName}
              </p>
              <p>{orderItem.shipping.address}</p>
              <p>
                {orderItem.shipping.city}
                {orderItem.shipping.phone && ` - ${orderItem.shipping.phone}`}
              </p>
              <p className="mt-2 pt-2 border-t border-gray-3">
                <span className="font-medium text-dark">
                  Ngày giao hàng dự kiến:{" "}
                </span>
                <span className="text-blue font-semibold">
                  {orderItem.shipping?.estimatedDeliveryDate
                    ? formatDate(orderItem.shipping.estimatedDeliveryDate)
                    : "Chưa xác định"}
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          {canCancel() && (
            <button
              onClick={handleCancelOrder}
              disabled={isCancelling}
              className="px-6 py-2 bg-red text-white rounded-md hover:bg-red-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCancelling ? "Đang hủy..." : "Hủy đơn hàng"}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-3 text-dark rounded-md hover:bg-gray-2 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Cancel Order Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hủy đơn hàng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancelOrder}
              className="bg-red-600 hover:bg-red-700"
              disabled={isCancelling}
            >
              {isCancelling ? "Đang hủy..." : "Xác nhận hủy"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OrderDetails;
