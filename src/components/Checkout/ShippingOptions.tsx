"use client";
import React, { useMemo } from "react";
import Image from "next/image";
import { useAddresses } from "@/hooks/queries/useAddresses";
import { useShippingRates, type ShippingRate } from "@/hooks/queries/useGoship";
import { useCartStore } from "@/stores/cart-store";
import { useCheckoutStore } from "@/stores/checkout-store";
import { formatPrice } from "@/utils/formatPrice";

const ShippingOptions = () => {
  const { data: addresses = [] } = useAddresses();
  const { selectedShipping, setSelectedShipping, selectedAddress } =
    useCheckoutStore();

  // Find default address
  const defaultAddress = addresses.find((addr) => addr.isDefault);

  // Use selectedAddress if available, otherwise use defaultAddress
  const deliveryAddress = selectedAddress || defaultAddress;

  // Get selected total price (subtotal)
  const getSelectedTotalPrice = useCartStore(
    (state) => state.getSelectedTotalPrice
  );
  const subtotal = getSelectedTotalPrice();

  console.log("selectedShipping", selectedShipping);

  // Prepare rates request
  const ratesRequest = useMemo(() => {
    if (
      !deliveryAddress ||
      !deliveryAddress.districtId ||
      !deliveryAddress.cityId ||
      subtotal <= 0
    ) {
      return null;
    }

    // For now, we'll use a default "from" address (warehouse location)
    // In production, this should come from your warehouse settings
    return {
      to_district: String(deliveryAddress.districtId),
      to_city: String(deliveryAddress.cityId),
      amount: subtotal, // Order amount in VND
      // cod will be calculated after we get shipping fee
      // For now, set cod = amount (will be updated when shipping is selected)
    };
  }, [deliveryAddress, subtotal]);

  // Fetch shipping rates
  const { data: rates = [], isLoading, error } = useShippingRates(ratesRequest);

  console.log(rates);

  // Auto-select first rate when rates are loaded and no selection exists
  React.useEffect(() => {
    if (rates.length > 0 && !selectedShipping) {
      const firstRate = rates[0];
      console.log("🚚 Auto-selecting first shipping rate:", {
        carrier: firstRate.carrier_name,
        service: firstRate.service_name,
        estimated_delivery_time: firstRate.expected,
      });
      setSelectedShipping({
        carrier: firstRate.carrier,
        carrier_name: firstRate.carrier_name,
        service: firstRate.service,
        service_name: firstRate.service_name,
        total_fee: firstRate.total_fee,
        estimated_delivery_time: firstRate.expected,
      });
    }
  }, [rates, selectedShipping, setSelectedShipping]);

  const handleSelectShipping = (rate: ShippingRate) => {
    console.log(rate);
    setSelectedShipping({
      carrier: rate.carrier,
      carrier_name: rate.carrier_name,
      service: rate.service,
      service_name: rate.service_name,
      total_fee: rate.total_fee,
      estimated_delivery_time: rate.expected,
    });
  };

  const isSelected = (rate: ShippingRate) => {
    return (
      selectedShipping?.carrier === rate.carrier &&
      selectedShipping?.service === rate.service
    );
  };

  if (!deliveryAddress) {
    return (
      <div className="bg-white rounded-[10px] shadow-1 border border-gray-3 p-6">
        <h2 className="text-lg font-semibold text-dark mb-4 pb-4 border-b border-gray-3">
          Chọn phương thức vận chuyển
        </h2>
        <p className="text-sm text-dark-4 text-center py-4">
          Vui lòng thêm địa chỉ giao hàng để xem các phương thức vận chuyển
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[10px] shadow-1 border border-gray-3 p-6">
      <h2 className="text-lg font-semibold text-dark mb-4 pb-4 border-b border-gray-3">
        Chọn phương thức vận chuyển
      </h2>

      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-sm text-dark-4">
            Đang tải phương thức vận chuyển...
          </p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-sm text-red-600">
            Không thể tải phương thức vận chuyển. Vui lòng thử lại.
          </p>
        </div>
      ) : rates.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-dark-4">Không có phương thức vận chuyển</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rates.map((rate, index) => (
            <label
              key={`${rate.carrier}-${rate.service}-${index}`}
              className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer ease-out duration-200 ${
                isSelected(rate)
                  ? "border-blue bg-blue/5"
                  : "border-gray-3 hover:border-gray-4"
              }`}
            >
              <input
                type="radio"
                name="shipping"
                checked={isSelected(rate)}
                onChange={() => handleSelectShipping(rate)}
                className="mt-1 w-4 h-4 text-blue focus:ring-blue cursor-pointer"
              />

              {/* Logo placeholder */}
              <div className="relative flex-shrink-0 w-12 h-12 rounded-[5px] flex items-center justify-center overflow-hidden">
                {rate.carrier_logo ? (
                  <Image
                    src={rate.carrier_logo}
                    alt={rate.carrier_name}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                ) : (
                  <span className="text-xs font-semibold text-dark-4">
                    {rate.carrier_name}
                  </span>
                )}
              </div>

              {/* Shipping Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-dark mb-1">
                  {rate.carrier_name}
                </h3>
                <p className="text-xs text-dark-4">
                  {rate.service}
                  {rate.expected && ` - ${rate.expected}`}
                </p>
              </div>

              {/* Cost */}
              <div className="flex-shrink-0 text-right">
                <p className="text-sm font-semibold text-dark">
                  {formatPrice(rate.total_fee)}
                </p>
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShippingOptions;
