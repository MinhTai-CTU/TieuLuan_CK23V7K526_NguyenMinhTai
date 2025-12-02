"use client";
import React, { useMemo } from "react";
import SingleItem from "./SingleItem";
import Image from "next/image";
import Link from "next/link";
import shopData from "@/components/Shop/shopData";
import { useProducts } from "@/hooks/queries/useProducts";
import ProductItem from "@/components/Common/ProductItem";

const BestSeller = () => {
  // Fetch best sellers (products sorted by reviews, limit 6)
  const { data: products, isLoading, isError } = useProducts({ limit: 6 });

  const displayProducts = useMemo(() => {
    if (products && products.length > 0) {
      // Sort by reviews (best sellers)
      return [...products]
        .sort((a, b) => (b.reviews || 0) - (a.reviews || 0))
        .slice(0, 6);
    }
    return shopData.slice(1, 7);
  }, [products]);

  return (
    <section className="overflow-hidden">
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
              This Month
            </span>
            <h2 className="font-semibold text-xl xl:text-heading-5 text-dark">
              Best Sellers
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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7.5">
            {/* <!-- Best Sellers item --> */}
            {displayProducts.map((item) => (
              <ProductItem item={item} key={item.id} />
            ))}
          </div>
        )}

        {isError && (
          <p className="text-sm text-red-500 mt-4">
            Unable to load best sellers. Showing demo data instead.
          </p>
        )}
      </div>

      <div className="text-center mt-12.5">
        <Link
          href="/shop-without-sidebar"
          className="inline-flex font-medium text-custom-sm py-3 px-7 sm:px-12.5 rounded-md border-gray-3 border bg-gray-1 text-dark ease-out duration-200 hover:bg-dark hover:text-white hover:border-transparent"
        >
          View All
        </Link>
      </div>
    </section>
  );
};

export default BestSeller;
