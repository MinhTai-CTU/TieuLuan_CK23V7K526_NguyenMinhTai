"use client";
import React, { useRef, useEffect } from "react";
import Image from "next/image";
import toast from "react-hot-toast";

interface ReviewableOrderItem {
  id: string;
  orderId: string;
  quantity: number;
  selectedOptions: any;
  productVariant: any;
  orderDate: string;
}

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  reviewableItems: ReviewableOrderItem[];
  onSubmit: (data: {
    rating: number;
    content: string | null;
    images: string[];
    orderItemId: string;
  }) => Promise<void>;
}

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg
    className={`fill-current ${filled ? "text-[#FBB040]" : "text-gray-5"}`}
    width="20"
    height="20"
    viewBox="0 0 15 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M14.6604 5.90785L9.97461 5.18335L7.85178 0.732874C7.69645 0.422375 7.28224 0.422375 7.12691 0.732874L5.00407 5.20923L0.344191 5.90785C0.0076444 5.9596 -0.121797 6.39947 0.137085 6.63235L3.52844 10.1255L2.72591 15.0158C2.67413 15.3522 3.01068 15.6368 3.32134 15.4298L7.54112 13.1269L11.735 15.4298C12.0198 15.5851 12.3822 15.3263 12.3046 15.0158L11.502 10.1255L14.8934 6.63235C15.1005 6.39947 14.9969 5.9596 14.6604 5.90785Z" />
  </svg>
);

const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  productId,
  reviewableItems,
  onSubmit,
}) => {
  const [rating, setRating] = React.useState(0);
  const [content, setContent] = React.useState("");
  const [images, setImages] = React.useState<string[]>([]);
  const [selectedOrderItemId, setSelectedOrderItemId] =
    React.useState<string>("");
  const [uploadingImages, setUploadingImages] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && reviewableItems.length > 0) {
      setSelectedOrderItemId(reviewableItems[0].id);
    }
  }, [isOpen, reviewableItems]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      // Reset form when closing
      setRating(0);
      setContent("");
      setImages([]);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleImageUpload = async (files: FileList) => {
    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    try {
      const token = localStorage.getItem("auth_token");
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("image", file);

        const response = await fetch("/api/reviews/upload-image", {
          method: "POST",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: formData,
        });

        const result = await response.json();
        if (result.success && result.data?.url) {
          uploadedUrls.push(result.data.url);
        } else {
          toast.error("Upload ảnh thất bại");
        }
      }

      setImages((prev) => [...prev, ...uploadedUrls]);
      toast.success(`Đã upload ${uploadedUrls.length} ảnh`);
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Upload ảnh thất bại");
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error("Vui lòng chọn số sao đánh giá");
      return;
    }

    if (!selectedOrderItemId) {
      toast.error("Vui lòng chọn đơn hàng để đánh giá");
      return;
    }

    if (!content && images.length === 0) {
      toast.error("Vui lòng nhập nội dung hoặc upload ảnh");
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit({
        rating,
        content: content || null,
        images,
        orderItemId: selectedOrderItemId,
      });
      onClose();
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[600px] mx-4 bg-white rounded-xl shadow-3 p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-gray-1 hover:bg-gray-2 transition-colors"
        >
          <svg
            className="fill-current text-dark"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <h2 className="font-medium text-2xl text-dark mb-6">Thêm đánh giá</h2>

        <form onSubmit={handleSubmit}>
          {/* Order Item Selection */}
          {reviewableItems.length > 1 && (
            <div className="mb-5">
              <label className="block mb-2.5 text-dark font-medium">
                Chọn đơn hàng để đánh giá*
              </label>
              <select
                value={selectedOrderItemId}
                onChange={(e) => setSelectedOrderItemId(e.target.value)}
                className="rounded-md border border-gray-3 bg-gray-1 w-full py-2.5 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20"
                required
              >
                {reviewableItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    Đơn hàng {item.orderId} -{" "}
                    {new Date(item.orderDate).toLocaleDateString("vi-VN")}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Rating */}
          <div className="mb-6">
            <label className="block mb-3 text-dark font-medium">
              Đánh giá của bạn*
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="cursor-pointer hover:scale-110 transition-transform"
                >
                  <StarIcon filled={star <= rating} />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-gray-5 text-sm">
                  {rating === 5
                    ? "Rất tốt"
                    : rating === 4
                      ? "Tốt"
                      : rating === 3
                        ? "Bình thường"
                        : rating === 2
                          ? "Không tốt"
                          : "Rất không tốt"}
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="mb-5">
            <label
              htmlFor="comments"
              className="block mb-2.5 text-dark font-medium"
            >
              Nội dung đánh giá
            </label>
            <textarea
              id="comments"
              rows={5}
              placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={250}
              className="rounded-md border border-gray-3 bg-gray-1 placeholder:text-dark-5 w-full p-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20"
            />
            <span className="flex items-center justify-between mt-2.5">
              <span className="text-custom-sm text-dark-4">
                Số lượng tối đa
              </span>
              <span className="text-custom-sm text-dark-4">
                {content.length}/250
              </span>
            </span>
          </div>

          {/* Image Upload */}
          <div className="mb-6">
            <label className="block mb-2.5 text-dark font-medium">
              Ảnh đánh giá (tùy chọn)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  handleImageUpload(e.target.files);
                }
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImages}
              className="rounded-md border border-gray-3 bg-gray-1 w-full py-2.5 px-5 outline-none duration-200 hover:bg-gray-2 disabled:opacity-50 text-dark"
            >
              {uploadingImages ? "Đang upload..." : "Chọn ảnh"}
            </button>
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative w-24 h-24 rounded-md overflow-hidden border border-gray-3"
                  >
                    <Image
                      src={img}
                      alt={`Upload ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 font-medium text-dark bg-gray-1 py-3 px-7 rounded-md ease-out duration-200 hover:bg-gray-2"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 font-medium text-white bg-blue py-3 px-7 rounded-md ease-out duration-200 hover:bg-blue-dark disabled:opacity-50"
            >
              {submitting ? "Đang gửi..." : "Gửi đánh giá"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
