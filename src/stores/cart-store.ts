import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getToken } from "@/lib/auth-storage";

const CART_STORAGE_KEY = "cart_cache"; // Cache key for persist middleware
const GUEST_CART_STORAGE_KEY = "guest_cart"; // Key for guest cart metadata (for merge)

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

// Guest cart item (stored separately for merge) - only essential data
export type GuestCartItem = {
  productId: string;
  productVariantId?: string | null;
  quantity: number;
  selectedOptions?: CartItemOptions;
};

// Full cart item (with price and images from API)
export type CartItem = {
  id: string; // Base product ID
  cartItemId: string; // Unique ID for cart item (productId + options hash) - used for UI identification
  databaseId?: string; // Database cart item ID (from CartItem table) - used for API calls when logged in
  title: string;
  price: number;
  discountedPrice: number;
  quantity: number;
  productVariantId?: string | null;
  imgs?: {
    thumbnails: string[];
    previews: string[];
  };
  selectedOptions?: CartItemOptions; // Selected attributes (color, storage, etc.)
};

type CartState = {
  items: CartItem[];
  selectedItems: string[]; // Array of cartItemId that are selected
  isLoading: boolean;
  isInitialized: boolean;
  addItemToCart: (item: CartItem) => Promise<void>;
  removeItemFromCart: (itemId: string) => Promise<void>;
  updateCartItemQuantity: (id: string, quantity: number) => Promise<void>;
  removeAllItemsFromCart: () => Promise<void>;
  getTotalPrice: () => number;
  getSelectedTotalPrice: () => number; // Get total price of selected items only
  toggleItemSelection: (cartItemId: string) => void;
  selectAllItems: () => void;
  deselectAllItems: () => void;
  isItemSelected: (cartItemId: string) => boolean;
  isAllSelected: () => boolean;
  loadCart: () => Promise<void>;
  mergeGuestCart: () => Promise<void>;
  setCart: (items: CartItem[]) => void; // Helper to set cart items (used by persist)
};

// Check if user is authenticated
const isAuthenticated = (): boolean => {
  if (typeof window === "undefined") return false;
  return getToken() !== null;
};

// Load guest cart metadata from localStorage (for merge)
const loadGuestCart = (): GuestCartItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(GUEST_CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error loading guest cart:", error);
    return [];
  }
};

// Clear guest cart metadata from localStorage
const clearGuestCart = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GUEST_CART_STORAGE_KEY);
};

// Save guest cart metadata to localStorage (for merge)
const saveGuestCart = (items: GuestCartItem[]): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(items));
};

// Fetch product details from API to get current price
const fetchProductDetails = async (productId: string): Promise<any> => {
  try {
    const response = await fetch(`/api/products/${productId}`);
    if (!response.ok) throw new Error("Failed to fetch product");
    const json = await response.json();
    return json.data;
  } catch (error) {
    console.error("Error fetching product details:", error);
    return null;
  }
};

