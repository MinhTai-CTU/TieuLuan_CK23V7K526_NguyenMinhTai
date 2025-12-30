"use client";
import React, { useState, useEffect } from "react";
import Breadcrumb from "../Common/Breadcrumb";
import Image from "next/image";
import Link from "next/link";
import {
  getRecentlyViewed,
  clearRecentlyViewed,
  removeFromRecentlyViewed,
  RecentlyViewedProduct,
} from "@/utils/recentlyViewed";
import { formatPrice } from "@/utils/formatPrice";
import toast from "react-hot-toast";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "../ui/alert-dialog";

const RecentlyViewedPage = () => {
  const [products, setProducts] = useState<RecentlyViewedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showClearDialog, setShowClearDialog] = useState(false);

  useEffect(() => {
    // Load products from localStorage
    const loadProducts = () => {
      try {
        const viewedProducts = getRecentlyViewed();
        setProducts(viewedProducts);
      } catch (error) {
        console.error("Error loading recently viewed products:", error);
        toast.error("Không thể tải lịch sử xem sản phẩm");
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();

    // Listen for storage changes (in case user opens multiple tabs)
    const handleStorageChange = () => {
      loadProducts();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleClearAll = () => {
    setShowClearDialog(true);
  };

  const confirmClearAll = () => {
    clearRecentlyViewed();
    setProducts([]);
    toast.success("Đã xóa toàn bộ lịch sử xem");
    setShowClearDialog(false);
  };

  const handleRemoveItem = (productId: string) => {
    removeFromRecentlyViewed(productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    toast.success("Đã xóa sản phẩm khỏi lịch sử");
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Vừa xem";
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString("vi-VN");
  };

  if (isLoading) {
    return (
      <>
        <Breadcrumb title={"Sản phẩm đã xem gần đây"} pages={["xem gần đây"]} />
        <section className="overflow-hidden py-20 bg-gray-2">
          <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue"></div>
              <p className="mt-4 text-gray-600">Đang tải...</p>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Breadcrumb title={"Sản phẩm đã xem gần đây"} pages={["xem gần đây"]} />

      {/* Clear All Confirmation Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa toàn bộ lịch sử xem? Hành động này không
              thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmClearAll}
              className="bg-red hover:bg-red-dark"
            >
              Xóa tất cả
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <section className="overflow-hidden py-20 bg-gray-2">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-1 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-dark mb-2">
                  Sản phẩm đã xem gần đây
                </h1>
                <p className="text-gray-600">
                  {products.length > 0
                    ? `Bạn đã xem ${products.length} sản phẩm`
                    : "Chưa có sản phẩm nào được xem"}
                </p>
              </div>
              {products.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 text-sm font-medium text-red bg-red/10 rounded-md hover:bg-red/20 transition-colors"
                >
                  Xóa tất cả
                </button>
              )}
            </div>
          </div>

          {/* Products Grid */}
          {products.length === 0 ? (
            <div className="bg-white rounded-xl shadow-1 p-12 text-center">
              <svg
                className="mx-auto h-24 w-24 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Chưa có sản phẩm nào
              </h3>
              <p className="text-gray-600 mb-6">
                Các sản phẩm bạn xem sẽ được lưu ở đây
              </p>
              <Link
                href="/"
                className="inline-flex items-center px-6 py-3 bg-blue text-white rounded-md hover:bg-blue-dark transition-colors font-medium"
              >
                Xem sản phẩm
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-1 overflow-hidden hover:shadow-2 transition-shadow group relative"
                >
                  {/* Remove button */}
                  <button
                    onClick={() => handleRemoveItem(product.id)}
                    className="absolute top-2 right-2 z-10 p-2 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red hover:text-white"
                    title="Xóa khỏi lịch sử"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>

                  {/* Product Image */}
                  <Link href={`/shop-details?id=${product.id}`}>
                    <div className="relative w-full h-64 bg-gray-2 overflow-hidden">
                      <Image
                        src={product.image}
                        alt={product.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />
                    </div>
                  </Link>

                  {/* Product Info */}
                  <div className="p-4">
                    <Link href={`/shop-details?id=${product.id}`}>
                      <h3 className="font-medium text-dark mb-2 line-clamp-2 hover:text-blue transition-colors">
                        {product.title}
                      </h3>
                    </Link>

                    {/* Price */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-semibold text-blue">
                        {formatPrice(product.discountedPrice || product.price)}
                      </span>
                      {product.discountedPrice && (
                        <span className="text-sm text-gray-500 line-through">
                          {formatPrice(product.price)}
                        </span>
                      )}
                    </div>

                    {/* Viewed time */}
                    <p className="text-xs text-gray-500">
                      {formatDate(product.viewedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default RecentlyViewedPage;
