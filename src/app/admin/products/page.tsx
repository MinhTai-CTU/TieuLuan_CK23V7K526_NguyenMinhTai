import Link from "next/link";
import ProductsList from "@/components/Admin/Products/ProductsList";

export default function AdminProductsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý sản phẩm</h1>
          <p className="mt-2 text-sm text-gray-500">
            Quản lý danh sách sản phẩm của cửa hàng
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue text-white rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Thêm sản phẩm
        </Link>
      </div>
      <ProductsList />
    </div>
  );
}
