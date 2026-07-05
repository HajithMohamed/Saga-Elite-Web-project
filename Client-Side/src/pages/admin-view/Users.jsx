import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import {
  Crown,
  RefreshCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  UserCheck,
  Users,
  AlertTriangle,
} from "lucide-react";
import { AdminPage } from "@/components/admin-components/AdminUI";
import {
  fetchAdminUserDetail,
  fetchAdminUsers,
  bulkTagUsers,
} from "@/store/admin/user-slice";
import CustomerDetailModal from "@/components/admin-components/CustomerDetailModal";
import { toast } from "@/hooks/use-toast";
import { pageVariants } from "@/components/admin-components/_shared/animations";
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
  vip: "border-gold-ink bg-gold/15 text-gold-ink",
  legend: "border-purple-400/40 bg-purple-400/10 text-purple-300",
  rare: "border-cyan-400/40 bg-cyan-400/10 text-cyan-300",
  elite: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  standard: "border-ink/10 bg-ink/5 text-gray-300",
};

// Customer tags drive segmentation in Marketing + Notifications. Order matters
// here — these render as a chip row, left-to-right. Keep keys in sync with the
// User model's enum.
const CUSTOMER_TAGS = [
  {
    key: "vip",
    label: "VIP",
    description: "Manual flag for high-touch service",
    accent: "border-gold-ink/50 bg-gold/15 text-gold-ink",
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
    accent: "text-gold-ink2",
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
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [membershipFilter, setMembershipFilter] = useState("all");
  const [sortMode] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

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

  useEffect(() => {
    if (!isListLoading && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, isListLoading, totalPages]);

  const bulk = useBulkSelection(users);
  const [bulkPending, setBulkPending] = useState(false);
  const [bulkTagDraft] = useState("vip");
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

  const openCustomer = (userId) => {
    setSelectedUserId(userId);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedUserId(null);
  };

  const handleCustomerDeleted = () => {
    setModalOpen(false);
    setSelectedUserId(null);
    const nextPage = users.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
    if (nextPage !== currentPage) {
      setCurrentPage(nextPage);
    }
    loadUsers({ page: nextPage });
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
        <div className="flex w-full flex-col gap-8 text-ink">
          {/* Header & KPI Strip */}
          <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between rounded-[2rem] border border-gold-ink2/15 bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.18),_transparent_35%),linear-gradient(180deg,_#111111_0%,_#090909_100%)] p-8">
            <div className="max-w-3xl">
              <h1 className="mt-4 text-4xl font-serif font-semibold text-ink">
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
                className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-black/60 px-5 py-3 text-sm font-semibold text-ink transition hover:border-gold-ink2/40 disabled:opacity-50"
              >
                <RefreshCcw className="h-4 w-4" /> Refresh
              </button>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.key} className="relative overflow-hidden rounded-[1.5rem] border border-ink/10 bg-panel p-5 transition hover:border-gold-ink2/30 group">
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-gray-500">{card.label}</span>
                    <Icon className={`h-4 w-4 ${card.accent}`} />
                  </div>
                  <div className="mt-4 text-3xl font-serif font-semibold text-ink">
                    {stats?.[card.key]?.toLocaleString() || "0"}
                  </div>
                  <div className="absolute -bottom-px left-0 w-0 h-px bg-gradient-to-r from-transparent via-gold-deep to-transparent transition-all duration-700 group-hover:w-full" />
                </div>
              );
            })}
             <div className="relative overflow-hidden rounded-[1.5rem] border border-ink/10 bg-panel p-5 transition hover:border-gold-ink2/30 group">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Predicted Churn</span>
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                </div>
                <div className="mt-4 text-3xl font-serif font-semibold text-ink">Tracking</div>
                <div className="absolute -bottom-px left-0 w-0 h-px bg-gradient-to-r from-transparent via-rose-500 to-transparent transition-all duration-700 group-hover:w-full" />
             </div>
          </section>

          {/* Filters + List (Full width) */}
          <section className="rounded-[2rem] border border-ink/10 bg-page p-6">
            <div className="flex flex-col gap-4 border-b border-ink/10 pb-5">
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
                          ? "border-gold-ink2/60 bg-gold-deep/10 text-gold-ink2"
                          : "border-ink/10 bg-black/40 text-gray-400 hover:border-ink/30 hover:text-ink"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <label className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                      placeholder="Search customers..."
                      className="admin-input w-64 !pl-10"
                    />
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                    className="admin-select"
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
                 <div className="rounded-[1.5rem] border border-dashed border-ink/10 bg-black/40 p-8 text-center text-sm text-gray-400">
                   No customers matched the current filters.
                 </div>
              ) : (
                <div className="overflow-x-auto scrollbar-thin rounded-xl border border-ink/10">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="bg-panel uppercase tracking-[0.18em] text-[10px] text-gray-400 border-b border-ink/10">
                      <tr>
                        <th className="px-5 py-4 w-12">
                          <input
                            type="checkbox"
                            checked={bulk.isAllSelected}
                            onChange={bulk.toggleAll}
                            className="h-4 w-4 cursor-pointer accent-gold-deep"
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
                            onClick={() => openCustomer(user._id)}
                            className={`border-b border-ink/5 cursor-pointer transition-colors ${
                              isSelectedRow ? "bg-[#181510] border-l-2 border-l-gold-ink2" : "hover:bg-panel border-l-2 border-l-transparent"
                            }`}
                          >
                            <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={bulk.isSelected(user._id)}
                                onChange={() => bulk.toggle(user._id)}
                                className="h-4 w-4 cursor-pointer accent-gold-deep"
                              />
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-gradient-to-br from-card to-page border border-ink/10 text-xs font-bold text-gold-ink2">
                                  {(user.email || "?").slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-ink tracking-wide text-[13px]">{user.email}</span>
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
                            <td className="px-4 py-4 text-right font-mono text-[13px] text-gold-ink2">
                              {formatMoney(user.relationship.totalSpent)}
                            </td>
                            <td className="px-4 py-4 text-center font-mono text-[13px] text-gray-300">
                              {user.relationship.orderCount}
                            </td>
                            <td className="px-4 py-4 min-w-[200px]">
                              <div className="flex flex-wrap gap-1.5 max-w-[240px]">
                                {user.tags?.slice(0, 3).map(tag => (
                                  <span key={tag} className="px-1.5 py-0.5 bg-ink/5 border border-ink/10 rounded-sm text-[9px] uppercase text-gray-400">
                                    {tag.replace('_', ' ')}
                                  </span>
                                ))}
                                {(user.tags?.length || 0) > 3 && (
                                  <span className="px-1.5 py-0.5 bg-ink/5 border border-ink/10 rounded-sm text-[9px] text-gray-500">
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
               <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink/45">
                 Showing {showingFrom}-{showingTo} of {paginationTotal}
               </div>
               <div className="flex items-center gap-2">
                 <button
                   type="button"
                   disabled={paginationPage <= 1 || isListLoading}
                   onClick={() => setCurrentPage(Math.max(1, paginationPage - 1))}
                   className="h-8 px-3 rounded-sm border border-ink/10 bg-transparent text-gray-400 hover:border-gold-ink2/40 hover:text-gold-ink2 disabled:opacity-30 disabled:pointer-events-none transition"
                 >
                   Prev
                 </button>
                 <span className="text-gray-500 font-mono text-[11px] px-2">{paginationPage} / {totalPages}</span>
                 <button
                   type="button"
                   disabled={paginationPage >= totalPages || isListLoading}
                   onClick={() => setCurrentPage(Math.min(totalPages, paginationPage + 1))}
                   className="h-8 px-3 rounded-sm border border-ink/10 bg-transparent text-gray-400 hover:border-gold-ink2/40 hover:text-gold-ink2 disabled:opacity-30 disabled:pointer-events-none transition"
                 >
                   Next
                 </button>
               </div>
            </div>
          </section>

          {error && (
            <div className="rounded-[1.5rem] border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          )}
        </div>

        {modalOpen && selectedUserId ? (
          <CustomerDetailModal
            user={selectedUser}
            isLoading={isDetailLoading || selectedUser?._id !== selectedUserId}
            onClose={closeModal}
            onMutated={() => loadUsers()}
            onDeleted={handleCustomerDeleted}
          />
        ) : null}

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
