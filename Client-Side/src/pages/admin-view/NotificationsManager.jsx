import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAdminNotifications,
  sendAdminNotification,
  updateAdminNotification,
  deleteAdminNotification,
  resetNotificationError,
} from "@/store/notification-slice";
import { toast } from "@/hooks/use-toast";
import { useSocketEvent } from "@/hooks/use-socket-events";
import {
  Search,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  RefreshCcw,
} from "lucide-react";
import { AdminPage } from "@/components/admin-components/AdminUI";

const notificationTypes = [
  "all",
  "drop",
  "offer",
  "order",
  "admin",
  "reminder",
  "system",
];

const statusOptions = [
  { value: "all", label: "All" },
  { value: "read", label: "Read" },
  { value: "unread", label: "Unread" },
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
  }, [dispatch, adminSearch, adminType, adminStatus, adminUser, currentPage]);

  useEffect(() => {
    loadAdminNotifications();
  }, [loadAdminNotifications]);

  useSocketEvent(
    "notification:refresh",
    () => {
      loadAdminNotifications();
    },
    [loadAdminNotifications]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [adminSearch, adminUser, adminType, adminStatus]);

  const resetForm = () => {
    setTitle("");
    setMessage("");
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
        description: "Your notification has been sent to active users.",
        variant: "success",
      });
      resetForm();
      loadAdminNotifications();
    } catch (err) {
      toast({
        title: "Send failed",
        description: err?.message || "Unable to send the notification.",
        variant: "destructive",
      });
    }
  };

  const handleEditClick = (notification) => {
    setEditingNotification(notification);
    setEditForm({
      title: notification.title || "",
      message: notification.message || "",
      type: notification.type || "admin",
      isRead: !!notification.isRead,
    });
  };

  const handleEditCancel = () => {
    setEditingNotification(null);
    setEditForm({ title: "", message: "", type: "admin", isRead: false });
  };

  const handleSaveEdit = async () => {
    if (!editingNotification) return;
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
          notificationId: editingNotification._id,
          payload: {
            title: editForm.title,
            message: editForm.message,
            type: editForm.type,
            isRead: editForm.isRead,
          },
        }),
      ).unwrap();
      toast({
        title: "Updated",
        description: "Notification updated successfully.",
        variant: "success",
      });
      handleEditCancel();
      loadAdminNotifications();
    } catch (err) {
      toast({
        title: "Update failed",
        description: err?.message || "Unable to update notification.",
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
      loadAdminNotifications();
    } catch (err) {
      toast({
        title: "Update failed",
        description: err?.message || "Unable to change read state.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await dispatch(deleteAdminNotification(notificationId)).unwrap();
      toast({
        title: "Deleted",
        description: "Notification removed successfully.",
        variant: "success",
      });
      loadAdminNotifications();
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err?.message || "Unable to remove notification.",
        variant: "destructive",
      });
    }
  };

  const handlePageChange = (direction) => {
    if (direction === "prev" && currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
    if (direction === "next" && currentPage < (adminPagination.totalPages || 1)) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const renderStatusLabel = (isRead) =>
    isRead ? (
      <span className="inline-flex rounded-full bg-green-800 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-200">
        Read
      </span>
    ) : (
      <span className="inline-flex rounded-full bg-yellow-800 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-yellow-200">
        Unread
      </span>
    );

  return (
    <AdminPage
      eyebrow="Notification control"
      title="Admin Notifications"
      description="Broadcast, filter, edit, and maintain notification history from one screen."
    >
      <div className="container mx-auto px-0">
        <section className="rounded-3xl border border-[#D4AF37]/20 bg-[#0b0b0b] p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Admin Notifications</h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-400">
                Manage notification broadcasts, review message history, and keep admin alerts under control.
              </p>
            </div>
            <button
              type="button"
              onClick={loadAdminNotifications}
              className="inline-flex items-center gap-2 rounded-2xl border border-[#D4AF37]/30 bg-black px-4 py-2 text-sm text-white transition hover:border-[#D4AF37]"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-[#0d0d0d] p-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <label className="space-y-2 text-sm text-gray-300">
                    Search
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                      <input
                        value={adminSearch}
                        onChange={(e) => setAdminSearch(e.target.value)}
                        placeholder="Title or message"
                        className="w-full rounded-2xl border border-white/10 bg-black/80 py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </label>
                  <label className="space-y-2 text-sm text-gray-300">
                    User email
                    <input
                      value={adminUser}
                      onChange={(e) => setAdminUser(e.target.value)}
                      placeholder="Search user email"
                      className="w-full rounded-2xl border border-white/10 bg-black/80 py-3 px-4 text-sm text-white outline-none focus:border-[#D4AF37]"
                    />
                  </label>
                  <label className="space-y-2 text-sm text-gray-300">
                    Type
                    <select
                      value={adminType}
                      onChange={(e) => setAdminType(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-black/80 py-3 px-4 text-sm text-white outline-none focus:border-[#D4AF37]"
                    >
                      {notificationTypes.map((type) => (
                        <option key={type} value={type}>
                          {type === "all" ? "All types" : type}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2 text-sm text-gray-300">
                    Status
                    <select
                      value={adminStatus}
                      onChange={(e) => setAdminStatus(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-black/80 py-3 px-4 text-sm text-white outline-none focus:border-[#D4AF37]"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#0d0d0d] p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Notification history</h2>
                    <p className="mt-2 text-sm text-gray-400">
                      Showing {adminPagination.totalCount || 0} notifications.
                    </p>
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                    <thead>
                      <tr className="bg-white/5 text-xs uppercase tracking-[0.2em] text-gray-500">
                        <th className="px-4 py-3">Title</th>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminIsLoading ? (
                        <tr>
                          <td colSpan="6" className="px-4 py-8 text-center text-gray-400">
                            Loading notifications…
                          </td>
                        </tr>
                      ) : adminItems.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-4 py-8 text-center text-gray-400">
                            No admin notifications found.
                          </td>
                        </tr>
                      ) : (
                        adminItems.map((notification) => (
                          <tr key={notification._id} className="border-t border-white/10 hover:bg-white/5">
                            <td className="px-4 py-4 align-top">
                              <div className="font-semibold text-white">{notification.title}</div>
                              <div className="mt-1 text-xs text-gray-400 line-clamp-2">
                                {notification.message}
                              </div>
                            </td>
                            <td className="px-4 py-4 align-top text-sm text-gray-300">
                              {notification.user?.email || "-"}
                            </td>
                            <td className="px-4 py-4 align-top text-sm text-gray-300">
                              <span className="rounded-full bg-[#1f1f1f] px-3 py-1 text-xs uppercase tracking-[0.15em] text-gray-200">
                                {notification.type}
                              </span>
                            </td>
                            <td className="px-4 py-4 align-top">{renderStatusLabel(notification.isRead)}</td>
                            <td className="px-4 py-4 align-top text-sm text-gray-400">
                              {new Date(notification.createdAt).toLocaleString()}
                            </td>
                            <td className="px-4 py-4 align-top space-x-2">
                              <button
                                type="button"
                                onClick={() => handleToggleRead(notification)}
                                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black px-3 py-2 text-xs text-white transition hover:border-[#D4AF37]"
                              >
                                <Check className="h-3.5 w-3.5" />
                                {notification.isRead ? "Mark unread" : "Mark read"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEditClick(notification)}
                                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black px-3 py-2 text-xs text-white transition hover:border-[#D4AF37]"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(notification._id)}
                                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-red-600/10 px-3 py-2 text-xs text-red-200 transition hover:border-red-400"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-400">
                  <p>
                    Page {currentPage} of {adminPagination.totalPages || 1}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePageChange("prev")}
                      disabled={currentPage <= 1}
                      className="rounded-2xl border border-white/10 bg-black px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePageChange("next")}
                      disabled={currentPage >= (adminPagination.totalPages || 1)}
                      className="rounded-2xl border border-white/10 bg-black px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-[#0d0d0d] p-6">
                <h2 className="text-xl font-semibold text-white">Broadcast notification</h2>
                <p className="mt-2 text-sm text-gray-400">
                  Send a notification to all active users. Keep messages clear and targeted.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                  <div>
                    <label className="mb-2 block text-sm text-gray-300">Title</label>
                    <input
                      value={title}
                      onChange={(e) => {
                        if (error) dispatch(resetNotificationError());
                        setTitle(e.target.value);
                      }}
                      className="w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]"
                      placeholder="Notification title"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-300">Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => {
                        if (error) dispatch(resetNotificationError());
                        setMessage(e.target.value);
                      }}
                      className="w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]"
                      placeholder="Notification message"
                      rows={6}
                    />
                  </div>

                  {error && <p className="text-sm text-red-400">{error}</p>}

                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#c99d2f]"
                  >
                    {isLoading ? "Sending..." : "Send notification"}
                  </button>
                </form>
              </div>

              {editingNotification && (
                <div className="rounded-3xl border border-white/10 bg-[#0d0d0d] p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-white">Edit notification</h2>
                      <p className="mt-2 text-sm text-gray-400">
                        Update title, message, type, or read state.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleEditCancel}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/80 text-gray-400 transition hover:border-[#D4AF37]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="mb-2 block text-sm text-gray-300">Title</label>
                      <input
                        value={editForm.title}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                        className="w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm text-gray-300">Message</label>
                      <textarea
                        value={editForm.message}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, message: e.target.value }))}
                        className="w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]"
                        rows={5}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="space-y-2 text-sm text-gray-300">
                        Type
                        <select
                          value={editForm.type}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, type: e.target.value }))}
                          className="w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]"
                        >
                          {notificationTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex items-center gap-3 text-sm text-gray-300">
                        <input
                          type="checkbox"
                          checked={editForm.isRead}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, isRead: e.target.checked }))}
                          className="h-4 w-4 rounded border-gray-600 bg-black text-[#D4AF37] focus:ring-[#D4AF37]"
                        />
                        Mark as read
                      </label>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        className="inline-flex items-center justify-center rounded-2xl bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#c99d2f]"
                      >
                        Save changes
                      </button>
                      <button
                        type="button"
                        onClick={handleEditCancel}
                        className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-black px-5 py-3 text-sm text-white transition hover:border-[#D4AF37]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {adminError && (
            <div className="mt-6 rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              {adminError}
            </div>
          )}
        </section>
      </div>
    </AdminPage>
  );
};

export default NotificationsManager;
