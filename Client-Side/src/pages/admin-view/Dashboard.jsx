import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Boxes,
  Clock3,
  CreditCard,
  DollarSign,
  Layers3,
  Lightbulb,
  Package,
  Radio,
  ShieldAlert,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  StarHalf,
  Timer,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import { fetchDashboardStats } from "@/store/order-slice";
import { fetchAllRecommendations } from "@/store/recommendationsSlice";
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
  pending: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  pending_payment: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  verification_pending: "bg-orange-500/10 text-orange-300 border-orange-500/20",
  confirmed: "bg-sky-500/10 text-sky-300 border-sky-500/20",
  shipped: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
  delivered: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  cancelled: "bg-rose-500/10 text-rose-300 border-rose-500/20",
};

const paymentToneMap = {
  manual: "from-amber-500/20 to-orange-500/10",
  cash: "from-emerald-500/20 to-lime-500/10",
  payhere: "from-sky-500/20 to-cyan-500/10",
  gpay: "from-blue-500/20 to-indigo-500/10",
  card: "from-fuchsia-500/20 to-violet-500/10",
  lankapay: "from-teal-500/20 to-emerald-500/10",
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
  return { phase: "Live", remaining: null };
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
    title: "Orders desk",
    description: "Approve manual payments and move fulfilment forward.",
    to: "/admin/order",
    icon: ShoppingCart,
    permission: "orders",
  },
  {
    title: "Manual payments",
    description: "Review bank-transfer proofs and verify payments.",
    to: "/admin/payments/pending",
    icon: Wallet,
    permission: "verifyPayments",
  },
  {
    title: "Product catalog",
    description: "Update stock, pricing, and limited-release products.",
    to: "/admin/product",
    icon: Package,
    permission: "products",
  },
  {
    title: "Drop registry",
    description: "Manage live collections and prepare the next release.",
    to: "/admin/drop",
    icon: Layers3,
    permission: "drops",
  },
  {
    title: "Notifications",
    description: "Broadcast launch updates and customer alerts.",
    to: "/admin/notifications",
    icon: Sparkles,
    permission: "notifications",
  },
];

const MetricCard = ({ label, hint, icon, tone = "text-[#D4AF37]", numericValue, formatter, displayValue }) => {
  const Icon = icon;

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -3, borderColor: "rgba(212,175,55,0.4)" }}
      transition={{ duration: 0.2 }}
      className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-gray-500">{label}</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-white">
            {numericValue != null && formatter ? (
              <AnimatedNumber value={numericValue} formatter={formatter} />
            ) : (
              displayValue
            )}
          </p>
          <p className="mt-2 text-sm text-gray-400">{hint}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
          <Icon className={`h-6 w-6 ${tone}`} />
        </div>
      </div>
    </motion.div>
  );
};

const HighlightCard = ({ eyebrow, title, value, meta, accent = "text-[#D4AF37]" }) => (
  <motion.div
    whileHover={{ y: -3, borderColor: "rgba(212,175,55,0.4)" }}
    transition={{ duration: 0.2 }}
    className="rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.16),transparent_45%),rgba(255,255,255,0.03)] p-6"
  >
    <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500">{eyebrow}</p>
    <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
    <p className={`mt-3 text-2xl font-black tracking-tight ${accent}`}>{value}</p>
    <p className="mt-3 text-sm leading-6 text-gray-400">{meta}</p>
  </motion.div>
);

