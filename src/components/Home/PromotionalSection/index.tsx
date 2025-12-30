"use client";
import React, { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import ProductItem from "@/components/Common/ProductItem";
import { useProducts } from "@/hooks/queries/useProducts";
import { formatPrice } from "@/utils/formatPrice";

const PromotionalSection = () => {
  const { data: productsData, isLoading, isError } = useProducts({ limit: 20 });

  // Lọc sản phẩm có discount (discountedPrice < price)
  const promotionalProducts = useMemo(() => {
    if (!productsData?.products) return [];
    return productsData.products
      .filter((product) => {
        const hasDiscount =
          product.discountedPrice && product.discountedPrice < product.price;
        return hasDiscount;
      })
      .slice(0, 12); // Giới hạn 12 sản phẩm
  }, [productsData]);

  return (
    <section className="overflow-hidden py-15 bg-gray-2">
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        {/* Header với tabs */}
        <div className="mb-7 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="font-bold text-xl xl:text-heading-4 text-dark mb-2">
              Khuyến mãi đặc biệt
            </h2>
            <p className="text-sm text-gray-600">
              Ưu đãi hấp dẫn, giảm giá lên đến 50%
            </p>
          </div>
          <Link
            href="/shop-with-sidebar"
            className="inline-flex font-medium text-custom-sm py-2.5 px-7 rounded-md border-gray-3 border bg-white text-dark ease-out duration-200 hover:bg-blue hover:text-white hover:border-blue"
          >
            Xem tất cả
          </Link>
        </div>

        {/* Carousel sản phẩm khuyến mãi */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-7.5 gap-y-9">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={`promo-skeleton-${idx}`}
                className="h-72 rounded-2xl bg-gray-1 animate-pulse"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-12">
            <p className="text-red-500">
              Không thể tải sản phẩm khuyến mãi. Vui lòng thử lại sau.
            </p>
          </div>
        ) : promotionalProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Hiện chưa có sản phẩm khuyến mãi</p>
          </div>
        ) : (
          <div className="relative px-12">
            <Swiper
              spaceBetween={20}
              slidesPerView={1}
              breakpoints={{
                640: {
                  slidesPerView: 2,
                },
                768: {
                  slidesPerView: 3,
                },
                1024: {
                  slidesPerView: 4,
                },
              }}
              autoplay={{
                delay: 3000,
                disableOnInteraction: false,
              }}
              navigation={{
                nextEl: ".promo-swiper-button-next",
                prevEl: ".promo-swiper-button-prev",
              }}
              modules={[Autoplay, Navigation]}
              className="promo-swiper"
            >
              {promotionalProducts.map((product) => {
                const discountPercent = product.discountedPrice
                  ? Math.round(
                      ((product.price - product.discountedPrice) /
                        product.price) *
                        100
                    )
                  : 0;

                return (
                  <SwiperSlide key={product.id}>
                    <div className="relative group">
                      {/* Badge giảm giá */}
                      {discountPercent > 0 && (
                        <div className="absolute top-2 left-2 z-10 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold">
                          -{discountPercent}%
                        </div>
                      )}
                      <ProductItem item={product} />
                    </div>
                  </SwiperSlide>
                );
              })}
            </Swiper>

            {/* Navigation buttons */}
            <button className="promo-swiper-button-prev absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full w-10 h-10 flex items-center justify-center hover:bg-blue hover:text-white transition-colors -ml-2">
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button className="promo-swiper-button-next absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full w-10 h-10 flex items-center justify-center hover:bg-blue hover:text-white transition-colors -mr-2">
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default PromotionalSection;
