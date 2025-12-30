import { z } from "zod";

// Phone validation: Must be exactly 10 digits
const phoneRegex = /^[0-9]{10}$/;

// Address form validation schema
export const addressFormSchema = z.object({
  fullName: z
    .string()
    .min(1, "Họ và tên là bắt buộc")
    .min(2, "Họ và tên phải có ít nhất 2 ký tự")
    .max(100, "Họ và tên không được vượt quá 100 ký tự"),

  phone: z
    .string()
    .min(1, "Số điện thoại là bắt buộc")
    .regex(phoneRegex, "Số điện thoại phải có đúng 10 chữ số"),

  cityId: z.string().min(1, "Tỉnh/Thành phố là bắt buộc"),

  districtId: z.string().min(1, "Quận/Huyện là bắt buộc"),

  wardId: z.string().min(1, "Phường/Xã là bắt buộc"),

  address: z
    .string()
    .min(1, "Địa chỉ chi tiết là bắt buộc")
    .min(5, "Địa chỉ chi tiết phải có ít nhất 5 ký tự")
    .max(200, "Địa chỉ chi tiết không được vượt quá 200 ký tự"),

  addressType: z.enum(["home", "office"], {
    message: "Loại địa chỉ phải là 'nhà riêng' hoặc 'văn phòng'",
  }),

  isDefault: z.boolean(),
});

// Type inference for TypeScript
export type AddressFormData = z.infer<typeof addressFormSchema>;
