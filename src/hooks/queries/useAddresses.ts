"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuthHeader } from "@/lib/auth-storage";
import toast from "react-hot-toast";

export interface Address {
  id: string;
  userId: string;
  fullName: string;
  phone: string | null;
  address: string;
  city: string;
  cityId: string | null;
  district: string;
  districtId: string | null;
  ward: string;
  wardId: string | null;
  addressType: "home" | "office";
  postalCode: string | null;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddressFormData {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  cityId: string;
  district: string;
  districtId: string;
  ward: string;
  wardId: string;
  addressType: "home" | "office";
  isDefault: boolean;
}

// Fetch all addresses
const fetchAddresses = async (): Promise<Address[]> => {
  const authHeader = getAuthHeader();
  if (!authHeader) {
    throw new Error("Please login to view addresses");
  }

  const response = await fetch("/api/addresses", {
    headers: {
      Authorization: authHeader,
    },
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || "Failed to fetch addresses");
  }

  return result.data || [];
};

// Create address
const createAddress = async (data: AddressFormData): Promise<Address> => {
  const authHeader = getAuthHeader();
  if (!authHeader) {
    throw new Error("Please login to save address");
  }

  const response = await fetch("/api/addresses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || "Failed to create address");
  }

  return result.data;
};

// Update address
const updateAddress = async ({
  id,
  data,
}: {
  id: string;
  data: AddressFormData;
}): Promise<Address> => {
  const authHeader = getAuthHeader();
  if (!authHeader) {
    throw new Error("Please login to update address");
  }

  const response = await fetch(`/api/addresses/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || "Failed to update address");
  }

  return result.data;
};

// Delete address
const deleteAddress = async (id: string): Promise<void> => {
  const authHeader = getAuthHeader();
  if (!authHeader) {
    throw new Error("Please login to delete address");
  }

  const response = await fetch(`/api/addresses/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: authHeader,
    },
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || "Failed to delete address");
  }
};

// Set default address
const setDefaultAddress = async (id: string): Promise<Address> => {
  const authHeader = getAuthHeader();
  if (!authHeader) {
    throw new Error("Please login to set default address");
  }

  const response = await fetch(`/api/addresses/${id}/default`, {
    method: "PUT",
    headers: {
      Authorization: authHeader,
    },
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || "Failed to set default address");
  }

  return result.data;
};

// Hook to fetch addresses
export const useAddresses = () => {
  return useQuery({
    queryKey: ["addresses"],
    queryFn: fetchAddresses,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};

// Hook to create address
export const useCreateAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Tạo địa chỉ thành công");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Tạo địa chỉ thất bại");
    },
  });
};

// Hook to update address
export const useUpdateAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Cập nhật địa chỉ thành công");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Cập nhật địa chỉ thất bại");
    },
  });
};

// Hook to delete address
export const useDeleteAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Xóa địa chỉ thành công");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Xóa địa chỉ thất bại");
    },
  });
};

// Hook to set default address
export const useSetDefaultAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setDefaultAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Cập nhật địa chỉ mặc định thành công");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Cập nhật địa chỉ mặc định thất bại");
    },
  });
};
