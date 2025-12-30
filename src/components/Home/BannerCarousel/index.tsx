"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  link?: string;
  buttonText?: string;
  discount?: string;
  bgColor?: string;
}

const BannerCarousel = () => {
  // Dữ liệu banner mẫu - có thể lấy từ API sau
  const banners: Banner[] = [
    {
      id: "1",
      title: "iPhone 16 Series",
      subtitle: "Mới ra mắt",
      description: "Trải nghiệm công nghệ mới nhất với iPhone 16",
      image: "/images/hero/hero-02.png",
      link: "/shop-with-sidebar?categoryId=phone",
      buttonText: "Mua ngay",
      discount: "Giảm đến 30%",
      bgColor: "bg-gradient-to-r from-blue-500 to-blue-600",
    },
    {
      id: "2",
      title: "MacBook Air M3",
      subtitle: "Siêu mỏng nhẹ",
      description: "Hiệu năng vượt trội, pin lâu dài",
      image: "/images/promo/promo-02.png",
      link: "/shop-with-sidebar?categoryId=laptop",
      buttonText: "Khám phá",
      discount: "Ưu đãi đặc biệt",
      bgColor: "bg-gradient-to-r from-gray-700 to-gray-800",
    },
    {
      id: "3",
      title: "Apple Watch Ultra",
      subtitle: "Thể thao chuyên nghiệp",
      description: "Theo dõi sức khỏe 24/7",
      image: "/images/promo/promo-03.png",
      link: "/shop-with-sidebar?categoryId=watch",
      buttonText: "Tìm hiểu",
      discount: "Giảm 40%",
      bgColor: "bg-gradient-to-r from-orange-500 to-orange-600",
    },
  ];

  return (
    <section className="overflow-hidden py-10">
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        <Swiper
          spaceBetween={20}
          slidesPerView={1}
          autoplay={{
            delay: 4000,
            disableOnInteraction: false,
          }}
          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}
          modules={[Autoplay, Pagination]}
          className="banner-carousel rounded-lg overflow-hidden"
        >
          {banners.map((banner) => (
            <SwiperSlide key={banner.id}>
              <Link
                href={banner.link || "#"}
                className="block relative overflow-hidden rounded-lg"
              >
                <div
                  className={`${banner.bgColor || "bg-gradient-to-r from-blue-500 to-blue-600"} relative min-h-[300px] sm:min-h-[400px] flex items-center px-6 sm:px-10 lg:px-20`}
                >
                  {/* Content */}
                  <div className="relative z-10 max-w-md text-white">
                    {banner.subtitle && (
                      <p className="text-sm sm:text-base mb-2 opacity-90">
                        {banner.subtitle}
                      </p>
                    )}
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3">
                      {banner.title}
                    </h2>
                    {banner.discount && (
                      <p className="text-lg sm:text-xl font-semibold mb-3 text-yellow-300">
                        {banner.discount}
                      </p>
                    )}
                    {banner.description && (
                      <p className="text-sm sm:text-base mb-6 opacity-90">
                        {banner.description}
                      </p>
                    )}
                    {banner.buttonText && (
                      <span className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-semibold rounded-md hover:bg-gray-100 transition-colors">
                        {banner.buttonText}
                        <svg
                          className="w-5 h-5 ml-2"
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
                      </span>
                    )}
                  </div>

                  {/* Image */}
                  <div className="absolute right-0 bottom-0 w-1/2 sm:w-2/5 h-full flex items-end justify-end">
                    <div className="relative w-full h-full">
                      <Image
                        src={banner.image}
                        alt={banner.title}
                        fill
                        className="object-contain object-bottom"
                        priority
                      />
                    </div>
                  </div>

                  {/* Decorative elements */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 right-20 w-32 h-32 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 left-20 w-24 h-24 bg-white rounded-full blur-2xl"></div>
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

export default BannerCarousel;
