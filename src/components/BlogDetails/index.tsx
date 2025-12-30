"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Breadcrumb from "../Common/Breadcrumb";
import Image from "next/image";
import { format } from "date-fns";
import { vi } from "date-fns/locale/vi";
import BlogReactions from "../Blog/BlogReactions";
import BlogComments from "../Blog/BlogComments";

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

const BlogDetails = () => {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");
  const [blog, setBlog] = useState<Blog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasIncrementedViews = useRef(false);

  useEffect(() => {
    if (!slug) {
      setIsLoading(false);
      return;
    }

    // Reset flag khi slug thay đổi
    hasIncrementedViews.current = false;

    const fetchBlog = async () => {
      try {
        setIsLoading(true);
        // Chỉ tăng views 1 lần, sử dụng query param để đánh dấu
        const viewKey = `blog_viewed_${slug}`;
        const hasViewed = sessionStorage.getItem(viewKey);

        const url = hasViewed
          ? `/api/blogs/${slug}?noIncrement=true`
          : `/api/blogs/${slug}`;

        const response = await fetch(url);
        const data = await response.json();
        console.log(data);

        if (data.success) {
          setBlog(data.data);
          // Đánh dấu đã xem trong session này
          if (!hasViewed) {
            sessionStorage.setItem(viewKey, "true");
          }
        } else {
          console.error("Error fetching blog:", data.error);
        }
      } catch (error) {
        console.error("Error fetching blog:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlog();
  }, [slug]);

  if (isLoading) {
    return (
      <>
        <Breadcrumb title={"Chi tiết bài viết"} pages={["blog details"]} />
        <section className="overflow-hidden py-20 bg-gray-2">
          <div className="max-w-[750px] w-full mx-auto px-4 sm:px-8 xl:px-0">
            <div className="text-center py-20">
              <div className="text-gray-400">Đang tải...</div>
            </div>
          </div>
        </section>
      </>
    );
  }

  if (!blog) {
    return (
      <>
        <Breadcrumb title={"Chi tiết bài viết"} pages={["blog details"]} />
        <section className="overflow-hidden py-20 bg-gray-2">
          <div className="max-w-[750px] w-full mx-auto px-4 sm:px-8 xl:px-0">
            <div className="text-center py-20">
              <p className="text-gray-500">Không tìm thấy bài viết</p>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Breadcrumb title={"Chi tiết bài viết"} pages={["blog details"]} />
      <section className="overflow-hidden py-20 bg-gray-2">
        <div className="max-w-[750px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          {blog.img && (
            <div className="rounded-[10px] overflow-hidden mb-7.5">
              <Image
                className="rounded-[10px] w-full h-auto max-h-[500px] object-cover"
                src={blog.img}
                alt={blog.title}
                width={750}
                height={477}
              />
            </div>
          )}

          <div>
            <span className="flex items-center gap-3 mb-4">
              <span className="text-gray-600">
                {format(new Date(blog.createdAt), "MMM dd, yyyy", {
                  locale: vi,
                })}
              </span>

              {/* <!-- divider --> */}
              <span className="block w-px h-4 bg-gray-4"></span>

              <span className="text-gray-600">
                {blog.views.toLocaleString()} Views
              </span>

              {blog.author && (
                <>
                  {/* <!-- divider --> */}
                  <span className="block w-px h-4 bg-gray-4"></span>
                  <span className="text-gray-600">
                    {blog.author.name || blog.author.email || "Ẩn danh"}
                  </span>
                </>
              )}
            </span>

            <h2 className="font-medium text-dark text-xl lg:text-2xl xl:text-custom-4xl mb-4">
              {blog.title}
            </h2>

            {blog.excerpt && (
              <p className="mb-6 text-gray-700 italic">{blog.excerpt}</p>
            )}

            {blog.content && (
              <div
                className="prose max-w-none prose-img:max-w-full prose-img:h-auto prose-img:max-h-[500px] prose-img:object-cover prose-img:rounded-lg"
                dangerouslySetInnerHTML={{ __html: blog.content }}
              />
            )}
          </div>

          {/* Reactions */}
          <BlogReactions blogSlug={blog.slug} />

          {/* Comments */}
          <BlogComments blogSlug={blog.slug} blogAuthorId={blog.authorId} />
        </div>
      </section>
    </>
  );
};

export default BlogDetails;
