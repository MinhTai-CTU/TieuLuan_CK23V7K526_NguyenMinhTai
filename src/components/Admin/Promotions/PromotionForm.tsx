"use client";

import { useState, useEffect } from "react";
import { getToken } from "@/lib/auth-storage";
import toast from "react-hot-toast";

interface PromotionTarget {
  id: string;
  productId: string | null;
  variantId: string | null;
  specificValue: number | null;
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
  perUserLimit: number | null;
  minOrderValue: number | null;
  isActive: boolean;
  targets: PromotionTarget[];
}

interface PromotionFormProps {
  promotion?: Promotion | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PromotionForm({
  promotion,
  onClose,
  onSuccess,
}: PromotionFormProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scope, setScope] = useState<"GLOBAL_ORDER" | "SPECIFIC_ITEMS">(
    "GLOBAL_ORDER"
  );
  const [type, setType] = useState<
    "PERCENTAGE" | "FIXED" | "FREESHIP" | "FREESHIP_PERCENTAGE"
  >("PERCENTAGE");
  const [value, setValue] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [perUserLimit, setPerUserLimit] = useState("");
  const [minOrderValue, setMinOrderValue] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Target selection states
  const [categories, setCategories] = useState<
    Array<{ id: string; title: string }>
  >([]);
  const [products, setProducts] = useState<
    Array<{
      id: string;
      title: string;
      categoryId: string | null;
      hasVariants: boolean;
      variants?: Array<{ id: string; sku: string | null; options: any }>;
    }>
  >([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedTargets, setSelectedTargets] = useState<
    Array<{
      type: "category" | "product" | "variant";
      id: string;
      name: string;
      productId?: string | null;
      variantId?: string | null;
      specificValue?: number | null;
    }>
  >([]);
  const [loadingData, setLoadingData] = useState(false);
  const [targetsLoaded, setTargetsLoaded] = useState(false);

  useEffect(() => {
    if (promotion) {
      setCode(promotion.code);
      setName(promotion.name || "");
      setDescription(promotion.description || "");
      setScope(promotion.scope);
      setType(promotion.type);
      setValue(promotion.value.toString());
      setMaxDiscount(promotion.maxDiscount?.toString() || "");
      setIsActive(promotion.isActive);

      // Parse start date and time
      const start = new Date(promotion.startDate);
      setStartDate(start.toISOString().split("T")[0]);
      setStartTime(
        `${String(start.getHours()).padStart(2, "0")}:${String(
          start.getMinutes()
        ).padStart(2, "0")}`
      );

      // Parse end date and time
      const end = new Date(promotion.endDate);
      setEndDate(end.toISOString().split("T")[0]);
      setEndTime(
        `${String(end.getHours()).padStart(2, "0")}:${String(
          end.getMinutes()
        ).padStart(2, "0")}`
      );

      setUsageLimit(promotion.usageLimit?.toString() || "");
      setPerUserLimit(promotion.perUserLimit?.toString() || "");
      setMinOrderValue(promotion.minOrderValue?.toString() || "");

      // Set scope first to trigger data fetch
      if (promotion.scope === "SPECIFIC_ITEMS") {
        // Targets will be loaded after products are fetched
      }
    } else {
      // Set default values for new promotion
      const now = new Date();
      setStartDate(now.toISOString().split("T")[0]);
      setStartTime(
        `${String(now.getHours()).padStart(2, "0")}:${String(
          now.getMinutes()
        ).padStart(2, "0")}`
      );

      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      setEndDate(tomorrow.toISOString().split("T")[0]);
      setEndTime(
        `${String(tomorrow.getHours()).padStart(2, "0")}:${String(
          tomorrow.getMinutes()
        ).padStart(2, "0")}`
      );
    }
  }, [promotion]);

  // Fetch categories and products
  useEffect(() => {
    if (scope === "SPECIFIC_ITEMS") {
      fetchCategories();
      fetchProducts();
    } else {
      // Clear targets when switching to GLOBAL_ORDER
      setSelectedTargets([]);
    }
  }, [scope]);

  // Load existing targets when promotion data and products are available
  useEffect(() => {
    if (
      promotion &&
      promotion.targets &&
      promotion.targets.length > 0 &&
      products.length > 0 &&
      !targetsLoaded
    ) {
      const targets = promotion.targets
        .map((target) => {
          if (target.variantId) {
            const product = products.find((p) =>
              p.variants?.some((v) => v.id === target.variantId)
            );
            const variant = product?.variants?.find(
              (v) => v.id === target.variantId
            );
            return {
              type: "variant" as const,
              id: target.variantId,
              name: `${product?.title || ""} - ${variant?.sku || "Variant"}`,
              productId: target.productId,
              variantId: target.variantId,
              specificValue: target.specificValue,
            };
          } else if (target.productId) {
            const product = products.find((p) => p.id === target.productId);
            return {
              type: "product" as const,
              id: target.productId,
              name: product?.title || "Unknown Product",
              productId: target.productId,
              variantId: null,
              specificValue: target.specificValue,
            };
          }
          return null;
        })
        .filter(Boolean) as Array<{
        type: "category" | "product" | "variant";
        id: string;
        name: string;
        productId?: string | null;
        variantId?: string | null;
        specificValue?: number | null;
      }>;
      setSelectedTargets(targets);
      setTargetsLoaded(true);
    }
  }, [promotion, products, targetsLoaded]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoadingData(true);
      const token = getToken();
      const response = await fetch("/api/products", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleAddCategoryTarget = async () => {
    if (!selectedCategoryId) return;

    const category = categories.find((c) => c.id === selectedCategoryId);
    if (!category) return;

    // Check if category already selected
    if (
      selectedTargets.some(
        (t) => t.type === "category" && t.id === selectedCategoryId
      )
    ) {
      toast.error("Danh mục này đã được chọn");
      return;
    }

    // Fetch products in this category
    try {
      const token = getToken();
      const response = await fetch(
        `/api/products?categoryId=${selectedCategoryId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();

      if (data.success && data.data.length > 0) {
        // Add all products in category as targets
        const categoryProducts = data.data.map((product: any) => ({
          type: "product" as const,
          id: product.id,
          name: product.title,
          productId: product.id,
          variantId: null,
        }));

        setSelectedTargets([...selectedTargets, ...categoryProducts]);
        toast.success(
          `Đã thêm ${categoryProducts.length} sản phẩm từ danh mục "${category.title}"`
        );
      } else {
        toast.error("Danh mục này không có sản phẩm nào");
      }
    } catch (error) {
      console.error("Error fetching category products:", error);
      toast.error("Không thể tải sản phẩm trong danh mục");
    }

    setSelectedCategoryId("");
  };

  const handleAddProductTarget = () => {
    if (!selectedProductId) return;

    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    // Check if product already selected
    if (
      selectedTargets.some(
        (t) => t.type === "product" && t.productId === selectedProductId
      )
    ) {
      toast.error("Sản phẩm này đã được chọn");
      return;
    }

    setSelectedTargets([
      ...selectedTargets,
      {
        type: "product",
        id: selectedProductId,
        name: product.title,
        productId: selectedProductId,
        variantId: null,
      },
    ]);
    setSelectedProductId("");
  };

  const handleRemoveTarget = (index: number) => {
    setSelectedTargets(selectedTargets.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Combine date and time
      const startDateTime = new Date(`${startDate}T${startTime}:00`);
      const endDateTime = new Date(`${endDate}T${endTime}:00`);

      // Validate dates
      if (startDateTime >= endDateTime) {
        toast.error("Ngày kết thúc phải sau ngày bắt đầu");
        setIsSubmitting(false);
        return;
      }

      // Validate targets if scope is SPECIFIC_ITEMS
      if (scope === "SPECIFIC_ITEMS" && selectedTargets.length === 0) {
        toast.error("Vui lòng chọn ít nhất một sản phẩm hoặc danh mục");
        setIsSubmitting(false);
        return;
      }

      // Validate value for freeship types
      let finalValue = parseFloat(value) || 0;
      if (type === "FREESHIP") {
        finalValue = 100; // Always 100% for free shipping
      } else if (type === "FREESHIP_PERCENTAGE") {
        if (!value || parseFloat(value) <= 0 || parseFloat(value) > 100) {
          toast.error("Giá trị giảm phí ship phải từ 1% đến 100%");
          setIsSubmitting(false);
          return;
        }
        finalValue = parseFloat(value);
      } else if (!value || parseFloat(value) <= 0) {
        toast.error("Vui lòng nhập giá trị giảm giá hợp lệ");
        setIsSubmitting(false);
        return;
      }

      // Freeship promotions should only apply to GLOBAL_ORDER
      if (
        (type === "FREESHIP" || type === "FREESHIP_PERCENTAGE") &&
        scope === "SPECIFIC_ITEMS"
      ) {
        toast.error("Chương trình freeship chỉ áp dụng cho toàn bộ đơn hàng");
        setIsSubmitting(false);
        return;
      }

      // Build targets array
      const targets: Array<{
        productId?: string | null;
        variantId?: string | null;
        specificValue?: number | null;
      }> = [];

      if (scope === "SPECIFIC_ITEMS") {
        for (const target of selectedTargets) {
          // All targets are now products (categories are converted to products)
          if (target.type === "product") {
            targets.push({
              productId: target.productId || null,
              variantId: null,
              specificValue: target.specificValue || null,
            });
          } else if (target.type === "variant") {
            targets.push({
              productId: target.productId || null,
              variantId: target.variantId || null,
              specificValue: target.specificValue || null,
            });
          }
        }
      }

      const token = getToken();
      const payload = {
        code: code.toUpperCase(),
        name: name || null,
        description: description || null,
        scope,
        type,
        value: finalValue,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        perUserLimit: perUserLimit ? parseInt(perUserLimit) : null,
        minOrderValue: minOrderValue ? parseFloat(minOrderValue) : null,
        isActive,
        targets,
      };

      let response;
      if (promotion) {
        // Update existing promotion
        response = await fetch(`/api/admin/promotions/${promotion.id}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new promotion
        response = await fetch("/api/admin/promotions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(
          promotion
            ? "Cập nhật mã khuyến mãi thành công"
            : "Tạo mã khuyến mãi thành công"
        );
        onSuccess();
      } else {
        toast.error(result.error || "Đã xảy ra lỗi");
      }
    } catch (error) {
      console.error("Error saving promotion:", error);
      toast.error("Đã xảy ra lỗi khi lưu mã khuyến mãi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex-shrink-0 p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {promotion ? "Chỉnh sửa mã khuyến mãi" : "Thêm mã khuyến mãi mới"}
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
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <form
            id="promotion-form"
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Basic Information */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Thông tin cơ bản
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Mã khuyến mãi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="HELLO30"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                    required
                    disabled={!!promotion}
                  />
                  {promotion && (
                    <p className="mt-1 text-xs text-gray-500">
                      Không thể thay đổi mã khuyến mãi
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Tên chương trình
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ví dụ: Giảm giá Black Friday"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mô tả
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả chi tiết về chương trình khuyến mãi..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Discount Settings */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Cài đặt giảm giá
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Phạm vi áp dụng <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={scope}
                    onChange={(e) =>
                      setScope(
                        e.target.value as "GLOBAL_ORDER" | "SPECIFIC_ITEMS"
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="GLOBAL_ORDER">Toàn bộ đơn hàng</option>
                    <option value="SPECIFIC_ITEMS">Sản phẩm cụ thể</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Loại giảm giá <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={type}
                    onChange={(e) =>
                      setType(
                        e.target.value as
                          | "PERCENTAGE"
                          | "FIXED"
                          | "FREESHIP"
                          | "FREESHIP_PERCENTAGE"
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="PERCENTAGE">Theo phần trăm (%)</option>
                    <option value="FIXED">Số tiền cố định (VNĐ)</option>
                    <option value="FREESHIP">Miễn phí vận chuyển (100%)</option>
                    <option value="FREESHIP_PERCENTAGE">
                      Giảm giá vận chuyển theo %
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(type === "PERCENTAGE" ||
                  type === "FIXED" ||
                  type === "FREESHIP_PERCENTAGE") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Giá trị giảm <span className="text-red-500">*</span>{" "}
                      {type === "PERCENTAGE" || type === "FREESHIP_PERCENTAGE"
                        ? "(%)"
                        : "(VNĐ)"}
                    </label>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder={
                        type === "PERCENTAGE" || type === "FREESHIP_PERCENTAGE"
                          ? type === "FREESHIP_PERCENTAGE"
                            ? "50"
                            : "30"
                          : "50000"
                      }
                      min="0"
                      max={type === "FREESHIP_PERCENTAGE" ? "100" : undefined}
                      step={
                        type === "PERCENTAGE" || type === "FREESHIP_PERCENTAGE"
                          ? "1"
                          : "1000"
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    {type === "FREESHIP_PERCENTAGE" && (
                      <p className="text-xs text-gray-500 mt-1">
                        Nhập phần trăm giảm giá phí vận chuyển (0-100%)
                      </p>
                    )}
                  </div>
                )}

                {type === "FREESHIP" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Miễn phí vận chuyển
                    </label>
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600">
                      Tự động miễn phí 100% phí vận chuyển
                    </div>
                    <input type="hidden" value="100" />
                  </div>
                )}

                {type === "PERCENTAGE" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Giảm tối đa (VNĐ)
                    </label>
                    <input
                      type="number"
                      value={maxDiscount}
                      onChange={(e) => setMaxDiscount(e.target.value)}
                      placeholder="500000"
                      min="0"
                      step="1000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}

                {(type === "FREESHIP" || type === "FREESHIP_PERCENTAGE") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Giảm tối đa phí ship (VNĐ)
                    </label>
                    <input
                      type="number"
                      value={maxDiscount}
                      onChange={(e) => setMaxDiscount(e.target.value)}
                      placeholder="50000"
                      min="0"
                      step="1000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Giới hạn số tiền tối đa được giảm cho phí vận chuyển (để
                      trống = không giới hạn)
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Đơn hàng tối thiểu (VNĐ)
                </label>
                <input
                  type="number"
                  value={minOrderValue}
                  onChange={(e) => setMinOrderValue(e.target.value)}
                  placeholder="100000"
                  min="0"
                  step="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Time Settings */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Thời gian hiệu lực
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Ngày bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Giờ bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Ngày kết thúc <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Giờ kết thúc <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Usage Limits */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Giới hạn sử dụng
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Tổng số lần sử dụng
                  </label>
                  <input
                    type="number"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    placeholder="Để trống = không giới hạn"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Để trống nếu không giới hạn
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Số lần/người dùng
                  </label>
                  <input
                    type="number"
                    value={perUserLimit}
                    onChange={(e) => setPerUserLimit(e.target.value)}
                    placeholder="Để trống = không giới hạn"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Để trống nếu không giới hạn
                  </p>
                </div>
              </div>
            </div>

            {/* Target Selection - Only show when scope is SPECIFIC_ITEMS */}
            {scope === "SPECIFIC_ITEMS" && (
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Chọn sản phẩm áp dụng
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Chọn danh mục hoặc sản phẩm cụ thể để áp dụng mã khuyến mãi.
                  Nếu chọn danh mục, mã sẽ áp dụng cho tất cả sản phẩm trong
                  danh mục đó.
                </p>

                {loadingData ? (
                  <div className="text-center py-4">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue border-t-transparent"></div>
                    <p className="mt-2 text-sm text-gray-500">
                      Đang tải danh sách...
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Add Category */}
                    <div className="flex gap-2">
                      <select
                        value={selectedCategoryId}
                        onChange={(e) => setSelectedCategoryId(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Chọn danh mục...</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.title}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleAddCategoryTarget}
                        disabled={!selectedCategoryId}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Thêm danh mục
                      </button>
                    </div>

                    {/* Add Product */}
                    <div className="flex gap-2">
                      <select
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Chọn sản phẩm...</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.title}
                            {product.hasVariants && " (Có biến thể)"}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleAddProductTarget}
                        disabled={!selectedProductId}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Thêm sản phẩm
                      </button>
                    </div>

                    {/* Selected Targets */}
                    {selectedTargets.length > 0 && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Đã chọn ({selectedTargets.length})
                        </label>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {selectedTargets.map((target, index) => (
                            <div
                              key={`${target.type}-${target.id}-${index}`}
                              className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    target.type === "category"
                                      ? "bg-purple-100 text-purple-800"
                                      : target.type === "product"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {target.type === "category"
                                    ? "Danh mục"
                                    : target.type === "product"
                                      ? "Sản phẩm"
                                      : "Biến thể"}
                                </span>
                                <span className="text-sm text-gray-900">
                                  {target.name}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveTarget(index)}
                                className="text-red-600 hover:text-red-700 transition-colors"
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
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Status */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="isActive"
                  className="text-sm font-medium text-gray-700"
                >
                  Kích hoạt mã khuyến mãi ngay sau khi tạo
                </label>
              </div>
            </div>
          </form>
        </div>
        <div className="flex-shrink-0 p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Hủy
            </button>
            <button
              type="submit"
              form="promotion-form"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang lưu...</span>
                </>
              ) : (
                <span>{promotion ? "Cập nhật" : "Tạo mã khuyến mãi"}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
