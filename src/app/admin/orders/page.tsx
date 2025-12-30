import OrdersList from "@/components/Admin/Orders/OrdersList";

// Let AdminLayoutClient handle authentication check
// This prevents double-checking and potential race conditions
export default function AdminOrdersPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Quản lý đơn hàng
      </h1>
      <OrdersList />
    </div>
  );
}
