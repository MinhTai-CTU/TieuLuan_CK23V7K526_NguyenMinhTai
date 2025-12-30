"use client";
import React, { useState, useEffect } from "react";
import OrderDetails from "./OrderDetails";
import { formatPrice } from "@/utils/formatPrice";
import toast from "react-hot-toast";

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

const SingleOrder = ({
  orderItem,
  smallView,
  defaultExpanded = false,
}: {
  orderItem: OrderItem;
  smallView: boolean;
  defaultExpanded?: boolean;
}) => {
  const [showDetails, setShowDetails] = useState(defaultExpanded);

  // Update showDetails when defaultExpanded changes
  useEffect(() => {
    if (defaultExpanded) {
      setShowDetails(true);
    }
  }, [defaultExpanded]);

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      PENDING: {
        label: "Chờ xử lý",
        className: "text-yellow-600 bg-yellow-100",
      },
      PROCESSING: {
        label: "Đang chuẩn bị",
        className: "text-blue-600 bg-blue-100",
      },
      SHIPPED: {
        label: "Đang giao",
        className: "text-purple-600 bg-purple-100",
      },
      DELIVERED: { label: "Đã nhận", className: "text-green-600 bg-green-100" },
      CANCELLED: { label: "Đã hủy", className: "text-red-600 bg-red-100" },
    };
    return (
      statusMap[status] || {
        label: status,
        className: "text-gray-600 bg-gray-100",
      }
    );
  };

  // Get payment status label
  const getPaymentStatusLabel = (
    paymentStatus: string,
    paymentMethod: string | null
  ) => {
    const paymentMap: Record<string, { label: string; className: string }> = {
      PENDING: {
        label:
          paymentMethod === "cod" ? "Chưa thanh toán (COD)" : "Chờ thanh toán",
        className: "text-orange-600 bg-orange-100",
      },
      PAID: {
        label: "Đã thanh toán",
        className: "text-green-600 bg-green-100",
      },
      FAILED: {
        label: "Thanh toán thất bại",
        className: "text-red-600 bg-red-100",
      },
      REFUNDED: {
        label: "Đã hoàn tiền",
        className: "text-gray-600 bg-gray-100",
      },
    };
    return (
      paymentMap[paymentStatus] || {
        label: paymentStatus,
        className: "text-gray-600 bg-gray-100",
      }
    );
  };

  const statusInfo = getStatusLabel(orderItem.status);
  const paymentStatusInfo = getPaymentStatusLabel(
    orderItem.paymentStatus,
    orderItem.paymentMethod
  );

  // Handle copy order ID
  const handleCopyOrderId = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click events
    const orderId = `#${orderItem.orderId}`;
    try {
      await navigator.clipboard.writeText(orderId);
      toast.success(`Đã copy mã đơn: ${orderId}`);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Không thể copy mã đơn");
    }
  };

  if (smallView) {
    return (
      <>
        <div className="block md:hidden border-b border-gray-3 py-4 px-4">
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-dark">
                  Mã đơn:{" "}
                  <span
                    onClick={handleCopyOrderId}
                    className="text-red cursor-pointer hover:underline truncate block max-w-[200px]"
                    title={`Click để copy: #${orderItem.orderId}`}
                  >
                    #{orderItem.orderId}
                  </span>
                </p>
                <p className="text-xs text-dark-4 mt-1">
                  {formatDate(orderItem.createdAt)}
                </p>
              </div>
              <div className="flex flex-col gap-1 items-end">
                <span
                  className={`text-xs py-1 px-2 rounded-full ${statusInfo.className}`}
                >
                  {statusInfo.label}
                </span>
                <span
                  className={`text-xs py-1 px-2 rounded-full ${paymentStatusInfo.className}`}
                >
                  {paymentStatusInfo.label}
                </span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-dark-4">Tổng tiền:</span>
              <span className="text-sm font-semibold text-dark">
                {formatPrice(orderItem.total)}
              </span>
            </div>
            <button
              onClick={toggleDetails}
              className="w-full mt-2 py-2 px-4 bg-blue text-white rounded-md hover:bg-blue-dark transition-colors text-sm"
            >
              {showDetails ? "Ẩn chi tiết" : "Xem chi tiết"}
            </button>
          </div>
        </div>
        {showDetails && (
          <div className="block md:hidden border-b border-gray-3">
            <OrderDetails
              orderItem={orderItem}
              onClose={() => setShowDetails(false)}
            />
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="items-center justify-between border-t border-gray-3 py-5 px-7.5 hidden md:flex">
        <div className="min-w-[150px] max-w-[150px]">
          <p
            onClick={handleCopyOrderId}
            className="text-custom-sm text-red font-medium cursor-pointer hover:underline truncate"
            title={`Click để copy: #${orderItem.orderId}`}
          >
            #{orderItem.orderId}
          </p>
        </div>
        <div className="min-w-[150px]">
          <p className="text-custom-sm text-dark">
            {formatDate(orderItem.createdAt)}
          </p>
        </div>
        <div className="min-w-[150px]">
          <p className="text-custom-sm font-semibold text-dark">
            {formatPrice(orderItem.total)}
          </p>
        </div>
        <div className="min-w-[150px]">
          <div className="flex flex-col gap-1">
            <span
              className={`inline-block text-xs py-1 px-3 rounded-full ${statusInfo.className}`}
            >
              {statusInfo.label}
            </span>
            <span
              className={`inline-block text-xs py-1 px-3 rounded-full ${paymentStatusInfo.className}`}
            >
              {paymentStatusInfo.label}
            </span>
          </div>
        </div>
        <div className="min-w-[150px]">
          <button
            onClick={toggleDetails}
            className="text-blue hover:text-blue-dark text-sm font-medium transition-colors"
          >
            {showDetails ? "Ẩn chi tiết" : "Xem chi tiết"}
          </button>
        </div>
      </div>
      {showDetails && (
        <div className="hidden md:block border-t border-gray-3">
          <OrderDetails
            orderItem={orderItem}
            onClose={() => setShowDetails(false)}
          />
        </div>
      )}
    </>
  );
};

export default SingleOrder;
