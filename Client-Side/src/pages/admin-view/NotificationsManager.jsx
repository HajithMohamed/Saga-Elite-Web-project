import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAdminNotifications,
  sendAdminNotification,
  updateAdminNotification,
  deleteAdminNotification,
} from "@/store/notification-slice";
import { toast } from "@/hooks/use-toast";
import {
  Search,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
} from "lucide-react";

const notificationTypes = [
  "all",
  "drop",
  "offer",
  "order",
  "admin",
  "reminder",
  "system",
];

const NotificationsManager = () => {
  const dispatch = useDispatch();
  const {
    isLoading,
    error,
    adminItems,
    adminPagination,
    adminIsLoading,
    adminError,
  } = useSelector((state) => state.notification);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [adminSearch, setAdminSearch] = useState("");
  const [adminUser, setAdminUser] = useState("");
  const [adminType, setAdminType] = useState("all");
  const [adminStatus, setAdminStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingNotification, setEditingNotification] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    message: "",
    type: "admin",
    isRead: false,
  });

  const LIMIT = 10;

  const loadAdminNotifications = useCallback(() => {
    dispatch(
      fetchAdminNotifications({
        page: currentPage,
        limit: LIMIT,
        search: adminSearch || undefined,
        type: adminType === "all" ? undefined : adminType,
        isRead:
          adminStatus === "all"
            ? undefined
            : adminStatus === "read",
        userEmail: adminUser || undefined,
      }),
    );
  }, [dispatch, currentPage, adminSearch, adminType, adminStatus, adminUser]);

  useEffect(() => {
    loadAdminNotifications();
  }, [loadAdminNotifications]);

  const resetBroadcastForm = () => {
    setTitle("");
    setMessage("");
  };

  const resetEditForm = () => {
    setEditingNotification(null);
    setEditForm({ title: "", message: "", type: "admin", isRead: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      toast({
        title: "Validation error",
        description: "Both title and message are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      await dispatch(sendAdminNotification({ title, message })).unwrap();
      toast({
        title: "Message sent",
        description: "Your admin notification was sent to active users.",
        variant: "success",
      });
      resetBroadcastForm();
      loadAdminNotifications();
    } catch (err) {
      toast({
        title: "Send failed",
        description: err || "Unable to send the notification.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (notification) => {
    setEditingNotification(notification._id);
    setEditForm({
      title: notification.title,
      message: notification.message,
      type: notification.type || "admin",
      isRead: Boolean(notification.isRead),
    });
  };

  const handleSaveEdit = async (event) => {
    event.preventDefault();

    if (!editingNotification) {
      return;
    }

    if (!editForm.title.trim() || !editForm.message.trim()) {
      toast({
        title: "Validation error",
        description: "Title and message cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    try {
      await dispatch(
        updateAdminNotification({
          notificationId: editingNotification,
          payload: {
            title: editForm.title,
            message: editForm.message,
            type: editForm.type,
            isRead: editForm.isRead,
          },
        }),
      ).unwrap();
      toast({
        title: "Saved",
        description: "Notification updated successfully.",
        variant: "success",
      });
      resetEditForm();
      loadAdminNotifications();
    } catch (err) {
      toast({
        title: "Update failed",
        description: err || "Unable to update the notification.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (notificationId) => {
    if (!window.confirm("Delete this notification? This cannot be undone.")) {
      return;
    }

    try {
      await dispatch(deleteAdminNotification(notificationId)).unwrap();
      toast({
        title: "Deleted",
        description: "Notification removed successfully.",
        variant: "success",
      });
      if (adminItems.length === 1 && currentPage > 1) {
        setCurrentPage((page) => page - 1);
      } else {
        loadAdminNotifications();
      }
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err || "Unable to delete the notification.",
        variant: "destructive",
      });
    }
  };

  const handleToggleRead = async (notification) => {
    try {
      await dispatch(
        updateAdminNotification({
          notificationId: notification._id,
          payload: { isRead: !notification.isRead },
        }),
      ).unwrap();
      toast({
        title: notification.isRead ? "Marked unread" : "Marked read",
        description: "Notification status updated.",
        variant: "success",
      });
      loadAdminNotifications();
    } catch (err) {
      toast({
        title: "Update failed",
        description: err || "Unable to update read status.",
        variant: "destructive",
      });
    }
  };

  const pageCount = adminPagination.totalPages || 1;

  return (
    <div className="min-h-screen bg-[#060606] text-white py-10">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 lg:grid-cols-[1.2fr,0.9fr]">
          <section className="rounded-3xl border border-[#D4AF37]/20 bg-[#0b0b0b] p-8">
            <h1 className="text-3xl font-bold tracking-wide text-white">Admin Notifications</h1>
            <p className="mt-2 text-sm text-gray-400">
              Send system or admin messages to all active users, and manage existing notifications.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-300">Title</label>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="w-full rounded-2xl border border-gray-800 bg-black px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
                  placeholder="Message title"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-300">Message</label>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  className="min-h-[180px] w-full rounded-2xl border border-gray-800 bg-black px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
                  placeholder="Write the admin message here..."
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-red-500 bg-[#2d0b0b] px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center justify-center rounded-2xl bg-[#D4AF37] px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-black transition hover:bg-[#b88f2f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "Sending…" : "Send notification"}
              </button>
            </form>
          </section>

          <section className="rounded-3xl border border-[#D4AF37]/20 bg-[#0b0b0b] p-8">
            <h2 className="text-2xl font-bold tracking-wide text-white">Notification Management</h2>
            <p className="mt-2 text-sm text-gray-400">
              Search, filter, edit, mark read/unread, and remove notifications.
            </p>

            <div className="mt-8 space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="relative rounded-2xl border border-gray-800 bg-black px-4 py-3">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input
                    value={adminSearch}
                    onChange={(event) => {
                      setAdminSearch(event.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full bg-transparent pl-10 text-sm text-white outline-none"
                    placeholder="Search title or message"
                  />
                </div>

                <div className="relative rounded-2xl border border-gray-800 bg-black px-4 py-3">
                  <input
                    value={adminUser}
                    onChange={(event) => {
                      setAdminUser(event.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full bg-transparent text-sm text-white outline-none"
                    placeholder="Search user email or name"
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <select
                  value={adminType}
                  onChange={(event) => {
                    setAdminType(event.target.value);
                    setCurrentPage(1);
                  }}
                  className="rounded-2xl border border-gray-800 bg-black px-4 py-3 text-sm text-white outline-none"
                >
                  {notificationTypes.map((type) => (
                    <option key={type} value={type}>
                      {type === "all" ? "All types" : type}
                    </option>
                  ))}
                </select>

                <select
                  value={adminStatus}
                  onChange={(event) => {
                    setAdminStatus(event.target.value);
                    setCurrentPage(1);
                  }}
                  className="rounded-2xl border border-gray-800 bg-black px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="all">All statuses</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                </select>

                <button
                  type="button"
                  onClick={() => loadAdminNotifications()}
                  className="inline-flex items-center justify-center rounded-2xl bg-[#D4AF37] px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] text-black transition hover:bg-[#b88f2f]"
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Refresh
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-10 rounded-3xl border border-[#D4AF37]/20 bg-[#0b0b0b] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-white">Admin notification inbox</h2>
            <p className="text-sm text-gray-400">
              {adminPagination.totalCount || 0} total notifications
            </p>
          </div>

          {adminError && (
            <div className="mt-4 rounded-2xl border border-red-500 bg-[#2d0b0b] px-4 py-3 text-sm text-red-300">
              {adminError}
            </div>
          )}

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.24em] text-gray-400">
                  <th className="pb-4 pr-6">User</th>
                  <th className="pb-4 pr-6">Type</th>
                  <th className="pb-4 pr-6">Title</th>
                  <th className="pb-4 pr-6">Status</th>
                  <th className="pb-4 pr-6">Created</th>
                  <th className="pb-4 pr-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-sm text-gray-400">
                      {adminIsLoading ? "Loading notifications…" : "No notifications found."}
                    </td>
                  </tr>
                ) : (
                  adminItems.map((notification) => (
                    <tr key={notification._id} className="border-t border-gray-800">
                      <td className="py-4 pr-6 align-top text-sm text-white">
                        {notification.user?.email || notification.user?.name || "—"}
                      </td>
                      <td className="py-4 pr-6 align-top text-sm text-gray-200">{notification.type}</td>
                      <td className="py-4 pr-6 align-top text-sm text-white">
                        <div className="font-semibold">{notification.title}</div>
                        <div className="mt-1 text-xs text-gray-400 line-clamp-2">
                          {notification.message}
                        </div>
                      </td>
                      <td className="py-4 pr-6 align-top text-sm">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${
                            notification.isRead
                              ? "bg-emerald-500/10 text-emerald-300"
                              : "bg-[#D4AF37]/10 text-[#D4AF37]"
                          }`}
                        >
                          {notification.isRead ? "Read" : "Unread"}
                        </span>
                      </td>
                      <td className="py-4 pr-6 align-top text-sm text-gray-400">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 align-top text-sm text-gray-200">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleRead(notification)}
                            className="inline-flex items-center rounded-2xl border border-gray-800 bg-black px-3 py-2 text-xs text-white transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
                          >
                            {notification.isRead ? <X className="mr-2 h-3.5 w-3.5" /> : <Check className="mr-2 h-3.5 w-3.5" />}
                            {notification.isRead ? "Unread" : "Read"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEdit(notification)}
                            className="inline-flex items-center rounded-2xl border border-gray-800 bg-black px-3 py-2 text-xs text-white transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
                          >
                            <Edit2 className="mr-2 h-3.5 w-3.5" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(notification._id)}
                            className="inline-flex items-center rounded-2xl border border-red-600/50 bg-black px-3 py-2 text-xs text-red-300 transition hover:bg-red-600/10"
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {adminItems.length > 0 && (
            <div className="mt-6 flex items-center justify-between gap-4 text-sm text-gray-300">
              <div>
                Page {currentPage} of {pageCount}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  className="inline-flex items-center gap-2 rounded-2xl border border-gray-800 bg-black px-4 py-2 text-xs transition hover:border-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                <button
                  type="button"
                  disabled={currentPage >= pageCount}
                  onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
                  className="inline-flex items-center gap-2 rounded-2xl border border-gray-800 bg-black px-4 py-2 text-xs transition hover:border-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {editingNotification && (
          <div className="mt-10 rounded-3xl border border-[#D4AF37]/20 bg-[#0b0b0b] p-8">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white">Edit notification</h3>
                <p className="text-sm text-gray-400">Update the title, message, type, or mark read status.</p>
              </div>
              <button
                type="button"
                onClick={resetEditForm}
                className="inline-flex items-center rounded-2xl border border-gray-800 bg-black px-4 py-2 text-xs text-white transition hover:border-[#D4AF37]"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-300">Type</label>
                <select
                  value={editForm.type}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, type: event.target.value }))}
                  className="w-full rounded-2xl border border-gray-800 bg-black px-4 py-3 text-sm text-white outline-none"
                >
                  {notificationTypes
                    .filter((type) => type !== "all")
                    .map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-300">Title</label>
                <input
                  value={editForm.title}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, title: event.target.value }))}
                  className="w-full rounded-2xl border border-gray-800 bg-black px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
                  placeholder="Notification title"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-300">Message</label>
                <textarea
                  value={editForm.message}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, message: event.target.value }))}
                  className="min-h-[140px] w-full rounded-2xl border border-gray-800 bg-black px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
                  placeholder="Notification message"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <label className="inline-flex items-center gap-3 rounded-2xl border border-gray-800 bg-black px-4 py-3 text-sm text-white">
                  <input
                    type="checkbox"
                    checked={editForm.isRead}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, isRead: event.target.checked }))}
                    className="h-4 w-4 rounded border-gray-600 bg-slate-900 text-[#D4AF37] focus:ring-[#D4AF37]"
                  />
                  Mark as read
                </label>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-2xl bg-[#D4AF37] px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-black transition hover:bg-[#b88f2f]"
                >
                  Save changes
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsManager;
