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
  categoryId: string | null;
  attributes: ProductAttributes | null;
  additionalInfo: ProductAdditionalInfo | null;
  images: ProductImageResponse[];
  variants?: ProductVariantResponse[];
};

type ProductsResponse = {
  success: boolean;
  data: ProductResponse[];
  total: number;
};

type UseProductsOptions = {
  limit?: number;
  offset?: number;
  categoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string; // e.g. "newest", "bestseller", "oldest"
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

  if (previews.length === 0 && thumbnails.length > 0) {
    previews.push(...thumbnails);
  }

  if (thumbnails.length === 0 && previews.length > 0) {
    thumbnails.push(...previews);
  }

  return { thumbnails, previews };
};

const fetchProducts = async ({
  limit,
  offset,
  categoryId,
  search,
  minPrice,
  maxPrice,
  sort,
}: UseProductsOptions): Promise<{ products: Product[]; total: number }> => {
  const params = new URLSearchParams();
  if (limit) params.append("limit", limit.toString());
  if (offset !== undefined) params.append("offset", offset.toString());
  if (categoryId) params.append("categoryId", categoryId);
  if (search) params.append("search", search);
  if (minPrice !== undefined) params.append("minPrice", minPrice.toString());
  if (maxPrice !== undefined) params.append("maxPrice", maxPrice.toString());
  if (sort) params.append("sort", sort);

  const queryString = params.toString();
  const response = await fetch(
    `/api/products${queryString ? `?${queryString}` : ""}`,
    {
      method: "GET",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }

  const json = (await response.json()) as ProductsResponse;
  if (!json.success) {
    throw new Error("Products response returned unsuccessful flag");
  }

  return {
    products: json.data.map((product) => ({
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
    })),
    total: json.total,
  };
};

export const useProducts = (options: UseProductsOptions = {}) => {
  return useQuery({
    queryKey: ["products", options],
    queryFn: () => fetchProducts(options),
  });
};
