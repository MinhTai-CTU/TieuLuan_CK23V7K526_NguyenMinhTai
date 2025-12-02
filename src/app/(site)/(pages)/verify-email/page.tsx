"use client";
import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");
  const hasVerified = useRef(false); // Prevent multiple API calls

  useEffect(() => {
    // Prevent multiple calls
    if (hasVerified.current) return;

    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing");
      return;
    }

    // Mark as verifying to prevent duplicate calls
    hasVerified.current = true;

    // Verify email
    fetch(`/api/auth/verify-email?token=${token}`)
      .then(async (res) => {
        const data = await res.json();

        // Always check data.success first, regardless of HTTP status
        // Some APIs return 200 even for errors, or 400 with success:true
        if (data.success) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully!");
          toast.success("Email verified successfully!");

          // Redirect to signin after 3 seconds
          setTimeout(() => {
            router.push("/signin");
          }, 3000);
        } else {
          // Only show error if success is explicitly false
          setStatus("error");
          setMessage(data.error || "Failed to verify email");
          toast.error(data.error || "Failed to verify email");
          // Reset flag on error so user can retry
          hasVerified.current = false;
        }
      })
      .catch((error) => {
        console.error("Verification error:", error);
        setStatus("error");
        setMessage(
          error.message || "An error occurred while verifying your email"
        );
        toast.error(
          error.message || "An error occurred while verifying your email"
        );
        // Reset flag on error so user can retry
        hasVerified.current = false;
      });
  }, [searchParams, router]);

  return (
    <main className="min-h-screen bg-gray-2 flex items-center justify-center py-20">
      <div className="max-w-[570px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        <div className="rounded-xl bg-white shadow-1 p-4 sm:p-7.5 xl:p-11">
          {status === "loading" && (
            <div className="text-center">
              <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-blue border-t-transparent mb-6"></div>
              <h2 className="font-semibold text-xl sm:text-2xl xl:text-heading-5 text-dark mb-4">
                Verifying your email...
              </h2>
              <p className="text-dark-4">
                Please wait while we verify your email address.
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
                Email Verified!
              </h2>
              <p className="text-dark-4 mb-6">{message}</p>
              <p className="text-sm text-dark-4 mb-6">
                Redirecting to sign in page...
              </p>
              <Link
                href="/signin"
                className="inline-block font-medium text-white bg-blue py-3 px-6 rounded-lg ease-out duration-200 hover:bg-blue/90"
              >
                Go to Sign In
              </Link>
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
                Verification Failed
              </h2>
              <p className="text-dark-4 mb-6">{message}</p>
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
                  Sign Up Again
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
