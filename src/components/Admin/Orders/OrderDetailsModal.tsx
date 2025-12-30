"use client";
import React from "react";
import Image from "next/image";
import { formatPrice } from "@/utils/formatPrice";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  discountedPrice: number | null;
  product: {
    id: string;
    title: string;
    images: Array<{ url: string; type: string }>;
  };
  productVariant?: {
    id: string;
    color?: string;
    size?: string;
  } | null;
}

interface Order {
  id: string;
  orderId: string;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  shipping: {
    fullName: string;
    email: string;
    phone: string | null;
    address: string;
    city: string;
    method: string | null;
    estimatedDeliveryDate: string | null;
  } | null;
  items: OrderItem[];
}

interface OrderDetailsModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !order) return null;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Ngày không hợp lệ";
      }
      return date.toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Ngày không hợp lệ";
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      PAID: {
        label: "Đã thanh toán",
        className: "bg-green-100 text-green-800 border border-green-200",
      },
      PENDING: {
        label: "Chờ thanh toán",
        className: "bg-yellow-100 text-yellow-800 border border-yellow-200",
      },
      FAILED: {
        label: "Thất bại",
        className: "bg-red-100 text-red-800 border border-red-200",
      },
      REFUNDED: {
        label: "Đã hoàn tiền",
        className: "bg-gray-100 text-gray-600 border border-gray-200",
      },
    };
    return (
      configs[status] || {
        label: status,
        className: "bg-gray-100 text-gray-800",
      }
    );
  };

  const getOrderStatusBadge = (status: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      PENDING: {
        label: "Chờ xử lý",
        className: "bg-orange-100 text-orange-800 border border-orange-200",
      },
      PROCESSING: {
        label: "Đang chuẩn bị",
        className: "bg-blue-100 text-blue-800 border border-blue-200",
      },
      SHIPPED: {
        label: "Đang giao hàng",
        className: "bg-purple-100 text-purple-800 border border-purple-200",
      },
      DELIVERED: {
        label: "Đã giao",
        className: "bg-green-100 text-green-800 border border-green-200",
      },
      CANCELLED: {
        label: "Đã hủy",
        className: "bg-gray-100 text-gray-600 border border-gray-200",
      },
    };
    return (
      configs[status] || {
        label: status,
        className: "bg-gray-100 text-gray-800",
      }
    );
  };

  const getPaymentMethodLabel = (method: string | null) => {
    const methods: Record<string, string> = {
      cod: "Thanh toán khi nhận hàng (COD)",
      stripe: "Thẻ tín dụng/ghi nợ (Stripe)",
      momo: "Ví điện tử MoMo",
      zalopay: "Ví điện tử ZaloPay",
    };
    return methods[method || ""] || method || "Chưa xác định";
  };

  const paymentStatusBadge = getPaymentStatusBadge(order.paymentStatus);
  const orderStatusBadge = getOrderStatusBadge(order.status);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        isOpen ? "visible" : "invisible"
      }`}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

      {/* Modal */}
      <div
        className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900">
            Chi tiết đơn hàng #{order.orderId}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Order Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Thông tin đơn hàng
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Mã đơn hàng:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {order.orderId}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Ngày đặt:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {formatDate(order.createdAt)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Cập nhật lần cuối:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {formatDate(order.updatedAt)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Phương thức thanh toán:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {getPaymentMethodLabel(order.paymentMethod)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Trạng thái thanh toán:</span>
                <span
                  className={`ml-2 px-2 py-1 text-xs font-semibold rounded-lg ${paymentStatusBadge.className}`}
                >
                  {paymentStatusBadge.label}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Trạng thái đơn hàng:</span>
                <span
                  className={`ml-2 px-2 py-1 text-xs font-semibold rounded-lg ${orderStatusBadge.className}`}
                >
                  {orderStatusBadge.label}
                </span>
              </div>
              <div className="md:col-span-2">
                <span className="text-gray-600">Tổng tiền:</span>
                <span className="ml-2 font-bold text-lg text-gray-900">
                  {formatPrice(order.total)}
                </span>
              </div>
              {order.status === "CANCELLED" && order.cancellationReason && (
                <div className="md:col-span-2 mt-2 pt-2 border-t border-gray-300">
                  <span className="text-gray-600">Lý do hủy:</span>
                  <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800 font-medium">
                      {order.cancellationReason}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Customer Info */}
          {order.user && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Thông tin khách hàng
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Tên khách hàng:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {order.user.name || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Email:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {order.user.email}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Shipping Info */}
          {order.shipping && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Địa chỉ giao hàng
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Người nhận:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {order.shipping.fullName}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Địa chỉ:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {order.shipping.address}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Thành phố:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {order.shipping.city}
                  </span>
                </div>
                {order.shipping.phone && (
                  <div>
                    <span className="text-gray-600">Số điện thoại:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {order.shipping.phone}
                    </span>
                  </div>
                )}
                {order.shipping.estimatedDeliveryDate && (
                  <div>
                    <span className="text-gray-600">Ngày giao dự kiến:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {formatDate(order.shipping.estimatedDeliveryDate)}
                    </span>
                  </div>
                )}
                {order.shipping.method && (
                  <div>
                    <span className="text-gray-600">
                      Phương thức vận chuyển:
                    </span>
                    <span className="ml-2 font-medium text-gray-900">
                      {order.shipping.method}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Items */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Sản phẩm đã đặt ({order.items.length})
            </h3>
            <div className="space-y-4">
              {order.items.map((item) => {
                const productImage =
                  item.product.images.find((img) => img.type === "THUMBNAIL")
                    ?.url ||
                  item.product.images[0]?.url ||
                  "/images/default-product.png";
                const finalPrice = item.discountedPrice || item.price;
                const itemTotal = finalPrice * item.quantity;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg p-4 border border-gray-200 flex gap-4"
                  >
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <Image
                        src={productImage}
                        alt={item.product.title}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {item.product.title}
                      </h4>
                      {item.productVariant && (
                        <div className="mt-1 text-sm text-gray-600">
                          {item.productVariant.color && (
                            <span>Màu: {item.productVariant.color}</span>
                          )}
                          {item.productVariant.size && (
                            <span className="ml-2">
                              Size: {item.productVariant.size}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="mt-2 flex items-center gap-4 text-sm">
                        <span className="text-gray-600">
                          Số lượng:{" "}
                          <span className="font-medium">{item.quantity}</span>
                        </span>
                        <span className="text-gray-600">
                          Đơn giá:{" "}
                          <span className="font-medium">
                            {formatPrice(finalPrice)}
                          </span>
                        </span>
                        {item.discountedPrice && (
                          <span className="text-gray-400 line-through">
                            {formatPrice(item.price)}
                          </span>
                        )}
                      </div>
                      <div className="mt-2">
                        <span className="text-gray-600">Thành tiền: </span>
                        <span className="font-semibold text-gray-900">
                          {formatPrice(itemTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Total Summary */}
          <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">
                Tổng cộng:
              </span>
              <span className="text-2xl font-bold text-blue-600">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
