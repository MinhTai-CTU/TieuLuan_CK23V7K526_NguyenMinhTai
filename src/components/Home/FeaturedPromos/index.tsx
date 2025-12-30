"use client";
import React, { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useProducts } from "@/hooks/queries/useProducts";
import { formatPrice } from "@/utils/formatPrice";

const FeaturedPromos = () => {
  const { data: productsData, isLoading } = useProducts({ limit: 6 });

  // Lấy 3 sản phẩm có discount cao nhất
  const featuredProducts = useMemo(() => {
    if (!productsData?.products) return [];
    return productsData.products
      .filter((p) => p.discountedPrice && p.discountedPrice < p.price)
      .sort((a, b) => {
        const discountA =
          ((a.price - (a.discountedPrice || a.price)) / a.price) * 100;
        const discountB =
          ((b.price - (b.discountedPrice || b.price)) / b.price) * 100;
        return discountB - discountA;
      })
      .slice(0, 3);
  }, [productsData]);

  if (isLoading) {
    return (
      <section className="overflow-hidden py-15 bg-gray-2">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 rounded-lg bg-gray-1 animate-pulse"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (featuredProducts.length === 0) {
    return null;
  }

  const promoConfigs = [
    {
      bgColor: "bg-gradient-to-br from-blue-500 to-blue-600",
      textColor: "text-white",
      buttonColor: "bg-white text-blue-600",
    },
    {
      bgColor: "bg-gradient-to-br from-teal-400 to-teal-500",
      textColor: "text-white",
      buttonColor: "bg-white text-teal-600",
    },
    {
      bgColor: "bg-gradient-to-br from-orange-400 to-orange-500",
      textColor: "text-white",
      buttonColor: "bg-white text-orange-600",
    },
  ];

  return (
    <section className="overflow-hidden py-15 bg-gray-2">
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-dark mb-2">
            Ưu đãi nổi bật
          </h2>
          <p className="text-gray-600">
            Những sản phẩm đang được giảm giá hấp dẫn
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredProducts.map((product, index) => {
            const config = promoConfigs[index] || promoConfigs[0];
            const discountPercent = product.discountedPrice
              ? Math.round(
                  ((product.price - product.discountedPrice) / product.price) *
                    100
                )
              : 0;
            const mainImage =
              product.imgs?.thumbnails?.[0] ||
              product.imgs?.previews?.[0] ||
              "";

            return (
              <Link
                key={product.id}
                href={`/shop-details?id=${product.id}`}
                className={`relative overflow-hidden rounded-xl ${config.bgColor} p-6 sm:p-8 group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2`}
              >
                {/* Discount badge */}
                {discountPercent > 0 && (
                  <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    <span className="text-sm font-bold text-white">
                      -{discountPercent}%
                    </span>
                  </div>
                )}

                <div className="relative z-10">
                  <h3
                    className={`text-lg sm:text-xl font-bold mb-2 ${config.textColor} line-clamp-2`}
                  >
                    {product.title}
                  </h3>

                  <div className={`mb-4 ${config.textColor}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl sm:text-3xl font-bold">
                        {formatPrice(product.discountedPrice || product.price)}
                      </span>
                      {product.discountedPrice && (
                        <span className="text-sm line-through opacity-70">
                          {formatPrice(product.price)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className={`inline-flex items-center px-4 py-2 rounded-lg ${config.buttonColor} font-semibold text-sm group-hover:scale-105 transition-transform`}
                  >
                    Xem ngay
                    <svg
                      className="w-4 h-4 ml-2"
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
                  </div>
                </div>

                {/* Product image */}
                {mainImage && (
                  <div className="absolute bottom-0 right-0 w-32 sm:w-40 h-32 sm:h-40 opacity-80 group-hover:opacity-100 transition-opacity">
                    <Image
                      src={mainImage}
                      alt={product.title}
                      fill
                      className="object-contain object-bottom"
                    />
                  </div>
                )}

                {/* Decorative circle */}
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturedPromos;
