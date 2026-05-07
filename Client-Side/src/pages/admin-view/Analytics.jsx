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
} from "lucide-react";
import { API_V1_URL as API_BASE } from "@/lib/api";
import { AdminPage } from "@/components/admin-components/AdminUI";

const TABS = [
  { key: "sales", label: "Sales", icon: TrendingUp },
  { key: "products", label: "Products", icon: Package },
  { key: "drops", label: "Drops", icon: Layers3 },
  { key: "customers", label: "Customers", icon: Users },
  { key: "reviews", label: "Sentiment", icon: Star },
];

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  });

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("en-LK");

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
    accent: "border-[#ffb4ab]/40 bg-[#ffb4ab]/10 text-[#ffb4ab]",
  },
  hidden_gem: {
    label: "Hidden Gem",
    hint: "Low sales · positive sentiment",
    accent: "border-[#f2ca50]/40 bg-[#f2ca50]/10 text-[#f2ca50]",
    advice: "RE-MARKET",
  },
  deadstock: {
    label: "Deadstock",
    hint: "Low sales · negative sentiment",
    accent: "border-white/10 bg-white/5 text-white/60",
    advice: "LIQUIDATE",
  },
};

const StatCard = ({ label, value, hint, tone = "text-[#f2ca50]" }) => (
  <div className="border border-[#2a2a2a] bg-[#131313] p-5">
    <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#99907c]">
      {label}
    </p>
    <p className={`mt-3 text-2xl font-bold ${tone}`}>{value}</p>
    {hint ? <p className="mt-1 text-xs text-[#666]">{hint}</p> : null}
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
  const maxRevenue = Math.max(...daily.map((d) => d.revenue), 1);

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
          tone="text-[#e5e2e1]"
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
          tone="text-[#ffb4ab]"
        />
      </div>

      <div className="border border-[#2a2a2a] bg-[#131313] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-mono text-xs uppercase tracking-[0.26em] text-[#f2ca50]">
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
            className="inline-flex items-center gap-2 border border-[#4d4635] px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-[#d0c5af] hover:border-[#f2ca50] hover:text-[#f2ca50] disabled:opacity-40"
          >
            <Download className="h-3 w-3" /> Export CSV
          </button>
        </div>
        {daily.length === 0 ? (
          <p className="py-8 text-center font-mono text-xs uppercase tracking-widest text-[#666]">
            No orders in this range.
          </p>
        ) : (
          <div className="space-y-1.5">
            {daily.map((d) => (
              <div key={d.date} className="flex items-center gap-3 text-xs">
                <span className="w-20 shrink-0 font-mono text-[10px] text-[#99907c]">
                  {formatShortDate(d.date)}
                </span>
                <div className="h-1.5 flex-1 overflow-hidden bg-[#1c1b1b]">
                  <div
                    className="h-full bg-[#f2ca50] transition-all duration-700"
                    style={{
                      width: `${Math.max(2, (d.revenue / maxRevenue) * 100)}%`,
                    }}
                  />
                </div>
                <span className="w-32 text-right text-[#f2ca50]">
                  {formatCurrency(d.revenue)}
                </span>
                <span className="w-12 text-right font-mono text-[10px] text-[#666]">
                  {d.orders}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border border-[#2a2a2a] bg-[#131313] p-6">
        <h3 className="mb-4 font-mono text-xs uppercase tracking-[0.26em] text-[#f2ca50]">
          Payment methods
        </h3>
        {paymentMethods.length === 0 ? (
          <p className="text-xs text-[#666]">No payment data.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {paymentMethods.map((p) => (
              <div
                key={p.method}
                className="flex items-center justify-between border border-[#2a2a2a] bg-[#0a0a0a] px-4 py-3 text-sm"
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#99907c]">
                  {p.method.replace(/_/g, " ")}
                </span>
                <span className="text-right">
                  <span className="block font-bold text-[#e5e2e1]">
                    {formatCurrency(p.revenue)}
                  </span>
                  <span className="text-[10px] text-[#666]">
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
        <p className="text-xs text-[#99907c]">
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
          className="inline-flex items-center gap-2 border border-[#4d4635] px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-[#d0c5af] hover:border-[#f2ca50] hover:text-[#f2ca50] disabled:opacity-40"
        >
          <Download className="h-3 w-3" /> Export CSV
        </button>
      </div>

      <div className="overflow-x-auto border border-[#2a2a2a] bg-[#131313]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[#2a2a2a] bg-[#1a1a1a] font-mono text-[10px] uppercase tracking-[0.22em] text-[#99907c]">
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
                  className="px-4 py-12 text-center font-mono text-xs text-[#666]"
                >
                  No products to analyze.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr
                  key={p._id}
                  className="border-b border-[#2a2a2a]/40 hover:bg-[#1a1a1a]"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#e5e2e1]">{p.name}</p>
                    <p className="font-mono text-[10px] text-[#666]">
                      {p.artNo} · {p.category}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right text-[#d0c5af]">
                    {formatNumber(p.views)}
                  </td>
                  <td className="px-4 py-3 text-right text-[#d0c5af]">
                    {formatNumber(p.cartAdds)}
                  </td>
                  <td className="px-4 py-3 text-right text-[#d0c5af]">
                    {formatNumber(p.wishCount)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-[#f2ca50]">
                    {formatNumber(p.sold)}
                  </td>
                  <td className="px-4 py-3 text-right text-[#d0c5af]">
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
        <p className="text-xs text-[#99907c]">
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
          className="inline-flex items-center gap-2 border border-[#4d4635] px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-[#d0c5af] hover:border-[#f2ca50] hover:text-[#f2ca50] disabled:opacity-40"
        >
          <Download className="h-3 w-3" /> Export CSV
        </button>
      </div>

      {/* Decision Matrix */}
      <div className="border border-[#2a2a2a] bg-[#131313] p-6">
        <h3 className="mb-4 font-mono text-xs uppercase tracking-[0.26em] text-[#f2ca50]">
          Performance Decision Matrix
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {["grail", "flawed", "hidden_gem", "deadstock"].map((key) => {
            const meta = QUADRANT_META[key];
            const items = quadrants[key];
            return (
              <div
                key={key}
                className={`border ${meta.accent} bg-[#0a0a0a] p-4`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em]">
                      {meta.label}
                    </p>
                    <p className="text-[10px] text-[#666]">{meta.hint}</p>
                  </div>
                  <span className="rounded-full border border-current px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.22em]">
                    {meta.advice}
                  </span>
                </div>
                {items.length === 0 ? (
                  <p className="py-3 text-center font-mono text-[10px] uppercase tracking-widest text-[#666]">
                    No drops here.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {items.map((d) => (
                      <div
                        key={d.dropId}
                        className="flex items-center justify-between border border-[#2a2a2a] bg-[#131313] px-3 py-2 text-xs"
                      >
                        <span className="truncate text-[#e5e2e1]">{d.name}</span>
                        <span className="font-mono text-[10px] text-[#99907c]">
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
      <div className="overflow-x-auto border border-[#2a2a2a] bg-[#131313]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[#2a2a2a] bg-[#1a1a1a] font-mono text-[10px] uppercase tracking-[0.22em] text-[#99907c]">
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
                className="border-b border-[#2a2a2a]/40 hover:bg-[#1a1a1a]"
              >
                <td className="px-4 py-3 text-[#e5e2e1]">{d.name}</td>
                <td className="px-4 py-3 text-right text-[#d0c5af]">
                  {formatNumber(d.productCount)}
                </td>
                <td className="px-4 py-3 text-right font-bold text-[#f2ca50]">
                  {formatNumber(d.soldUnits)}
                </td>
                <td className="px-4 py-3 text-right text-[#d0c5af]">
                  {formatCurrency(d.revenueProxy)}
                </td>
                <td className="px-4 py-3 text-right text-[#d0c5af]">
                  {formatNumber(d.stockOnHand)}
                </td>
                <td className="px-4 py-3 text-right text-emerald-400">
                  {(d.sentiment.avgRating || 0).toFixed(1)}
                </td>
                <td className="px-4 py-3 text-right text-xs">
                  <span className="text-emerald-400">+{d.sentiment.positive}</span>
                  <span className="mx-1 text-[#666]">/</span>
                  <span className="text-[#ffb4ab]">-{d.sentiment.negative}</span>
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
          tone="text-[#e5e2e1]"
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
        <div className="border border-[#2a2a2a] bg-[#131313] p-6">
          <h3 className="mb-4 font-mono text-xs uppercase tracking-[0.26em] text-[#f2ca50]">
            Membership tiers
          </h3>
          <div className="space-y-2">
            {tiers.length === 0 ? (
              <p className="text-xs text-[#666]">No customer data yet.</p>
            ) : (
              tiers.map((t) => (
                <div
                  key={t.tier}
                  className="flex items-center justify-between border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-xs"
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#d0c5af]">
                    {t.tier}
                  </span>
                  <span className="text-right">
                    <span className="block font-bold text-[#e5e2e1]">
                      {formatNumber(t.count)}
                    </span>
                    <span className="text-[10px] text-[#666]">
                      {formatCurrency(t.totalSpent)} spent
                    </span>
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="border border-[#2a2a2a] bg-[#131313] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-mono text-xs uppercase tracking-[0.26em] text-[#f2ca50]">
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
              className="inline-flex items-center gap-2 border border-[#4d4635] px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-[#d0c5af] hover:border-[#f2ca50] hover:text-[#f2ca50] disabled:opacity-40"
            >
              <Download className="h-3 w-3" /> CSV
            </button>
          </div>
          {topSpenders.length === 0 ? (
            <p className="text-xs text-[#666]">No spenders yet.</p>
          ) : (
            <div className="space-y-2">
              {topSpenders.map((u) => (
                <div
                  key={u._id}
                  className="flex items-center justify-between border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-xs"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[#e5e2e1]">
                      {u.userName || u.name || u.email}
                    </p>
                    <p className="truncate font-mono text-[10px] text-[#666]">
                      {u.email} · {u.membership || "standard"}
                    </p>
                  </div>
                  <div className="ml-3 text-right">
                    <p className="font-bold text-[#f2ca50]">
                      {formatCurrency(u.totalSpent)}
                    </p>
                    <p className="text-[10px] text-[#666]">
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
          tone="text-[#ffb4ab]"
        />
        <StatCard
          label="Avg rating"
          value={`${(data.averageRating || 0).toFixed(2)} ★`}
        />
      </div>

      <div className="border border-[#2a2a2a] bg-[#131313] p-6">
        <h3 className="mb-4 font-mono text-xs uppercase tracking-[0.26em] text-[#f2ca50]">
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
            className="bg-[#ffb4ab]"
            style={{ width: `${(sentiment.negative / total) * 100}%` }}
          />
        </div>
        <div className="mt-3 flex justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-[#99907c]">
          <span>Positive {Math.round((sentiment.positive / total) * 100)}%</span>
          <span>Neutral {Math.round((sentiment.neutral / total) * 100)}%</span>
          <span>Negative {Math.round((sentiment.negative / total) * 100)}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="border border-[#2a2a2a] bg-[#131313] p-6">
          <h3 className="mb-4 font-mono text-xs uppercase tracking-[0.26em] text-[#f2ca50]">
            Rating distribution
          </h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingDist[star] || 0;
              const pct = (count / ratingTotal) * 100;
              return (
                <div key={star} className="flex items-center gap-3 text-xs">
                  <span className="w-12 font-mono text-[10px] text-[#d0c5af]">
                    {star} ★
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden bg-[#1c1b1b]">
                    <div
                      className="h-full bg-[#f2ca50]"
                      style={{ width: `${Math.max(2, pct)}%` }}
                    />
                  </div>
                  <span className="w-12 text-right font-mono text-[10px] text-[#666]">
                    {formatNumber(count)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border border-[#2a2a2a] bg-[#131313] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-mono text-xs uppercase tracking-[0.26em] text-[#f2ca50]">
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
              className="inline-flex items-center gap-2 border border-[#4d4635] px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-[#d0c5af] hover:border-[#f2ca50] hover:text-[#f2ca50] disabled:opacity-40"
            >
              <Download className="h-3 w-3" /> CSV
            </button>
          </div>
          {keywords.length === 0 ? (
            <p className="text-xs text-[#666]">
              Not enough approved review text to extract keywords.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {keywords.map((k) => (
                <span
                  key={k.word}
                  className="border border-[#4d4635] bg-[#0a0a0a] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#d0c5af]"
                >
                  {k.word}
                  <span className="ml-2 text-[#f2ca50]">{k.count}</span>
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
    <div className="flex flex-wrap items-center gap-3 border border-[#2a2a2a] bg-[#131313] p-4">
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#99907c]">
        Range
      </span>
      <input
        type="date"
        value={isoDateInputValue(range.from)}
        max={isoDateInputValue(range.to)}
        onChange={(e) => onChange({ ...range, from: new Date(e.target.value) })}
        className="border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-1.5 text-xs text-[#FAF7F2] focus:border-[#f2ca50] focus:outline-none"
      />
      <span className="text-[#666]">→</span>
      <input
        type="date"
        value={isoDateInputValue(range.to)}
        min={isoDateInputValue(range.from)}
        onChange={(e) => onChange({ ...range, to: new Date(e.target.value) })}
        className="border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-1.5 text-xs text-[#FAF7F2] focus:border-[#f2ca50] focus:outline-none"
      />
      <div className="ml-auto flex gap-2">
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => applyPreset(p.days)}
            className="border border-[#4d4635] px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-[#d0c5af] hover:border-[#f2ca50] hover:text-[#f2ca50]"
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
        let endpoint;
        if (tab === "sales" || tab === "customers") {
          const params = new URLSearchParams({
            from: currentRange.from.toISOString(),
            to: currentRange.to.toISOString(),
          });
          endpoint = `${API_BASE}/admin/analytics/${tab}?${params.toString()}`;
        } else {
          endpoint = `${API_BASE}/admin/analytics/${tab}`;
        }
        const res = await axios.get(endpoint, { withCredentials: true });
        setDataByTab((prev) => ({ ...prev, [tab]: res.data?.data || null }));
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
          <Loader2 className="h-8 w-8 animate-spin text-[#f2ca50]" />
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex items-center gap-3 border border-[#ffb4ab]/40 bg-[#ffb4ab]/5 p-4 text-sm text-[#ffb4ab]">
          <AlertTriangle className="h-4 w-4" /> {error}
        </div>
      );
    }
    if (activeTab === "sales") {
      return <SalesTab data={data} range={range} onRangeChange={setRange} />;
    }
    if (activeTab === "products") return <ProductsTab data={data} />;
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
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-white/10"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Link>
      }
    >
      <div className="mx-auto max-w-7xl pb-20">
        <div className="mb-6 flex flex-wrap gap-2 border-b border-[#2a2a2a] pb-4">
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
                    ? "border-[#f2ca50] bg-[#131313] text-[#f2ca50]"
                    : "border-[#2a2a2a] text-[#888] hover:text-[#e5e2e1]"
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
