"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useAddresses,
  useDeleteAddress,
  useSetDefaultAddress,
} from "@/hooks/queries/useAddresses";
import { useAuth } from "@/hooks/useAuth";
import { useCheckoutStore } from "@/stores/checkout-store";
import Breadcrumb from "../Common/Breadcrumb";
import AddressList from "./AddressList";
import AddressForm from "./AddressForm";

const AddressManagementContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    data: addresses = [],
    isLoading: addressesLoading,
    error,
  } = useAddresses();
  const deleteAddressMutation = useDeleteAddress();
  const setDefaultAddressMutation = useSetDefaultAddress();
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);

  // Redirect to signin if not authenticated (only after auth check is complete)
  useEffect(() => {
    // Wait for auth check to complete before redirecting
    if (!authLoading && !isAuthenticated) {
      router.push("/signin");
    }
  }, [isAuthenticated, authLoading, router]);

  // Check if add=true query param exists to auto-open form
  useEffect(() => {
    const addParam = searchParams.get("add");
    if (addParam === "true" && !showForm && !addressesLoading && !authLoading) {
      setEditingAddress(null);
      setShowForm(true);
      // Remove query param from URL without reload
      router.replace("/checkout/addresses", { scroll: false });
    }
  }, [searchParams, showForm, addressesLoading, authLoading, router]);

  const handleAddNew = () => {
    setEditingAddress(null);
    setShowForm(true);
  };

  const handleEdit = (address: any) => {
    setEditingAddress(address);
    setShowForm(true);
  };

  const handleSave = (addressData: any) => {
    // AddressForm already handles API call via TanStack Query
    // Query will automatically refetch due to invalidation
    setShowForm(false);
    setEditingAddress(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAddress(null);
  };

  const handleDelete = async (addressId: string) => {
    try {
      await deleteAddressMutation.mutateAsync(addressId);
      // Query will automatically refetch due to invalidation in mutation
    } catch (error) {
      // Error toast is handled by mutation hook
      console.error("Error deleting address:", error);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      await setDefaultAddressMutation.mutateAsync(addressId);
      // Query will automatically refetch due to invalidation in mutation
    } catch (error) {
      // Error toast is handled by mutation hook
      console.error("Error setting default address:", error);
    }
  };

  const { setSelectedAddress } = useCheckoutStore();

  const handleSelectAddress = (address: any) => {
    // Save selected address to store (without setting it as default)
    setSelectedAddress(address);
    // Redirect back to checkout
    router.push("/checkout");
  };

  return (
    <>
      <Breadcrumb title={"Quản lý địa chỉ"} pages={["checkout", "addresses"]} />
      <section className="overflow-hidden py-8 bg-[#f3f4f6]">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-dark mb-2">
              Quản lý địa chỉ
            </h1>
            <p className="text-sm text-dark-4">
              Quản lý địa chỉ cho việc thanh toán nhanh hơn
            </p>
          </div>

          {authLoading || addressesLoading ? (
            <div className="bg-white rounded-[10px] shadow-1 border border-gray-3 p-8 text-center">
              <p className="text-dark-4">Đang tải địa chỉ...</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-[10px] shadow-1 border border-red-500 p-8 text-center">
              <p className="text-red-600">
                {error instanceof Error ? error.message : "Lỗi khi tải địa chỉ"}
              </p>
            </div>
          ) : !showForm ? (
            <AddressList
              addresses={addresses}
              onAddNew={handleAddNew}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSetDefault={handleSetDefault}
              onSelect={handleSelectAddress}
            />
          ) : (
            <AddressForm
              key={editingAddress?.id || "new"} // Force re-render when editing different address
              address={editingAddress}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          )}
        </div>
      </section>
    </>
  );
};

const AddressManagement = () => {
  return (
    <Suspense fallback={<div className="p-8 text-center">Đang tải...</div>}>
      <AddressManagementContent />
    </Suspense>
  );
};

export default AddressManagement;
