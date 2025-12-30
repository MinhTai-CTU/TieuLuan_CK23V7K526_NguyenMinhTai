"use client";
import React, { useMemo } from "react";
import {
  useIsInWishlist,
  useAddToWishlist,
  useRemoveFromWishlist,
} from "@/hooks/queries/useWishlist";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Product, ProductAttributes } from "@/types/product";

interface WishlistButtonProps {
  productId: string;
  product?: Product | null; // Optional product object to get default options
  productVariantId?: string | null;
  selectedOptions?: Record<string, string> | null;
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const WishlistButton: React.FC<WishlistButtonProps> = ({
  productId,
  product,
  productVariantId,
  selectedOptions,
  className = "",
  size = "md",
  showText = false,
}) => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Auto-select first options if product has attributes but no variant/options provided
  const { finalVariantId, finalSelectedOptions } = useMemo(() => {
    // If variant/options are already provided, use them
    if (productVariantId !== undefined || selectedOptions !== undefined) {
      return {
        finalVariantId: productVariantId || null,
        finalSelectedOptions: selectedOptions || null,
      };
    }

    // If no variant/options provided but product has attributes, select first options
    if (product?.attributes) {
      const attributes = product.attributes as ProductAttributes;
      const defaultOptions: Record<string, string> = {};

      // Get first color if available
      if (attributes.colors && attributes.colors.length > 0) {
        const firstColor = attributes.colors[0];
        if (typeof firstColor === "string") {
          defaultOptions.color = firstColor;
        } else if (firstColor.id) {
          defaultOptions.color = firstColor.id;
        }
      }

      // Get first storage if available
      if (attributes.storage && attributes.storage.length > 0) {
        defaultOptions.storage =
          attributes.storage[0].id || attributes.storage[0].title;
      }

      // Get first type if available
      if (attributes.type && attributes.type.length > 0) {
        defaultOptions.type = attributes.type[0].id || attributes.type[0].title;
      }

      // Get first sim if available
      if (attributes.sim && attributes.sim.length > 0) {
        defaultOptions.sim = attributes.sim[0].id || attributes.sim[0].title;
      }

      // Find matching variant if product has variants
      let matchedVariantId: string | null = null;
      if (product.hasVariants) {
        if (product.variants && product.variants.length > 0) {
          // Try to find matching variant
          const matchingVariant = product.variants.find((variant) => {
            const variantOptions = variant.options || {};
            return Object.keys(defaultOptions).every((key) => {
              const selectedValue = defaultOptions[key];
              const variantValue = variantOptions[key];
              return (
                variantValue === selectedValue ||
                String(variantValue) === String(selectedValue)
              );
            });
          });

          if (matchingVariant) {
            matchedVariantId = matchingVariant.id;
          } else {
            // If no exact match, use first variant
            matchedVariantId = product.variants[0].id;
          }
        }
        // If product has variants but variants array is not loaded,
        // we'll let the API find the variant based on selectedOptions
      }

      // Return default options if we found any
      // Even if variant is not found, we can still add with selectedOptions
      // and the API will find the matching variant
      if (Object.keys(defaultOptions).length > 0) {
        return {
          finalVariantId: matchedVariantId,
          finalSelectedOptions: defaultOptions,
        };
      }
    }

    // No attributes or no default options found, return null
    return {
      finalVariantId: null,
      finalSelectedOptions: null,
    };
  }, [product, productVariantId, selectedOptions]);

