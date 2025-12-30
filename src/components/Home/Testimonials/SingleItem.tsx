import React from "react";
import { Testimonial } from "@/types/testimonial";
import Image from "next/image";

const SingleItem = ({ testimonial }: { testimonial: Testimonial }) => {
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 py-6 px-5 sm:px-7 min-h-[280px] sm:min-h-[300px] flex flex-col">
      {/* Stars */}
      <div className="flex items-center gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-current"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>

      {/* Review text */}
      <p className="text-gray-700 text-sm sm:text-base mb-6 flex-grow leading-relaxed">
        {testimonial.review}
      </p>

      {/* Author info */}
      <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
        {testimonial.authorImg ? (
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden flex-shrink-0">
            <Image
              src={testimonial.authorImg}
              alt={testimonial.authorName}
              width={56}
              height={56}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-600 font-semibold text-lg">
              {testimonial.authorName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-dark text-base sm:text-lg mb-1">
            {testimonial.authorName}
          </h3>
          {/* {testimonial.authorRole && (
            <p className="text-gray-500 text-xs sm:text-sm">
              {testimonial.authorRole}
            </p>
          )} */}
        </div>
      </div>
    </div>
  );
};

export default SingleItem;
