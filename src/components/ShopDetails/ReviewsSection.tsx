"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import ReviewModal from "./ReviewModal";

interface Review {
  id: string;
  rating: number;
  content: string | null;
  images: string[];
  adminResponse: string | null;
  adminResponseAt: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
  };
  orderItem: {
    id: string;
    selectedOptions: any;
  };
}

interface ReviewableOrderItem {
  id: string;
  orderId: string;
  quantity: number;
  selectedOptions: any;
  productVariant: any;
  orderDate: string;
}

interface ReviewsSectionProps {
  productId: string;
  onReviewsUpdate?: (reviews: Review[]) => void;
}

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg
    className={`fill-current ${filled ? "text-[#FBB040]" : "text-gray-5"}`}
    width="15"
    height="16"
    viewBox="0 0 15 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M14.6604 5.90785L9.97461 5.18335L7.85178 0.732874C7.69645 0.422375 7.28224 0.422375 7.12691 0.732874L5.00407 5.20923L0.344191 5.90785C0.0076444 5.9596 -0.121797 6.39947 0.137085 6.63235L3.52844 10.1255L2.72591 15.0158C2.67413 15.3522 3.01068 15.6368 3.32134 15.4298L7.54112 13.1269L11.735 15.4298C12.0198 15.5851 12.3822 15.3263 12.3046 15.0158L11.502 10.1255L14.8934 6.63235C15.1005 6.39947 14.9969 5.9596 14.6604 5.90785Z" />
  </svg>
);

