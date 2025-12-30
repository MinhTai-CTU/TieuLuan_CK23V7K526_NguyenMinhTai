import UsersList from "@/components/Admin/Users/UsersList";

// Let AdminLayoutClient handle authentication check
// This prevents double-checking and potential race conditions
export default function AdminUsersPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Quản lý người dùng
        </h1>
        <p className="text-gray-600">
          Quản lý và theo dõi tất cả người dùng trong hệ thống
        </p>
      </div>
      <UsersList />
    </div>
  );
}
