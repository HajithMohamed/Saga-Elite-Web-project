import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  Loader2,
  Download,
  TrendingUp,
  Package,
  Layers3,
  Users,
  Star,
  AlertTriangle,
  Shirt,
  Heart,
  Skull,
  Zap,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { API_V1_URL as API_BASE } from "@/lib/api";
import { AdminPage } from "@/components/admin-components/AdminUI";

const TABS = [
  { key: "sales", label: "Sales", icon: TrendingUp },
  { key: "products", label: "Products", icon: Package },
  { key: "drops", label: "Drops", icon: Layers3 },
  { key: "customers", label: "Customers", icon: Users },
  { key: "fashion", label: "Fashion", icon: Shirt },
  { key: "reviews", label: "Sentiment", icon: Star },
];

// "Fashion" reuses the products endpoint but renders a streetwear-specific view.
// Mapped here so fetchTab can share cache with the Products tab.
const TAB_ENDPOINT_OVERRIDE = {
  fashion: "products",
};

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  });

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("en-LK");

// Compact axis labels for the revenue chart (e.g. 1.2M, 45K).
const compactCurrency = (value) => {
  const n = Number(value) || 0;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(Math.round(n));
};

const formatPercent = (value) =>
  `${(Number(value || 0) * 100).toFixed(1)}%`;

const formatShortDate = (raw) => {
  if (!raw) return "—";
  const d = new Date(raw);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-LK", { month: "short", day: "numeric" });
};

