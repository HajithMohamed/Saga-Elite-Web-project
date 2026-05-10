import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ChevronLeft, ChevronRight, Filter, RefreshCcw, ScrollText } from "lucide-react";

import { fetchActivityFeed, setFilter, clearFilters } from "@/store/adminLogSlice";
import { fetchAdmins } from "@/store/admin/super-admin-slice";
import { useSocketEvent } from "@/hooks/use-socket-events";
import { AdminPage } from "@/components/admin-components/AdminUI";
import ActivityLogTable from "@/pages/admin-view/ActivityLogTable";

const CATEGORIES = [
  { value: "", label: "All categories" },
  { value: "product", label: "Product" },
  { value: "order", label: "Order" },
  { value: "payment", label: "Payment" },
  { value: "user", label: "User" },
  { value: "drop", label: "Drop" },
  { value: "notification", label: "Notification" },
  { value: "review", label: "Review" },
  { value: "auth", label: "Auth" },
  { value: "system", label: "System" },
  { value: "admin", label: "Admin team" },
];

const METHODS = [
  { value: "", label: "Any method" },
  { value: "POST", label: "POST" },
  { value: "PUT", label: "PUT" },
  { value: "PATCH", label: "PATCH" },
  { value: "DELETE", label: "DELETE" },
];

const PAGE_SIZE = 50;

const fieldLabel =
  "mb-1 block text-[9px] uppercase tracking-[0.22em] text-[#99907c]";
const fieldInput =
  "w-full border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-xs text-[#FAF7F2] outline-none focus:border-[#f2ca50]";

const ActivityTimeline = () => {
  const dispatch = useDispatch();
  const { logs, loading, pagination, filters, error } = useSelector((s) => s.adminLog);
  const user = useSelector((s) => s.auth.user);
  const admins = useSelector((s) => s.superAdmin.admins);
  const isSuperAdmin =
    user?.role === "super_admin" || user?.role === "superadmin";
  const [page, setPage] = useState(1);

  const refetch = useCallback(
    (overridePage) =>
      dispatch(
        fetchActivityFeed({
          filters,
          page: overridePage ?? page,
          limit: PAGE_SIZE,
        })
      ),
    [dispatch, filters, page]
  );

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Super admins get the admin-email filter — ensure the list is loaded.
  useEffect(() => {
    if (isSuperAdmin && admins.length === 0) {
      dispatch(fetchAdmins());
    }
  }, [dispatch, isSuperAdmin, admins.length]);

  // Real-time: refetch on any admin write. Full refetch (not append) so the
  // current page stays consistent with filters and pagination counts.
  useSocketEvent("admin:refresh", () => refetch());

  const updateFilter = (key, value) => {
    dispatch(setFilter({ key, value }));
    setPage(1);
  };

  const onClear = () => {
    dispatch(clearFilters());
    setPage(1);
  };

  const headerStats = useMemo(
    () => ({
      total: pagination?.total ?? 0,
      page: pagination?.page ?? 1,
      pages: pagination?.pages ?? 1,
    }),
    [pagination]
  );

  return (
    <AdminPage
      eyebrow="Audit"
      title="Activity Timeline"
      description="Every privileged write across the admin system. Each role sees only what they're permitted to view."
    >
      <div className="mx-auto max-w-6xl pb-20">
        <div className="mb-6 rounded-2xl border border-white/10 bg-[#0a0a0a] p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[#99907c]">
              <Filter className="h-3 w-3 text-[#f2ca50]" />
              Filters
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClear}
                className="text-[10px] uppercase tracking-[0.22em] text-[#99907c] hover:text-[#f2ca50]"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => refetch()}
                title="Refetch now"
                className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-2 text-[#D4AF37] hover:bg-[#D4AF37]/20"
              >
                <RefreshCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className={fieldLabel}>From</label>
              <input
                type="date"
                value={filters.from}
                onChange={(e) => updateFilter("from", e.target.value)}
                className={fieldInput}
                data-testid="admin-activity-filter-from"
              />
            </div>
            <div>
              <label className={fieldLabel}>To</label>
              <input
                type="date"
                value={filters.to}
                onChange={(e) => updateFilter("to", e.target.value)}
                className={fieldInput}
                data-testid="admin-activity-filter-to"
              />
            </div>
            <div>
              <label className={fieldLabel}>Category</label>
              <select
                value={filters.category}
                onChange={(e) => updateFilter("category", e.target.value)}
                className={fieldInput}
                data-testid="admin-activity-filter-category"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value || "all"} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={fieldLabel}>Method</label>
              <select
                value={filters.method}
                onChange={(e) => updateFilter("method", e.target.value)}
                className={fieldInput}
                data-testid="admin-activity-filter-method"
              >
                {METHODS.map((m) => (
                  <option key={m.value || "all"} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={isSuperAdmin ? "md:col-span-2" : "md:col-span-2 lg:col-span-3"}>
              <label className={fieldLabel}>Search action / route</label>
              <input
                type="search"
                value={filters.q}
                onChange={(e) => updateFilter("q", e.target.value)}
                placeholder="e.g. update-product or /orders"
                className={fieldInput}
                data-testid="admin-activity-filter-search"
              />
            </div>
            {isSuperAdmin && (
              <div className="lg:col-span-2">
                <label className={fieldLabel}>Admin</label>
                <select
                  value={filters.adminId}
                  onChange={(e) => updateFilter("adminId", e.target.value)}
                  className={fieldInput}
                  data-testid="admin-activity-filter-admin"
                >
                  <option value="">All admins</option>
                  {admins.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.email}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[10px] uppercase tracking-[0.22em] text-[#99907c]">
          <div className="flex items-center gap-2">
            <ScrollText className="h-3 w-3 text-[#f2ca50]" />
            <span data-testid="admin-activity-total">
              {headerStats.total} log{headerStats.total === 1 ? "" : "s"}
            </span>
          </div>
          <div>
            Page {headerStats.page} of {headerStats.pages}
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
            {error}
          </div>
        ) : null}

        <ActivityLogTable logs={logs} loading={loading} hideSearch />

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            disabled={loading || page <= 1}
            onClick={() => {
              const next = Math.max(1, page - 1);
              setPage(next);
              refetch(next);
            }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#0a0a0a] px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-[#e5e2e1] hover:border-[#D4AF37]/40 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-3 w-3" />
            Previous
          </button>
          <button
            type="button"
            disabled={loading || page >= (pagination?.pages || 1)}
            onClick={() => {
              const next = Math.min(pagination?.pages || 1, page + 1);
              setPage(next);
              refetch(next);
            }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#0a0a0a] px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-[#e5e2e1] hover:border-[#D4AF37]/40 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </AdminPage>
  );
};

export default ActivityTimeline;
