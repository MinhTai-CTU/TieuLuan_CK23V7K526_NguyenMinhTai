"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Breadcrumb from "@/components/Common/Breadcrumb";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getAuthHeader } from "@/lib/auth-storage";
import toast from "react-hot-toast";

interface Order {
  id: string;
  orderId: string;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    discountedPrice: number | null;
    product: {
      id: string;
      title: string;
      images: Array<{ url: string; type: string }>;
    };
  }>;
  shipping: {
    fullName: string;
    email: string;
    phone: string | null;
    address: string;
    city: string;
    method: string | null;
    estimatedDeliveryDate: string | null;
  } | null;
}

const CheckoutSuccessContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const orderId = searchParams.get("orderId");
  // MoMo có thể trả về query params: resultCode, message, orderId
  const resultCode = searchParams.get("resultCode");
  const momoMessage = searchParams.get("message");
  // Stripe có thể trả về payment_intent, payment_intent_client_secret
  const paymentIntentId = searchParams.get("payment_intent");
  const paymentIntentClientSecret = searchParams.get(
    "payment_intent_client_secret"
  );
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<
    "success" | "failed" | "pending" | null
  >(null);

  useEffect(() => {
    // Đợi auth check hoàn tất trước khi redirect
    if (isAuthLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.push("/signin");
      return;
    }

    if (!orderId) {
      toast.error("Không tìm thấy thông tin đơn hàng");
      router.push("/");
      return;
    }

    // Fetch order details
    const fetchOrder = async () => {
      try {
        const authHeader = getAuthHeader();
        if (!authHeader) {
          router.push("/signin");
          return;
        }

        const response = await fetch(`/api/orders`, {
          headers: {
            Authorization: authHeader,
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            const foundOrder = result.data.find(
              (o: Order) => o.orderId === orderId
            );
            if (foundOrder) {
              setOrder(foundOrder);

              // Xác định trạng thái thanh toán
              // Ưu tiên query params từ MoMo, sau đó dùng paymentStatus từ database
              if (resultCode !== null) {
                // Có query params từ MoMo - Cập nhật trạng thái ngay lập tức
                if (resultCode === "0") {
                  // Gọi API để cập nhật trạng thái thanh toán trong database
                  const confirmResponse = await fetch(
                    "/api/momo/confirm-payment",
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        orderId: orderId,
                        resultCode: resultCode,
                        message: momoMessage,
                      }),
                    }
                  );

                  if (confirmResponse.ok) {
                    const confirmResult = await confirmResponse.json();
                    if (confirmResult.success) {
                      // Cập nhật lại order từ database sau khi confirm
                      const updatedResponse = await fetch(`/api/orders`, {
                        headers: {
                          Authorization: authHeader,
                        },
                      });
                      if (updatedResponse.ok) {
                        const updatedResult = await updatedResponse.json();
                        if (updatedResult.success) {
                          const updatedOrder = updatedResult.data.find(
                            (o: Order) => o.orderId === orderId
                          );
                          if (updatedOrder) {
                            setOrder(updatedOrder);
                          }
                        }
                      }
                    }
                  }

                  setPaymentStatus("success");
                  toast.success(
                    `✅ Thanh toán thành công! Đơn hàng ${orderId} đã được xác nhận.`,
                    {
                      duration: 5000,
                    }
                  );
                } else {
                  // Thanh toán thất bại - cập nhật database
                  const confirmResponse = await fetch(
                    "/api/momo/confirm-payment",
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        orderId: orderId,
                        resultCode: resultCode,
                        message: momoMessage,
                      }),
                    }
                  );

                  if (confirmResponse.ok) {
                    const confirmResult = await confirmResponse.json();
                    // Cập nhật lại order từ database sau khi confirm (dù thành công hay thất bại)
                    const updatedResponse = await fetch(`/api/orders`, {
                      headers: {
                        Authorization: authHeader,
                      },
                    });
                    if (updatedResponse.ok) {
                      const updatedResult = await updatedResponse.json();
                      if (updatedResult.success) {
                        const updatedOrder = updatedResult.data.find(
                          (o: Order) => o.orderId === orderId
                        );
                        if (updatedOrder) {
                          setOrder(updatedOrder);
                        }
                      }
                    }
                  }

                  setPaymentStatus("failed");
                  const errorMessage = momoMessage || "Thanh toán thất bại";
                  toast.error(
                    `❌ ${errorMessage}. Đơn hàng ${orderId} vẫn được lưu, vui lòng thử thanh toán lại.`,
                    {
                      duration: 6000,
                      icon: "❌",
                    }
                  );
                }
              } else if (paymentIntentId || paymentIntentClientSecret) {
                // Có payment intent từ Stripe - Xác nhận thanh toán
                const confirmResponse = await fetch(
                  "/api/stripe/confirm-payment",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      orderId: orderId,
                      paymentIntentId: paymentIntentId,
                    }),
                  }
                );

                if (confirmResponse.ok) {
                  const confirmResult = await confirmResponse.json();
                  if (confirmResult.success) {
                    // Cập nhật lại order từ database sau khi confirm
                    const updatedResponse = await fetch(`/api/orders`, {
                      headers: {
                        Authorization: authHeader,
                      },
                    });
                    if (updatedResponse.ok) {
                      const updatedResult = await updatedResponse.json();
                      if (updatedResult.success) {
                        const updatedOrder = updatedResult.data.find(
                          (o: Order) => o.orderId === orderId
                        );
                        if (updatedOrder) {
                          setOrder(updatedOrder);
                          if (updatedOrder.paymentStatus === "PAID") {
                            setPaymentStatus("success");
                            toast.success(
                              `✅ Thanh toán thành công! Đơn hàng ${orderId} đã được xác nhận.`,
                              {
                                duration: 5000,
                              }
                            );
                          } else {
                            setPaymentStatus("pending");
                          }
                        }
                      }
                    }
                  }
                } else {
                  // Nếu confirm thất bại, kiểm tra paymentStatus từ database
                  if (foundOrder.paymentStatus === "PAID") {
                    setPaymentStatus("success");
                  } else {
                    setPaymentStatus("pending");
                  }
                }
              } else {
                // Dùng paymentStatus từ database
                if (foundOrder.paymentStatus === "PAID") {
                  setPaymentStatus("success");
                  toast.success(
                    `✅ Đơn hàng ${orderId} đã được thanh toán thành công!`,
                    {
                      duration: 4000,
                      icon: "✅",
                    }
                  );
                } else if (foundOrder.paymentStatus === "FAILED") {
                  setPaymentStatus("failed");
                  toast.error(
                    `❌ Thanh toán thất bại cho đơn hàng ${orderId}. Vui lòng thử lại.`,
                    {
                      duration: 5000,
                      icon: "❌",
                    }
                  );
                } else {
                  // Nếu paymentMethod là stripe hoặc momo nhưng paymentStatus vẫn PENDING
                  // Tự động gọi API confirm-payment để xác nhận thanh toán
                  if (foundOrder.paymentMethod === "stripe") {
                    setPaymentStatus("pending");
                    // Gọi API confirm-payment cho Stripe
                    try {
                      const confirmResponse = await fetch(
                        "/api/stripe/confirm-payment",
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            orderId: orderId,
                            paymentIntentId: paymentIntentId || undefined,
                          }),
                        }
                      );

                      if (confirmResponse.ok) {
                        const confirmResult = await confirmResponse.json();
                        if (confirmResult.success) {
                          // Fetch lại order sau khi confirm
                          const updatedResponse = await fetch(`/api/orders`, {
                            headers: {
                              Authorization: authHeader,
                            },
                          });
                          if (updatedResponse.ok) {
                            const updatedResult = await updatedResponse.json();
                            if (updatedResult.success) {
                              const updatedOrder = updatedResult.data.find(
                                (o: Order) => o.orderId === orderId
                              );
                              if (updatedOrder) {
                                setOrder(updatedOrder);
                                if (updatedOrder.paymentStatus === "PAID") {
                                  setPaymentStatus("success");
                                  toast.success(
                                    `✅ Thanh toán thành công! Đơn hàng ${orderId} đã được xác nhận.`,
                                    {
                                      duration: 4000,
                                    }
                                  );
                                } else {
                                  setPaymentStatus("pending");
                                }
                              }
                            }
                          }
                        }
                      }
                    } catch (error) {
                      console.error("Error confirming Stripe payment:", error);
                      setPaymentStatus("pending");
                      // Đợi 2 giây rồi thử fetch lại để xem webhook đã xử lý chưa
                      setTimeout(async () => {
                        try {
                          const retryResponse = await fetch(`/api/orders`, {
                            headers: {
                              Authorization: authHeader,
                            },
                          });
                          if (retryResponse.ok) {
                            const retryResult = await retryResponse.json();
                            if (retryResult.success) {
                              const retryOrder = retryResult.data.find(
                                (o: Order) => o.orderId === orderId
                              );
                              if (
                                retryOrder &&
                                retryOrder.paymentStatus === "PAID"
                              ) {
                                setOrder(retryOrder);
                                setPaymentStatus("success");
                                toast.success(
                                  `✅ Thanh toán thành công! Đơn hàng ${orderId} đã được xác nhận.`,
                                  {
                                    duration: 4000,
                                  }
                                );
                              }
                            }
                          }
                        } catch (error) {
                          console.error("Error retrying payment check:", error);
                        }
                      }, 2000);
                    }
                  } else if (foundOrder.paymentMethod === "momo") {
                    setPaymentStatus("pending");
                    // Đợi 2 giây rồi thử fetch lại để xem webhook đã xử lý chưa
                    setTimeout(async () => {
                      try {
                        const retryResponse = await fetch(`/api/orders`, {
                          headers: {
                            Authorization: authHeader,
                          },
                        });
                        if (retryResponse.ok) {
                          const retryResult = await retryResponse.json();
                          if (retryResult.success) {
                            const retryOrder = retryResult.data.find(
                              (o: Order) => o.orderId === orderId
                            );
                            if (
                              retryOrder &&
                              retryOrder.paymentStatus === "PAID"
                            ) {
                              setOrder(retryOrder);
                              setPaymentStatus("success");
                              toast.success(
                                `✅ Thanh toán thành công! Đơn hàng ${orderId} đã được xác nhận.`,
                                {
                                  duration: 4000,
                                }
                              );
                            }
                          }
                        }
                      } catch (error) {
                        console.error("Error retrying payment check:", error);
                      }
                    }, 2000);
                  } else {
                    setPaymentStatus("pending");
                  }
                }
              }
            } else {
              toast.error("Không tìm thấy đơn hàng");
            }
          }
        }
      } catch (error) {
        console.error("Error fetching order:", error);
        toast.error("Không thể tải thông tin đơn hàng");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [
    orderId,
    isAuthenticated,
    isAuthLoading,
    router,
    resultCode,
    momoMessage,
    paymentIntentId,
    paymentIntentClientSecret,
  ]);

  // Hiển thị loading nếu đang check auth hoặc đang fetch order
  if (isAuthLoading || isLoading) {
    return (
      <>
        <Breadcrumb
          title={"Xác nhận đơn hàng"}
          pages={["checkout", "success"]}
        />
        <section className="overflow-hidden py-20 bg-gray-2">
          <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
            <div className="bg-white rounded-xl shadow-1 px-4 py-10 sm:py-15 lg:py-20 xl:py-25">
              <div className="text-center">
                <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue border-t-transparent mb-4"></div>
                <p className="text-dark-4">Đang tải thông tin đơn hàng...</p>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Breadcrumb title={"Lỗi"} pages={["checkout", "error"]} />
        <section className="overflow-hidden py-20 bg-gray-2">
          <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
            <div className="bg-white rounded-xl shadow-1 px-4 py-10 sm:py-15 lg:py-20 xl:py-25">
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
                <h2 className="font-semibold text-xl sm:text-2xl text-dark mb-4">
                  Không tìm thấy đơn hàng
                </h2>
                <p className="text-dark-4 mb-6">
                  Đơn hàng không tồn tại hoặc bạn không có quyền xem đơn hàng
                  này.
                </p>
                <Link
                  href="/"
                  className="inline-block font-medium text-white bg-blue py-3 px-6 rounded-lg ease-out duration-200 hover:bg-blue/90"
                >
                  Về trang chủ
                </Link>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Breadcrumb
        title={"Đặt hàng thành công"}
        pages={["checkout", "success"]}
      />
      <section className="overflow-hidden py-20 bg-gray-2">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <div className="bg-white rounded-xl shadow-1 px-4 py-10 sm:py-15 lg:py-20 xl:py-25">
            <div className="text-center mb-8">
              {/* Hiển thị icon và message dựa trên trạng thái thanh toán */}
              {paymentStatus === "failed" ? (
                <>
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
                  <h2 className="font-bold text-red-600 text-4xl lg:text-[45px] lg:leading-[57px] mb-5">
                    Thanh toán thất bại
                  </h2>
                  <h3 className="font-medium text-dark text-xl sm:text-2xl mb-3">
                    Đơn hàng của bạn đã được tạo nhưng thanh toán không thành
                    công
                  </h3>
                  {momoMessage && (
                    <div className="max-w-[491px] w-full mx-auto mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700 font-medium">
                        Lý do: {momoMessage}
                      </p>
                    </div>
                  )}
                  <p className="max-w-[491px] w-full mx-auto mb-4 text-dark-4">
                    Mã đơn hàng:{" "}
                    <span className="font-semibold text-dark">
                      {order.orderId}
                    </span>
                  </p>
                  <p className="max-w-[491px] w-full mx-auto mb-7.5 text-dark-4 text-sm">
                    Đơn hàng của bạn vẫn được lưu. Vui lòng thử thanh toán lại
                    hoặc chọn phương thức thanh toán khác.
                  </p>
                </>
              ) : paymentStatus === "success" ? (
                <>
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
                  <h2 className="font-bold text-blue text-4xl lg:text-[45px] lg:leading-[57px] mb-5">
                    Đặt hàng thành công!
                  </h2>
                  <h3 className="font-medium text-dark text-xl sm:text-2xl mb-3">
                    Cảm ơn bạn đã đặt hàng
                  </h3>
                  <p className="max-w-[491px] w-full mx-auto mb-7.5 text-dark-4">
                    Mã đơn hàng của bạn:{" "}
                    <span className="font-semibold text-dark">
                      {order.orderId}
                    </span>
                  </p>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mb-6">
                    <svg
                      className="w-8 h-8 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h2 className="font-bold text-blue text-4xl lg:text-[45px] lg:leading-[57px] mb-5">
                    Đơn hàng đã được tạo
                  </h2>
                  <h3 className="font-medium text-dark text-xl sm:text-2xl mb-3">
                    Đang chờ xử lý thanh toán
                  </h3>
                  <p className="max-w-[491px] w-full mx-auto mb-7.5 text-dark-4">
                    Mã đơn hàng của bạn:{" "}
                    <span className="font-semibold text-dark">
                      {order.orderId}
                    </span>
                  </p>
                  <p className="max-w-[491px] w-full mx-auto mb-7.5 text-dark-4 text-sm">
                    Vui lòng đợi trong giây lát, hệ thống đang cập nhật trạng
                    thái thanh toán...
                  </p>
                </>
              )}
            </div>

            {/* Order Summary */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h4 className="font-semibold text-dark mb-4">
                  Thông tin đơn hàng
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-dark-4">Mã đơn hàng:</span>
                    <span className="font-medium text-dark">
                      {order.orderId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-4">Tổng tiền:</span>
                    <span className="font-semibold text-dark">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(order.total)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-4">Phương thức thanh toán:</span>
                    <span className="font-medium text-dark">
                      {order.paymentMethod === "stripe"
                        ? "Thẻ tín dụng/ghi nợ (Stripe)"
                        : order.paymentMethod === "cod"
                          ? "Thanh toán khi nhận hàng (COD)"
                          : order.paymentMethod === "momo"
                            ? "MoMo"
                            : order.paymentMethod || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-4">Trạng thái thanh toán:</span>
                    <span
                      className={`font-medium ${
                        order.paymentStatus === "PAID"
                          ? "text-green-600"
                          : order.paymentStatus === "FAILED"
                            ? "text-red-600"
                            : "text-yellow-600"
                      }`}
                    >
                      {order.paymentStatus === "PAID"
                        ? "Đã thanh toán"
                        : order.paymentStatus === "FAILED"
                          ? "Thất bại"
                          : "Chờ thanh toán"}
                    </span>
                  </div>
                </div>
              </div>

              {order.shipping && (
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h4 className="font-semibold text-dark mb-4">
                    Địa chỉ giao hàng
                  </h4>
                  <div className="text-sm text-dark-4 space-y-1">
                    <p className="font-medium text-dark">
                      {order.shipping.fullName}
                    </p>
                    <p>{order.shipping.address}</p>
                    <p>
                      {order.shipping.city}
                      {order.shipping.phone && ` - ${order.shipping.phone}`}
                    </p>
                    {/* Hiển thị ngày giao hàng dự kiến - luôn hiển thị nếu có */}
                    {order.shipping.estimatedDeliveryDate ? (
                      <p className="mt-3 pt-3 border-t border-gray-3">
                        <span className="font-medium text-dark">
                          Ngày giao hàng dự kiến:{" "}
                        </span>
                        <span className="text-blue font-semibold">
                          {new Date(
                            order.shipping.estimatedDeliveryDate
                          ).toLocaleDateString("vi-VN", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </p>
                    ) : order.shipping.method ? (
                      // Nếu không có estimatedDeliveryDate, thử tính từ method
                      <p className="mt-3 pt-3 border-t border-gray-3">
                        <span className="font-medium text-dark">
                          Ngày giao hàng dự kiến:{" "}
                        </span>
                        <span className="text-blue font-semibold">
                          {(() => {
                            // Tính từ method nếu có thông tin (ví dụ: "3 ngày")
                            const method = order.shipping.method || "";
                            const daysMatch = method.match(/(\d+)\s*ngày/i);
                            if (daysMatch) {
                              const days = parseInt(daysMatch[1]);
                              const date = new Date();
                              date.setDate(date.getDate() + days);
                              return date.toLocaleDateString("vi-VN", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              });
                            }
                            // Mặc định 3-5 ngày
                            const defaultDate = new Date();
                            defaultDate.setDate(defaultDate.getDate() + 4);
                            return defaultDate.toLocaleDateString("vi-VN", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            });
                          })()}
                        </span>
                      </p>
                    ) : null}
                  </div>
                </div>
              )}
            </div>

            <div className="text-center space-x-4">
              {paymentStatus === "failed" ? (
                <>
                  <Link
                    href={`/checkout?orderId=${order.orderId}`}
                    className="inline-block font-medium text-white bg-blue py-3 px-6 rounded-lg ease-out duration-200 hover:bg-blue/90"
                  >
                    Thanh toán lại
                  </Link>
                  <Link
                    href="/orders"
                    className="inline-block font-medium text-dark bg-gray-2 py-3 px-6 rounded-lg ease-out duration-200 hover:bg-gray-3"
                  >
                    Xem đơn hàng
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/orders"
                    className="inline-block font-medium text-white bg-blue py-3 px-6 rounded-lg ease-out duration-200 hover:bg-blue/90"
                  >
                    Xem đơn hàng của tôi
                  </Link>
                  <Link
                    href="/"
                    className="inline-block font-medium text-dark bg-gray-2 py-3 px-6 rounded-lg ease-out duration-200 hover:bg-gray-3"
                  >
                    Tiếp tục mua sắm
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default CheckoutSuccessContent;
