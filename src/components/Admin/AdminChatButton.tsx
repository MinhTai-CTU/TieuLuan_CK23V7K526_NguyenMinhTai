"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/auth-storage";
import { useChatUnreadCount } from "@/hooks/queries/useChatUnreadCount";

export default function AdminChatButton() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setMounted(true);
    const user = getUser();
    setIsAdmin(user?.roles?.includes("ADMIN") || false);
  }, []);

  // Chỉ gọi hook khi đã mount và là admin
  const { data: chatUnreadData } = useChatUnreadCount({
    enabled: mounted && isAdmin,
  });

  // Chỉ hiển thị sau khi mount và user là admin
  if (!mounted || !isAdmin) return null;

  const handleClick = () => {
    router.push("/admin/chat");
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center justify-center w-14 h-14 rounded-full shadow-lg bg-blue ease-out duration-200 hover:bg-blue-dark fixed bottom-8 right-8 z-[9999]"
      aria-label="Chat"
    >
      <svg
        className="fill-white w-7 h-7"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
      >
        <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 2.98.97 4.29L1 23l6.71-1.97C9.02 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.1 0-2.12-.27-3.01-.75L4 20l.75-4.99C3.27 14.12 3 13.1 3 12c0-4.97 4.03-9 9-9s9 4.03 9 9-4.03 9-9 9z" />
        <circle cx="8.5" cy="11.5" r="1" />
        <circle cx="12" cy="11.5" r="1" />
        <circle cx="15.5" cy="11.5" r="1" />
      </svg>
      {chatUnreadData?.unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center font-medium text-xs bg-red-500 text-white rounded-full w-5 h-5">
          {chatUnreadData.unreadCount > 99 ? "99+" : chatUnreadData.unreadCount}
        </span>
      )}
    </button>
  );
}
