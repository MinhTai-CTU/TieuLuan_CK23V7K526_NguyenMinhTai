import BannersList from "@/components/Admin/Banners/BannersList";

export default function AdminBannersPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Quản lý Banners
        </h1>
        <p className="text-gray-600">
          Quản lý các banner hiển thị trên trang chủ
        </p>
      </div>
      <BannersList />
    </div>
  );
}

