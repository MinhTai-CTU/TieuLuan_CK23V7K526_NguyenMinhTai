"use client";

import { useQuery } from "@tanstack/react-query";
import { Category } from "@/types/category";

type CategoriesResponse = {
  success: boolean;
  data: Category[];
};

// const fetchCategories = async (): Promise<Category[]> => {
//   const response = await fetch("/api/categories", {
//     method: "GET",
//   });

//   if (!response.ok) {
//     throw new Error("Failed to fetch categories");
//   }

//   const json = (await response.json()) as CategoriesResponse;
//   if (!json.success) {
//     throw new Error("Categories response returned unsuccessful flag");
//   }

//   return json.data;
// };

// File: ... (nơi chứa code fetchCategories của bạn)

const fetchCategories = async (): Promise<Category[]> => {
  const response = await fetch("/api/categories", {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }

  const json = (await response.json()) as any;

  if (!json.success) {
    throw new Error("Categories response returned unsuccessful flag");
  }

  const fixedData = json.data.map((item: any) => ({
    ...item,
    products: item._count?.products || item.products || 0,
  }));
  // ------------------------------------------

  return fixedData as Category[];
};

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });
};
