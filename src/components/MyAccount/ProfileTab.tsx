"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getAuthHeader, saveUser } from "@/lib/auth-storage";
import toast from "react-hot-toast";
import ImageUpload from "../Common/ImageUpload";

const ProfileTab = () => {
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(
    null
  );
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    avatar: "",
  });

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const authHeader = getAuthHeader();
        if (!authHeader) {
          toast.error("Vui lòng đăng nhập");
          return;
        }

        const response = await fetch("/api/auth/profile", {
          headers: {
            Authorization: authHeader,
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data.user) {
            const userData = result.data.user;
            // Format dateOfBirth from ISO to dd/MM/yyyy for display
            let dateOfBirthFormatted = "";
            if (userData.dateOfBirth) {
              const date = new Date(userData.dateOfBirth);
              const day = String(date.getDate()).padStart(2, "0");
              const month = String(date.getMonth() + 1).padStart(2, "0");
              const year = date.getFullYear();
              dateOfBirthFormatted = `${day}/${month}/${year}`;
            }
            setFormData({
              name: userData.name || "",
              email: userData.email || "",
              phone: userData.phone || "",
              dateOfBirth: dateOfBirthFormatted,
              gender: userData.gender || "",
              avatar: userData.avatar || "",
            });
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Không thể tải thông tin cá nhân");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const authHeader = getAuthHeader();
      if (!authHeader) {
        toast.error("Vui lòng đăng nhập");
        return;
      }

      // Upload avatar first if a new file is selected
      let avatarUrl = formData.avatar;
      if (selectedAvatarFile) {
        try {
          const uploadFormData = new FormData();
          uploadFormData.append("avatar", selectedAvatarFile);

          const uploadResponse = await fetch("/api/auth/upload-avatar", {
            method: "POST",
            headers: {
              Authorization: authHeader,
            },
            body: uploadFormData,
          });

          const uploadResult = await uploadResponse.json();

          if (uploadResponse.ok && uploadResult.success) {
            avatarUrl = uploadResult.data.avatarUrl;
            setSelectedAvatarFile(null);
          } else {
            toast.error(uploadResult.error || "Upload ảnh đại diện thất bại");
            return;
          }
        } catch (error) {
          console.error("Error uploading avatar:", error);
          toast.error("Upload ảnh đại diện thất bại");
          return;
        }
      }

      // Convert dd/MM/yyyy to ISO date string for API
      let dateOfBirthISO = null;
      if (formData.dateOfBirth) {
        // Check if format is dd/MM/yyyy
        const dateMatch = formData.dateOfBirth.match(
          /^(\d{2})\/(\d{2})\/(\d{4})$/
        );
        if (dateMatch) {
          const [, day, month, year] = dateMatch;
          dateOfBirthISO = new Date(`${year}-${month}-${day}`).toISOString();
        } else {
          // If already in ISO format (YYYY-MM-DD), use it directly
          dateOfBirthISO = formData.dateOfBirth;
        }
      }

      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({
          name: formData.name || null,
          phone: formData.phone || null,
          dateOfBirth: dateOfBirthISO,
          gender: formData.gender || null,
          avatar: avatarUrl || null,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Cập nhật thông tin thành công!");

        // Fetch updated user data from /api/auth/me to get full user info including roles
        try {
          const meResponse = await fetch("/api/auth/me", {
            headers: {
              Authorization: authHeader,
            },
          });

          if (meResponse.ok) {
            const meResult = await meResponse.json();
            if (meResult.success && meResult.data.user) {
              const fullUserData = meResult.data.user;
              // Update context with full user data
              updateUser({
                id: fullUserData.id,
                email: fullUserData.email,
                name: fullUserData.name,
                avatar: fullUserData.avatar,
                dateOfBirth: fullUserData.dateOfBirth,
                emailVerified: fullUserData.emailVerified,
                roles: fullUserData.roles || [],
              });
              // Update localStorage with full user data
              saveUser({
                id: fullUserData.id,
                email: fullUserData.email,
                name: fullUserData.name,
                avatar: fullUserData.avatar,
                dateOfBirth: fullUserData.dateOfBirth,
                emailVerified: fullUserData.emailVerified,
                roles: fullUserData.roles || [],
              });
            }
          }
        } catch (meError) {
          console.error("Error fetching updated user data:", meError);
          // Fallback: use profile data if /api/auth/me fails
          if (result.data.user) {
            const updatedUserData = result.data.user;
            updateUser({
              id: updatedUserData.id,
              email: updatedUserData.email,
              name: updatedUserData.name,
              avatar: updatedUserData.avatar,
              dateOfBirth: updatedUserData.dateOfBirth,
              emailVerified: updatedUserData.emailVerified,
              roles: user?.roles || [],
            });
            saveUser({
              id: updatedUserData.id,
              email: updatedUserData.email,
              name: updatedUserData.name,
              avatar: updatedUserData.avatar,
              dateOfBirth: updatedUserData.dateOfBirth,
              emailVerified: updatedUserData.emailVerified,
              roles: user?.roles || [],
            });
          }
        }
      } else {
        toast.error(result.error || "Cập nhật thông tin thất bại");
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Cập nhật thông tin thất bại");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (isLoading) {
    return (
      <div className="py-9.5 px-4 sm:px-7.5 xl:px-10">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue border-t-transparent mb-4"></div>
          <p className="text-dark-4">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="xl:max-w-[770px] w-full bg-white rounded-xl shadow-1 py-9.5 px-4 sm:px-7.5 xl:px-10">
      <h2 className="text-2xl font-bold text-dark mb-6">Thông tin cá nhân</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Upload */}
        <ImageUpload
          value={formData.avatar || user?.avatar || ""}
          onChange={(url, file) => {
            if (file) {
              setSelectedAvatarFile(file);
            } else {
              setSelectedAvatarFile(null);
              setFormData((prev) => ({ ...prev, avatar: url || "" }));
            }
          }}
          uploadEndpoint="/api/auth/upload-avatar"
          fieldName="avatar"
          accept="image/*"
          maxSize={5}
          aspectRatio="1/1"
          label="Ảnh đại diện"
          placeholder="Chọn ảnh đại diện"
          showRemoveButton={true}
          showPreview={true}
          autoUpload={false}
          userName={formData.name || user?.name || undefined}
          className="mb-4"
        />

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-dark mb-2">
            Tên hiển thị <span className="text-red">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
          />
        </div>

        {/* Email (readonly) */}
        <div>
          <label className="block text-sm font-medium text-dark mb-2">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            disabled
            className="w-full px-4 py-2 border border-gray-3 rounded-md bg-gray-1 text-dark-4 cursor-not-allowed"
          />
          <p className="text-xs text-dark-4 mt-1">Email không thể thay đổi</p>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-dark mb-2">
            Số điện thoại
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="0123456789"
            className="w-full px-4 py-2 border border-gray-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
          />
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-sm font-medium text-dark mb-2">
            Ngày sinh (dd/MM/yyyy)
          </label>
          <input
            type="text"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            placeholder="dd/MM/yyyy"
            pattern="\d{2}/\d{2}/\d{4}"
            className="w-full px-4 py-2 border border-gray-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
          />
          <p className="text-xs text-dark-4 mt-1">
            Định dạng: dd/MM/yyyy (ví dụ: 12/12/2001)
          </p>
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-dark mb-2">
            Giới tính
          </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
          >
            <option value="">Chọn giới tính</option>
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
            <option value="other">Khác</option>
          </select>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-blue text-white rounded-md hover:bg-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileTab;
