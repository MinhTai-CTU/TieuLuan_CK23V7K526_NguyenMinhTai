"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import toast from "react-hot-toast";
import { useCartStore } from "@/stores/cart-store";

// Initialize Stripe
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

interface StripeCheckoutProps {
  clientSecret: string;
  orderId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const CheckoutForm: React.FC<{
  clientSecret: string;
  orderId: string;
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ clientSecret, orderId, onSuccess, onCancel }) => {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [paymentSucceeded, setPaymentSucceeded] = useState(false);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    if (!clientSecret) {
      return;
    }

    // Chỉ check status khi chưa thanh toán thành công
    if (paymentSucceeded) {
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent?.status) {
        case "succeeded":
          if (!paymentSucceeded) {
            setMessage("Thanh toán thành công!");
            setPaymentSucceeded(true);
            toast.success("Thanh toán thành công!");
          }
          break;
        case "processing":
          setMessage("Đang xử lý thanh toán...");
          break;
        case "requires_payment_method":
          setMessage("Vui lòng nhập thông tin thanh toán.");
          break;
        default:
          // Không set message nếu đã thành công
          if (!paymentSucceeded) {
            setMessage("Đã xảy ra lỗi.");
          }
          break;
      }
    });
  }, [stripe, clientSecret, paymentSucceeded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success?orderId=${orderId}`,
        },
        redirect: "if_required",
      });

      if (error) {
        setMessage(error.message || "Đã xảy ra lỗi khi thanh toán.");
        toast.error(error.message || "Thanh toán thất bại");
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        setMessage("Thanh toán thành công!");
        setPaymentSucceeded(true);
        toast.success("Thanh toán thành công!");

        // Gọi API để xác nhận thanh toán ngay lập tức (không đợi webhook)
        try {
          const confirmResponse = await fetch("/api/stripe/confirm-payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              orderId: orderId,
              paymentIntentId: paymentIntent.id,
            }),
          });

          if (confirmResponse.ok) {
            const confirmResult = await confirmResponse.json();
            if (confirmResult.success) {
              console.log(
                `✅ Payment confirmed for order ${orderId}. Redirecting to success page...`
              );

              // Clear cart items after successful payment (before redirect)
              // This ensures cart is cleared but redirect happens before Checkout component detects empty cart
              const cartStore = useCartStore.getState();
              cartStore.deselectAllItems();
              // Cart items are already deleted from DB when order was created
              // Just reload cart to sync state
              cartStore.loadCart();

              // Redirect về success page sau khi confirm thành công
              // Use window.location to ensure immediate redirect (bypasses React router)
              window.location.href = `/checkout/success?orderId=${orderId}&payment_intent=${paymentIntent.id}`;
              return;
            }
          }
        } catch (error) {
          console.error("Error confirming payment:", error);
          // Vẫn redirect về success page, webhook sẽ xử lý sau
        }

        // Nếu confirm API không thành công, vẫn redirect về success page
        // Webhook sẽ tự động cập nhật trạng thái đơn hàng
        console.log(
          `Payment succeeded. Redirecting to success page. Webhook will update order ${orderId} automatically.`
        );

        // Clear cart items after successful payment (before redirect)
        const cartStore = useCartStore.getState();
        cartStore.deselectAllItems();
        cartStore.loadCart();

        // Use window.location to ensure immediate redirect (bypasses React router)
        window.location.href = `/checkout/success?orderId=${orderId}&payment_intent=${paymentIntent.id}`;
      } else if (paymentIntent?.status === "processing") {
        // Payment is processing (e.g., 3D Secure)
        setMessage("Đang xử lý thanh toán... Vui lòng đợi.");
        toast("Đang xử lý thanh toán...", { icon: "⏳" });

        // Poll để check status khi processing
        const checkStatus = setInterval(async () => {
          if (!stripe) return;
          const { paymentIntent: updatedIntent } =
            await stripe.retrievePaymentIntent(clientSecret);
          if (updatedIntent?.status === "succeeded") {
            clearInterval(checkStatus);
            setMessage("Thanh toán thành công!");
            setPaymentSucceeded(true);
            toast.success("Thanh toán thành công!");
          } else if (
            updatedIntent?.status === "requires_payment_method" ||
            updatedIntent?.status === "canceled"
          ) {
            clearInterval(checkStatus);
            setMessage("Thanh toán thất bại. Vui lòng thử lại.");
            toast.error("Thanh toán thất bại");
          }
        }, 2000);

        // Stop polling after 30 seconds
        setTimeout(() => {
          clearInterval(checkStatus);
        }, 30000);
      }
    } catch (err: any) {
      setMessage(err.message || "Đã xảy ra lỗi.");
      toast.error(err.message || "Thanh toán thất bại");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoHome = () => {
    router.push("/");
  };

  const handleViewOrder = () => {
    router.push(`/checkout/success?orderId=${orderId}`);
  };

  return (
    <div className="space-y-4">
      {!paymentSucceeded ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <PaymentElement />

          {message && (
            <div
              className={`p-3 rounded-md text-sm ${
                message.includes("thành công")
                  ? "bg-green-50 text-green-800"
                  : message.includes("xử lý")
                    ? "bg-blue-50 text-blue-800"
                    : "bg-red-50 text-red-800"
              }`}
            >
              {message}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 border border-gray-3 rounded-md text-dark hover:bg-gray-2 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!stripe || isProcessing}
              className="flex-1 px-4 py-2 bg-blue text-white rounded-md hover:bg-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? "Đang xử lý..." : "Thanh toán"}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          {/* Success Message */}
          <div className="p-4 rounded-lg bg-green-50 border border-green-200">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-green-900 mb-1">
                  Thanh toán thành công!
                </h4>
                <p className="text-sm text-green-800">
                  Đơn hàng của bạn đã được xác nhận. Mã đơn hàng:{" "}
                  <span className="font-medium">{orderId}</span>
                </p>
                <p className="text-xs text-green-700 mt-2">
                  Webhook đang cập nhật trạng thái đơn hàng...
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleViewOrder}
              className="w-full px-4 py-3 bg-blue text-white rounded-md hover:bg-blue-dark transition-colors font-medium"
            >
              Xem chi tiết đơn hàng
            </button>
            <button
              type="button"
              onClick={handleGoHome}
              className="w-full px-4 py-3 border border-gray-3 rounded-md text-dark hover:bg-gray-2 transition-colors font-medium"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const StripeCheckout: React.FC<StripeCheckoutProps> = ({
  clientSecret,
  orderId,
  onSuccess,
  onCancel,
}) => {
  if (!stripePromise) {
    return (
      <div className="bg-white rounded-[10px] shadow-1 border border-gray-3 p-6">
        <div className="text-center text-red-600">
          <p>
            Stripe chưa được cấu hình. Vui lòng thêm
            NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY vào file .env
          </p>
        </div>
      </div>
    );
  }

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: "stripe",
      variables: {
        colorPrimary: "#3B82F6",
        colorBackground: "#ffffff",
        colorText: "#1F2937",
        colorDanger: "#EF4444",
        fontFamily: "system-ui, sans-serif",
        spacingUnit: "4px",
        borderRadius: "8px",
      },
    },
  };

  return (
    <div className="bg-white rounded-[10px] shadow-1 border border-gray-3 p-6">
      <h3 className="text-lg font-semibold text-dark mb-4">
        Thanh toán bằng Stripe
      </h3>
      <Elements options={options} stripe={stripePromise}>
        <CheckoutForm
          clientSecret={clientSecret}
          orderId={orderId}
          onSuccess={onSuccess}
          onCancel={onCancel}
        />
      </Elements>
    </div>
  );
};

export default StripeCheckout;
