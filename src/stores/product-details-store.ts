import { create } from "zustand";
import { Product } from "@/types/product";

type ProductDetailsState = {
  value: Product;
  updateproductDetails: (product: Product) => void;
};

const initialProduct: Product = {
  title: "",
  reviews: 0,
  price: 0,
  discountedPrice: 0,
  id: "",
  imgs: { thumbnails: [], previews: [] },
};

export const useProductDetailsStore = create<ProductDetailsState>((set) => ({
  value: initialProduct,

  updateproductDetails: (product) => {
    set({ value: product });
  },
}));
