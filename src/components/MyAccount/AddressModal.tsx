"use client";
import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCities, useDistricts, useWards } from "@/hooks/queries/useGoship";
import {
  useCreateAddress,
  useUpdateAddress,
  type AddressFormData as AddressFormDataType,
} from "@/hooks/queries/useAddresses";
import {
  addressFormSchema,
  type AddressFormData,
} from "@/utils/validation/addressRules";
import toast from "react-hot-toast";

export interface AddressModalProps {
  isOpen: boolean;
  closeModal: () => void;
  address?: any;
}

const AddressModal = ({ isOpen, closeModal, address }: AddressModalProps) => {
  const createAddressMutation = useCreateAddress();
  const updateAddressMutation = useUpdateAddress();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressFormSchema),
    mode: "onChange",
    defaultValues: {
      fullName: address?.fullName || "",
      phone: address?.phone || "",
      cityId: address?.cityId || "",
      districtId: address?.districtId || "",
      wardId: address?.wardId ? String(address.wardId) : "",
      address: address?.address || "",
      addressType: address?.addressType || "home",
      isDefault: address?.isDefault || false,
    },
  });

  // Watch form values for cascading dropdowns
  const cityId = watch("cityId");
  const districtId = watch("districtId");
  const wardId = watch("wardId");

  // TanStack Query hooks
  const { data: cities = [], isLoading: loadingCities } = useCities();

  const { data: districts = [], isLoading: loadingDistricts } = useDistricts(
    cityId || null
  );

  const { data: wards = [], isLoading: loadingWards } = useWards(
    districtId || null
  );

  // Reset form when address changes
  useEffect(() => {
    if (address) {
      reset({
        fullName: address.fullName || "",
        phone: address.phone || "",
        cityId: address.cityId || "",
        districtId: address.districtId || "",
        wardId: address.wardId ? String(address.wardId) : "",
        address: address.address || "",
        addressType: address.addressType || "home",
        isDefault: address.isDefault || false,
      });
    } else {
      reset({
        fullName: "",
        phone: "",
        cityId: "",
        districtId: "",
        wardId: "",
        address: "",
        addressType: "home",
        isDefault: false,
      });
    }
  }, [address, reset]);

  // Initialize form values when address changes (for edit mode)
  useEffect(() => {
    if (address?.id) {
      if (address.cityId) setValue("cityId", address.cityId);
      if (address.districtId) setValue("districtId", address.districtId);
      if (address.wardId) setValue("wardId", address.wardId);
    }
  }, [address, setValue]);

  // Reset district and ward when city changes
  useEffect(() => {
    if (cityId && !address?.id) {
      setValue("districtId", "");
      setValue("wardId", "");
    } else if (cityId && address?.id && cityId !== address.cityId) {
      setValue("districtId", "");
      setValue("wardId", "");
    }
  }, [cityId, address, setValue]);

  // Reset ward when district changes
  useEffect(() => {
    if (districtId && !address?.id) {
      setValue("wardId", "");
    } else if (districtId && address?.id && districtId !== address.districtId) {
      setValue("wardId", "");
    }
  }, [districtId, address, setValue]);

  const onSubmit = async (data: AddressFormData) => {
    try {
      // Get selected city, district, ward names
      const selectedCity = cities.find((c) => c.id === data.cityId);
      const selectedDistrict = districts.find((d) => d.id === data.districtId);
      const selectedWard = wards.find(
        (w) => String(w.id) === String(data.wardId)
      );

      // Ensure we have valid names
      if (!selectedCity || !selectedDistrict || !selectedWard) {
        toast.error(
          "Vui lòng chọn đầy đủ Tỉnh/Thành phố, Quận/Huyện và Phường/Xã"
        );
        return;
      }

      const addressData: AddressFormDataType = {
        fullName: data.fullName.trim(),
        phone: data.phone.trim(),
        address: data.address.trim(),
        city: selectedCity.name,
        cityId: data.cityId,
        district: selectedDistrict.name,
        districtId: data.districtId,
        ward: selectedWard.name,
        wardId: data.wardId,
        addressType: data.addressType,
        isDefault: data.isDefault,
      };

      if (address?.id) {
        // Update existing address
        await updateAddressMutation.mutateAsync({
          id: address.id,
          data: addressData,
        });
        toast.success("Cập nhật địa chỉ thành công");
      } else {
        // Create new address
        await createAddressMutation.mutateAsync(addressData);
        toast.success("Thêm địa chỉ thành công");
      }
      closeModal();
    } catch (error: any) {
      console.error("Error saving address:", error);
      toast.error(error.message || "Có lỗi xảy ra khi lưu địa chỉ");
    }
  };

  useEffect(() => {
    // closing modal while clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (!(event.target as Element).closest(".modal-content")) {
        closeModal();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, closeModal]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 left-0 overflow-y-auto no-scrollbar w-full h-screen sm:py-20 xl:py-25 2xl:py-[230px] bg-dark/70 sm:px-8 px-4 py-5 z-99999">
      <div className="flex items-center justify-center">
        <div className="w-full max-w-[1100px] rounded-xl shadow-3 bg-white p-7.5 relative modal-content">
          <button
            onClick={closeModal}
            aria-label="button for close modal"
            className="absolute top-0 right-0 sm:top-3 sm:right-3 flex items-center justify-center w-10 h-10 rounded-full ease-in duration-150 bg-meta text-body hover:text-dark"
          >
            <svg
              className="fill-current"
              width="26"
              height="26"
              viewBox="0 0 26 26"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M14.3108 13L19.2291 8.08167C19.5866 7.72417 19.5866 7.12833 19.2291 6.77083C19.0543 6.59895 18.8189 6.50262 18.5737 6.50262C18.3285 6.50262 18.0932 6.59895 17.9183 6.77083L13 11.6892L8.08164 6.77083C7.90679 6.59895 7.67142 6.50262 7.42623 6.50262C7.18104 6.50262 6.94566 6.59895 6.77081 6.77083C6.41331 7.12833 6.41331 7.72417 6.77081 8.08167L11.6891 13L6.77081 17.9183C6.41331 18.2758 6.41331 18.8717 6.77081 19.2292C7.12831 19.5867 7.72414 19.5867 8.08164 19.2292L13 14.3108L17.9183 19.2292C18.2758 19.5867 18.8716 19.5867 19.2291 19.2292C19.5866 18.8717 19.5866 18.2758 19.2291 17.9183L14.3108 13Z"
                fill=""
              />
            </svg>
          </button>

          <div>
            <h2 className="text-xl font-semibold text-dark mb-6">
              {address ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block mb-2.5">
                  Họ và tên <span className="text-red">*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  {...register("fullName")}
                  className={`rounded-md border bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20 ${
                    errors.fullName ? "border-red" : "border-gray-3"
                  }`}
                />
                {errors.fullName && (
                  <p className="text-sm text-red mt-1.5 font-medium">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block mb-2.5">
                  Số điện thoại <span className="text-red">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  {...register("phone")}
                  className={`rounded-md border bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20 ${
                    errors.phone ? "border-red" : "border-gray-3"
                  }`}
                />
                {errors.phone && (
                  <p className="text-sm text-red mt-1.5 font-medium">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              {/* City */}
              <div>
                <label htmlFor="cityId" className="block mb-2.5">
                  Tỉnh/Thành phố <span className="text-red">*</span>
                </label>
                <Controller
                  name="cityId"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className={`rounded-md border bg-gray-1 w-full py-2.5 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20 ${
                        errors.cityId ? "border-red" : "border-gray-3"
                      }`}
                      disabled={loadingCities}
                    >
                      <option value="">Chọn Tỉnh/Thành phố</option>
                      {cities.map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.cityId && (
                  <p className="text-sm text-red mt-1.5 font-medium">
                    {errors.cityId.message}
                  </p>
                )}
              </div>

              {/* District */}
              <div>
                <label htmlFor="districtId" className="block mb-2.5">
                  Quận/Huyện <span className="text-red">*</span>
                </label>
                <Controller
                  name="districtId"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className={`rounded-md border bg-gray-1 w-full py-2.5 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20 ${
                        errors.districtId ? "border-red" : "border-gray-3"
                      }`}
                      disabled={!cityId || loadingDistricts}
                    >
                      <option value="">Chọn Quận/Huyện</option>
                      {districts.map((district) => (
                        <option key={district.id} value={district.id}>
                          {district.name}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.districtId && (
                  <p className="text-sm text-red mt-1.5 font-medium">
                    {errors.districtId.message}
                  </p>
                )}
              </div>

              {/* Ward */}
              <div>
                <label htmlFor="wardId" className="block mb-2.5">
                  Phường/Xã <span className="text-red">*</span>
                </label>
                <Controller
                  name="wardId"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className={`rounded-md border bg-gray-1 w-full py-2.5 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20 ${
                        errors.wardId ? "border-red" : "border-gray-3"
                      }`}
                      disabled={!districtId || loadingWards}
                    >
                      <option value="">Chọn Phường/Xã</option>
                      {wards.map((ward) => (
                        <option key={ward.id} value={ward.id}>
                          {ward.name}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.wardId && (
                  <p className="text-sm text-red mt-1.5 font-medium">
                    {errors.wardId.message}
                  </p>
                )}
              </div>

              {/* Address */}
              <div>
                <label htmlFor="address" className="block mb-2.5">
                  Địa chỉ chi tiết <span className="text-red">*</span>
                </label>
                <textarea
                  id="address"
                  {...register("address")}
                  rows={3}
                  className={`rounded-md border bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20 ${
                    errors.address ? "border-red" : "border-gray-3"
                  }`}
                />
                {errors.address && (
                  <p className="text-sm text-red mt-1.5 font-medium">
                    {errors.address.message}
                  </p>
                )}
              </div>

              {/* Address Type */}
              <div>
                <label className="block mb-2.5">Loại địa chỉ</label>
                <Controller
                  name="addressType"
                  control={control}
                  render={({ field }) => (
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          {...field}
                          value="home"
                          checked={field.value === "home"}
                          className="w-4 h-4 text-blue"
                        />
                        <span>Nhà riêng</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          {...field}
                          value="office"
                          checked={field.value === "office"}
                          className="w-4 h-4 text-blue"
                        />
                        <span>Văn phòng</span>
                      </label>
                    </div>
                  )}
                />
              </div>

              {/* Is Default */}
              <div>
                <Controller
                  name="isDefault"
                  control={control}
                  render={({ field: { value, onChange, ...field } }) => (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        {...field}
                        checked={value}
                        onChange={(e) => onChange(e.target.checked)}
                        className="w-4 h-4 text-blue rounded"
                      />
                      <span>Đặt làm địa chỉ mặc định</span>
                    </label>
                  )}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={
                    createAddressMutation.isPending ||
                    updateAddressMutation.isPending
                  }
                  className="inline-flex font-medium text-white bg-blue py-3 px-7 rounded-md ease-out duration-200 hover:bg-blue-dark disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createAddressMutation.isPending ||
                  updateAddressMutation.isPending
                    ? "Đang lưu..."
                    : address
                      ? "Cập nhật"
                      : "Thêm địa chỉ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressModal;