const Dashboard = () => {
  const dispatch = useDispatch();
  const { dashboardStats, isLoading, orderError } = useSelector((state) => state.order);
  const { user } = useSelector((state) => state.auth);

  const isSuperAdmin = user?.role === "super_admin" || user?.role === "superadmin";
  const userPerms = user?.permissions || {};

  const [activeDrop, setActiveDrop] = useState(null);
  const [feedEvents, setFeedEvents] = useState([]);
  const [recHighlights, setRecHighlights] = useState([]);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  // 1Hz tick for the drop countdown
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
        (d) =>
          d.isPublished &&
          !d.isArchived &&
          (!d.releaseDate || new Date(d.releaseDate).getTime() <= ts) &&
          (!d.endDate || new Date(d.endDate).getTime() > ts)
      );
      const upcoming = drops
        .filter(
          (d) =>
            d.isPublished &&
            !d.isArchived &&
            d.releaseDate &&
            new Date(d.releaseDate).getTime() > ts
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

  useEffect(() => {
    let cancelled = false;
    dispatch(fetchAllRecommendations())
      .unwrap()
      .then((byType) => {
        if (cancelled) return;
        const flat = [];
        Object.entries(byType || {}).forEach(([type, rec]) => {
          const items = rec?.recommendations || rec?.items || [];
          items.slice(0, 2).forEach((item, idx) => {
            flat.push({
              type,
              id: `${type}-${idx}-${item.id || item._id || idx}`,
              title: item.title || item.name || item.heading || "Insight",
              text:
                item.summary ||
                item.description ||
                item.recommendation ||
                item.text ||
                "",
            });
          });
        });
        setRecHighlights(flat.slice(0, 5));
      })
      .catch(() => {
        if (!cancelled) setRecHighlights([]);
      });
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  const pushFeed = useCallback((entry) => {
    setFeedEvents((prev) =>
      [{ ...entry, at: new Date(), id: `${Date.now()}-${Math.random()}` }, ...prev].slice(0, 12)
    );
  }, []);

  const refreshDashboard = useCallback(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  useSocketEvent("order:refresh", () => {
    refreshDashboard();
    pushFeed({ icon: "🛒", text: "New order activity", tone: "text-emerald-300" });
  });
  useSocketEvent("payment:new_pending", () => {
    refreshDashboard();
    pushFeed({ icon: "💳", text: "Payment proof submitted for verification", tone: "text-amber-300" });
  });
  useSocketEvent("payment:refresh", () => {
    refreshDashboard();
  });
  useSocketEvent("review:refresh", () => {
    pushFeed({ icon: "⭐", text: "Review activity", tone: "text-rose-300" });
  });
  useSocketEvent("admin:refresh", () => {
    refreshDashboard();
  });
  useSocketEvent("drop:updated", () => {
    fetchActiveDrop();
    pushFeed({ icon: "🎁", text: "Drop catalog updated", tone: "text-[#f2ca50]" });
  });

  const overview = dashboardStats?.overview || {};
  const highlights = dashboardStats?.highlights || {};
  const salesTrend = dashboardStats?.salesTrend || [];
  const topProducts = dashboardStats?.topProducts || [];
  const topDrops = dashboardStats?.topDrops || [];
  const inventoryAlerts = dashboardStats?.inventoryAlerts || [];
  const recentOrders = dashboardStats?.recentOrders || [];
  const paymentMethodBreakdown = dashboardStats?.paymentMethodBreakdown || [];
  const orderStatusBreakdown = dashboardStats?.orderStatusBreakdown || {};

  const liveKpis = useMemo(
    () => [
      {
        label: "Revenue",
        value: Number(overview.totalRevenue) || 0,
        formatter: (v) => currencyFormatter.format(Math.round(v)),
        hint: "Lifetime",
      },
      {
        label: "Active Orders",
        value: Number(overview.activeOrders) || 0,
        formatter: formatNumber,
        hint: `${formatNumber(overview.pendingVerification)} to verify`,
      },
      {
        label: "Pending Payments",
        value: Number(overview.pendingPayments) || 0,
        formatter: formatNumber,
        hint: "Manual queue",
      },
      {
        label: "Low Stock",
        value: Number(overview.lowStockProducts) || 0,
        formatter: formatNumber,
        hint: "Below threshold",
      },
      {
        label: "Live Drops",
        value: Number(overview.liveDrops) || 0,
        formatter: formatNumber,
        hint: activeDrop?.name || "—",
      },
      {
        label: "Reviews Queue",
        value: Number(overview.uncategorizedReviews) || 0,
        formatter: formatNumber,
        hint: "Uncategorized",
      },
      {
        label: "Aging Stock",
        value: Number(overview.agingProductsCount) || 0,
        formatter: formatNumber,
        hint: "90+ days",
      },
    ],
    [overview, activeDrop]
  );

  const dropCd = dropCountdown(activeDrop, nowMs);

  // Filter quick links based on user permissions (super admins see everything)
  const visibleQuickLinks = isSuperAdmin
    ? quickLinks
    : quickLinks.filter((item) => !item.permission || userPerms[item.permission]);

  const maxRevenue = Math.max(...salesTrend.map((entry) => entry.revenue || 0), 1);

  const primaryMetrics = [
    {
      label: "Revenue",
      numericValue: Number(overview.totalRevenue) || 0,
      formatter: (v) => currencyFormatter.format(Math.round(v)),
      hint: `${formatCurrency(overview.averageOrderValue)} average order value`,
      icon: DollarSign,
      tone: "text-[#D4AF37]",
    },
    {
      label: "Active Orders",
      numericValue: Number(overview.activeOrders) || 0,
      formatter: (v) => numberFormatter.format(Math.round(v)),
      hint: `${formatNumber(overview.pendingVerification)} waiting for admin verification`,
      icon: ShoppingBag,
      tone: "text-sky-400",
    },
    {
      label: "Customers",
      numericValue: Number(overview.totalCustomers) || 0,
      formatter: (v) => numberFormatter.format(Math.round(v)),
      hint: `${formatNumber(overview.totalOrders)} total orders placed`,
      icon: Users,
      tone: "text-violet-400",
    },
    {
      label: "Products",
      numericValue: Number(overview.totalProducts) || 0,
      formatter: (v) => numberFormatter.format(Math.round(v)),
      hint: `${formatNumber(overview.totalSoldUnits)} units sold across all drops`,
      icon: Package,
      tone: "text-emerald-400",
    },
    {
      label: "Live Drops",
      numericValue: Number(overview.liveDrops) || 0,
      formatter: (v) => numberFormatter.format(Math.round(v)),
      hint: `${formatNumber(overview.archivedDrops)} archived releases in the ledger`,
      icon: Layers3,
      tone: "text-pink-400",
    },
    {
      label: "Low Stock",
      numericValue: Number(overview.lowStockProducts) || 0,
      formatter: (v) => numberFormatter.format(Math.round(v)),
      hint: `${formatNumber(overview.stockOnHand)} units currently on hand`,
      icon: ShieldAlert,
      tone: "text-amber-400",
    },
    {
      label: "Avg Order Value",
      numericValue: Number(overview.averageOrderValue) || 0,
      formatter: (v) => currencyFormatter.format(Math.round(v)),
      hint: `${formatNumber(overview.totalOrders)} non-cancelled orders`,
      icon: Wallet,
      tone: "text-[#f2ca50]",
    },
    {
      label: "Pending Payments",
      numericValue: Number(overview.pendingPayments) || 0,
      formatter: (v) => numberFormatter.format(Math.round(v)),
      hint: `${formatNumber(overview.pendingVerification)} orders awaiting verification`,
      icon: CreditCard,
      tone: "text-orange-400",
    },
    {
      label: "Uncategorized Reviews",
      numericValue: Number(overview.uncategorizedReviews) || 0,
      formatter: (v) => numberFormatter.format(Math.round(v)),
      hint: "Tag a topic to surface them",
      icon: StarHalf,
      tone: "text-rose-300",
    },
  ];

  const agingCount = Number(overview.agingProductsCount) || 0;

  const statusCards = [
    { key: "pending", icon: Clock3 },
    { key: "pending_payment", icon: Wallet },
    { key: "verification_pending", icon: Wallet },
    { key: "confirmed", icon: Sparkles },
    { key: "shipped", icon: Truck },
    { key: "delivered", icon: ShoppingCart },
    { key: "cancelled", icon: ShieldAlert },
  ];

  return (
    <AdminPage
      eyebrow="Admin Overview"
      title="Command center"
      description="Track sales, orders, customers, products, and drop performance in one place."
    >
      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        className="w-full"
      >
        {/* OPERATIONS CONTROL ROOM — live KPI strip + feed + drop status + AI insights */}
        <section className="mb-6 space-y-4">
          <div className="rounded-[28px] border border-[#f2ca50]/20 bg-[#0a0a0a] p-5 shadow-[0_0_60px_rgba(242,202,80,0.06)]">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Radio className="h-3.5 w-3.5 text-[#f2ca50]" />
                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#f2ca50]">
                  Live Operations Strip
                </p>
              </div>
              <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.28em] text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4 xl:grid-cols-7">
              {liveKpis.map((kpi) => (
                <div key={kpi.label} className="border-l border-[#2a2a2a] pl-3">
                  <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#99907c]">
                    {kpi.label}
                  </p>
                  <p className="mt-1 font-mono text-2xl font-bold leading-none text-white tabular-nums">
                    <AnimatedNumber value={kpi.value} formatter={kpi.formatter} />
                  </p>
                  {kpi.hint ? (
                    <p className="mt-1 truncate text-[10px] text-gray-500">{kpi.hint}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Live Order Feed */}
            <div className="rounded-[24px] border border-[#2a2a2a] bg-[#131313] p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#99907c]">
                    Live Order Feed
                  </p>
                </div>
                <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-gray-500">
                  {feedEvents.length} live
                </span>
              </div>
              <div className="custom-scrollbar max-h-[240px] min-h-[180px] space-y-2 overflow-y-auto pr-1">
                {feedEvents.length === 0 ? (
                  <div className="flex h-[180px] items-center justify-center text-center text-xs text-gray-500">
                    Waiting for live activity…
                  </div>
                ) : (
                  feedEvents.map((event) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-start gap-3 rounded-lg border border-[#2a2a2a] bg-black/40 px-3 py-2"
                    >
                      <span className="mt-0.5 text-base leading-none">{event.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-medium ${event.tone || "text-gray-200"}`}>
                          {event.text}
                        </p>
                        <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-gray-500">
                          {timeAgo(event.at)}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Drop Status Panel */}
            <div className="rounded-[24px] border border-[#f2ca50]/20 bg-gradient-to-br from-[#1a1408] to-[#0a0a0a] p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-[#f2ca50]" />
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#f2ca50]">
                    Drop Status
                  </p>
                </div>
                <Link
                  to="/admin/drop"
                  className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#99907c] transition hover:text-[#f2ca50]"
                >
                  Manage
                </Link>
              </div>
              {!activeDrop ? (
                <div className="flex h-[180px] flex-col items-center justify-center text-center">
                  <Layers3 className="mb-2 h-8 w-8 text-gray-600" />
                  <p className="text-sm text-gray-400">No active drop</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Schedule a release to see it here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="truncate text-xl font-bold text-white">{activeDrop.name}</p>
                    <p className="mt-1 line-clamp-1 text-xs text-gray-500">
                      {activeDrop.description ? activeDrop.description : "Limited release"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#f2ca50]/20 bg-black/40 p-3">
                    <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-[#f2ca50]">
                      {dropCd?.phase || "Live"}
                    </p>
                    <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-white">
                      {formatDuration(dropCd?.remaining)}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg border border-[#2a2a2a] bg-black/30 p-2">
                      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-gray-500">
                        Release
                      </p>
                      <p className="mt-1 truncate text-gray-300">
                        {formatDate(activeDrop.releaseDate)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-[#2a2a2a] bg-black/30 p-2">
                      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-gray-500">
                        Ends
                      </p>
                      <p className="mt-1 truncate text-gray-300">
                        {activeDrop.endDate ? formatDate(activeDrop.endDate) : "Open"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* AI Insights Panel */}
            <div className="rounded-[24px] border border-[#2a2a2a] bg-[#131313] p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-violet-400" />
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#99907c]">
                    AI Insights
                  </p>
                </div>
                <Link
                  to="/admin/recommendations"
                  className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#99907c] transition hover:text-violet-300"
                >
                  See all
                </Link>
              </div>
              {recHighlights.length === 0 ? (
                <div className="flex h-[180px] flex-col items-center justify-center text-center">
                  <Sparkles className="mb-2 h-8 w-8 text-gray-600" />
                  <p className="text-sm text-gray-400">No insights yet</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Recommendations will appear after the next sync.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recHighlights.map((item) => (
                    <Link
                      key={item.id}
                      to="/admin/recommendations"
                      className="block rounded-lg border border-[#2a2a2a] bg-black/40 p-3 transition hover:border-violet-400/40 hover:bg-black/60"
                    >
                      <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-violet-300">
                        {item.type}
                      </p>
                      <p className="mt-1 line-clamp-1 text-sm font-medium text-white">
                        {item.title}
                      </p>
                      {item.text ? (
                        <p className="mt-1 line-clamp-2 text-xs text-gray-500">{item.text}</p>
                      ) : null}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[36px] border border-white/10 bg-[linear-gradient(135deg,rgba(212,175,55,0.14),rgba(255,255,255,0.02)_28%,rgba(255,255,255,0.04)_100%)] p-6 shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-8">
          <div className="grid gap-8 xl:grid-cols-[1.25fr_0.95fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-2 text-[11px] uppercase tracking-[0.32em] text-[#D4AF37]">
                <Sparkles className="h-3.5 w-3.5" />
                Saga Elite Command Center
              </div>
              <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl">
                Modern admin visibility for products, drops, orders, and launch momentum.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-300 sm:text-base">
                Track the most sold product and its drop, watch manual-payment workload, spot low-stock risks, and keep every limited release moving with real Saga Elite data.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <div className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-gray-300">
                  Today: <span className="font-semibold text-white">{formatDate(new Date())}</span>
                </div>
                <div className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-gray-300">
                  Delivered revenue: <span className="font-semibold text-white">{formatCurrency(overview.completedRevenue)}</span>
                </div>
                <div className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-gray-300">
                  Wishlist adds: <span className="font-semibold text-white">{formatNumber(overview.totalWishlistAdds)}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {visibleQuickLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.title}
                    to={item.to}
                    className="group block rounded-[28px] border border-white/10 bg-black/30 p-5 transition duration-200 hover:border-[#D4AF37]/40 hover:bg-black/40"
                  >
                    <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                          <Icon className="h-5 w-5 text-[#D4AF37]" />
                        </div>
                        <motion.span whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                          <ArrowRight className="h-5 w-5 text-gray-500 transition group-hover:text-white" />
                        </motion.span>
                      </div>
                      <h2 className="mt-8 text-lg font-semibold text-white">{item.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-gray-400">{item.description}</p>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {orderError ? (
          <div className="mt-6 rounded-[24px] border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
            Dashboard data could not be loaded completely: {orderError}
          </div>
        ) : null}

        {agingCount > 0 ? (
          <motion.section
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6 rounded-[24px] border border-[#ffb4ab]/30 bg-[#ffb4ab]/5 p-5"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-[#ffb4ab]" />
                <div>
                  <p className="font-sans text-[10px] uppercase tracking-[0.26em] text-[#ffb4ab]">
                    Aging Stock Alert — {formatNumber(agingCount)} product
                    {agingCount === 1 ? "" : "s"} need attention
                  </p>
                  <p className="mt-2 max-w-xl text-sm text-[#d0c5af]">
                    These products have been unsold for 90+ days. Consider
                    applying an offer to move them.
                  </p>
                </div>
              </div>
              <Link
                to="/admin/offers"
                className="inline-flex items-center gap-2 self-start rounded-full bg-[#f2ca50] px-4 py-2 font-sans text-[10px] uppercase tracking-[0.26em] text-[#0a0a0a] transition hover:bg-[#f2ca50]/90 md:self-auto"
              >
                Review in offers panel
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </motion.section>
        ) : null}

        <motion.section
          className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {primaryMetrics.map((item) => (
            <MetricCard
              key={item.label}
              label={item.label}
              numericValue={item.numericValue}
              formatter={item.formatter}
              hint={item.hint}
              icon={item.icon}
              tone={item.tone}
            />
          ))}
        </motion.section>

        <section className="mt-6 grid gap-4 xl:grid-cols-4">
          <HighlightCard
            eyebrow="Most Sold Product"
            title={highlights.bestSellingProduct?.name || "No sales yet"}
            value={
              highlights.bestSellingProduct
                ? `${formatNumber(highlights.bestSellingProduct.soldCount)} units`
                : "Waiting for orders"
            }
            meta={
              highlights.bestSellingProduct
                ? `Drop: ${highlights.bestSellingProduct.drop?.name || "Independent Release"} | Art No: ${highlights.bestSellingProduct.artNo} | Stock left: ${formatNumber(highlights.bestSellingProduct.totalStock)}`
                : "Once orders start coming in, the top-selling product will appear here with its release context."
            }
          />
          <HighlightCard
            eyebrow="Top Drop"
            title={highlights.topDrop?.name || "No drop data yet"}
            value={highlights.topDrop ? `${formatNumber(highlights.topDrop.soldUnits)} units sold` : "No movement yet"}
            meta={
              highlights.topDrop
                ? `${formatNumber(highlights.topDrop.productCount)} products in this release | ${formatNumber(highlights.topDrop.stockOnHand)} units still in stock`
                : "Top drop performance will be ranked using product sales across the collection."
            }
            accent="text-sky-300"
          />
          <HighlightCard
            eyebrow="Most Wished"
            title={highlights.mostWishedProduct?.name || "No wishlist leader yet"}
            value={
              highlights.mostWishedProduct
                ? `${formatNumber(highlights.mostWishedProduct.wishCount)} wishlists`
                : "No wishlist activity"
            }
            meta={
              highlights.mostWishedProduct
                ? `Drop: ${highlights.mostWishedProduct.drop?.name || "Independent Release"} | Sold: ${formatNumber(highlights.mostWishedProduct.soldCount)} | Stock left: ${formatNumber(highlights.mostWishedProduct.totalStock)}`
                : "This helps you compare audience demand against actual sell-through."
            }
            accent="text-rose-300"
          />
          <HighlightCard
            eyebrow="Next Drop"
            title={highlights.nextScheduledDrop?.name || "No upcoming drop"}
            value={
              highlights.nextScheduledDrop
                ? `${highlights.nextScheduledDrop.daysUntilRelease} day${highlights.nextScheduledDrop.daysUntilRelease === 1 ? "" : "s"}`
                : "Schedule pending"
            }
            meta={
              highlights.nextScheduledDrop
                ? `Release date: ${formatDate(highlights.nextScheduledDrop.releaseDate)} | ${formatNumber(highlights.nextScheduledDrop.productCount)} active products prepared`
                : "Create or publish the next drop to monitor launch readiness here."
            }
            accent="text-emerald-300"
          />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
          <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-gray-500">Revenue Pulse</p>
                <h2 className="mt-2 text-2xl font-bold text-white">Last 6 months</h2>
              </div>
              <div className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs uppercase tracking-[0.22em] text-gray-400">
                Drop-led commerce
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-6">
              {salesTrend.map((entry, barIdx) => (
                <div key={entry.monthKey} className="flex flex-col items-center gap-3">
                  <div className="flex h-56 w-full items-end rounded-[24px] border border-white/10 bg-black/30 p-3">
                    <motion.div
                      className="w-full origin-bottom rounded-[18px] bg-[linear-gradient(180deg,rgba(212,175,55,0.95),rgba(212,175,55,0.18))] shadow-[0_0_40px_rgba(212,175,55,0.22)]"
                      style={{
                        height: `${Math.max(14, Math.round((entry.revenue / maxRevenue) * 100))}%`,
                        transformOrigin: "bottom",
                      }}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.4, delay: barIdx * 0.06, ease: "easeOut" }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{entry.label}</p>
                    <p className="mt-2 text-sm font-semibold text-white">{formatCurrency(entry.revenue)}</p>
                    <p className="text-xs text-gray-500">{formatNumber(entry.orders)} orders</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6">
            <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
              <p className="text-[11px] uppercase tracking-[0.28em] text-gray-500">Order Pipeline</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {statusCards.map((item) => {
                  const Icon = item.icon;
                  const total = orderStatusBreakdown[item.key] || 0;
                  return (
                    <div
                      key={item.key}
                      className={`rounded-[24px] border px-4 py-4 ${statusToneMap[item.key] || "border-white/10 bg-white/5 text-white"}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.22em] opacity-80">{formatLabel(item.key)}</p>
                          <p className="mt-2 text-2xl font-black tracking-tight">{formatNumber(total)}</p>
                        </div>
                        <Icon className="h-5 w-5 opacity-80" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
              <p className="text-[11px] uppercase tracking-[0.28em] text-gray-500">Hybrid Payment Mix</p>
              <div className="mt-5 space-y-3">
                {paymentMethodBreakdown.length === 0 ? (
                  <div className="rounded-[22px] border border-white/10 bg-black/30 px-4 py-5 text-sm text-gray-400">
                    Payment analytics will appear here after the first order.
                  </div>
                ) : (
                  paymentMethodBreakdown.map((item) => (
                    <div
                      key={item.method}
                      className={`rounded-[22px] border border-white/10 bg-gradient-to-r ${paymentToneMap[item.method] || "from-white/10 to-white/[0.02]"} px-4 py-4`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.22em] text-gray-300">{formatLabel(item.method)}</p>
                          <p className="mt-2 text-lg font-semibold text-white">{formatNumber(item.count)} orders</p>
                        </div>
                        <p className="text-sm font-semibold text-white">{formatCurrency(item.revenue)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-2">
          <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-gray-500">Product Leaders</p>
                <h2 className="mt-2 text-2xl font-bold text-white">Best-selling products</h2>
              </div>
              <motion.span whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.02 }} className="inline-block">
                <Link to="/admin/product" className="text-sm font-semibold text-[#D4AF37] transition hover:text-white">
                  Manage products
                </Link>
              </motion.span>
            </div>

            <div className="mt-6 space-y-3">
              {topProducts.length === 0 ? (
                <div className="rounded-[24px] border border-white/10 bg-black/30 px-5 py-6 text-sm text-gray-400">
                  No product sales data recorded yet.
                </div>
              ) : (
                topProducts.map((product, index) => (
                  <div key={product._id || product.slug || product.artNo} className="rounded-[24px] border border-white/10 bg-black/30 px-5 py-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-sm font-black text-[#D4AF37]">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-white">{product.name}</p>
                          <p className="mt-1 text-sm text-gray-400">
                            {product.dropName} | {product.artNo}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-sm sm:min-w-[320px]">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
                          <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Sold</p>
                          <p className="mt-2 font-semibold text-white">{formatNumber(product.soldCount)}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
                          <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Stock</p>
                          <p className="mt-2 font-semibold text-white">{formatNumber(product.totalStock)}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
                          <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Wishes</p>
                          <p className="mt-2 font-semibold text-white">{formatNumber(product.wishCount)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-gray-500">Drop Leaders</p>
                <h2 className="mt-2 text-2xl font-bold text-white">Top-performing drops</h2>
              </div>
              <Link to="/admin/drop" className="text-sm font-semibold text-[#D4AF37] transition hover:text-white">
                Open drops
              </Link>
            </div>

            <div className="mt-6 space-y-3">
              {topDrops.length === 0 ? (
                <div className="rounded-[24px] border border-white/10 bg-black/30 px-5 py-6 text-sm text-gray-400">
                  Drop performance will populate after products begin selling.
                </div>
              ) : (
                topDrops.map((drop, index) => (
                  <div key={drop.dropId || drop.slug || `${drop.name}-${index}`} className="rounded-[24px] border border-white/10 bg-black/30 px-5 py-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10 text-sm font-black text-sky-300">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-white">{drop.name}</p>
                          <p className="mt-1 text-sm text-gray-400">
                            Release {formatDate(drop.releaseDate)}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-sm sm:min-w-[320px]">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
                          <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Sold</p>
                          <p className="mt-2 font-semibold text-white">{formatNumber(drop.soldUnits)}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
                          <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Products</p>
                          <p className="mt-2 font-semibold text-white">{formatNumber(drop.productCount)}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
                          <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Stock</p>
                          <p className="mt-2 font-semibold text-white">{formatNumber(drop.stockOnHand)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-gray-500">Recent Orders</p>
                <h2 className="mt-2 text-2xl font-bold text-white">Latest customer activity</h2>
              </div>
              <Link to="/admin/order" className="text-sm font-semibold text-[#D4AF37] transition hover:text-white">
                Open orders
              </Link>
            </div>

            <div className="mt-6 space-y-3">
              {recentOrders.length === 0 ? (
                <div className="rounded-[24px] border border-white/10 bg-black/30 px-5 py-6 text-sm text-gray-400">
                  Orders will appear here after checkout activity starts.
                </div>
              ) : (
                recentOrders.map((order) => (
                  <div key={order._id} className="rounded-[24px] border border-white/10 bg-black/30 px-5 py-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">{order.customerEmail}</p>
                        <p className="mt-1 break-all text-xs text-gray-500">{order._id}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] ${statusToneMap[order.status] || "border-white/10 bg-white/10 text-white"}`}>
                          {formatLabel(order.status)}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.2em] text-gray-300">
                          {formatLabel(order.paymentMethod)}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.2em] text-gray-300">
                          {order.itemCount} items
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                      <p className="text-sm text-gray-400">{formatDate(order.createdAt)}</p>
                      <p className="text-lg font-bold text-white">{formatCurrency(order.totalAmount)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-gray-500">Inventory Watch</p>
                <h2 className="mt-2 text-2xl font-bold text-white">Low-stock product alerts</h2>
              </div>
              <Boxes className="h-6 w-6 text-[#D4AF37]" />
            </div>

            <div className="mt-6 space-y-3">
              {inventoryAlerts.length === 0 ? (
                <div className="rounded-[24px] border border-white/10 bg-black/30 px-5 py-6 text-sm text-gray-400">
                  No low-stock products right now. Inventory levels look healthy.
                </div>
              ) : (
                inventoryAlerts.map((product) => (
                  <div key={product._id || product.slug || product.artNo} className="rounded-[24px] border border-white/10 bg-black/30 px-5 py-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-base font-semibold text-white">{product.name}</p>
                        <p className="mt-1 text-sm text-gray-400">
                          {product.dropName} | {product.artNo}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-center">
                          <p className="text-[10px] uppercase tracking-[0.22em] text-amber-200">Stock</p>
                          <p className="mt-2 text-lg font-semibold text-white">{formatNumber(product.totalStock)}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center">
                          <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Sold</p>
                          <p className="mt-2 text-lg font-semibold text-white">{formatNumber(product.soldCount)}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center">
                          <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Wishes</p>
                          <p className="mt-2 text-lg font-semibold text-white">{formatNumber(product.wishCount)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {isLoading && !dashboardStats ? (
          <div className="mt-6">
            <SkeletonGrid count={6} />
          </div>
        ) : null}
      </motion.div>
    </AdminPage>
  );
};

export default Dashboard;
