"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { useCallback, useRef, useMemo } from "react";
import testimonialsData from "./testimonialsData";
import Image from "next/image";
import "swiper/css/navigation";
import "swiper/css";
import SingleItem from "./SingleItem";
import { useTestimonials } from "@/hooks/queries/useTestimonials";

const Testimonials = () => {
  const sliderRef = useRef<any>(null);
  const { data, isLoading, isError } = useTestimonials();

  const testimonials = useMemo(() => {
    if (data && data.length > 0) {
      return data;
    }
    return testimonialsData;
  }, [data]);

  const handlePrev = useCallback(() => {
    if (!sliderRef.current) return;
    sliderRef.current.swiper.slidePrev();
  }, []);

  const handleNext = useCallback(() => {
    if (!sliderRef.current) return;
    sliderRef.current.swiper.slideNext();
  }, []);

  return (
    <section className="overflow-hidden py-16 bg-white">
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        <div className="mb-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <span className="flex items-center gap-2.5 font-medium text-blue mb-1.5">
              <Image
                src="/images/icons/icon-08.svg"
                alt="icon"
                width={17}
                height={17}
              />
              Testimonials
            </span>
            <h2 className="font-bold text-2xl sm:text-3xl lg:text-4xl text-dark">
              Đánh giá của khách hàng
            </h2>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-blue hover:text-white rounded-lg transition-all duration-200 group"
              aria-label="Previous testimonial"
            >
              <svg
                className="w-5 h-5 fill-current text-gray-600 group-hover:text-white transition-colors"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M15.4881 4.43057C15.8026 4.70014 15.839 5.17361 15.5694 5.48811L9.98781 12L15.5694 18.5119C15.839 18.8264 15.8026 19.2999 15.4881 19.5695C15.1736 19.839 14.7001 19.8026 14.4306 19.4881L8.43056 12.4881C8.18981 12.2072 8.18981 11.7928 8.43056 11.5119L14.4306 4.51192C14.7001 4.19743 15.1736 4.161 15.4881 4.43057Z"
                />
              </svg>
            </button>

            <button
              onClick={handleNext}
              className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-blue hover:text-white rounded-lg transition-all duration-200 group"
              aria-label="Next testimonial"
            >
              <svg
                className="w-5 h-5 fill-current text-gray-600 group-hover:text-white transition-colors"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M8.51192 4.43057C8.82641 4.161 9.29989 4.19743 9.56946 4.51192L15.5695 11.5119C15.8102 11.7928 15.8102 12.2072 15.5695 12.4881L9.56946 19.4881C9.29989 19.8026 8.82641 19.839 8.51192 19.5695C8.19743 19.2999 8.161 18.8264 8.43057 18.5119L14.0122 12L8.43057 5.48811C8.161 5.17361 8.19743 4.70014 8.51192 4.43057Z"
                />
              </svg>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={`testimonial-skeleton-${idx}`}
                className="h-64 rounded-xl bg-gray-100 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <Swiper
            ref={sliderRef}
            slidesPerView={1}
            spaceBetween={20}
            navigation={{
              nextEl: ".testimonial-swiper-button-next",
              prevEl: ".testimonial-swiper-button-prev",
            }}
            modules={[Navigation]}
            breakpoints={{
              640: {
                slidesPerView: 1,
              },
              768: {
                slidesPerView: 2,
              },
              1024: {
                slidesPerView: 3,
              },
            }}
            className="testimonial-carousel [&_.swiper-slide]:h-auto [&_.swiper-slide]:flex [&_.swiper-slide>div]:w-full"
          >
            {testimonials.map((item, key) => (
              <SwiperSlide key={item.id || key}>
                <SingleItem testimonial={item} />
              </SwiperSlide>
            ))}
          </Swiper>
        )}

        {isError && (
          <p className="text-sm text-red-500 mt-4 text-center">
            Không thể tải đánh giá. Đang hiển thị dữ liệu mẫu.
          </p>
        )}
      </div>
    </section>
  );
};

export default Testimonials;
