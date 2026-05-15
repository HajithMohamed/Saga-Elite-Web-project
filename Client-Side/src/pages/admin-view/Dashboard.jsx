import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CreditCard,
  DollarSign,
  Layers3,
  Package,
  ShoppingBag,
  ShoppingCart,
  Timer,
  Wallet,
} from "lucide-react";
import { fetchDashboardStats } from "@/store/order-slice";
import { useSocketEvent } from "@/hooks/use-socket-events";
import { API_V1_URL } from "@/lib/api";
import { AdminPage } from "@/components/admin-components/AdminUI";
import {
  pageVariants,
  containerVariants,
  itemVariants,
} from "@/components/admin-components/_shared/animations";
import { AnimatedNumber } from "@/components/admin-components/_shared/AnimatedNumber";
import { SkeletonGrid } from "@/components/admin-components/_shared/SkeletonCard";

const currencyFormatter = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-LK");

const statusToneMap = {
  pending: "border-amber-500/20 bg-amber-500/10 text-amber-200",
  pending_payment: "border-amber-500/20 bg-amber-500/10 text-amber-200",
  verification_pending: "border-orange-500/20 bg-orange-500/10 text-orange-200",
  confirmed: "border-sky-500/20 bg-sky-500/10 text-sky-200",
  shipped: "border-indigo-500/20 bg-indigo-500/10 text-indigo-200",
  delivered: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
  cancelled: "border-rose-500/20 bg-rose-500/10 text-rose-200",
};

const formatCurrency = (value) => currencyFormatter.format(value || 0);
const formatNumber = (value) => numberFormatter.format(value || 0);

