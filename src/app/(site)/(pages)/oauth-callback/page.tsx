"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveToken, saveUser } from "@/lib/auth-storage";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import Link from "next/link";

/**
 * OAuth callback page
 * This page is called after successful OAuth authentication or OAuth errors
 * It extracts the token from the session and redirects to home, or shows error
 */
export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updateUser } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");
  const hasProcessed = useRef(false);
  const toastShown = useRef(false); // Track if toast has been shown

  useEffect(() => {
    // Check for error in URL params first (from NextAuth error redirect)
    const errorParam = searchParams.get("error");

    if (errorParam) {
      // Prevent multiple processing
      if (hasProcessed.current) return;
      hasProcessed.current = true;

      setStatus("error");

      // Map NextAuth error codes to user-friendly messages
      // Check if error is related to missing email (common with Facebook)
      // Try to detect from URL or referrer
      let isFacebookError = false;
      if (typeof window !== "undefined") {
        const currentUrl = window.location.href;
        const referrer = document.referrer;
        isFacebookError =
          currentUrl.includes("facebook") ||
          referrer.includes("facebook") ||
          referrer.includes("fb.com");
      }

      const errorMessages: Record<string, string> = {
        AccessDenied: isFacebookError
          ? "Login failed. Your Facebook account is missing an email or you haven't granted email permissions.\n\nPlease:\n• Check your Facebook privacy settings\n• Ensure your Facebook account has an email\n• Grant email access when logging in\n\nOr you can sign up with email/password instead."
          : "Login failed. You may have cancelled the login or the account is not authorized. If logging in via Facebook/Google, your account might be missing an email.",
        Configuration: "Server configuration error. Please try again later.",
        Verification:
          "The verification token has expired or has already been used.",
        Default: "An authentication error occurred. Please try again.",
      };

      const errorMessage = errorMessages[errorParam] || errorMessages.Default;
      setMessage(errorMessage);

      // Only show toast once
      if (!toastShown.current) {
        toastShown.current = true;
        toast.error(
          isFacebookError && errorParam === "AccessDenied"
            ? "Facebook login failed: Account missing email or permissions not granted"
            : errorMessage,
          { duration: 6000, id: "oauth-error" } // Use id to prevent duplicates
        );
      }

      // Redirect to signin after 3 seconds
      const redirectTimer = setTimeout(() => {
        router.push("/signin");
      }, 3000);

      return () => clearTimeout(redirectTimer);
    }

    // Prevent multiple calls
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const handleOAuthCallback = async () => {
      try {
        // Fetch session from server
        const response = await fetch("/api/auth/oauth/callback");
        const data = await response.json();

        if (data.success && data.token) {
          // Fetch user data with token
          const userResponse = await fetch("/api/auth/me", {
            headers: {
              Authorization: `Bearer ${data.token}`,
            },
          });

          const userData = await userResponse.json();

          if (userData.success && userData.data.user) {
            // Save token and user
            saveToken(data.token);
            saveUser({
              id: userData.data.user.id,
              email: userData.data.user.email,
              name: userData.data.user.name,
              avatar: userData.data.user.avatar,
              dateOfBirth: userData.data.user.dateOfBirth,
              emailVerified: userData.data.user.emailVerified,
              isActive: userData.data.user.isActive,
              roles: userData.data.user.roles,
            });
            updateUser(userData.data.user);

            setStatus("success");
            setMessage("Login successful! Redirecting...");

            // Only show toast once
            if (!toastShown.current) {
              toastShown.current = true;
              toast.success("Login successful! Welcome back!", {
                id: "oauth-success",
              });
            }

            // Redirect to home
            const redirectTimer = setTimeout(() => {
              router.push("/");
            }, 1000);

            return () => clearTimeout(redirectTimer);
          } else {
            throw new Error("Failed to fetch user data");
          }
        } else {
          throw new Error(data.error || "OAuth callback failed");
        }
      } catch (error: any) {
        console.error("OAuth callback error:", error);
        setStatus("error");
        setMessage(error.message || "Failed to complete login");

        // Only show toast once
        if (!toastShown.current) {
          toastShown.current = true;
          toast.error(
            error.message || "Failed to complete login. Please try again.",
            { id: "oauth-callback-error" }
          );
        }

        // Redirect to signin after 3 seconds
        const redirectTimer = setTimeout(() => {
          router.push("/signin");
        }, 3000);

        return () => clearTimeout(redirectTimer);
      }
    };

    handleOAuthCallback();
  }, [router, updateUser, searchParams]);

  return (
    <main className="min-h-screen bg-gray-2 flex items-center justify-center py-20">
      <div className="max-w-[570px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        <div className="rounded-xl bg-white shadow-1 p-4 sm:p-7.5 xl:p-11">
          {status === "loading" && (
            <div className="text-center">
              <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-blue border-t-transparent mb-6"></div>
              <h2 className="font-semibold text-xl sm:text-2xl xl:text-heading-5 text-dark mb-4">
                Completing login...
              </h2>
              <p className="text-dark-4">
                Please wait while we complete your login.
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="font-semibold text-xl sm:text-2xl xl:text-heading-5 text-dark mb-4">
                Login Successful!
              </h2>
              <p className="text-dark-4 mb-6">{message}</p>
            </div>
          )}

          {status === "error" && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="font-semibold text-xl sm:text-2xl xl:text-heading-5 text-dark mb-4">
                Login Failed
              </h2>
              <p className="text-dark-4 mb-6 whitespace-pre-line">{message}</p>
              <p className="text-sm text-dark-4 mb-6">
                Redirecting to sign in page...
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/signin"
                  className="inline-block font-medium text-white bg-blue py-3 px-6 rounded-lg ease-out duration-200 hover:bg-blue/90"
                >
                  Go to Sign In
                </Link>
                <Link
                  href="/signup"
                  className="inline-block font-medium text-dark border border-gray-3 py-3 px-6 rounded-lg ease-out duration-200 hover:bg-gray-1"
                >
                  Sign Up Instead
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