// Convert guest cart items to full cart items by fetching product details
// Optimized: Fetch all products in parallel instead of sequentially
const enrichGuestCartItems = async (
  guestItems: GuestCartItem[]
): Promise<CartItem[]> => {
  if (guestItems.length === 0) return [];

  // Fetch all products in parallel
  const productPromises = guestItems.map((guestItem) =>
    fetchProductDetails(guestItem.productId)
  );
  const products = await Promise.all(productPromises);

  // Map products to enriched cart items
  const enrichedItems: CartItem[] = [];

  for (let i = 0; i < guestItems.length; i++) {
    const guestItem = guestItems[i];
    const product = products[i];

    if (!product) continue;

    // Find variant if productVariantId is provided
    let variant = null;
    if (guestItem.productVariantId && product.variants) {
      variant = product.variants.find(
        (v: any) => v.id === guestItem.productVariantId
      );
    }

    // Use variant price if available, otherwise product price
    const price = variant?.price ?? product.price;
    const discountedPrice = variant?.discountedPrice ?? product.discountedPrice;

    // Map images
    const images = product.images || [];
    const thumbnails = images
      .filter((img: any) => img.type === "THUMBNAIL")
      .map((img: any) => img.url);
    const previews = images
      .filter((img: any) => img.type === "PREVIEW")
      .map((img: any) => img.url);

    const cartItemId = generateCartItemId(
      guestItem.productId,
      guestItem.selectedOptions
    );

    enrichedItems.push({
      id: product.id,
      cartItemId,
      title: product.title,
      price,
      discountedPrice: discountedPrice ?? price,
      quantity: guestItem.quantity,
      productVariantId: guestItem.productVariantId || null,
      imgs: {
        thumbnails: thumbnails.length > 0 ? thumbnails : previews,
        previews: previews.length > 0 ? previews : thumbnails,
      },
      selectedOptions: guestItem.selectedOptions,
    });
  }

  return enrichedItems;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      selectedItems: [], // Initialize selected items array
      isLoading: false,
      isInitialized: false,

      // Helper to set cart items (used internally and by persist)
      setCart: (items: CartItem[]) => {
        set({ items });
      },

      // Load cart from database (if logged in) or localStorage (if guest)
      // This will sync with database after loading from cache
      loadCart: async () => {
        const wasInitialized = get().isInitialized;

        // Don't show loading if already initialized (to avoid flicker)
        if (!wasInitialized) {
          set({ isLoading: true });
        }

        try {
          if (isAuthenticated()) {
            // Load from database
            const token = getToken();
            const response = await fetch("/api/cart", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (response.ok) {
              const json = await response.json();
              if (json.success) {
                // Map API response to CartItem format
                const items: CartItem[] = json.data.map((item: any) => ({
                  id: item.productId,
                  cartItemId: generateCartItemId(
                    item.productId,
                    item.selectedOptions
                  ),
                  databaseId: item.id, // Database cart item ID
                  title: item.title,
                  price: item.price,
                  discountedPrice: item.discountedPrice,
                  quantity: item.quantity,
                  productVariantId: item.productVariantId,
                  imgs: item.imgs,
                  selectedOptions: item.selectedOptions,
                }));
                // setCart will trigger persist to save to localStorage (cache)
                // Preserve selectedItems when loading from database
                const currentSelectedItems = get().selectedItems;
                set({
                  items,
                  selectedItems: currentSelectedItems,
                  isInitialized: true,
                });
              }
            }
          } else {
            // For guest users, load from guest cart metadata and enrich
            // But if persist already loaded items, use those first
            const currentItems = get().items;
            if (currentItems.length === 0) {
              // No cached items, load from guest cart metadata
              const guestItems = loadGuestCart();
              if (guestItems.length > 0) {
                const enrichedItems = await enrichGuestCartItems(guestItems);
                // Preserve selectedItems when loading guest cart
                const currentSelectedItems = get().selectedItems;
                set({
                  items: enrichedItems,
                  selectedItems: currentSelectedItems,
                  isInitialized: true,
                });
              } else {
                const currentSelectedItems = get().selectedItems;
                set({
                  items: [],
                  selectedItems: currentSelectedItems,
                  isInitialized: true,
                });
              }
            } else {
              // Items already loaded from persist cache, just mark as initialized
              set({ isInitialized: true });
              // Enrich with current prices in background
              enrichGuestCartItems(
                currentItems.map((item) => ({
                  productId: item.id,
                  productVariantId: item.productVariantId || null,
                  quantity: item.quantity,
                  selectedOptions: item.selectedOptions,
                }))
              )
                .then((enriched) => {
                  set({ items: enriched });
                })
                .catch(console.error);
            }
          }
        } catch (error) {
          console.error("Error loading cart:", error);
          if (!wasInitialized) {
            const currentSelectedItems = get().selectedItems;
            set({
              items: [],
              selectedItems: currentSelectedItems,
              isInitialized: true,
            });
          }
        } finally {
          set({ isLoading: false, isInitialized: true });
        }
      },

      // Merge guest cart into database when user logs in
      mergeGuestCart: async () => {
        if (!isAuthenticated()) return;

        const guestItems = loadGuestCart();
        if (guestItems.length === 0) return;

        try {
          const token = getToken();
          const response = await fetch("/api/cart/merge", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ items: guestItems }),
          });

          if (response.ok) {
            // Clear guest cart metadata
            clearGuestCart();
            // Reload cart from database (will also update persist cache)
            await get().loadCart();
          }
        } catch (error) {
          console.error("Error merging guest cart:", error);
        }
      },

      // Add item to cart
      addItemToCart: async (item: CartItem) => {
        const existingItem = get().items.find(
          (i) => i.cartItemId === item.cartItemId
        );

        if (isAuthenticated()) {
          // Save to database
          try {
            const token = getToken();
            const response = await fetch("/api/cart", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                productId: item.id,
                productVariantId: item.productVariantId || null,
                quantity: existingItem
                  ? existingItem.quantity + item.quantity
                  : item.quantity,
                selectedOptions: item.selectedOptions || null,
              }),
            });

            if (response.ok) {
              // Reload cart from database (persist will auto-save to localStorage)
              await get().loadCart();
            }
          } catch (error) {
            console.error("Error adding to cart:", error);
          }
        } else {
          // Save to localStorage (via persist) and also save guest metadata
          if (existingItem) {
            set((state) => {
              const updatedItems = state.items.map((i) =>
                i.cartItemId === item.cartItemId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              );

              // Update guest cart metadata immediately
              const guestItems: GuestCartItem[] = updatedItems.map((item) => ({
                productId: item.id,
                productVariantId: item.productVariantId || null,
                quantity: item.quantity,
                selectedOptions: item.selectedOptions,
              }));
              saveGuestCart(guestItems);

              return { items: updatedItems };
            });
          } else {
            set((state) => {
              const updatedItems = [...state.items, item];

              // Update guest cart metadata immediately
              const guestItems: GuestCartItem[] = updatedItems.map((item) => ({
                productId: item.id,
                productVariantId: item.productVariantId || null,
                quantity: item.quantity,
                selectedOptions: item.selectedOptions,
              }));
              saveGuestCart(guestItems);

              return { items: updatedItems };
            });
          }
        }
      },

      // Remove item from cart
      removeItemFromCart: async (cartItemId: string) => {
        if (isAuthenticated()) {
          // Find the item to get database ID
          const item = get().items.find((i) => i.cartItemId === cartItemId);
          if (!item || !item.databaseId) {
            console.error("Cart item not found or missing database ID");
            return;
          }

          // Remove from database
          try {
            const token = getToken();
            const response = await fetch(`/api/cart?id=${item.databaseId}`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (response.ok) {
              // Reload cart from database (persist will auto-save to localStorage)
              await get().loadCart();
            }
          } catch (error) {
            console.error("Error removing from cart:", error);
          }
        } else {
          // Remove from localStorage (via persist)
          set((state) => {
            const updatedItems = state.items.filter(
              (item) => item.cartItemId !== cartItemId
            );
            // Remove from selectedItems if it was selected
            const updatedSelectedItems = state.selectedItems.filter(
              (id) => id !== cartItemId
            );

            // Update guest cart metadata immediately
            const guestItems: GuestCartItem[] = updatedItems.map((item) => ({
              productId: item.id,
              productVariantId: item.productVariantId || null,
              quantity: item.quantity,
              selectedOptions: item.selectedOptions,
            }));
            saveGuestCart(guestItems);

            return { items: updatedItems, selectedItems: updatedSelectedItems };
          });
        }
      },

      // Update cart item quantity
      updateCartItemQuantity: async (cartItemId: string, quantity: number) => {
        if (isAuthenticated()) {
          // Find the item to get database ID
          const item = get().items.find((i) => i.cartItemId === cartItemId);
          if (!item || !item.databaseId) {
            console.error("Cart item not found or missing database ID");
            return;
          }

          // Update in database
          try {
            const token = getToken();
            const response = await fetch("/api/cart", {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                cartItemId: item.databaseId, // Use database ID for API
                quantity,
              }),
            });

            if (response.ok) {
              // Reload cart from database (persist will auto-save to localStorage)
              await get().loadCart();
            }
          } catch (error) {
            console.error("Error updating cart:", error);
          }
        } else {
          // Update in localStorage (via persist)
          set((state) => {
            const updatedItems = state.items.map((item) =>
              item.cartItemId === cartItemId ? { ...item, quantity } : item
            );

            // Update guest cart metadata immediately
            const guestItems: GuestCartItem[] = updatedItems.map((item) => ({
              productId: item.id,
              productVariantId: item.productVariantId || null,
              quantity: item.quantity,
              selectedOptions: item.selectedOptions,
            }));
            saveGuestCart(guestItems);

            return { items: updatedItems };
          });
        }
      },

      // Remove all items from cart
      removeAllItemsFromCart: async () => {
        if (isAuthenticated()) {
          // Clear database cart
          try {
            const token = getToken();
            const response = await fetch("/api/cart?clearAll=true", {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (response.ok) {
              set({ items: [], selectedItems: [] }); // Clear selected items too
            }
          } catch (error) {
            console.error("Error clearing cart:", error);
          }
        } else {
          // Clear localStorage (via persist)
          set({ items: [], selectedItems: [] }); // Clear selected items too
          clearGuestCart();
        }
      },

      // Get total price (all items)
      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          return total + item.discountedPrice * item.quantity;
        }, 0);
      },

      // Get total price of selected items only
      getSelectedTotalPrice: () => {
        const { items, selectedItems } = get();
        return items
          .filter((item) => selectedItems.includes(item.cartItemId))
          .reduce((total, item) => {
            return total + item.discountedPrice * item.quantity;
          }, 0);
      },

      // Toggle item selection
      toggleItemSelection: (cartItemId: string) => {
        set((state) => {
          const isSelected = state.selectedItems.includes(cartItemId);
          if (isSelected) {
            return {
              selectedItems: state.selectedItems.filter(
                (id) => id !== cartItemId
              ),
            };
          } else {
            return {
              selectedItems: [...state.selectedItems, cartItemId],
            };
          }
        });
      },

      // Select all items
      selectAllItems: () => {
        set((state) => ({
          selectedItems: state.items.map((item) => item.cartItemId),
        }));
      },

      // Deselect all items
      deselectAllItems: () => {
        set({ selectedItems: [] });
      },

      // Check if item is selected
      isItemSelected: (cartItemId: string) => {
        return get().selectedItems.includes(cartItemId);
      },

      // Check if all items are selected
      isAllSelected: () => {
        const { items, selectedItems } = get();
        if (items.length === 0) return false;
        return items.every((item) => selectedItems.includes(item.cartItemId));
      },
    }),
    {
      name: CART_STORAGE_KEY, // localStorage key
      storage: createJSONStorage(() => localStorage),
      skipHydration: false, // We want to hydrate, but handle it carefully
      // Persist items and selectedItems (not loading states)
      partialize: (state) => ({
        items: state.items,
        selectedItems: state.selectedItems, // Persist selected items
        isInitialized: state.isInitialized,
      }),
      // On rehydrate (when loading from localStorage), mark as initialized
      onRehydrateStorage: () => (state) => {
        if (state) {
          // If we have cached items, mark as initialized immediately
          // This prevents flicker - items will show from cache first
          state.isInitialized = true;

          // Only sync/enrich if CartLoader hasn't done it yet
          // CartLoader will handle the sync/enrich, so we don't need to do it here
          // This prevents duplicate API calls and improves performance
        }
      },
    }
  )
);
