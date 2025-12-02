"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Product,
  ProductImages,
  ProductAttributes,
  ProductAdditionalInfo,
} from "@/types/product";

type ProductImageResponse = {
  url: string;
  type: "THUMBNAIL" | "PREVIEW";
};

type CategoryResponse = {
  id: string;
  title: string;
  slug: string;
  img: string | null;
};

type ProductVariantResponse = {
  id: string;
  productId: string;
  price: number;
  discountedPrice: number | null;
  stock: number;
  sku: string | null;
  options: Record<string, any>;
  image: string | null;
};

type ProductResponse = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  reviews: number;
  price: number;
  discountedPrice: number | null;
  stock: number;
  hasVariants: boolean;
  isActive: boolean;
  categoryId: string | null;
  attributes: ProductAttributes | null;
  additionalInfo: ProductAdditionalInfo | null;
  category: CategoryResponse | null;
  images: ProductImageResponse[];
  variants?: ProductVariantResponse[];
  createdAt: string;
  updatedAt: string;
};

type ProductDetailsResponse = {
  success: boolean;
  data: ProductResponse;
};

const mapImages = (images: ProductImageResponse[]): ProductImages => {
  const thumbnails: string[] = [];
  const previews: string[] = [];

  images.forEach((image) => {
    if (image.type === "THUMBNAIL") {
      thumbnails.push(image.url);
    } else {
      previews.push(image.url);
    }
  });

  // Fallback: if no previews, use thumbnails
  if (previews.length === 0 && thumbnails.length > 0) {
    previews.push(...thumbnails);
  }

  // Fallback: if no thumbnails, use previews
  if (thumbnails.length === 0 && previews.length > 0) {
    thumbnails.push(...previews);
  }

  return { thumbnails, previews };
};

const fetchProduct = async (id: string): Promise<Product> => {
  const response = await fetch(`/api/products/${id}`, {
    method: "GET",
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Product not found");
    }
    throw new Error("Failed to fetch product");
  }

  const json = (await response.json()) as ProductDetailsResponse;
  if (!json.success) {
    throw new Error("Product response returned unsuccessful flag");
  }

  const product = json.data;

  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    description: product.description,
    reviews: product.reviews ?? 0,
    price: product.price,
    discountedPrice: product.discountedPrice ?? product.price,
    stock: product.stock,
    hasVariants: product.hasVariants ?? false,
    categoryId: product.categoryId,
    attributes: product.attributes as ProductAttributes | null,
    additionalInfo: product.additionalInfo as ProductAdditionalInfo | null,
    imgs: mapImages(product.images ?? []),
    variants: product.variants?.map((v) => ({
      id: v.id,
      productId: v.productId,
      price: v.price,
      discountedPrice: v.discountedPrice,
      stock: v.stock,
      sku: v.sku,
      options: v.options,
      image: v.image,
    })),
  };
};

export const useProduct = (id: string | null | undefined) => {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => {
      if (!id) {
        throw new Error("Product ID is required");
      }
      return fetchProduct(id);
    },
    enabled: !!id, // Only run query if id is provided
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};
