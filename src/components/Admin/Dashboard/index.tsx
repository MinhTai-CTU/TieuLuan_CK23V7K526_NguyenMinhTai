"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatPrice } from "@/utils/formatPrice";
import { getToken } from "@/lib/auth-storage";
import Link from "next/link";
import Image from "next/image";

interface LowStockProduct {
  id: string;
  title: string;
  slug: string;
  stock: number;
  hasVariants: boolean;
  category: string | null;
  image: string | null;
  variants: Array<{
    id: string;
    stock: number;
    options: any;
    sku: string | null;
  }>;
}

interface DashboardData {
  todayRevenue: number;
  yesterdayRevenue: number;
  revenueChangePercent: number;
  newOrdersCount: number;
  lowStockCount: number;
  lowStockProducts: LowStockProduct[];
  revenueLast7Days: Array<{ date: string; revenue: number }>;
  recentOrders: Array<{
    id: string;
    orderId: string;
    total: number;
    status: string;
    createdAt: string;
    user: { name: string | null; email: string } | null;
  }>;
  recentReviews: Array<{
    id: string;
    rating: number;
    content: string | null;
    createdAt: string;
    user: { name: string | null; email: string };
    product: { title: string };
  }>;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lowStockModalOpen, setLowStockModalOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = getToken();
      if (!token) {
        console.error("No token found");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/admin/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to fetch dashboard data:", errorData);
        setLoading(false);
        return;
      }

      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        console.error("API returned error:", result.error);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue border-t-transparent mb-4"></div>
          <p className="text-gray-500">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-gray-500">
        Không thể tải dữ liệu dashboard
      </div>
    );
  }

  const revenueChangeColor =
    data.revenueChangePercent >= 0 ? "text-green-600" : "text-red-600";
  const revenueChangeIcon = data.revenueChangePercent >= 0 ? "↑" : "↓";

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Doanh thu hôm nay */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Doanh thu hôm nay
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatPrice(data.todayRevenue)}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-sm font-medium ${revenueChangeColor}`}>
                  {revenueChangeIcon}{" "}
                  {Math.abs(data.revenueChangePercent).toFixed(1)}%
                </span>
                <span className="text-xs text-gray-500">so với hôm qua</span>
              </div>
            </div>
            <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-7 h-7 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Số đơn hàng mới */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Đơn hàng mới (Chờ xử lý)
              </p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                {data.newOrdersCount}
              </p>
              <Link
                href="/admin/orders?status=PENDING"
                className="text-xs text-blue-600 hover:text-blue-700 mt-2 inline-block"
              >
                Xem tất cả →
              </Link>
            </div>
            <div className="w-14 h-14 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-7 h-7 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Cảnh báo tồn kho */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Cảnh báo tồn kho
              </p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {data.lowStockCount}
              </p>
              <button
                onClick={() => setLowStockModalOpen(true)}
                className="text-xs text-blue-600 hover:text-blue-700 mt-2 inline-block"
              >
                Kiểm tra ngay →
              </button>
            </div>
            <div className="w-14 h-14 bg-red-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-7 h-7 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Biểu đồ doanh thu 7 ngày */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Doanh thu 7 ngày gần nhất
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.revenueLast7Days}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getDate()}/${date.getMonth() + 1}`;
              }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                if (value >= 1000000) {
                  return `${(value / 1000000).toFixed(1)}M`;
                }
                if (value >= 1000) {
                  return `${(value / 1000).toFixed(0)}K`;
                }
                return value.toString();
              }}
            />
            <Tooltip
              formatter={(value: number) => formatPrice(value)}
              labelFormatter={(label) => {
                const date = new Date(label);
                return date.toLocaleDateString("vi-VN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#3B82F6"
              strokeWidth={2}
              name="Doanh thu"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Todo List - 2 cột */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top đơn hàng mới nhất */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Đơn hàng cần xử lý
            </h2>
            <Link
              href="/admin/orders?status=PENDING"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Xem tất cả →
            </Link>
          </div>
          <div className="space-y-3">
            {data.recentOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Không có đơn hàng mới
              </p>
            ) : (
              data.recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders?orderId=${order.orderId}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {order.orderId}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {order.user?.name ||
                          order.user?.email ||
                          "Khách vãng lai"}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(order.createdAt).toLocaleString("vi-VN")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatPrice(order.total)}
                      </p>
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full mt-1">
                        {order.status === "PENDING"
                          ? "Chờ xử lý"
                          : order.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Đánh giá mới nhất */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Đánh giá mới nhất
            </h2>
            <Link
              href="/admin/testimonials"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Xem tất cả →
            </Link>
          </div>
          <div className="space-y-3">
            {data.recentReviews.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Chưa có đánh giá nào
              </p>
            ) : (
              data.recentReviews.map((review) => (
                <div
                  key={review.id}
                  className="p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium text-gray-900">
                          {review.user.name || review.user.email}
                        </p>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={`w-4 h-4 ${
                                star <= review.rating
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-300"
                              }`}
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                        {review.content || "(Không có nội dung)"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {review.product.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(review.createdAt).toLocaleString("vi-VN")}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Products Modal */}
      {lowStockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden m-4">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900">
                Sản phẩm tồn kho thấp ({data.lowStockProducts.length})
              </h2>
              <button
                onClick={() => setLowStockModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
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

            <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
              {data.lowStockProducts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  Không có sản phẩm tồn kho thấp
                </div>
              ) : (
                <div className="space-y-4">
                  {data.lowStockProducts.map((product) => (
                    <div
                      key={product.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        {product.image && (
                          <div className="flex-shrink-0">
                            <Image
                              src={product.image}
                              alt={product.title}
                              width={80}
                              height={80}
                              className="rounded-lg object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 mb-1">
                                {product.title}
                              </h3>
                              {product.category && (
                                <p className="text-sm text-gray-500 mb-2">
                                  Danh mục: {product.category}
                                </p>
                              )}
                              {!product.hasVariants ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-600">
                                    Tồn kho:
                                  </span>
                                  <span
                                    className={`px-2 py-1 rounded text-sm font-semibold ${
                                      product.stock < 5
                                        ? "bg-red-100 text-red-700"
                                        : "bg-yellow-100 text-yellow-700"
                                    }`}
                                  >
                                    {product.stock}
                                  </span>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <p className="text-sm font-medium text-gray-700">
                                    Variants tồn kho thấp:
                                  </p>
                                  <div className="space-y-1">
                                    {product.variants.map((variant) => (
                                      <div
                                        key={variant.id}
                                        className="flex items-center gap-2 text-sm"
                                      >
                                        <span className="text-gray-600">
                                          {variant.sku
                                            ? `SKU: ${variant.sku}`
                                            : JSON.stringify(variant.options)}
                                        </span>
                                        <span
                                          className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                            variant.stock < 5
                                              ? "bg-red-100 text-red-700"
                                              : "bg-yellow-100 text-yellow-700"
                                          }`}
                                        >
                                          {variant.stock}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end">
              <button
                onClick={() => setLowStockModalOpen(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
