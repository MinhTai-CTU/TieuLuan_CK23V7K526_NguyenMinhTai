"use client";
import { useEffect, useRef } from "react";
import { useCartStore } from "@/stores/cart-store";
import { useAuth } from "@/hooks/useAuth";

/**
 * Component to automatically load cart when app starts
 * With persist middleware, items are loaded from localStorage immediately (no flicker)
 * This component ensures we sync with database if logged in, or enrich guest items
 * Also reloads cart when user logs in
 */
export default function CartLoader() {
  const loadCart = useCartStore((state) => state.loadCart);
  const isInitialized = useCartStore((state) => state.isInitialized);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const hasLoaded = useRef(false);
  const lastAuthState = useRef<boolean | null>(null);

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

  // Reload cart when user logs in (after logout)
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    // Check if user just logged in (was not authenticated, now is authenticated)
    if (lastAuthState.current === false && isAuthenticated) {
      // User just logged in, reload cart from database
      // This will set isInitialized = true after loading
      loadCart();
    }

    // Update last auth state
    lastAuthState.current = isAuthenticated;
  }, [isAuthenticated, authLoading, loadCart]);

  return null; // This component doesn't render anything
}
