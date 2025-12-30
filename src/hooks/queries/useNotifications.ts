import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getToken } from "@/lib/auth-storage";
import toast from "react-hot-toast";

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  orderId: string | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

// Fetch notifications
const fetchNotifications = async (): Promise<NotificationsResponse> => {
  const token = getToken();
  if (!token) {
    throw new Error("No token found");
  }

  const response = await fetch("/api/notifications", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch notifications");
  }

  const data = await response.json();
  return data.data;
};

// Mark notification as read
const markAsRead = async (id: string): Promise<Notification> => {
  const token = getToken();
  if (!token) {
    throw new Error("No token found");
  }

  const response = await fetch(`/api/notifications/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ isRead: true }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to mark notification as read");
  }

  const data = await response.json();
  return data.data;
};

// Mark all notifications as read
const markAllAsRead = async (): Promise<void> => {
  const token = getToken();
  if (!token) {
    throw new Error("No token found");
  }

  const response = await fetch("/api/notifications/read-all", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to mark all notifications as read");
  }
};

// Delete a notification
const deleteNotification = async (id: string): Promise<void> => {
  const token = getToken();
  if (!token) {
    throw new Error("No token found");
  }

  const response = await fetch(`/api/notifications/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete notification");
  }
};

// Delete all notifications
const deleteAllNotifications = async (): Promise<void> => {
  const token = getToken();
  if (!token) {
    throw new Error("No token found");
  }

  const response = await fetch("/api/notifications", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete all notifications");
  }
};

// Hook to fetch notifications
export const useNotifications = () => {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

// Hook to mark notification as read
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Không thể đánh dấu đã đọc");
    },
  });
};

// Hook to mark all notifications as read
export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Đã đánh dấu tất cả là đã đọc");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Không thể đánh dấu tất cả là đã đọc");
    },
  });
};

// Hook to delete a notification
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Đã xóa thông báo");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Không thể xóa thông báo");
    },
  });
};

// Hook to delete all notifications
export const useDeleteAllNotifications = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAllNotifications,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Đã xóa tất cả thông báo");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Không thể xóa tất cả thông báo");
    },
  });
};
