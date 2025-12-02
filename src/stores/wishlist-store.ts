import { create } from "zustand";

export type WishListItem = {
  id: string;
  title: string;
  price: number;
  discountedPrice: number;
  quantity: number;
  status?: string;
  imgs?: {
    thumbnails: string[];
    previews: string[];
  };
};

type WishlistState = {
  items: WishListItem[];
  addItemToWishlist: (item: WishListItem) => void;
  removeItemFromWishlist: (itemId: string) => void;
  removeAllItemsFromWishlist: () => void;
};

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],

  addItemToWishlist: (item) => {
    const existingItem = get().items.find((i) => i.id === item.id);
    if (existingItem) {
      set((state) => ({
        items: state.items.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
        ),
      }));
    } else {
      set((state) => ({
        items: [...state.items, item],
      }));
    }
  },

  removeItemFromWishlist: (itemId) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== itemId),
    }));
  },

  removeAllItemsFromWishlist: () => {
    set({ items: [] });
  },
}));
