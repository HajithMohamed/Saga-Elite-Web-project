import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import {
  BellRing,
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
    label: "Total Accounts",
    icon: Users,
    accent: "text-[#D4AF37]",
  },
  {
    key: "activeUsers",
    label: "Active Users",
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

const roleBadgeClasses = (role) =>
  role === "user"
    ? "border-white/10 bg-white/5 text-gray-200"
    : "border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]";

const providerBadgeClasses = (provider) =>
  provider === "google"
    ? "border-sky-500/20 bg-sky-500/10 text-sky-300"
    : "border-white/10 bg-black/60 text-gray-300";

const UsersPage = () => {
  const dispatch = useDispatch();
  const { user: currentUser } = useSelector((state) => state.auth);
  const {
    users,
    stats,
    selectedUser,
    isListLoading,
    isDetailLoading,
    isMutating,
    error,
  } = useSelector((state) => state.adminUsers);

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [membershipFilter, setMembershipFilter] = useState("all");
  const [sortMode, setSortMode] = useState("newest");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [tagSubmitting, setTagSubmitting] = useState(null);

  useEffect(() => {
    dispatch(fetchAdminUsers());
  }, [dispatch]);

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

  const filteredUsers = users
    .filter((user) => {
      const matchesSearch =
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.provider.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && user.isActive) ||
        (statusFilter === "inactive" && !user.isActive);

      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      const matchesMembership = (() => {
        if (membershipFilter === "all") return true;
        if (membershipFilter === "blocked") return !user.isActive;
        return (user.membership || "standard") === membershipFilter;
      })();

      return matchesSearch && matchesStatus && matchesRole && matchesMembership;
    })
    .sort((a, b) => {
      switch (sortMode) {
        case "spent_desc":
          return (
            (b.relationship?.totalSpent || 0) - (a.relationship?.totalSpent || 0)
          );
        case "orders_desc":
          return (
            (b.relationship?.orderCount || 0) - (a.relationship?.orderCount || 0)
          );
        case "last_active": {
          const aDate = new Date(a.relationship?.lastOrderAt || 0).getTime();
          const bDate = new Date(b.relationship?.lastOrderAt || 0).getTime();
          return bDate - aDate;
        }
        case "newest":
        default:
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
    });

  const bulk = useBulkSelection(filteredUsers);
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
      dispatch(fetchAdminUsers());
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
      await dispatch(fetchAdminUsers()).unwrap();
      if (selectedUserId) {
        await dispatch(fetchAdminUserDetail(selectedUserId)).unwrap();
      }
      toast({
        title: "User data refreshed",
        description: "Latest account activity has been loaded.",
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
        title: nextIsActive ? "User activated" : "User deactivated",
        description: `${selectedUser.email} is now ${nextIsActive ? "active" : "inactive"}.`,
        variant: "success",
      });
      await dispatch(fetchAdminUsers()).unwrap();
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
      await dispatch(fetchAdminUsers()).unwrap();
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
        title: "User deleted",
        description: `${selectedUser.email} has been removed from the system.`,
        variant: "success",
      });
      setSelectedUserId(null);
      await dispatch(fetchAdminUsers()).unwrap();
    } catch (deleteError) {
      toast({
        title: "Delete failed",
        description: deleteError || "Could not delete this account.",
        variant: "destructive",
      });
    }
  };

  const canManageSelectedUser =
    selectedUser &&
    selectedUser.role === "user" &&
    selectedUser._id !== currentUser?._id;

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="w-full min-h-0"
    >
    <AdminPage
      eyebrow="Admin User Management"
      title="Users"
      description="Review account health, activity, and customer relationship details."
    >
      <div className="flex w-full flex-col gap-8">
        <section className="rounded-[2rem] border border-[#D4AF37]/15 bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.18),_transparent_35%),linear-gradient(180deg,_#111111_0%,_#090909_100%)] p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.35em] text-[#D4AF37]">
                Admin User Management
              </p>
              <h1 className="mt-4 text-4xl font-serif font-semibold text-white">
                See how every user is connected to Saga Elite.
              </h1>
              <p className="mt-4 text-sm leading-7 text-gray-400">
                Review account health, recent activity, orders, wishlist behavior, and system
                relationship before deciding to deactivate or remove an account.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isListLoading || isDetailLoading || isMutating}
              className="inline-flex items-center justify-center gap-3 self-start rounded-full border border-[#D4AF37]/30 bg-black/70 px-5 py-3 text-sm font-semibold text-white transition hover:border-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh data
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.key}
                className="rounded-[1.75rem] border border-white/10 bg-[#0d0d0d] p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="rounded-2xl border border-white/10 bg-black/60 p-3">
                    <Icon className={`h-5 w-5 ${card.accent}`} />
                  </div>
                  <span className="text-xs uppercase tracking-[0.22em] text-gray-500">
                    Live
                  </span>
                </div>
                <p className="mt-5 text-sm uppercase tracking-[0.22em] text-gray-500">
                  {card.label}
                </p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  {stats?.[card.key] ?? 0}
                </p>
              </div>
            );
          })}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_1.4fr]">
          <div className="rounded-[2rem] border border-white/10 bg-[#0b0b0b] p-6">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-5">
              <div>
                <h2 className="text-xl font-semibold text-white">Accounts</h2>
                <p className="mt-2 text-sm text-gray-400">
                  Filter by status and open any user to inspect their activity and system
                  relationship.
                </p>
              </div>

              <div className="grid gap-3">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search by email, role, or provider"
                    className="w-full rounded-2xl border border-white/10 bg-black/70 py-3 pl-11 pr-4 text-sm text-white outline-none transition focus:border-[#D4AF37]"
                  />
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-white outline-none transition focus:border-[#D4AF37]"
                  >
                    <option value="all">All statuses</option>
                    <option value="active">Active only</option>
                    <option value="inactive">Inactive only</option>
                  </select>

                  <select
                    value={roleFilter}
                    onChange={(event) => setRoleFilter(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-white outline-none transition focus:border-[#D4AF37]"
                  >
                    <option value="all">All roles</option>
                    <option value="user">Customers</option>
                    <option value="admin">Admins</option>
                    <option value="superadmin">Superadmins</option>
                  </select>
                </div>

                <select
                  value={sortMode}
                  onChange={(event) => setSortMode(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-white outline-none transition focus:border-[#D4AF37]"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      Sort by — {option.label}
                    </option>
                  ))}
                </select>

                <div className="flex flex-wrap gap-2 pt-1">
                  {MEMBERSHIP_FILTER_TABS.map((tab) => {
                    const active = membershipFilter === tab.value;
                    return (
                      <button
                        key={tab.value}
                        type="button"
                        onClick={() => setMembershipFilter(tab.value)}
                        className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors ${
                          active
                            ? "border-[#f2ca50] bg-[#f2ca50]/10 text-[#f2ca50]"
                            : "border-white/10 text-white/60 hover:text-white hover:border-white/30"
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {isListLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <SkeletonCard key={index} className="h-28" />
                  ))}
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-black/40 p-8 text-center text-sm text-gray-400">
                  No users matched the current filters.
                </div>
              ) : (
                <motion.div
                  className="space-y-3"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-[#0a0a0a] px-5 py-3">
                  <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/60">
                    <input
                      type="checkbox"
                      aria-label="Select all visible customers"
                      checked={bulk.isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = bulk.isSomeSelected;
                      }}
                      onChange={bulk.toggleAll}
                      className="h-4 w-4 cursor-pointer accent-[#D4AF37]"
                      data-testid="admin-bulk-select-all"
                    />
                    Select all
                  </label>
                  <span className="text-[10px] uppercase tracking-widest text-white/40">Tag:</span>
                  <select
                    value={bulkTagDraft}
                    onChange={(e) => setBulkTagDraft(e.target.value)}
                    className="rounded-md border border-white/10 bg-black px-2 py-1 text-xs text-white"
                  >
                    {BULK_USER_TAGS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                {filteredUsers.map((user) => (
                  <div key={user._id} className="relative">
                    <input
                      type="checkbox"
                      aria-label={`Select ${user.email}`}
                      checked={bulk.isSelected(user._id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        e.stopPropagation();
                        bulk.toggle(user._id);
                      }}
                      className="absolute top-4 left-4 z-10 h-4 w-4 cursor-pointer accent-[#D4AF37]"
                      data-testid="admin-bulk-row-select"
                    />
                  <motion.button
                    type="button"
                    variants={itemVariants}
                    whileHover={{ y: -3, borderColor: "rgba(212,175,55,0.35)" }}
                    transition={{ duration: 0.2 }}
                    onClick={() => setSelectedUserId(user._id)}
                    className={`w-full rounded-[1.5rem] border p-5 pl-12 text-left transition ${
                      bulk.isSelected(user._id)
                        ? "border-[#D4AF37]/60 bg-[#15120a]"
                        : selectedUserId === user._id
                        ? "border-[#D4AF37] bg-[#15120a]"
                        : "border-white/10 bg-[#101010] hover:border-[#D4AF37]/40 hover:bg-[#131313]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge status={user.isActive ? "active" : "inactive"} />
                          <span
                            className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${roleBadgeClasses(user.role)}`}
                          >
                            {user.role}
                          </span>
                          <span
                            className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${providerBadgeClasses(user.provider)}`}
                          >
                            {user.provider}
                          </span>
                          {user.membership && user.membership !== "standard" ? (
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${membershipBadgeClasses(user.membership)}`}
                            >
                              {user.membership === "vip" ? (
                                <Crown className="h-3 w-3" />
                              ) : null}
                              {user.membership}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-4 flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#D4AF37] to-[#9a7a1e] text-xs font-bold text-black">
                            {(user.email || "?").slice(0, 2).toUpperCase()}
                          </div>
                          <p className="truncate text-base font-semibold text-white">{user.email}</p>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-4 text-xs uppercase tracking-[0.18em] text-gray-500">
                          <span>{user.relationship.orderCount} orders</span>
                          <span>{user.relationship.wishlistCount} wishlist</span>
                          <span>{user.relationship.cartCount} cart</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xs uppercase tracking-[0.22em] text-gray-500">
                          Spent
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[#D4AF37]">
                          {formatMoney(user.relationship.totalSpent)}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                  </div>
                ))}
                </motion.div>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#0b0b0b] p-6">
            {isDetailLoading && selectedUser ? (
              <div className="space-y-4">
                <div className="h-28 animate-pulse rounded-[1.5rem] bg-[#111111]" />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="h-52 animate-pulse rounded-[1.5rem] bg-[#111111]" />
                  <div className="h-52 animate-pulse rounded-[1.5rem] bg-[#111111]" />
                </div>
                <div className="h-72 animate-pulse rounded-[1.5rem] bg-[#111111]" />
              </div>
            ) : selectedUser ? (
              <div className="space-y-6">
                <section className="rounded-[1.75rem] border border-[#D4AF37]/15 bg-[linear-gradient(180deg,_rgba(212,175,55,0.08),_rgba(0,0,0,0.15))] p-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${statusBadgeClasses(selectedUser.isActive)}`}
                        >
                          {selectedUser.isActive ? "Active" : "Inactive"}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${roleBadgeClasses(selectedUser.role)}`}
                        >
                          {selectedUser.role}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${providerBadgeClasses(selectedUser.provider)}`}
                        >
                          {selectedUser.provider}
                        </span>
                        <span className="rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-gray-300">
                          {selectedUser.isVerified ? "Verified" : "Unverified"}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${membershipBadgeClasses(selectedUser.membership)}`}
                        >
                          {selectedUser.membership === "vip" ? (
                            <Crown className="h-3 w-3" />
                          ) : null}
                          {selectedUser.membership || "standard"}
                        </span>
                      </div>

                      <h2 className="mt-5 break-all text-3xl font-serif font-semibold text-white">
                        {selectedUser.email}
                      </h2>

                      <div className="mt-5 grid gap-3 text-sm text-gray-300 md:grid-cols-2">
                        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
                          <Mail className="h-4 w-4 text-[#D4AF37]" />
                          <span className="truncate">{selectedUser.email}</span>
                        </div>
                        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
                          <Clock3 className="h-4 w-4 text-[#D4AF37]" />
                          <span>Joined {formatDate(selectedUser.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-3 lg:w-auto lg:items-end">
                      <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto">
                        <button
                          type="button"
                          onClick={handleStatusToggle}
                          disabled={!canManageSelectedUser || isMutating}
                          className="rounded-2xl border border-white/10 bg-black/60 px-5 py-3 text-sm font-semibold text-white transition hover:border-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {selectedUser.isActive ? "Deactivate User" : "Activate User"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setResetConfirmOpen(true)}
                          disabled={!canManageSelectedUser || isMutating}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-5 py-3 text-sm font-semibold text-[#D4AF37] transition hover:border-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <KeyRound className="h-4 w-4" />
                          Reset Password
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmOpen(true)}
                          disabled={!canManageSelectedUser || isMutating}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-200 transition hover:border-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete User
                        </button>
                        <select
                          value={selectedUser.membership || "standard"}
                          onChange={(e) => handleMembershipChange(e.target.value)}
                          disabled={!canManageSelectedUser || isMutating}
                          className="rounded-2xl border border-white/10 bg-black/60 px-5 py-3 text-sm font-semibold text-white transition focus:border-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="standard">Membership: Standard</option>
                          <option value="elite">Membership: Elite</option>
                          <option value="rare">Membership: Rare</option>
                          <option value="legend">Membership: Legend</option>
                          <option value="vip">Membership: VIP</option>
                        </select>
                      </div>
                      <ConfirmInline
                        show={deleteConfirmOpen && !!selectedUser}
                        message={
                          selectedUser
                            ? `Delete ${selectedUser.email}? This removes the customer account and related notifications.`
                            : ""
                        }
                        onCancel={() => setDeleteConfirmOpen(false)}
                        onConfirm={executeDeleteConfirmed}
                        className="w-full max-w-md"
                      />
                      <ConfirmInline
                        show={resetConfirmOpen && !!selectedUser}
                        message={
                          selectedUser
                            ? `Send a password reset OTP to ${selectedUser.email}?`
                            : ""
                        }
                        onCancel={() => setResetConfirmOpen(false)}
                        onConfirm={executeResetPasswordConfirmed}
                        className="w-full max-w-md"
                      />
                    </div>
                  </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[1.5rem] border border-white/10 bg-[#101010] p-5">
                    <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Total spent</p>
                    <p className="mt-3 text-2xl font-semibold text-[#D4AF37]">
                      {formatMoney(selectedUser.relationship.totalSpent)}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-[#101010] p-5">
                    <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Orders</p>
                    <p className="mt-3 text-2xl font-semibold text-white">
                      {selectedUser.relationship.orderCount}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-[#101010] p-5">
                    <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Wishlist items</p>
                    <p className="mt-3 text-2xl font-semibold text-white">
                      {selectedUser.relationship.wishlistCount}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-[#101010] p-5">
                    <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Unread alerts</p>
                    <p className="mt-3 text-2xl font-semibold text-white">
                      {selectedUser.relationship.unreadNotifications}
                    </p>
                  </div>
                </section>

                <section className="grid gap-4 xl:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-white/10 bg-[#101010] p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <TagIcon className="h-5 w-5 text-[#D4AF37]" />
                        <h3 className="text-lg font-semibold text-white">Customer Tags</h3>
                      </div>
                      {(selectedUser.tags?.length || 0) > 0 ? (
                        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#D4AF37]">
                          {selectedUser.tags.length} active
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-gray-500">
                      Internal segmentation. Used by Marketing for targeted notifications and Recommendations for cohort analysis.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {CUSTOMER_TAGS.map((tag) => {
                        const isActive = (selectedUser.tags || []).includes(tag.key);
                        const isPending = tagSubmitting === tag.key;
                        return (
                          <button
                            key={tag.key}
                            type="button"
                            onClick={() => handleTagToggle(tag.key)}
                            disabled={isPending}
                            title={tag.description}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              isActive
                                ? tag.accent
                                : "border-white/10 bg-white/[0.03] text-gray-400 hover:border-white/20 hover:text-white"
                            }`}
                          >
                            {isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  isActive ? "bg-current" : "bg-white/20"
                                }`}
                              />
                            )}
                            {tag.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-white/10 bg-[#101010] p-5">
                    <div className="flex items-center gap-3">
                      <StickyNote className="h-5 w-5 text-[#D4AF37]" />
                      <h3 className="text-lg font-semibold text-white">Admin Notes</h3>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-gray-500">
                      Append-only. Captures who said what for support escalations.
                    </p>

                    <div className="mt-4 max-h-[220px] space-y-2 overflow-y-auto pr-1">
                      {(selectedUser.adminNotes || []).length === 0 ? (
                        <p className="rounded-xl border border-dashed border-white/10 bg-black/40 px-3 py-4 text-center text-xs text-gray-500">
                          No admin notes yet.
                        </p>
                      ) : (
                        [...selectedUser.adminNotes]
                          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                          .map((note, idx) => (
                            <div
                              key={note._id || idx}
                              className="rounded-xl border border-white/5 bg-black/40 px-3 py-2"
                            >
                              <p className="text-xs leading-5 text-gray-200">{note.note}</p>
                              <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-gray-500">
                                {note.author?.email || note.author?.name || "Admin"} ·{" "}
                                {formatDate(note.createdAt, true)}
                              </p>
                            </div>
                          ))
                      )}
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                      <textarea
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value.slice(0, 2000))}
                        placeholder="Add an internal note about this customer…"
                        rows={3}
                        className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]"
                      />
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-gray-500">
                          {noteDraft.length} / 2000
                        </span>
                        <button
                          type="button"
                          onClick={handleAddNote}
                          disabled={!noteDraft.trim() || noteSubmitting}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] transition hover:bg-[#D4AF37]/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {noteSubmitting ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Plus className="h-3 w-3" />
                          )}
                          Add note
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                  <div className="space-y-6">
                    <div className="rounded-[1.5rem] border border-white/10 bg-[#101010] p-5">
                      <div className="flex items-center gap-3">
                        <UserCog className="h-5 w-5 text-[#D4AF37]" />
                        <h3 className="text-lg font-semibold text-white">Relationship Summary</h3>
                      </div>
                      <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                            Last order
                          </p>
                          <p className="mt-2 text-sm font-medium text-white">
                            {formatDate(selectedUser.relationship.lastOrderAt, true)}
                          </p>
                          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-gray-500">
                            {selectedUser.relationship.lastOrderStatus || "No order yet"}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                            Saved payment
                          </p>
                          <p className="mt-2 text-sm font-medium text-white">
                            {selectedUser.savedPaymentMethod || "Not saved"}
                          </p>
                          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-gray-500">
                            Preferred checkout
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                            Cart snapshot
                          </p>
                          <p className="mt-2 text-sm font-medium text-white">
                            {selectedUser.relationship.cartCount} item references
                          </p>
                          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-gray-500">
                            Current cart depth
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                            Notification trail
                          </p>
                          <p className="mt-2 text-sm font-medium text-white">
                            {selectedUser.relationship.notificationCount} messages
                          </p>
                          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-gray-500">
                            Last update {formatDate(selectedUser.relationship.lastNotificationAt, true)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-white/10 bg-[#101010] p-5">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-[#D4AF37]" />
                        <h3 className="text-lg font-semibold text-white">Addresses</h3>
                      </div>
                      <div className="mt-5 space-y-3">
                        {selectedUser.addresses?.length ? (
                          selectedUser.addresses.map((address, index) => (
                            <div
                              key={`${address.street}-${index}`}
                              className="rounded-2xl border border-white/10 bg-black/50 p-4"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-white">
                                  {address.label || `Address ${index + 1}`}
                                </p>
                                {address.isDefault ? (
                                  <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-[#D4AF37]">
                                    Default
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-3 text-sm leading-6 text-gray-400">
                                {address.street}, {address.city}, {address.postalCode},{" "}
                                {address.country}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-2xl border border-dashed border-white/10 bg-black/40 p-5 text-sm text-gray-400">
                            No saved addresses on this account yet.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-white/10 bg-[#101010] p-5">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-[#D4AF37]" />
                        <h3 className="text-lg font-semibold text-white">Recent Orders</h3>
                      </div>
                      <div className="mt-5 space-y-3">
                        {selectedUser.recentOrders?.length ? (
                          selectedUser.recentOrders.map((order) => (
                            <div
                              key={order._id}
                              className="rounded-2xl border border-white/10 bg-black/50 p-4"
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-white">{order.status}</p>
                                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-gray-500">
                                    {formatDate(order.createdAt, true)}
                                  </p>
                                </div>
                                <div className="text-left sm:text-right">
                                  <p className="text-sm font-semibold text-[#D4AF37]">
                                    {formatMoney(order.totalAmount)}
                                  </p>
                                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-gray-500">
                                    {order.paymentMethod} / {order.paymentStatus}
                                  </p>
                                </div>
                              </div>
                              <p className="mt-3 text-xs uppercase tracking-[0.2em] text-gray-500">
                                {order.items?.length || 0} item(s)
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-2xl border border-dashed border-white/10 bg-black/40 p-5 text-sm text-gray-400">
                            No orders linked to this user yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="rounded-[1.5rem] border border-white/10 bg-[#101010] p-5">
                      <div className="flex items-center gap-3">
                        <Clock3 className="h-5 w-5 text-[#D4AF37]" />
                        <h3 className="text-lg font-semibold text-white">Activity Timeline</h3>
                      </div>
                      <div className="mt-5 space-y-3">
                        {selectedUser.activityTimeline?.length ? (
                          selectedUser.activityTimeline.map((activity) => {
                            const Icon = activityIconMap[activity.type] || Clock3;
                            return (
                              <div
                                key={activity.id}
                                className="flex gap-4 rounded-2xl border border-white/10 bg-black/50 p-4"
                              >
                                <div className="mt-1 rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-3">
                                  <Icon className="h-4 w-4 text-[#D4AF37]" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                      <p className="text-sm font-semibold text-white">
                                        {activity.title}
                                      </p>
                                      <p className="mt-2 text-sm leading-6 text-gray-400">
                                        {activity.description}
                                      </p>
                                    </div>
                                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                                      {formatDate(activity.createdAt, true)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="rounded-2xl border border-dashed border-white/10 bg-black/40 p-5 text-sm text-gray-400">
                            No recent activity has been recorded for this account.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-white/10 bg-[#101010] p-5">
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="h-5 w-5 text-[#D4AF37]" />
                        <h3 className="text-lg font-semibold text-white">Login Activity</h3>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        Last 15 attempts. New IPs and devices are flagged for review.
                      </p>
                      <div className="mt-4 max-h-[280px] space-y-2 overflow-y-auto pr-1">
                        {selectedUser.recentLogins?.length ? (
                          selectedUser.recentLogins.map((login) => (
                            <div
                              key={login._id}
                              className={`rounded-xl border p-3 text-sm ${
                                login.success
                                  ? login.newIp || login.newDevice
                                    ? "border-amber-400/30 bg-amber-400/5"
                                    : "border-white/5 bg-black/40"
                                  : "border-rose-400/30 bg-rose-400/5"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`font-mono text-[9px] uppercase tracking-[0.22em] ${
                                      login.success ? "text-emerald-300" : "text-rose-300"
                                    }`}
                                  >
                                    {login.success
                                      ? "Success"
                                      : login.failureReason?.replace(/_/g, " ") || "Failed"}
                                  </span>
                                  {login.newIp ? (
                                    <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-amber-300">
                                      · new IP
                                    </span>
                                  ) : null}
                                  {login.newDevice ? (
                                    <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-amber-300">
                                      · new device
                                    </span>
                                  ) : null}
                                </div>
                                <span className="font-mono text-[10px] text-gray-400">
                                  {formatDate(login.createdAt, true)}
                                </span>
                              </div>
                              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400">
                                <span className="inline-flex items-center gap-1">
                                  <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-gray-500">
                                    IP
                                  </span>
                                  <span className="font-mono text-[11px] text-gray-300">
                                    {login.ip || "—"}
                                  </span>
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-gray-500">
                                    Device
                                  </span>
                                  <span className="text-[11px] text-gray-300">
                                    {login.deviceHint || "Unknown"}
                                  </span>
                                </span>
                                {login.provider !== "local" ? (
                                  <span className="inline-flex items-center gap-1">
                                    <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-gray-500">
                                      Via
                                    </span>
                                    <span className="text-[11px] text-gray-300">{login.provider}</span>
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-xl border border-dashed border-white/10 bg-black/40 p-4 text-sm text-gray-400">
                            No login activity recorded yet.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-white/10 bg-[#101010] p-5">
                      <div className="flex items-center gap-3">
                        <BellRing className="h-5 w-5 text-[#D4AF37]" />
                        <h3 className="text-lg font-semibold text-white">Recent Notifications</h3>
                      </div>
                      <div className="mt-5 space-y-3">
                        {selectedUser.recentNotifications?.length ? (
                          selectedUser.recentNotifications.map((notification) => (
                            <div
                              key={notification._id}
                              className="rounded-2xl border border-white/10 bg-black/50 p-4"
                            >
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-white">
                                    {notification.title}
                                  </p>
                                  <p className="mt-2 text-sm leading-6 text-gray-400">
                                    {notification.message}
                                  </p>
                                </div>
                                <span className="rounded-full border border-white/10 bg-black/70 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-gray-300">
                                  {notification.isRead ? "Read" : "Unread"}
                                </span>
                              </div>
                              <div className="mt-3 flex flex-wrap gap-3 text-xs uppercase tracking-[0.2em] text-gray-500">
                                <span>{notification.type}</span>
                                <span>{formatDate(notification.createdAt, true)}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-2xl border border-dashed border-white/10 bg-black/40 p-5 text-sm text-gray-400">
                            No notifications found for this account.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            ) : (
              <div className="flex min-h-[24rem] items-center justify-center rounded-[1.75rem] border border-dashed border-white/10 bg-black/30 p-8 text-center">
                <div className="max-w-md">
                  <Users className="mx-auto h-10 w-10 text-[#D4AF37]" />
                  <h2 className="mt-4 text-2xl font-semibold text-white">Choose a user</h2>
                  <p className="mt-3 text-sm leading-7 text-gray-400">
                    Pick an account from the left to review its activity, order relationship, and
                    admin actions.
                  </p>
                </div>
              </div>
            )}

            {error ? (
              <div className="mt-6 rounded-[1.5rem] border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
                {error}
              </div>
            ) : null}
          </div>
        </section>
      </div>
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
