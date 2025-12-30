"use client";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { getAuthHeader, saveToken, saveUser } from "@/lib/auth-storage";
import toast from "react-hot-toast";
import {
  changePasswordSchema,
  changePasswordOAuthSchema,
  type ChangePasswordFormData,
  type ChangePasswordOAuthFormData,
} from "@/utils/validation/authRules";

const ChangePasswordTab = () => {
  const [isOAuthUser, setIsOAuthUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Regular form (with current password)
  const regularForm = useForm<ChangePasswordFormData>({
    resolver: yupResolver(changePasswordSchema) as any,
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // OAuth form (without current password)
  const oauthForm = useForm<ChangePasswordOAuthFormData>({
    resolver: yupResolver(changePasswordOAuthSchema) as any,
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Fetch user provider info
  useEffect(() => {
    const fetchUserProvider = async () => {
      try {
        const authHeader = getAuthHeader();
        if (!authHeader) {
          setIsLoading(false);
          return;
        }

        const response = await fetch("/api/auth/profile", {
          headers: {
            Authorization: authHeader,
          },
        });

        if (response.ok) {
          const result = await response.json();
          const provider = result.data?.user?.provider;
          const isOAuth = provider === "google" || provider === "facebook";
          setIsOAuthUser(isOAuth);
        }
      } catch (error) {
        console.error("Error fetching user provider:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProvider();
  }, []);

  const onSubmit = async (
    data: ChangePasswordFormData | ChangePasswordOAuthFormData
  ) => {
    setIsSubmitting(true);

    try {
      const authHeader = getAuthHeader();
      if (!authHeader) {
        toast.error("Vui lòng đăng nhập");
        return;
      }

      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Đổi mật khẩu thành công!");

        // Save new token if provided
        if (result.data?.token) {
          saveToken(result.data.token);

          // Fetch updated user data and save it
          const userResponse = await fetch("/api/auth/me", {
            headers: {
              Authorization: `Bearer ${result.data.token}`,
            },
          });

          if (userResponse.ok) {
            const userResult = await userResponse.json();
            if (userResult.success && userResult.data?.user) {
              saveUser(userResult.data.user);
            }
          }
        }

        // Reset form
        if (isOAuthUser) {
          oauthForm.reset();
        } else {
          regularForm.reset();
        }
      } else {
        toast.error(result.error || "Đổi mật khẩu thất bại");
      }
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error("Đổi mật khẩu thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="xl:max-w-[770px] w-full bg-white rounded-xl shadow-1 py-9.5 px-4 sm:px-7.5 xl:px-10">
        <h2 className="text-2xl font-bold text-dark mb-6">Đổi mật khẩu</h2>
        <p className="text-dark-4">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="xl:max-w-[770px] w-full bg-white rounded-xl shadow-1 py-9.5 px-4 sm:px-7.5 xl:px-10">
      <h2 className="text-2xl font-bold text-dark mb-6">Đổi mật khẩu</h2>

      {isOAuthUser ? (
        <form
          onSubmit={oauthForm.handleSubmit(onSubmit)}
          className="space-y-6 max-w-md"
        >
          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-dark mb-2">
              Mật khẩu mới <span className="text-red">*</span>
            </label>
            <input
              type="password"
              {...oauthForm.register("newPassword")}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent ${
                oauthForm.formState.errors.newPassword
                  ? "border-red"
                  : "border-gray-3"
              }`}
            />
            {oauthForm.formState.errors.newPassword && (
              <p className="text-xs text-red mt-1">
                {oauthForm.formState.errors.newPassword.message}
              </p>
            )}
            <p className="text-xs text-dark-4 mt-1">
              Mật khẩu phải có ít nhất 6 ký tự
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-dark mb-2">
              Xác nhận mật khẩu mới <span className="text-red">*</span>
            </label>
            <input
              type="password"
              {...oauthForm.register("confirmPassword")}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent ${
                oauthForm.formState.errors.confirmPassword
                  ? "border-red"
                  : "border-gray-3"
              }`}
            />
            {oauthForm.formState.errors.confirmPassword && (
              <p className="text-xs text-red mt-1">
                {oauthForm.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-blue text-white rounded-md hover:bg-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Đang xử lý..." : "Đổi mật khẩu"}
            </button>
          </div>
        </form>
      ) : (
        <form
          onSubmit={regularForm.handleSubmit(onSubmit)}
          className="space-y-6 max-w-md"
        >
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-dark mb-2">
              Mật khẩu hiện tại <span className="text-red">*</span>
            </label>
            <input
              type="password"
              {...regularForm.register("currentPassword")}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent ${
                regularForm.formState.errors.currentPassword
                  ? "border-red"
                  : "border-gray-3"
              }`}
            />
            {regularForm.formState.errors.currentPassword && (
              <p className="text-xs text-red mt-1">
                {regularForm.formState.errors.currentPassword.message}
              </p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-dark mb-2">
              Mật khẩu mới <span className="text-red">*</span>
            </label>
            <input
              type="password"
              {...regularForm.register("newPassword")}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent ${
                regularForm.formState.errors.newPassword
                  ? "border-red"
                  : "border-gray-3"
              }`}
            />
            {regularForm.formState.errors.newPassword && (
              <p className="text-xs text-red mt-1">
                {regularForm.formState.errors.newPassword.message}
              </p>
            )}
            <p className="text-xs text-dark-4 mt-1">
              Mật khẩu phải có ít nhất 6 ký tự
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-dark mb-2">
              Xác nhận mật khẩu mới <span className="text-red">*</span>
            </label>
            <input
              type="password"
              {...regularForm.register("confirmPassword")}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent ${
                regularForm.formState.errors.confirmPassword
                  ? "border-red"
                  : "border-gray-3"
              }`}
            />
            {regularForm.formState.errors.confirmPassword && (
              <p className="text-xs text-red mt-1">
                {regularForm.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-blue text-white rounded-md hover:bg-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Đang xử lý..." : "Đổi mật khẩu"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ChangePasswordTab;
