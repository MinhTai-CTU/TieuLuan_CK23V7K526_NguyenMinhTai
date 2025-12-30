"use client";
import { useEffect } from "react";
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

interface AddressFormProps {
  address?: any;
  onSave: (addressData: any) => void;
  onCancel: () => void;
}

const AddressForm = ({ address, onSave, onCancel }: AddressFormProps) => {
  const createAddressMutation = useCreateAddress();
  const updateAddressMutation = useUpdateAddress();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressFormSchema),
    mode: "onChange", // Validate on change for real-time feedback
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
  const {
    data: cities = [],
    isLoading: loadingCities,
    error: citiesError,
  } = useCities();

  const {
    data: districts = [],
    isLoading: loadingDistricts,
    error: districtsError,
  } = useDistricts(cityId || null);

  const {
    data: wards = [],
    isLoading: loadingWards,
    error: wardsError,
  } = useWards(districtId || null);

  // Initialize form values when address changes (for edit mode)
  useEffect(() => {
    if (address?.id) {
      // When editing, set all values from address
      if (address.cityId) setValue("cityId", address.cityId);
      if (address.districtId) setValue("districtId", address.districtId);
      if (address.wardId) setValue("wardId", address.wardId);
    }
  }, [address, setValue]);

  // Reset district and ward when city changes (only if not editing or city actually changed)
  useEffect(() => {
    if (cityId && !address?.id) {
      // Only reset when creating new address
      setValue("districtId", "");
      setValue("wardId", "");
    } else if (cityId && address?.id && cityId !== address.cityId) {
      // If editing and city changed, reset district and ward
      setValue("districtId", "");
      setValue("wardId", "");
    }
  }, [cityId, address, setValue]);

  // Reset ward when district changes (only if not editing or district actually changed)
  useEffect(() => {
    if (districtId && !address?.id) {
      // Only reset when creating new address
      setValue("wardId", "");
    } else if (districtId && address?.id && districtId !== address.districtId) {
      // If editing and district changed, reset ward
      setValue("wardId", "");
    }
  }, [districtId, address, setValue]);

  const onSubmit = async (data: AddressFormData) => {
    try {
      // Get selected city, district, ward names
      const selectedCity = cities.find((c) => c.id === data.cityId);
      const selectedDistrict = districts.find((d) => d.id === data.districtId);
      // Compare as strings to handle both string and number IDs
      const selectedWard = wards.find(
        (w) => String(w.id) === String(data.wardId)
      );

      // Ensure we have valid names
      if (!selectedCity || !selectedDistrict || !selectedWard) {
        throw new Error("Please select valid city, district, and ward");
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
        const result = await updateAddressMutation.mutateAsync({
          id: address.id,
          data: addressData,
        });
        onSave(result);
      } else {
        // Create new address
        const result = await createAddressMutation.mutateAsync(addressData);
        onSave(result);
      }
    } catch (error: any) {
      console.error("Error saving address:", error);
      // Error toast is handled by mutation hooks
    }
  };

  return (
    <div className="bg-white rounded-[10px] shadow-1 border border-gray-3 p-8">
      <h2 className="text-xl font-semibold text-dark mb-8">
        {address ? "Sửa địa chỉ" : "Thêm địa chỉ mới"}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Full Name */}
        <div>
          <label
            htmlFor="fullName"
            className="block text-base font-medium text-dark mb-2"
          >
            Họ và tên
          </label>
          <input
            type="text"
            id="fullName"
            {...register("fullName")}
            className={`w-full px-5 py-3 text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-transparent border-gray-3 bg-gray-1`}
          />
          {errors.fullName && (
            <p className="text-sm text-red mt-1.5 font-medium">
              {errors.fullName.message}
            </p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label
            htmlFor="phone"
            className="block text-base font-medium text-dark mb-2"
          >
            Số điện thoại
          </label>
          <input
            type="tel"
            id="phone"
            {...register("phone")}
            className={`w-full px-5 py-3 text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-transparent border-gray-3 bg-gray-1`}
          />
          {errors.phone && (
            <p className="text-sm text-red mt-1.5 font-medium">
              {errors.phone.message}
            </p>
          )}
        </div>

        {/* City */}
        <div>
          <label
            htmlFor="cityId"
            className="block text-base font-medium text-dark mb-2"
          >
            Tỉnh/Thành phố
          </label>
          <select
            id="cityId"
            {...register("cityId")}
            disabled={loadingCities}
            className={`w-full px-5 py-3 text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed border-gray-3 bg-gray-1`}
          >
            <option value="">Chọn Tỉnh/Thành phố</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
          {errors.cityId && (
            <p className="text-sm text-red mt-1.5 font-medium">
              {errors.cityId.message}
            </p>
          )}
          {citiesError && (
            <p className="text-sm text-red mt-1.5 font-medium">
              Lỗi khi tải tỉnh/thành phố. Vui lòng thử lại.
            </p>
          )}
        </div>

        {/* District */}
        <div>
          <label
            htmlFor="districtId"
            className="block text-base font-medium text-dark mb-2"
          >
            Quận/Huyện
          </label>
          <select
            id="districtId"
            {...register("districtId")}
            disabled={!cityId || loadingDistricts}
            className={`w-full px-5 py-3 text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed border-gray-3 bg-gray-1`}
          >
            <option value="">
              {!cityId
                ? "Vui lòng chọn tỉnh/thành phố trước"
                : loadingDistricts
                  ? "Đang tải quận/huyện..."
                  : "Chọn Quận/Huyện"}
            </option>
            {districts.map((district) => (
              <option key={district.id} value={district.id}>
                {district.name}
              </option>
            ))}
          </select>
          {errors.districtId && (
            <p className="text-sm text-red mt-1.5 font-medium">
              {errors.districtId.message}
            </p>
          )}
          {districtsError && (
            <p className="text-sm text-red mt-1.5 font-medium">
              Lỗi khi tải quận/huyện. Vui lòng thử lại.
            </p>
          )}
        </div>

        {/* Ward */}
        <div>
          <label
            htmlFor="wardId"
            className="block text-base font-medium text-dark mb-2"
          >
            Phường/Xã
          </label>
          <select
            id="wardId"
            {...register("wardId")}
            disabled={!districtId || loadingWards}
            className={`w-full px-5 py-3 text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed border-gray-3 bg-gray-1`}
          >
            <option value="">
              {!districtId
                ? "Vui lòng chọn quận/huyện trước"
                : loadingWards
                  ? "Đang tải phường/xã..."
                  : "Chọn Phường/Xã"}
            </option>
            {wards.map((ward) => (
              <option key={ward.id} value={String(ward.id)}>
                {ward.name}
              </option>
            ))}
          </select>
          {errors.wardId && (
            <p className="text-sm text-red mt-1.5 font-medium">
              {errors.wardId.message}
            </p>
          )}
          {wardsError && (
            <p className="text-sm text-red mt-1.5 font-medium">
              Lỗi khi tải phường/xã. Vui lòng thử lại.
            </p>
          )}
        </div>

        {/* Detailed Address */}
        <div>
          <label
            htmlFor="address"
            className="block text-base font-medium text-dark mb-2"
          >
            Địa chỉ chi tiết
          </label>
          <textarea
            id="address"
            {...register("address")}
            rows={4}
            placeholder="Ví dụ: 52, Đường Trần Hưng Đạo"
            className={`w-full px-5 py-3 text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-transparent border-gray-3 bg-gray-1`}
          />
          {errors.address && (
            <p className="text-sm text-red mt-1.5 font-medium">
              {errors.address.message}
            </p>
          )}
        </div>

        {/* Address Type */}
        <div>
          <label className="block text-base font-medium text-dark mb-2">
            Loại địa chỉ
          </label>
          <Controller
            name="addressType"
            control={control}
            render={({ field }) => (
              <div className="flex gap-6">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="home"
                    checked={field.value === "home"}
                    onChange={() => field.onChange("home")}
                    className="w-5 h-5 text-blue focus:ring-blue cursor-pointer"
                  />
                  <span className="ml-2 text-base text-dark">Nhà riêng</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="office"
                    checked={field.value === "office"}
                    onChange={() => field.onChange("office")}
                    className="w-5 h-5 text-blue focus:ring-blue cursor-pointer"
                  />
                  <span className="ml-2 text-base text-dark">Văn phòng</span>
                </label>
              </div>
            )}
          />
          {errors.addressType && (
            <p className="text-sm text-red mt-1.5 font-medium">
              {errors.addressType.message}
            </p>
          )}
        </div>

        {/* Set as Default */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              {...register("isDefault")}
              className="w-5 h-5 text-blue rounded focus:ring-blue cursor-pointer"
            />
            <span className="ml-2 text-base text-dark">
              Sử dụng địa chỉ này làm mặc định
            </span>
          </label>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-4 pt-6 border-t border-gray-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-3 text-base font-medium text-dark bg-gray-2 rounded-md hover:bg-gray-3 ease-out duration-200"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={
              createAddressMutation.isPending || updateAddressMutation.isPending
            }
            className="px-8 py-3 text-base font-medium text-white bg-blue rounded-md hover:bg-blue-dark ease-out duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createAddressMutation.isPending || updateAddressMutation.isPending
              ? "Đang lưu..."
              : address?.id
                ? "Cập nhật địa chỉ"
                : "Lưu địa chỉ"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddressForm;
