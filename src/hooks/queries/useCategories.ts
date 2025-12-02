"use client";

import { useQuery } from "@tanstack/react-query";
import { Category } from "@/types/category";

type CategoriesResponse = {
  success: boolean;
  data: Category[];
};

const fetchCategories = async (): Promise<Category[]> => {
  const response = await fetch("/api/categories", {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }

  const json = (await response.json()) as CategoriesResponse;
  if (!json.success) {
    throw new Error("Categories response returned unsuccessful flag");
  }

  return json.data;
};

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });
};
