import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchNotifications, markNotificationRead } from "@/store/notification-slice";

const NotificationsPage = () => {
  const dispatch = useDispatch();
  const { items, unreadCount, isLoading, error } = useSelector(
    (state) => state.notification,
  );

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleMarkRead = (id) => {
    dispatch(markNotificationRead(id));
  };

  return (
    <div className="min-h-screen bg-[#060606] text-white py-10">
      <div className="container mx-auto px-4">
        <div className="mb-8 rounded-3xl border border-[#D4AF37]/20 bg-[#0b0b0b] p-6">
          <h1 className="text-3xl font-bold tracking-wide text-white">Notifications</h1>
          <p className="mt-2 text-sm text-gray-400">
            You have {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}.
          </p>
        </div>

        <div className="space-y-4">
          {isLoading && (
            <div className="rounded-3xl border border-gray-800 bg-[#0b0b0b] p-6 text-sm text-gray-400">
              Loading notifications…
            </div>
          )}

          {error && (
            <div className="rounded-3xl border border-red-500 bg-[#1f0f0f] p-6 text-sm text-red-400">
              {error}
            </div>
          )}

          {!isLoading && items.length === 0 && (
            <div className="rounded-3xl border border-gray-800 bg-[#0b0b0b] p-6 text-sm text-gray-400">
              No notifications available.
            </div>
          )}

          {items.map((notification) => (
            <div
              key={notification._id}
              className={`rounded-3xl border p-6 transition-all ${notification.isRead ? "border-gray-800 bg-[#080808]" : "border-[#D4AF37] bg-[#111111]"}`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">{notification.title}</h2>
                  <p className="mt-2 text-sm text-gray-400">{notification.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleMarkRead(notification._id)}
                  disabled={notification.isRead}
                  className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em] transition ${notification.isRead ? "bg-gray-700 text-gray-400" : "bg-[#D4AF37] text-black hover:bg-[#b88f2f]"}`}
                >
                  {notification.isRead ? "Read" : "Mark as read"}
                </button>
              </div>
              <p className="mt-4 text-[11px] uppercase tracking-[0.24em] text-gray-500">
                {new Date(notification.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
