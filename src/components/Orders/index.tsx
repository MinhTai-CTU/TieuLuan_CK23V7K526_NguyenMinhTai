"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getAuthHeader } from "@/lib/auth-storage";
import SingleOrder from "./SingleOrder";
import toast from "react-hot-toast";

interface Order {
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

const Orders = () => {
  const { user, isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Check for orderId in query params and expand that order
  useEffect(() => {
    const orderIdParam = searchParams.get("orderId");
    if (orderIdParam && orders.length > 0 && !isLoading) {
      const order = orders.find((o) => o.orderId === orderIdParam);
      if (order) {
        setExpandedOrderId(order.id);
        // If order is not in current filter, switch to "all" tab
        const isInCurrentFilter =
          activeTab === "all" || order.status === activeTab;
        if (!isInCurrentFilter) {
          setActiveTab("all");
        }
        // Scroll to the order after a delay to ensure it's rendered
        setTimeout(() => {
          const element = document.getElementById(`order-${order.id}`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 300);
      }
    }
  }, [searchParams, orders, isLoading, activeTab]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setIsLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        const authHeader = getAuthHeader();
        if (!authHeader) {
          setIsLoading(false);
          return;
        }

        // Only fetch orders for the current user
        const response = await fetch(`/api/orders?userId=${user.id}`, {
          headers: {
            Authorization: authHeader,
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // Debug: Log orders to check estimatedDeliveryDate
            console.log("Orders fetched:", result.data);
            if (result.data && result.data.length > 0) {
              result.data.forEach((order: any, index: number) => {
                console.log(`Order ${index + 1} (${order.orderId}):`, {
                  hasShipping: !!order.shipping,
                  estimatedDeliveryDate: order.shipping?.estimatedDeliveryDate,
                  shipping: order.shipping,
                });
              });
            }
            // Lọc bỏ các đơn hàng có trạng thái thanh toán thất bại (nếu có)
            const validOrders = (result.data || []).filter(
              (order: Order) => order.paymentStatus !== "FAILED"
            );
            setOrders(validOrders);
          }
        } else {
          toast.error("Không thể tải danh sách đơn hàng");
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast.error("Không thể tải danh sách đơn hàng");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, user]);

  if (isLoading) {
    return (
      <div className="py-9.5 px-4 sm:px-7.5 xl:px-10">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue border-t-transparent mb-4"></div>
          <p className="text-dark-4">Đang tải danh sách đơn hàng...</p>
        </div>
      </div>
    );
  }

  // Filter orders by active tab
  const filteredOrders =
    activeTab === "all"
      ? orders
      : orders.filter((order) => order.status === activeTab);

  // Status tabs configuration
  const statusTabs = [
    { value: "all", label: "Tất cả" },
    { value: "PENDING", label: "Chờ xử lý" },
    { value: "PROCESSING", label: "Đang chuẩn bị" },
    { value: "SHIPPED", label: "Đang giao hàng" },
    { value: "DELIVERED", label: "Đã nhận hàng" },
    { value: "CANCELLED", label: "Đã hủy" },
  ];

  return (
    <div className="w-full">
      {/* Status Tabs */}
      <div className="px-4 sm:px-7.5 xl:px-10 pt-6 pb-4 border-b border-gray-3">
        <div className="flex flex-wrap gap-2">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.value
                  ? "bg-blue text-white"
                  : "bg-gray-1 text-dark-2 hover:bg-gray-3"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="py-9.5 px-4 sm:px-7.5 xl:px-10">
          <p className="text-dark-4 text-center">
            {activeTab === "all"
              ? "Bạn chưa có đơn hàng nào!"
              : `Không có đơn hàng với trạng thái "${statusTabs.find((t) => t.value === activeTab)?.label}"`}
          </p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          <div className="min-w-[770px]">
            {/* Header */}
            <div className="items-center justify-between py-4.5 px-7.5 hidden md:flex border-b border-gray-3">
              <div className="min-w-[150px]">
                <p className="text-custom-sm font-medium text-dark">Mã đơn</p>
              </div>
              <div className="min-w-[150px]">
                <p className="text-custom-sm font-medium text-dark">Ngày đặt</p>
              </div>
              <div className="min-w-[150px]">
                <p className="text-custom-sm font-medium text-dark">
                  Tổng tiền
                </p>
              </div>
              <div className="min-w-[150px]">
                <p className="text-custom-sm font-medium text-dark">
                  Trạng thái
                </p>
              </div>
              <div className="min-w-[150px]">
                <p className="text-custom-sm font-medium text-dark">Thao tác</p>
              </div>
            </div>

            {/* Orders List */}
            {filteredOrders.map((order) => (
              <div key={order.id} id={`order-${order.id}`}>
                <SingleOrder
                  orderItem={order}
                  smallView={false}
                  defaultExpanded={expandedOrderId === order.id}
                />
              </div>
            ))}
          </div>

          {/* Mobile View */}
          <div className="block md:hidden">
            {filteredOrders.map((order) => (
              <div key={order.id} id={`order-${order.id}`}>
                <SingleOrder
                  orderItem={order}
                  smallView={true}
                  defaultExpanded={expandedOrderId === order.id}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
