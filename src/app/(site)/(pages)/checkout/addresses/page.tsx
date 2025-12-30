import React, { Suspense } from "react";
import AddressManagement from "@/components/Checkout/AddressManagement";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Quản lý địa chỉ | Trang chủ",
  description: "Manage your delivery addresses",
};

const AddressesPage = () => {
  return (
    <main>
      <Suspense fallback={<div className="p-8 text-center">Đang tải...</div>}>
        <AddressManagement />
      </Suspense>
    </main>
  );
};

export default AddressesPage;
