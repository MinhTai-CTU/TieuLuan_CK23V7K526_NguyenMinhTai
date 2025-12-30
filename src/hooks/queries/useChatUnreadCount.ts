import { useQuery } from "@tanstack/react-query";
import { getToken } from "@/lib/auth-storage";

export function useChatUnreadCount(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["chat-unread-count"],
    queryFn: async () => {
      const token = getToken();
      if (!token) return { unreadCount: 0 };

      const res = await fetch("/api/chat/unread-count", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data.success) {
        return data.data;
      }
      return { unreadCount: 0 };
    },
    refetchInterval: 5000, // Refetch every 5 seconds
    enabled: options?.enabled !== undefined ? options.enabled : !!getToken(),
  });
}
