"use client";
import React from "react";

import { Product } from "@/types/product";
import { useModalContext } from "@/app/context/QuickViewModalContext";
import { useQuickViewStore } from "@/stores/quickView-store";
import { useCartStore, generateCartItemId } from "@/stores/cart-store";
import { formatPrice } from "@/utils/formatPrice";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import WishlistButton from "../Common/WishlistButton";
import StarRating from "../Common/StarRating";
import { useProductRating } from "@/hooks/queries/useProductRating";

const SingleListItem = ({ item }: { item: Product }) => {
  const router = useRouter();
  const { openModal } = useModalContext();
  const updateQuickView = useQuickViewStore((state) => state.updateQuickView);
  const addItemToCart = useCartStore((state) => state.addItemToCart);

  // Fetch product rating
  const { data: ratingData, isLoading: ratingLoading } = useProductRating(
    item.id
  );
  const averageRating = ratingData?.averageRating || 0;
  const totalReviews = ratingData?.totalReviews || 0;

  // update the QuickView state
  const handleQuickViewUpdate = () => {
    updateQuickView({ ...item });
  };

  // add to cart
  const handleAddToCart = () => {
    // Nếu sản phẩm có variants, phải chọn variant trước (redirect đến trang chi tiết)
    if (item.hasVariants) {
      toast.error("Vui lòng chọn các tùy chọn sản phẩm trước khi thêm vào giỏ hàng");
      router.push(`/shop-details?id=${item.id}`);
      return;
    }

    // Sản phẩm không có variants, có thể thêm trực tiếp
    addItemToCart({
      id: item.id,
      cartItemId: generateCartItemId(item.id),
      title: item.title,
      price: item.price,
      discountedPrice: item.discountedPrice ?? item.price,
      quantity: 1,
      imgs: item.imgs,
    });
  };

  return (
    <div className="group rounded-lg bg-white shadow-1">
      <div className="flex">
        <div className="shadow-list relative overflow-hidden flex items-center justify-center max-w-[270px] w-full sm:min-h-[270px] p-4">
          <Image src={item.imgs.previews[0]} alt="" width={250} height={250} />

          <div className="absolute left-0 bottom-0 translate-y-full w-full flex items-center justify-center gap-2.5 pb-5 ease-linear duration-200 group-hover:translate-y-0">
            <button
              onClick={() => {
                openModal();
                handleQuickViewUpdate();
              }}
              aria-label="button for quick view"
              className="flex items-center justify-center w-9 h-9 rounded-[5px] shadow-1 ease-out duration-200 text-dark bg-white hover:text-blue"
            >
              <svg
                className="fill-current"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M8.00016 5.5C6.61945 5.5 5.50016 6.61929 5.50016 8C5.50016 9.38071 6.61945 10.5 8.00016 10.5C9.38087 10.5 10.5002 9.38071 10.5002 8C10.5002 6.61929 9.38087 5.5 8.00016 5.5ZM6.50016 8C6.50016 7.17157 7.17174 6.5 8.00016 6.5C8.82859 6.5 9.50016 7.17157 9.50016 8C9.50016 8.82842 8.82859 9.5 8.00016 9.5C7.17174 9.5 6.50016 8.82842 6.50016 8Z"
                  fill=""
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M8.00016 2.16666C4.99074 2.16666 2.96369 3.96946 1.78721 5.49791L1.76599 5.52546C1.49992 5.87102 1.25487 6.18928 1.08862 6.5656C0.910592 6.96858 0.833496 7.40779 0.833496 8C0.833496 8.5922 0.910592 9.03142 1.08862 9.4344C1.25487 9.81072 1.49992 10.129 1.76599 10.4745L1.78721 10.5021C2.96369 12.0305 4.99074 13.8333 8.00016 13.8333C11.0096 13.8333 13.0366 12.0305 14.2131 10.5021L14.2343 10.4745C14.5004 10.129 14.7455 9.81072 14.9117 9.4344C15.0897 9.03142 15.1668 8.5922 15.1668 8C15.1668 7.40779 15.0897 6.96858 14.9117 6.5656C14.7455 6.18927 14.5004 5.87101 14.2343 5.52545L14.2131 5.49791C13.0366 3.96946 11.0096 2.16666 8.00016 2.16666ZM2.57964 6.10786C3.66592 4.69661 5.43374 3.16666 8.00016 3.16666C10.5666 3.16666 12.3344 4.69661 13.4207 6.10786C13.7131 6.48772 13.8843 6.7147 13.997 6.9697C14.1023 7.20801 14.1668 7.49929 14.1668 8C14.1668 8.50071 14.1023 8.79199 13.997 9.0303C13.8843 9.28529 13.7131 9.51227 13.4207 9.89213C12.3344 11.3034 10.5666 12.8333 8.00016 12.8333C5.43374 12.8333 3.66592 11.3034 2.57964 9.89213C2.28725 9.51227 2.11599 9.28529 2.00334 9.0303C1.89805 8.79199 1.8335 8.50071 1.8335 8C1.8335 7.49929 1.89805 7.20801 2.00334 6.9697C2.11599 6.7147 2.28725 6.48772 2.57964 6.10786Z"
                  fill=""
                />
              </svg>
            </button>

            <button
              onClick={() => handleAddToCart()}
              className="inline-flex font-medium text-custom-sm py-[7px] px-5 rounded-[5px] bg-blue text-white ease-out duration-200 hover:bg-blue-dark"
            >
              Thêm vào giỏ hàng
            </button>

            <WishlistButton productId={item.id} product={item} />
          </div>
        </div>

        <div className="w-full flex flex-col gap-5 sm:flex-row sm:items-center justify-center sm:justify-between py-5 px-4 sm:px-7.5 lg:pl-11 lg:pr-12">
          <div>
            <h3 className="font-medium text-dark ease-out duration-200 hover:text-blue mb-1.5">
              <Link href={`/shop-details?id=${item.id}`}> {item.title} </Link>
            </h3>

            <span className="flex items-center gap-2 font-medium text-lg">
              {item.hasVariants ? (
                <>
                  <span className="text-dark">
                    Từ {formatPrice(item.discountedPrice ?? item.price)}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-dark">
                    {formatPrice(item.discountedPrice ?? item.price)}
                  </span>
                  {item.discountedPrice &&
                    item.discountedPrice !== item.price && (
                      <span className="text-dark-4 line-through">
                        {formatPrice(item.price)}
                      </span>
                    )}
                </>
              )}
            </span>
          </div>

          {!ratingLoading && totalReviews > 0 ? (
            <StarRating
              rating={averageRating}
              totalReviews={totalReviews}
              starSize={15}
              showReviewsCount={true}
            />
          ) : !ratingLoading && totalReviews === 0 ? (
            <p className="text-custom-sm text-gray-5">Chưa có đánh giá</p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default SingleListItem;
