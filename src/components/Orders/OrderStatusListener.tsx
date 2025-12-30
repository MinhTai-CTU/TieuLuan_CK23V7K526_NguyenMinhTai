"use client";

import { useEffect, useRef } from "react";
import { getUser } from "@/lib/auth-storage";
import toast from "react-hot-toast";
import Pusher from "pusher-js";

/**
 * Component để lắng nghe thông báo cập nhật trạng thái đơn hàng
 * và hiển thị toast notification
 */
export default function OrderStatusListener() {
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    const user = getUser();
    if (!user) return;

    // Initialize Pusher
    if (!pusherRef.current) {
      pusherRef.current = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || "", {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap1",
      });
    }

    // Subscribe to user channel for notifications
    if (user.id && !channelRef.current) {
      channelRef.current = pusherRef.current.subscribe(`user-${user.id}`);

      // Listen for new notifications
      channelRef.current.bind("notification", (data: any) => {
        // Chỉ hiển thị toast cho thông báo về đơn hàng
        if (data.type && data.type.startsWith("ORDER_")) {
          const statusLabels: Record<string, string> = {
            ORDER_CREATED: "Đơn hàng mới",
            ORDER_UPDATED: "Cập nhật đơn hàng",
            ORDER_APPROVED: "Đơn hàng đã được duyệt",
            ORDER_REJECTED: "Đơn hàng bị từ chối",
            ORDER_CANCELLED: "Đơn hàng đã hủy",
            ORDER_DELIVERED: "Đơn hàng đã giao",
          };

          const title = statusLabels[data.type] || "Thông báo đơn hàng";

          toast.success(
            <div>
              <p className="font-semibold">{title}</p>
              <p className="text-sm">{data.message}</p>
            </div>,
            {
              duration: 5000,
              position: "top-right",
            }
          );
        }
      });
    }

    return () => {
      if (channelRef.current) {
        channelRef.current.unbind_all();
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      if (pusherRef.current) {
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
    };
  }, []);

  return null;
}
