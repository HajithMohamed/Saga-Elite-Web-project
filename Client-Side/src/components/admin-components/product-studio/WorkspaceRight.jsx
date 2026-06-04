import React from 'react';
import { useProductForm } from './ProductFormContext';
import { Sparkles, DollarSign, Activity, CheckCircle2, Circle } from 'lucide-react';

export const WorkspaceRight = () => {
  const { formData, healthScore, marginAnalytics } = useProductForm();
  
  const checklist = [
    { label: 'Basic Info', done: !!(formData.name && formData.artNo && formData.description) },
    { label: 'Pricing Set', done: !!(formData.basePrice > 0) },
    { label: 'Media Uploaded', done: false }, // Needs media state
    { label: 'Variants Configured', done: !!(formData.variants?.length > 0 && formData.variants[0].sku) },
    { label: 'Category Assigned', done: !!formData.categoryId }
  ];

  return (
    <div className="sticky top-24 space-y-6">
      {/* Health Score */}
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
            className={`h-full rounded-full transition-all duration-500 ${healthScore < 50 ? 'bg-red-500' : healthScore < 80 ? 'bg-[#D4AF37]' : 'bg-emerald-500'}`}
            style={{ width: `${healthScore}%` }}
          />
        </div>
      </div>

      {/* Margin Analytics */}
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
            <span className={`inline-flex rounded-md px-2 py-1 text-xs font-bold ${parseFloat(marginAnalytics.margin) > 40 ? 'bg-emerald-500/20 text-emerald-400' : parseFloat(marginAnalytics.margin) > 20 ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-red-500/20 text-red-400'}`}>
              {marginAnalytics.margin}%
            </span>
          </div>
        </div>
      </div>

      {/* Checklist */}
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
    </div>
  );
};
