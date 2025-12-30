import { useQuery } from "@tanstack/react-query";
import { getToken } from "@/lib/auth-storage";

interface UnreadCountResponse {
  success: boolean;
  data: {
    unreadCount: number;
  };
}

export const useChatUnreadCountCustomer = (options?: { enabled?: boolean }) => {
  return useQuery<UnreadCountResponse>({
    queryKey: ["chat-unread-count-customer"],
    queryFn: async () => {
      const token = getToken();
      if (!token) {
        return { success: true, data: { unreadCount: 0 } };
      }

      const res = await fetch("/api/chat/unread-count-customer", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch unread count");
      }

      return res.json();
    },
    refetchInterval: 5000, // Refetch every 5 seconds
    enabled: options?.enabled !== false && !!getToken(),
  });
};