const isoDateInputValue = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const csvEscape = (value) => {
  if (value == null) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const downloadCsv = (filename, headers, rows) => {
  const csvLines = [headers.join(",")];
  rows.forEach((row) => {
    csvLines.push(headers.map((h) => csvEscape(row[h])).join(","));
  });
  const blob = new Blob([csvLines.join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const QUADRANT_META = {
  grail: {
    label: "Grail",
    hint: "High sales · positive sentiment",
    advice: "SCALE & RELAUNCH",
    accent: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  },
  flawed: {
    label: "Flawed",
    hint: "High sales · negative sentiment",
    advice: "SUSPEND & REDESIGN",
    accent: "border-danger-ink/40 bg-danger-ink/10 text-danger-ink",
  },
  hidden_gem: {
    label: "Hidden Gem",
    hint: "Low sales · positive sentiment",
    accent: "border-gold-ink/40 bg-gold/10 text-gold-ink",
    advice: "RE-MARKET",
  },
  deadstock: {
    label: "Deadstock",
    hint: "Low sales · negative sentiment",
    accent: "border-ink/10 bg-ink/5 text-ink/60",
    advice: "LIQUIDATE",
  },
};

const StatCard = ({ label, value, hint, tone = "text-gold-ink" }) => (
  <div className="border border-elevated bg-panel p-5">
    <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-muted">
      {label}
    </p>
    <p className={`mt-3 text-2xl font-bold ${tone}`}>{value}</p>
    {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
  </div>
);

/* --------------------------------------------------------------------- */
/* TAB COMPONENTS                                                         */
/* --------------------------------------------------------------------- */

const SalesTab = ({ data, range, onRangeChange }) => {
  if (!data) return null;
  const summary = data.summary || {};
  const daily = data.daily || [];
  const paymentMethods = data.paymentMethods || [];
  const revenueTrend = daily.map((d) => ({
    label: formatShortDate(d.date),
    revenue: Number(d.revenue) || 0,
    orders: Number(d.orders) || 0,
  }));

  return (
    <div className="space-y-6">
      <DateRangeControls range={range} onChange={onRangeChange} />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Revenue"
          value={formatCurrency(summary.totalRevenue)}
          hint={`AOV ${formatCurrency(summary.averageOrderValue)}`}
        />
        <StatCard
          label="Orders"
          value={formatNumber(summary.totalOrders)}
          hint={`${formatNumber(summary.cancelledOrders)} cancelled`}
          tone="text-ink-2"
        />
        <StatCard
          label="Delivered Revenue"
          value={formatCurrency(summary.deliveredRevenue)}
          tone="text-emerald-400"
        />
        <StatCard
          label="Refunded"
          value={formatCurrency(summary.totalRefunded)}
          hint={`Coupon -${formatCurrency(summary.couponDiscountTotal)}`}
          tone="text-danger-ink"
        />
      </div>

      <div className="border border-elevated bg-panel p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-mono text-xs uppercase tracking-[0.26em] text-gold-ink">
            Daily revenue
          </h3>
          <button
            type="button"
            onClick={() =>
              downloadCsv(
                `saga-sales-${isoDateInputValue(range.from)}_${isoDateInputValue(range.to)}.csv`,
                ["date", "revenue", "orders"],
                daily
              )
            }
            disabled={daily.length === 0}
            className="inline-flex items-center gap-2 border border-line px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-cream hover:border-gold-ink hover:text-gold-ink disabled:opacity-40"
          >
            <Download className="h-3 w-3" /> Export CSV
          </button>
        </div>
        {daily.length === 0 ? (
          <p className="py-8 text-center font-mono text-xs uppercase tracking-widest text-muted">
            No orders in this range.
          </p>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={revenueTrend}
                margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="salesRevFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#99907c", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#99907c", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                  tickFormatter={compactCurrency}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0a0a0a",
                    border: "1px solid #2a2a2a",
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#99907c" }}
                  formatter={(value, name) =>
                    name === "revenue"
                      ? [formatCurrency(value), "Revenue"]
                      : [formatNumber(value), "Orders"]
                  }
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#D4AF37"
                  strokeWidth={2}
                  fill="url(#salesRevFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="border border-elevated bg-panel p-6">
        <h3 className="mb-4 font-mono text-xs uppercase tracking-[0.26em] text-gold-ink">
          Payment methods
        </h3>
        {paymentMethods.length === 0 ? (
          <p className="text-xs text-muted">No payment data.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {paymentMethods.map((p) => (
              <div
                key={p.method}
                className="flex items-center justify-between border border-elevated bg-page px-4 py-3 text-sm"
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
                  {p.method.replace(/_/g, " ")}
                </span>
                <span className="text-right">
                  <span className="block font-bold text-ink-2">
                    {formatCurrency(p.revenue)}
                  </span>
                  <span className="text-[10px] text-muted">
                    {formatNumber(p.count)} orders
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ProductsTab = ({ data }) => {
  if (!data) return null;
  const products = data.products || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">
          Showing {products.length} of {data.total} active products, sorted by
          units sold.
        </p>
        <button
          type="button"
          onClick={() =>
            downloadCsv(
              "saga-products-analytics.csv",
              [
                "name",
                "artNo",
                "category",
                "views",
                "cartAdds",
                "wishCount",
                "sold",
                "stock",
                "conversionRate",
              ],
              products
            )
          }
          disabled={products.length === 0}
          className="inline-flex items-center gap-2 border border-line px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-cream hover:border-gold-ink hover:text-gold-ink disabled:opacity-40"
        >
          <Download className="h-3 w-3" /> Export CSV
        </button>
      </div>

      <div className="overflow-x-auto border border-elevated bg-panel">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-elevated bg-card font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3 text-right">Views</th>
              <th className="px-4 py-3 text-right">Cart adds</th>
              <th className="px-4 py-3 text-right">Wishlist</th>
              <th className="px-4 py-3 text-right">Sold</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3 text-right">Conv.</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center font-mono text-xs text-muted"
                >
                  No products to analyze.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr
                  key={p._id}
                  className="border-b border-elevated/40 hover:bg-card"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink-2">{p.name}</p>
                    <p className="font-mono text-[10px] text-muted">
                      {p.artNo} · {p.category}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right text-cream">
                    {formatNumber(p.views)}
                  </td>
                  <td className="px-4 py-3 text-right text-cream">
                    {formatNumber(p.cartAdds)}
                  </td>
                  <td className="px-4 py-3 text-right text-cream">
                    {formatNumber(p.wishCount)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gold-ink">
                    {formatNumber(p.sold)}
                  </td>
                  <td className="px-4 py-3 text-right text-cream">
                    {formatNumber(p.stock)}
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-400">
                    {formatPercent(p.conversionRate)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const DropsTab = ({ data }) => {
  const drops = useMemo(() => data?.drops || [], [data]);
  const quadrants = useMemo(() => {
    const groups = { grail: [], flawed: [], hidden_gem: [], deadstock: [] };
    drops.forEach((d) => {
      groups[d.quadrant || "deadstock"].push(d);
    });
    return groups;
  }, [drops]);

  if (!data) return null;

  const csvRows = drops.map((d) => ({
    name: d.name,
    productCount: d.productCount,
    soldUnits: d.soldUnits,
    revenueProxy: d.revenueProxy,
    stockOnHand: d.stockOnHand,
    sentimentPositive: d.sentiment?.positive || 0,
    sentimentNegative: d.sentiment?.negative || 0,
    avgRating: d.sentiment?.avgRating || 0,
    quadrant: d.quadrant,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">
          {drops.length} drops · median sales: {formatNumber(data.medianSales)} units
          (matrix split point)
        </p>
        <button
          type="button"
          onClick={() =>
            downloadCsv(
              "saga-drops-analytics.csv",
              Object.keys(csvRows[0] || { name: "" }),
              csvRows
            )
          }
          disabled={csvRows.length === 0}
          className="inline-flex items-center gap-2 border border-line px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-cream hover:border-gold-ink hover:text-gold-ink disabled:opacity-40"
        >
          <Download className="h-3 w-3" /> Export CSV
        </button>
      </div>

      {/* Decision Matrix */}
      <div className="border border-elevated bg-panel p-6">
        <h3 className="mb-4 font-mono text-xs uppercase tracking-[0.26em] text-gold-ink">
          Performance Decision Matrix
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {["grail", "flawed", "hidden_gem", "deadstock"].map((key) => {
            const meta = QUADRANT_META[key];
            const items = quadrants[key];
            return (
              <div
                key={key}
                className={`border ${meta.accent} bg-page p-4`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em]">
                      {meta.label}
                    </p>
                    <p className="text-[10px] text-muted">{meta.hint}</p>
                  </div>
                  <span className="rounded-full border border-current px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.22em]">
                    {meta.advice}
                  </span>
                </div>
                {items.length === 0 ? (
                  <p className="py-3 text-center font-mono text-[10px] uppercase tracking-widest text-muted">
                    No drops here.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {items.map((d) => (
                      <div
                        key={d.dropId}
                        className="flex items-center justify-between border border-elevated bg-panel px-3 py-2 text-xs"
                      >
                        <span className="truncate text-ink-2">{d.name}</span>
                        <span className="font-mono text-[10px] text-muted">
                          {formatNumber(d.soldUnits)} sold ·{" "}
                          {(d.sentiment.avgRating || 0).toFixed(1)}★
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed table */}
      <div className="overflow-x-auto border border-elevated bg-panel">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-elevated bg-card font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
            <tr>
              <th className="px-4 py-3">Drop</th>
              <th className="px-4 py-3 text-right">Products</th>
              <th className="px-4 py-3 text-right">Sold</th>
              <th className="px-4 py-3 text-right">Revenue</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3 text-right">★</th>
              <th className="px-4 py-3 text-right">+ / -</th>
            </tr>
          </thead>
          <tbody>
            {drops.map((d) => (
              <tr
                key={d.dropId}
                className="border-b border-elevated/40 hover:bg-card"
              >
                <td className="px-4 py-3 text-ink-2">{d.name}</td>
                <td className="px-4 py-3 text-right text-cream">
                  {formatNumber(d.productCount)}
                </td>
                <td className="px-4 py-3 text-right font-bold text-gold-ink">
                  {formatNumber(d.soldUnits)}
                </td>
                <td className="px-4 py-3 text-right text-cream">
                  {formatCurrency(d.revenueProxy)}
                </td>
                <td className="px-4 py-3 text-right text-cream">
                  {formatNumber(d.stockOnHand)}
                </td>
                <td className="px-4 py-3 text-right text-emerald-400">
                  {(d.sentiment.avgRating || 0).toFixed(1)}
                </td>
                <td className="px-4 py-3 text-right text-xs">
                  <span className="text-emerald-400">+{d.sentiment.positive}</span>
                  <span className="mx-1 text-muted">/</span>
                  <span className="text-danger-ink">-{d.sentiment.negative}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const CustomersTab = ({ data, range, onRangeChange }) => {
  if (!data) return null;
  const tiers = data.tiers || [];
  const topSpenders = data.topSpenders || [];
  const lifetime = data.lifetime || {};

  return (
    <div className="space-y-6">
      <DateRangeControls range={range} onChange={onRangeChange} />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Customers"
          value={formatNumber(lifetime.customers)}
          tone="text-ink-2"
        />
        <StatCard
          label="New in range"
          value={formatNumber(data.newCustomers)}
          tone="text-emerald-400"
        />
        <StatCard
          label="Lifetime spend"
          value={formatCurrency(lifetime.totalSpent)}
        />
        <StatCard
          label="Lifetime AOV"
          value={formatCurrency(lifetime.averageOrderValue)}
          hint={`${formatNumber(lifetime.totalOrders)} orders total`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="border border-elevated bg-panel p-6">
          <h3 className="mb-4 font-mono text-xs uppercase tracking-[0.26em] text-gold-ink">
            Membership tiers
          </h3>
          <div className="space-y-2">
            {tiers.length === 0 ? (
              <p className="text-xs text-muted">No customer data yet.</p>
            ) : (
              tiers.map((t) => (
                <div
                  key={t.tier}
                  className="flex items-center justify-between border border-elevated bg-page px-3 py-2 text-xs"
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-cream">
                    {t.tier}
                  </span>
                  <span className="text-right">
                    <span className="block font-bold text-ink-2">
                      {formatNumber(t.count)}
                    </span>
                    <span className="text-[10px] text-muted">
                      {formatCurrency(t.totalSpent)} spent
                    </span>
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="border border-elevated bg-panel p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-mono text-xs uppercase tracking-[0.26em] text-gold-ink">
              Top spenders (lifetime)
            </h3>
            <button
              type="button"
              onClick={() =>
                downloadCsv(
                  "saga-top-spenders.csv",
                  [
                    "email",
                    "membership",
                    "totalSpent",
                    "orderCount",
                    "lastOrderAt",
                  ],
                  topSpenders
                )
              }
              disabled={topSpenders.length === 0}
              className="inline-flex items-center gap-2 border border-line px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-cream hover:border-gold-ink hover:text-gold-ink disabled:opacity-40"
            >
              <Download className="h-3 w-3" /> CSV
            </button>
          </div>
          {topSpenders.length === 0 ? (
            <p className="text-xs text-muted">No spenders yet.</p>
          ) : (
            <div className="space-y-2">
              {topSpenders.map((u) => (
                <div
                  key={u._id}
                  className="flex items-center justify-between border border-elevated bg-page px-3 py-2 text-xs"
                >
                  <div className="min-w-0">
                    <p className="truncate text-ink-2">
                      {u.userName || u.name || u.email}
                    </p>
                    <p className="truncate font-mono text-[10px] text-muted">
                      {u.email} · {u.membership || "standard"}
                    </p>
                  </div>
                  <div className="ml-3 text-right">
                    <p className="font-bold text-gold-ink">
                      {formatCurrency(u.totalSpent)}
                    </p>
                    <p className="text-[10px] text-muted">
                      {formatNumber(u.orderCount)} orders
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ReviewsTab = ({ data }) => {
  if (!data) return null;
  const sentiment = data.sentiment || { positive: 0, neutral: 0, negative: 0 };
  const total = sentiment.positive + sentiment.neutral + sentiment.negative || 1;
  const ratingDist = data.ratingDistribution || {};
  const ratingTotal =
    Object.values(ratingDist).reduce((sum, n) => sum + (n || 0), 0) || 1;
  const keywords = data.topKeywords || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Approved"
          value={formatNumber(data.statusCounts?.approved)}
          tone="text-emerald-400"
        />
        <StatCard
          label="Pending"
          value={formatNumber(data.statusCounts?.pending)}
          tone="text-amber-400"
        />
        <StatCard
          label="Rejected"
          value={formatNumber(data.statusCounts?.rejected)}
          tone="text-danger-ink"
        />
        <StatCard
          label="Avg rating"
          value={`${(data.averageRating || 0).toFixed(2)} ★`}
        />
      </div>

      <div className="border border-elevated bg-panel p-6">
        <h3 className="mb-4 font-mono text-xs uppercase tracking-[0.26em] text-gold-ink">
          Sentiment breakdown
        </h3>
        <div className="flex h-3 overflow-hidden rounded-full">
          <div
            className="bg-emerald-400"
            style={{ width: `${(sentiment.positive / total) * 100}%` }}
          />
          <div
            className="bg-amber-400"
            style={{ width: `${(sentiment.neutral / total) * 100}%` }}
          />
          <div
            className="bg-danger-ink"
            style={{ width: `${(sentiment.negative / total) * 100}%` }}
          />
        </div>
        <div className="mt-3 flex justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
          <span>Positive {Math.round((sentiment.positive / total) * 100)}%</span>
          <span>Neutral {Math.round((sentiment.neutral / total) * 100)}%</span>
          <span>Negative {Math.round((sentiment.negative / total) * 100)}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="border border-elevated bg-panel p-6">
          <h3 className="mb-4 font-mono text-xs uppercase tracking-[0.26em] text-gold-ink">
            Rating distribution
          </h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingDist[star] || 0;
              const pct = (count / ratingTotal) * 100;
              return (
                <div key={star} className="flex items-center gap-3 text-xs">
                  <span className="w-12 font-mono text-[10px] text-cream">
                    {star} ★
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden bg-card">
                    <div
                      className="h-full bg-gold"
                      style={{ width: `${Math.max(2, pct)}%` }}
                    />
                  </div>
                  <span className="w-12 text-right font-mono text-[10px] text-muted">
                    {formatNumber(count)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border border-elevated bg-panel p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-mono text-xs uppercase tracking-[0.26em] text-gold-ink">
              Top keywords
            </h3>
            <button
              type="button"
              onClick={() =>
                downloadCsv(
                  "saga-review-keywords.csv",
                  ["word", "count"],
                  keywords
                )
              }
              disabled={keywords.length === 0}
              className="inline-flex items-center gap-2 border border-line px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-cream hover:border-gold-ink hover:text-gold-ink disabled:opacity-40"
            >
              <Download className="h-3 w-3" /> CSV
            </button>
          </div>
          {keywords.length === 0 ? (
            <p className="text-xs text-muted">
              Not enough approved review text to extract keywords.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {keywords.map((k) => (
                <span
                  key={k.word}
                  className="border border-line bg-page px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-cream"
                >
                  {k.word}
                  <span className="ml-2 text-gold-ink">{k.count}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DateRangeControls = ({ range, onChange }) => {
  const presets = [
    { label: "Last 7", days: 7 },
    { label: "Last 30", days: 30 },
    { label: "Last 90", days: 90 },
  ];
  const applyPreset = (days) => {
    const to = new Date();
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
    onChange({ from, to });
  };

  return (
    <div className="flex flex-wrap items-center gap-3 border border-elevated bg-panel p-4">
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
        Range
      </span>
      <input
        type="date"
        value={isoDateInputValue(range.from)}
        max={isoDateInputValue(range.to)}
        onChange={(e) => onChange({ ...range, from: new Date(e.target.value) })}
        className="border border-elevated bg-page px-3 py-1.5 text-xs text-ink focus:border-gold-ink focus:outline-none"
      />
      <span className="text-muted">→</span>
      <input
        type="date"
        value={isoDateInputValue(range.to)}
        min={isoDateInputValue(range.from)}
        onChange={(e) => onChange({ ...range, to: new Date(e.target.value) })}
        className="border border-elevated bg-page px-3 py-1.5 text-xs text-ink focus:border-gold-ink focus:outline-none"
      />
      <div className="ml-auto flex gap-2">
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => applyPreset(p.days)}
            className="border border-line px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-cream hover:border-gold-ink hover:text-gold-ink"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
};

/* --------------------------------------------------------------------- */
/* MAIN                                                                   */
/* --------------------------------------------------------------------- */

// Recharts color palette aligned to Saga Elite's gold-on-dark theme.
// Order matters — pies and bars cycle through these in the order shown.
const FASHION_COLORS = ["#f2ca50", "#d4af37", "#a78bfa", "#34d399", "#fb7185", "#38bdf8"];

const FashionTab = ({ data }) => {
  if (!data) return null;
  const products = data.products || [];

  if (products.length === 0) {
    return (
      <div className="border border-elevated bg-panel p-10 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-muted">
          No product data yet
        </p>
        <p className="mt-3 text-sm text-muted">
          Once products start moving, fashion-specific insights surface here.
        </p>
      </div>
    );
  }

  // Aggregations — grouped by category so we can plot a pie + a side ledger.
  const byCategory = products.reduce((acc, p) => {
    const k = p.category || "Other";
    acc[k] = acc[k] || { name: k, sold: 0, products: 0, revenue: 0 };
    acc[k].sold += Number(p.soldCount) || 0;
    acc[k].products += 1;
    acc[k].revenue += (Number(p.soldCount) || 0) * (Number(p.basePrice) || 0);
    return acc;
  }, {});
  const categorySoldData = Object.values(byCategory)
    .map((c) => ({ name: c.name, value: c.sold, products: c.products, revenue: c.revenue }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);

  const topWishlisted = [...products]
    .filter((p) => Number(p.wishCount) > 0)
    .sort((a, b) => (Number(b.wishCount) || 0) - (Number(a.wishCount) || 0))
    .slice(0, 8)
    .map((p) => ({
      name: p.name?.length > 22 ? `${p.name.slice(0, 22)}…` : p.name || "—",
      wishes: Number(p.wishCount) || 0,
      sold: Number(p.soldCount) || 0,
    }));

  const fastestSelling = [...products]
    .filter((p) => Number(p.soldCount) > 0)
    .sort((a, b) => (Number(b.soldCount) || 0) - (Number(a.soldCount) || 0))
    .slice(0, 8)
    .map((p) => ({
      name: p.name?.length > 22 ? `${p.name.slice(0, 22)}…` : p.name || "—",
      sold: Number(p.soldCount) || 0,
    }));

  const deadInventory = [...products]
    .filter((p) => (Number(p.soldCount) || 0) === 0 && (Number(p.totalStock) || 0) > 0)
    .sort((a, b) => (Number(b.totalStock) || 0) - (Number(a.totalStock) || 0))
    .slice(0, 8);

  const totalSold = categorySoldData.reduce((s, c) => s + c.value, 0);
  const totalWishes = products.reduce((s, p) => s + (Number(p.wishCount) || 0), 0);
  const totalDeadUnits = deadInventory.reduce(
    (s, p) => s + (Number(p.totalStock) || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="border border-elevated bg-panel p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
            Categories live
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-ink">
            {categorySoldData.length}
          </p>
          <p className="mt-1 text-[10px] text-muted">with sales</p>
        </div>
        <div className="border border-elevated bg-panel p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
            Units sold
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-gold-ink">
            {totalSold.toLocaleString()}
          </p>
        </div>
        <div className="border border-elevated bg-panel p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
            Wishlist demand
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-rose-300">
            {totalWishes.toLocaleString()}
          </p>
        </div>
        <div className="border border-elevated bg-panel p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
            Dead stock units
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-orange-300">
            {totalDeadUnits.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="border border-elevated bg-panel p-6">
          <div className="mb-2 flex items-center gap-2">
            <Shirt className="h-4 w-4 text-gold-ink" />
            <h3 className="font-mono text-xs uppercase tracking-[0.26em] text-gold-ink">
              Top categories — units sold
            </h3>
          </div>
          <p className="mb-4 text-[10px] text-muted">
            Where the volume is concentrated. Use this to pace next drop's mix.
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={categorySoldData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
              >
                {categorySoldData.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={FASHION_COLORS[index % FASHION_COLORS.length]}
                    stroke="#0a0a0a"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#0a0a0a",
                  border: "1px solid #2a2a2a",
                  fontSize: 12,
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, color: "#99907c" }}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-1.5">
            {categorySoldData.map((c, i) => (
              <div
                key={c.name}
                className="flex items-center justify-between border-l-2 pl-3 text-xs"
                style={{ borderColor: FASHION_COLORS[i % FASHION_COLORS.length] }}
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
                  {c.name}
                </span>
                <span className="text-ink-2">
                  {c.value} units · {c.products} products
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-elevated bg-panel p-6">
          <div className="mb-2 flex items-center gap-2">
            <Zap className="h-4 w-4 text-gold-ink" />
            <h3 className="font-mono text-xs uppercase tracking-[0.26em] text-gold-ink">
              Fastest selling
            </h3>
          </div>
          <p className="mb-4 text-[10px] text-muted">
            Top 8 by total units shipped. Restock candidates.
          </p>
          {fastestSelling.length === 0 ? (
            <p className="py-12 text-center text-xs text-muted">No sales yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={fastestSelling}
                layout="vertical"
                margin={{ left: 10, right: 16, top: 0, bottom: 0 }}
              >
                <XAxis type="number" stroke="#666" fontSize={10} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#99907c"
                  fontSize={10}
                  width={140}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0a0a0a",
                    border: "1px solid #2a2a2a",
                    fontSize: 12,
                  }}
                  cursor={{ fill: "rgba(242,202,80,0.05)" }}
                />
                <Bar dataKey="sold" fill="#f2ca50" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="border border-elevated bg-panel p-6">
          <div className="mb-2 flex items-center gap-2">
            <Heart className="h-4 w-4 text-rose-300" />
            <h3 className="font-mono text-xs uppercase tracking-[0.26em] text-rose-300">
              Most wishlisted
            </h3>
          </div>
          <p className="mb-4 text-[10px] text-muted">
            Strong demand signal — promote in next campaign or re-stock if low.
          </p>
          {topWishlisted.length === 0 ? (
            <p className="py-12 text-center text-xs text-muted">No wishlist activity.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={topWishlisted}
                layout="vertical"
                margin={{ left: 10, right: 16, top: 0, bottom: 0 }}
              >
                <XAxis type="number" stroke="#666" fontSize={10} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#99907c"
                  fontSize={10}
                  width={140}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0a0a0a",
                    border: "1px solid #2a2a2a",
                    fontSize: 12,
                  }}
                  cursor={{ fill: "rgba(251,113,133,0.05)" }}
                />
                <Bar dataKey="wishes" fill="#fb7185" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="border border-elevated bg-panel p-6">
          <div className="mb-2 flex items-center gap-2">
            <Skull className="h-4 w-4 text-orange-300" />
            <h3 className="font-mono text-xs uppercase tracking-[0.26em] text-orange-300">
              Dead inventory
            </h3>
          </div>
          <p className="mb-4 text-[10px] text-muted">
            Stocked but never sold. Discount, bundle, or pull from listing.
          </p>
          {deadInventory.length === 0 ? (
            <p className="py-12 text-center text-xs text-muted">
              All stocked products have moved at least once. Healthy.
            </p>
          ) : (
            <ul className="space-y-2">
              {deadInventory.map((p) => (
                <li
                  key={p._id || p.slug || p.artNo}
                  className="flex items-center justify-between border border-elevated bg-page px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate text-ink-2">{p.name}</p>
                    <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.22em] text-muted">
                      {p.category || "—"} · {p.artNo || "no art#"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-orange-400/30 bg-orange-400/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-orange-200">
                    {p.totalStock} stuck
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

const initialRange = () => {
  const to = new Date();
  const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { from, to };
};

export default function AdminAnalytics() {
  const [activeTab, setActiveTab] = useState("sales");
  const [range, setRange] = useState(initialRange);
  const [dataByTab, setDataByTab] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTab = useCallback(
    async (tab, currentRange) => {
      setLoading(true);
      setError(null);
      try {
        const apiTab = TAB_ENDPOINT_OVERRIDE[tab] || tab;
        let endpoint;
        if (apiTab === "sales" || apiTab === "customers") {
          const params = new URLSearchParams({
            from: currentRange.from.toISOString(),
            to: currentRange.to.toISOString(),
          });
          endpoint = `${API_BASE}/admin/analytics/${apiTab}?${params.toString()}`;
        } else {
          endpoint = `${API_BASE}/admin/analytics/${apiTab}`;
        }
        const res = await axios.get(endpoint, { withCredentials: true });
        // Cache under both the UI tab key and the apiTab so a switch between
        // tabs that share an endpoint (Products ↔ Fashion) doesn't refetch.
        setDataByTab((prev) => ({
          ...prev,
          [tab]: res.data?.data || null,
          [apiTab]: res.data?.data || null,
        }));
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Could not load analytics."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchTab(activeTab, range);
  }, [activeTab, range, fetchTab]);

  const tabContent = () => {
    const data = dataByTab[activeTab];
    if (loading && !data) {
      return (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gold-ink" />
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex items-center gap-3 border border-danger-ink/40 bg-danger-ink/5 p-4 text-sm text-danger-ink">
          <AlertTriangle className="h-4 w-4" /> {error}
        </div>
      );
    }
    if (activeTab === "sales") {
      return <SalesTab data={data} range={range} onRangeChange={setRange} />;
    }
    if (activeTab === "products") return <ProductsTab data={data} />;
    if (activeTab === "fashion") return <FashionTab data={data} />;
    if (activeTab === "drops") return <DropsTab data={data} />;
    if (activeTab === "customers") {
      return (
        <CustomersTab data={data} range={range} onRangeChange={setRange} />
      );
    }
    if (activeTab === "reviews") return <ReviewsTab data={data} />;
    return null;
  };

  return (
    <AdminPage
      eyebrow="Intelligence"
      title="Analytics"
      description="Sales, products, drops, customers, and review sentiment."
      actions={
        <Link
          to="/admin/dashboard"
          className="flex items-center gap-2 rounded-full border border-ink/10 bg-ink/5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-ink hover:bg-ink/10"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Link>
      }
    >
      <div className="mx-auto max-w-7xl pb-20">
        <div className="mb-6 flex flex-wrap gap-2 border-b border-elevated pb-4">
          {TABS.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 border px-5 py-3 font-mono text-[11px] uppercase tracking-[0.2em] transition-colors ${
                  isActive
                    ? "border-gold-ink bg-panel text-gold-ink"
                    : "border-elevated text-muted hover:text-ink-2"
                }`}
              >
                <TabIcon className="h-4 w-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        {tabContent()}
      </div>
    </AdminPage>
  );
}
