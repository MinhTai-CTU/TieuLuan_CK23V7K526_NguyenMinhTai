"use client";
import { useEffect, useRef } from "react";
import { useCartStore } from "@/stores/cart-store";

/**
 * Component to automatically load cart when app starts
 * With persist middleware, items are loaded from localStorage immediately (no flicker)
 * This component ensures we sync with database if logged in, or enrich guest items
 */
export default function CartLoader() {
  const loadCart = useCartStore((state) => state.loadCart);
  const isInitialized = useCartStore((state) => state.isInitialized);
  const items = useCartStore((state) => state.items);
  const hasLoaded = useRef(false);

  useEffect(() => {
    // Only load once when component mounts and persist has finished rehydrating
    // Persist will load items from localStorage first (preventing flicker)
    // Then we sync with database or enrich guest items
    if (!hasLoaded.current && isInitialized) {
      hasLoaded.current = true;
      // loadCart will sync with database if logged in, or enrich guest items
      // It's safe to call even if items are already loaded from persist
      loadCart();
    }
  }, [loadCart, isInitialized]);

  return null; // This component doesn't render anything
}
