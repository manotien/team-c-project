"use client";

import { useState, useEffect } from "react";
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

interface NotificationDropdownProps {
  onClose: () => void;
  onCountChange: (count: number) => void;
}

export default function NotificationDropdown({
  onClose,
  onCountChange,
}: NotificationDropdownProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    setLoading(true);
    const res = await fetch("/api/notifications?limit=10");
    const data = await res.json();
    setNotifications(data.notifications);
    setLoading(false);
  }

  async function handleNotificationClick(notification: Notification) {
    // Mark as read
    if (!notification.readAt) {
      await fetch(`/api/notifications/${notification.id}/read`, {
        method: "PATCH",
      });

      // Update unread count by fetching fresh count
      const res = await fetch("/api/notifications?limit=0");
      const data = await res.json();
      onCountChange(data.unreadCount);
    }

    // Navigate to task
    router.push(`/tasks/${notification.taskId}`);
    onClose();
  }

  async function handleMarkAllRead() {
    await fetch("/api/notifications/mark-all-read", {
      method: "PATCH",
    });
    onCountChange(0);
    fetchNotifications();
  }

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-lg">Notifications</h3>
        <button
          onClick={handleMarkAllRead}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Mark all read
        </button>
      </div>

      {/* Notification List */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-600">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            No notifications yet
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onClick={() => handleNotificationClick(notification)}
            />
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t text-center">
          <button
            onClick={() => {
              router.push("/notifications");
              onClose();
            }}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}
