import React, { useState } from 'react';
import {
  useProductForm,
  SIZE_OPTIONS,
  COLOR_OPTIONS,
  CUSTOM_OPTION,
  generateSku,
  getImageForVariantColor,
} from './ProductFormContext';
import { LuxurySelect, LuxuryInput } from '@/components/admin-components/_form/inputs';
import { Plus, Trash2, Copy, Image as ImageIcon, ChevronDown, ChevronUp } from 'lucide-react';

export const VariantStudio = () => {
  const {
    formData,
    addVariant,
    updateVariant,
    duplicateVariant,
    removeVariant,
    variantStockSummary,
    images,
    validationErrors,
  } = useProductForm();

  const [showBreakdown, setShowBreakdown] = useState(false);
  const variants = formData.variants || [];

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-md overflow-hidden">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Variant Studio</h2>
          <p className="mt-1 text-xs text-white/50">Manage SKUs, sizing, colors, and stock in a spreadsheet view.</p>
        </div>
        <button
          type="button"
          onClick={addVariant}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-white/10"
        >
          <Plus className="h-4 w-4" />
          Add Variant
        </button>
      </div>

      <div className="mb-4 rounded-xl border border-white/10 bg-black/30 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="text-white/60">
              Total stock: <strong className="text-[#D4AF37]">{variantStockSummary.totalStock}</strong>
            </span>
            <span className="text-white/40">·</span>
            <span className="text-white/60">
              {variantStockSummary.variantCount} variant{variantStockSummary.variantCount === 1 ? '' : 's'}
            </span>
            <span className="text-white/40">·</span>
            <span className="text-white/60">
              {variantStockSummary.uniqueColors} color{variantStockSummary.uniqueColors === 1 ? '' : 's'}
            </span>
            <span className="text-white/40">·</span>
            <span className="text-white/60">
              {variantStockSummary.uniqueSizes} size{variantStockSummary.uniqueSizes === 1 ? '' : 's'}
            </span>
          </div>
          {(variantStockSummary.colorBreakdown.length > 0 || variantStockSummary.sizeBreakdown.length > 0) && (
            <button
              type="button"
              onClick={() => setShowBreakdown((s) => !s)}
              className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[#D4AF37] hover:text-[#D4AF37]/80"
            >
              Stock breakdown
              {showBreakdown ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          )}
        </div>

        {showBreakdown && (
          <div className="mt-3 grid gap-3 border-t border-white/5 pt-3 sm:grid-cols-2">
            {variantStockSummary.colorBreakdown.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] uppercase tracking-wider text-white/40">By color</p>
                <div className="flex flex-wrap gap-1.5">
                  {variantStockSummary.colorBreakdown.map(({ color, stock }) => (
                    <span
                      key={color}
                      className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/80"
                    >
                      {color}: <span className="font-semibold text-[#D4AF37]">{stock}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
            {variantStockSummary.sizeBreakdown.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] uppercase tracking-wider text-white/40">By size</p>
                <div className="flex flex-wrap gap-1.5">
                  {variantStockSummary.sizeBreakdown.map(({ size, stock }) => (
                    <span
                      key={size}
                      className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/80"
                    >
                      {size}: <span className="font-semibold text-[#D4AF37]">{stock}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {validationErrors.variants && (
        <p className="mb-3 text-sm text-rose-400">{validationErrors.variants}</p>
      )}

      <div className="w-full" data-lenis-prevent="true">
        <table className="w-full text-left text-sm text-white">
          <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-white/50">
            <tr>
              <th className="px-2 py-3 font-medium">SKU</th>
              <th className="px-2 py-3 font-medium">Image</th>
              <th className="px-2 py-3 font-medium">Size</th>
              <th className="px-2 py-3 font-medium">Color</th>
              <th className="px-2 py-3 font-medium">Hex</th>
              <th className="px-2 py-3 font-medium">Stock</th>
              <th className="px-2 py-3 font-medium">Price Adj.</th>
              <th className="px-2 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {variants.map((variant, index) => {
              const linkedImage = getImageForVariantColor(images, variant.color);
              const sizeValue = SIZE_OPTIONS.includes(variant.size)
                ? variant.size
                : variant.size
                  ? CUSTOM_OPTION
                  : '';

              return (
                <tr key={variant.id || `variant-${index}`} className="group transition-colors hover:bg-white/[0.02]">
                  <td className="p-1 px-2">
                    <LuxuryInput
                      value={variant.sku}
                      onChange={(e) => updateVariant(variant.id, 'sku', e.target.value)}
                      className="font-mono text-sm py-1.5"
                      placeholder="Auto or type"
                    />
                    {!variant.sku && formData.artNo && (
                      <button
                        type="button"
                        onClick={() =>
                          updateVariant(variant.id, 'sku', generateSku(formData.artNo, variant.size, variant.color))
                        }
                        className="mt-1 text-xs text-[#D4AF37] opacity-0 transition-opacity hover:underline group-hover:opacity-100"
                      >
                        Generate SKU
                      </button>
                    )}
                  </td>
                  <td className="p-1 px-2">
                    <div
                      className="relative h-8 w-8 overflow-hidden rounded-md border border-white/20 bg-black/40"
                      title={
                        linkedImage
                          ? `Linked to ${variant.color} media`
                          : 'Assign color tag in Media Studio to link image'
                      }
                    >
                      {linkedImage?.url ? (
                        <img src={linkedImage.url} alt={variant.color || 'Variant'} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-white/30">
                          <ImageIcon className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-1 px-2">
                    <div className="flex flex-col gap-1">
                      <LuxurySelect
                        value={sizeValue}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val !== CUSTOM_OPTION) {
                            updateVariant(variant.id, 'size', val);
                          }
                        }}
                        className="w-20 py-1.5 text-sm"
                      >
                        <option value="" className="bg-[#0f1014] text-white">—</option>
                        {SIZE_OPTIONS.map((s) => (
                          <option key={s} value={s} className="bg-[#0f1014] text-white">{s}</option>
                        ))}
                        <option value={CUSTOM_OPTION} className="bg-[#0f1014] text-[#D4AF37]">Custom</option>
                      </LuxurySelect>
                      {(sizeValue === CUSTOM_OPTION || (variant.size && !SIZE_OPTIONS.includes(variant.size))) && (
                        <LuxuryInput
                          value={variant.size}
                          onChange={(e) => updateVariant(variant.id, 'size', e.target.value)}
                          className="w-20 py-1 text-xs"
                          placeholder="Size"
                        />
                      )}
                    </div>
                  </td>
                  <td className="p-1 px-2">
                    <div className="flex flex-col gap-1">
                      <LuxurySelect
                        value={COLOR_OPTIONS.some((c) => c.name === variant.color) ? variant.color : variant.color ? 'Custom' : ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val !== 'Custom') {
                            updateVariant(variant.id, 'color', val);
                          } else {
                            updateVariant(variant.id, 'color', 'Custom Color');
                          }
                        }}
                        className="w-24 py-1.5 text-sm"
                      >
                        <option value="" className="bg-[#0f1014] text-white">Select...</option>
                        {COLOR_OPTIONS.map((c) => (
                          <option key={c.name} value={c.name} className="bg-[#0f1014] text-white">{c.name}</option>
                        ))}
                        <option value="Custom" className="bg-[#0f1014] text-[#D4AF37]">Custom / Other...</option>
                      </LuxurySelect>
                      {!COLOR_OPTIONS.some((c) => c.name === variant.color) && variant.color && (
                        <LuxuryInput
                          value={variant.color}
                          onChange={(e) => updateVariant(variant.id, 'color', e.target.value)}
                          className="w-24 py-1 text-xs"
                          placeholder="Color Name"
                        />
                      )}
                    </div>
                  </td>
                  <td className="p-1 px-2">
                    <div className="flex items-center gap-1">
                      <input
                        type="color"
                        value={variant.colorCode || '#000000'}
                        onChange={(e) => updateVariant(variant.id, 'colorCode', e.target.value)}
                        className="h-7 w-7 cursor-pointer rounded-md border border-white/20 bg-transparent p-0 outline-none"
                      />
                      <LuxuryInput
                        value={variant.colorCode}
                        onChange={(e) => updateVariant(variant.id, 'colorCode', e.target.value)}
                        className="w-20 py-1.5 font-mono text-sm"
                        placeholder="#000000"
                      />
                    </div>
                  </td>
                  <td className="p-1 px-2">
                    <LuxuryInput
                      type="number"
                      value={variant.stock}
                      onChange={(e) => updateVariant(variant.id, 'stock', e.target.value)}
                      className="w-16 py-1.5 text-sm"
                      placeholder="0"
                    />
                  </td>
                  <td className="p-1 px-2">
                    <LuxuryInput
                      type="number"
                      value={variant.priceAdjustment}
                      onChange={(e) => updateVariant(variant.id, 'priceAdjustment', e.target.value)}
                      className="w-16 py-1.5 text-sm"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="p-1 px-2 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => duplicateVariant(variant.id)}
                        className="rounded p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
                        title="Duplicate Variant"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
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
              );
            })}
          </tbody>
        </table>
        {variants.length === 0 && (
          <div className="py-8 text-center text-sm text-white/50">
            No variants configured. Click &quot;Add Variant&quot; to start.
          </div>
        )}
      </div>
    </div>
  );
};
