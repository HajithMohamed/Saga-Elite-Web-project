import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Mail, Clock, CheckCircle2, XCircle, ChevronDown, MessageSquare } from "lucide-react";
import axios from "axios";
import { API_V1_URL } from "@/lib/api";
import { AdminPage, AdminPanel } from "@/components/admin-components/AdminUI";
import {
  pageVariants,
  containerVariants,
  itemVariants,
} from "@/components/admin-components/_shared/animations";
import { AnimatedNumber } from "@/components/admin-components/_shared/AnimatedNumber";
import { SkeletonGrid } from "@/components/admin-components/_shared/SkeletonCard";
import { toast } from "@/hooks/use-toast";
import Pagination from "@/components/common-components/Pagination";
import usePagination from "@/hooks/use-pagination";

const STATUS_OPTIONS = ["new", "in_progress", "resolved", "closed"];

const statusConfig = {
  new: { label: "New", color: "bg-sky-500/10 text-sky-300 border-sky-500/20", icon: Mail },
  in_progress: { label: "In Progress", color: "bg-amber-500/10 text-amber-300 border-amber-500/20", icon: Clock },
  resolved: { label: "Resolved", color: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20", icon: CheckCircle2 },
  closed: { label: "Closed", color: "bg-gray-500/10 text-gray-400 border-gray-500/20", icon: XCircle },
};

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatLabel = (value) =>
  String(value || "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const ContactInquiriesPage = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [adminNotes, setAdminNotes] = useState({});

  const fetchInquiries = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_V1_URL}/contact/admin`, {
        withCredentials: true,
      });
      if (res.data?.status === "success") {
        setInquiries(res.data.data?.inquiries || res.data.data || []);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load inquiries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      setUpdatingId(id);
      const body = { status: newStatus };
      if (adminNotes[id]) {
        body.adminNotes = adminNotes[id];
      }
      await axios.patch(`${API_V1_URL}/contact/admin/${id}`, body, {
        withCredentials: true,
      });
      toast({ title: "Updated", description: `Inquiry status changed to ${formatLabel(newStatus)}.`, variant: "success" });
      fetchInquiries();
    } catch (err) {
      toast({ title: "Update failed", description: err?.response?.data?.message || "Something went wrong", variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = inquiries.filter((item) => {
    const matchesSearch =
      !search ||
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.email?.toLowerCase().includes(search.toLowerCase()) ||
      item.subject?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const { page, setPage, pageCount, total, pageItems, pageSize } = usePagination(
    filtered,
    10
  );

  const statCounts = {
    total: inquiries.length,
    new: inquiries.filter((i) => i.status === "new").length,
    in_progress: inquiries.filter((i) => i.status === "in_progress").length,
    resolved: inquiries.filter((i) => i.status === "resolved").length,
  };

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="w-full min-h-0">
      <AdminPage
        eyebrow="Support"
        title="Contact inquiries"
        description="Review and respond to customer contact form submissions."
      >
        {/* Stat cards */}
        <motion.div
          className="grid grid-cols-2 gap-4 lg:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {[
            { label: "Total", value: statCounts.total, hint: "All inquiries" },
            { label: "New", value: statCounts.new, hint: "Unread submissions" },
            { label: "In Progress", value: statCounts.in_progress, hint: "Being handled" },
            { label: "Resolved", value: statCounts.resolved, hint: "Completed" },
          ].map((card) => (
            <motion.div
              key={card.label}
              variants={itemVariants}
              whileHover={{ y: -3, borderColor: "rgba(212,175,55,0.35)" }}
              transition={{ duration: 0.2 }}
              className="rounded-[28px] border border-ink/10 bg-ink/[0.03] p-5"
            >
              <p className="text-[11px] uppercase tracking-[0.28em] text-gray-500">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold text-ink">
                <AnimatedNumber value={card.value} />
              </p>
              <p className="mt-1 text-xs text-gray-500">{card.hint}</p>
            </motion.div>
          ))}
        </motion.div>

        <AdminPanel className="mt-6">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by name, email, or subject…"
                className="w-full rounded-2xl border border-ink/10 bg-black/60 py-2.5 pl-10 pr-4 text-sm text-ink outline-none focus:border-gold-ink2"
              />
            </div>
            <div className="flex gap-2">
              {["all", ...STATUS_OPTIONS].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setStatusFilter(opt);
                    setPage(1);
                  }}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                    statusFilter === opt
                      ? "border-gold-ink2/40 bg-gold-deep/15 text-ink"
                      : "border-ink/10 text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {opt === "all" ? "All" : formatLabel(opt)}
                </button>
              ))}
            </div>
          </div>

          {/* Loading / Error */}
          {loading ? (
            <div className="mt-6">
              <SkeletonGrid count={4} className="grid gap-4 md:grid-cols-2" />
            </div>
          ) : error ? (
            <div className="mt-6 rounded-[24px] border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="mt-6 rounded-[24px] border border-ink/10 bg-black/30 px-5 py-10 text-center text-sm text-gray-400">
              {search || statusFilter !== "all"
                ? "No inquiries match your filters."
                : "No contact inquiries yet."}
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {pageItems.map((inquiry) => {
                const cfg = statusConfig[inquiry.status] || statusConfig.new;
                const StatusIcon = cfg.icon;
                const isExpanded = expandedId === inquiry._id;

                return (
                  <motion.div
                    key={inquiry._id}
                    layout
                    className="rounded-[24px] border border-ink/10 bg-black/30 transition hover:border-ink/20"
                  >
                    {/* Header row */}
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : inquiry._id)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-ink/10 bg-ink/[0.04]">
                          <MessageSquare className="h-5 w-5 text-gold-ink2" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-ink">
                            {inquiry.name || "Anonymous"}
                            <span className="ml-2 text-xs font-normal text-gray-500">
                              {inquiry.email}
                            </span>
                          </p>
                          <p className="mt-0.5 text-xs text-gray-400">
                            {inquiry.subject || "No subject"} · {formatDate(inquiry.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] ${cfg.color}`}>
                          <StatusIcon className="mr-1 inline h-3 w-3" />
                          {cfg.label}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-gray-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </div>
                    </button>

                    {/* Expanded content */}
                    {isExpanded ? (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-ink/10 px-5 py-5"
                      >
                        {/* Message */}
                        <div className="rounded-2xl border border-ink/10 bg-ink/[0.02] p-4">
                          <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Message</p>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-gray-300">
                            {inquiry.message || "No message provided."}
                          </p>
                        </div>

                        {/* Phone number if present */}
                        {inquiry.phone ? (
                          <div className="mt-3 rounded-2xl border border-ink/10 bg-ink/[0.02] px-4 py-3">
                            <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Phone</p>
                            <p className="mt-1 text-sm text-ink">{inquiry.phone}</p>
                          </div>
                        ) : null}

                        {/* Existing admin notes */}
                        {inquiry.adminNotes ? (
                          <div className="mt-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                            <p className="text-[10px] uppercase tracking-[0.22em] text-amber-300">Previous Admin Notes</p>
                            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-300">{inquiry.adminNotes}</p>
                          </div>
                        ) : null}

                        {/* Admin notes input + status change */}
                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                          <div className="flex-1">
                            <label className="text-[10px] uppercase tracking-[0.22em] text-gray-500">
                              Admin Notes
                            </label>
                            <textarea
                              rows={2}
                              value={adminNotes[inquiry._id] || ""}
                              onChange={(e) =>
                                setAdminNotes((prev) => ({ ...prev, [inquiry._id]: e.target.value }))
                              }
                              placeholder="Add a note (optional)…"
                              className="mt-1 w-full resize-none rounded-2xl border border-ink/10 bg-black/60 px-4 py-2.5 text-sm text-ink outline-none focus:border-gold-ink2"
                            />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {STATUS_OPTIONS.filter((s) => s !== inquiry.status).map((status) => {
                              const sCfg = statusConfig[status];
                              return (
                                <motion.button
                                  key={status}
                                  type="button"
                                  whileTap={{ scale: 0.96 }}
                                  disabled={updatingId === inquiry._id}
                                  onClick={() => handleStatusUpdate(inquiry._id, status)}
                                  className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-wider transition disabled:opacity-50 ${sCfg.color} hover:opacity-80`}
                                >
                                  → {sCfg.label}
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    ) : null}
                  </motion.div>
                );
              })}
              <Pagination
                page={page}
                pageCount={pageCount}
                onPageChange={setPage}
                total={total}
                pageSize={pageSize}
                label="inquiries"
              />
            </div>
          )}
        </AdminPanel>
      </AdminPage>
    </motion.div>
  );
};

export default ContactInquiriesPage;
