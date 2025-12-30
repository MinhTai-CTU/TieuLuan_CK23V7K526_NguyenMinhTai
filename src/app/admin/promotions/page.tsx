import PromotionsList from "@/components/Admin/Promotions/PromotionsList";

export default function AdminPromotionsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Quản lý khuyến mãi
        </h1>
        <p className="text-gray-600">
          Tạo và quản lý các mã khuyến mãi, mã giảm giá cho cửa hàng
        </p>
      </div>
      <PromotionsList />
    </div>
  );
}

