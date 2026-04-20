import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { sendAdminNotification, resetNotificationError } from "@/store/notification-slice";
import { toast } from "@/hooks/use-toast";

const NotificationsManager = () => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.notification);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

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
    } catch (err) {
      const errorMessage =
        err?.message || err?.payload || err || "Unable to send the notification.";
      toast({
        title: "Send failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#060606] text-white py-10">
      <div className="container mx-auto px-4">
        <div className="rounded-3xl border border-[#D4AF37]/20 bg-[#0b0b0b] p-8">
          <h1 className="text-3xl font-bold tracking-wide text-white">Admin Notifications</h1>
          <p className="mt-2 text-sm text-gray-400">
            Send a system or admin message to all active users.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-300">Title</label>
              <input
                value={title}
                onChange={(event) => {
                  if (error) {
                    dispatch(resetNotificationError());
                  }
                  setTitle(event.target.value);
                }}
                className="w-full rounded-2xl border border-gray-800 bg-black px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
                placeholder="Message title"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-300">Message</label>
              <textarea
                value={message}
                onChange={(event) => {
                  if (error) {
                    dispatch(resetNotificationError());
                  }
                  setMessage(event.target.value);
                }}
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
        </div>
      </div>
    </div>
  );
};

export default NotificationsManager;
