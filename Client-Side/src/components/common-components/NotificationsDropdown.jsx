import React, { useEffect, useRef, useState } from "react";
import { Bell, Check, Clock3, AlertCircle } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchNotifications,
  markNotificationRead,
} from "@/store/notification-slice";

const typeIcon = (type) => {
  switch (type) {
    case "drop":
      return <Clock3 className="h-4 w-4 text-[#D4AF37]" />;
    case "offer":
      return <AlertCircle className="h-4 w-4 text-[#60A5FA]" />;
    case "order":
      return <Check className="h-4 w-4 text-emerald-400" />;
    default:
      return <Bell className="h-4 w-4 text-gray-400" />;
  }
};

const NotificationsDropdown = () => {
  const dropdownRef = useRef(null);
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const { items, unreadCount, isLoading } = useSelector(
    (state) => state.notification,
  );

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleItemClick = async (notificationId, isRead) => {
    if (!isRead) {
      await dispatch(markNotificationRead(notificationId));
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="relative p-2 text-gray-400 hover:text-white transition-colors"
        onClick={handleToggle}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-96 max-h-[420px] min-w-[24rem] overflow-hidden overflow-y-auto rounded-2xl border border-gray-800 bg-[#0b0b0b] text-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Notifications</p>
              <p className="text-xs text-gray-400">Recent activity and alerts</p>
            </div>
            <button
              type="button"
              className="text-xs uppercase text-[#D4AF37] hover:text-white"
              onClick={() => dispatch(fetchNotifications())}
            >
              Refresh
            </button>
          </div>
          <div className="divide-y divide-gray-800">
            {isLoading ? (
              <div className="px-4 py-6 text-sm text-gray-400">Loading notifications…</div>
            ) : items.length === 0 ? (
              <div className="px-4 py-6 text-sm text-gray-400">No notifications yet.</div>
            ) : (
              items.map((notification) => (
                <button
                  key={notification._id}
                  type="button"
                  className={`w-full text-left px-4 py-4 transition-colors ${notification.isRead ? "bg-[#090909] hover:bg-[#111111]" : "bg-[#111111] hover:bg-[#1f1f1f]"}`}
                  onClick={() => handleItemClick(notification._id, notification.isRead)}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-1">{typeIcon(notification.type)}</span>
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-white">
                          {notification.title}
                        </span>
                        {!notification.isRead && (
                          <span className="rounded-full bg-[#D4AF37] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-black">
                            New
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-400 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="mt-2 text-[11px] uppercase tracking-[0.24em] text-gray-500">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;
