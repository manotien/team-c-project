"use client";

import { formatDistanceToNow } from "date-fns";

interface NotificationItemProps {
  notification: {
    id: string;
    type: string;
    message: string;
    createdAt: Date | string;
    readAt: Date | string | null;
    taskId: string;
  };
  onClick: () => void;
}

export default function NotificationItem({
  notification,
  onClick,
}: NotificationItemProps) {
  const isUnread = !notification.readAt;
  const icon = getNotificationIcon(notification.type);

  return (
    <div
      onClick={onClick}
      className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
        isUnread ? "bg-blue-50" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="text-2xl">{icon}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${isUnread ? "font-semibold" : ""}`}>
            {notification.message}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
            })}
          </p>
        </div>

        {/* Unread indicator */}
        {isUnread && <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />}
      </div>
    </div>
  );
}

function getNotificationIcon(type: string): string {
  const icons: Record<string, string> = {
    BILL_CREATED: "✅",
    DUE_SOON: "⏰",
    DUE_TODAY: "⚠️",
  };
  return icons[type] || "📬";
}
