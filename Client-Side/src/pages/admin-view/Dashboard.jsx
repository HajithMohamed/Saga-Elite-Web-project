import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowRight,
  Boxes,
  Clock3,
  DollarSign,
  Layers3,
  Package,
  ShieldAlert,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import { fetchDashboardStats } from "@/store/order-slice";

const currencyFormatter = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-LK");

const statusToneMap = {
  pending: "bg-amber-500/10 text-amber-300 border-amber-500/20",
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

const quickLinks = [
  {
    title: "Orders desk",
    description: "Approve manual payments and move fulfilment forward.",
    to: "/admin/order",
    icon: ShoppingCart,
  },
  {
    title: "Product catalog",
    description: "Update stock, pricing, and limited-release products.",
    to: "/admin/product",
    icon: Package,
  },
  {
    title: "Drop registry",
    description: "Manage live collections and prepare the next release.",
    to: "/admin/drop",
    icon: Layers3,
  },
  {
    title: "Notifications",
    description: "Broadcast launch updates and customer alerts.",
    to: "/admin/notifications",
    icon: Sparkles,
  },
];

const MetricCard = ({ label, value, hint, icon, tone = "text-[#D4AF37]" }) => {
  const Icon = icon;

  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-gray-500">{label}</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-white">{value}</p>
          <p className="mt-2 text-sm text-gray-400">{hint}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
          <Icon className={`h-6 w-6 ${tone}`} />
        </div>
      </div>
    </div>
  );
};

const HighlightCard = ({ eyebrow, title, value, meta, accent = "text-[#D4AF37]" }) => (
  <div className="rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.16),transparent_45%),rgba(255,255,255,0.03)] p-6">
    <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500">{eyebrow}</p>
    <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
    <p className={`mt-3 text-2xl font-black tracking-tight ${accent}`}>{value}</p>
    <p className="mt-3 text-sm leading-6 text-gray-400">{meta}</p>
  </div>
);

const Dashboard = () => {
  const dispatch = useDispatch();
  const { dashboardStats, isLoading, orderError } = useSelector((state) => state.order);

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  const overview = dashboardStats?.overview || {};
  const highlights = dashboardStats?.highlights || {};
  const salesTrend = dashboardStats?.salesTrend || [];
  const topProducts = dashboardStats?.topProducts || [];
  const topDrops = dashboardStats?.topDrops || [];
  const inventoryAlerts = dashboardStats?.inventoryAlerts || [];
  const recentOrders = dashboardStats?.recentOrders || [];
  const paymentMethodBreakdown = dashboardStats?.paymentMethodBreakdown || [];
  const orderStatusBreakdown = dashboardStats?.orderStatusBreakdown || {};

  const maxRevenue = Math.max(...salesTrend.map((entry) => entry.revenue || 0), 1);

  const primaryMetrics = [
    {
      label: "Revenue",
      value: formatCurrency(overview.totalRevenue),
      hint: `${formatCurrency(overview.averageOrderValue)} average order value`,
      icon: DollarSign,
      tone: "text-[#D4AF37]",
    },
    {
      label: "Active Orders",
      value: formatNumber(overview.activeOrders),
      hint: `${formatNumber(overview.pendingVerification)} waiting for admin verification`,
      icon: ShoppingBag,
      tone: "text-sky-400",
    },
    {
      label: "Customers",
      value: formatNumber(overview.totalCustomers),
      hint: `${formatNumber(overview.totalOrders)} total orders placed`,
      icon: Users,
      tone: "text-violet-400",
    },
    {
      label: "Products",
      value: formatNumber(overview.totalProducts),
      hint: `${formatNumber(overview.totalSoldUnits)} units sold across all drops`,
      icon: Package,
      tone: "text-emerald-400",
    },
    {
      label: "Live Drops",
      value: formatNumber(overview.liveDrops),
      hint: `${formatNumber(overview.archivedDrops)} archived releases in the ledger`,
      icon: Layers3,
      tone: "text-pink-400",
    },
    {
      label: "Low Stock",
      value: formatNumber(overview.lowStockProducts),
      hint: `${formatNumber(overview.stockOnHand)} units currently on hand`,
      icon: ShieldAlert,
      tone: "text-amber-400",
    },
  ];

  const statusCards = [
    { key: "pending", icon: Clock3 },
    { key: "verification_pending", icon: Wallet },
    { key: "confirmed", icon: Sparkles },
    { key: "shipped", icon: Truck },
    { key: "delivered", icon: ShoppingCart },
    { key: "cancelled", icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-10">
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
              {quickLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.title}
                    to={item.to}
                    className="group rounded-[28px] border border-white/10 bg-black/30 p-5 transition duration-200 hover:border-[#D4AF37]/40 hover:bg-black/40"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                        <Icon className="h-5 w-5 text-[#D4AF37]" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-500 transition group-hover:translate-x-1 group-hover:text-white" />
                    </div>
                    <h2 className="mt-8 text-lg font-semibold text-white">{item.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-gray-400">{item.description}</p>
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

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {primaryMetrics.map((item) => (
            <MetricCard
              key={item.label}
              label={item.label}
              value={item.value}
              hint={item.hint}
              icon={item.icon}
              tone={item.tone}
            />
          ))}
        </section>

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
              {salesTrend.map((entry) => (
                <div key={entry.monthKey} className="flex flex-col items-center gap-3">
                  <div className="flex h-56 w-full items-end rounded-[24px] border border-white/10 bg-black/30 p-3">
                    <div
                      className="w-full rounded-[18px] bg-[linear-gradient(180deg,rgba(212,175,55,0.95),rgba(212,175,55,0.18))] shadow-[0_0_40px_rgba(212,175,55,0.22)]"
                      style={{
                        height: `${Math.max(14, Math.round((entry.revenue / maxRevenue) * 100))}%`,
                      }}
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
              <Link to="/admin/product" className="text-sm font-semibold text-[#D4AF37] transition hover:text-white">
                Manage products
              </Link>
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
          <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-gray-400">
            Loading dashboard analytics...
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Dashboard;
