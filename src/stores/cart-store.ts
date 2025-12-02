import { create } from "zustand";

export type CartItemOptions = {
  color?: string;
  storage?: string;
  type?: string;
  sim?: string;
  [key: string]: string | undefined; // Allow any additional options
};

// Helper function to generate unique cart item ID from product ID + options
export const generateCartItemId = (
  productId: string,
  options?: CartItemOptions
): string => {
  if (!options || Object.keys(options).length === 0) {
    return productId;
  }
  // Create a hash from options
  const optionsString = Object.entries(options)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value || ""}`)
    .join("|");
  return `${productId}_${optionsString}`;
};

export type CartItem = {
  id: string; // Base product ID
  cartItemId: string; // Unique ID for cart item (productId + options hash)
  title: string;
  price: number;
  discountedPrice: number;
  quantity: number;
  imgs?: {
    thumbnails: string[];
    previews: string[];
  };
  selectedOptions?: CartItemOptions; // Selected attributes (color, storage, etc.)
};

type CartState = {
  items: CartItem[];
  addItemToCart: (item: CartItem) => void;
  removeItemFromCart: (itemId: string) => void;
  updateCartItemQuantity: (id: string, quantity: number) => void;
  removeAllItemsFromCart: () => void;
  getTotalPrice: () => number;
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItemToCart: (item) => {
    // Find existing item with same cartItemId (same product + same options)
    const existingItem = get().items.find(
      (i) => i.cartItemId === item.cartItemId
    );
    if (existingItem) {
      set((state) => ({
        items: state.items.map((i) =>
          i.cartItemId === item.cartItemId
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        ),
      }));
    } else {
      set((state) => ({
        items: [...state.items, item],
      }));
    }
  },

  removeItemFromCart: (cartItemId) => {
    set((state) => ({
      items: state.items.filter((item) => item.cartItemId !== cartItemId),
    }));
  },

  updateCartItemQuantity: (cartItemId, quantity) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.cartItemId === cartItemId ? { ...item, quantity } : item
      ),
    }));
  },

  removeAllItemsFromCart: () => {
    set({ items: [] });
  },

  getTotalPrice: () => {
    return get().items.reduce((total, item) => {
      return total + item.discountedPrice * item.quantity;
    }, 0);
  },
}));
