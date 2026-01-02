"use client";
import React, { use, useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Breadcrumb from "../Common/Breadcrumb";
import Image from "next/image";
import RecentlyViewdItems from "./RecentlyViewd";
import { usePreviewSlider } from "@/app/context/PreviewSliderContext";
import { useProductDetailsStore } from "@/stores/product-details-store";
import { useProduct } from "@/hooks/queries/useProduct";
import { useCartStore, generateCartItemId } from "@/stores/cart-store";
import { formatPrice } from "@/utils/formatPrice";
import toast from "react-hot-toast";
import WishlistButton from "../Common/WishlistButton";
import ReviewsSection from "./ReviewsSection";
import { addToRecentlyViewed } from "@/utils/recentlyViewed";

const ShopDetails = () => {
  const searchParams = useSearchParams();
  const productId = searchParams.get("id");
  const [activeColor, setActiveColor] = useState<string>("");
  const { openPreviewModal } = usePreviewSlider();
  const [previewImg, setPreviewImg] = useState(0);
  const [currentImages, setCurrentImages] = useState<{
    previews: string[];
    thumbnails: string[];
  } | null>(null);

  const [storage, setStorage] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [sim, setSim] = useState<string>("");
  const [quantity, setQuantity] = useState(1);

  const [activeTab, setActiveTab] = useState("tabOne");

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const tabs = [
    {
      id: "tabOne",
      title: "Mô tả",
    },
    {
      id: "tabTwo",
      title: "Thông tin bổ sung",
    },
    {
      id: "tabThree",
      title: "Đánh giá",
    },
  ];

  // Fetch product from API if productId is provided
  const { data: apiProduct, isLoading, isError } = useProduct(productId);
  console.log("apiProduct", apiProduct);

  // Fallback to Zustand/localStorage for backward compatibility
  const productFromStorage = useProductDetailsStore((state) => state.value);
  const [fallbackProduct, setFallbackProduct] = useState<any>(null);

  // Load from localStorage only on client-side after mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const alreadyExist = localStorage.getItem("productDetails");
      if (alreadyExist) {
        try {
          setFallbackProduct(JSON.parse(alreadyExist));
        } catch (e) {
          console.error("Error parsing productDetails from localStorage:", e);
        }
      } else if (productFromStorage && productFromStorage.id) {
        setFallbackProduct(productFromStorage);
      }
    }
  }, [productFromStorage]);

  // Use API product if available, otherwise fallback to Zustand/localStorage
  const product = useMemo(() => {
    if (apiProduct) {
      return apiProduct;
    }
    return fallbackProduct;
  }, [apiProduct, fallbackProduct]);

  // Memoize handleReviewsUpdate to prevent infinite loop
  const handleReviewsUpdate = useCallback((updatedReviews: any[]) => {
    setReviews(updatedReviews);
  }, []);

  // Save product to recently viewed
  useEffect(() => {
    if (product?.id && product?.title) {
      addToRecentlyViewed(product);
    }
  }, [product?.id, product?.title]);

  // Fetch reviews for product
  useEffect(() => {
    const fetchReviews = async () => {
      if (!product?.id) return;

      setReviewsLoading(true);
      try {
        const response = await fetch(`/api/products/${product.id}/reviews`);
        const result = await response.json();
        if (result.success) {
          setReviews(result.data);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, [product?.id]);

  // Calculate rating stats
  const ratingStats = useMemo(() => {
    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        hasReviews: false,
      };
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    return {
      averageRating,
      totalReviews: reviews.length,
      hasReviews: true,
    };
  }, [reviews]);

  useEffect(() => {
    if (product && product.id) {
      localStorage.setItem("productDetails", JSON.stringify(product));
      // Initialize images from product
      // Priority: product.images (from API) > product.imgs (legacy)
      if (
        product.images &&
        Array.isArray(product.images) &&
        product.images.length > 0
      ) {
        console.log("📸 Processing product.images:", product.images);
        // Separate THUMBNAIL and PREVIEW images
        const thumbnailImages = product.images.filter(
          (img: any) => img.type === "THUMBNAIL"
        );
        const previewImages = product.images.filter(
          (img: any) => img.type === "PREVIEW"
        );

        console.log("🖼️ Thumbnail images:", thumbnailImages);
        console.log("🖼️ Preview images:", previewImages);

        // Combine: THUMBNAIL first, then PREVIEW
        // Ensure THUMBNAIL is always included in thumbnails gallery
        const allImageUrls = [
          ...thumbnailImages.map((img: any) => img.url),
          ...previewImages.map((img: any) => img.url),
        ];

        console.log("✅ All image URLs (THUMBNAIL + PREVIEW):", allImageUrls);

        setCurrentImages({
          previews: allImageUrls,
          thumbnails: allImageUrls, // Include both THUMBNAIL and PREVIEW in thumbnails
        });
        // Reset preview to first image (thumbnail)
        setPreviewImg(0);
      } else if (product.imgs) {
        console.log("📸 Using legacy product.imgs:", product.imgs);
        // Handle legacy format: combine thumbnails and previews
        const legacyThumbnails = product.imgs.thumbnails || [];
        const legacyPreviews = product.imgs.previews || [];

        // Combine: thumbnails first, then previews
        const allLegacyImages = [...legacyThumbnails, ...legacyPreviews];

        console.log("✅ Combined legacy images:", allLegacyImages);

        setCurrentImages({
          previews: allLegacyImages,
          thumbnails: allLegacyImages, // Include both thumbnails and previews
        });
        setPreviewImg(0);
      }
    }
  }, [product]);

  // Extract attributes from product
  const attributes = useMemo(
    () => product?.attributes || null,
    [product?.attributes]
  );
  // Normalize colors - handle both string array (legacy) and ProductColor object array
  const colors = useMemo(() => {
    const colorsData = attributes?.colors || [];
    return colorsData.map((color: any) => {
      if (typeof color === "string") {
        // Legacy string format - return as is for backward compatibility
        return color;
      }
      // ProductColor object format: { id, label, hex, price? }
      return color.id || "";
    });
  }, [attributes?.colors]);

  // Get color object by id or value (for backward compatibility)
  const getColorObject = useCallback(
    (colorValue: string) => {
      const colorsData = attributes?.colors || [];
      return colorsData.find(
        (c: any) =>
          (typeof c === "object" &&
            (c.id === colorValue || c.label === colorValue)) ||
          (typeof c === "string" && c === colorValue)
      );
    },
    [attributes?.colors]
  );

  // Get color price if it's an object
  const getColorPrice = useCallback(
    (colorValue: string): number => {
      const colorObj = getColorObject(colorValue);
      return typeof colorObj === "object" && colorObj?.price
        ? colorObj.price
        : 0;
    },
    [getColorObject]
  );

  // Get color hex for display
  const getColorHex = useCallback(
    (colorValue: string): string => {
      const colorObj = getColorObject(colorValue);
      if (typeof colorObj === "object" && colorObj?.hex) {
        return colorObj.hex;
      }
      // Fallback for legacy string colors
      return "#808080"; // Default gray
    },
    [getColorObject]
  );

  // Get color label for display
  const getColorLabel = useCallback(
    (colorValue: string): string => {
      const colorObj = getColorObject(colorValue);
      if (typeof colorObj === "object" && colorObj?.label) {
        return colorObj.label;
      }
      // Fallback for legacy string colors
      return typeof colorObj === "string" ? colorObj : colorValue;
    },
    [getColorObject]
  );

  const storages = useMemo(
    () => attributes?.storage || [],
    [attributes?.storage]
  );
  const types = useMemo(() => attributes?.type || [], [attributes?.type]);
  const sims = useMemo(() => attributes?.sim || [], [attributes?.sim]);

  // Find variant based on selected options
  const findVariantByOptions = useCallback(() => {
    if (!product?.variants || product.variants.length === 0) {
      return null;
    }

    // Build options object to match variant
    const selectedOptions: Record<string, any> = {};
    if (activeColor) {
      // Get color title/id from attributes
      const colorsData = attributes?.colors || [];
      const colorObj = colorsData.find(
        (c: any) =>
          (typeof c === "object" &&
            (c.id === activeColor || c.title === activeColor)) ||
          (typeof c === "string" && c === activeColor)
      );
      const colorValue =
        typeof colorObj === "object"
          ? colorObj.title || colorObj.id
          : activeColor;
      selectedOptions.color = colorValue;
    }
    if (storage) {
      const storageOption = storages.find((s) => s.id === storage);
      if (storageOption) {
        // Try both title and id for matching
        selectedOptions.storage = storageOption.title || storageOption.id;
      }
    }
    if (type) {
      const typeOption = types.find((t) => t.id === type);
      if (typeOption) {
        selectedOptions.type = typeOption.title || typeOption.id;
      }
    }
    if (sim) {
      const simOption = sims.find((s) => s.id === sim);
      if (simOption) {
        selectedOptions.sim = simOption.title || simOption.id;
      }
    }

    // Find matching variant - only compare selected options, not all variant options
    const matchingVariant = product.variants.find((variant) => {
      const variantOptions = variant.options || {};
      // Check if all selected options match variant options
      return Object.keys(selectedOptions).every((key) => {
        const selectedValue = selectedOptions[key];
        const variantValue = variantOptions[key];
        // Normalize comparison - handle both string and object values
        return (
          variantValue === selectedValue ||
          String(variantValue) === String(selectedValue) ||
          (variantValue && variantValue.toString() === selectedValue.toString())
        );
      });
    });

    // If no exact match found, try to find variant with at least one matching option
    // This handles cases where variant structure might differ slightly
    if (!matchingVariant && Object.keys(selectedOptions).length > 0) {
      const partialMatch = product.variants.find((variant) => {
        const variantOptions = variant.options || {};
        return Object.keys(selectedOptions).some((key) => {
          const selectedValue = selectedOptions[key];
          const variantValue = variantOptions[key];
          return (
            variantValue === selectedValue ||
            String(variantValue) === String(selectedValue)
          );
        });
      });
      if (partialMatch) {
        return partialMatch;
      }
    }

    // Fallback to first variant if no match found (to prevent showing 0 price)
    return matchingVariant || product.variants[0] || null;
  }, [
    product,
    activeColor,
    storage,
    type,
    sim,
    attributes,
    storages,
    types,
    sims,
  ]);

  // Update images when color or options change
  useEffect(() => {
    if (!product) return;

    const variant = findVariantByOptions();

    // Priority 1: Use variant image if available
    if (variant && variant.image) {
      const variantImage = variant.image;
      setCurrentImages({
        previews: [variantImage],
        thumbnails: [variantImage],
      });
      setPreviewImg(0);
      console.log("🖼️ Variant image loaded:", {
        variantId: variant.id,
        color: activeColor,
        image: variantImage,
        options: variant.options,
      });
      return;
    }

    // Priority 2: If variant exists but no image, try to find image by color
    // Note: This requires product images to be organized by color in the future
    // For now, we'll use product images as fallback
    if (variant && !variant.image) {
      // Convert product.images (from API) or product.imgs (legacy) to currentImages format
      let productImages: string[] = [];
      if (
        product.images &&
        Array.isArray(product.images) &&
        product.images.length > 0
      ) {
        // Separate THUMBNAIL and PREVIEW, then combine
        const thumbnailImages = product.images.filter(
          (img: any) => img.type === "THUMBNAIL"
        );
        const previewImages = product.images.filter(
          (img: any) => img.type === "PREVIEW"
        );
        productImages = [
          ...thumbnailImages.map((img: any) => img.url),
          ...previewImages.map((img: any) => img.url),
        ];
      } else if (product.imgs) {
        // Handle legacy format: combine thumbnails and previews
        const legacyThumbnails = product.imgs.thumbnails || [];
        const legacyPreviews = product.imgs.previews || [];
        productImages = [...legacyThumbnails, ...legacyPreviews];
      }

      if (productImages.length > 0) {
        setCurrentImages({
          previews: productImages,
          thumbnails: productImages,
        });
        setPreviewImg(0);
        console.log("📦 Using product images (variant has no image):", {
          variantId: variant.id,
          color: activeColor,
          options: variant.options,
        });
        return;
      }
    }

    // Priority 3: Fallback to product images
    let productImages: string[] = [];
    if (
      product.images &&
      Array.isArray(product.images) &&
      product.images.length > 0
    ) {
      // Separate THUMBNAIL and PREVIEW, then combine
      const thumbnailImages = product.images.filter(
        (img: any) => img.type === "THUMBNAIL"
      );
      const previewImages = product.images.filter(
        (img: any) => img.type === "PREVIEW"
      );
      productImages = [
        ...thumbnailImages.map((img: any) => img.url),
        ...previewImages.map((img: any) => img.url),
      ];
    } else if (product.imgs) {
      // Handle legacy format: combine thumbnails and previews
      const legacyThumbnails = product.imgs.thumbnails || [];
      const legacyPreviews = product.imgs.previews || [];
      productImages = [...legacyThumbnails, ...legacyPreviews];
    }

    if (productImages.length > 0) {
      setCurrentImages({
        previews: productImages,
        thumbnails: productImages,
      });
      setPreviewImg(0);
      console.log("📦 Product images loaded (no variant match):", {
        color: activeColor,
        storage,
        type,
        sim,
      });
    }
  }, [activeColor, storage, type, sim, product, findVariantByOptions]);

  // Calculate final price based on base price + selected option prices
  // OR use variant price if product has variants
  const calculateFinalPrice = useCallback(() => {
    if (!product)
      return {
        basePrice: 0,
        finalPrice: 0,
        additionalPrice: 0,
        baseDiscountedPrice: 0,
        finalDiscountedPrice: 0,
      };

    // If product has variants, use variant price + additional option prices
    if (
      product.hasVariants &&
      product.variants &&
      product.variants.length > 0
    ) {
      const variant = findVariantByOptions();
      if (variant) {
        // Calculate additional price from options (storage, type, sim) that are NOT already in variant
        // Variant price already includes prices for options that are part of the variant
        // So we should NOT add their prices again
        let additionalPrice = 0;
        const variantOptions = variant.options || {};

        // Helper function to check if an option is already in variant
        const isOptionInVariant = (
          optionKey: string,
          optionValue: any
        ): boolean => {
          const variantValue = variantOptions[optionKey];
          if (!variantValue) return false;

          // Compare both as strings to handle id vs title matching
          const variantStr = String(variantValue).trim();
          const optionStr = String(optionValue).trim();

          return variantStr === optionStr;
        };

        // Add storage price ONLY if selected and NOT already in variant
        if (storage) {
          const storageOption = storages.find((s) => s.id === storage);
          if (storageOption?.price) {
            // Check if storage is already in variant options (compare both id and title)
            const storageInVariant =
              isOptionInVariant("storage", storageOption.id) ||
              isOptionInVariant("storage", storageOption.title);

            if (!storageInVariant) {
              additionalPrice += storageOption.price;
            }
          }
        }

        // Add type price ONLY if selected and NOT already in variant
        if (type) {
          const typeOption = types.find((t) => t.id === type);
          if (typeOption?.price) {
            // Check if type is already in variant options (compare both id and title)
            const typeInVariant =
              isOptionInVariant("type", typeOption.id) ||
              isOptionInVariant("type", typeOption.title);

            if (!typeInVariant) {
              additionalPrice += typeOption.price;
            }
          }
        }

        // Add sim price ONLY if selected and NOT already in variant
        if (sim) {
          const simOption = sims.find((s) => s.id === sim);
          if (simOption?.price) {
            // Check if sim is already in variant options (compare both id and title)
            const simInVariant =
              isOptionInVariant("sim", simOption.id) ||
              isOptionInVariant("sim", simOption.title);

            if (!simInVariant) {
              additionalPrice += simOption.price;
            }
          }
        }

        const basePrice = variant.price || 0;
        const baseDiscountedPrice =
          variant.discountedPrice ?? variant.price ?? 0;
        const finalPrice = basePrice + additionalPrice;
        const finalDiscountedPrice = baseDiscountedPrice + additionalPrice;

        return {
          basePrice,
          finalPrice,
          baseDiscountedPrice,
          finalDiscountedPrice,
          additionalPrice,
        };
      }
      // Fallback to first variant if no match found (to prevent showing 0 price)
      const firstVariant = product.variants[0];
      if (firstVariant) {
        return {
          basePrice: firstVariant.price || 0,
          finalPrice: firstVariant.price || 0,
          baseDiscountedPrice:
            firstVariant.discountedPrice ?? firstVariant.price ?? 0,
          finalDiscountedPrice:
            firstVariant.discountedPrice ?? firstVariant.price ?? 0,
          additionalPrice: 0,
        };
      }
      // Last resort fallback
      return {
        basePrice: 0,
        finalPrice: 0,
        additionalPrice: 0,
        baseDiscountedPrice: 0,
        finalDiscountedPrice: 0,
      };
    }

    // For simple products (no variants), calculate from base price + option prices
    let additionalPrice = 0;

    // Add color price if selected
    if (activeColor) {
      additionalPrice += getColorPrice(activeColor);
    }

    // Add storage price if selected
    if (storage) {
      const storageOption = storages.find((s) => s.id === storage);
      if (storageOption?.price) {
        additionalPrice += storageOption.price;
      }
    }

    // Add type price if selected
    if (type) {
      const typeOption = types.find((t) => t.id === type);
      if (typeOption?.price) {
        additionalPrice += typeOption.price;
      }
    }

    // Add sim price if selected
    if (sim) {
      const simOption = sims.find((s) => s.id === sim);
      if (simOption?.price) {
        additionalPrice += simOption.price;
      }
    }

    const basePrice = product.price || 0;
    const finalPrice = basePrice + additionalPrice;
    const baseDiscountedPrice = product.discountedPrice ?? product.price ?? 0;
    const finalDiscountedPrice = baseDiscountedPrice + additionalPrice;

    return {
      basePrice,
      finalPrice,
      baseDiscountedPrice,
      finalDiscountedPrice,
      additionalPrice,
    };
  }, [
    product,
    activeColor,
    storage,
    type,
    sim,
    storages,
    types,
    sims,
    getColorPrice,
    findVariantByOptions,
  ]);

  const priceCalculation = useMemo(
    () => calculateFinalPrice(),
    [calculateFinalPrice]
  );

  // Initialize state with first available option
  useEffect(() => {
    if (colors.length > 0 && !activeColor) {
      const firstColor = colors[0];
      // colors array already contains normalized id strings, so use directly
      setActiveColor(String(firstColor));
    }
    if (storages.length > 0 && !storage) {
      setStorage(storages[0].id);
    }
    if (types.length > 0 && !type) {
      setType(types[0].id);
    }
    if (sims.length > 0 && !sim) {
      setSim(sims[0].id);
    }
  }, [colors, storages, types, sims, activeColor, storage, type, sim]);

  // Update product details store and open preview slider
  const updateproductDetails = useProductDetailsStore(
    (state) => state.updateproductDetails
  );
  const addItemToCart = useCartStore((state) => state.addItemToCart);

  const handlePreviewSlider = () => {
    if (product && product.id) {
      updateproductDetails(product);
    }
    openPreviewModal();
  };

  // Handle add to cart with selected options
  const handleAddToCart = () => {
    if (!product || !product.id) {
      toast.error("Thiếu thông tin sản phẩm");
      return;
    }

    // Normalize color value to string (handle both string and object)
    let normalizedColor = "";
    if (activeColor) {
      if (typeof activeColor === "object" && activeColor !== null) {
        normalizedColor = String(
          (activeColor as any).id || (activeColor as any).title || activeColor
        );
      } else {
        normalizedColor = String(activeColor);
      }
    }

    // Collect selected options with their IDs for cartItemId generation
    // IMPORTANT: Use normalized string values to ensure consistent cartItemId generation
    const selectedOptionsForId: Record<string, string> = {};
    if (normalizedColor) selectedOptionsForId.color = normalizedColor;
    if (storage) selectedOptionsForId.storage = String(storage);
    if (type) selectedOptionsForId.type = String(type);
    if (sim) selectedOptionsForId.sim = String(sim);

    // Collect selected options with labels (titles) for display
    const selectedOptions: Record<string, string> = {};
    if (normalizedColor) {
      // For display, use getColorLabel to get the label
      selectedOptions.color = getColorLabel(normalizedColor);
    }
    if (storage) {
      const storageOption = storages.find((s) => s.id === storage);
      selectedOptions.storage = storageOption?.title || storage;
    }
    if (type) {
      const typeOption = types.find((t) => t.id === type);
      selectedOptions.type = typeOption?.title || type;
    }
    if (sim) {
      const simOption = sims.find((s) => s.id === sim);
      selectedOptions.sim = simOption?.title || sim;
    }

    // Calculate final price with selected options
    const finalPrice = priceCalculation.finalPrice;
    const finalDiscountedPrice = priceCalculation.finalDiscountedPrice;

    // Find variant if product has variants
    const variant = product.hasVariants ? findVariantByOptions() : null;

    // Generate unique cart item ID
    // For products with variants: use productId + variantId
    // For products with options but no variant: use productId + options
    // For products without options/variant: use productId only
    const cartItemId = generateCartItemId(
      product.id,
      selectedOptionsForId,
      variant?.id || null
    );

    // Add to cart
    addItemToCart({
      id: product.id,
      cartItemId,
      title: product.title,
      price: finalPrice,
      discountedPrice: finalDiscountedPrice,
      quantity,
      productVariantId: variant?.id || null,
      imgs:
        product.images &&
        Array.isArray(product.images) &&
        product.images.length > 0
          ? (() => {
              // Separate THUMBNAIL and PREVIEW, then combine
              const thumbnailImages = product.images.filter(
                (img: any) => img.type === "THUMBNAIL"
              );
              const previewImages = product.images.filter(
                (img: any) => img.type === "PREVIEW"
              );
              const imageUrls = [
                ...thumbnailImages.map((img: any) => img.url),
                ...previewImages.map((img: any) => img.url),
              ];
              return {
                previews: imageUrls,
                thumbnails: imageUrls,
              };
            })()
          : product.imgs,
      selectedOptions:
        Object.keys(selectedOptions).length > 0 ? selectedOptions : undefined,
    });

    toast.success("Đã thêm sản phẩm vào giỏ hàng!");
  };

  return (
    <>
      <Breadcrumb title={"Chi tiết sản phẩm"} pages={["shop details"]} />

      {isLoading ? (
        <section className="overflow-hidden relative pb-20 pt-5 lg:pt-20 xl:pt-28">
          <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
            <div className="flex flex-col lg:flex-row gap-7.5 xl:gap-17.5">
              <div className="lg:max-w-[570px] w-full">
                <div className="lg:min-h-[512px] rounded-lg bg-gray-2 animate-pulse" />
              </div>
              <div className="max-w-[539px] w-full">
                <div className="h-8 bg-gray-2 rounded animate-pulse mb-4" />
                <div className="h-6 bg-gray-2 rounded animate-pulse mb-4" />
                <div className="h-24 bg-gray-2 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </section>
      ) : isError && !product?.id ? (
        <section className="overflow-hidden relative pb-20 pt-5 lg:pt-20 xl:pt-28">
          <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
            <div className="text-center py-20">
              <p className="text-red-500 mb-4">
                Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.
              </p>
              {productId && (
                <p className="text-sm text-gray-500">Product ID: {productId}</p>
              )}
            </div>
          </div>
        </section>
      ) : !product || product.title === "" ? (
        <section className="overflow-hidden relative pb-20 pt-5 lg:pt-20 xl:pt-28">
          <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
            <div className="text-center py-20">
              <p className="text-gray-500">
                Vui lòng chọn sản phẩm để xem chi tiết
              </p>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="overflow-hidden relative pb-20 pt-5 lg:pt-20 xl:pt-28">
            <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
              <div className="flex flex-col lg:flex-row gap-7.5 xl:gap-17.5">
                <div className="lg:max-w-[570px] w-full">
                  <div className="lg:min-h-[512px] rounded-lg shadow-1 bg-gray-2 p-4 sm:p-7.5 relative flex items-center justify-center">
                    <div>
                      <button
                        onClick={handlePreviewSlider}
                        aria-label="button for zoom"
                        className="gallery__Image w-11 h-11 rounded-[5px] bg-gray-1 shadow-1 flex items-center justify-center ease-out duration-200 text-dark hover:text-blue absolute top-4 lg:top-6 right-4 lg:right-6 z-50"
                      >
                        <svg
                          className="fill-current"
                          width="22"
                          height="22"
                          viewBox="0 0 22 22"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M9.11493 1.14581L9.16665 1.14581C9.54634 1.14581 9.85415 1.45362 9.85415 1.83331C9.85415 2.21301 9.54634 2.52081 9.16665 2.52081C7.41873 2.52081 6.17695 2.52227 5.23492 2.64893C4.31268 2.77292 3.78133 3.00545 3.39339 3.39339C3.00545 3.78133 2.77292 4.31268 2.64893 5.23492C2.52227 6.17695 2.52081 7.41873 2.52081 9.16665C2.52081 9.54634 2.21301 9.85415 1.83331 9.85415C1.45362 9.85415 1.14581 9.54634 1.14581 9.16665L1.14581 9.11493C1.1458 7.43032 1.14579 6.09599 1.28619 5.05171C1.43068 3.97699 1.73512 3.10712 2.42112 2.42112C3.10712 1.73512 3.97699 1.43068 5.05171 1.28619C6.09599 1.14579 7.43032 1.1458 9.11493 1.14581ZM16.765 2.64893C15.823 2.52227 14.5812 2.52081 12.8333 2.52081C12.4536 2.52081 12.1458 2.21301 12.1458 1.83331C12.1458 1.45362 12.4536 1.14581 12.8333 1.14581L12.885 1.14581C14.5696 1.1458 15.904 1.14579 16.9483 1.28619C18.023 1.43068 18.8928 1.73512 19.5788 2.42112C20.2648 3.10712 20.5693 3.97699 20.7138 5.05171C20.8542 6.09599 20.8542 7.43032 20.8541 9.11494V9.16665C20.8541 9.54634 20.5463 9.85415 20.1666 9.85415C19.787 9.85415 19.4791 9.54634 19.4791 9.16665C19.4791 7.41873 19.4777 6.17695 19.351 5.23492C19.227 4.31268 18.9945 3.78133 18.6066 3.39339C18.2186 3.00545 17.6873 2.77292 16.765 2.64893ZM1.83331 12.1458C2.21301 12.1458 2.52081 12.4536 2.52081 12.8333C2.52081 14.5812 2.52227 15.823 2.64893 16.765C2.77292 17.6873 3.00545 18.2186 3.39339 18.6066C3.78133 18.9945 4.31268 19.227 5.23492 19.351C6.17695 19.4777 7.41873 19.4791 9.16665 19.4791C9.54634 19.4791 9.85415 19.787 9.85415 20.1666C9.85415 20.5463 9.54634 20.8541 9.16665 20.8541H9.11494C7.43032 20.8542 6.09599 20.8542 5.05171 20.7138C3.97699 20.5693 3.10712 20.2648 2.42112 19.5788C1.73512 18.8928 1.43068 18.023 1.28619 16.9483C1.14579 15.904 1.1458 14.5696 1.14581 12.885L1.14581 12.8333C1.14581 12.4536 1.45362 12.1458 1.83331 12.1458ZM20.1666 12.1458C20.5463 12.1458 20.8541 12.4536 20.8541 12.8333V12.885C20.8542 14.5696 20.8542 15.904 20.7138 16.9483C20.5693 18.023 20.2648 18.8928 19.5788 19.5788C18.8928 20.2648 18.023 20.5693 16.9483 20.7138C15.904 20.8542 14.5696 20.8542 12.885 20.8541H12.8333C12.4536 20.8541 12.1458 20.5463 12.1458 20.1666C12.1458 19.787 12.4536 19.4791 12.8333 19.4791C14.5812 19.4791 15.823 19.4777 16.765 19.351C17.6873 19.227 18.2186 18.9945 18.6066 18.6066C18.9945 18.2186 19.227 17.6873 19.351 16.765C19.4777 15.823 19.4791 14.5812 19.4791 12.8333C19.4791 12.4536 19.787 12.1458 20.1666 12.1458Z"
                            fill=""
                          />
                        </svg>
                      </button>

                      {currentImages?.previews?.[previewImg] && (
                        <Image
                          src={currentImages.previews[previewImg]}
                          alt="products-details"
                          width={400}
                          height={400}
                        />
                      )}
                    </div>
                  </div>

                  {/* ?  &apos;border-blue &apos; :  &apos;border-transparent&apos; */}
                  <div className="flex flex-wrap sm:flex-nowrap gap-4.5 mt-6">
                    {currentImages?.thumbnails.map((item, key) => (
                      <button
                        onClick={() => setPreviewImg(key)}
                        key={key}
                        className={`flex items-center justify-center w-15 sm:w-25 h-15 sm:h-25 overflow-hidden rounded-lg bg-gray-2 shadow-1 ease-out duration-200 border-2 hover:border-blue ${
                          key === previewImg
                            ? "border-blue"
                            : "border-transparent"
                        }`}
                      >
                        <Image
                          width={50}
                          height={50}
                          src={item}
                          alt="thumbnail"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* <!-- product content --> */}
                <div className="max-w-[539px] w-full">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-xl sm:text-2xl xl:text-custom-3 text-dark">
                      {product.title}
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-5.5 mb-4.5">
                    <div className="flex items-center gap-2.5">
                      {/* <!-- stars --> */}
                      {ratingStats.hasReviews ? (
                        <>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`${
                                  star <= Math.round(ratingStats.averageRating)
                                    ? "fill-[#FFA645]"
                                    : "fill-gray-5"
                                }`}
                                width="18"
                                height="18"
                                viewBox="0 0 18 18"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <g clipPath="url(#clip0_375_9172)">
                                  <path
                                    d="M16.7906 6.72187L11.7 5.93438L9.39377 1.09688C9.22502 0.759375 8.77502 0.759375 8.60627 1.09688L6.30002 5.9625L1.23752 6.72187C0.871891 6.77812 0.731266 7.25625 1.01252 7.50938L4.69689 11.3063L3.82502 16.6219C3.76877 16.9875 4.13439 17.2969 4.47189 17.0719L9.05627 14.5687L13.6125 17.0719C13.9219 17.2406 14.3156 16.9594 14.2313 16.6219L13.3594 11.3063L17.0438 7.50938C17.2688 7.25625 17.1563 6.77812 16.7906 6.72187Z"
                                    fill=""
                                  />
                                </g>
                                <defs>
                                  <clipPath id="clip0_375_9172">
                                    <rect width="18" height="18" fill="white" />
                                  </clipPath>
                                </defs>
                              </svg>
                            ))}
                          </div>
                          <span>
                            {ratingStats.totalReviews} đánh giá của khách hàng
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-5">Chưa có đánh giá</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <g clipPath="url(#clip0_375_9221)">
                          <path
                            d="M10 0.5625C4.78125 0.5625 0.5625 4.78125 0.5625 10C0.5625 15.2188 4.78125 19.4688 10 19.4688C15.2188 19.4688 19.4688 15.2188 19.4688 10C19.4688 4.78125 15.2188 0.5625 10 0.5625ZM10 18.0625C5.5625 18.0625 1.96875 14.4375 1.96875 10C1.96875 5.5625 5.5625 1.96875 10 1.96875C14.4375 1.96875 18.0625 5.59375 18.0625 10.0312C18.0625 14.4375 14.4375 18.0625 10 18.0625Z"
                            fill="#22AD5C"
                          />
                          <path
                            d="M12.6875 7.09374L8.9688 10.7187L7.2813 9.06249C7.00005 8.78124 6.56255 8.81249 6.2813 9.06249C6.00005 9.34374 6.0313 9.78124 6.2813 10.0625L8.2813 12C8.4688 12.1875 8.7188 12.2812 8.9688 12.2812C9.2188 12.2812 9.4688 12.1875 9.6563 12L13.6875 8.12499C13.9688 7.84374 13.9688 7.40624 13.6875 7.12499C13.4063 6.84374 12.9688 6.84374 12.6875 7.09374Z"
                            fill="#22AD5C"
                          />
                        </g>
                        <defs>
                          <clipPath id="clip0_375_9221">
                            <rect width="20" height="20" fill="white" />
                          </clipPath>
                        </defs>
                      </svg>

                      <span className="text-green"> Còn hàng. </span>
                    </div>
                  </div>

                  <h3 className="font-medium text-custom-1 mb-4.5">
                    <span className="text-sm sm:text-base text-dark">
                      Giá: {formatPrice(priceCalculation.finalDiscountedPrice)}
                    </span>
                    {priceCalculation.finalDiscountedPrice <
                      priceCalculation.finalPrice && (
                      <span className="line-through ml-2 text-gray-500">
                        {formatPrice(priceCalculation.finalPrice)}
                      </span>
                    )}
                    {priceCalculation.additionalPrice > 0 && (
                      <span className="text-xs text-gray-500 ml-2">
                        (Giá gốc: {formatPrice(priceCalculation.basePrice)} +
                        Tùy chọn:{" "}
                        {formatPrice(priceCalculation.additionalPrice)})
                      </span>
                    )}
                  </h3>

                  <ul className="flex flex-col gap-2">
                    <li className="flex items-center gap-2.5">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M13.3589 8.35863C13.603 8.11455 13.603 7.71882 13.3589 7.47475C13.1149 7.23067 12.7191 7.23067 12.4751 7.47475L8.75033 11.1995L7.5256 9.97474C7.28152 9.73067 6.8858 9.73067 6.64172 9.97474C6.39764 10.2188 6.39764 10.6146 6.64172 10.8586L8.30838 12.5253C8.55246 12.7694 8.94819 12.7694 9.19227 12.5253L13.3589 8.35863Z"
                          fill="#3C50E0"
                        />
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M10.0003 1.04169C5.05277 1.04169 1.04199 5.05247 1.04199 10C1.04199 14.9476 5.05277 18.9584 10.0003 18.9584C14.9479 18.9584 18.9587 14.9476 18.9587 10C18.9587 5.05247 14.9479 1.04169 10.0003 1.04169ZM2.29199 10C2.29199 5.74283 5.74313 2.29169 10.0003 2.29169C14.2575 2.29169 17.7087 5.74283 17.7087 10C17.7087 14.2572 14.2575 17.7084 10.0003 17.7084C5.74313 17.7084 2.29199 14.2572 2.29199 10Z"
                          fill="#3C50E0"
                        />
                      </svg>
                      Miễn phí giao hàng - Sử dụng mã: ACC2201
                    </li>
                  </ul>

                  <form onSubmit={(e) => e.preventDefault()}>
                    <div className="flex flex-col gap-4.5 border-y border-gray-3 mt-7.5 mb-9 py-9">
                      {/* <!-- Color selector - only show if colors exist --> */}
                      {colors.length > 0 && (
                        <div className="flex items-center gap-4">
                          <div className="min-w-[65px]">
                            <h4 className="font-medium text-dark">Màu sắc:</h4>
                          </div>

                          <div className="flex items-center gap-2.5 flex-wrap">
                            {colors.map((color, key) => {
                              const colorObj = getColorObject(color);
                              const colorPrice = getColorPrice(color);
                              const colorLabel = getColorLabel(color);
                              const colorHex = getColorHex(color);

                              return (
                                <label
                                  key={key}
                                  htmlFor={`color-${key}`}
                                  className="cursor-pointer select-none flex items-center gap-2"
                                >
                                  <div className="relative">
                                    <input
                                      type="radio"
                                      name="color"
                                      id={`color-${key}`}
                                      className="sr-only"
                                      checked={activeColor === color}
                                      onChange={() => {
                                        setActiveColor(color);
                                        console.log("🎨 Color changed:", {
                                          from: activeColor,
                                          to: color,
                                          colorLabel,
                                          colorHex,
                                        });
                                      }}
                                    />
                                    <div
                                      className={`flex items-center justify-center w-5.5 h-5.5 rounded-full ${
                                        activeColor === color && "border-2"
                                      }`}
                                      style={{ borderColor: colorHex }}
                                    >
                                      <span
                                        className="block w-3 h-3 rounded-full"
                                        style={{ backgroundColor: colorHex }}
                                      ></span>
                                    </div>
                                  </div>
                                  {colorPrice > 0 && (
                                    <span className="text-xs text-blue">
                                      (+${(colorPrice / 25000).toFixed(2)})
                                    </span>
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* <!-- Storage selector - only show if storage options exist --> */}
                      {storages.length > 0 && (
                        <div className="flex items-center gap-4">
                          <div className="min-w-[65px]">
                            <h4 className="font-medium text-dark">Bộ nhớ:</h4>
                          </div>

                          <div className="flex items-center gap-4">
                            {storages.map((item, key) => (
                              <label
                                key={key}
                                htmlFor={item.id}
                                className="flex cursor-pointer select-none items-center gap-2"
                              >
                                <div className="relative">
                                  <input
                                    type="checkbox"
                                    name="storage"
                                    id={item.id}
                                    className="sr-only"
                                    onChange={() => setStorage(item.id)}
                                  />

                                  {/*  */}
                                  <div
                                    className={`mr-2 flex h-4 w-4 items-center justify-center rounded border ${
                                      storage === item.id
                                        ? "border-blue bg-blue"
                                        : "border-gray-4"
                                    } `}
                                  >
                                    <span
                                      className={
                                        storage === item.id
                                          ? "opacity-100"
                                          : "opacity-0"
                                      }
                                    >
                                      <svg
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <rect
                                          x="4"
                                          y="4.00006"
                                          width="16"
                                          height="16"
                                          rx="4"
                                          fill="#3C50E0"
                                        />
                                        <path
                                          fillRule="evenodd"
                                          clipRule="evenodd"
                                          d="M16.3103 9.25104C16.471 9.41178 16.5612 9.62978 16.5612 9.85707C16.5612 10.0844 16.471 10.3024 16.3103 10.4631L12.0243 14.7491C11.8635 14.9098 11.6455 15.0001 11.4182 15.0001C11.191 15.0001 10.973 14.9098 10.8122 14.7491L8.24062 12.1775C8.08448 12.0158 7.99808 11.7993 8.00003 11.5745C8.00199 11.3498 8.09214 11.1348 8.25107 10.9759C8.41 10.8169 8.62499 10.7268 8.84975 10.7248C9.0745 10.7229 9.29103 10.8093 9.4527 10.9654L11.4182 12.931L15.0982 9.25104C15.2589 9.09034 15.4769 9.00006 15.7042 9.00006C15.9315 9.00006 16.1495 9.09034 16.3103 9.25104Z"
                                          fill="white"
                                        />
                                      </svg>
                                    </span>
                                  </div>
                                </div>
                                <span>
                                  {item.title}
                                  {item.price && item.price > 0 && (
                                    <span className="text-blue ml-1">
                                      (+{formatPrice(item.price)})
                                    </span>
                                  )}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* <!-- Type selector - only show if type options exist --> */}
                      {types.length > 0 && (
                        <div className="flex items-center gap-4">
                          <div className="min-w-[65px]">
                            <h4 className="font-medium text-dark">Loại:</h4>
                          </div>

                          <div className="flex items-center gap-4">
                            {types.map((item, key) => (
                              <label
                                key={key}
                                htmlFor={item.id}
                                className="flex cursor-pointer select-none items-center gap-2"
                              >
                                <div className="relative">
                                  <input
                                    type="checkbox"
                                    name="storage"
                                    id={item.id}
                                    className="sr-only"
                                    onChange={() => setType(item.id)}
                                  />

                                  {/*  */}
                                  <div
                                    className={`mr-2 flex h-4 w-4 items-center justify-center rounded border ${
                                      type === item.id
                                        ? "border-blue bg-blue"
                                        : "border-gray-4"
                                    } `}
                                  >
                                    <span
                                      className={
                                        type === item.id
                                          ? "opacity-100"
                                          : "opacity-0"
                                      }
                                    >
                                      <svg
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <rect
                                          x="4"
                                          y="4.00006"
                                          width="16"
                                          height="16"
                                          rx="4"
                                          fill="#3C50E0"
                                        />
                                        <path
                                          fillRule="evenodd"
                                          clipRule="evenodd"
                                          d="M16.3103 9.25104C16.471 9.41178 16.5612 9.62978 16.5612 9.85707C16.5612 10.0844 16.471 10.3024 16.3103 10.4631L12.0243 14.7491C11.8635 14.9098 11.6455 15.0001 11.4182 15.0001C11.191 15.0001 10.973 14.9098 10.8122 14.7491L8.24062 12.1775C8.08448 12.0158 7.99808 11.7993 8.00003 11.5745C8.00199 11.3498 8.09214 11.1348 8.25107 10.9759C8.41 10.8169 8.62499 10.7268 8.84975 10.7248C9.0745 10.7229 9.29103 10.8093 9.4527 10.9654L11.4182 12.931L15.0982 9.25104C15.2589 9.09034 15.4769 9.00006 15.7042 9.00006C15.9315 9.00006 16.1495 9.09034 16.3103 9.25104Z"
                                          fill="white"
                                        />
                                      </svg>
                                    </span>
                                  </div>
                                </div>
                                <span>
                                  {item.title}
                                  {item.price && item.price > 0 && (
                                    <span className="text-blue ml-1">
                                      (+${item.price.toFixed(2)})
                                    </span>
                                  )}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* <!-- Sim selector - only show if sim options exist --> */}
                      {sims.length > 0 && (
                        <div className="flex items-center gap-4">
                          <div className="min-w-[65px]">
                            <h4 className="font-medium text-dark">Số sim:</h4>
                          </div>

                          <div className="flex items-center gap-4">
                            {sims.map((item, key) => (
                              <label
                                key={key}
                                htmlFor={item.id}
                                className="flex cursor-pointer select-none items-center gap-2"
                              >
                                <div className="relative">
                                  <input
                                    type="checkbox"
                                    name="storage"
                                    id={item.id}
                                    className="sr-only"
                                    onChange={() => setSim(item.id)}
                                  />

                                  {/*  */}
                                  <div
                                    className={`mr-2 flex h-4 w-4 items-center justify-center rounded border ${
                                      sim === item.id
                                        ? "border-blue bg-blue"
                                        : "border-gray-4"
                                    } `}
                                  >
                                    <span
                                      className={
                                        sim === item.id
                                          ? "opacity-100"
                                          : "opacity-0"
                                      }
                                    >
                                      <svg
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <rect
                                          x="4"
                                          y="4.00006"
                                          width="16"
                                          height="16"
                                          rx="4"
                                          fill="#3C50E0"
                                        />
                                        <path
                                          fillRule="evenodd"
                                          clipRule="evenodd"
                                          d="M16.3103 9.25104C16.471 9.41178 16.5612 9.62978 16.5612 9.85707C16.5612 10.0844 16.471 10.3024 16.3103 10.4631L12.0243 14.7491C11.8635 14.9098 11.6455 15.0001 11.4182 15.0001C11.191 15.0001 10.973 14.9098 10.8122 14.7491L8.24062 12.1775C8.08448 12.0158 7.99808 11.7993 8.00003 11.5745C8.00199 11.3498 8.09214 11.1348 8.25107 10.9759C8.41 10.8169 8.62499 10.7268 8.84975 10.7248C9.0745 10.7229 9.29103 10.8093 9.4527 10.9654L11.4182 12.931L15.0982 9.25104C15.2589 9.09034 15.4769 9.00006 15.7042 9.00006C15.9315 9.00006 16.1495 9.09034 16.3103 9.25104Z"
                                          fill="white"
                                        />
                                      </svg>
                                    </span>
                                  </div>
                                </div>
                                <span>
                                  {item.title}
                                  {item.price && item.price > 0 && (
                                    <span className="text-blue ml-1">
                                      (+${item.price.toFixed(2)})
                                    </span>
                                  )}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4.5">
                      <div className="flex items-center rounded-md border border-gray-3">
                        <button
                          aria-label="button for remove product"
                          className="flex items-center justify-center w-12 h-12 ease-out duration-200 hover:text-blue"
                          onClick={() =>
                            quantity > 1 && setQuantity(quantity - 1)
                          }
                        >
                          <svg
                            className="fill-current"
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M3.33301 10.0001C3.33301 9.53984 3.7061 9.16675 4.16634 9.16675H15.833C16.2932 9.16675 16.6663 9.53984 16.6663 10.0001C16.6663 10.4603 16.2932 10.8334 15.833 10.8334H4.16634C3.7061 10.8334 3.33301 10.4603 3.33301 10.0001Z"
                              fill=""
                            />
                          </svg>
                        </button>

                        <span className="flex items-center justify-center w-16 h-12 border-x border-gray-4">
                          {quantity}
                        </span>

                        <button
                          onClick={() => setQuantity(quantity + 1)}
                          aria-label="button for add product"
                          className="flex items-center justify-center w-12 h-12 ease-out duration-200 hover:text-blue"
                        >
                          <svg
                            className="fill-current"
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M3.33301 10C3.33301 9.5398 3.7061 9.16671 4.16634 9.16671H15.833C16.2932 9.16671 16.6663 9.5398 16.6663 10C16.6663 10.4603 16.2932 10.8334 15.833 10.8334H4.16634C3.7061 10.8334 3.33301 10.4603 3.33301 10Z"
                              fill=""
                            />
                            <path
                              d="M9.99967 16.6667C9.53944 16.6667 9.16634 16.2936 9.16634 15.8334L9.16634 4.16671C9.16634 3.70647 9.53944 3.33337 9.99967 3.33337C10.4599 3.33337 10.833 3.70647 10.833 4.16671L10.833 15.8334C10.833 16.2936 10.4599 16.6667 9.99967 16.6667Z"
                              fill=""
                            />
                          </svg>
                        </button>
                      </div>

                      <button
                        onClick={handleAddToCart}
                        className="inline-flex font-medium text-white bg-blue py-3 px-7 rounded-md ease-out duration-200 hover:bg-blue-dark"
                      >
                        Thêm vào giỏ hàng
                      </button>

                      {product?.id && (
                        <WishlistButton
                          productId={product.id}
                          productVariantId={
                            product.hasVariants && findVariantByOptions()
                              ? findVariantByOptions()?.id || null
                              : null
                          }
                          selectedOptions={(() => {
                            const options: Record<string, string> = {};
                            if (activeColor) {
                              options.color = getColorLabel(activeColor);
                            }
                            if (storage) {
                              const storageOption = storages.find(
                                (s) => s.id === storage
                              );
                              if (storageOption) {
                                options.storage =
                                  storageOption.title || storage;
                              }
                            }
                            if (type) {
                              const typeOption = types.find(
                                (t) => t.id === type
                              );
                              if (typeOption) {
                                options.type = typeOption.title || type;
                              }
                            }
                            if (sim) {
                              const simOption = sims.find((s) => s.id === sim);
                              if (simOption) {
                                options.sim = simOption.title || sim;
                              }
                            }
                            return Object.keys(options).length > 0
                              ? options
                              : null;
                          })()}
                          size="lg"
                        />
                      )}
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </section>

          <section className="overflow-hidden bg-gray-2 py-20">
            <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
              {/* <!--== tab header start ==--> */}
              <div className="flex flex-wrap items-center bg-white rounded-[10px] shadow-1 gap-5 xl:gap-12.5 py-4.5 px-4 sm:px-6">
                {tabs.map((item, key) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(item.id)}
                    className={`font-medium lg:text-lg ease-out duration-200 hover:text-blue relative before:h-0.5 before:bg-blue before:absolute before:left-0 before:bottom-0 before:ease-out before:duration-200 hover:before:w-full ${
                      activeTab === item.id
                        ? "text-blue before:w-full"
                        : "text-dark before:w-0"
                    }`}
                  >
                    {item.title}
                  </button>
                ))}
              </div>
              {/* <!--== tab header end ==--> */}

              {/* <!--== tab content start ==--> */}
              {/* <!-- tab content one start --> */}
              <div>
                <div
                  className={`flex-col sm:flex-row gap-7.5 xl:gap-12.5 mt-12.5 ${
                    activeTab === "tabOne" ? "flex" : "hidden"
                  }`}
                >
                  <div className="max-w-[670px] w-full">
                    <h2 className="font-medium text-2xl text-dark mb-7">
                      Mô tả sản phẩm:
                    </h2>

                    {product.description ? (
                      <div className="prose max-w-none">
                        <p className="mb-6 whitespace-pre-line">
                          {product.description}
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-500">
                        Không có mô tả sản phẩm cho sản phẩm này.
                      </p>
                    )}
                  </div>

                  <div className="max-w-[447px] w-full">
                    <h2 className="font-medium text-2xl text-dark mb-7">
                      Chăm sóc & Bảo trì:
                    </h2>

                    <p className="mb-6">
                      Để đảm bảo hiệu suất và tuổi thọ tốt nhất của sản phẩm,
                      vui lòng tuân theo các hướng dẫn chăm sóc sau: Giữ cho
                      thiết bị sạch và khô, tránh nhiệt độ quá cao, và sử dụng
                      các phụ kiện và sạc được khuyến khích.
                    </p>
                    <p>
                      Để xem hướng dẫn bảo trì chi tiết, vui lòng xem sách hướng
                      dẫn sử dụng đi kèm với đơn hàng của bạn hoặc truy cập
                      trang web hỗ trợ của chúng tôi.
                    </p>
                  </div>
                </div>
              </div>
              {/* <!-- tab content one end --> */}

              {/* <!-- tab content two start --> */}
              <div>
                <div
                  className={`rounded-xl bg-white shadow-1 p-4 sm:p-6 mt-10 ${
                    activeTab === "tabTwo" ? "block" : "hidden"
                  }`}
                >
                  {product.additionalInfo &&
                  Object.keys(product.additionalInfo).length > 0 ? (
                    Object.entries(product.additionalInfo).map(
                      ([key, value], index) => (
                        <div
                          key={key}
                          className={`rounded-md ${
                            index % 2 === 1 ? "bg-gray-1" : ""
                          } flex py-4 px-4 sm:px-5`}
                        >
                          <div className="max-w-[450px] min-w-[140px] w-full">
                            <p className="text-sm sm:text-base text-dark font-medium">
                              {key}
                            </p>
                          </div>
                          <div className="w-full">
                            <p className="text-sm sm:text-base text-dark">
                              {String(value || "N/A")}
                            </p>
                          </div>
                        </div>
                      )
                    )
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-gray-500">
                        Không có thông tin bổ sung cho sản phẩm này.
                      </p>
                    </div>
                  )}
                </div>
              </div>
              {/* <!-- tab content two end --> */}

              {/* <!-- tab content three start --> */}
              <div>
                <div
                  className={`mt-12.5 ${
                    activeTab === "tabThree" ? "block" : "hidden"
                  }`}
                >
                  {product?.id && (
                    <ReviewsSection
                      productId={product.id}
                      onReviewsUpdate={handleReviewsUpdate}
                    />
                  )}
                </div>
              </div>
              {/* <!-- tab content three end --> */}
              {/* <!--== tab content end ==--> */}
            </div>
          </section>

          <RecentlyViewdItems />
        </>
      )}
    </>
  );
};

export default ShopDetails;
