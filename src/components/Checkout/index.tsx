"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/cart-store";
import { useAuth } from "@/hooks/useAuth";
import Breadcrumb from "../Common/Breadcrumb";
import OrderInformation from "./OrderInformation";
import DeliveryAddress from "./DeliveryAddress";
import TotalAmount from "./TotalAmount";
import ShippingOptions from "./ShippingOptions";

const Checkout = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const cartItems = useCartStore((state) => state.items);
  const selectedItems = useCartStore((state) => state.selectedItems);
  const isLoading = useCartStore((state) => state.isLoading);
  const isInitialized = useCartStore((state) => state.isInitialized);
  const loadCart = useCartStore((state) => state.loadCart);
  const [hasLoadedCart, setHasLoadedCart] = useState(false);

  // Load cart if authenticated and not yet initialized
  useEffect(() => {
    if (!authLoading && isAuthenticated && !isInitialized && !hasLoadedCart) {
      setHasLoadedCart(true);
      loadCart();
    }
  }, [authLoading, isAuthenticated, isInitialized, hasLoadedCart, loadCart]);

  // Redirect to cart if no items in cart or no selected items
  // BUT: Don't redirect if we're on the success page or if payment is processing
  useEffect(() => {
    // Wait for cart to load if authenticated
    if (isAuthenticated && !isInitialized) {
      return; // Don't redirect yet, wait for cart to load
    }

    // Check if we're on success page (don't redirect in that case)
    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      if (currentPath.includes("/checkout/success")) {
        return; // Don't redirect if already on success page
      }
    }

    // Only redirect if cart is empty AND we're not in the middle of a payment flow
    // (Cart might be empty temporarily after order creation but before payment completion)
    if (cartItems.length === 0 || selectedItems.length === 0) {
      // Add a small delay to allow payment redirects to happen first
      const timeoutId = setTimeout(() => {
        // Double-check we're still on checkout page (not redirected to success)
        if (typeof window !== "undefined") {
          const currentPath = window.location.pathname;
          if (
            !currentPath.includes("/checkout/success") &&
            currentPath.includes("/checkout")
          ) {
            router.push("/cart");
          }
        }
      }, 1000); // 1 second delay to allow payment redirects

      return () => clearTimeout(timeoutId);
    }
  }, [
    cartItems.length,
    selectedItems.length,
    isAuthenticated,
    isInitialized,
    router,
  ]);

  // Show loading state while cart is loading (especially after login)
  if (isAuthenticated && (!isInitialized || isLoading)) {
    return (
      <>
        <Breadcrumb title={"Thanh toán"} pages={["checkout"]} />
        <section className="overflow-hidden py-8 bg-gray-50">
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue border-t-transparent mb-4"></div>
                <p className="text-dark-4">Đang tải giỏ hàng...</p>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  // Don't render checkout if no items
  if (cartItems.length === 0 || selectedItems.length === 0) {
    return null;
  }

  return (
    <>
      <Breadcrumb title={"Thanh toán"} pages={["checkout"]} />
      <section className="overflow-hidden py-8 bg-gray-50">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Order Information & Shipping Options */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Information */}
              <OrderInformation />

              {/* Shipping Options */}
              <ShippingOptions />
            </div>

            {/* Right Column - Delivery Address & Total Amount */}
            <div className="space-y-6">
              {/* Delivery Address */}
              <DeliveryAddress />

              {/* Total Amount */}
              <TotalAmount />
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Checkout;
