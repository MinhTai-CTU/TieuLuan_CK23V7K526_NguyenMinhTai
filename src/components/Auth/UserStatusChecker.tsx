"use client";
import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getToken, clearAuth } from "@/lib/auth-storage";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

/**
 * Component to check user status on app load (client-side fallback)
 * This is a backup check in case middleware didn't catch it
 * Runs silently in the background
 */
export default function UserStatusChecker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { logout } = useAuth();
  const hasChecked = useRef(false); // Prevent multiple checks

  useEffect(() => {
    // Check if redirected from middleware with error
    const error = searchParams.get("error");

    // Skip if we're on oauth-callback page (it handles its own errors)
    if (
      typeof window !== "undefined" &&
      window.location.pathname === "/oauth-callback"
    ) {
      return;
    }

    if (error === "banned") {
      clearAuth();
      logout();
      toast.error("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ.", {
        duration: 5000,
        id: "user-banned", // Use id to prevent duplicates
      });
      // Remove error param from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("error");
      router.replace(newUrl.pathname + newUrl.search);
      return;
    }

    // Prevent multiple checks
    if (hasChecked.current) return;

    const checkUserStatus = async () => {
      const token = getToken();

      // If no token, nothing to check
      if (!token) {
        hasChecked.current = true;
        return;
      }

      // Mark as checked to prevent duplicate calls
      hasChecked.current = true;

      try {
        const response = await fetch("/api/auth/check-status", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!data.success || !data.isValid) {
          // User is invalid (banned, not verified, or token expired)
          console.warn("User status check failed:", data.error);

          // Clear auth data
          clearAuth();
          logout();

          // Show appropriate error message
          if (data.isBanned) {
            toast.error(
              `Tài khoản của bạn đã bị khóa. ${data.bannedReason ? `Lý do: ${data.bannedReason}` : ""}`,
              { duration: 5000 }
            );
          } else if (data.requiresVerification) {
            toast.error(
              "Vui lòng xác minh email trước khi truy cập trang web.",
              {
                duration: 5000,
              }
            );
          } else {
            toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", {
              duration: 3000,
            });
          }

          // Redirect to signin if not already there
          if (
            typeof window !== "undefined" &&
            window.location.pathname !== "/signin"
          ) {
            router.push("/signin");
          }
        }
        // If valid, do nothing - user can continue using the app
      } catch (error) {
        console.error("Error checking user status:", error);
        // On network error, don't clear auth - might be temporary
        // Reset flag so it can retry
        hasChecked.current = false;
      }
    };

    // Only check if middleware didn't already handle it
    // Check after a small delay to avoid blocking initial render
    const timer = setTimeout(() => {
      checkUserStatus();
    }, 1000);

    return () => clearTimeout(timer);
  }, [logout, router, searchParams]);

  // This component doesn't render anything
  return null;
}
