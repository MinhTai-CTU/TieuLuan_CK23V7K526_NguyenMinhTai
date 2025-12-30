import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Address } from "@/hooks/queries/useAddresses";

export interface SelectedShippingOption {
  carrier: string;
  carrier_name: string;
  service: string;
  service_name: string;
  total_fee: number;
  estimated_delivery_time?: string;
}

type CheckoutState = {
  selectedShipping: SelectedShippingOption | null;
  setSelectedShipping: (shipping: SelectedShippingOption | null) => void;
  selectedAddress: Address | null;
  setSelectedAddress: (address: Address | null) => void;
};

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      selectedShipping: null,
      setSelectedShipping: (shipping) => set({ selectedShipping: shipping }),
      selectedAddress: null,
      setSelectedAddress: (address) => set({ selectedAddress: address }),
    }),
    {
      name: "checkout-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
