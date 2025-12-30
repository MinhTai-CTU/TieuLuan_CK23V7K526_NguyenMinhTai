"use client";
import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

interface Address {
  id: string;
  fullName: string;
  phone: string;
  address: string;
  ward: string;
  district: string;
  city: string;
  addressType: "home" | "office";
  isDefault: boolean;
}

interface AddressListProps {
  addresses: Address[];
  onAddNew: () => void;
  onEdit: (address: Address) => void;
  onDelete: (addressId: string) => void;
  onSetDefault: (addressId: string) => void;
  onSelect: (address: Address) => void;
}

const AddressList = ({
  addresses,
  onAddNew,
  onEdit,
  onDelete,
  onSetDefault,
  onSelect,
}: AddressListProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getAddressTypeLabel = (type: string) => {
    return type === "home" ? "House/Apartment" : "Office/Company";
  };

  const handleDeleteClick = (addressId: string) => {
    setDeleteDialogOpen(addressId);
  };

  const handleDeleteConfirm = async (addressId: string) => {
    setIsDeleting(true);
    try {
      await onDelete(addressId);
      setDeleteDialogOpen(null);
    } catch (error) {
      console.error("Error deleting address:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add New Address Link */}
      <div className="bg-white rounded-[10px] shadow-1 border border-gray-3 p-4">
        <p className="text-sm text-dark-4">
          Muốn giao hàng đến địa chỉ khác?{" "}
          <button
            onClick={onAddNew}
            className="text-blue hover:text-blue-dark font-medium ease-out duration-200"
          >
            Thêm địa chỉ mới
          </button>
        </p>
      </div>

      {/* Address List */}
      {addresses.map((address) => (
        <div
          key={address.id}
          className="bg-white rounded-[10px] shadow-1 border border-blue p-6 relative"
        >
          {/* Default Badge */}
          {address.isDefault && (
            <span className="absolute top-4 right-4 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
              Mặc định
            </span>
          )}

          <div className="space-y-3 mb-4">
            <h3 className="text-base font-semibold text-dark">
              {address.fullName}
            </h3>
            <p className="text-sm text-dark-4">
              <span className="font-medium">Địa chỉ:</span> {address.address},{" "}
              {address.ward}, {address.district}, {address.city}
            </p>
            <p className="text-sm text-dark-4">
              <span className="font-medium">Số điện thoại:</span>{" "}
              {address.phone}
            </p>
            <p className="text-sm text-dark-4">
              <span className="font-medium">Loại địa chỉ:</span>{" "}
              {getAddressTypeLabel(address.addressType)}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-gray-3 flex-wrap">
            <button
              type="button"
              onClick={() => onEdit(address)}
              className="px-4 py-2 text-sm font-medium text-dark bg-gray-2 rounded-md hover:bg-gray-3 ease-out duration-200"
            >
              Sửa
            </button>
            <button
              type="button"
              onClick={() => handleDeleteClick(address.id)}
              className="px-4 py-2 text-sm font-medium text-white bg-red rounded-md hover:bg-red-dark ease-out duration-200"
            >
              Xóa
            </button>
            <button
              type="button"
              onClick={() => onSelect(address)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue rounded-md hover:bg-blue-dark ease-out duration-200"
            >
              Giao hàng đến địa chỉ này
            </button>
          </div>

          {/* Delete Confirmation Dialog */}
          <AlertDialog
            open={deleteDialogOpen === address.id}
            onOpenChange={(open) => {
              if (!open) setDeleteDialogOpen(null);
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xóa địa chỉ</AlertDialogTitle>
                <AlertDialogDescription>
                  Bạn có chắc chắn muốn xóa địa chỉ này?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <button
                  type="button"
                  onClick={() => handleDeleteConfirm(address.id)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red rounded-md hover:bg-red-dark ease-out duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? "Đang xóa..." : "Xóa"}
                </button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ))}

      {/* Empty State */}
      {addresses.length === 0 && (
        <div className="bg-white rounded-[10px] shadow-1 border border-gray-3 p-8 text-center">
          <p className="text-dark-4 mb-4">Không tìm thấy địa chỉ</p>
          <button
            onClick={onAddNew}
            className="px-6 py-2 text-sm font-medium text-white bg-blue rounded-md hover:bg-blue-dark ease-out duration-200"
          >
            Thêm địa chỉ mới
          </button>
        </div>
      )}
    </div>
  );
};

export default AddressList;
