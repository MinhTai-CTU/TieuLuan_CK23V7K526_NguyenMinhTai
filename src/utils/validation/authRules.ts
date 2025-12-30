import * as yup from "yup";

// Change password validation schema for regular users (with current password)
export const changePasswordSchema = yup
  .object({
    currentPassword: yup
      .string()
      .required("Mật khẩu hiện tại là bắt buộc")
      .min(1, "Mật khẩu hiện tại là bắt buộc"),

    newPassword: yup
      .string()
      .required("Mật khẩu mới là bắt buộc")
      .min(6, "Mật khẩu mới phải có ít nhất 6 ký tự")
      .max(100, "Mật khẩu mới không được vượt quá 100 ký tự"),

    confirmPassword: yup
      .string()
      .required("Xác nhận mật khẩu là bắt buộc")
      .oneOf([yup.ref("newPassword")], "Mật khẩu xác nhận không khớp"),
  })
  .required();

// Change password validation schema for OAuth users (without current password)
export const changePasswordOAuthSchema = yup
  .object({
    newPassword: yup
      .string()
      .required("Mật khẩu mới là bắt buộc")
      .min(6, "Mật khẩu mới phải có ít nhất 6 ký tự")
      .max(100, "Mật khẩu mới không được vượt quá 100 ký tự"),

    confirmPassword: yup
      .string()
      .required("Xác nhận mật khẩu là bắt buộc")
      .oneOf([yup.ref("newPassword")], "Mật khẩu xác nhận không khớp"),
  })
  .required();

// Type inference for TypeScript
export type ChangePasswordFormData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type ChangePasswordOAuthFormData = {
  newPassword: string;
  confirmPassword: string;
};

// Signup validation schema
export const signupSchema = yup
  .object({
    name: yup
      .string()
      .required("Full name is required")
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must not exceed 100 characters"),

    email: yup
      .string()
      .required("Email is required")
      .email("Please enter a valid email")
      .max(255, "Email must not exceed 255 characters"),

    password: yup
      .string()
      .required("Password is required")
      .min(6, "Password must be at least 6 characters")
      .max(100, "Password must not exceed 100 characters"),

    confirmPassword: yup
      .string()
      .required("Please confirm your password")
      .oneOf([yup.ref("password")], "Passwords do not match"),
  })
  .required();

// Signin validation schema
export const signinSchema = yup
  .object({
    email: yup
      .string()
      .required("Email is required")
      .email("Please enter a valid email"),

    password: yup
      .string()
      .required("Password is required")
      .min(6, "Password must be at least 6 characters"),
  })
  .required();

// Type inference for TypeScript
export type SignupFormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type SigninFormData = {
  email: string;
  password: string;
};
