import React from 'react';
import { useProductForm } from './ProductFormContext';

export const PricingInventorySection = () => {
  const { formData, updateField } = useProductForm();

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-md">
      <h2 className="mb-6 text-lg font-semibold text-white">Pricing & Rules</h2>
      
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Base Price (LKR) *</label>
            <input 
              type="number" 
              value={formData.basePrice}
              onChange={(e) => updateField('basePrice', e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white transition-colors focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Cost Price (LKR)</label>
            <input 
              type="number" 
              value={formData.costPrice}
              onChange={(e) => updateField('costPrice', e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white transition-colors focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Discount (%)</label>
            <input 
              type="number" 
              value={formData.discountPercent}
              onChange={(e) => updateField('discountPercent', e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white transition-colors focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              placeholder="0"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Max Qty Per User</label>
            <input 
              type="number" 
              value={formData.maxPerUser}
              onChange={(e) => updateField('maxPerUser', e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white transition-colors focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              placeholder="Leave empty for unlimited"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Low Stock Threshold</label>
            <input 
              type="number" 
              value={formData.lowStockThreshold}
              onChange={(e) => updateField('lowStockThreshold', e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white transition-colors focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              placeholder="e.g. 5"
            />
          </div>
        </div>
        
        <div className="border-t border-white/5 pt-6">
          <label className="mb-4 block text-xs font-semibold uppercase tracking-wider text-white/50">Product Status & Visibility</label>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-black/40 p-4 transition-colors hover:bg-white/5">
              <span className="text-sm text-white">Active on site</span>
              <input 
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => updateField('isActive', e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-white/10 text-[#D4AF37] focus:ring-[#D4AF37]"
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-black/40 p-4 transition-colors hover:bg-white/5">
              <span className="text-sm text-white">Featured Drop</span>
              <input 
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => updateField('isFeatured', e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-white/10 text-[#D4AF37] focus:ring-[#D4AF37]"
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-black/40 p-4 transition-colors hover:bg-white/5">
              <span className="text-sm text-white">Limited Edition</span>
              <input 
                type="checkbox"
                checked={formData.isLimited}
                onChange={(e) => updateField('isLimited', e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-white/10 text-[#D4AF37] focus:ring-[#D4AF37]"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
