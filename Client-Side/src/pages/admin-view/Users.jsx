import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import {
  BellRing,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  Crown,
  KeyRound,
  Mail,
  MapPin,
  RefreshCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  UserCheck,
  UserCog,
  Users,
  Tag as TagIcon,
  StickyNote,
  Plus,
  Loader2,
  Activity, Sparkles, CheckCircle2, Circle, Heart, Truck, Package, MessageSquare, ArrowUpRight, ArrowUp, ArrowDown, Eye, AlertTriangle, TrendingUp, Filter, Download,
} from "lucide-react";
import { AdminPage } from "@/components/admin-components/AdminUI";
import {
  deleteAdminUser,
  fetchAdminUserDetail,
  fetchAdminUsers,
  triggerAdminPasswordReset,
  updateAdminUserStatus,
  bulkTagUsers,
} from "@/store/admin/user-slice";
import { toast } from "@/hooks/use-toast";
import { pageVariants, containerVariants, itemVariants } from "@/components/admin-components/_shared/animations";
import { ConfirmInline } from "@/components/admin-components/_shared/ConfirmInline";
import { StatusBadge } from "@/components/admin-components/_shared/StatusBadge";
import { SkeletonCard } from "@/components/admin-components/_shared/SkeletonCard";
import BulkActionBar from "@/components/admin-components/_shared/BulkActionBar";
import useBulkSelection from "@/hooks/use-bulk-selection";

const BULK_USER_TAGS = ["vip", "high_spender", "drop_collector", "frequent_buyer", "refund_risk", "early_supporter"];

const MEMBERSHIP_FILTER_TABS = [
  { value: "all", label: "All" },
  { value: "vip", label: "VIP" },
  { value: "legend", label: "Legend" },
  { value: "rare", label: "Rare" },
  { value: "elite", label: "Elite" },
  { value: "standard", label: "Standard" },
  { value: "blocked", label: "Blocked" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "spent_desc", label: "Total spent ↓" },
  { value: "orders_desc", label: "Order count ↓" },
  { value: "last_active", label: "Last active" },
];

const USER_PAGE_LIMIT = 10;

const MEMBERSHIP_STYLES = {
  vip: "border-[#f2ca50] bg-[#f2ca50]/15 text-[#f2ca50]",
  legend: "border-purple-400/40 bg-purple-400/10 text-purple-300",
  rare: "border-cyan-400/40 bg-cyan-400/10 text-cyan-300",
  elite: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  standard: "border-white/10 bg-white/5 text-gray-300",
};

// Customer tags drive segmentation in Marketing + Notifications. Order matters
// here — these render as a chip row, left-to-right. Keep keys in sync with the
// User model's enum.
const CUSTOMER_TAGS = [
  {
    key: "vip",
    label: "VIP",
    description: "Manual flag for high-touch service",
    accent: "border-[#f2ca50]/50 bg-[#f2ca50]/15 text-[#f2ca50]",
  },
  {
    key: "high_spender",
    label: "High Spender",
    description: "Lifetime spend in top decile",
    accent: "border-emerald-400/50 bg-emerald-400/10 text-emerald-200",
  },
  {
    key: "drop_collector",
    label: "Drop Collector",
    description: "Buys from multiple drops",
    accent: "border-violet-400/50 bg-violet-400/10 text-violet-200",
  },
  {
    key: "frequent_buyer",
    label: "Frequent Buyer",
    description: "5+ orders in 90 days",
    accent: "border-sky-400/50 bg-sky-400/10 text-sky-200",
  },
  {
    key: "early_supporter",
    label: "Early Supporter",
    description: "Bought during launch window",
    accent: "border-rose-400/50 bg-rose-400/10 text-rose-200",
  },
  {
    key: "refund_risk",
    label: "Refund Risk",
    description: "Refunded ≥2 of last 5 orders",
    accent: "border-orange-400/50 bg-orange-400/10 text-orange-200",
  },
];

const membershipBadgeClasses = (membership) =>
  MEMBERSHIP_STYLES[membership] || MEMBERSHIP_STYLES.standard;

const currencyFormatter = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-LK", {
  dateStyle: "medium",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-LK", {
  dateStyle: "medium",
  timeStyle: "short",
});

