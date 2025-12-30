"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useProducts } from "@/hooks/queries/useProducts";
import ProductItem from "@/components/Common/ProductItem";

const BestSeller = () => {
  // Fetch best sellers (products sorted by reviews, limit 6)
  const {
    data: productsData,
    isLoading,
    isError,
  } = useProducts({ limit: 6, sort: "bestseller" });
  const products = productsData?.products || [];
  const displayProducts = products;

  return (
    <section className="overflow-hidden py-10">
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        {/* <!-- section title --> */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <span className="flex items-center gap-2.5 font-medium text-dark mb-1.5">
              <Image
                src="/images/icons/icon-07.svg"
                alt="icon"
                width={17}
                height={17}
              />
              Tháng này
            </span>
            <h2 className="font-semibold text-xl xl:text-heading-5 text-dark">
              Sản phẩm bán chạy
            </h2>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7.5">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={`bestseller-skeleton-${idx}`}
                className="h-72 rounded-2xl bg-gray-2 animate-pulse"
              />
            ))}
          </div>
        ) : displayProducts && displayProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7.5">
            {/* <!-- Best Sellers item --> */}
            {displayProducts.map((item) => (
              <ProductItem item={item} key={item.id} />
            ))}
          </div>
        ) : (
          !isLoading && (
            <div className="text-center py-12">
              <p className="text-dark-4">Không có sản phẩm bán chạy</p>
            </div>
          )
        )}

        {isError && (
          <p className="text-sm text-red-500 mt-4">
            Không thể tải sản phẩm bán chạy. Vui lòng thử lại sau.
          </p>
        )}
      </div>

      <div className="text-center mt-12.5">
        <Link
          href="/shop-without-sidebar"
          className="inline-flex font-medium text-custom-sm py-3 px-7 sm:px-12.5 rounded-md border-gray-3 border bg-gray-1 text-dark ease-out duration-200 hover:bg-dark hover:text-white hover:border-transparent"
        >
          Xem tất cả
        </Link>
      </div>
    </section>
  );
};

export default BestSeller;
