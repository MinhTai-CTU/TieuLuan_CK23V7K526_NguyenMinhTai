"use client";
import React, { useState, useRef } from "react";
import Image from "next/image";
import toast from "react-hot-toast";

interface ImageUploadProps {
  value?: string | null; // Current image URL
  onChange: (url: string | null, file?: File | null) => void; // Callback when image changes (url, file)
  onUploadStart?: () => void; // Callback when upload starts
  onUploadEnd?: () => void; // Callback when upload ends
  uploadEndpoint?: string; // API endpoint for upload (default: /api/auth/upload-avatar)
  fieldName?: string; // Form field name (default: "avatar")
  accept?: string; // Accept file types (default: "image/*")
  maxSize?: number; // Max file size in MB (default: 5)
  allowedTypes?: string[]; // Allowed MIME types
  aspectRatio?: string; // Aspect ratio for preview (e.g., "1/1" for square)
  showPreview?: boolean; // Show preview (default: true)
  className?: string; // Additional CSS classes
  label?: string; // Label text
  required?: boolean; // Is required
  disabled?: boolean; // Is disabled
  placeholder?: string; // Placeholder text
  showRemoveButton?: boolean; // Show remove button (default: true)
  autoUpload?: boolean; // Auto upload when file selected (default: true)
  defaultImage?: string; // Default image URL when no image
  userName?: string; // User name to display initial letter when no avatar
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  onUploadStart,
  onUploadEnd,
  uploadEndpoint = "/api/auth/upload-avatar",
  fieldName = "avatar",
  accept = "image/*",
  maxSize = 5,
  allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  aspectRatio,
  showPreview = true,
  className = "",
  label,
  required = false,
  disabled = false,
  placeholder = "Chọn ảnh để upload",
  showRemoveButton = true,
  autoUpload = true,
  defaultImage,
  userName,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  // Initialize preview: use value if it's a valid non-empty string, otherwise use defaultImage
  const getInitialPreview = () => {
    if (value && value.trim() !== "") {
      // Handle Next.js Image optimization URL
      if (value.includes("/_next/image?url=")) {
        try {
          const urlMatch = value.match(/url=([^&]+)/);
          if (urlMatch) {
            return decodeURIComponent(urlMatch[1]);
          }
        } catch {
          // Fall through to return value
        }
      }
      return value;
    }
    return defaultImage || null;
  };
  const [preview, setPreview] = useState<string | null>(getInitialPreview());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview when value changes
  React.useEffect(() => {
    // If there's a selected file, don't update preview (keep showing the file preview)
    if (selectedFile) {
      return;
    }

    // Process value to get the actual image URL
    let imageUrl: string | null = null;

    if (value && value.trim() !== "") {
      // Handle Next.js Image optimization URL
      if (value.includes("/_next/image?url=")) {
        // Extract the actual URL from Next.js optimized URL
        try {
          const urlMatch = value.match(/url=([^&]+)/);
          if (urlMatch) {
            imageUrl = decodeURIComponent(urlMatch[1]);
          } else {
            imageUrl = value;
          }
        } catch {
          imageUrl = value;
        }
      } else {
        imageUrl = value;
      }
    } else if (defaultImage) {
      imageUrl = defaultImage;
    }

    // Update preview
    setPreview(imageUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, defaultImage, selectedFile]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      toast.error(
        `Định dạng file không hợp lệ. Chỉ chấp nhận: ${allowedTypes.join(", ")}`
      );
      return;
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      toast.error(`Kích thước file quá lớn. Tối đa ${maxSize}MB`);
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Store selected file
    setSelectedFile(file);

    if (autoUpload) {
      // Upload file immediately
      setIsUploading(true);
      onUploadStart?.();

      try {
        const formData = new FormData();
        formData.append(fieldName, file);

        const authHeader = localStorage.getItem("auth_token")
          ? `Bearer ${localStorage.getItem("auth_token")}`
          : "";

        const response = await fetch(uploadEndpoint, {
          method: "POST",
          headers: {
            Authorization: authHeader,
          },
          body: formData,
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // Handle different response formats
          const imageUrl =
            result.data?.avatarUrl ||
            result.data?.url ||
            result.data?.imageUrl ||
            result.avatarUrl ||
            result.url ||
            result.imageUrl;

          if (imageUrl) {
            onChange(imageUrl, null);
            setSelectedFile(null);
            toast.success("Upload ảnh thành công!");
          } else {
            toast.error("Không nhận được URL ảnh từ server");
            setPreview(value || defaultImage || null);
            setSelectedFile(null);
          }
        } else {
          toast.error(result.error || "Upload ảnh thất bại");
          setPreview(value || defaultImage || null); // Revert preview
          setSelectedFile(null);
        }
      } catch (error) {
        console.error("Error uploading file:", error);
        toast.error("Upload ảnh thất bại");
        setPreview(value || defaultImage || null); // Revert preview
        setSelectedFile(null);
      } finally {
        setIsUploading(false);
        onUploadEnd?.();
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } else {
      // Just preview, don't upload yet
      onChange(null, file);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    // Reset to default image or null
    if (defaultImage) {
      setPreview(defaultImage);
    } else {
      setPreview(null);
    }
    onChange(null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-dark mb-2">
          {label}
          {required && <span className="text-red ml-1">*</span>}
        </label>
      )}

      <div className="flex items-start gap-4">
        {/* Preview - Clickable */}
        {showPreview && (
          <div
            className={`relative flex-shrink-0 ${
              aspectRatio ? `aspect-[${aspectRatio}]` : ""
            } ${!disabled ? "cursor-pointer" : ""}`}
            style={
              aspectRatio
                ? {
                    aspectRatio,
                    maxWidth: "200px",
                    maxHeight: "200px",
                    width: "200px",
                    height: "200px",
                  }
                : {
                    width: "200px",
                    height: "200px",
                    maxWidth: "200px",
                    maxHeight: "200px",
                  }
            }
            onClick={!disabled ? handleClick : undefined}
            title={!disabled ? "Click để chọn ảnh" : ""}
          >
            {preview ? (
              <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-gray-3 hover:border-blue transition-colors max-w-full max-h-full">
                {preview.startsWith("/uploads/") ||
                preview.startsWith("data:") ? (
                  // Use regular img tag for local uploads and data URLs (Next.js Image doesn't work well with these)
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error("Image load error:", preview);
                      // Fallback to default image if current image fails to load
                      if (defaultImage && preview !== defaultImage) {
                        setPreview(defaultImage);
                      }
                    }}
                  />
                ) : (
                  // Use Next.js Image for other URLs
                  <Image
                    src={preview}
                    alt="Preview"
                    fill
                    className="object-cover"
                    unoptimized={
                      preview.startsWith("http://") ||
                      preview.startsWith("https://") ||
                      preview.startsWith("/_next/image")
                    }
                    onError={(e) => {
                      console.error("Image load error:", preview);
                      // Fallback to default image if current image fails to load
                      if (defaultImage && preview !== defaultImage) {
                        setPreview(defaultImage);
                      }
                    }}
                  />
                )}
                {showRemoveButton && !disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove();
                    }}
                    className="absolute top-0 right-0 bg-red text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700 transition-colors z-10"
                    title="Xóa ảnh"
                  >
                    ×
                  </button>
                )}
                {!disabled && (
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs opacity-0 hover:opacity-100 transition-opacity">
                      Thay đổi
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full rounded-full bg-gray-3 flex items-center justify-center border-2 border-dashed border-gray-3 hover:border-blue transition-colors">
                {userName ? (
                  <span className="text-2xl text-dark-4 font-semibold">
                    {userName[0].toUpperCase()}
                  </span>
                ) : (
                  <span className="text-3xl text-dark-4">+</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Upload Button */}
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            disabled={disabled || isUploading}
            className="hidden"
          />
          <button
            type="button"
            onClick={handleClick}
            disabled={disabled || isUploading}
            className={`px-4 py-2 border border-gray-3 rounded-md text-sm font-medium transition-colors ${
              disabled || isUploading
                ? "bg-gray-1 text-dark-4 cursor-not-allowed"
                : "bg-white text-dark hover:bg-gray-2 cursor-pointer"
            }`}
          >
            {isUploading ? "Đang upload..." : placeholder}
          </button>
          <p className="text-xs text-dark-4 mt-1">
            Tối đa {maxSize}MB. Định dạng: {allowedTypes.join(", ")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;