const statCards = [
  {
    key: "totalUsers",
    label: "Total Customers",
    icon: Users,
    accent: "text-[#D4AF37]",
  },
  {
    key: "activeUsers",
    label: "Active Customers",
    icon: UserCheck,
    accent: "text-emerald-400",
  },
  {
    key: "verifiedUsers",
    label: "Verified",
    icon: ShieldCheck,
    accent: "text-sky-400",
  },
  {
    key: "totalOrders",
    label: "Orders Linked",
    icon: ShoppingBag,
    accent: "text-violet-400",
  },
];

const activityIconMap = {
  account_created: UserCheck,
  profile_updated: UserCog,
  order: ShoppingBag,
  notification: BellRing,
};

const formatMoney = (value) => currencyFormatter.format(value || 0);

const formatDate = (value, withTime = false) => {
  if (!value) return "No record";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "No record"
    : withTime
      ? dateTimeFormatter.format(date)
      : dateFormatter.format(date);
};

const statusBadgeClasses = (isActive) =>
  isActive
    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
    : "border-red-500/20 bg-red-500/10 text-red-300";

const providerBadgeClasses = (provider) =>
  provider === "google"
    ? "border-sky-500/20 bg-sky-500/10 text-sky-300"
    : "border-white/10 bg-black/60 text-gray-300";

