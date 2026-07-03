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

      <div className="rounded-2xl border border-ink/[0.08] bg-ink/[0.02] p-5 backdrop-blur-md">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">Product Health</h3>
          <Sparkles className={`h-4 w-4 ${healthScore === 100 ? 'text-emerald-400' : 'text-gold-ink2'}`} />
        </div>
        <div className="flex items-end gap-2">
          <span className="text-4xl font-bold text-ink">{healthScore}</span>
          <span className="mb-1 text-sm text-ink/50">/ 100</span>
        </div>
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              healthScore < 50 ? 'bg-red-500' : healthScore < 80 ? 'bg-gold-deep' : 'bg-emerald-500'
            }`}
            style={{ width: `${healthScore}%` }}
          />
        </div>
      </div>

      <RightRailPanel title="Inventory Snapshot">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-ink/60">
            <span>Total stock</span>
            <span className="font-semibold text-gold-ink2">{variantStockSummary.totalStock}</span>
          </div>
          <div className="flex justify-between text-ink/60">
            <span>Variants</span>
            <span className="text-ink">{variantStockSummary.variantCount}</span>
          </div>
          <div className="flex justify-between text-ink/60">
            <span>Colors / Sizes</span>
            <span className="text-ink">
              {variantStockSummary.uniqueColors} / {variantStockSummary.uniqueSizes}
            </span>
          </div>
        </div>
      </RightRailPanel>

      {isEditing && (
        <RightRailPanel title="Performance">
          {analyticsLoading ? (
            <p className="text-xs text-ink/40">Loading analytics...</p>
          ) : analytics ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-ink/60">
                <span>Views</span>
                <span className="text-ink">{analytics.viewCount}</span>
              </div>
              <div className="flex justify-between text-ink/60">
                <span>Sold</span>
                <span className="text-emerald-400">{analytics.soldCount}</span>
              </div>
              <div className="flex justify-between text-ink/60">
                <span>Wishlist</span>
                <span className="text-ink">{analytics.wishCount}</span>
              </div>
              <div className="flex justify-between text-ink/60">
                <span>Conversion</span>
                <span className="text-ink">{(analytics.conversionRate * 100).toFixed(1)}%</span>
              </div>
              {revenueEstimate && (
                <div className="flex justify-between border-t border-ink/5 pt-2 text-ink/60">
                  <span>Revenue est.</span>
                  <span className="font-semibold text-gold-ink2">Rs. {revenueEstimate}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-ink/40">No performance data yet.</p>
          )}
        </RightRailPanel>
      )}

      <div className="rounded-2xl border border-ink/[0.08] bg-ink/[0.02] p-5 backdrop-blur-md">
        <div className="mb-4 flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-ink">Margin Analytics</h3>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between border-b border-ink/5 pb-2">
            <span className="text-sm text-ink/60">Final Price</span>
            <span className="font-mono text-sm text-ink">Rs. {marginAnalytics.finalPrice}</span>
          </div>
          <div className="flex justify-between border-b border-ink/5 pb-2">
            <span className="text-sm text-ink/60">Profit</span>
            <span className="font-mono text-sm text-emerald-400">Rs. {marginAnalytics.profit}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink/60">Margin</span>
            <span
              className={`inline-flex rounded-md px-2 py-1 text-xs font-bold ${
                parseFloat(marginAnalytics.margin) > 40
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : parseFloat(marginAnalytics.margin) > 20
                    ? 'bg-gold-deep/20 text-gold-ink2'
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

      <div className="rounded-2xl border border-ink/[0.08] bg-ink/[0.02] p-5 backdrop-blur-md">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-ink/70" />
          <h3 className="text-sm font-semibold text-ink">Publishing Checklist</h3>
        </div>
        <div className="space-y-3">
          {checklist.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              {item.done ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <Circle className="h-4 w-4 text-ink/20" />
              )}
              <span className={`text-sm ${item.done ? 'text-ink/60 line-through' : 'text-ink'}`}>
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
          className="flex items-center justify-center gap-2 rounded-xl border border-ink/10 bg-ink/5 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink/70 transition hover:border-gold-ink2/30 hover:text-gold-ink2"
        >
          <Package className="h-4 w-4" />
          View on storefront
        </a>
      )}
    </div>
  );
};
