"use client";

import { useRouter } from "next/navigation";
import NotificationItem from "./NotificationItem";

interface Notification {
  id: string;
  type: string;
  message: string;
  createdAt: Date | string;
  readAt: Date | string | null;
  taskId: string;
}

interface NotificationListProps {
  notifications: Notification[];
}

export default function NotificationList({
  notifications,
}: NotificationListProps) {
  const router = useRouter();

  async function handleNotificationClick(notification: Notification) {
    // Mark as read
    if (!notification.readAt) {
      await fetch(`/api/notifications/${notification.id}/read`, {
        method: "PATCH",
      });
    }

    // Navigate to task
    router.push(`/tasks/${notification.taskId}`);
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-12 text-gray-600">
        No notifications yet
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClick={() => handleNotificationClick(notification)}
        />
      ))}
    </div>
  );
}
