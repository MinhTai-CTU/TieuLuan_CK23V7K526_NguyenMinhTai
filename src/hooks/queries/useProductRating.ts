"use client";

import { useQuery } from "@tanstack/react-query";

type Review = {
  id: string;
  rating: number;
};

type ReviewsResponse = {
  success: boolean;
  data: Review[];
};

const fetchProductRating = async (
  productId: string
): Promise<{ averageRating: number; totalReviews: number }> => {
  const response = await fetch(`/api/products/${productId}/reviews`, {
    method: "GET",
  });

  if (!response.ok) {
    return { averageRating: 0, totalReviews: 0 };
  }

  const json = (await response.json()) as ReviewsResponse;
  if (!json.success || !json.data || json.data.length === 0) {
    return { averageRating: 0, totalReviews: 0 };
  }

  const totalRating = json.data.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / json.data.length;

  return {
    averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
    totalReviews: json.data.length,
  };
};

export const useProductRating = (productId: string | null | undefined) => {
  return useQuery({
    queryKey: ["product-rating", productId],
    queryFn: () => fetchProductRating(productId!),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};
