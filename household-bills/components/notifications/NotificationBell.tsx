"use client";

import { useState, useEffect } from "react";
import { BellIcon } from "@heroicons/react/24/outline";
import NotificationDropdown from "./NotificationDropdown";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUnreadCount();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchUnreadCount() {
    const res = await fetch("/api/notifications?limit=0");
    const data = await res.json();
    setUnreadCount(data.unreadCount);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full"
      >
        <BellIcon className="h-6 w-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationDropdown
          onClose={() => setIsOpen(false)}
          onCountChange={setUnreadCount}
        />
      )}
    </div>
  );
}
