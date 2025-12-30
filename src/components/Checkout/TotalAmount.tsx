"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { flushSync } from "react-dom";
import { useCartStore } from "@/stores/cart-store";
import { useCheckoutStore } from "@/stores/checkout-store";
import { useAuth } from "@/hooks/useAuth";
import { useAddresses } from "@/hooks/queries/useAddresses";
import { getAuthHeader } from "@/lib/auth-storage";
import { formatPrice } from "@/utils/formatPrice";
import toast from "react-hot-toast";
import StripeCheckout from "./StripeCheckout";

type PaymentMethod = "cod" | "momo" | "stripe" | null;

const TotalAmount = () => {
  const router = useRouter();
  const { user } = useAuth();
  const cartItems = useCartStore((state) => state.items);
  const selectedItems = useCartStore((state) => state.selectedItems);
  const getSelectedTotalPrice = useCartStore(
    (state) => state.getSelectedTotalPrice
  );
  const loadCart = useCartStore((state) => state.loadCart);
  const removeAllItemsFromCart = useCartStore(
    (state) => state.removeAllItemsFromCart
  );
  const { selectedShipping, selectedAddress } = useCheckoutStore();
  const { data: addresses = [] } = useAddresses();
  const [discountCode, setDiscountCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [shippingDiscount, setShippingDiscount] = useState(0);
  const [appliedPromotion, setAppliedPromotion] = useState<{
    code: string;
    scope: string;
    type: string;
    value?: number;
    maxDiscount?: number | null;
  } | null>(null);
  const [isValidatingPromotion, setIsValidatingPromotion] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [showStripeCheckout, setShowStripeCheckout] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(
    null
  );
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  const subtotal = getSelectedTotalPrice();
  // Shipping fee is already in VND from Goship API
  const baseShippingFee = selectedShipping ? selectedShipping.total_fee : 0;
  // Calculate final shipping fee after discount
  const finalShippingFee = Math.max(0, baseShippingFee - shippingDiscount);
  const total = subtotal - discountAmount + finalShippingFee;

  // Debug: Log state changes for Stripe checkout
  useEffect(() => {
    console.log("🔄 Stripe Checkout State Changed:", {
      showStripeCheckout,
      hasClientSecret: !!stripeClientSecret,
      hasOrderId: !!currentOrderId,
      clientSecretPreview: stripeClientSecret
        ? stripeClientSecret.substring(0, 20) + "..."
        : null,
    });
  }, [showStripeCheckout, stripeClientSecret, currentOrderId]);

  // Recalculate shipping discount when shipping method changes and freeship promotion is applied
  useEffect(() => {
    if (
      appliedPromotion &&
      (appliedPromotion.type === "FREESHIP" ||
        appliedPromotion.type === "FREESHIP_PERCENTAGE") &&
      baseShippingFee > 0
    ) {
      let calculatedShippingDiscount = 0;
      if (appliedPromotion.type === "FREESHIP") {
        // 100% free shipping
        calculatedShippingDiscount = baseShippingFee;
      } else if (
        appliedPromotion.type === "FREESHIP_PERCENTAGE" &&
        appliedPromotion.value
      ) {
        // Percentage discount on shipping
        calculatedShippingDiscount =
          (baseShippingFee * appliedPromotion.value) / 100;
        if (appliedPromotion.maxDiscount) {
          calculatedShippingDiscount = Math.min(
            calculatedShippingDiscount,
            appliedPromotion.maxDiscount
          );
        }
      }
      setShippingDiscount(calculatedShippingDiscount);
    }
  }, [selectedShipping, appliedPromotion, baseShippingFee]);

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      toast.error("Vui lòng nhập mã khuyến mãi");
      return;
    }

    setIsValidatingPromotion(true);
    try {
      const response = await fetch("/api/promotions/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: discountCode.trim(),
          subtotal,
          cartItems: selectedCartItems.map((item) => ({
            productId: item.id,
            productVariantId: item.productVariantId || null,
            price: item.price,
            discountedPrice: item.discountedPrice,
            quantity: item.quantity,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error(result.error || "Mã khuyến mãi không hợp lệ");
        setDiscountAmount(0);
        setShippingDiscount(0);
        setAppliedPromotion(null);
        return;
      }

      const {
        promotion,
        discountAmount: calculatedDiscount,
        appliedToShipping,
      } = result.data;

      // Calculate shipping discount if it's a freeship promotion
      let calculatedShippingDiscount = 0;
      if (appliedToShipping && baseShippingFee > 0) {
        if (promotion.type === "FREESHIP") {
          // 100% free shipping
          calculatedShippingDiscount = baseShippingFee;
        } else if (promotion.type === "FREESHIP_PERCENTAGE") {
          // Percentage discount on shipping
          calculatedShippingDiscount =
            (baseShippingFee * promotion.value) / 100;
          if (promotion.maxDiscount) {
            calculatedShippingDiscount = Math.min(
              calculatedShippingDiscount,
              promotion.maxDiscount
            );
          }
        }
      }

      setDiscountAmount(calculatedDiscount);
      setShippingDiscount(calculatedShippingDiscount);
      setAppliedPromotion({
        code: promotion.code,
        scope: promotion.scope,
        type: promotion.type,
        value: promotion.value,
        maxDiscount: promotion.maxDiscount,
      });

      toast.success("Áp dụng mã khuyến mãi thành công!");
    } catch (error: any) {
      console.error("Error validating promotion:", error);
      toast.error("Không thể kiểm tra mã khuyến mãi");
      setDiscountAmount(0);
      setShippingDiscount(0);
      setAppliedPromotion(null);
    } finally {
      setIsValidatingPromotion(false);
    }
  };

  const handleRemovePromotion = () => {
    setDiscountCode("");
    setDiscountAmount(0);
    setShippingDiscount(0);
    setAppliedPromotion(null);
    toast.success("Đã xóa mã khuyến mãi");
  };

  // Get selected cart items
  const selectedCartItems = cartItems.filter((item) =>
    selectedItems.includes(item.cartItemId)
  );

  // Get address for shipping
  const shippingAddress =
    selectedAddress || addresses.find((addr) => addr.isDefault);

  const handlePlaceOrder = async () => {
    if (!selectedPaymentMethod || selectedCartItems.length === 0) {
      toast.error("Vui lòng chọn phương thức thanh toán và sản phẩm");
      return;
    }

    if (!shippingAddress) {
      toast.error("Vui lòng chọn địa chỉ giao hàng");
      return;
    }

    if (!selectedShipping) {
      toast.error("Vui lòng chọn phương thức vận chuyển");
      return;
    }

    setIsCreatingOrder(true);

    // Flag to track if we're showing Stripe checkout (to prevent finally block from resetting)
    let isShowingStripeCheckout = false;

    try {
      // Prepare order items
      const orderItems = selectedCartItems.map((item) => {
        // Debug: Check variant ID
        if (!item.productVariantId) {
          console.warn(`⚠️ Item "${item.title}" missing productVariantId`);
        }
        return {
          productId: item.id,
          productVariantId: item.productVariantId || null,
          quantity: item.quantity,
          price: item.price,
          discountedPrice: item.discountedPrice,
          selectedOptions: item.selectedOptions || null,
          cartItemId: item.databaseId || null, // Send database ID for precise cart deletion
        };
      });

      console.log(orderItems);

      // Validate email
      if (!user?.email) {
        toast.error("Vui lòng cập nhật email trong tài khoản để đặt hàng");
        return;
      }

      console.log("selectedShipping", selectedShipping);

      // Tính ngày giao hàng dự kiến từ estimated_delivery_time
      let estimatedDeliveryDate: Date | null = null;
      if (selectedShipping.estimated_delivery_time) {
        console.log("📦 Processing estimated_delivery_time:", {
          raw: selectedShipping.estimated_delivery_time,
          type: typeof selectedShipping.estimated_delivery_time,
        });

        // estimated_delivery_time có thể là số ngày (ví dụ: "3") hoặc string (ví dụ: "3 ngày", "3 days")
        let days = 3; // Default 3 days

        const deliveryTimeStr =
          selectedShipping.estimated_delivery_time.toString();

        // Try to extract number from string (e.g., "3 ngày" -> 3, "3 days" -> 3)
        const numberMatch = deliveryTimeStr.match(/\d+/);
        if (numberMatch) {
          days = parseInt(numberMatch[0], 10);
        } else {
          // If no number found, try direct parseInt
          const parsed = parseInt(deliveryTimeStr, 10);
          if (!isNaN(parsed)) {
            days = parsed;
          }
        }

        // Calculate estimated delivery date
        estimatedDeliveryDate = new Date();
        estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + days);
        // Set time to end of day (23:59:59) for better UX
        estimatedDeliveryDate.setHours(23, 59, 59, 999);

        console.log(
          `📅 Estimated delivery date calculated: ${days} days from now = ${estimatedDeliveryDate.toISOString()}`
        );
      } else {
        console.warn(
          "⚠️ No estimated_delivery_time found in selectedShipping:",
          selectedShipping
        );
      }

      // Prepare shipping info
      const shippingInfo = {
        fullName: shippingAddress.fullName,
        email: user.email, // Đảm bảo email luôn có giá trị
        phone: shippingAddress.phone || null,
        address: `${shippingAddress.address}, ${shippingAddress.ward}, ${shippingAddress.district}, ${shippingAddress.city}`,
        city: shippingAddress.city,
        postalCode: shippingAddress.postalCode || null,
        country: shippingAddress.country,
        method: `${selectedShipping.carrier_name} - ${selectedShipping.service_name}`,
        estimatedDeliveryDate: estimatedDeliveryDate?.toISOString() || null,
      };

      // Debug: Log shipping info before sending
      console.log("📦 Shipping info to send:", {
        estimatedDeliveryDate: shippingInfo.estimatedDeliveryDate,
        estimatedDeliveryDateRaw: estimatedDeliveryDate,
        estimated_delivery_time: selectedShipping.estimated_delivery_time,
        fullShippingInfo: shippingInfo,
      });

      // Create order
      const authHeader = getAuthHeader();
      if (!authHeader) {
        toast.error("Vui lòng đăng nhập để đặt hàng");
        router.push("/signin");
        return;
      }

      const orderPayload = {
        userId: user?.id || null,
        items: orderItems,
        shipping: shippingInfo,
        total: total,
        paymentMethod: selectedPaymentMethod,
        promotionCode: appliedPromotion?.code || null,
        discountAmount:
          discountAmount + shippingDiscount > 0
            ? discountAmount + shippingDiscount
            : null,
      };

      console.log("🛒 Creating order with payload:", {
        ...orderPayload,
        promotionCode: orderPayload.promotionCode,
        appliedPromotion: appliedPromotion,
      });

      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(orderPayload),
      });

      const orderResult = await orderResponse.json();

      if (!orderResponse.ok || !orderResult.success) {
        throw new Error(orderResult.error || "Không thể tạo đơn hàng");
      }

      const createdOrder = orderResult.data;
      const orderId = createdOrder.orderId;

      // Handle different payment methods FIRST (before clearing cart)
      // This ensures Stripe checkout state is set before any re-renders
      if (selectedPaymentMethod === "stripe") {
        // Create Stripe payment intent
        console.log("💳 Creating Stripe Payment Intent for order:", orderId);
        const paymentIntentResponse = await fetch(
          "/api/stripe/create-payment-intent",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              amount: total,
              currency: "vnd",
              orderId: orderId,
              metadata: {
                userId: user?.id || "",
              },
            }),
          }
        );

        const paymentIntentResult = await paymentIntentResponse.json();
        console.log("💳 Payment Intent Response:", paymentIntentResult);

        if (!paymentIntentResponse.ok || !paymentIntentResult.success) {
          console.error(
            "❌ Failed to create Payment Intent:",
            paymentIntentResult
          );
          throw new Error(
            paymentIntentResult.error || "Không thể tạo thanh toán Stripe"
          );
        }

        // Verify clientSecret exists
        if (!paymentIntentResult.data?.clientSecret) {
          console.error("❌ Missing clientSecret in Payment Intent response");
          throw new Error("Không nhận được clientSecret từ Stripe");
        }

        // Show Stripe checkout form
        console.log("✅ Setting up Stripe checkout form with clientSecret");
        const clientSecret = paymentIntentResult.data.clientSecret;
        console.log("📝 Setting state values:", {
          clientSecret: clientSecret ? "✅ exists" : "❌ missing",
          orderId: orderId,
        });

        // Use flushSync to force immediate state updates (bypass React batching)
        flushSync(() => {
          setIsCreatingOrder(false);
          setStripeClientSecret(clientSecret);
          setCurrentOrderId(orderId);
          setShowStripeCheckout(true);
        });

        // Set flag to prevent finally block from resetting
        isShowingStripeCheckout = true;

        console.log("✅ Stripe checkout states set with flushSync");

        toast.success("Vui lòng hoàn tất thanh toán bằng thẻ", {
          duration: 4000,
        });

        // DON'T clear cart yet for Stripe payments
        // Cart will be cleared after payment succeeds (in StripeCheckout component)
        // This prevents Checkout component from redirecting to cart before payment completes

        // Return early to prevent finally block from resetting state
        return;
      }

      // Clear cart items that were ordered (for non-Stripe payments)
      selectedCartItems.forEach((item) => {
        useCartStore.getState().removeItemFromCart(item.cartItemId);
      });

      // Reload cart from database to sync with backend
      if (user) {
        await loadCart();
        // Clear selected items after reload
        useCartStore.getState().deselectAllItems();
      } else {
        // For guest users, clear selected items from localStorage
        const currentItems = useCartStore.getState().items;
        const updatedItems = currentItems.filter(
          (item) => !selectedItems.includes(item.cartItemId)
        );
        useCartStore.getState().setCart(updatedItems);
        useCartStore.getState().deselectAllItems();
      }

      // Toast: Đơn hàng đã được tạo thành công
      toast.success(`Đơn hàng ${orderId} đã được tạo thành công!`, {
        duration: 3000,
      });

      // Handle other payment methods
      if (selectedPaymentMethod === "momo") {
        // Create MoMo payment
        const momoResponse = await fetch("/api/momo/create-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: total,
            orderId: orderId,
            userId: user?.id || null,
            description: `Thanh toán đơn hàng ${orderId}`,
            returnUrl: `${window.location.origin}/checkout/success?orderId=${orderId}`,
          }),
        });

        const momoResult = await momoResponse.json();

        if (!momoResponse.ok || !momoResult.success) {
          // Log detailed error for debugging
          console.error("MoMo Error Details:", momoResult);

          // Create user-friendly error message
          let errorMessage =
            momoResult.error || "Không thể tạo thanh toán MoMo";

          // Add details if available
          if (momoResult.details) {
            if (momoResult.details.message) {
              errorMessage += ` - ${momoResult.details.message}`;
            }
          }

          throw new Error(errorMessage);
        }

        // Redirect to MoMo payment page
        if (momoResult.data?.payUrl) {
          toast.success("Đang chuyển đến trang thanh toán MoMo...", {
            duration: 2000,
            icon: "⏳",
          });
          // Delay một chút để user thấy toast
          setTimeout(() => {
            window.location.href = momoResult.data.payUrl;
          }, 500);
        } else {
          throw new Error("Không nhận được URL thanh toán từ MoMo");
        }
      } else {
        // For COD, redirect to success page
        toast.success(
          "Đơn hàng đã được đặt thành công! Vui lòng chuẩn bị tiền mặt khi nhận hàng.",
          {
            duration: 4000,
          }
        );
        router.push(`/checkout/success?orderId=${orderId}`);
      }
    } catch (error: any) {
      console.error("Error placing order:", error);
      const errorMessage =
        error.message || "Đã xảy ra lỗi khi đặt hàng. Vui lòng thử lại.";
      toast.error(`❌ ${errorMessage}`, {
        duration: 5000,
        icon: "❌",
      });
      // Reset Stripe checkout states on error
      setShowStripeCheckout(false);
      setStripeClientSecret(null);
      setCurrentOrderId(null);
    } finally {
      // Only set isCreatingOrder to false if we're not showing Stripe checkout
      // (Stripe checkout already sets it to false and returns early)
      // Use the flag instead of checking state (which may not be updated yet)
      if (!isShowingStripeCheckout) {
        setIsCreatingOrder(false);
      }
    }
  };

  const handleStripeSuccess = () => {
    // Không cần làm gì, StripeCheckout sẽ hiển thị success message và buttons
    // User có thể chọn xem đơn hàng hoặc về trang chủ từ trong component
  };

  const handleStripeCancel = () => {
    setShowStripeCheckout(false);
    setStripeClientSecret(null);
    setCurrentOrderId(null);
    toast("Đã hủy thanh toán Stripe", { icon: "ℹ️" });
  };

  // Determine discount label based on promotion type
  const getDiscountLabel = () => {
    if (!appliedPromotion) return "Mã giảm giá";

    if (appliedPromotion.scope === "GLOBAL_ORDER") {
      if (
        appliedPromotion.type === "FREESHIP" ||
        appliedPromotion.type === "FREESHIP_PERCENTAGE"
      ) {
        return "Mã giảm/ miễn phí vận chuyển";
      } else {
        return "Mã giảm/ miễn phí vận chuyển";
      }
    } else {
      return "Giảm giá sản phẩm";
    }
  };

  return (
    <div className="bg-white rounded-[10px] shadow-1 border border-gray-3 p-6">
      <h2 className="text-lg font-semibold text-dark mb-4 pb-4 border-b border-gray-3">
        Tổng tiền
      </h2>

      {/* Promotion Code Input */}
      <div className="mb-4 pb-4 border-b border-gray-3">
        <label className="block text-sm font-medium text-dark mb-2">
          Mã khuyến mãi
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleApplyDiscount();
              }
            }}
            placeholder="Nhập mã khuyến mãi"
            className="flex-1 px-3 py-2 border border-gray-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
            disabled={isValidatingPromotion || !!appliedPromotion}
          />
          {appliedPromotion ? (
            <button
              type="button"
              onClick={handleRemovePromotion}
              className="px-4 py-2 bg-red text-white rounded-lg hover:bg-red-dark transition-colors text-sm font-medium"
            >
              Xóa
            </button>
          ) : (
            <button
              type="button"
              onClick={handleApplyDiscount}
              disabled={isValidatingPromotion || !discountCode.trim()}
              className="px-4 py-2 bg-blue text-white rounded-lg hover:bg-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isValidatingPromotion ? "Đang kiểm tra..." : "Kiểm tra"}
            </button>
          )}
        </div>
        {appliedPromotion && (
          <p className="text-xs text-green-600 mt-1.5">
            ✓ Đã áp dụng mã: {appliedPromotion.code}
          </p>
        )}
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-dark-4">Tạm tính</span>
          <span className="text-dark font-medium">{formatPrice(subtotal)}</span>
        </div>

        {(discountAmount > 0 || shippingDiscount > 0) && (
          <div className="flex justify-between text-sm">
            <span className="text-dark-4">{getDiscountLabel()}</span>
            <span className="text-red-600 font-medium">
              - {formatPrice(discountAmount + shippingDiscount)}
            </span>
          </div>
        )}

        <div className="flex justify-between text-sm">
          <span className="text-dark-4">Phí vận chuyển:</span>
          <span className="text-dark font-medium">
            {finalShippingFee > 0 ? (
              <>
                {baseShippingFee > finalShippingFee && (
                  <span className="text-gray-500 line-through mr-2">
                    {formatPrice(baseShippingFee)}
                  </span>
                )}
                {formatPrice(finalShippingFee)}
              </>
            ) : (
              <span className="text-green-600">Miễn phí</span>
            )}
          </span>
        </div>
      </div>

      <div className="border-t border-gray-3 pt-4 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-base font-semibold text-dark">
            Tổng thanh toán
          </span>
          <span className="text-xl font-bold text-dark">
            {formatPrice(total)}
          </span>
        </div>
        <p className="text-xs text-dark-4 mt-1">(Đã bao gồm VAT nếu có)</p>
      </div>

      {/* Payment Methods */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-dark mb-3">
          Phương thức thanh toán
        </h3>
        <div className="space-y-2.5">
          {/* COD */}
          <button
            type="button"
            onClick={() => setSelectedPaymentMethod("cod")}
            className={`w-full flex items-center justify-between p-3.5 rounded-lg border-2 transition-all duration-200 ${
              selectedPaymentMethod === "cod"
                ? "border-blue bg-blue/5"
                : "border-gray-3 bg-white hover:border-gray-4"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedPaymentMethod === "cod"
                    ? "border-blue bg-blue"
                    : "border-gray-4"
                }`}
              >
                {selectedPaymentMethod === "cod" && (
                  <div className="w-2.5 h-2.5 rounded-full bg-white" />
                )}
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center border border-green-200 shadow-sm">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M20 4H4C2.89 4 2.01 4.89 2.01 6L2 18C2 19.11 2.89 20 4 20H20C21.11 20 22 19.11 22 18V6C22 4.89 21.11 4 20 4ZM20 18H4V12H20V18ZM20 8H4V6H20V8Z"
                      fill="#10B981"
                    />
                    <circle cx="7" cy="7" r="1.5" fill="#10B981" />
                    <path
                      d="M12 14C13.1 14 14 13.1 14 12C14 10.9 13.1 10 12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14Z"
                      fill="#10B981"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-dark">
                    Thanh toán khi nhận hàng (COD)
                  </p>
                  <p className="text-xs text-dark-4">
                    Thanh toán bằng tiền mặt khi nhận hàng
                  </p>
                </div>
              </div>
            </div>
          </button>

          {/* MoMo */}
          <button
            type="button"
            onClick={() => setSelectedPaymentMethod("momo")}
            className={`w-full flex items-center justify-between p-3.5 rounded-lg border-2 transition-all duration-200 ${
              selectedPaymentMethod === "momo"
                ? "border-blue bg-blue/5"
                : "border-gray-3 bg-white hover:border-gray-4"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedPaymentMethod === "momo"
                    ? "border-blue bg-blue"
                    : "border-gray-4"
                }`}
              >
                {selectedPaymentMethod === "momo" && (
                  <div className="w-2.5 h-2.5 rounded-full bg-white" />
                )}
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#C41E3A] to-[#A01A2E] flex items-center justify-center shadow-sm">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z"
                      fill="white"
                    />
                    <path
                      d="M12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4Z"
                      fill="#C41E3A"
                    />
                    <text
                      x="12"
                      y="16"
                      textAnchor="middle"
                      fill="white"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      MoMo
                    </text>
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-dark">MoMo</p>
                  <p className="text-xs text-dark-4">
                    Thanh toán qua ứng dụng MoMo
                  </p>
                </div>
              </div>
            </div>
          </button>

          {/* Stripe */}
          <button
            type="button"
            onClick={() => {
              setSelectedPaymentMethod("stripe");
              // Reset Stripe checkout states when selecting Stripe
              // Form will be shown after order is created
              setShowStripeCheckout(false);
              setStripeClientSecret(null);
              setCurrentOrderId(null);
            }}
            className={`w-full flex items-center justify-between p-3.5 rounded-lg border-2 transition-all duration-200 ${
              selectedPaymentMethod === "stripe"
                ? "border-blue bg-blue/5"
                : "border-gray-3 bg-white hover:border-gray-4"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedPaymentMethod === "stripe"
                    ? "border-blue bg-blue"
                    : "border-gray-4"
                }`}
              >
                {selectedPaymentMethod === "stripe" && (
                  <div className="w-2.5 h-2.5 rounded-full bg-white" />
                )}
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#635BFF] to-[#5A52E5] flex items-center justify-center shadow-sm">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="3"
                      y="5"
                      width="18"
                      height="14"
                      rx="2"
                      fill="white"
                    />
                    <rect x="3" y="5" width="18" height="4" fill="#635BFF" />
                    <circle cx="7" cy="7" r="1.5" fill="white" />
                    <rect
                      x="10"
                      y="6"
                      width="6"
                      height="2"
                      rx="1"
                      fill="white"
                    />
                    <rect
                      x="10"
                      y="10"
                      width="8"
                      height="1.5"
                      rx="0.75"
                      fill="#635BFF"
                    />
                    <rect
                      x="10"
                      y="13"
                      width="6"
                      height="1.5"
                      rx="0.75"
                      fill="#635BFF"
                    />
                    <rect x="3" y="16" width="18" height="3" fill="#635BFF" />
                    <rect
                      x="5"
                      y="17"
                      width="4"
                      height="1"
                      rx="0.5"
                      fill="white"
                    />
                    <rect
                      x="15"
                      y="17"
                      width="4"
                      height="1"
                      rx="0.5"
                      fill="white"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-dark">Stripe</p>
                  <p className="text-xs text-dark-4">
                    Thanh toán bằng thẻ tín dụng/ghi nợ
                  </p>
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Stripe Payment Method Info - Show when Stripe is selected but form is not ready */}
      {selectedPaymentMethod === "stripe" && !showStripeCheckout && (
        <div className="mt-4 bg-blue/5 border border-blue/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg
                className="w-5 h-5 text-blue"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-dark mb-1">
                Thanh toán bằng thẻ tín dụng/ghi nợ
              </p>
              <p className="text-xs text-dark-4">
                Vui lòng nhấn &quot;Đặt hàng&quot; để tiếp tục. Form nhập thẻ sẽ
                hiển thị sau khi đơn hàng được tạo.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stripe Checkout Form - Show when order is created and Payment Intent is ready */}
      {(() => {
        const shouldShow =
          showStripeCheckout && stripeClientSecret && currentOrderId;
        console.log("🎨 Stripe Checkout Render Check:", {
          showStripeCheckout,
          hasClientSecret: !!stripeClientSecret,
          hasOrderId: !!currentOrderId,
          shouldShow,
        });
        return shouldShow ? (
          <div className="mt-4">
            <StripeCheckout
              clientSecret={stripeClientSecret}
              orderId={currentOrderId}
              onSuccess={handleStripeSuccess}
              onCancel={handleStripeCancel}
            />
          </div>
        ) : null;
      })()}

      {/* Place Order Button */}
      {!showStripeCheckout && (
        <button
          type="button"
          onClick={handlePlaceOrder}
          disabled={
            selectedItems.length === 0 ||
            !selectedPaymentMethod ||
            isCreatingOrder ||
            !shippingAddress ||
            !selectedShipping
          }
          className={`w-full py-3.5 px-4 rounded-md font-semibold text-sm transition-all duration-200 ${
            selectedItems.length === 0 ||
            !selectedPaymentMethod ||
            isCreatingOrder ||
            !shippingAddress ||
            !selectedShipping
              ? "bg-gray-2 text-dark-4 cursor-not-allowed"
              : "bg-blue text-white hover:bg-blue-dark shadow-md hover:shadow-lg"
          }`}
        >
          {isCreatingOrder
            ? "Đang tạo đơn hàng..."
            : selectedPaymentMethod
              ? "Đặt hàng"
              : "Vui lòng chọn phương thức thanh toán"}
        </button>
      )}
    </div>
  );
};

export default TotalAmount;
