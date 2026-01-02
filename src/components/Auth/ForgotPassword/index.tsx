"use client";
import Breadcrumb from "@/components/Common/Breadcrumb";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const forgotPasswordSchema = yup.object({
  email: yup
    .string()
    .required("Vui lòng nhập email")
    .email("Email không hợp lệ"),
});

type ForgotPasswordFormData = yup.InferType<typeof forgotPasswordSchema>;

const ForgotPassword = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ForgotPasswordFormData>({
    resolver: yupResolver(forgotPasswordSchema) as any,
    defaultValues: {
      email: "",
    },
    mode: "onBlur",
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error(result.error || "Đã xảy ra lỗi khi gửi yêu cầu.");
        setIsLoading(false); // Tắt loading nếu có lỗi để user thử lại
        return;
      }

      toast.success(
        result.message || "Đã gửi email khôi phục! Vui lòng kiểm tra hộp thư."
      );

      reset();

      setTimeout(() => {
        router.push("/signin");
      }, 2000);
    } catch (error: any) {
      console.error("System error:", error);
      toast.error("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
      setIsLoading(false);
    }
  };

  return (
    <>
      <Breadcrumb title={"Quên mật khẩu"} pages={["Forgot Password"]} />
      <section className="overflow-hidden py-20 bg-gray-2">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <div className="max-w-[570px] w-full mx-auto rounded-xl bg-white shadow-1 p-4 sm:p-7.5 xl:p-11">
            {/* Header */}
            <div className="text-center mb-11">
              <h2 className="font-semibold text-xl sm:text-2xl xl:text-heading-5 text-dark mb-1.5">
                Đặt lại mật khẩu
              </h2>
              <p>Nhập email đã đăng ký để nhận liên kết khôi phục</p>
            </div>

            <div>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-5">
                  <label htmlFor="email" className="block mb-2.5">
                    Email
                  </label>
                  <input
                    type="text"
                    id="email"
                    {...register("email")}
                    placeholder="Nhập email của bạn"
                    className={`rounded-lg border ${
                      errors.email ? "border-red" : "border-gray-3"
                    } bg-gray-1 placeholder:text-dark-5 w-full py-3 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20`}
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="text-red text-sm mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-4 mt-7.5">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center items-center gap-2 font-medium text-white bg-dark py-3 px-6 rounded-lg ease-out duration-200 hover:bg-blue disabled:opacity-50 disabled:cursor-not-allowed"
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
                        Đang gửi...
                      </>
                    ) : (
                      "Gửi liên kết khôi phục"
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => router.back()}
                    disabled={isLoading}
                    className="w-full flex justify-center items-center gap-2 font-medium text-dark bg-gray-1 border border-gray-3 py-3 px-6 rounded-lg ease-out duration-200 hover:bg-gray-2 hover:text-dark disabled:opacity-50"
                  >
                    Quay lại trang trước
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ForgotPassword;
