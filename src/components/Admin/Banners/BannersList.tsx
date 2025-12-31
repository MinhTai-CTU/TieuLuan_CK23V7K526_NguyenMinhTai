"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { getToken } from "@/lib/auth-storage";
import toast from "react-hot-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// --- INTERFACES ---

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image: string;
  link: string | null;
  buttonText: string | null;
  bgGradient: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FlashSaleConfig {
  tagline: string;
  title: string;
  description: string;
  endDate: string;
  image: string;
  link: string;
  buttonText: string;
  isActive: boolean;
}

export default function BannersList() {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<"slider" | "flash_sale">("slider");

  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal & Dialog states
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Form Data cho Slider
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    image: "",
    link: "",
    buttonText: "",
    bgGradient: "",
    order: 0,
    isActive: true,
  });

  const [flashSaleData, setFlashSaleData] = useState<FlashSaleConfig>({
    tagline: "",
    title: "",
    description: "",
    endDate: "",
    image: "", // Nếu muốn hiện ảnh placeholder thì để chuỗi rỗng
    link: "",
    buttonText: "",
    isActive: true,
  });

  // const [flashSaleData, setFlashSaleData] = useState<FlashSaleConfig>({
  //   tagline: "Cơ hội cuối cùng trong năm",
  //   title: "Siêu Sale Công Nghệ - Giảm đến 50%",
  //   description:
  //     "Săn ngay iPhone 15, MacBook và phụ kiện chính hãng với giá cực sốc. Số lượng có hạn!",
  //   endDate: "2025-12-31T23:59:59",
  //   image: "",
  //   link: "/collections/tech-flash-sale",
  //   buttonText: "Săn Deal Ngay",
  //   isActive: true,
  // });

  const [previewTime, setPreviewTime] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (!flashSaleData.endDate) {
      setPreviewTime({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }

    const calculateTime = () => {
      const endTime = new Date(flashSaleData.endDate).getTime();
      const now = new Date().getTime();
      const distance = endTime - now;

      if (distance <= 0) {
        setPreviewTime({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setPreviewTime({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor(
            (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          ),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    };

    calculateTime();

    const timer = setInterval(calculateTime, 1000);

    return () => clearInterval(timer);
  }, [flashSaleData.endDate]);

  const formatNumber = (num: number) => (num < 10 ? `0${num}` : num.toString());

  useEffect(() => {
    fetchBanners();
    fetchFlashSaleConfig();
  }, []);

  const fetchBanners = async () => {
    try {
      const token = getToken();
      if (!token) {
        // toast.error("Vui lòng đăng nhập lại");
        setLoading(false);
        return;
      }
      // api/admin/banners?type=SLIDER
      const response = await fetch("/api/admin/banners?type=SLIDER", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setBanners(data.data || []);
        setError(null);
      } else {
        throw new Error(data.error || "Không thể tải danh sách banners");
      }
    } catch (error) {
      console.error("Error fetching banners:", error);
      setError(error instanceof Error ? error.message : "Lỗi tải banners");
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFlashSaleConfig = async () => {
    try {
      const token = getToken();
      const response = await fetch("/api/admin/banners?type=FLASH_SALE", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      console.log(data);

      if (response.ok && data.success) {
        const banner = data.data;
        console.log("banner", banner);
        setFlashSaleData({
          tagline: banner.tagline || "",
          title: banner.title || "",
          description: banner.description || "",
          // Chuyển đổi format ngày cho input datetime-local (YYYY-MM-DDTHH:mm)
          endDate: banner.endDate
            ? new Date(banner.endDate).toISOString().slice(0, 16)
            : "",
          image: banner.image || "",
          link: banner.link || "",
          buttonText: banner.buttonText || "",
          isActive: banner.isActive,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    isFlashSale = false
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Validate file
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Chỉ chấp nhận file ảnh: JPEG, PNG, WebP");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước file tối đa là 5MB");
      return;
    }

    setIsUploading(true);

    try {
      const token = getToken();
      if (!token) {
        toast.error("Vui lòng đăng nhập lại");
        return;
      }

      // 2. Tạo FormData để gửi file lên Server
      const uploadFormData = new FormData();
      uploadFormData.append("image", file);

      const response = await fetch("/api/admin/banners/upload-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadFormData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Lấy đường dẫn thật từ Server trả về (VD: /uploads/image-123.png)
        const imageUrl = data.data.imageUrl;

        // 4. Cập nhật vào State tương ứng
        if (isFlashSale) {
          // Nếu là Flash Sale
          setFlashSaleData({ ...flashSaleData, image: imageUrl });
        } else {
          // Nếu là Slider
          setFormData({ ...formData, image: imageUrl });
          setImagePreview(imageUrl);
        }

        toast.success("Đã upload ảnh thành công");
      } else {
        toast.error(data.error || "Không thể upload ảnh");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Lỗi kết nối khi upload ảnh");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = getToken();
      if (!token) {
        toast.error("Vui lòng đăng nhập lại");
        return;
      }

      const url = editingBanner
        ? `/api/admin/banners/${editingBanner.id}`
        : "/api/admin/banners";
      const method = editingBanner ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(
          editingBanner ? "Đã cập nhật banner" : "Đã tạo banner mới"
        );
        closeModal();
        fetchBanners();
      } else {
        toast.error(data.error || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Error saving banner:", error);
      toast.error("Không thể lưu banner");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setBannerToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!bannerToDelete) return;
    setIsSubmitting(true);
    try {
      const token = getToken();
      if (!token) {
        toast.error("Vui lòng đăng nhập lại");
        return;
      }

      const response = await fetch(`/api/admin/banners/${bannerToDelete}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Đã xóa banner");
        fetchBanners();
        setDeleteDialogOpen(false);
        setBannerToDelete(null);
      } else {
        toast.error(data.error || "Không thể xóa banner");
      }
    } catch (error) {
      console.error("Error deleting banner:", error);
      toast.error("Không thể xóa banner");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActive = async (banner: Banner) => {
    try {
      const token = getToken();
      if (!token) {
        toast.error("Vui lòng đăng nhập lại");
        return;
      }

      const response = await fetch(`/api/admin/banners/${banner.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !banner.isActive }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(!banner.isActive ? "Đã kích hoạt" : "Đã vô hiệu hóa");
        fetchBanners();
      } else {
        toast.error(data.error || "Lỗi cập nhật");
      }
    } catch (error) {
      toast.error("Lỗi cập nhật banner");
    }
  };

  // --- HELPER FUNCTIONS ---

  const openCreateModal = () => {
    setEditingBanner(null);
    setFormData({
      title: "",
      subtitle: "",
      description: "",
      image: "",
      link: "",
      buttonText: "",
      bgGradient: "",
      order: banners.length,
      isActive: true,
    });
    setShowModal(true);
  };

  const openEditModal = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || "",
      description: banner.description || "",
      image: banner.image,
      link: banner.link || "",
      buttonText: banner.buttonText || "",
      bgGradient: banner.bgGradient || "",
      order: banner.order,
      isActive: banner.isActive,
    });
    setImagePreview(banner.image);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBanner(null);
    setFormData({
      title: "",
      subtitle: "",
      description: "",
      image: "",
      link: "",
      buttonText: "",
      bgGradient: "",
      order: 0,
      isActive: true,
    });
    setImagePreview(null);
  };

  const handleSaveFlashSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = getToken();
      // Gọi vào route riêng biệt chúng ta vừa tạo ở bước 2
      const response = await fetch("/api/admin/banners/flash-sale", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(flashSaleData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Đã lưu cấu hình Flash Sale!");
      } else {
        toast.error(data.error || "Lỗi khi lưu");
      }
    } catch (error) {
      toast.error("Lỗi kết nối");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDER ---

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue border-t-transparent mb-4"></div>
          <p className="text-gray-500">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* --- TABS NAVIGATION --- */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("slider")}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${
                activeTab === "slider"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }
            `}
          >
            Slider Trang Chủ
          </button>
          <button
            onClick={() => setActiveTab("flash_sale")}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${
                activeTab === "flash_sale"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }
            `}
          >
            Flash Sale / Đếm Ngược
          </button>
        </nav>
      </div>

      {/* --- TAB 1: SLIDER LIST (Code gốc được khôi phục) --- */}
      {activeTab === "slider" && (
        <>
          <div className="flex items-center justify-end">
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue text-white rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Thêm banner
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {banners.length === 0 ? (
              <div className="p-12 text-center">
                <svg
                  className="w-16 h-16 text-gray-300 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-gray-500 font-medium">Chưa có banner nào</p>
                <button
                  onClick={openCreateModal}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Thêm banner đầu tiên
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 via-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Hình ảnh
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Tiêu đề
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Thứ tự
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {banners.map((banner) => (
                      <tr key={banner.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                            <Image
                              src={banner.image}
                              alt={banner.title}
                              fill
                              className="object-cover"
                              unoptimized={banner.image.startsWith("/uploads/")}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {banner.title}
                            </p>
                            {banner.subtitle && (
                              <p className="text-xs text-gray-500 mt-1">
                                {banner.subtitle}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {banner.order}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleActive(banner)}
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                              banner.isActive
                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${banner.isActive ? "bg-green-500" : "bg-gray-400"}`}
                            ></span>
                            {banner.isActive ? "Hoạt động" : "Vô hiệu"}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(banner)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => handleDeleteClick(banner.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* --- TAB 2: FLASH SALE (Giao diện mới) --- */}
      {activeTab === "flash_sale" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Cấu Hình */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Cấu hình Banner Flash Sale
              </h3>
              <form onSubmit={handleSaveFlashSale} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={flashSaleData.tagline}
                    onChange={(e) =>
                      setFlashSaleData({
                        ...flashSaleData,
                        tagline: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tiêu đề chính
                  </label>
                  <input
                    type="text"
                    value={flashSaleData.title}
                    onChange={(e) =>
                      setFlashSaleData({
                        ...flashSaleData,
                        title: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mô tả phụ
                  </label>
                  <input
                    type="text"
                    value={flashSaleData.description}
                    onChange={(e) =>
                      setFlashSaleData({
                        ...flashSaleData,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Kết thúc (Countdown)
                    </label>
                    <input
                      type="datetime-local"
                      value={flashSaleData.endDate}
                      onChange={(e) =>
                        setFlashSaleData({
                          ...flashSaleData,
                          endDate: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Text nút bấm
                    </label>
                    <input
                      type="text"
                      value={flashSaleData.buttonText}
                      onChange={(e) =>
                        setFlashSaleData({
                          ...flashSaleData,
                          buttonText: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Hình ảnh sản phẩm
                  </label>
                  <div className="flex gap-4 items-center">
                    <label className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer text-sm font-medium transition-colors">
                      Chọn ảnh
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, true)}
                      />
                    </label>
                    <input
                      type="text"
                      value={flashSaleData.image}
                      onChange={(e) =>
                        setFlashSaleData({
                          ...flashSaleData,
                          image: e.target.value,
                        })
                      }
                      placeholder="URL hình ảnh"
                      className="flex-1 px-4 py-2 border rounded-lg text-sm text-gray-600"
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t mt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      Trạng thái:
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setFlashSaleData({
                          ...flashSaleData,
                          isActive: !flashSaleData.isActive,
                        })
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${flashSaleData.isActive ? "bg-blue-600" : "bg-gray-200"}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${flashSaleData.isActive ? "translate-x-6" : "translate-x-1"}`}
                      />
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-blue text-white rounded-lg hover:bg-blue-600 font-medium shadow-sm transition-all"
                  >
                    {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </div>
              </form>
            </div>

            {/* Preview */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-500 uppercase mb-4 tracking-wider">
                Xem trước
              </h4>

              <div className="bg-blue-50 rounded-2xl p-8 relative overflow-hidden min-h-[300px] flex items-center">
                <div className="grid grid-cols-2 gap-4 w-full relative z-10">
                  <div className="space-y-4">
                    <div>
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-bold mb-2">
                        {flashSaleData.tagline}
                      </span>
                      <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                        {flashSaleData.title}
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        {flashSaleData.description}
                      </p>
                    </div>

                    <div className="flex gap-2 text-center">
                      {[
                        { value: previewTime.days, label: "Ngày" },
                        { value: previewTime.hours, label: "Giờ" },
                        { value: previewTime.minutes, label: "Phút" },
                        { value: previewTime.seconds, label: "Giây" },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="bg-white rounded-lg p-2 min-w-[50px] shadow-sm text-center"
                        >
                          <div className="text-lg font-bold text-gray-900">
                            {formatNumber(item.value)}
                          </div>
                          <div className="text-[10px] text-gray-500 uppercase">
                            {item.label}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-200">
                      {flashSaleData.buttonText} &gt;
                    </button>
                  </div>

                  <div className="flex items-center justify-center relative">
                    <div className="relative w-48 h-48">
                      {flashSaleData.image ? (
                        <img
                          src={flashSaleData.image}
                          alt="Product"
                          className="w-full h-full object-contain drop-shadow-xl"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 rounded-full animate-pulse flex items-center justify-center text-gray-400 text-xs">
                          No Image
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL CREATE/EDIT SLIDER (Code gốc được khôi phục) --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingBanner ? "Chỉnh sửa Banner" : "Thêm Banner Mới"}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tiêu đề <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phụ đề
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) =>
                      setFormData({ ...formData, subtitle: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mô tả
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Hình ảnh <span className="text-red-500">*</span>
                  </label>
                  <div className="mb-3">
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue text-white rounded-lg hover:bg-blue-600 transition-all cursor-pointer">
                      <span>{isUploading ? "Đang upload..." : "Chọn ảnh"}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={(e) => handleImageUpload(e, false)}
                        className="hidden"
                        disabled={isUploading}
                      />
                    </label>
                  </div>

                  {imagePreview && (
                    <div className="mb-3 relative">
                      <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-300 bg-gray-100">
                        <Image
                          src={imagePreview}
                          alt="Preview"
                          fill
                          className="object-contain"
                          unoptimized={
                            imagePreview.startsWith("/uploads/") ||
                            imagePreview.startsWith("blob:")
                          }
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setFormData({ ...formData, image: "" });
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  )}

                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) => {
                      setFormData({ ...formData, image: e.target.value });
                      setImagePreview(e.target.value || null);
                    }}
                    placeholder="Hoặc nhập URL hình ảnh"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Link
                  </label>
                  <input
                    type="text"
                    value={formData.link}
                    onChange={(e) =>
                      setFormData({ ...formData, link: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Text nút
                  </label>
                  <input
                    type="text"
                    value={formData.buttonText}
                    onChange={(e) =>
                      setFormData({ ...formData, buttonText: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Gradient Background
                  </label>
                  <input
                    type="text"
                    value={formData.bgGradient}
                    onChange={(e) =>
                      setFormData({ ...formData, bgGradient: e.target.value })
                    }
                    placeholder="from-blue-500 via-blue-600 to-purple-600"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Thứ tự
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formData.order}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          order: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Trạng thái
                    </label>
                    <select
                      value={formData.isActive ? "true" : "false"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isActive: e.target.value === "true",
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="true">Hoạt động</option>
                      <option value="false">Vô hiệu</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-blue hover:bg-blue-600 rounded-lg transition-all flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Đang lưu...</span>
                      </>
                    ) : (
                      <span>{editingBanner ? "Cập nhật" : "Tạo mới"}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE DIALOG --- */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa banner</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa banner này? Hành động này không thể hoàn
              tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
