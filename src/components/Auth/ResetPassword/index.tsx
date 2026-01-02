"use client";
import Breadcrumb from "@/components/Common/Breadcrumb";
import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";

const resetPasswordSchema = yup.object({
  password: yup
    .string()
    .required("Vui lòng nhập mật khẩu mới")
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
  confirmPassword: yup
    .string()
    .required("Vui lòng xác nhận mật khẩu")
    .oneOf([yup.ref("password")], "Mật khẩu xác nhận không khớp"),
});

type ResetPasswordFormData = yup.InferType<typeof resetPasswordSchema>;

const ResetPasswordForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: yupResolver(resetPasswordSchema) as any,
    mode: "onBlur",
  });

  useEffect(() => {
    if (!token) {
      toast.error("Đường dẫn không hợp lệ (Thiếu token).");
    }
  }, [token]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast.error("Đường dẫn không hợp lệ. Vui lòng yêu cầu cấp lại mật khẩu.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error(result.error || "Đổi mật khẩu thất bại.");
        setIsLoading(false);
        return;
      }

      toast.success("Đổi mật khẩu thành công! Đang chuyển hướng...");

      setTimeout(() => {
        router.push("/signin");
      }, 2000);
    } catch (error) {
      console.error(error);
      toast.error("Lỗi kết nối máy chủ.");
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-red mb-4">
          Đường dẫn không hợp lệ hoặc thiếu mã xác thực.
        </p>
        <Link href="/signin" className="text-primary hover:underline">
          Quay về trang đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="mb-5">
        <label htmlFor="password" className="block mb-2.5">
          Mật khẩu mới
        </label>
        <input
          type="password"
          id="password"
          {...register("password")}
          placeholder="Nhập mật khẩu mới (min 8 ký tự)"
          className={`rounded-lg border ${
            errors.password ? "border-red" : "border-gray-3"
          } bg-gray-1 placeholder:text-dark-5 w-full py-3 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20`}
          disabled={isLoading}
        />
        {errors.password && (
          <p className="text-red text-sm mt-1">{errors.password.message}</p>
        )}
      </div>

      <div className="mb-5">
        <label htmlFor="confirmPassword" className="block mb-2.5">
          Xác nhận mật khẩu
        </label>
        <input
          type="password"
          id="confirmPassword"
          {...register("confirmPassword")}
          placeholder="Nhập lại mật khẩu mới"
          className={`rounded-lg border ${
            errors.confirmPassword ? "border-red" : "border-gray-3"
          } bg-gray-1 placeholder:text-dark-5 w-full py-3 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20`}
          disabled={isLoading}
        />
        {errors.confirmPassword && (
          <p className="text-red text-sm mt-1">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full mt-4 flex justify-center items-center gap-2 font-medium text-white bg-dark py-3 px-6 rounded-lg ease-out duration-200 hover:bg-blue disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Đang xử lý...
          </>
        ) : (
          "Đổi mật khẩu"
        )}
      </button>
    </form>
  );
};

const ResetPasswordPage = () => {
  return (
    <>
      <Breadcrumb title={"Đặt lại mật khẩu"} pages={["Reset Password"]} />
      <section className="overflow-hidden py-20 bg-gray-2">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <div className="max-w-[570px] w-full mx-auto rounded-xl bg-white shadow-1 p-4 sm:p-7.5 xl:p-11">
            <div className="text-center mb-11">
              <h2 className="font-semibold text-xl sm:text-2xl xl:text-heading-5 text-dark mb-1.5">
                Tạo mật khẩu mới
              </h2>
              <p>Vui lòng nhập mật khẩu mới cho tài khoản của bạn</p>
            </div>

            <Suspense fallback={<div className="text-center">Đang tải...</div>}>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>
      </section>
    </>
  );
};

export default ResetPasswordPage;
