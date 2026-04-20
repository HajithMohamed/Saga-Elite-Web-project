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
      setTitle("");
      setMessage("");
      loadAdminNotifications();
    } catch (err) {
      toast({
        title: "Send failed",
        description: err?.message || "Unable to send the notification.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#060606] text-white py-10">
      <div className="container mx-auto px-4">
        <section className="rounded-3xl border border-[#D4AF37]/20 bg-[#0b0b0b] p-8">
          <h1 className="text-3xl font-bold text-white">Admin Notifications</h1>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div>
              <label className="text-sm text-gray-300">Title</label>
              <input
                value={title}
                onChange={(e) => {
                  if (error) dispatch(resetNotificationError());
                  setTitle(e.target.value);
                }}
                className="w-full rounded-xl bg-black px-4 py-3"
              />
            </div>

            <div>
              <label className="text-sm text-gray-300">Message</label>
              <textarea
                value={message}
                onChange={(e) => {
                  if (error) dispatch(resetNotificationError());
                  setMessage(e.target.value);
                }}
                className="w-full rounded-xl bg-black px-4 py-3"
              />
            </div>

            {error && <p className="text-red-400">{error}</p>}

            <button className="bg-yellow-500 px-6 py-3 rounded-xl">
              {isLoading ? "Sending..." : "Send"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default NotificationsManager;