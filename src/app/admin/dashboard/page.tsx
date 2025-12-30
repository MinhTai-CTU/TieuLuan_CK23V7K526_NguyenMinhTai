import Dashboard from "@/components/Admin/Dashboard";

// Let AdminLayoutClient handle authentication check
export default function AdminDashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Dashboard - Tổng quan & Hành động tức thì
        </h1>
        <p className="text-gray-600 mt-2">
          Dữ liệu thời gian thực và các việc cần xử lý ngay
        </p>
      </div>
      <Dashboard />
    </div>
  );
}
