"use client";
import React, { useState } from "react";
import Breadcrumb from "../Common/Breadcrumb";
import {
  useWishlist,
  useRemoveFromWishlist,
} from "@/hooks/queries/useWishlist";
import SingleItem from "./SingleItem";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

export const Wishlist = () => {
  const { isAuthenticated } = useAuth();
  const { data: wishlistItems, isLoading, isError } = useWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);

  const handleClearWishlist = () => {
    if (!wishlistItems || wishlistItems.length === 0) {
      toast.error("Danh sách yêu thích đã trống");
      return;
    }
    setIsDeleteAllDialogOpen(true);
  };

  const confirmClearWishlist = async () => {
    if (!wishlistItems || wishlistItems.length === 0) return;

    try {
      // Remove all items one by one
      const removePromises = wishlistItems.map((item) =>
        removeFromWishlist.mutateAsync({
          productId: item.productId,
          productVariantId: item.productVariantId || null,
          selectedOptions: item.selectedOptions || null,
        })
      );
      await Promise.all(removePromises);
      toast.success("Đã xóa tất cả sản phẩm khỏi danh sách yêu thích");
      setIsDeleteAllDialogOpen(false);
    } catch (error) {
      toast.error("Không thể xóa tất cả sản phẩm");
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <Breadcrumb
          title={"Danh sách yêu thích"}
          pages={["Danh sách yêu thích"]}
        />
        <section className="overflow-hidden py-20 bg-gray-2">
          <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
            <div className="bg-white rounded-[10px] shadow-1 p-12 text-center">
              <p className="text-dark text-lg mb-4">
                Vui lòng đăng nhập để xem danh sách yêu thích của bạn
              </p>
              <Link
                href="/signin"
                className="inline-flex font-medium text-white bg-blue py-3 px-7 rounded-md ease-out duration-200 hover:bg-blue-dark"
              >
                Đăng nhập
              </Link>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Breadcrumb
        title={"Danh sách yêu thích"}
        pages={["Danh sách yêu thích"]}
      />
      <section className="overflow-hidden py-20 bg-gray-2">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <div className="flex flex-wrap items-center justify-between gap-5 mb-7.5">
            <h2 className="font-medium text-dark text-2xl">
              Danh sách yêu thích của bạn
            </h2>
            {wishlistItems && wishlistItems.length > 0 && (
              <button
                onClick={handleClearWishlist}
                disabled={removeFromWishlist.isPending}
                className="text-blue hover:text-blue-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Xóa tất cả
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="bg-white rounded-[10px] shadow-1 p-12 text-center">
              <p className="text-dark">Đang tải danh sách yêu thích...</p>
            </div>
          ) : isError ? (
            <div className="bg-white rounded-[10px] shadow-1 p-12 text-center">
              <p className="text-red-500 mb-4">
                Không thể tải danh sách yêu thích. Vui lòng thử lại sau.
              </p>
            </div>
          ) : !wishlistItems || wishlistItems.length === 0 ? (
            <div className="bg-white rounded-[10px] shadow-1 p-12 text-center">
              <p className="text-dark text-lg mb-4">
                Danh sách yêu thích của bạn đang trống
              </p>
              <Link
                href="/shop-with-sidebar"
                className="inline-flex font-medium text-white bg-blue py-3 px-7 rounded-md ease-out duration-200 hover:bg-blue-dark"
              >
                Tiếp tục mua sắm
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-[10px] shadow-1">
              <div className="w-full overflow-x-auto">
                <div className="min-w-[1170px]">
                  {/* <!-- table header --> */}
                  <div className="flex items-center py-5.5 px-10">
                    <div className="min-w-[83px]"></div>
                    <div className="min-w-[387px]">
                      <p className="text-dark">Sản phẩm</p>
                    </div>

                    <div className="min-w-[205px]">
                      <p className="text-dark">Đơn giá</p>
                    </div>

                    <div className="min-w-[265px]">
                      <p className="text-dark">Tình trạng kho</p>
                    </div>

                    <div className="min-w-[150px]">
                      <p className="text-dark text-right">Thao tác</p>
                    </div>
                  </div>

                  {/* <!-- wish item --> */}
                  {wishlistItems.map((item) => (
                    <SingleItem item={item} key={item.id} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Delete All Confirmation Dialog */}
      <AlertDialog
        open={isDeleteAllDialogOpen}
        onOpenChange={setIsDeleteAllDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa tất cả sản phẩm</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa tất cả sản phẩm khỏi danh sách yêu
              thích? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmClearWishlist}
              className="bg-red-600 hover:bg-red-700"
              disabled={removeFromWishlist.isPending}
            >
              {removeFromWishlist.isPending ? "Đang xóa..." : "Xóa tất cả"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
