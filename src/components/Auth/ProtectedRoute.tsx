"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Component to protect routes from authenticated users
 * Redirects to home page if user is already logged in
 * But allows access if there's a redirect param (user needs to re-authenticate)
 */
export default function ProtectedRoute({
  children,
  redirectTo = "/",
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // If there's a redirect param, don't auto-redirect
    // This allows user to see signin page even if they have token in localStorage
    // (but cookie might be missing, causing server-side redirect)
    const hasRedirect = searchParams.get("redirect") || searchParams.get("returnUrl");
    
    if (!isLoading && isAuthenticated && !hasRedirect) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo, searchParams]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue"></div>
      </div>
    );
  }

  // If authenticated but has redirect param, show the page (user needs to re-login)
  if (isAuthenticated && !searchParams.get("redirect") && !searchParams.get("returnUrl")) {
    return null;
  }

  return <>{children}</>;
}
