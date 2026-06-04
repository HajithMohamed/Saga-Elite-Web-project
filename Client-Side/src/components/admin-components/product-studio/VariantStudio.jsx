import React from 'react';
import { useProductForm, defaultVariant, COLOR_OPTIONS, generateSku } from './ProductFormContext';
import { Plus, Trash2, Copy } from 'lucide-react';

export const VariantStudio = () => {
  const { formData, updateField, addVariant, updateVariant, removeVariant } = useProductForm();
  const variants = formData.variants || [];

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-md overflow-hidden">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Variant Studio</h2>
          <p className="mt-1 text-xs text-white/50">Manage SKUs, sizing, colors, and stock in a spreadsheet view.</p>
        </div>
        <button 
          onClick={addVariant}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-white/10"
        >
          <Plus className="h-4 w-4" />
          Add Variant
        </button>
      </div>
      
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-sm text-white">
          <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-white/50">
            <tr>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Size</th>
              <th className="px-4 py-3 font-medium">Color</th>
              <th className="px-4 py-3 font-medium">Hex</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Price Adj.</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {variants.map((variant) => (
              <tr key={variant.id} className="group transition-colors hover:bg-white/[0.02]">
                <td className="p-2">
                  <input 
                    type="text" 
                    value={variant.sku} 
                    onChange={(e) => updateVariant(variant.id, 'sku', e.target.value)}
                    className="w-full rounded-md border border-transparent bg-transparent px-3 py-2 text-sm font-mono transition-colors focus:border-[#D4AF37] focus:bg-black/40 focus:outline-none"
                    placeholder="Auto-generate or type"
                  />
                  {!variant.sku && formData.artNo && (
                    <button 
                      onClick={() => updateVariant(variant.id, 'sku', generateSku(formData.artNo, variant.size, variant.color))}
                      className="mt-1 text-xs text-[#D4AF37] opacity-0 transition-opacity hover:underline group-hover:opacity-100"
                    >
                      Generate SKU
                    </button>
                  )}
                </td>
                <td className="p-2">
                  <input 
                    type="text" 
                    value={variant.size} 
                    onChange={(e) => updateVariant(variant.id, 'size', e.target.value)}
                    className="w-20 rounded-md border border-transparent bg-transparent px-3 py-2 text-sm transition-colors focus:border-[#D4AF37] focus:bg-black/40 focus:outline-none"
                    placeholder="M"
                  />
                </td>
                <td className="p-2">
                  <input 
                    type="text" 
                    value={variant.color} 
                    onChange={(e) => updateVariant(variant.id, 'color', e.target.value)}
                    list="color-options"
                    className="w-24 rounded-md border border-transparent bg-transparent px-3 py-2 text-sm transition-colors focus:border-[#D4AF37] focus:bg-black/40 focus:outline-none"
                    placeholder="Black"
                  />
                  <datalist id="color-options">
                    {COLOR_OPTIONS.map((c) => (
                      <option key={c.name} value={c.name} />
                    ))}
                  </datalist>
                </td>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-6 w-6 rounded-md border border-white/20" 
                      style={{ backgroundColor: variant.colorCode || '#000' }}
                    />
                    <input 
                      type="text" 
                      value={variant.colorCode} 
                      onChange={(e) => updateVariant(variant.id, 'colorCode', e.target.value)}
                      className="w-24 rounded-md border border-transparent bg-transparent px-3 py-2 text-sm font-mono transition-colors focus:border-[#D4AF37] focus:bg-black/40 focus:outline-none"
                      placeholder="#000000"
                    />
                  </div>
                </td>
                <td className="p-2">
                  <input 
                    type="number" 
                    value={variant.stock} 
                    onChange={(e) => updateVariant(variant.id, 'stock', e.target.value)}
                    className="w-24 rounded-md border border-transparent bg-transparent px-3 py-2 text-sm transition-colors focus:border-[#D4AF37] focus:bg-black/40 focus:outline-none"
                    placeholder="0"
                  />
                </td>
                <td className="p-2">
                  <input 
                    type="number" 
                    value={variant.priceAdjustment} 
                    onChange={(e) => updateVariant(variant.id, 'priceAdjustment', e.target.value)}
                    className="w-24 rounded-md border border-transparent bg-transparent px-3 py-2 text-sm transition-colors focus:border-[#D4AF37] focus:bg-black/40 focus:outline-none"
                    placeholder="0.00"
                  />
                </td>
                <td className="p-2 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button 
                      onClick={() => {
                        const newVariant = { ...variant, id: crypto.randomUUID() };
                        updateField('variants', [...variants, newVariant]);
                      }}
                      className="rounded p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
                      title="Duplicate Variant"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => removeVariant(variant.id)}
                      disabled={variants.length === 1}
                      className="rounded p-1.5 text-white/50 hover:bg-red-500/20 hover:text-red-500 disabled:opacity-30"
                      title="Remove Variant"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {variants.length === 0 && (
          <div className="py-8 text-center text-sm text-white/50">
            No variants configured. Click "Add Variant" to start.
          </div>
        )}
      </div>
    </div>
  );
};
