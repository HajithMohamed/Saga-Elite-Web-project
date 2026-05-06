import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Search, Download, DollarSign, TrendingUp, TrendingDown, Package, Loader2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdmins, fetchActivityLogs } from "../../store/admin/super-admin-slice";
import AdminTable from "./AdminTable";
import ActivityLogTable from "./ActivityLogTable";
import CreateAdminModal from "./CreateAdminModal";
import { AdminPage, AdminPanel } from "@/components/admin-components/AdminUI";
import { API_V1_URL } from "@/lib/api";
import { fetchDashboardStats } from "@/store/order-slice";
import {
  pageVariants,
  containerVariants,
  itemVariants,
} from "@/components/admin-components/_shared/animations";
import { AnimatedNumber } from "@/components/admin-components/_shared/AnimatedNumber";
import { SkeletonGrid } from "@/components/admin-components/_shared/SkeletonCard";
import { PrimaryButton } from "@/components/admin-components/_shared/Buttons";

const TAB = { ADMINS: "admins", LOGS: "logs" };
const isSuperAdminRole = (role) => role === "super_admin" || role === "superadmin";
const formatLkr = (value = 0) =>
  `LKR ${(Number(value) || 0).toLocaleString("en-LK", { maximumFractionDigits: 0 })}`;

const formatPercent = (value = 0) => {
  const amount = Number.isFinite(value) ? value : 0;
  const sign = amount > 0 ? "+" : "";
  return `${sign}${amount.toFixed(1)}%`;
};

