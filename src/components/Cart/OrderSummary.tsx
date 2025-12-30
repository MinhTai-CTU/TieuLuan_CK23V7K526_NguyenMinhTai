"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/cart-store";
import { formatPrice } from "@/utils/formatPrice";
import { useAuth } from "@/hooks/useAuth";

const OrderSummary = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const cartItems = useCartStore((state) => state.items);
  const selectedItems = useCartStore((state) => state.selectedItems);
  const totalPrice = useCartStore((state) => state.getSelectedTotalPrice()); // Use selected total price
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only showing cart data after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if there are any items to checkout
  const hasItemsToCheckout = mounted && selectedItems.length > 0;

  const handleCheckout = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!hasItemsToCheckout) return;

    // Check authentication status
    if (!authLoading && !isAuthenticated) {
      // Redirect to signin with returnUrl
      router.push("/signin?returnUrl=/checkout");
      return;
    }

    // If authenticated, proceed to checkout
    if (isAuthenticated) {
      router.push("/checkout");
    }
  };

  return (
    <div className="lg:max-w-[455px] w-full">
      {/* <!-- order list box --> */}
      <div className="bg-white shadow-1 rounded-[10px]">
        <div className="border-b border-gray-3 py-5 px-4 sm:px-8.5">
          <h3 className="font-medium text-xl text-dark">Tổng tiền</h3>
        </div>

        <div className="pt-2.5 pb-8.5 px-4 sm:px-8.5">
          {/* <!-- title --> */}
          <div className="flex items-center justify-between py-5 border-b border-gray-3">
            <div>
              <h4 className="font-medium text-dark">Sản phẩm</h4>
            </div>
            <div>
              <h4 className="font-medium text-dark text-right">Tổng cộng</h4>
            </div>
          </div>

          {/* <!-- product item --> */}
          {mounted &&
            cartItems
              .filter((item) => selectedItems.includes(item.cartItemId))
              .map((item, key) => (
                <div
                  key={key}
                  className="flex items-center justify-between py-5 border-b border-gray-3"
                >
                  <div>
                    <p className="text-dark">{item.title}</p>
                  </div>
                  <div>
                    <p className="text-dark text-right">
                      {formatPrice(item.discountedPrice * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}

          {mounted && selectedItems.length === 0 && (
            <div className="flex items-center justify-center py-5">
              <p className="text-gray-500">Không có sản phẩm được chọn</p>
            </div>
          )}

          {/* <!-- total --> */}
          <div className="flex items-center justify-between pt-5">
            <div>
              <p className="font-medium text-lg text-dark">Tổng tiền</p>
            </div>
            <div>
              <p className="font-medium text-lg text-dark text-right">
                {mounted ? formatPrice(totalPrice) : formatPrice(0)}
              </p>
            </div>
          </div>

          {/* <!-- checkout button --> */}
          <button
            type="button"
            onClick={handleCheckout}
            disabled={!hasItemsToCheckout}
            className="w-full flex justify-center font-medium text-white bg-blue py-3 px-6 rounded-md ease-out duration-200 hover:bg-blue-dark mt-7.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Tiếp tục thanh toán
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
