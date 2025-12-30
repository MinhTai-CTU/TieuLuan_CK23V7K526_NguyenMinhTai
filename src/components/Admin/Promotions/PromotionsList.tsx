"use client";

import { useState, useEffect, useMemo } from "react";
import { getToken } from "@/lib/auth-storage";
import toast from "react-hot-toast";
import PromotionForm from "./PromotionForm";
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

interface PromotionTarget {
  id: string;
  productId: string | null;
  variantId: string | null;
  specificValue: number | null;
  product: {
    id: string;
    title: string;
    slug: string;
  } | null;
  variant: {
    id: string;
    sku: string | null;
    options: any;
    product: {
      id: string;
      title: string;
      slug: string;
    };
  } | null;
}

interface Promotion {
  id: string;
  code: string;
  name: string | null;
  description: string | null;
  scope: "GLOBAL_ORDER" | "SPECIFIC_ITEMS";
  type: "PERCENTAGE" | "FIXED" | "FREESHIP" | "FREESHIP_PERCENTAGE";
  value: number;
  maxDiscount: number | null;
  startDate: string;
  endDate: string;
  usageLimit: number | null;
  usedCount: number;
  perUserLimit: number | null;
  minOrderValue: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  targets: PromotionTarget[];
}

export default function PromotionsList() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "not_started" | "active" | "inactive" | "expired"
  >("all");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [promotionToDelete, setPromotionToDelete] = useState<Promotion | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      setError(null);
      const token = getToken();
      if (!token) {
        setError("Vui lòng đăng nhập lại");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/admin/promotions", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Không thể tải danh sách khuyến mãi");
      }

      if (data.success) {
        setPromotions(data.data || []);
      } else {
        throw new Error(data.error || "Không thể tải danh sách khuyến mãi");
      }
    } catch (error) {
      console.error("Error fetching promotions:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi khi tải danh sách khuyến mãi"
      );
      toast.error("Không thể tải danh sách khuyến mãi");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setShowForm(true);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const token = getToken();
      const response = await fetch(`/api/admin/promotions/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "toggleActive" }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(
          `Đã ${currentStatus ? "vô hiệu hóa" : "kích hoạt"} mã khuyến mãi`
        );
        fetchPromotions();
      } else {
        toast.error(result.error || "Không thể cập nhật trạng thái");
      }
    } catch (error) {
      console.error("Error toggling promotion:", error);
      toast.error("Đã xảy ra lỗi khi cập nhật trạng thái");
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingPromotion(null);
  };

  const handleFormSuccess = () => {
    fetchPromotions();
    handleFormClose();
  };

  const handleDeleteClick = (promotion: Promotion) => {
    setPromotionToDelete(promotion);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!promotionToDelete) return;

    setIsDeleting(true);
    try {
      const token = getToken();
      const response = await fetch(
        `/api/admin/promotions/${promotionToDelete.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Đã xóa mã khuyến mãi thành công");
        fetchPromotions();
        setShowDeleteDialog(false);
        setPromotionToDelete(null);
      } else {
        toast.error(result.error || "Không thể xóa mã khuyến mãi");
      }
    } catch (error) {
      console.error("Error deleting promotion:", error);
      toast.error("Đã xảy ra lỗi khi xóa mã khuyến mãi");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setPromotionToDelete(null);
  };

  // Filter promotions
  const filteredPromotions = useMemo(() => {
    return promotions.filter((promotion) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        promotion.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        promotion.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        false;

      // Status filter - ưu tiên kiểm tra hết hạn trước
      const now = new Date();
      const startDate = new Date(promotion.startDate);
      const endDate = new Date(promotion.endDate);
      const isExpired = endDate < now;
      const isNotStarted = !isExpired && startDate > now;
      const isActive =
        !isExpired &&
        !isNotStarted &&
        promotion.isActive &&
        startDate <= now &&
        endDate >= now;
      const isInactive = !promotion.isActive;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "not_started" && isNotStarted) ||
        (statusFilter === "active" && isActive) ||
        (statusFilter === "inactive" && isInactive) ||
        (statusFilter === "expired" && isExpired);

      return matchesSearch && matchesStatus;
    });
  }, [promotions, searchQuery, statusFilter]);

  // Calculate stats - ưu tiên kiểm tra hết hạn trước
  const stats = useMemo(() => {
    const total = promotions.length;
    const now = new Date();

    const expired = promotions.filter((p) => {
      const end = new Date(p.endDate);
      return end < now;
    }).length;

    const notStarted = promotions.filter((p) => {
      const start = new Date(p.startDate);
      const end = new Date(p.endDate);
      // Chưa bắt đầu = start > now và chưa hết hạn
      return start > now && end >= now;
    }).length;

    const active = promotions.filter((p) => {
      const start = new Date(p.startDate);
      const end = new Date(p.endDate);
      // Active = không hết hạn, không chưa bắt đầu, và isActive = true
      return end >= now && start <= now && p.isActive;
    }).length;

    const inactive = promotions.filter((p) => !p.isActive).length;

    return { total, notStarted, active, inactive, expired };
  }, [promotions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue border-t-transparent mb-4"></div>
          <p className="text-gray-500">Đang tải danh sách khuyến mãi...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Đã xảy ra lỗi
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchPromotions}
            className="px-4 py-2 bg-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Tổng mã khuyến mãi
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.total}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600"
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Chưa bắt đầu</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {stats.notStarted}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Đang hoạt động
              </p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {stats.active}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Đã vô hiệu hóa
              </p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">
                {stats.inactive}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-yellow-600"
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Đã hết hạn</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {stats.expired}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tìm kiếm
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo mã hoặc tên..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trạng thái
              </label>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as
                      | "all"
                      | "not_started"
                      | "active"
                      | "inactive"
                      | "expired"
                  )
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tất cả</option>
                <option value="not_started">Chưa bắt đầu</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Đã vô hiệu hóa</option>
                <option value="expired">Đã hết hạn</option>
              </select>
            </div>
          </div>

          {/* Add Button */}
          <button
            onClick={() => {
              setEditingPromotion(null);
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue text-white rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-md hover:shadow-lg font-medium whitespace-nowrap"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Thêm mã khuyến mãi
          </button>
        </div>

        {/* Results count */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Hiển thị{" "}
            <span className="font-semibold text-gray-900">
              {filteredPromotions.length}
            </span>{" "}
            trong tổng số{" "}
            <span className="font-semibold text-gray-900">
              {promotions.length}
            </span>{" "}
            mã khuyến mãi
          </p>
        </div>
      </div>

      {/* Promotions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 via-gray-50 to-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Mã khuyến mãi
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Thông tin
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Giá trị
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Thời gian
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Sử dụng
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPromotions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <svg
                        className="w-16 h-16 text-gray-300 mb-4"
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
                      <p className="text-gray-500 font-medium">
                        {searchQuery || statusFilter !== "all"
                          ? "Không tìm thấy mã khuyến mãi nào phù hợp"
                          : "Chưa có mã khuyến mãi nào"}
                      </p>
                      {(searchQuery || statusFilter !== "all") && (
                        <button
                          onClick={() => {
                            setSearchQuery("");
                            setStatusFilter("all");
                          }}
                          className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                        >
                          Xóa bộ lọc
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPromotions.map((promotion) => {
                  const now = new Date();
                  const startDate = new Date(promotion.startDate);
                  const endDate = new Date(promotion.endDate);

                  // Ưu tiên kiểm tra hết hạn trước
                  const isExpired = endDate < now;
                  const isNotStarted = !isExpired && startDate > now;
                  // Chỉ active khi: không hết hạn, không chưa bắt đầu, và isActive = true
                  const isActiveNow =
                    !isExpired &&
                    !isNotStarted &&
                    promotion.isActive &&
                    startDate <= now &&
                    endDate >= now;

                  return (
                    <tr key={promotion.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            {promotion.code}
                          </p>
                          {promotion.name && (
                            <p className="text-xs text-gray-500 mt-1">
                              {promotion.name}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                promotion.scope === "GLOBAL_ORDER"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-purple-100 text-purple-800"
                              }`}
                            >
                              {promotion.scope === "GLOBAL_ORDER"
                                ? "Toàn đơn hàng"
                                : "Sản phẩm cụ thể"}
                            </span>
                            {(promotion.type === "FREESHIP" ||
                              promotion.type === "FREESHIP_PERCENTAGE") && (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                Miễn phí vận chuyển
                              </span>
                            )}
                          </div>
                          {promotion.scope === "SPECIFIC_ITEMS" &&
                            promotion.targets &&
                            promotion.targets.length > 0 && (
                              <p className="text-xs text-gray-500">
                                {promotion.targets.length} sản phẩm đã chọn
                              </p>
                            )}
                          {promotion.minOrderValue && (
                            <p className="text-xs text-gray-500">
                              Đơn tối thiểu:{" "}
                              {promotion.minOrderValue.toLocaleString("vi-VN")}{" "}
                              đ
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {promotion.type === "FREESHIP"
                              ? "Miễn phí vận chuyển"
                              : promotion.type === "FREESHIP_PERCENTAGE"
                                ? `Giảm ${promotion.value}% phí ship`
                                : promotion.type === "PERCENTAGE"
                                  ? `${promotion.value}%`
                                  : `${promotion.value.toLocaleString("vi-VN")} đ`}
                          </p>
                          {promotion.maxDiscount && (
                            <p className="text-xs text-gray-500">
                              Tối đa:{" "}
                              {promotion.maxDiscount.toLocaleString("vi-VN")} đ
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>
                            <span className="font-medium">Bắt đầu:</span>{" "}
                            {new Date(promotion.startDate).toLocaleString(
                              "vi-VN",
                              {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </p>
                          <p>
                            <span className="font-medium">Kết thúc:</span>{" "}
                            {new Date(promotion.endDate).toLocaleString(
                              "vi-VN",
                              {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-gray-900">
                            {promotion.usedCount}
                            {promotion.usageLimit
                              ? ` / ${promotion.usageLimit}`
                              : " / ∞"}
                          </p>
                          {promotion.perUserLimit && (
                            <p className="text-xs text-gray-500">
                              {promotion.perUserLimit} lần/user
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isExpired ? (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            Đã hết hạn
                          </span>
                        ) : isNotStarted ? (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            Chưa bắt đầu
                          </span>
                        ) : isActiveNow ? (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Đang hoạt động
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Đã vô hiệu hóa
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(promotion)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"
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
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            Sửa
                          </button>
                          <button
                            onClick={() =>
                              handleToggleActive(
                                promotion.id,
                                promotion.isActive
                              )
                            }
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                              promotion.isActive
                                ? "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                                : "text-green-600 hover:text-green-700 hover:bg-green-50"
                            }`}
                          >
                            {promotion.isActive ? (
                              <>
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
                                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                  />
                                </svg>
                                Vô hiệu hóa
                              </>
                            ) : (
                              <>
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
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                Kích hoạt
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteClick(promotion)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Promotion Form Modal */}
      {showForm && (
        <PromotionForm
          promotion={editingPromotion}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa mã khuyến mãi</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa mã khuyến mãi{" "}
              <span className="font-semibold text-gray-900">
                {promotionToDelete?.code}
              </span>
              ? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
