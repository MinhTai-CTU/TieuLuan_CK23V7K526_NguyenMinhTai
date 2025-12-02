"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getToken, getUser, clearAuth, type User } from "@/lib/auth-storage";

// Custom event name for auth state changes
const AUTH_STORAGE_EVENT = "auth-storage-changed";

export function useAuth() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to refresh auth state from localStorage
  const refreshAuth = useCallback(() => {
    const token = getToken();
    const userData = getUser();

    setIsAuthenticated(!!token);
    setUser(userData);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Initial load
    refreshAuth();

    // Listen for custom storage events (when auth state changes)
    const handleStorageChange = () => {
      refreshAuth();
    };

    // Listen for custom auth events
    window.addEventListener(AUTH_STORAGE_EVENT, handleStorageChange);

    // Also listen for storage events (in case localStorage is updated from another tab)
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(AUTH_STORAGE_EVENT, handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [refreshAuth]);

  const logout = () => {
    clearAuth();
    setIsAuthenticated(false);
    setUser(null);
    // Dispatch event to notify all components
    window.dispatchEvent(new Event(AUTH_STORAGE_EVENT));
    router.push("/signin");
    router.refresh();
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    // Dispatch event to notify all components
    window.dispatchEvent(new Event(AUTH_STORAGE_EVENT));
  };

  return {
    isAuthenticated,
    user,
    isLoading,
    logout,
    updateUser,
  };
}
