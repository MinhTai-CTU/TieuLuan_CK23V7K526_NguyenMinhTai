"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, clearAuth } from "@/lib/auth-storage";
import { useAuth } from "./useAuth";

/**
 * Hook to check user status on app load
 * Validates user token and checks if account is still active
 */
export function useUserStatus() {
  const router = useRouter();
  const { logout, isAuthenticated } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const checkUserStatus = async () => {
      const token = getToken();

      // If no token, user is not authenticated
      if (!token) {
        setIsChecking(false);
        setIsValid(false);
        return;
      }

      try {
        const response = await fetch("/api/auth/check-status", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (data.success && data.isValid) {
          // User is valid
          setIsValid(true);
        } else {
          // User is invalid (banned, not verified, or token expired)
          console.warn("User status check failed:", data.error);

          // Clear auth data
          clearAuth();
          logout();

          // Show error message if banned
          if (data.isBanned) {
            // You can use toast here if needed
            console.error(
              "Account banned:",
              data.bannedReason || "No reason provided"
            );
          }

          setIsValid(false);
        }
      } catch (error) {
        console.error("Error checking user status:", error);
        // On error, clear auth to be safe
        clearAuth();
        logout();
        setIsValid(false);
      } finally {
        setIsChecking(false);
      }
    };

    // Only check if user is authenticated
    if (isAuthenticated) {
      checkUserStatus();
    } else {
      setIsChecking(false);
    }
  }, [isAuthenticated, logout, router]);

  return {
    isChecking,
    isValid,
  };
}
