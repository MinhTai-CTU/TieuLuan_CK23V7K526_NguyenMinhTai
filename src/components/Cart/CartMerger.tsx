"use client";
import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCartStore } from "@/stores/cart-store";

/**
 * Component to automatically merge guest cart into database cart when user logs in
 * This runs silently in the background
 */
export default function CartMerger() {
  const { isAuthenticated, isLoading } = useAuth();
  const mergeGuestCart = useCartStore((state) => state.mergeGuestCart);
  const hasMerged = useRef(false);

  useEffect(() => {
    // Only merge when user is authenticated and not loading
    if (!isLoading && isAuthenticated && !hasMerged.current) {
      hasMerged.current = true;
      mergeGuestCart();
    }

    // Reset flag when user logs out
    if (!isAuthenticated) {
      hasMerged.current = false;
    }
  }, [isAuthenticated, isLoading, mergeGuestCart]);

  return null; // This component doesn't render anything
}
