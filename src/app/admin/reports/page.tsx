import Reports from "@/components/Admin/Reports";

// Let AdminLayoutClient handle authentication check
export default function AdminReportsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Báo cáo - Phân tích & Lịch sử
        </h1>
        <p className="text-gray-600 mt-2">
          Thống kê dữ liệu quá khứ để phân tích hiệu quả kinh doanh
        </p>
      </div>
      <Reports />
    </div>
  );
}