const SuperAdminDashboard = () => {
  const dispatch = useDispatch();
  const { admins, adminsLoading, adminsError, activityLogs } =
    useSelector((s) => s.superAdmin);
  const { dashboardStats } = useSelector((s) => s.order);
  const currentUser = useSelector((s) => s.auth?.user);

  const [tab, setTab] = useState(TAB.ADMINS);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statsLoading, setStatsLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    dispatch(fetchAdmins());
    dispatch(fetchActivityLogs({ page: 1, limit: 100 }));
  }, [dispatch]);

  useEffect(() => {
    let cancelled = false;
    setStatsLoading(true);
    dispatch(fetchDashboardStats())
      .unwrap()
      .catch(() => {
        // Keep the page usable if analytics fail to load.
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  const activeAdmins = admins.filter(
    (a) => a.isActive && !isSuperAdminRole(a.role)
  );
  const inactiveAdmins = admins.filter(
    (a) => !a.isActive && !isSuperAdminRole(a.role)
  );

  const filteredAdmins = admins.filter(
    (a) =>
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.email?.toLowerCase().includes(search.toLowerCase()) ||
      a.role?.toLowerCase().includes(search.toLowerCase()) ||
      a.subRole?.toLowerCase().includes(search.toLowerCase())
  );

  const totalAdmins = admins.filter((a) => !isSuperAdminRole(a.role)).length;
  const overview = dashboardStats?.overview || {};
  const salesTrend = Array.isArray(dashboardStats?.salesTrend) ? dashboardStats.salesTrend : [];
  const latestMonth = salesTrend[salesTrend.length - 1] || null;
  const previousMonth = salesTrend[salesTrend.length - 2] || null;
  const latestRevenue = Number(latestMonth?.revenue || 0);
  const previousRevenue = Number(previousMonth?.revenue || 0);
  const revenueChange = previousRevenue > 0
    ? ((latestRevenue - previousRevenue) / previousRevenue) * 100
    : latestRevenue > 0
      ? 100
      : 0;
  const mostSoldDrop = dashboardStats?.topDrops?.[0] || dashboardStats?.highlights?.topDrop || null;

  const handleExportCustomers = async () => {
    setExporting(true);
    try {
      const response = await axios.get(`${API_V1_URL}/admin/users/export`, {
        withCredentials: true,
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "customers-export.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Customer export failed", error);
    } finally {
      setExporting(false);
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
        eyebrow="Super Admin"
        title="Super admin console"
        description="Manage admin access and monitor privileged operations."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton type="button" onClick={() => void handleExportCustomers()}>
              <span className="inline-flex items-center gap-2">
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Export Customers (CSV)
              </span>
            </PrimaryButton>
            <div className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-[#D4AF37]">
              {currentUser?.name || currentUser?.email}
            </div>
          </div>
        }
      >
        <motion.div
          className="grid grid-cols-2 gap-4 lg:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {[
            { label: "Total Admins", value: totalAdmins, hint: "Excluding super admin" },
            { label: "Active", value: activeAdmins.length, hint: "Can log in" },
            { label: "Inactive", value: inactiveAdmins.length, hint: "Access revoked" },
            { label: "Log Entries", value: activityLogs.length, hint: "Recent operations" },
          ].map((card) => (
            <motion.div
              key={card.label}
              variants={itemVariants}
              whileHover={{ y: -3, borderColor: "rgba(212,175,55,0.35)" }}
              transition={{ duration: 0.2 }}
              className="admin-stat-card rounded-[28px] border border-white/10 bg-white/[0.03] p-5"
            >
              <p className="admin-stat-label">{card.label}</p>
              <p className="admin-stat-value mt-2 text-3xl font-semibold text-white">
                <AnimatedNumber value={card.value} />
              </p>
              {card.hint ? <p className="admin-stat-hint mt-1 text-xs text-gray-500">{card.hint}</p> : null}
            </motion.div>
          ))}
        </motion.div>

        <AdminPanel className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-8 border-b border-white/10">
              {[
                { key: TAB.ADMINS, label: "Admin Accounts" },
                { key: TAB.LOGS, label: "Activity Log" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`relative pb-3 text-sm font-semibold transition-colors ${
                    tab === key ? "text-white" : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {label}
                  {tab === key ? (
                    <motion.div
                      layoutId="superadmin-tab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  ) : null}
                </button>
              ))}
            </div>

            {tab === TAB.ADMINS ? (
              <div className="flex flex-wrap gap-3">
                <div className="relative min-w-[200px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search admins…"
                    className="w-full min-w-[200px] rounded-2xl border border-white/10 bg-black/60 py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  onClick={() => setCreateOpen(true)}
                  className="rounded-full bg-[#D4AF37] px-4 py-2.5 text-sm font-bold text-black hover:bg-[#c99d2f]"
                >
                  + New Admin
                </motion.button>
              </div>
            ) : null}
          </div>

          {tab === TAB.ADMINS ? (
            <>
              {adminsLoading ? (
                <div className="mt-6">
                  <SkeletonGrid count={4} className="grid gap-4 md:grid-cols-2" />
                </div>
              ) : null}
              {adminsError ? (
                <div className="py-10 text-center text-sm text-red-400">{adminsError}</div>
              ) : null}
              {!adminsLoading && !adminsError ? (
                <AdminTable admins={filteredAdmins} currentUserId={currentUser?._id} />
              ) : null}
            </>
          ) : (
            <ActivityLogTable />
          )}
        </AdminPanel>

          <motion.div
            className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {[
              {
                label: "Lifetime Revenue",
                value: formatLkr(overview.totalRevenue),
                hint: statsLoading ? "Loading analytics…" : "Total revenue across completed and active orders",
                icon: DollarSign,
              },
              {
                label: "Month Change",
                value: `${formatPercent(revenueChange)}`,
                hint: latestMonth && previousMonth ? `${latestMonth.label} vs ${previousMonth.label}` : "Requires two months of order data",
                icon: revenueChange >= 0 ? TrendingUp : TrendingDown,
              },
              {
                label: "Most Sold Drop",
                value: mostSoldDrop?.name || "No data",
                hint: mostSoldDrop?.soldUnits ? `${mostSoldDrop.soldUnits} units sold` : "Derived from order analytics",
                icon: Package,
              },
              {
                label: "Average Order Value",
                value: formatLkr(overview.averageOrderValue),
                hint: statsLoading ? "Loading analytics…" : "Revenue divided by non-cancelled orders",
                icon: DollarSign,
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.label}
                  variants={itemVariants}
                  whileHover={{ y: -3, borderColor: "rgba(212,175,55,0.35)" }}
                  transition={{ duration: 0.2 }}
                  className="admin-stat-card rounded-[28px] border border-white/10 bg-white/[0.03] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="admin-stat-label">{card.label}</p>
                      <p className="mt-2 text-xl font-semibold text-white break-words">{card.value}</p>
                      {card.hint ? <p className="admin-stat-hint mt-1 text-xs text-gray-500">{card.hint}</p> : null}
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/40 p-2.5">
                      <Icon className="h-5 w-5 text-[#D4AF37]" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

        <CreateAdminModal isOpen={isCreateOpen} onClose={() => setCreateOpen(false)} />
      </AdminPage>
    </motion.div>
  );
};

export default SuperAdminDashboard;
