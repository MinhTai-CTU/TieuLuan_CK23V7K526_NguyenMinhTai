import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

export type NotificationType =
  | "ORDER_CREATED"
  | "ORDER_UPDATED"
  | "ORDER_APPROVED"
  | "ORDER_REJECTED"
  | "ORDER_CANCELLED"
  | "ORDER_DELIVERED";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  orderId?: string;
}

/**
 * Create a notification and send it via Pusher
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  orderId,
}: CreateNotificationParams) {
  try {
    // Create notification in database
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        orderId,
        isRead: false,
      },
    });

    // Send real-time notification via Pusher
    await pusherServer.trigger(`user-${userId}`, "notification", {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      orderId: notification.orderId,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    });

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

/**
 * Create notifications for all admin users
 */
export async function notifyAllAdmins({
  type,
  title,
  message,
  orderId,
}: Omit<CreateNotificationParams, "userId">) {
  try {
    // Get all admin users
    const adminUsers = await prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            role: {
              name: "ADMIN",
            },
          },
        },
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    // Create notification for each admin
    const notifications = await Promise.all(
      adminUsers.map((admin) =>
        createNotification({
          userId: admin.id,
          type,
          title,
          message,
          orderId,
        })
      )
    );

    return notifications;
  } catch (error) {
    console.error("Error notifying all admins:", error);
    throw error;
  }
}
