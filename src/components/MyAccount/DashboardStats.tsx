"use client";
import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { getAuthHeader } from "@/lib/auth-storage";
import toast from "react-hot-toast";

interface Order {
  id: string;
  orderId: string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  shipping: {
    estimatedDeliveryDate: string | null;
  } | null;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

const DashboardStats = () => {
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

        const response = await fetch(`/api/orders?userId=${user.id}`, {
          headers: {
            Authorization: authHeader,
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            const validOrders = (result.data || []).filter(
              (order: Order) => order.paymentStatus !== "FAILED"
            );
            setOrders(validOrders);
          }
        } else {
          toast.error("Không thể tải dữ liệu đơn hàng");
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast.error("Không thể tải dữ liệu đơn hàng");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, user]);

  // Tính toán dữ liệu cho biểu đồ theo tuần (12 tuần gần nhất)
  const getWeeklyData = () => {
    const weeklyData: { [key: string]: number } = {};
    const now = new Date();

    // Tạo 12 tuần gần nhất
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - i * 7 - (now.getDay() || 7) + 1);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const weekKey = `Tuần ${12 - i}`;
      weeklyData[weekKey] = 0;

      orders.forEach((order) => {
        const orderDate = new Date(order.createdAt);
        if (orderDate >= weekStart && orderDate <= weekEnd) {
          weeklyData[weekKey]++;
        }
      });
    }

    return Object.entries(weeklyData).map(([name, value]) => ({
      name,
      "Số đơn": value,
    }));
  };

  // Tính toán dữ liệu cho biểu đồ theo tháng (12 tháng gần nhất)
  const getMonthlyData = () => {
    const monthlyData: { [key: string]: number } = {};
    const now = new Date();

    // Tạo 12 tháng gần nhất
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = monthDate.toLocaleDateString("vi-VN", {
        month: "short",
        year: "numeric",
      });
      monthlyData[monthKey] = 0;

      orders.forEach((order) => {
        const orderDate = new Date(order.createdAt);
        if (
          orderDate.getMonth() === monthDate.getMonth() &&
          orderDate.getFullYear() === monthDate.getFullYear()
        ) {
          monthlyData[monthKey]++;
        }
      });
    }

    return Object.entries(monthlyData).map(([name, value]) => ({
      name,
      "Số đơn": value,
    }));
  };

  // Tính số đơn chờ giao (status: PENDING, PROCESSING, SHIPPED)
  const getPendingDeliveryCount = () => {
    return orders.filter(
      (order) =>
        order.status === "PENDING" ||
        order.status === "PROCESSING" ||
        order.status === "SHIPPED"
    ).length;
  };

  // Tính toán dữ liệu cho biểu đồ tròn theo status
  const getStatusData = () => {
    const statusCount: { [key: string]: number } = {};

    orders.forEach((order) => {
      const status = order.status;
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    const statusLabels: { [key: string]: string } = {
      PENDING: "Chờ xử lý",
      PROCESSING: "Đang xử lý",
      SHIPPED: "Đã gửi hàng",
      DELIVERED: "Đã giao",
      CANCELLED: "Đã hủy",
    };

    return Object.entries(statusCount).map(([name, value]) => ({
      name: statusLabels[name] || name,
      value,
    }));
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue"></div>
        <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
      </div>
    );
  }

  const weeklyData = getWeeklyData();
  const monthlyData = getMonthlyData();
  const pendingDeliveryCount = getPendingDeliveryCount();
  const statusData = getStatusData();

  return (
    <div className="space-y-6">
      {/* Thống kê tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue/10 rounded-xl p-6 border border-blue/20">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Tổng số đơn hàng
          </h3>
          <p className="text-3xl font-bold text-blue">{orders.length}</p>
        </div>
        <div className="bg-orange/10 rounded-xl p-6 border border-orange/20">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Đơn chờ giao
          </h3>
          <p className="text-3xl font-bold" style={{ color: "#F27430" }}>
            {pendingDeliveryCount}
          </p>
        </div>
        <div className="bg-green/10 rounded-xl p-6 border border-green/20">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Đơn đã giao
          </h3>
          <p className="text-3xl font-bold" style={{ color: "#22AD5C" }}>
            {orders.filter((o) => o.status === "DELIVERED").length}
          </p>
        </div>
      </div>

      {/* Biểu đồ theo tuần */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-dark mb-4">
          Số đơn hàng theo tuần (12 tuần gần nhất)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="Số đơn"
              stroke="#0088FE"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Biểu đồ theo tháng */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-dark mb-4">
          Số đơn hàng theo tháng (12 tháng gần nhất)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Số đơn" fill="#00C49F" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Biểu đồ tròn theo status */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-dark mb-4">
          Phân bố đơn hàng theo trạng thái
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {statusData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardStats;
