"use client";

import React, { useState, useEffect } from "react";
import { getToken } from "@/lib/auth-storage";
import toast from "react-hot-toast";
import Image from "next/image";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";

interface BlogCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const BlogCreateModal: React.FC<BlogCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [img, setImg] = useState("");
  const [published, setPublished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      ImageExtension.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: "max-w-full h-auto max-h-[500px] object-cover rounded-lg",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
    ],
    content: "",
    immediatelyRender: false, // Tránh lỗi SSR hydration mismatch
    onUpdate: ({ editor }) => {
      // Content được lưu tự động qua editor.getHTML()
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] p-4 prose-img:max-w-full prose-img:h-auto prose-img:max-h-[500px] prose-img:object-cover prose-img:rounded-lg",
        spellcheck: "false",
      },
    },
  });

  // Reset editor và preview khi modal đóng
  useEffect(() => {
    if (!isOpen && editor) {
      editor.commands.clearContent();
      setImagePreview(null);
      setImg("");
    }
  }, [isOpen, editor]);

  const handleImageUpload = async (
    file: File,
    insertToEditor: boolean = false
  ) => {
    try {
      const formData = new FormData();
      formData.append("image", file); // Sử dụng "image" thay vì "avatar"

      const token = getToken();
      const response = await fetch("/api/blogs/upload-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (data.success && data.data?.imageUrl) {
        const imageUrl = data.data.imageUrl;

        if (insertToEditor) {
          // Chèn ảnh vào editor (khi upload từ toolbar)
          editor?.chain().focus().setImage({ src: imageUrl }).run();
          toast.success("Upload ảnh thành công!");
        } else {
          // Lưu URL ảnh vào state img để hiển thị trong blog card (ảnh đại diện)
          setImg(imageUrl);
          // Cập nhật preview
          setImagePreview(imageUrl);
          toast.success("Upload ảnh đại diện thành công!");
        }

        return imageUrl;
      } else {
        toast.error(data.error || "Không thể upload ảnh");
        return null;
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Có lỗi xảy ra khi upload ảnh");
      return null;
    }
  };

  // Handler cho ảnh đại diện (không chèn vào editor)
  const handleImageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Kiểm tra kích thước (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Kích thước ảnh không được vượt quá 5MB");
        return;
      }

      // Kiểm tra loại file
      if (!file.type.startsWith("image/")) {
        toast.error("Vui lòng chọn file ảnh");
        return;
      }

      // Hiển thị preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload ảnh đại diện (không chèn vào editor)
      setIsUploadingImage(true);
      handleImageUpload(file, false).finally(() => {
        setIsUploadingImage(false);
      });
    }
    // Reset input
    e.target.value = "";
  };

  // Handler cho ảnh trong editor (chèn vào editor, không lưu vào img state)
  const handleEditorImageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Kiểm tra kích thước (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Kích thước ảnh không được vượt quá 5MB");
        return;
      }

      // Kiểm tra loại file
      if (!file.type.startsWith("image/")) {
        toast.error("Vui lòng chọn file ảnh");
        return;
      }

      // Upload và chèn vào editor
      setIsUploadingImage(true);
      handleImageUpload(file, true).finally(() => {
        setIsUploadingImage(false);
      });
    }
    // Reset input
    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề");
      return;
    }

    const htmlContent = editor?.getHTML() || "";
    if (!htmlContent.trim() || htmlContent === "<p></p>") {
      toast.error("Vui lòng nhập nội dung");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = getToken();
      if (!token) {
        toast.error("Vui lòng đăng nhập");
        return;
      }

      const response = await fetch("/api/blogs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          content: htmlContent,
          excerpt,
          img: img || null,
          published,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Tạo bài viết thành công!");
        // Reset form
        setTitle("");
        setExcerpt("");
        setImg("");
        setPublished(false);
        editor?.commands.clearContent();
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || "Không thể tạo bài viết");
      }
    } catch (error) {
      console.error("Error creating blog:", error);
      toast.error("Có lỗi xảy ra khi tạo bài viết");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  if (!editor) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-xl p-8 relative z-[10000]">
          <p className="text-gray-500">Đang tải editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4 relative z-[10000]">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-[10001]">
          <h2 className="text-2xl font-bold text-dark">Thêm bài viết mới</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-dark mb-2">
              Tiêu đề <span className="text-red">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue"
              placeholder="Nhập tiêu đề bài viết"
              required
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium text-dark mb-2">
              Mô tả ngắn
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue"
              placeholder="Nhập mô tả ngắn (tùy chọn)"
              rows={3}
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-dark mb-2">
              Ảnh đại diện
            </label>
            <div className="space-y-3">
              {/* Upload button */}
              <label className="block">
                <span className="sr-only">Chọn ảnh</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageInput}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue file:text-white hover:file:bg-blue-dark cursor-pointer"
                  disabled={isUploadingImage}
                />
              </label>

              {/* Preview */}
              {imagePreview && (
                <div className="relative inline-block">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    width={300}
                    height={200}
                    className="rounded-md object-cover border border-gray-300"
                    onError={() => setImagePreview(null)}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setImg("");
                    }}
                    className="absolute top-2 right-2 bg-red text-white rounded-full p-1 hover:bg-red-dark transition-colors"
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

              {/* URL input (fallback) */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Hoặc nhập URL ảnh
                </label>
                <input
                  type="text"
                  value={img}
                  onChange={(e) => {
                    setImg(e.target.value);
                    if (e.target.value) {
                      setImagePreview(e.target.value);
                    } else {
                      setImagePreview(null);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue text-sm"
                  placeholder="Nhập URL ảnh (tùy chọn)"
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-dark mb-2">
              Nội dung <span className="text-red">*</span>
            </label>

            {/* Toolbar */}
            <div className="border border-gray-300 rounded-t-md bg-gray-50 p-2 flex flex-wrap gap-2 relative z-[10002]">
              {/* Bold */}
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`px-3 py-1 rounded ${
                  editor.isActive("bold")
                    ? "bg-blue text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                <strong>B</strong>
              </button>

              {/* Italic */}
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`px-3 py-1 rounded ${
                  editor.isActive("italic")
                    ? "bg-blue text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                <em>I</em>
              </button>

              {/* Underline */}
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={`px-3 py-1 rounded ${
                  editor.isActive("underline")
                    ? "bg-blue text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                <u>U</u>
              </button>

              {/* Divider */}
              <div className="w-px bg-gray-300 mx-1" />

              {/* Heading 1 */}
              <button
                type="button"
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 1 }).run()
                }
                className={`px-3 py-1 rounded ${
                  editor.isActive("heading", { level: 1 })
                    ? "bg-blue text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                H1
              </button>

              {/* Heading 2 */}
              <button
                type="button"
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
                className={`px-3 py-1 rounded ${
                  editor.isActive("heading", { level: 2 })
                    ? "bg-blue text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                H2
              </button>

              {/* Divider */}
              <div className="w-px bg-gray-300 mx-1" />

              {/* Bullet List */}
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`px-3 py-1 rounded ${
                  editor.isActive("bulletList")
                    ? "bg-blue text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                •
              </button>

              {/* Ordered List */}
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`px-3 py-1 rounded ${
                  editor.isActive("orderedList")
                    ? "bg-blue text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                1.
              </button>

              {/* Divider */}
              <div className="w-px bg-gray-300 mx-1" />

              {/* Link */}
              <button
                type="button"
                onClick={() => {
                  const url = window.prompt("Nhập URL:");
                  if (url) {
                    editor.chain().focus().setLink({ href: url }).run();
                  }
                }}
                className={`px-3 py-1 rounded ${
                  editor.isActive("link")
                    ? "bg-blue text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                🔗
              </button>

              {/* Image Upload */}
              <label className="px-3 py-1 rounded bg-white text-gray-700 hover:bg-gray-100 cursor-pointer">
                📷
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleEditorImageInput}
                  className="hidden"
                />
              </label>

              {/* Divider */}
              <div className="w-px bg-gray-300 mx-1" />

              {/* Undo */}
              <button
                type="button"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                className="px-3 py-1 rounded bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ↶
              </button>

              {/* Redo */}
              <button
                type="button"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                className="px-3 py-1 rounded bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ↷
              </button>
            </div>

            {/* Editor */}
            <div className="min-h-[400px] border-x border-b border-gray-300 rounded-b-md overflow-hidden bg-white relative z-[10001]">
              <EditorContent editor={editor} />
            </div>
          </div>

          {/* Published */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="published"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="w-4 h-4 text-blue border-gray-300 rounded focus:ring-blue"
            />
            <label htmlFor="published" className="text-sm text-dark">
              Xuất bản ngay
            </label>
            <span className="text-xs text-gray-500 ml-2">
              (Nếu bỏ chọn, bài viết sẽ ở chế độ nháp và chỉ admin mới thấy)
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-white bg-blue rounded-md hover:bg-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang lưu..." : "Lưu bài viết"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BlogCreateModal;