const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  productId,
  onReviewsUpdate,
}) => {
  const { isAuthenticated, user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewableItems, setReviewableItems] = useState<ReviewableOrderItem[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  // Calculate rating statistics
  const ratingStats = React.useMemo(() => {
    const stats = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((review) => {
      stats[review.rating as keyof typeof stats]++;
    });
    return stats;
  }, [reviews]);

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`/api/products/${productId}/reviews`);
        const result = await response.json();
        if (result.success) {
          setReviews(result.data);
          onReviewsUpdate?.(result.data);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchReviews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]); // Chỉ phụ thuộc vào productId, không phụ thuộc vào onReviewsUpdate để tránh infinite loop

  // Fetch reviewable order items
  useEffect(() => {
    const fetchReviewableItems = async () => {
      if (!isAuthenticated || !productId) return;

      try {
        const token = localStorage.getItem("auth_token");
        const response = await fetch(
          `/api/products/${productId}/reviewable-orders`,
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
            },
          }
        );
        const result = await response.json();
        if (result.success) {
          setReviewableItems(result.data);
        }
      } catch (error) {
        console.error("Error fetching reviewable items:", error);
      }
    };

    fetchReviewableItems();
  }, [isAuthenticated, productId]);

  const handleSubmitReview = async (data: {
    rating: number;
    content: string | null;
    images: string[];
    orderItemId: string;
  }) => {
    const token = localStorage.getItem("auth_token");
    const response = await fetch(`/api/products/${productId}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (result.success) {
      toast.success("Đánh giá thành công!");
      // Refresh reviews
      const reviewsResponse = await fetch(`/api/products/${productId}/reviews`);
      const reviewsResult = await reviewsResponse.json();
      if (reviewsResult.success) {
        setReviews(reviewsResult.data);
        onReviewsUpdate?.(reviewsResult.data);
      }
      // Refresh reviewable items
      const itemsResponse = await fetch(
        `/api/products/${productId}/reviewable-orders`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );
      const itemsResult = await itemsResponse.json();
      if (itemsResult.success) {
        setReviewableItems(itemsResult.data);
      }
    } else {
      toast.error(result.error || "Đánh giá thất bại");
      throw new Error(result.error || "Đánh giá thất bại");
    }
  };

  const canReview = isAuthenticated && reviewableItems.length > 0;
  const filteredReviews = selectedRating
    ? reviews.filter((r) => r.rating === selectedRating)
    : reviews;

  return (
    <>
      <div className="mt-12.5">
        {/* Rating Summary Section - Shopee Style */}
        <div className="bg-white rounded-xl shadow-1 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left: Overall Rating */}
            <div className="flex-shrink-0 text-center md:text-left">
              <div className="text-5xl font-bold text-dark mb-2">
                {averageRating.toFixed(1)}
              </div>
              <div className="flex items-center justify-center md:justify-start gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    filled={star <= Math.round(averageRating)}
                  />
                ))}
              </div>
              <div className="text-gray-5 text-sm">{totalReviews} đánh giá</div>
            </div>

            {/* Right: Rating Breakdown */}
            <div className="flex-1">
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ratingStats[star as keyof typeof ratingStats];
                  const percentage =
                    totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                  return (
                    <div
                      key={star}
                      className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() =>
                        setSelectedRating(selectedRating === star ? null : star)
                      }
                    >
                      <div className="flex items-center gap-1 w-20">
                        <span className="text-sm text-dark">{star}</span>
                        <StarIcon filled={true} />
                      </div>
                      <div className="flex-1 h-2 bg-gray-1 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#FBB040] transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-sm text-gray-5 w-12 text-right">
                        {count}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Review Button */}
            <div className="flex-shrink-0 flex items-center justify-center md:justify-end">
              <button
                onClick={() => {
                  if (canReview) {
                    setIsModalOpen(true);
                  } else {
                    toast.error(
                      isAuthenticated
                        ? "Bạn cần mua sản phẩm này và đơn hàng đã được giao mới có thể đánh giá."
                        : "Vui lòng đăng nhập để đánh giá"
                    );
                  }
                }}
                disabled={!canReview}
                className={`px-6 py-3 rounded-md font-medium transition-colors ${
                  canReview
                    ? "bg-blue text-white hover:bg-blue-dark"
                    : "bg-gray-3 text-gray-5 cursor-not-allowed"
                }`}
              >
                Đánh giá
              </button>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-medium text-2xl text-dark">
              {selectedRating
                ? `${filteredReviews.length} đánh giá ${selectedRating} sao`
                : `${totalReviews} Đánh giá cho sản phẩm này`}
            </h2>
            {selectedRating && (
              <button
                onClick={() => setSelectedRating(null)}
                className="text-sm text-blue hover:underline"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>

          <div className="flex flex-col gap-6">
            {loading ? (
              <div className="text-center py-8">Đang tải...</div>
            ) : filteredReviews.length === 0 ? (
              <div className="text-center py-8 text-gray-5">
                {selectedRating
                  ? `Chưa có đánh giá ${selectedRating} sao nào`
                  : "Chưa có đánh giá nào"}
              </div>
            ) : (
              filteredReviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-xl bg-white shadow-1 p-4 sm:p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12.5 h-12.5 rounded-full overflow-hidden bg-gray-3">
                        {review.user.avatar ? (
                          <Image
                            src={review.user.avatar}
                            alt={review.user.name || "User"}
                            className="w-12.5 h-12.5 rounded-full overflow-hidden"
                            width={50}
                            height={50}
                          />
                        ) : (
                          <div className="w-12.5 h-12.5 rounded-full bg-blue flex items-center justify-center text-white font-medium">
                            {(review.user.name ||
                              review.user.email)[0].toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div>
                        <h3 className="font-medium text-dark">
                          {review.user.name || "Người dùng"}
                        </h3>
                        <p className="text-custom-sm text-gray-5">
                          {new Date(review.createdAt).toLocaleDateString(
                            "vi-VN"
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon key={star} filled={star <= review.rating} />
                      ))}
                    </div>
                  </div>

                  {review.content && (
                    <p className="text-dark mt-4 mb-4">{review.content}</p>
                  )}

                  {review.images && review.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {review.images.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative w-20 h-20 rounded-md overflow-hidden cursor-pointer border border-gray-3"
                          onClick={() => window.open(img, "_blank")}
                        >
                          <Image
                            src={img}
                            alt={`Review image ${idx + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Admin Response */}
                  {review.adminResponse && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-5 h-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-dark">
                              Phản Hồi Của Người Bán
                            </h4>
                            {review.adminResponseAt && (
                              <span className="text-xs text-gray-5">
                                {new Date(
                                  review.adminResponseAt
                                ).toLocaleDateString("vi-VN")}
                              </span>
                            )}
                          </div>
                          <p className="text-dark text-sm leading-relaxed">
                            {review.adminResponse}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productId={productId}
        reviewableItems={reviewableItems}
        onSubmit={handleSubmitReview}
      />
    </>
  );
};

export default ReviewsSection;
