import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuthHeader } from "@/lib/auth-storage";
import toast from "react-hot-toast";

export interface WishlistItem {
  id: string;
  productId: string;
  productVariantId?: string | null;
  selectedOptions?: Record<string, string> | null;
  title: string;
  slug: string;
  price: number;
  discountedPrice: number | null;
  stock: number;
  hasVariants: boolean;
  reviews: number;
  imgs: {
    thumbnails: string[];
    previews: string[];
  };
  category: {
    id: string;
    title: string;
    slug: string;
  } | null;
  createdAt: string;
}

export type AddToWishlistParams = {
  productId: string;
  productVariantId?: string | null;
  selectedOptions?: Record<string, string> | null;
};

export type RemoveFromWishlistParams = {
  productId: string;
  productVariantId?: string | null;
  selectedOptions?: Record<string, string> | null;
};

// Fetch wishlist
const fetchWishlist = async (): Promise<WishlistItem[]> => {
  const authHeader = getAuthHeader();
  if (!authHeader) {
    throw new Error("Vui lòng đăng nhập");
  }

  const response = await fetch("/api/wishlist", {
    headers: {
      Authorization: authHeader,
    },
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || "Không thể tải danh sách yêu thích");
  }

  return result.data;
};

// Add to wishlist
const addToWishlist = async (params: AddToWishlistParams): Promise<void> => {
  const authHeader = getAuthHeader();
  if (!authHeader) {
    throw new Error("Vui lòng đăng nhập");
  }

  const response = await fetch("/api/wishlist", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify({
      productId: params.productId,
      productVariantId: params.productVariantId || null,
      selectedOptions: params.selectedOptions || null,
    }),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || "Không thể thêm vào danh sách yêu thích");
  }
};

// Remove from wishlist
const removeFromWishlist = async (
  params: RemoveFromWishlistParams
): Promise<void> => {
  const authHeader = getAuthHeader();
  if (!authHeader) {
    throw new Error("Vui lòng đăng nhập");
  }

  // Build query params
  const queryParams = new URLSearchParams();
  if (params.productVariantId) {
    queryParams.append("productVariantId", params.productVariantId);
  }
  if (params.selectedOptions) {
    queryParams.append(
      "selectedOptions",
      JSON.stringify(params.selectedOptions)
    );
  }

  const url = `/api/wishlist/${params.productId}${
    queryParams.toString() ? `?${queryParams.toString()}` : ""
  }`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: authHeader,
    },
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || "Không thể xóa khỏi danh sách yêu thích");
  }
};

// Hook to get wishlist
export const useWishlist = () => {
  return useQuery({
    queryKey: ["wishlist"],
    queryFn: fetchWishlist,
    enabled: typeof window !== "undefined" && !!getAuthHeader(),
  });
};

// Hook to check if product is in wishlist
export const useIsInWishlist = (
  productId: string | undefined,
  productVariantId?: string | null,
  selectedOptions?: Record<string, string> | null
) => {
  const { data: wishlist } = useWishlist();

  if (!productId || !wishlist) return false;

  // Normalize options for comparison
  const normalizeOptions = (opts: any): string => {
    if (!opts || typeof opts !== "object") return "";
    return JSON.stringify(
      Object.entries(opts)
        .sort(([a], [b]) => a.localeCompare(b))
        .reduce(
          (acc, [key, value]) => {
            acc[key] = String(value || "").trim();
            return acc;
          },
          {} as Record<string, string>
        )
    );
  };

  const normalizedTargetOptions = normalizeOptions(selectedOptions);

  return wishlist.some((item) => {
    // Match productId
    if (item.productId !== productId) return false;

    // If variantId is explicitly provided (not undefined), match it
    if (productVariantId !== undefined) {
      if (item.productVariantId !== productVariantId) return false;
    } else {
      // If variantId is not provided (undefined), check for base product (no variant)
      // This handles the case from New Arrivals/Best Sellers where only productId is passed
      if (item.productVariantId !== null) return false;
    }

    // If selectedOptions is explicitly provided (not undefined), match it
    if (selectedOptions !== undefined) {
      const normalizedItemOptions = normalizeOptions(item.selectedOptions);
      if (normalizedItemOptions !== normalizedTargetOptions) return false;
    } else {
      // If selectedOptions is not provided (undefined), check for base product (no options)
      // This handles the case from New Arrivals/Best Sellers where no options are selected
      const normalizedItemOptions = normalizeOptions(item.selectedOptions);
      if (normalizedItemOptions !== "") return false;
    }

    return true;
  });
};

// Hook to add to wishlist
export const useAddToWishlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addToWishlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success("Đã thêm vào danh sách yêu thích");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Không thể thêm vào danh sách yêu thích");
    },
  });
};

// Hook to remove from wishlist
export const useRemoveFromWishlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeFromWishlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success("Đã xóa khỏi danh sách yêu thích");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Không thể xóa khỏi danh sách yêu thích");
    },
  });
};
