import AdminChat from "@/components/Admin/Chat/AdminChat";

// Let AdminLayoutClient handle authentication check
export default function AdminChatPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý Chat</h1>
        <p className="text-gray-600 mt-2">
          Hỗ trợ khách hàng và quản lý cuộc trò chuyện
        </p>
      </div>
      <AdminChat />
    </div>
  );
}

