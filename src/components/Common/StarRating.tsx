"use client";
import React from "react";
import Image from "next/image";

interface StarRatingProps {
  rating: number; // Rating from 0 to 5
  totalReviews?: number;
  starSize?: number;
  showReviewsCount?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  totalReviews,
  starSize = 14,
  showReviewsCount = true,
}) => {
  // Don't display if no reviews or rating is 0
  if (!totalReviews || totalReviews === 0 || rating === 0) {
    return null;
  }

  const roundedRating = Math.round(rating * 2) / 2; // Round to nearest 0.5

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          // Determine if star should be filled, half-filled, or empty
          const isFilled = star <= roundedRating;
          const isHalfFilled =
            star - 0.5 <= roundedRating && star > roundedRating;

          return (
            <div
              key={star}
              className="relative inline-block"
              style={{ width: starSize, height: starSize }}
            >
              {/* Empty star (background) */}
              <Image
                src="/images/icons/icon-star.svg"
                alt="star icon"
                width={starSize}
                height={starSize}
                className="opacity-20"
              />
              {/* Filled or half-filled star */}
              {isFilled && (
                <div className="absolute inset-0">
                  <Image
                    src="/images/icons/icon-star.svg"
                    alt="star icon"
                    width={starSize}
                    height={starSize}
                    className="opacity-100"
                  />
                </div>
              )}
              {isHalfFilled && (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: "50%" }}
                >
                  <Image
                    src="/images/icons/icon-star.svg"
                    alt="star icon"
                    width={starSize}
                    height={starSize}
                    className="opacity-100"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {showReviewsCount && totalReviews !== undefined && (
        <p className="text-custom-sm">({totalReviews})</p>
      )}
    </div>
  );
};

export default StarRating;
