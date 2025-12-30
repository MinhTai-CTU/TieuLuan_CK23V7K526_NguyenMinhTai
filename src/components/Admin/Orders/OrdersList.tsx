"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getToken } from "@/lib/auth-storage";
import toast from "react-hot-toast";
import OrderDetailsModal from "./OrderDetailsModal";

interface Order {
  id: string;
  orderId: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  total: number;
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
  items: Array<{
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
  }>;
}

export default function OrdersList() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);
  const [statusChangeModal, setStatusChangeModal] = useState<{
    open: boolean;
    orderId: string;
    orderCode: string;
    currentStatus: string;
    newStatus: string;
  } | null>(null);
  const [selectedOrderForDetails, setSelectedOrderForDetails] =
    useState<Order | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    console.log("OrdersList component mounted, fetching orders...");
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // Check for orderId in query params and open order details
  useEffect(() => {
    const orderIdParam = searchParams.get("orderId");
    if (orderIdParam && orders.length > 0 && !loading) {
      const order = orders.find((o) => o.orderId === orderIdParam);
      if (order) {
        setSelectedOrderForDetails(order);
        setIsDetailsModalOpen(true);
        // Remove orderId from URL without reload
        const url = new URL(window.location.href);
        url.searchParams.delete("orderId");
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, [searchParams, orders, loading]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = getToken();

      if (!token) {
        console.error("No token found");
        toast.error("Vui lòng đăng nhập lại");
        setLoading(false);
        return;
      }

      const url =
        statusFilter === "all"
          ? "/api/orders"
          : `/api/orders?status=${statusFilter}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to fetch orders:", errorData);
        toast.error(errorData.error || "Không thể tải danh sách đơn hàng");
        setOrders([]);
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (data.success) {
        const ordersData = data.data || [];
        // Lọc bỏ các đơn hàng có trạng thái thanh toán thất bại
        // Nếu filter là "all", cũng loại bỏ các đơn hàng đã hủy
        let validOrders = ordersData.filter(
          (order: Order) => order.paymentStatus !== "FAILED"
        );

        // Nếu filter là "all", loại bỏ các đơn hàng đã hủy
        if (statusFilter === "all") {
          validOrders = validOrders.filter(
            (order: Order) => order.status !== "CANCELLED"
          );
        }

        console.log(
          "Orders fetched successfully:",
          validOrders.length,
          "orders (excluding failed payments" +
            (statusFilter === "all" ? " and cancelled orders" : "") +
            ")"
        );
        setOrders(validOrders);
      } else {
        console.error("API returned error:", data.error);
        toast.error(data.error || "Không thể tải danh sách đơn hàng");
        setOrders([]);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Có lỗi xảy ra khi tải danh sách đơn hàng");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (
    orderId: string,
    orderCode: string,
    currentStatus: string,
    newStatus: string,
    paymentMethod?: string | null
  ) => {
    if (currentStatus === newStatus) return;

    // Kiểm tra xem có thể chuyển sang trạng thái mới không
    if (!canChangeToStatus(currentStatus, newStatus, paymentMethod)) {
      if (newStatus === "CANCELLED") {
        toast.error("Chỉ có thể hủy đơn hàng COD ở trạng thái 'Chờ xử lý'");
      } else {
        toast.error(
          `Không thể chuyển từ "${getStatusBadge(currentStatus).label}" sang "${getStatusBadge(newStatus).label}". Chỉ có thể chuyển sang bước tiếp theo.`
        );
      }
      return;
    }

    // Nếu hủy đơn, mở modal yêu cầu lý do
    if (newStatus === "CANCELLED") {
      setSelectedOrder(orders.find((o) => o.id === orderId) || null);
      setRejectModalOpen(true);
      return;
    }

    setStatusChangeModal({
      open: true,
      orderId,
      orderCode,
      currentStatus,
      newStatus,
    });
  };

  const confirmStatusUpdate = async () => {
    if (!statusChangeModal) return;

    try {
      const token = getToken();
      const response = await fetch(`/api/orders/${statusChangeModal.orderId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: statusChangeModal.newStatus }),
      });

      if (response.ok) {
        toast.success("Cập nhật trạng thái đơn hàng thành công");
        fetchOrders();
        setStatusChangeModal(null);
      } else {
        const data = await response.json();
        toast.error(data.error || "Cập nhật trạng thái thất bại");
      }
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Có lỗi xảy ra khi cập nhật trạng thái");
    }
  };

  const copyOrderId = (orderId: string) => {
    navigator.clipboard.writeText(orderId);
    toast.success("Đã sao chép mã đơn hàng");
  };

  const shortenOrderId = (orderId: string, length: number = 8) => {
    if (orderId.length <= length) return orderId;
    return `...${orderId.slice(-length)}`;
  };

  const handleApprove = async (order: Order) => {
    if (processing) return;

    setProcessing(order.id);
    try {
      const token = getToken();
      const response = await fetch(`/api/orders/${order.id}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Đã duyệt đơn hàng thành công");
        fetchOrders();
      } else {
        toast.error(data.error || "Duyệt đơn hàng thất bại");
      }
    } catch (error) {
      console.error("Error approving order:", error);
      toast.error("Có lỗi xảy ra khi duyệt đơn hàng");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!selectedOrder) return;
    if (processing) return;

    setProcessing(selectedOrder.id);
    try {
      const token = getToken();
      const response = await fetch(`/api/orders/${selectedOrder.id}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: rejectReason || "Từ chối bởi admin" }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Đã từ chối đơn hàng");
        setRejectModalOpen(false);
        setRejectReason("");
        setSelectedOrder(null);
        fetchOrders();
      } else {
        toast.error(data.error || "Từ chối đơn hàng thất bại");
      }
    } catch (error) {
      console.error("Error rejecting order:", error);
      toast.error("Có lỗi xảy ra khi từ chối đơn hàng");
    } finally {
      setProcessing(null);
    }
  };

  const openRejectModal = (order: Order) => {
    setSelectedOrder(order);
    setRejectModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
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

  // Hàm xác định các trạng thái hợp lệ có thể chuyển từ trạng thái hiện tại
  const getValidNextStatuses = (currentStatus: string): string[] => {
    const statusFlow: Record<string, string[]> = {
      PENDING: ["PROCESSING"], // Chỉ có thể chuyển sang Đang chuẩn bị
      PROCESSING: ["SHIPPED"], // Chỉ có thể chuyển sang Đang giao hàng
      SHIPPED: ["DELIVERED"], // Chỉ có thể chuyển sang Đã giao
      DELIVERED: [], // Đã giao rồi, không thể chuyển sang trạng thái nào khác
      CANCELLED: [], // Đã hủy, không thể chuyển sang trạng thái nào khác
    };
    return statusFlow[currentStatus] || [];
  };

  // Kiểm tra xem có thể chuyển sang trạng thái mới không
  const canChangeToStatus = (
    currentStatus: string,
    newStatus: string,
    paymentMethod?: string | null
  ): boolean => {
    // Cho phép giữ nguyên trạng thái hiện tại
    if (currentStatus === newStatus) return true;

    // Chỉ cho phép hủy đơn nếu:
    // - Trạng thái hiện tại là PENDING
    // - Phương thức thanh toán là COD
    if (newStatus === "CANCELLED") {
      if (currentStatus === "PENDING" && paymentMethod === "cod") {
        return true;
      }
      return false;
    }

    // Kiểm tra xem newStatus có trong danh sách trạng thái hợp lệ không
    const validNextStatuses = getValidNextStatuses(currentStatus);
    return validNextStatuses.includes(newStatus);
  };

  const getPaymentBadge = (paymentStatus: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      PAID: {
        label: "Đã thanh toán",
        className: "bg-green-100 text-green-800 border border-green-200",
      },
      FAILED: {
        label: "Thất bại",
        className: "bg-red-100 text-red-800 border border-red-200",
      },
      PENDING: {
        label: "Chờ thanh toán",
        className: "bg-yellow-100 text-yellow-800 border border-yellow-200",
      },
      REFUNDED: {
        label: "Đã hoàn tiền",
        className: "bg-gray-100 text-gray-600 border border-gray-200",
      },
    };
    return (
      configs[paymentStatus] || {
        label: paymentStatus,
        className: "bg-gray-100 text-gray-800",
      }
    );
  };

  const getPaymentMethodLabel = (paymentMethod: string | null) => {
    const methods: Record<string, string> = {
      cod: "Thanh toán khi nhận hàng (COD)",
      stripe: "Thẻ tín dụng/ghi nợ (Stripe)",
      momo: "Ví điện tử MoMo",
      zalopay: "Ví điện tử ZaloPay",
    };
    return methods[paymentMethod || ""] || paymentMethod || "Chưa xác định";
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString("vi-VN");
    const timeStr = date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return { date: dateStr, time: timeStr };
  };

  return (
    <div>
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue"></div>
          <p className="mt-4 text-gray-600">Đang tải danh sách đơn hàng...</p>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="mb-6 flex gap-2">
            {[
              "all",
              "PENDING",
              "PROCESSING",
              "SHIPPED",
              "DELIVERED",
              "CANCELLED",
            ].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  statusFilter === status
                    ? "bg-blue text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {status === "all" ? "Tất cả" : getStatusBadge(status).label}
              </button>
            ))}
          </div>

          {/* Orders Cards Grid */}
          {orders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Không có đơn hàng nào
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Chưa có đơn hàng nào trong danh sách này.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {orders.map((order) => {
                const statusBadge = getStatusBadge(order.status);
                const paymentBadge = getPaymentBadge(order.paymentStatus);
                const { date, time } = formatDateTime(order.createdAt);

                // Gradient colors based on status - More vibrant and visible colors
                const statusGradients: Record<
                  string,
                  {
                    gradient: string;
                    border: string;
                    accent: string;
                    bg: string;
                  }
                > = {
                  PENDING: {
                    gradient: "from-orange-200 via-orange-100 to-orange-50",
                    border: "border-orange-400",
                    accent: "bg-orange-500",
                    bg: "bg-orange-100",
                  },
                  PROCESSING: {
                    gradient: "from-blue-200 via-blue-100 to-blue-50",
                    border: "border-blue-400",
                    accent: "bg-blue-500",
                    bg: "bg-blue-100",
                  },
                  SHIPPED: {
                    gradient: "from-purple-200 via-purple-100 to-purple-50",
                    border: "border-purple-400",
                    accent: "bg-purple-500",
                    bg: "bg-purple-100",
                  },
                  DELIVERED: {
                    gradient: "from-green-200 via-green-100 to-green-50",
                    border: "border-green-400",
                    accent: "bg-green-500",
                    bg: "bg-green-100",
                  },
                  CANCELLED: {
                    gradient: "from-gray-300 via-gray-200 to-gray-100",
                    border: "border-gray-400",
                    accent: "bg-gray-500",
                    bg: "bg-gray-200",
                  },
                };

                const statusStyle =
                  statusGradients[order.status] || statusGradients.PENDING;

                return (
                  <div
                    key={order.id}
                    className={`bg-gradient-to-br ${statusStyle.gradient} rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 ${statusStyle.border} overflow-hidden relative`}
                  >
                    {/* Accent bar on top - thicker and more visible */}
                    <div
                      className={`absolute top-0 left-0 right-0 h-2 ${statusStyle.accent} shadow-sm`}
                    ></div>
                    {/* Card Header */}
                    <div
                      className={`px-5 py-4 border-b ${statusStyle.border} bg-white/40 backdrop-blur-sm mt-2`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-800">
                            #{shortenOrderId(order.orderId)}
                          </span>
                          <button
                            onClick={() => copyOrderId(order.orderId)}
                            className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-white/50 rounded-md transition-all"
                            title="Sao chép mã đơn"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </button>
                        </div>
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg shadow-sm ${paymentBadge.className}`}
                        >
                          {paymentBadge.label}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="px-5 py-4 space-y-3">
                      {/* Customer Info */}
                      <div className="bg-white/80 rounded-lg p-3 shadow-sm border border-white/50">
                        <div className="flex items-center gap-2 mb-2">
                          <svg
                            className="w-4 h-4 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          <p className="text-sm font-semibold text-gray-800">
                            {order.user?.name || "—"}
                          </p>
                        </div>
                        <p className="text-xs text-gray-600 ml-6">
                          {order.user?.email}
                        </p>
                      </div>

                      {/* Payment Method */}
                      <div className="bg-white/80 rounded-lg p-3 shadow-sm border border-white/50">
                        <div className="flex items-center gap-2 mb-1">
                          <svg
                            className="w-4 h-4 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                            />
                          </svg>
                          <p className="text-xs text-gray-600">
                            Phương thức thanh toán
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-gray-800 ml-6">
                          {getPaymentMethodLabel(order.paymentMethod)}
                        </p>
                      </div>

                      {/* Total Amount */}
                      <div className="bg-white/80 rounded-lg p-3 shadow-sm border border-white/50">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-600">
                            Tổng tiền:
                          </span>
                          <span className="text-lg font-bold text-gray-900">
                            {new Intl.NumberFormat("vi-VN").format(order.total)}
                            ₫
                          </span>
                        </div>
                      </div>

                      {/* Status & Date */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/80 rounded-lg p-3 shadow-sm border border-white/50">
                          <p className="text-xs text-gray-600 mb-1">
                            Trạng thái
                          </p>
                          <select
                            value={order.status}
                            onChange={(e) =>
                              handleStatusChange(
                                order.id,
                                order.orderId,
                                order.status,
                                e.target.value
                              )
                            }
                            className={`w-full text-xs font-semibold rounded-lg px-2 py-1.5 cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 shadow-sm ${statusBadge.className} hover:shadow-md`}
                          >
                            <option
                              value="PENDING"
                              className="bg-white text-orange-800"
                              disabled={
                                !canChangeToStatus(
                                  order.status,
                                  "PENDING",
                                  order.paymentMethod
                                )
                              }
                            >
                              Chờ xử lý
                            </option>
                            <option
                              value="PROCESSING"
                              className="bg-white text-blue-800"
                              disabled={
                                !canChangeToStatus(
                                  order.status,
                                  "PROCESSING",
                                  order.paymentMethod
                                )
                              }
                            >
                              Đang chuẩn bị
                            </option>
                            <option
                              value="SHIPPED"
                              className="bg-white text-purple-800"
                              disabled={
                                !canChangeToStatus(
                                  order.status,
                                  "SHIPPED",
                                  order.paymentMethod
                                )
                              }
                            >
                              Đang giao hàng
                            </option>
                            <option
                              value="DELIVERED"
                              className="bg-white text-green-800"
                              disabled={
                                !canChangeToStatus(
                                  order.status,
                                  "DELIVERED",
                                  order.paymentMethod
                                )
                              }
                            >
                              Đã giao
                            </option>
                            <option
                              value="CANCELLED"
                              className="bg-white text-gray-600"
                              disabled={
                                !canChangeToStatus(
                                  order.status,
                                  "CANCELLED",
                                  order.paymentMethod
                                )
                              }
                            >
                              Đã hủy
                            </option>
                          </select>
                        </div>
                        <div className="bg-white/80 rounded-lg p-3 shadow-sm border border-white/50">
                          <p className="text-xs text-gray-600 mb-1">Ngày tạo</p>
                          <p className="text-sm font-semibold text-gray-800">
                            {date}
                          </p>
                          <p className="text-xs text-gray-500">{time}</p>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div
                      className={`px-5 py-4 border-t ${statusStyle.border} bg-white/40 backdrop-blur-sm`}
                    >
                      <div className="flex items-center justify-end gap-2">
                        {order.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleApprove(order)}
                              disabled={processing === order.id}
                              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold shadow-sm hover:shadow-md"
                            >
                              {processing === order.id
                                ? "Đang xử lý..."
                                : "Duyệt"}
                            </button>
                            {/* Chỉ hiển thị nút "Từ chối" cho đơn COD */}
                            {order.paymentMethod === "cod" && (
                              <button
                                onClick={() => openRejectModal(order)}
                                disabled={processing === order.id}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold shadow-sm hover:shadow-md"
                              >
                                Từ chối
                              </button>
                            )}
                          </>
                        )}
                        <button
                          onClick={() => {
                            setSelectedOrderForDetails(order);
                            setIsDetailsModalOpen(true);
                          }}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 text-xs font-semibold shadow-sm hover:shadow-md"
                        >
                          Chi tiết
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Status Change Confirmation Modal */}
          {statusChangeModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Xác nhận thay đổi trạng thái
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  Mã đơn:{" "}
                  <span className="font-medium">
                    #{statusChangeModal.orderCode}
                  </span>
                </p>
                <div className="mb-4">
                  <p className="text-sm text-gray-700 mb-2">
                    Trạng thái hiện tại:{" "}
                    <span className="font-medium">
                      {getStatusBadge(statusChangeModal.currentStatus).label}
                    </span>
                  </p>
                  <p className="text-sm text-gray-700">
                    Trạng thái mới:{" "}
                    <span className="font-medium text-blue-600">
                      {getStatusBadge(statusChangeModal.newStatus).label}
                    </span>
                  </p>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Bạn có chắc chắn muốn thay đổi trạng thái đơn hàng này?
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setStatusChangeModal(null)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={confirmStatusUpdate}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Xác nhận
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reject Modal */}
          {rejectModalOpen && selectedOrder && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Từ chối đơn hàng
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  Mã đơn:{" "}
                  <span className="font-medium">#{selectedOrder.orderId}</span>
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Bạn có chắc chắn muốn từ chối đơn hàng này?
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lý do từ chối (tùy chọn)
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Nhập lý do từ chối đơn hàng..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setRejectModalOpen(false);
                      setRejectReason("");
                      setSelectedOrder(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={
                      processing === selectedOrder.id || !rejectReason.trim()
                    }
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing === selectedOrder.id
                      ? "Đang xử lý..."
                      : "Xác nhận từ chối"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Order Details Modal */}
          <OrderDetailsModal
            order={selectedOrderForDetails}
            isOpen={isDetailsModalOpen}
            onClose={() => {
              setIsDetailsModalOpen(false);
              setSelectedOrderForDetails(null);
            }}
          />
        </>
      )}
    </div>
  );
}