  const isInWishlist = useIsInWishlist(
    productId,
    finalVariantId,
    finalSelectedOptions
  );
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để thêm vào danh sách yêu thích");
      router.push("/signin");
      return;
    }

    // Prevent multiple clicks while processing
    if (addToWishlist.isPending || removeFromWishlist.isPending) {
      return;
    }

    const params = {
      productId,
      productVariantId: finalVariantId,
      selectedOptions: finalSelectedOptions,
    };

    try {
      if (isInWishlist) {
        await removeFromWishlist.mutateAsync(params);
      } else {
        await addToWishlist.mutateAsync(params);
      }
    } catch (error) {
      // Error is already handled by the mutation hooks
      console.error("Wishlist toggle error:", error);
    }
  };

  const sizeClasses = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-11 h-11",
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 20,
  };

  const isLoading = addToWishlist.isPending || removeFromWishlist.isPending;

  return (
    <button
      onClick={handleToggleWishlist}
      aria-label={
        isInWishlist
          ? "Xóa khỏi danh sách yêu thích"
          : "Thêm vào danh sách yêu thích"
      }
      disabled={isLoading}
      className={`flex items-center justify-center rounded-[5px] shadow-1 ease-out duration-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
        sizeClasses[size]
      } ${
        isInWishlist
          ? "text-red bg-white hover:bg-red hover:text-white"
          : "text-dark bg-white hover:text-blue"
      } ${isLoading ? "animate-pulse" : ""} ${className}`}
      title={
        isLoading
          ? "Đang xử lý..."
          : isInWishlist
            ? "Xóa khỏi danh sách yêu thích"
            : "Thêm vào danh sách yêu thích"
      }
    >
      <svg
        className="fill-current"
        width={iconSizes[size]}
        height={iconSizes[size]}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {isInWishlist ? (
          // Filled heart (in wishlist)
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M7.99992 2.97255C6.45855 1.5935 4.73256 1.40058 3.33376 2.03998C1.85639 2.71528 0.833252 4.28336 0.833252 6.0914C0.833252 7.86842 1.57358 9.22404 2.5444 10.3172C3.32183 11.1926 4.2734 11.9253 5.1138 12.5724C5.30431 12.7191 5.48911 12.8614 5.66486 12.9999C6.00636 13.2691 6.37295 13.5562 6.74447 13.7733C7.11582 13.9903 7.53965 14.1667 7.99992 14.1667C8.46018 14.1667 8.88401 13.9903 9.25537 13.7733C9.62689 13.5562 9.99348 13.2691 10.335 12.9999C10.5107 12.8614 10.6955 12.7191 10.886 12.5724C11.7264 11.9253 12.678 11.1926 13.4554 10.3172C14.4263 9.22404 15.1666 7.86842 15.1666 6.0914C15.1666 4.28336 14.1434 2.71528 12.6661 2.03998C11.2673 1.40058 9.54129 1.5935 7.99992 2.97255Z"
            fill="currentColor"
          />
        ) : (
          // Outline heart (not in wishlist)
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M3.74949 2.94946C2.6435 3.45502 1.83325 4.65749 1.83325 6.0914C1.83325 7.55633 2.43273 8.68549 3.29211 9.65318C4.0004 10.4507 4.85781 11.1118 5.694 11.7564C5.89261 11.9095 6.09002 12.0617 6.28395 12.2146C6.63464 12.491 6.94747 12.7337 7.24899 12.9099C7.55068 13.0862 7.79352 13.1667 7.99992 13.1667C8.20632 13.1667 8.44916 13.0862 8.75085 12.9099C9.05237 12.7337 9.3652 12.491 9.71589 12.2146C9.90982 12.0617 10.1072 11.9095 10.3058 11.7564C11.142 11.1118 11.9994 10.4507 12.7077 9.65318C13.5671 8.68549 14.1666 7.55633 14.1666 6.0914C14.1666 4.65749 13.3563 3.45502 12.2503 2.94946C11.1759 2.45832 9.73214 2.58839 8.36016 4.01382C8.2659 4.11175 8.13584 4.16709 7.99992 4.16709C7.864 4.16709 7.73393 4.11175 7.63967 4.01382C6.26769 2.58839 4.82396 2.45832 3.74949 2.94946ZM7.99992 2.97255C6.45855 1.5935 4.73256 1.40058 3.33376 2.03998C1.85639 2.71528 0.833252 4.28336 0.833252 6.0914C0.833252 7.86842 1.57358 9.22404 2.5444 10.3172C3.32183 11.1926 4.2734 11.9253 5.1138 12.5724C5.30431 12.7191 5.48911 12.8614 5.66486 12.9999C6.00636 13.2691 6.37295 13.5562 6.74447 13.7733C7.11582 13.9903 7.53965 14.1667 7.99992 14.1667C8.46018 14.1667 8.88401 13.9903 9.25537 13.7733C9.62689 13.5562 9.99348 13.2691 10.335 12.9999C10.5107 12.8614 10.6955 12.7191 10.886 12.5724C11.7264 11.9253 12.678 11.1926 13.4554 10.3172C14.4263 9.22404 15.1666 7.86842 15.1666 6.0914C15.1666 4.28336 14.1434 2.71528 12.6661 2.03998C11.2673 1.40058 9.54129 1.5935 7.99992 2.97255Z"
            fill="currentColor"
          />
        )}
      </svg>
      {showText && (
        <span className="ml-2 text-sm">
          {isInWishlist ? "Đã yêu thích" : "Yêu thích"}
        </span>
      )}
    </button>
  );
};

export default WishlistButton;
