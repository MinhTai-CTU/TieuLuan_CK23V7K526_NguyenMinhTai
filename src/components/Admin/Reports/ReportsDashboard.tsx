"use client";

import { useState, useEffect } from "react";
import { getToken } from "@/lib/auth-storage";

interface ReportsDashboardProps {
  isAdmin: boolean;
}

export default function ReportsDashboard({ isAdmin }: ReportsDashboardProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = getToken();
      const response = await fetch("/api/admin/reports", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  if (loading) {
    return <div className="text-center py-12">Đang tải...</div>;
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-gray-500">Không có dữ liệu</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Revenue Chart Placeholder */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Doanh thu</h2>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
          <p className="text-gray-500">
            Biểu đồ doanh thu sẽ được hiển thị ở đây
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Doanh thu hôm nay</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {formatCurrency(stats.todayRevenue || 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">
            Doanh thu tháng này
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {formatCurrency(stats.monthRevenue || 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Tổng đơn hàng</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {stats.totalOrders || 0}
          </p>
        </div>
      </div>
    </div>
  );
}
