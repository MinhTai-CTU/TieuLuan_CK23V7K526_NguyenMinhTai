"use client";
import { useRouter } from "next/navigation";
import { useAddresses } from "@/hooks/queries/useAddresses";
import { useCheckoutStore } from "@/stores/checkout-store";

const DeliveryAddress = () => {
  const router = useRouter();
  const { data: addresses = [], isLoading } = useAddresses();
  const { selectedAddress } = useCheckoutStore();

  // Find default address
  const defaultAddress = addresses.find((addr) => addr.isDefault);

  // Use selectedAddress if available, otherwise use defaultAddress
  const displayAddress = selectedAddress || defaultAddress;

  const handleChange = () => {
    // If no default address, navigate with ?add=true to open form
    // Otherwise, navigate to address list
    if (!defaultAddress) {
      router.push("/checkout/addresses?add=true");
    } else {
      router.push("/checkout/addresses");
    }
  };

  const handleAddAddress = () => {
    // Navigate to address management page with add=true to open add form
    router.push("/checkout/addresses?add=true");
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-[10px] shadow-1 border border-gray-3 p-6">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-3">
          <h2 className="text-lg font-semibold text-dark">Địa chỉ giao hàng</h2>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-dark-4">Đang tải địa chỉ...</p>
        </div>
      </div>
    );
  }

  // If no address to display, show add address UI
  if (!displayAddress) {
    return (
      <div className="bg-white rounded-[10px] shadow-1 border border-gray-3 p-6">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-3">
          <h2 className="text-lg font-semibold text-dark">Địa chỉ giao hàng</h2>
        </div>

        <button
          type="button"
          onClick={handleAddAddress}
          className="w-full flex flex-col items-center justify-center py-8 border-2 border-dashed border-gray-3 rounded-md hover:border-blue hover:bg-blue-light-5 ease-out duration-200 transition-all"
        >
          <div className="w-12 h-12 rounded-full bg-blue-light-5 flex items-center justify-center mb-3">
            <svg
              className="w-6 h-6 text-blue"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-dark">
            Thêm địa chỉ giao hàng
          </p>
          <p className="text-xs text-dark-4 mt-1">
            Nhấn để thêm địa chỉ giao hàng mới
          </p>
        </button>
      </div>
    );
  }

  // Show address (selected or default)
  return (
    <div className="bg-white rounded-[10px] shadow-1 border border-gray-3 p-6">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-3">
        <h2 className="text-lg font-semibold text-dark">Địa chỉ giao hàng</h2>
        <button
          type="button"
          onClick={handleChange}
          className="text-sm text-blue hover:text-blue-dark font-medium ease-out duration-200"
        >
          Thay đổi
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-dark">
          {displayAddress.fullName} - {displayAddress.phone}
        </p>
        <p className="text-sm text-dark-4">
          {displayAddress.address}, {displayAddress.ward},{" "}
          {displayAddress.district}, {displayAddress.city}
        </p>
        {selectedAddress && !selectedAddress.isDefault && (
          <p className="text-xs text-blue italic mt-1">
            (Địa chỉ giao hàng tạm thời - không phải là địa chỉ mặc định)
          </p>
        )}
      </div>
    </div>
  );
};

export default DeliveryAddress;
