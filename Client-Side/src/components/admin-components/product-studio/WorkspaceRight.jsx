import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useProductForm } from './ProductFormContext';
import { Sparkles, DollarSign, Activity, CheckCircle2, Circle, Package } from 'lucide-react';
import { LivePreviewCard } from '@/components/admin-components/_form/LivePreviewCard';
import { ProgressBar } from '@/components/admin-components/_form/ProgressBar';
import { RightRailPanel } from '@/components/admin-components/_form/RightRailPanel';
import { API_V1_URL as API_BASE } from '@/lib/api';

export const WorkspaceRight = ({ productId, isEditing = false, productSlug }) => {
  const { formData, healthScore, marginAnalytics, variantStockSummary, images } = useProductForm();
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    if (!isEditing || !productId) {
      setAnalytics(null);
      return undefined;
    }

    let cancelled = false;
    setAnalyticsLoading(true);

    axios
      .get(`${API_BASE}/admin/products/${productId}/analytics`, { withCredentials: true })
      .then((res) => {
        if (!cancelled && res.data?.success) {
          setAnalytics(res.data.data);
        }
      })
      .catch(() => {
        if (!cancelled) setAnalytics(null);
      })
      .finally(() => {
        if (!cancelled) setAnalyticsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isEditing, productId]);

  const heroImage =
    images.find((img) => img.isPrimary)?.url ||
    images[0]?.url ||
    null;

  const hasDiscount = Number(formData.discountPercent) > 0;

  const checklist = [
    { label: 'Basic Info', done: !!(formData.name && formData.artNo && formData.description) },
    { label: 'Pricing Set', done: !!(Number(formData.basePrice) > 0) },
    { label: 'Media Uploaded', done: images.length > 0 },
    { label: 'Variants Configured', done: !!(formData.variants?.length > 0 && formData.variants[0].sku) },
    { label: 'Category Assigned', done: !!formData.categoryId },
    { label: 'Discount Active', done: hasDiscount },
  ];

  const completedCount = checklist.filter((item) => item.done).length;
  const revenueEstimate = analytics
    ? (analytics.soldCount * parseFloat(marginAnalytics.finalPrice)).toFixed(2)
    : null;

  return (
    <div className="sticky top-24 space-y-6">
      <RightRailPanel tone="accent" title="Live Preview" description="Storefront card preview.">
        <LivePreviewCard
          image={heroImage}
          eyebrow={formData.brand}
          title={formData.name || 'Untitled Product'}
          status={formData.isActive ? 'published' : 'draft'}
          meta={[
            { label: 'Price', value: `Rs. ${marginAnalytics.finalPrice}` },
            ...(hasDiscount ? [{ label: 'Discount', value: `${formData.discountPercent}%` }] : []),
            { label: 'Variants', value: String(variantStockSummary.variantCount) },
          ]}
        />
      </RightRailPanel>

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 backdrop-blur-md">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Product Health</h3>
          <Sparkles className={`h-4 w-4 ${healthScore === 100 ? 'text-emerald-400' : 'text-[#D4AF37]'}`} />
        </div>
        <div className="flex items-end gap-2">
          <span className="text-4xl font-bold text-white">{healthScore}</span>
          <span className="mb-1 text-sm text-white/50">/ 100</span>
        </div>
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              healthScore < 50 ? 'bg-red-500' : healthScore < 80 ? 'bg-[#D4AF37]' : 'bg-emerald-500'
            }`}
            style={{ width: `${healthScore}%` }}
          />
        </div>
      </div>

      <RightRailPanel title="Inventory Snapshot">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-white/60">
            <span>Total stock</span>
            <span className="font-semibold text-[#D4AF37]">{variantStockSummary.totalStock}</span>
          </div>
          <div className="flex justify-between text-white/60">
            <span>Variants</span>
            <span className="text-white">{variantStockSummary.variantCount}</span>
          </div>
          <div className="flex justify-between text-white/60">
            <span>Colors / Sizes</span>
            <span className="text-white">
              {variantStockSummary.uniqueColors} / {variantStockSummary.uniqueSizes}
            </span>
          </div>
        </div>
      </RightRailPanel>

      {isEditing && (
        <RightRailPanel title="Performance">
          {analyticsLoading ? (
            <p className="text-xs text-white/40">Loading analytics...</p>
          ) : analytics ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-white/60">
                <span>Views</span>
                <span className="text-white">{analytics.viewCount}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Sold</span>
                <span className="text-emerald-400">{analytics.soldCount}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Wishlist</span>
                <span className="text-white">{analytics.wishCount}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Conversion</span>
                <span className="text-white">{(analytics.conversionRate * 100).toFixed(1)}%</span>
              </div>
              {revenueEstimate && (
                <div className="flex justify-between border-t border-white/5 pt-2 text-white/60">
                  <span>Revenue est.</span>
                  <span className="font-semibold text-[#D4AF37]">Rs. {revenueEstimate}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-white/40">No performance data yet.</p>
          )}
        </RightRailPanel>
      )}

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 backdrop-blur-md">
        <div className="mb-4 flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Margin Analytics</h3>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between border-b border-white/5 pb-2">
            <span className="text-sm text-white/60">Final Price</span>
            <span className="font-mono text-sm text-white">Rs. {marginAnalytics.finalPrice}</span>
          </div>
          <div className="flex justify-between border-b border-white/5 pb-2">
            <span className="text-sm text-white/60">Profit</span>
            <span className="font-mono text-sm text-emerald-400">Rs. {marginAnalytics.profit}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">Margin</span>
            <span
              className={`inline-flex rounded-md px-2 py-1 text-xs font-bold ${
                parseFloat(marginAnalytics.margin) > 40
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : parseFloat(marginAnalytics.margin) > 20
                    ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                    : 'bg-red-500/20 text-red-400'
              }`}
            >
              {marginAnalytics.margin}%
            </span>
          </div>
        </div>
      </div>

      <RightRailPanel title="Setup Progress">
        <ProgressBar
          label="Product completion"
          value={healthScore / 100}
          segments={checklist.length}
          filledCount={completedCount}
        />
      </RightRailPanel>

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 backdrop-blur-md">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-white/70" />
          <h3 className="text-sm font-semibold text-white">Publishing Checklist</h3>
        </div>
        <div className="space-y-3">
          {checklist.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              {item.done ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <Circle className="h-4 w-4 text-white/20" />
              )}
              <span className={`text-sm ${item.done ? 'text-white/60 line-through' : 'text-white'}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {isEditing && productSlug && (
        <a
          href={`/shop/product/${productSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white/70 transition hover:border-[#D4AF37]/30 hover:text-[#D4AF37]"
        >
          <Package className="h-4 w-4" />
          View on storefront
        </a>
      )}
    </div>
  );
};
