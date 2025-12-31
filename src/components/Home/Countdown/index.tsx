"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

// 1. Định nghĩa kiểu dữ liệu dựa trên response API
interface FlashSaleData {
  id: string;
  title: string;
  tagline: string;
  description: string;
  image: string;
  link: string;
  buttonText: string;
  endDate: string;
  isActive: boolean;
}

const CounDown = () => {
  // State lưu dữ liệu API
  const [bannerData, setBannerData] = useState<FlashSaleData | null>(null);

  // State bộ đếm
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const res = await fetch("/api/admin/banners?type=FLASH_SALE");
        const json = await res.json();

        if (json.success && json.data) {
          setBannerData(json.data);
        }
      } catch (error) {
        console.error("Failed to fetch flash sale banner:", error);
      }
    };

    fetchBanner();
  }, []);

  const getTime = () => {
    if (!bannerData?.endDate) return;

    const time = Date.parse(bannerData.endDate) - Date.now();

    if (time <= 0) {
      setDays(0);
      setHours(0);
      setMinutes(0);
      setSeconds(0);
    } else {
      setDays(Math.floor(time / (1000 * 60 * 60 * 24)));
      setHours(Math.floor((time / (1000 * 60 * 60)) % 24));
      setMinutes(Math.floor((time / 1000 / 60) % 60));
      setSeconds(Math.floor((time / 1000) % 60));
    }
  };

  useEffect(() => {
    getTime();

    const interval = setInterval(getTime, 1000);
    return () => clearInterval(interval);
  }, [bannerData]);

  const formatNumber = (num: number) => {
    return num < 10 ? `0${num}` : num.toString();
  };

  if (!bannerData || !bannerData.isActive) {
    return null;
  }

  return (
    <section className="overflow-hidden py-20 bg-gray-2">
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        <div className="relative overflow-hidden z-1 rounded-xl bg-gradient-to-br from-blue-100 via-blue-50 to-cyan-100 p-6 sm:p-8 lg:p-12 xl:p-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Content */}
            <div className="relative z-10">
              {/* Tagline */}
              {bannerData.tagline && (
                <span className="inline-block font-semibold text-sm sm:text-base text-blue-600 mb-3 px-3 py-1 bg-white/50 backdrop-blur-sm rounded-full">
                  {bannerData.tagline}
                </span>
              )}

              {/* Title */}
              <h2 className="font-bold text-dark text-2xl sm:text-3xl lg:text-4xl xl:text-5xl mb-4 leading-tight">
                {bannerData.title}
              </h2>

              {/* Description */}
              <p className="text-gray-700 text-sm sm:text-base mb-6">
                {bannerData.description}
              </p>

              {/* Countdown timer - Grid layout 2x2 */}
              <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-6">
                {/* Days */}
                <div className="flex flex-col items-center">
                  <div className="w-full bg-white rounded-lg shadow-md px-4 py-3 sm:py-4 flex items-center justify-center mb-2">
                    <span className="font-bold text-xl sm:text-2xl lg:text-3xl text-dark">
                      {formatNumber(days)}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm text-gray-600 font-medium">
                    Ngày
                  </span>
                </div>

                {/* Hours */}
                <div className="flex flex-col items-center">
                  <div className="w-full bg-white rounded-lg shadow-md px-4 py-3 sm:py-4 flex items-center justify-center mb-2">
                    <span className="font-bold text-xl sm:text-2xl lg:text-3xl text-dark">
                      {formatNumber(hours)}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm text-gray-600 font-medium">
                    Giờ
                  </span>
                </div>

                {/* Minutes */}
                <div className="flex flex-col items-center">
                  <div className="w-full bg-white rounded-lg shadow-md px-4 py-3 sm:py-4 flex items-center justify-center mb-2">
                    <span className="font-bold text-xl sm:text-2xl lg:text-3xl text-dark">
                      {formatNumber(minutes)}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm text-gray-600 font-medium">
                    Phút
                  </span>
                </div>

                {/* Seconds */}
                <div className="flex flex-col items-center">
                  <div className="w-full bg-white rounded-lg shadow-md px-4 py-3 sm:py-4 flex items-center justify-center mb-2">
                    <span className="font-bold text-xl sm:text-2xl lg:text-3xl text-dark">
                      {formatNumber(seconds)}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm text-gray-600 font-medium">
                    Giây
                  </span>
                </div>
              </div>

              {/* Button Link */}
              <Link
                href={bannerData.link || "#"}
                className="inline-flex items-center gap-2 font-semibold text-sm sm:text-base text-white bg-blue-600 hover:bg-blue-700 py-3 px-6 sm:px-8 rounded-lg transition-all transform hover:scale-105 shadow-lg"
              >
                {bannerData.buttonText || "Xem ngay"}
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>

            {/* Product Image */}
            <div className="relative hidden lg:block">
              <div className="relative w-full h-[400px] xl:h-[500px]">
                {/* Chỉ hiển thị ảnh nếu có đường dẫn hợp lệ */}
                {bannerData.image && (
                  <Image
                    src={bannerData.image}
                    alt={bannerData.title}
                    fill
                    className="object-contain object-center drop-shadow-2xl"
                    priority
                  />
                )}
              </div>
            </div>
          </div>

          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-10 right-10 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 left-10 w-48 h-48 bg-cyan-200/30 rounded-full blur-2xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CounDown;
