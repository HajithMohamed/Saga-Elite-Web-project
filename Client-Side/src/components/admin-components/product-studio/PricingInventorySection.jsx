import React from 'react';
import { useProductForm } from './ProductFormContext';
import { FormField } from '@/components/admin-components/_form/FormField';
import { LuxuryInput } from '@/components/admin-components/_form/inputs';

export const PricingInventorySection = () => {
  const { formData, updateField, validationErrors } = useProductForm();

  return (
    <div className="rounded-2xl border border-ink/[0.08] bg-ink/[0.02] p-6 backdrop-blur-md">
      <h2 className="mb-6 text-lg font-semibold text-ink">Pricing & Rules</h2>
      
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-3">
          <FormField label="Base Price (LKR)" required error={validationErrors.basePrice}>
            <LuxuryInput
              type="number"
              value={formData.basePrice}
              onChange={(e) => updateField('basePrice', e.target.value)}
              placeholder="0.00"
              error={!!validationErrors.basePrice}
            />
          </FormField>
          <FormField label="Cost Price (LKR)">
            <LuxuryInput
              type="number"
              value={formData.costPrice}
              onChange={(e) => updateField('costPrice', e.target.value)}
              placeholder="0.00"
            />
          </FormField>
          <FormField label="Discount (%)" helper="0 if no discount.">
            <LuxuryInput
              type="number"
              value={formData.discountPercent}
              onChange={(e) => updateField('discountPercent', e.target.value)}
              placeholder="0"
            />
          </FormField>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-ink/50">Max Qty Per User</label>
            <input 
              type="number" 
              value={formData.maxPerUser}
              onChange={(e) => updateField('maxPerUser', e.target.value)}
              className="w-full rounded-xl border border-ink/10 bg-black/40 px-4 py-3 text-sm text-ink transition-colors focus:border-gold-ink2 focus:outline-none focus:ring-1 focus:ring-gold-ink2"
              placeholder="Leave empty for unlimited"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-ink/50">Low Stock Threshold</label>
            <input 
              type="number" 
              value={formData.lowStockThreshold}
              onChange={(e) => updateField('lowStockThreshold', e.target.value)}
              className="w-full rounded-xl border border-ink/10 bg-black/40 px-4 py-3 text-sm text-ink transition-colors focus:border-gold-ink2 focus:outline-none focus:ring-1 focus:ring-gold-ink2"
              placeholder="e.g. 5"
            />
          </div>
        </div>
        
        <div className="border-t border-ink/5 pt-6">
          <label className="mb-4 block text-xs font-semibold uppercase tracking-wider text-ink/50">Product Status & Visibility</label>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-ink/10 bg-black/40 p-4 transition-colors hover:bg-ink/5">
              <span className="text-sm text-ink">Active on site</span>
              <input 
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => updateField('isActive', e.target.checked)}
                className="h-4 w-4 rounded border-ink/20 bg-ink/10 text-gold-ink2 focus:ring-gold-ink2"
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-ink/10 bg-black/40 p-4 transition-colors hover:bg-ink/5">
              <span className="text-sm text-ink">Featured Drop</span>
              <input 
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => updateField('isFeatured', e.target.checked)}
                className="h-4 w-4 rounded border-ink/20 bg-ink/10 text-gold-ink2 focus:ring-gold-ink2"
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-ink/10 bg-black/40 p-4 transition-colors hover:bg-ink/5">
              <span className="text-sm text-ink">Limited Edition</span>
              <input 
                type="checkbox"
                checked={formData.isLimited}
                onChange={(e) => updateField('isLimited', e.target.checked)}
                className="h-4 w-4 rounded border-ink/20 bg-ink/10 text-gold-ink2 focus:ring-gold-ink2"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