const formatDate = (value) => {
  if (!value) return "Not scheduled";
  return new Date(value).toLocaleDateString("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatLabel = (value) =>
  String(value || "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const timeAgo = (date) => {
  if (!date) return "";
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return formatDate(date);
};

const dropCountdown = (drop, nowMs) => {
  if (!drop) return null;
  const release = drop.releaseDate ? new Date(drop.releaseDate).getTime() : null;
  const end = drop.endDate ? new Date(drop.endDate).getTime() : null;
  if (release && release > nowMs) return { phase: "Releases in", remaining: release - nowMs };
  if (end && end > nowMs) return { phase: "Ends in", remaining: end - nowMs };
  if (end && end <= nowMs) return { phase: "Ended", remaining: 0 };
  return { phase: "Live now", remaining: null };
};

const formatDuration = (ms) => {
  if (ms == null) return "Active";
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const pad = (n) => n.toString().padStart(2, "0");
  if (days > 0) return `${days}d ${pad(hours)}h ${pad(minutes)}m`;
  return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
};

const quickLinks = [
  {
    title: "Orders",
    description: "Review orders and move fulfilment forward.",
    to: "/admin/order",
    icon: ShoppingCart,
    permission: "orders",
  },
  {
    title: "Products",
    description: "Update stock, pricing, and catalog status.",
    to: "/admin/product",
    icon: Package,
    permission: "products",
  },
  {
    title: "Payments",
    description: "Verify bank-transfer proofs.",
    to: "/admin/payments/pending",
    icon: Wallet,
    permission: "verifyPayments",
  },
  {
    title: "Drops",
    description: "Manage live and upcoming releases.",
    to: "/admin/drop",
    icon: Layers3,
    permission: "drops",
  },
];

const Card = ({ children, className = "" }) => (
  <div className={`rounded-2xl border border-white/10 bg-[#101010] p-5 ${className}`}>
    {children}
  </div>
);

const SectionTitle = ({ eyebrow, title, action }) => (
  <div className="mb-4 flex items-start justify-between gap-4">
    <div>
      <p className="text-xs font-medium text-[#D4AF37]">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-semibold text-white">{title}</h2>
    </div>
    {action}
  </div>
);

const KpiTile = ({ label, value, formatter, hint, icon, tone = "text-[#D4AF37]" }) => {
  const Icon = icon;

  return (
    <motion.div
      variants={itemVariants}
      className="rounded-2xl border border-white/10 bg-[#101010] p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-gray-400">{label}</p>
          <p className="mt-2 truncate text-2xl font-semibold text-white">
            {typeof value === "number" && formatter ? (
              <AnimatedNumber value={value} formatter={formatter} />
            ) : (
              value
            )}
          </p>
          {hint ? <p className="mt-1 truncate text-xs text-gray-500">{hint}</p> : null}
        </div>
        <div className="rounded-xl bg-white/[0.04] p-2">
          <Icon className={`h-5 w-5 ${tone}`} />
        </div>
      </div>
    </motion.div>
  );
};

const OrderStatusPill = ({ label, value }) => (
  <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
    <p className="text-[11px] text-gray-500">{label}</p>
    <p className="mt-1 text-lg font-semibold text-white">{formatNumber(value)}</p>
  </div>
);

const EmptyBlock = ({ children }) => (
  <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-5 text-sm text-gray-400">
    {children}
  </div>
);

const Dashboard = () => {
  const dispatch = useDispatch();
  const { dashboardStats, isLoading, orderError } = useSelector((state) => state.order);
  const { user } = useSelector((state) => state.auth);

  const isSuperAdmin = user?.role === "super_admin" || user?.role === "superadmin";
  const userPerms = user?.permissions || {};

  const [activeDrop, setActiveDrop] = useState(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const refreshDashboard = useCallback(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const fetchActiveDrop = useCallback(async () => {
    try {
      const res = await axios.get(`${API_V1_URL}/drops/get-all-drops`, { withCredentials: true });
      const drops = res.data?.drops || [];
      const ts = Date.now();
      const live = drops.find(
        (drop) =>
          drop.isPublished &&
          !drop.isArchived &&
          (!drop.releaseDate || new Date(drop.releaseDate).getTime() <= ts) &&
          (!drop.endDate || new Date(drop.endDate).getTime() > ts)
      );
      const upcoming = drops
        .filter(
          (drop) =>
            drop.isPublished &&
            !drop.isArchived &&
            drop.releaseDate &&
            new Date(drop.releaseDate).getTime() > ts
        )
        .sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate))[0];

      setActiveDrop(live || upcoming || null);
    } catch {
      setActiveDrop(null);
    }
  }, []);

  useEffect(() => {
    fetchActiveDrop();
  }, [fetchActiveDrop]);

  useSocketEvent("order:refresh", refreshDashboard, [refreshDashboard]);
  useSocketEvent("payment:new_pending", refreshDashboard, [refreshDashboard]);
  useSocketEvent("payment:refresh", refreshDashboard, [refreshDashboard]);
  useSocketEvent("admin:refresh", refreshDashboard, [refreshDashboard]);
  useSocketEvent("drop:updated", () => {
    refreshDashboard();
    fetchActiveDrop();
  }, [refreshDashboard, fetchActiveDrop]);

  const overview = dashboardStats?.overview || {};
  const highlights = dashboardStats?.highlights || {};
  const salesTrend = dashboardStats?.salesTrend || [];
  const topProducts = dashboardStats?.topProducts || [];
  const topDrops = dashboardStats?.topDrops || [];
  const inventoryAlerts = dashboardStats?.inventoryAlerts || [];
  const recentOrders = dashboardStats?.recentOrders || [];
  const orderStatusBreakdown = dashboardStats?.orderStatusBreakdown || {};

  const visibleQuickLinks = isSuperAdmin
    ? quickLinks
    : quickLinks.filter((item) => !item.permission || userPerms[item.permission]);

  const dropCd = dropCountdown(activeDrop, nowMs);
  const maxRevenue = Math.max(...salesTrend.map((entry) => entry.revenue || 0), 1);

  const latestOrders = recentOrders.slice(0, 5);
  const latestFeed = recentOrders.slice(0, 4);
  const lowStockLead = inventoryAlerts[0];
  const bestSeller = highlights.bestSellingProduct || topProducts[0];
  const topDrop = highlights.topDrop || topDrops[0];

  const topStrip = useMemo(
    () => [
      {
        label: "Revenue",
        value: Number(overview.totalRevenue) || 0,
        formatter: (value) => currencyFormatter.format(Math.round(value)),
        hint: `${formatCurrency(overview.completedRevenue)} delivered`,
        icon: DollarSign,
        tone: "text-[#D4AF37]",
      },
      {
        label: "Orders",
        value: Number(overview.activeOrders) || 0,
        formatter: (value) => numberFormatter.format(Math.round(value)),
        hint: `${formatNumber(overview.totalOrders)} total`,
        icon: ShoppingBag,
        tone: "text-sky-300",
      },
      {
        label: "Pending Payments",
        value: Number(overview.pendingPayments) || 0,
        formatter: (value) => numberFormatter.format(Math.round(value)),
        hint: `${formatNumber(overview.pendingVerification)} orders to verify`,
        icon: CreditCard,
        tone: "text-orange-300",
      },
      {
        label: "Low Stock",
        value: Number(overview.lowStockProducts) || 0,
        formatter: (value) => numberFormatter.format(Math.round(value)),
        hint: `${formatNumber(overview.stockOnHand)} units on hand`,
        icon: AlertTriangle,
        tone: "text-amber-300",
      },
      {
        label: "Live Drop",
        value: Number(overview.liveDrops) || 0,
        formatter: (value) => numberFormatter.format(Math.round(value)),
        hint: activeDrop?.name || "No active drop",
        icon: Layers3,
        tone: "text-pink-300",
      },
    ],
    [overview, activeDrop]
  );

  return (
    <AdminPage
      eyebrow="Admin Overview"
      title="Command center"
      description="Focused operations for orders, payments, stock, and live drops."
    >
      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        className="w-full space-y-6"
      >
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
        >
          {topStrip.map((item) => (
            <KpiTile key={item.label} {...item} />
          ))}
        </motion.section>

        {orderError ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
            Dashboard data could not be loaded completely: {orderError}
          </div>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <SectionTitle
              eyebrow="Operations"
              title="Live orders"
              action={
                <Link
                  to="/admin/order"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#D4AF37] hover:text-white"
                >
                  Open orders
                  <ArrowRight className="h-4 w-4" />
                </Link>
              }
            />
            <div className="space-y-3">
              {latestFeed.length === 0 ? (
                <EmptyBlock>Latest orders from the database will appear here.</EmptyBlock>
              ) : (
                latestFeed.map((order) => (
                  <Link
                    key={order._id}
                    to="/admin/order"
                    className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/25 px-4 py-3 transition hover:border-[#D4AF37]/30 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-emerald-300" />
                        <p className="truncate text-sm font-semibold text-white">
                          {order.customerEmail}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {timeAgo(order.createdAt)} | {order.itemCount} item{order.itemCount === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs ${
                          statusToneMap[order.status] || "border-white/10 bg-white/5 text-gray-300"
                        }`}
                      >
                        {formatLabel(order.status)}
                      </span>
                      <span className="text-sm font-semibold text-white">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Card>

          <div className="grid gap-4">
            <Card>
              <SectionTitle
                eyebrow="Drop Status"
                title={activeDrop ? activeDrop.name : "No active drop"}
                action={
                  <Link to="/admin/drop" className="text-sm font-medium text-[#D4AF37] hover:text-white">
                    Manage
                  </Link>
                }
              />
              {activeDrop ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-4">
                    <div className="flex items-center gap-2 text-[#D4AF37]">
                      <Timer className="h-4 w-4" />
                      <p className="text-sm font-medium">{dropCd?.phase || "Live now"}</p>
                    </div>
                    <p className="mt-2 font-mono text-3xl font-semibold text-white">
                      {formatDuration(dropCd?.remaining)}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                      <p className="text-xs text-gray-500">Release</p>
                      <p className="mt-1 truncate text-gray-200">
                        {formatDate(activeDrop.releaseDate)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                      <p className="text-xs text-gray-500">Ends</p>
                      <p className="mt-1 truncate text-gray-200">
                        {activeDrop.endDate ? formatDate(activeDrop.endDate) : "Open"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyBlock>Publish a drop to bring launch status into the dashboard.</EmptyBlock>
              )}
            </Card>

            <Card>
              <SectionTitle
                eyebrow="Payment Alert"
                title={`${formatNumber(overview.pendingPayments)} proof${overview.pendingPayments === 1 ? "" : "s"} waiting`}
                action={
                  <Link
                    to="/admin/payments/pending"
                    className="text-sm font-medium text-[#D4AF37] hover:text-white"
                  >
                    Verify
                  </Link>
                }
              />
              <div className="grid grid-cols-3 gap-3">
                <OrderStatusPill label="Pending" value={orderStatusBreakdown.pending_payment || 0} />
                <OrderStatusPill label="Verify" value={orderStatusBreakdown.verification_pending || 0} />
                <OrderStatusPill label="Active" value={overview.activeOrders || 0} />
              </div>
            </Card>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <Card>
            <SectionTitle eyebrow="Sales" title="Revenue trend" />
            <div className="grid min-h-[260px] gap-3 sm:grid-cols-6">
              {salesTrend.length === 0 ? (
                <div className="sm:col-span-6">
                  <EmptyBlock>Revenue data will appear after orders are placed.</EmptyBlock>
                </div>
              ) : (
                salesTrend.map((entry, index) => (
                  <div key={entry.monthKey} className="flex flex-col items-center gap-3">
                    <div className="flex h-44 w-full items-end rounded-xl border border-white/10 bg-black/25 p-2">
                      <motion.div
                        className="w-full rounded-lg bg-[#D4AF37]"
                        style={{
                          height: `${Math.max(10, Math.round((entry.revenue / maxRevenue) * 100))}%`,
                        }}
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.35, delay: index * 0.04 }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">{entry.label}</p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {formatCurrency(entry.revenue)}
                      </p>
                      <p className="text-xs text-gray-500">{formatNumber(entry.orders)} orders</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <SectionTitle
              eyebrow="Orders"
              title="Recent orders"
              action={
                <div className="hidden gap-2 md:flex">
                  <OrderStatusPill label="Shipped" value={orderStatusBreakdown.shipped || 0} />
                  <OrderStatusPill label="Delivered" value={orderStatusBreakdown.delivered || 0} />
                  <OrderStatusPill label="Cancelled" value={orderStatusBreakdown.cancelled || 0} />
                </div>
              }
            />
            <div className="space-y-3">
              {latestOrders.length === 0 ? (
                <EmptyBlock>Recent orders from the database will appear here.</EmptyBlock>
              ) : (
                latestOrders.map((order) => (
                  <div
                    key={order._id}
                    className="rounded-xl border border-white/10 bg-black/25 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{order.customerEmail}</p>
                        <p className="mt-1 text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                      </div>
                      <p className="text-sm font-semibold text-white">{formatCurrency(order.totalAmount)}</p>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs ${
                          statusToneMap[order.status] || "border-white/10 bg-white/5 text-gray-300"
                        }`}
                      >
                        {formatLabel(order.status)}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-gray-300">
                        {formatLabel(order.paymentMethod)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </section>

        <Card>
          <SectionTitle
            eyebrow="Product Health"
            title="Best seller, stock risk, and top drop"
            action={
              <Link to="/admin/product" className="text-sm font-medium text-[#D4AF37] hover:text-white">
                Manage catalog
              </Link>
            }
          />
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="mb-3 flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-[#D4AF37]" />
                <p className="text-sm font-medium text-gray-300">Best Seller</p>
              </div>
              <p className="line-clamp-1 text-lg font-semibold text-white">
                {bestSeller?.name || "No sales yet"}
              </p>
              <p className="mt-2 text-sm text-gray-500">
                {bestSeller
                  ? `${formatNumber(bestSeller.soldCount)} sold | ${formatNumber(bestSeller.totalStock)} in stock`
                  : "Sales data will populate after checkout activity starts."}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-300" />
                <p className="text-sm font-medium text-gray-300">Low Stock</p>
              </div>
              <p className="line-clamp-1 text-lg font-semibold text-white">
                {lowStockLead?.name || "No low-stock products"}
              </p>
              <p className="mt-2 text-sm text-gray-500">
                {lowStockLead
                  ? `${formatNumber(lowStockLead.totalStock)} units left | ${formatNumber(inventoryAlerts.length)} products flagged`
                  : "Inventory levels currently look healthy."}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Layers3 className="h-4 w-4 text-pink-300" />
                <p className="text-sm font-medium text-gray-300">Top Drop</p>
              </div>
              <p className="line-clamp-1 text-lg font-semibold text-white">
                {topDrop?.name || "No drop data yet"}
              </p>
              <p className="mt-2 text-sm text-gray-500">
                {topDrop
                  ? `${formatNumber(topDrop.soldUnits)} sold | ${formatNumber(topDrop.stockOnHand)} in stock`




: "Drop performance will populate from product sales."}
              </p>
            </div>
          </div>
        </Card>

        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          {visibleQuickLinks.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div key={item.title} variants={itemVariants}>
                <Link
                  to={item.to}
                  className="group block rounded-2xl border border-white/10 bg-[#101010] p-4 transition hover:border-[#D4AF37]/30"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="rounded-xl bg-white/[0.04] p-3">
                      <Icon className="h-5 w-5 text-[#D4AF37]" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-500 transition group-hover:text-white" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-white">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-gray-500">{item.description}</p>
                </Link>
              </motion.div>
            );
          })}
        </motion.section>

        {isLoading && !dashboardStats ? <SkeletonGrid count={5} /> : null}
      </motion.div>
    </AdminPage>
  );
};

export default Dashboard;
