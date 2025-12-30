import React, { Suspense } from "react";
import CheckoutSuccessContent from "@/components/Checkout/CheckoutSuccessContent";

export const dynamic = "force-dynamic";

const CheckoutSuccessPage = () => {
  return (
    <Suspense fallback={<div className="p-8 text-center">Đang tải...</div>}>
      <CheckoutSuccessContent />
    </Suspense>
  );
};

export default CheckoutSuccessPage;
