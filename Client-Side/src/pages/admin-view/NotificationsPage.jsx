import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  Bell,
  Search,
  Trash2,
  Check,
  Mail,
  Megaphone,
  RotateCcw,
} from "lucide-react";
import { AdminPage } from "@/components/admin-components/AdminUI";
import { ConfirmInline } from "@/components/admin-components/_shared/ConfirmInline";
import { toast } from "@/hooks/use-toast";
import {
  fetchAdminNotificationsApi,
  updateAdminNotificationApi,
  deleteAdminNotificationApi,
  broadcastNotificationApi,
} from "@/api/adminNotificationsAPI";

const TYPE_TABS = [
  { value: "all", label: "All" },
  { value: "order", label: "Orders" },
  { value: "drop", label: "Drops" },
  { value: "offer", label: "Offers" },
  { value: "admin", label: "Admin" },
  { value: "reminder", label: "Reminders" },
  { value: "system", label: "System" },
];

const TYPE_STYLES = {
  order: "border-sky-400/40 bg-sky-400/10 text-sky-300",
  drop: "border-gold-ink/40 bg-gold/10 text-gold-ink",
  offer: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  admin: "border-violet-400/40 bg-violet-400/10 text-violet-300",
  reminder: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  system: "border-line/60 bg-ink/5 text-ink/60",
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const NotificationsPage = () => {
  const user = useSelector((state) => state.auth?.user);
  const isSuperAdmin = user?.role === "super_admin" || user?.role === "superadmin";
  const canBroadcast = isSuperAdmin || Boolean(user?.permissions?.sendCampaigns);

  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalCount: 0 });
  const [loading, setLoading] = useState(true);

  const [typeFilter, setTypeFilter] = useState("all");
  const [readFilter, setReadFilter] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  const [broadcast, setBroadcast] = useState({ title: "", message: "" });
  const [sending, setSending] = useState(false);
  const [actioningId, setActioningId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [typeFilter, readFilter, debouncedSearch]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchAdminNotificationsApi({
        page,
        limit: 20,
        type: typeFilter,
        isRead: readFilter,
        search: debouncedSearch || undefined,
      });
      setNotifications(res.data?.data?.notifications || []);
      setPagination(res.data?.data?.pagination || { currentPage: 1, totalPages: 1, totalCount: 0 });
    } catch (err) {
      toast({
        title: "Couldn't load notifications",
        description: err?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, typeFilter, readFilter, debouncedSearch]);

  const handleToggleRead = async (n) => {
    setActioningId(n._id);
    try {
      await updateAdminNotificationApi(n._id, { isRead: !n.isRead });
      setNotifications((prev) =>
        prev.map((x) => (x._id === n._id ? { ...x, isRead: !n.isRead } : x))
      );
    } catch (err) {
      toast({
        title: "Update failed",
        description: err?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setActioningId(null);
    }
  };

  const handleDelete = async (n) => {
    setActioningId(n._id);
    try {
      await deleteAdminNotificationApi(n._id);
      toast({ title: "Notification deleted" });
      setDeleteConfirmId(null);
      setNotifications((prev) => prev.filter((x) => x._id !== n._id));
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setActioningId(null);
    }
  };

  const handleBroadcast = async () => {
    if (!broadcast.title.trim() || !broadcast.message.trim()) {
      toast({
        title: "Title and message required",
        description: "Fill in both fields before sending.",
        variant: "destructive",
      });
      return;
    }
    setSending(true);
    try {
      await broadcastNotificationApi(broadcast);
      toast({
        title: "Message sent",
        description: "Delivered to all active customers.",
        variant: "success",
      });
      setBroadcast({ title: "", message: "" });
      load();
    } catch (err) {
      toast({
        title: "Broadcast failed",
        description: err?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminPage
      eyebrow="Communications"
      title="Notifications"
      description="Every notification delivered to customers — drop reminders, order updates, offers and admin broadcasts. Search, filter, mark read and remove."
    >
      {/* Broadcast composer */}
      {canBroadcast ? (
        <div className="mb-6 rounded-2xl border border-line/60 bg-page p-5">
          <div className="mb-3 flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-gold-ink" />
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-ink-2">
              Broadcast to all customers
            </h2>
          </div>
          <input
            type="text"
            value={broadcast.title}
            onChange={(e) => setBroadcast((p) => ({ ...p, title: e.target.value }))}
            placeholder="Title (e.g. New drop this Friday)"
            maxLength={250}
            className="mb-3 w-full rounded-lg border border-line/60 bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-gold-ink/50"
          />
          <textarea
            value={broadcast.message}
            onChange={(e) => setBroadcast((p) => ({ ...p, message: e.target.value }))}
            placeholder="Message…"
            rows={3}
            maxLength={1000}
            className="w-full resize-none rounded-lg border border-line/60 bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-gold-ink/50"
          />
          <div className="mt-3 flex items-center justify-between">
            <p className="text-[11px] text-ink/40">
              Sends an in-app notification to every active customer.
            </p>
            <button
              type="button"
              onClick={handleBroadcast}
              disabled={sending}
              className="inline-flex items-center gap-2 rounded-full bg-gold px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-ongold disabled:opacity-50"
            >
              <Mail className="h-3.5 w-3.5" />
              {sending ? "Sending…" : "Send broadcast"}
            </button>
          </div>
        </div>
      ) : null}

      {/* Filters */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setTypeFilter(tab.value)}
              className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] transition-colors ${
                typeFilter === tab.value
                  ? "border-gold-ink bg-gold/10 text-gold-ink"
                  : "border-line/60 text-ink/60 hover:border-gold-ink/40"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={readFilter}
            onChange={(e) => setReadFilter(e.target.value)}
            className="admin-select"
          >
            <option value="">All statuses</option>
            <option value="false">Unread</option>
            <option value="true">Read</option>
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title or message…"
              className="admin-input w-full !pl-10 sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <p className="py-10 text-center text-sm text-ink/50">Loading notifications…</p>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line/60 p-10 text-center text-ink/50">
          No notifications match the current filter.
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`rounded-2xl border bg-page p-4 ${
                n.isRead ? "border-line/60" : "border-gold-ink/40"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] ${
                        TYPE_STYLES[n.type] || TYPE_STYLES.system
                      }`}
                    >
                      {n.type}
                    </span>
                    {!n.isRead ? (
                      <span className="inline-flex h-1.5 w-1.5 rounded-full bg-gold" title="Unread" />
                    ) : null}
                    <p className="text-sm font-semibold text-ink-2">{n.title}</p>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-ink/60">{n.message}</p>
                  <p className="mt-1.5 text-[10px] uppercase tracking-[0.16em] text-ink/40">
                    {n.user?.name || n.user?.email || "Unknown"}
                    {n.user?.role ? ` · ${n.user.role}` : ""} · {fmtDate(n.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    disabled={actioningId === n._id}
                    onClick={() => handleToggleRead(n)}
                    className="inline-flex items-center gap-1 rounded-full border border-line/60 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-ink/60 hover:border-gold-ink/40 hover:text-gold-ink disabled:opacity-50"
                  >
                    {n.isRead ? (
                      <>
                        <RotateCcw className="h-3 w-3" /> Unread
                      </>
                    ) : (
                      <>
                        <Check className="h-3 w-3" /> Read
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={actioningId === n._id}
                    onClick={() => setDeleteConfirmId(n._id)}
                    className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-rose-300 hover:bg-rose-500/10 disabled:opacity-50"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              </div>
              <ConfirmInline
                show={deleteConfirmId === n._id}
                message="Delete this notification permanently? This removes it from the customer's inbox."
                confirmLabel={actioningId === n._id ? "Deleting…" : "Delete"}
                onConfirm={() => handleDelete(n)}
                onCancel={() => setDeleteConfirmId(null)}
                className="mt-3"
              />
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-full border border-line/60 px-4 py-1.5 text-xs text-ink/70 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs text-ink/50">
            Page {pagination.currentPage} of {pagination.totalPages} · {pagination.totalCount} total
          </span>
          <button
            type="button"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            className="rounded-full border border-line/60 px-4 py-1.5 text-xs text-ink/70 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}

      <div className="mt-6 flex items-center gap-2 text-[11px] text-ink/40">
        <Bell className="h-3.5 w-3.5" />
        Notifications are generated automatically by orders, drops, offers and reminders.
      </div>
    </AdminPage>
  );
};

export default NotificationsPage;