const UsersPage = () => {
  const dispatch = useDispatch();
  const {
    users,
    stats,
    pagination,
    selectedUser,
    isListLoading,
    isDetailLoading,
    isMutating,
    error,
  } = useSelector((state) => state.adminUsers);

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [membershipFilter, setMembershipFilter] = useState("all");
  const [sortMode, setSortMode] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [tagSubmitting, setTagSubmitting] = useState(null);

  const listQuery = useMemo(
    () => ({
      page: currentPage,
      limit: USER_PAGE_LIMIT,
      search: searchTerm.trim(),
      status: statusFilter,
      membership: membershipFilter,
      sort: sortMode,
    }),
    [currentPage, membershipFilter, searchTerm, sortMode, statusFilter]
  );

  const loadUsers = useCallback(
    (overrides = {}) => dispatch(fetchAdminUsers({ ...listQuery, ...overrides })),
    [dispatch, listQuery]
  );

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (!users.length) {
      if (selectedUserId) {
        setSelectedUserId(null);
      }
      return;
    }

    const selectedStillExists = users.some((user) => user._id === selectedUserId);

    if (!selectedUserId || !selectedStillExists) {
      setSelectedUserId(users[0]._id);
    }
  }, [users, selectedUserId]);

  useEffect(() => {
    if (selectedUserId) {
      dispatch(fetchAdminUserDetail(selectedUserId));
    }
  }, [dispatch, selectedUserId]);

  const paginationTotal = pagination?.total || 0;
  const paginationLimit = pagination?.limit || USER_PAGE_LIMIT;
  const paginationPage = pagination?.page || currentPage;
  const totalPages =
    pagination?.totalPages ||
    Math.max(1, Math.ceil(paginationTotal / paginationLimit));
  const showingFrom =
    paginationTotal === 0 ? 0 : (paginationPage - 1) * paginationLimit + 1;
  const showingTo =
    paginationTotal === 0
      ? 0
      : Math.min(showingFrom + users.length - 1, paginationTotal);

  const pageNumbers = useMemo(() => {
    const maxButtons = 5;
    const start = Math.max(
      1,
      Math.min(paginationPage - 2, totalPages - maxButtons + 1)
    );
    const end = Math.min(totalPages, start + maxButtons - 1);

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [paginationPage, totalPages]);

  useEffect(() => {
    if (!isListLoading && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, isListLoading, totalPages]);

  const bulk = useBulkSelection(users);
  const [bulkPending, setBulkPending] = useState(false);
  const [bulkTagDraft, setBulkTagDraft] = useState("vip");
  const runBulkUserTag = async (mode) => {
    const ids = bulk.selectedIds;
    if (ids.length === 0) return;
    setBulkPending(true);
    try {
      const result = await dispatch(
        bulkTagUsers({ ids, tag: bulkTagDraft, mode })
      ).unwrap();
      const ok = result.succeeded?.length || 0;
      toast({
        title: `Bulk ${mode} tag "${bulkTagDraft}": ${ok} user${ok === 1 ? "" : "s"}`,
        variant: "success",
      });
      bulk.clear();
      await loadUsers().unwrap();
    } catch (err) {
      toast({
        title: "Bulk tag failed",
        description: typeof err === "string" ? err : "Try again.",
        variant: "destructive",
      });
    } finally {
      setBulkPending(false);
    }
  };

  const handleRefresh = async () => {
    try {
      await loadUsers().unwrap();
      if (selectedUserId) {
        await dispatch(fetchAdminUserDetail(selectedUserId)).unwrap();
      }
      toast({
        title: "Customer data refreshed",
        description: "Latest customer activity has been loaded.",
        variant: "success",
      });
    } catch (refreshError) {
      toast({
        title: "Refresh failed",
        description: refreshError || "Could not refresh user data.",
        variant: "destructive",
      });
    }
  };

  const handleStatusToggle = async () => {
    if (!selectedUser) return;

    const nextIsActive = !selectedUser.isActive;

    try {
      await dispatch(
        updateAdminUserStatus({
          userId: selectedUser._id,
          isActive: nextIsActive,
        })
      ).unwrap();
      toast({
        title: nextIsActive ? "Customer activated" : "Customer deactivated",
        description: `${selectedUser.email} is now ${nextIsActive ? "active" : "inactive"}.`,
        variant: "success",
      });
      await loadUsers().unwrap();
    } catch (statusError) {
      toast({
        title: "Status update failed",
        description: statusError || "Could not update this account.",
        variant: "destructive",
      });
    }
  };

  // Reset the note draft when switching users so we don't carry text across.
  useEffect(() => {
    setNoteDraft("");
  }, [selectedUserId]);

  const handleTagToggle = async (tagKey) => {
    if (!selectedUser) return;
    const currentTags = Array.isArray(selectedUser.tags) ? selectedUser.tags : [];
    const nextTags = currentTags.includes(tagKey)
      ? currentTags.filter((t) => t !== tagKey)
      : [...currentTags, tagKey];

    setTagSubmitting(tagKey);
    try {
      await dispatch(
        updateAdminUserStatus({ userId: selectedUser._id, tags: nextTags })
      ).unwrap();
      // Refresh the detail so populated adminNotes/tags reflect the latest state.
      await dispatch(fetchAdminUserDetail(selectedUser._id)).unwrap();
    } catch (tagError) {
      toast({
        title: "Tag update failed",
        description: tagError || "Could not update tags.",
        variant: "destructive",
      });
    } finally {
      setTagSubmitting(null);
    }
  };

  const handleAddNote = async () => {
    if (!selectedUser || !noteDraft.trim()) return;
    setNoteSubmitting(true);
    try {
      await dispatch(
        updateAdminUserStatus({
          userId: selectedUser._id,
          addAdminNote: noteDraft.trim(),
        })
      ).unwrap();
      await dispatch(fetchAdminUserDetail(selectedUser._id)).unwrap();
      setNoteDraft("");
      toast({ title: "Note added", variant: "success" });
    } catch (noteError) {
      toast({
        title: "Could not add note",
        description: noteError || "Try again.",
        variant: "destructive",
      });
    } finally {
      setNoteSubmitting(false);
    }
  };

  const handleMembershipChange = async (nextMembership) => {
    if (!selectedUser) return;
    if ((selectedUser.membership || "standard") === nextMembership) return;

    try {
      await dispatch(
        updateAdminUserStatus({
          userId: selectedUser._id,
          membership: nextMembership,
        })
      ).unwrap();
      toast({
        title: "Membership updated",
        description: `${selectedUser.email} is now ${nextMembership}.`,
        variant: "success",
      });
      await loadUsers().unwrap();
    } catch (membershipError) {
      toast({
        title: "Membership update failed",
        description: membershipError || "Could not update membership.",
        variant: "destructive",
      });
    }
  };

  const executeResetPasswordConfirmed = async () => {
    if (!selectedUser) return;
    setResetConfirmOpen(false);
    try {
      await dispatch(triggerAdminPasswordReset(selectedUser._id)).unwrap();
      toast({
        title: "Password reset email sent",
        description: `OTP delivered to ${selectedUser.email}.`,
        variant: "success",
      });
    } catch (resetError) {
      toast({
        title: "Reset failed",
        description: resetError || "Could not send password reset.",
        variant: "destructive",
      });
    }
  };

  const executeDeleteConfirmed = async () => {
    if (!selectedUser) return;
    setDeleteConfirmOpen(false);
    try {
      await dispatch(deleteAdminUser(selectedUser._id)).unwrap();
      toast({
        title: "Customer deleted",
        description: `${selectedUser.email} has been removed from the system.`,
        variant: "success",
      });
      setSelectedUserId(null);
      const nextPage = users.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      if (nextPage !== currentPage) {
        setCurrentPage(nextPage);
      }
      await loadUsers({ page: nextPage }).unwrap();
    } catch (deleteError) {
      toast({
        title: "Delete failed",
        description: deleteError || "Could not delete this account.",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="w-full min-h-0"
    >
      <AdminPage
        eyebrow="Customer Management"
        title="Customer 360"
        description="Review account health, activity, and customer relationship details."
      >
        <div className="flex w-full flex-col gap-8 text-white">
          {/* Header & KPI Strip */}
          <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between rounded-[2rem] border border-[#D4AF37]/15 bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.18),_transparent_35%),linear-gradient(180deg,_#111111_0%,_#090909_100%)] p-8">
            <div className="max-w-3xl">
              <h1 className="mt-4 text-4xl font-serif font-semibold text-white">
                Customer Intelligence
              </h1>
              <p className="mt-4 text-sm leading-7 text-gray-400">
                The clientele behind every drop. Profiles, intent signals, and bespoke actions — curated for the Saga Elite house.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isListLoading || isDetailLoading || isMutating}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-5 py-3 text-sm font-semibold text-white transition hover:border-[#D4AF37]/40 disabled:opacity-50"
              >
                <RefreshCcw className="h-4 w-4" /> Refresh
              </button>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.key} className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#101010] p-5 transition hover:border-[#D4AF37]/30 group">
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-gray-500">{card.label}</span>
                    <Icon className={`h-4 w-4 ${card.accent}`} />
                  </div>
                  <div className="mt-4 text-3xl font-serif font-semibold text-white">
                    {stats?.[card.key]?.toLocaleString() || "0"}
                  </div>
                  <div className="absolute -bottom-px left-0 w-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent transition-all duration-700 group-hover:w-full" />
                </div>
              );
            })}
             <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#101010] p-5 transition hover:border-[#D4AF37]/30 group">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Predicted Churn</span>
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                </div>
                <div className="mt-4 text-3xl font-serif font-semibold text-white">Tracking</div>
                <div className="absolute -bottom-px left-0 w-0 h-px bg-gradient-to-r from-transparent via-rose-500 to-transparent transition-all duration-700 group-hover:w-full" />
             </div>
          </section>

          {/* Filters + List (Full width) */}
          <section className="rounded-[2rem] border border-white/10 bg-[#0b0b0b] p-6">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-2 flex-wrap">
                  {MEMBERSHIP_FILTER_TABS.map((tab) => (
                    <button
                      key={tab.value}
                      onClick={() => {
                        setMembershipFilter(tab.value);
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1.5 text-xs rounded-sm border transition-all ${
                        membershipFilter === tab.value
                          ? "border-[#D4AF37]/60 bg-[#D4AF37]/10 text-[#D4AF37]"
                          : "border-white/10 bg-black/40 text-gray-400 hover:border-white/30 hover:text-white"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <label className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <input
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                      placeholder="Search customers..."
                      className="h-9 w-64 rounded-sm border border-white/10 bg-black/60 pl-9 pr-3 text-xs text-white outline-none focus:border-[#D4AF37]/50 transition"
                    />
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                    className="h-9 rounded-sm border border-white/10 bg-black/60 px-3 text-xs text-white outline-none focus:border-[#D4AF37]/50"
                  >
                    <option value="all">Any Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-5">
              {isListLoading ? (
                 <div className="space-y-3">
                   {Array.from({ length: 5 }).map((_, index) => (
                     <SkeletonCard key={index} className="h-16" />
                   ))}
                 </div>
              ) : users.length === 0 ? (
                 <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-black/40 p-8 text-center text-sm text-gray-400">
                   No customers matched the current filters.
                 </div>
              ) : (
                <div className="overflow-x-auto scrollbar-thin rounded-xl border border-white/10">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="bg-[#111111] uppercase tracking-[0.18em] text-[10px] text-gray-400 border-b border-white/10">
                      <tr>
                        <th className="px-5 py-4 w-12">
                          <input
                            type="checkbox"
                            checked={bulk.isAllSelected}
                            onChange={bulk.toggleAll}
                            className="h-4 w-4 cursor-pointer accent-[#D4AF37]"
                          />
                        </th>
                        <th className="px-4 py-4 font-semibold">Customer</th>
                        <th className="px-4 py-4 font-semibold">Membership</th>
                        <th className="px-4 py-4 font-semibold text-right">Spent</th>
                        <th className="px-4 py-4 font-semibold text-center">Orders</th>
                        <th className="px-4 py-4 font-semibold">Tags</th>
                        <th className="px-4 py-4 font-semibold">Joined / Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => {
                        const isSelectedRow = selectedUserId === user._id;
                        return (
                          <tr
                            key={user._id}
                            onClick={() => setSelectedUserId(user._id)}
                            className={`border-b border-white/5 cursor-pointer transition-colors ${
                              isSelectedRow ? "bg-[#181510] border-l-2 border-l-[#D4AF37]" : "hover:bg-[#151515] border-l-2 border-l-transparent"
                            }`}
                          >
                            <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={bulk.isSelected(user._id)}
                                onChange={() => bulk.toggle(user._id)}
                                className="h-4 w-4 cursor-pointer accent-[#D4AF37]"
                              />
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/10 text-xs font-bold text-[#D4AF37]">
                                  {(user.email || "?").slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-white tracking-wide text-[13px]">{user.email}</span>
                                  <span className="text-[10px] font-mono text-gray-500 mt-0.5">{user._id}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] ${membershipBadgeClasses(user.membership)}`}
                              >
                                {user.membership === "vip" && <Crown className="h-2.5 w-2.5" />}
                                {user.membership || "standard"}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right font-mono text-[13px] text-[#D4AF37]">
                              {formatMoney(user.relationship.totalSpent)}
                            </td>
                            <td className="px-4 py-4 text-center font-mono text-[13px] text-gray-300">
                              {user.relationship.orderCount}
                            </td>
                            <td className="px-4 py-4 min-w-[200px]">
                              <div className="flex flex-wrap gap-1.5 max-w-[240px]">
                                {user.tags?.slice(0, 3).map(tag => (
                                  <span key={tag} className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded-sm text-[9px] uppercase text-gray-400">
                                    {tag.replace('_', ' ')}
                                  </span>
                                ))}
                                {(user.tags?.length || 0) > 3 && (
                                  <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded-sm text-[9px] text-gray-500">
                                    +{user.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-col items-start gap-1">
                                <StatusBadge status={user.isActive ? "active" : "inactive"} />
                                <span className="text-[10px] text-gray-500">{formatDate(user.createdAt)}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs">
               <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
                 Showing {showingFrom}-{showingTo} of {paginationTotal}
               </div>
               <div className="flex items-center gap-2">
                 <button
                   type="button"
                   disabled={paginationPage <= 1 || isListLoading}
                   onClick={() => setCurrentPage(Math.max(1, paginationPage - 1))}
                   className="h-8 px-3 rounded-sm border border-white/10 bg-transparent text-gray-400 hover:border-[#D4AF37]/40 hover:text-[#D4AF37] disabled:opacity-30 disabled:pointer-events-none transition"
                 >
                   Prev
                 </button>
                 <span className="text-gray-500 font-mono text-[11px] px-2">{paginationPage} / {totalPages}</span>
                 <button
                   type="button"
                   disabled={paginationPage >= totalPages || isListLoading}
                   onClick={() => setCurrentPage(Math.min(totalPages, paginationPage + 1))}
                   className="h-8 px-3 rounded-sm border border-white/10 bg-transparent text-gray-400 hover:border-[#D4AF37]/40 hover:text-[#D4AF37] disabled:opacity-30 disabled:pointer-events-none transition"
                 >
                   Next
                 </button>
               </div>
            </div>
          </section>

          {/* 360 Detail View below the list */}
          {selectedUser && (
             <>
             <div className="flex items-center gap-4 py-2">
                <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent flex-1" />
                <span className="font-serif text-[#D4AF37] text-xl">Customer 360</span>
                <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent flex-1" />
             </div>
             
             {isDetailLoading ? (
               <div className="flex items-center justify-center p-12">
                 <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
               </div>
             ) : (
               <section className="grid grid-cols-12 gap-5">
                 {/* LEFT PANE - Profile, Actions, Notes */}
                 <aside className="col-span-12 lg:col-span-3 space-y-5">
                   <div className="rounded-[1.5rem] border border-white/10 bg-[#101010] p-6 relative overflow-hidden">
                      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle at top, rgba(212,175,55,0.15), transparent 70%)" }} />
                      <div className="relative text-center flex flex-col items-center">
                        <span className={`inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.2em] mb-4 ${membershipBadgeClasses(selectedUser.membership)}`}>
                          {selectedUser.membership === "vip" && <Crown className="h-2.5 w-2.5" />}
                          {selectedUser.membership || "standard"}
                        </span>
                        
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-sm border border-white/10 bg-gradient-to-br from-[#1a1a1a] to-[#050505] text-xl font-serif text-[#D4AF37]">
                          {(selectedUser.email || "?").slice(0, 2).toUpperCase()}
                        </div>
                        
                        <div className="mt-4 flex items-center justify-center gap-2 w-full">
                           <h2 className="text-xl font-semibold text-white break-all">{selectedUser.email.split('@')[0]}</h2>
                           {selectedUser.isVerified && <ShieldCheck className="h-4 w-4 text-[#D4AF37]" />}
                        </div>
                        <div className="text-[11px] font-mono text-gray-500 mt-1">{selectedUser.email}</div>
                        <div className="text-[10px] uppercase tracking-widest text-gray-500 mt-2">Member via {selectedUser.provider}</div>
                      </div>
                      
                      <div className="h-px bg-white/10 w-full my-5" />
                      
                      <ul className="space-y-3 text-xs">
                        <li className="flex items-center gap-3 text-gray-400">
                          <MapPin className="h-3.5 w-3.5 text-[#D4AF37]" />
                          <span className="truncate">{selectedUser.addresses?.[0]?.city || "No saved city"}, {selectedUser.addresses?.[0]?.country || "LK"}</span>
                        </li>
                        <li className="flex items-center gap-3 text-gray-400">
                          <Clock3 className="h-3.5 w-3.5 text-[#D4AF37]" />
                          <span>Joined {formatDate(selectedUser.createdAt)}</span>
                        </li>
                      </ul>
                      
                      <div className="mt-5 flex flex-wrap gap-2">
                        {selectedUser.tags?.map((t) => (
                           <span key={t} className="px-2 py-1 bg-white/5 border border-white/10 text-gray-300 rounded-sm text-[9px] uppercase tracking-wider">{t.replace('_', ' ')}</span>
                        ))}
                      </div>
                   </div>

                   <div className="rounded-[1.5rem] border border-white/10 bg-[#101010] p-5">
                     <span className="text-[10px] uppercase tracking-[0.18em] text-gray-500 block mb-4">Quick Actions</span>
                     <div className="grid grid-cols-2 gap-2">
                       <button onClick={handleStatusToggle} className="flex flex-col items-start gap-2 p-3 rounded-lg border border-white/5 bg-black/40 hover:border-[#D4AF37]/30 transition group text-left">
                         <UserCog className="h-4 w-4 text-gray-400 group-hover:text-[#D4AF37]" />
                         <span className="text-[11px]">{selectedUser.isActive ? "Deactivate" : "Activate"}</span>
                       </button>
                       <button onClick={() => setResetConfirmOpen(true)} className="flex flex-col items-start gap-2 p-3 rounded-lg border border-white/5 bg-black/40 hover:border-[#D4AF37]/30 transition group text-left">
                         <KeyRound className="h-4 w-4 text-gray-400 group-hover:text-[#D4AF37]" />
                         <span className="text-[11px]">Reset Pass</span>
                       </button>
                       <button onClick={() => setDeleteConfirmOpen(true)} className="flex flex-col items-start gap-2 p-3 rounded-lg border border-white/5 bg-black/40 hover:border-red-400/30 transition group text-left col-span-2">
                         <Trash2 className="h-4 w-4 text-gray-400 group-hover:text-red-400" />
                         <span className="text-[11px] text-rose-200">Delete Account</span>
                       </button>
                     </div>
                   </div>
                   
                   <div className="rounded-[1.5rem] border border-white/10 bg-[#101010] p-5">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Admin Notes</span>
                        <StickyNote className="h-3.5 w-3.5 text-[#D4AF37]" />
                      </div>
                      <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 scrollbar-thin">
                        {(selectedUser.adminNotes || []).length === 0 ? (
                          <div className="text-[11px] text-gray-500 italic">No internal notes</div>
                        ) : (
                          [...selectedUser.adminNotes].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map((note, idx) => (
                            <div key={idx} className="bg-black/40 border border-white/5 p-3 rounded-xl">
                              <p className="text-xs text-gray-300 leading-snug">{note.note}</p>
                              <div className="text-[9px] uppercase text-gray-600 mt-2">{note.author?.email?.split('@')[0] || "Admin"} · {formatDate(note.createdAt)}</div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="mt-4 flex gap-2">
                        <input
                          value={noteDraft}
                          onChange={(e) => setNoteDraft(e.target.value)}
                          placeholder="Type a note..."
                          className="flex-1 bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#D4AF37]/50"
                        />
                        <button
                          onClick={handleAddNote}
                          disabled={!noteDraft.trim() || noteSubmitting}
                          className="h-8 w-8 flex items-center justify-center rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 hover:bg-[#D4AF37]/20 disabled:opacity-50"
                        >
                           <Plus className="h-4 w-4" />
                        </button>
                      </div>
                   </div>
                 </aside>

                 {/* CENTER PANE - Activity, View Products, Orders */}
                 <div className="col-span-12 lg:col-span-6 space-y-5">
                    <div className="rounded-[1.5rem] border border-white/10 bg-[#101010]">
                      <div className="px-6 py-5 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-[#D4AF37]" />
                          <h3 className="font-serif text-xl tracking-tight text-white">Activity Timeline</h3>
                        </div>
                      </div>
                      <ol className="px-8 py-6 relative">
                        <div className="absolute left-[40px] top-8 bottom-8 w-px bg-white/10" />
                        {selectedUser.activityTimeline?.length ? (
                          selectedUser.activityTimeline.map((activity, idx) => {
                            const ActivityIcon = activityIconMap[activity.type] || Activity;
                            return (
                              <li key={idx} className="relative pl-12 pb-6 last:pb-0">
                                <span className="absolute left-0 top-0.5 h-6 w-6 rounded-md border border-white/10 bg-[#111] flex items-center justify-center text-[#D4AF37]">
                                  <ActivityIcon className="h-3 w-3" />
                                </span>
                                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-4">
                                  <div>
                                    <div className="text-sm text-gray-200">{activity.title}</div>
                                    <div className="text-[11px] text-gray-500 mt-1">{activity.description}</div>
                                  </div>
                                  <span className="text-[10px] font-mono whitespace-nowrap text-gray-500">{formatDate(activity.createdAt, true)}</span>
                                </div>
                              </li>
                            );
                          })
                        ) : (
                          <div className="text-sm text-gray-500 pl-12">No activity recorded for this account.</div>
                        )}
                      </ol>
                    </div>

                    <div className="rounded-[1.5rem] border border-white/10 bg-[#101010] p-6">
                      <div className="flex items-center gap-2 mb-5">
                        <Package className="h-4 w-4 text-[#D4AF37]" />
                        <h3 className="font-serif text-xl tracking-tight text-white">Order History</h3>
                      </div>
                      <table className="w-full text-left text-sm">
                        <thead className="text-[10px] uppercase tracking-widest text-gray-500 border-b border-white/10">
                           <tr>
                             <th className="pb-3 px-2">Order</th>
                             <th className="pb-3 px-2">Date</th>
                             <th className="pb-3 px-2 text-right">Items</th>
                             <th className="pb-3 px-2 text-right">Total</th>
                             <th className="pb-3 px-2 pl-6">Status</th>
                           </tr>
                        </thead>
                        <tbody>
                          {selectedUser.recentOrders?.length ? (
                            selectedUser.recentOrders.map(o => (
                              <tr key={o._id} className="border-b border-white/5 last:border-0 hover:bg-black/30 transition">
                                <td className="py-3 px-2 font-mono text-[11px] text-gray-300">{o.referenceNumber || o._id.slice(-6).toUpperCase()}</td>
                                <td className="py-3 px-2 text-[11px] text-gray-500">{formatDate(o.createdAt)}</td>
                                <td className="py-3 px-2 text-right text-[12px]">{o.items?.length || 0}</td>
                                <td className="py-3 px-2 text-right font-mono text-[12px] text-[#D4AF37]">{formatMoney(o.totalAmount)}</td>
                                <td className="py-3 px-2 pl-6"><StatusBadge status={o.status || "processing"} /></td>
                              </tr>
                            ))
                          ) : (
                            <tr><td colSpan="5" className="py-6 text-center text-[12px] text-gray-500">No orders placed yet.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                 </div>

                 {/* RIGHT PANE - Insights, Churn */}
                 <aside className="col-span-12 lg:col-span-3 space-y-5">
                    <div className="rounded-[1.5rem] border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-5 relative overflow-hidden">
                       <span className="text-[10px] uppercase tracking-[0.18em] text-[#D4AF37]/80 block mb-2">Lifetime Value</span>
                       <div className="font-serif text-3xl text-white tracking-tight">{formatMoney(selectedUser.intelligence?.customerLifetimeValue || selectedUser.relationship?.totalSpent)}</div>
                       <div className="text-[11px] text-gray-400 mt-2">Across {selectedUser.relationship?.orderCount || 0} orders</div>
                       <div className="h-px bg-[#D4AF37]/20 w-full my-4" />
                       <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Predicted 12m</span>
                          <span className="text-gray-300 font-mono">
                            {formatMoney((selectedUser.intelligence?.customerLifetimeValue || selectedUser.relationship?.totalSpent) * 0.6)}
                          </span>
                       </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-white/10 bg-[#101010] p-5">
                       <div className="flex items-center justify-between mb-4">
                         <span className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Viewed Categories</span>
                         <Eye className="h-3.5 w-3.5 text-[#D4AF37]" />
                       </div>
                       <div className="flex flex-col gap-3">
                          {selectedUser.intelligence?.preferredCategories?.length ? (
                            selectedUser.intelligence.preferredCategories.map(cat => (
                              <div key={cat} className="flex justify-between text-xs">
                                <span className="text-gray-300">{cat}</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-[11px] text-gray-500 italic">No browse history</span>
                          )}
                       </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-red-500/10 bg-red-500/5 p-5">
                       <div className="flex items-center justify-between mb-3">
                         <span className="text-[10px] uppercase tracking-[0.18em] text-rose-300">Churn Risk</span>
                         <AlertTriangle className="h-4 w-4 text-rose-400" />
                       </div>
                       <div className="font-serif text-4xl text-white">{selectedUser.intelligence?.predictedChurnRisk || 0}<span className="text-lg text-gray-500">/100</span></div>
                       <div className="mt-3 text-[11px] text-rose-200/60 leading-relaxed">
                         {selectedUser.intelligence?.predictedChurnRisk > 70 
                           ? "High risk of abandonment. Consider an exclusive re-engagement offer."
                           : "Customer engagement is stable."}
                       </div>
                    </div>
                 </aside>
               </section>
             )}
             </>
          )}

          {error && (
            <div className="rounded-[1.5rem] border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          )}
        </div>

        <ConfirmInline
          show={deleteConfirmOpen && !!selectedUser}
          message={`Delete ${selectedUser?.email}? This removes the customer account.`}
          onCancel={() => setDeleteConfirmOpen(false)}
          onConfirm={executeDeleteConfirmed}
          className="w-full max-w-md fixed bottom-4 right-4 z-50 shadow-2xl"
        />
        <ConfirmInline
          show={resetConfirmOpen && !!selectedUser}
          message={`Send a password reset OTP to ${selectedUser?.email}?`}
          onCancel={() => setResetConfirmOpen(false)}
          onConfirm={executeResetPasswordConfirmed}
          className="w-full max-w-md fixed bottom-4 right-4 z-50 shadow-2xl"
        />

        <BulkActionBar
          count={bulk.count}
          onClear={bulk.clear}
          pending={bulkPending}
          label="customers selected"
          actions={[
            { label: `Add "${bulkTagDraft}"`, onClick: () => runBulkUserTag("add") },
            { label: `Remove "${bulkTagDraft}"`, onClick: () => runBulkUserTag("remove") },
          ]}
        />
      </AdminPage>
    </motion.div>
  );
};

export default UsersPage;
