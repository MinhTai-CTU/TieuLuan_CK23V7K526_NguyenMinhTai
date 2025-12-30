"use client";

import React, { useState, useEffect } from "react";
import Breadcrumb from "../Common/Breadcrumb";
import BlogItem from "../Blog/BlogItem";
import BlogCreateModal from "../Blog/BlogCreateModal";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { vi } from "date-fns/locale/vi";

interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  img: string | null;
  views: number;
  published: boolean;
  authorId: string | null;
  author: {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

const BlogGrid = () => {
  const { user, isAuthenticated } = useAuth();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchBlogs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/blogs");
      const data = await response.json();

      if (data.success) {
        setBlogs(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleSuccess = () => {
    fetchBlogs();
  };

  return (
    <>
      <Breadcrumb title={"Danh sách bài viết"} pages={["blog grid"]} />
      <section className="overflow-hidden py-20 bg-gray-2">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          {/* Header với nút Thêm bài viết */}
          <div className="flex items-center justify-end mb-10">
            {isAuthenticated && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-blue text-white rounded-md hover:bg-blue-dark transition-colors font-medium"
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
                Thêm bài viết
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-gray-400">Đang tải...</div>
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500">Chưa có bài viết nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-10 gap-x-7.5">
              {blogs.map((blog) => (
                <BlogItem
                  key={blog.id}
                  blog={{
                    id: blog.id,
                    slug: blog.slug,
                    title: blog.title,
                    img: blog.img || "/images/blog/blog-01.jpg",
                    date: format(new Date(blog.createdAt), "MMM dd, yyyy", {
                      locale: vi,
                    }),
                    views: blog.views,
                    authorName:
                      blog.author?.name || blog.author?.email || "Ẩn danh",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Modal thêm bài viết */}
      {isAuthenticated && (
        <BlogCreateModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
};

export default BlogGrid;
