"use client";

import { useState, useEffect, useRef } from "react";
import {
  useNotifications,
  useMarkNotificationAsRead,
  useDeleteNotification,
  useDeleteAllNotifications,
} from "@/hooks/queries/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import Link from "next/link";
import Pusher from "pusher-js";
import { useQueryClient } from "@tanstack/react-query";
import { getUser } from "@/lib/auth-storage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationDropdown({
  isOpen,
  onClose,
}: NotificationDropdownProps) {
  const { data, isLoading } = useNotifications();
  const markAsRead = useMarkNotificationAsRead();
  const deleteNotification = useDeleteNotification();
  const deleteAllNotifications = useDeleteAllNotifications();
  const queryClient = useQueryClient();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pusherClient, setPusherClient] = useState<Pusher | null>(null);
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);

  // Initialize Pusher client
  useEffect(() => {
    if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_PUSHER_KEY) {
      const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap1",
      });

      setPusherClient(pusher);

      return () => {
        pusher.disconnect();
      };
    }
  }, []);

  // Subscribe to notifications channel
  useEffect(() => {
    if (!pusherClient) return;

    const user = getUser();
    if (!user?.id) return;
    const userId = user.id;

    const channel = pusherClient.subscribe(`user-${userId}`);

    channel.bind("notification", (data: any) => {
      // Invalidate queries to refetch notifications
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });

    return () => {
      channel.unbind("notification");
      pusherClient.unsubscribe(`user-${userId}`);
    };
  }, [pusherClient, queryClient]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      markAsRead.mutate(notification.id);
    }
  };

  const handleDeleteNotification = (
    e: React.MouseEvent,
    notificationId: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    deleteNotification.mutate(notificationId);
  };

  const handleDeleteAll = () => {
    setIsDeleteAllDialogOpen(true);
  };

  const confirmDeleteAll = () => {
    deleteAllNotifications.mutate();
    setIsDeleteAllDialogOpen(false);
  };

  // Extract orderId (order code like ORD-xxx) from notification message
  const getOrderIdFromNotification = (notification: any): string | null => {
    // Extract orderId from message (format: ORD-xxx-xxx)
    const match = notification.message.match(/ORD-[A-Z0-9-]+/);
    return match ? match[0] : null;
  };

  // Check if current user is admin
  const isAdmin = () => {
    const user = getUser();
    return user?.roles?.includes("ADMIN") || false;
  };

  // Get the appropriate link based on user role
  const getNotificationLink = (notification: any): string => {
    const orderIdFromMessage = getOrderIdFromNotification(notification);
    const admin = isAdmin();

    if (orderIdFromMessage) {
      return admin
        ? `/admin/orders?orderId=${orderIdFromMessage}`
        : `/my-account?tab=orders&orderId=${orderIdFromMessage}`;
    }

    return admin ? "/admin/orders" : "/my-account?tab=orders";
  };

  const getNotificationColor = (isRead: boolean) => {
    return isRead
      ? "bg-gray-50 hover:bg-gray-100"
      : "bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500";
  };

  const getNotificationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ORDER_CREATED: "Đơn hàng mới",
      ORDER_UPDATED: "Cập nhật đơn hàng",
      ORDER_APPROVED: "Đơn hàng đã duyệt",
      ORDER_REJECTED: "Đơn hàng bị từ chối",
      ORDER_CANCELLED: "Đơn hàng đã hủy",
      ORDER_DELIVERED: "Đơn hàng đã giao",
    };
    return labels[type] || type;
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
      style={{ maxHeight: "500px", display: "flex", flexDirection: "column" }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          Thông báo {unreadCount > 0 && `(${unreadCount})`}
        </h3>
        {unreadCount > 0 && (
          <button
            onClick={() => {
              notifications
                .filter((n) => !n.isRead)
                .forEach((n) => markAsRead.mutate(n.id));
            }}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {/* Notifications List - Scrollable */}
      <div className="overflow-y-auto flex-1" style={{ maxHeight: "400px" }}>
        {isLoading ? (
          <div className="px-4 py-8 text-center text-gray-500">
            Đang tải thông báo...
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500">
            Không có thông báo nào
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => {
              const href = getNotificationLink(notification);

              return (
                <div
                  key={notification.id}
                  className={`relative group px-4 py-3 transition-colors ${getNotificationColor(
                    notification.isRead
                  )}`}
                >
                  <Link
                    href={href}
                    onClick={() => handleNotificationClick(notification)}
                    className="block"
                  >
                    <div className="flex items-start gap-3 pr-6">
                      <div className="flex-shrink-0 mt-1">
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-medium text-blue-600">
                            {getNotificationTypeLabel(notification.type)}
                          </p>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(
                              new Date(notification.createdAt),
                              {
                                addSuffix: true,
                                locale: vi,
                              }
                            )}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 mb-1">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  </Link>
                  <button
                    onClick={(e) =>
                      handleDeleteNotification(e, notification.id)
                    }
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-600"
                    aria-label="Xóa thông báo"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 space-y-2">
          <Link
            href={isAdmin() ? "/admin/orders" : "/my-account?tab=orders"}
            className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
            onClick={onClose}
          >
            Xem tất cả đơn hàng
          </Link>
          <button
            onClick={handleDeleteAll}
            className="w-full text-center text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Xóa tất cả
          </button>
        </div>
      )}

      {/* Delete All Confirmation Dialog */}
      <AlertDialog
        open={isDeleteAllDialogOpen}
        onOpenChange={setIsDeleteAllDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa tất cả thông báo</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa tất cả thông báo? Hành động này không
              thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAll}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa tất cả
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
