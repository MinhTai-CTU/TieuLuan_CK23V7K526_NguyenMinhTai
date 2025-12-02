import { create } from "zustand";
import { Product } from "@/types/product";

type QuickViewState = {
  value: Product;
  updateQuickView: (product: Product) => void;
  resetQuickView: () => void;
};

const initialProduct: Product = {
  id: "",
  title: "",
  reviews: 0,
  price: 0,
  discountedPrice: 0,
  imgs: { thumbnails: [], previews: [] },
};

export const useQuickViewStore = create<QuickViewState>((set) => ({
  value: initialProduct,

  updateQuickView: (product) => {
    set({ value: product });
  },

  resetQuickView: () => {
    set({ value: initialProduct });
  },
}));
