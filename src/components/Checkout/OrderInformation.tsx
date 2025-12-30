"use client";
import React from "react";
import Image from "next/image";
import { useCartStore } from "@/stores/cart-store";
import { formatPrice } from "@/utils/formatPrice";

const OrderInformation = () => {
  const cartItems = useCartStore((state) => state.items);
  const selectedItems = useCartStore((state) => state.selectedItems);

  // Filter only selected items
  const selectedCartItems = cartItems.filter((item) =>
    selectedItems.includes(item.cartItemId)
  );

  console.log(selectedCartItems);

  return (
    <div className="bg-white rounded-[10px] shadow-1 border border-gray-3 p-6">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-3">
        <h2 className="text-lg font-semibold text-dark">Thông tin đơn hàng</h2>
        <span className="text-sm text-dark-4">
          Tất cả ({selectedCartItems.length}{" "}
          {selectedCartItems.length === 1 ? "sản phẩm" : "sản phẩm"})
        </span>
      </div>

      <div className="space-y-4">
        {selectedCartItems.map((item) => (
          <div
            key={item.cartItemId}
            className="flex items-start gap-4 pb-4 border-b border-gray-3 last:border-0"
          >
            {/* Product Image */}
            <div className="flex-shrink-0 w-16 h-16 bg-gray-2 rounded-[5px] overflow-hidden">
              <Image
                src={
                  item.imgs?.thumbnails[0] ||
                  item.imgs?.previews[0] ||
                  "/images/products/default.png"
                }
                alt={item.title}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-dark line-clamp-2 mb-2">
                {item.title}
              </h3>
              <div className="flex items-center gap-4 text-xs text-dark-4">
                <span>Đơn giá: {formatPrice(item.discountedPrice)}</span>
                <span>Số lượng: {item.quantity}</span>
              </div>
            </div>

            {/* Total Price */}
            <div className="flex-shrink-0 text-right">
              <p className="text-sm font-semibold text-dark">
                {formatPrice(item.discountedPrice * item.quantity)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderInformation;
