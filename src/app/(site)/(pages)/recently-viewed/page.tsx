import React from "react";
import RecentlyViewedPage from "@/components/RecentlyViewed";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sản phẩm đã xem gần đây | NextCommerce",
  description: "Xem lại các sản phẩm bạn đã xem gần đây",
};

const RecentlyViewed = () => {
  return (
    <main>
      <RecentlyViewedPage />
    </main>
  );
};

export default RecentlyViewed;

