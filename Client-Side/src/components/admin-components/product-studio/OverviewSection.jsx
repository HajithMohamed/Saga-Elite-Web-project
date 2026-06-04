import React from 'react';
import { useProductForm } from './ProductFormContext';

export const OverviewSection = ({ drops = [] }) => {
  const { formData, updateField } = useProductForm();

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-md">
      <h2 className="mb-6 text-lg font-semibold text-white">Product Overview</h2>
      
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Product Name *</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white transition-colors focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              placeholder="e.g. Signature Heavyweight Hoodie"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Article No *</label>
            <input 
              type="text" 
              value={formData.artNo}
              onChange={(e) => updateField('artNo', e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white transition-colors focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              placeholder="e.g. SE-HD-001"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Description</label>
          <textarea 
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white transition-colors focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
            placeholder="Detailed product description..."
          />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Fabric / Material</label>
            <input 
              type="text" 
              value={formData.fabric}
              onChange={(e) => updateField('fabric', e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white transition-colors focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              placeholder="e.g. 100% Organic Cotton"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/50">GSM</label>
            <input 
              type="text" 
              value={formData.gsm}
              onChange={(e) => updateField('gsm', e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white transition-colors focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              placeholder="e.g. 400"
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Brand</label>
            <input 
              type="text" 
              value={formData.brand}
              onChange={(e) => updateField('brand', e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white transition-colors focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              placeholder="e.g. Sovereign Elite"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Collection Drop</label>
            <select
              value={formData.drop}
              onChange={(e) => updateField('drop', e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white transition-colors focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37] appearance-none"
            >
              <option value="" className="bg-[#0f1014] text-white">Select Drop...</option>
              {drops.map((d) => (
                <option key={d._id} value={d._id} className="bg-[#0f1014] text-white">{d.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Product Story (Optional)</label>
          <textarea 
            value={formData.story}
            onChange={(e) => updateField('story', e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white transition-colors focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
            placeholder="The inspiration behind this piece..."
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Fit Type</label>
            <input 
              type="text" 
              value={formData.fitType}
              onChange={(e) => updateField('fitType', e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white transition-colors focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              placeholder="e.g. Oversized Fit"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Size Guide (Reference)</label>
            <input 
              type="text" 
              value={formData.sizeGuide}
              onChange={(e) => updateField('sizeGuide', e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white transition-colors focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              placeholder="e.g. Standard Men's Tops"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Care Instructions</label>
          <input 
            type="text" 
            value={formData.careInstructions}
            onChange={(e) => updateField('careInstructions', e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white transition-colors focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
            placeholder="e.g. Machine wash cold, hang dry"
          />
        </div>
      </div>
    </div>
  );
};
