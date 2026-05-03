import React from "react";

import { cn } from "@/lib/utils";

const COLOR_VALUE_MAP = {
  black: "#111111",
  white: "#f5f5f5",
  ivory: "#fff8e7",
  cream: "#f4ead3",
  beige: "#d6c3a5",
  tan: "#c19a6b",
  brown: "#6f4e37",
  gold: "#d4af37",
  silver: "#c0c0c0",
  gray: "#808080",
  grey: "#808080",
  charcoal: "#36454f",
  slate: "#708090",
  navy: "#1f3a5f",
  blue: "#2563eb",
  sky: "#38bdf8",
  green: "#15803d",
  olive: "#556b2f",
  red: "#dc2626",
  maroon: "#800000",
  burgundy: "#800020",
  pink: "#ec4899",
  rose: "#f43f5e",
  purple: "#7c3aed",
  yellow: "#eab308",
  orange: "#f97316",
  sand: "#c2b280",
  stone: "#a8a29e",
  offwhite: "#f8f4e8",
  "off-white": "#f8f4e8",
  "off white": "#f8f4e8",
};

const normalizeLabel = (value = "") => value.trim().toLowerCase();

const uniqueValues = (values = []) => [...new Set(values.filter(Boolean))];

export const resolveColorValue = (colorName = "") => {
  const normalized = normalizeLabel(colorName);

  if (!normalized) {
    return "#9ca3af";
  }

  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(normalized)) {
    return normalized;
  }

  return COLOR_VALUE_MAP[normalized] || colorName || "#9ca3af";
};

export const getProductSizes = (product = {}) => {
  const directSizes = Array.isArray(product.sizes) ? product.sizes : [];
  if (directSizes.length) {
    return uniqueValues(directSizes);
  }

  return uniqueValues((product.variants || []).map((variant) => variant?.size));
};

export const getColorsForSize = (product = {}, size) => {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const filteredVariants = size
    ? variants.filter((variant) => variant?.size === size)
    : variants;

  return uniqueValues(filteredVariants.map((variant) => variant?.color));
};

export const getVariantBySelection = (product = {}, size, color) =>
  (product.variants || []).find(
    (variant) => variant?.size === size && variant?.color === color
  );

const sizeHasStock = (product = {}, size) =>
  (product.variants || [])
    .filter((variant) => variant?.size === size)
    .some((variant) => Number(variant?.stock || 0) > 0);

const colorHasStock = (product = {}, size, color) =>
  (product.variants || [])
    .filter((variant) => variant?.size === size && variant?.color === color)
    .some((variant) => Number(variant?.stock || 0) > 0);

const fieldClassName =
  "min-h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition-colors focus:border-[#D4AF37] focus:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

const VariantSelectors = ({
  product,
  selectedSize,
  selectedColor,
  onSizeChange,
  onColorChange,
  errors = {},
  disabled = false,
  className,
}) => {
  const sizes = getProductSizes(product);
  const colors = getColorsForSize(product, selectedSize);
  const useColorSelect = colors.length > 4;
  const sizeDisabled = disabled || sizes.length <= 1;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <label className="block text-[11px] font-bold uppercase tracking-[0.24em] text-gray-400">
          Size
        </label>
        <select
          value={selectedSize || ""}
          onChange={(event) => onSizeChange?.(event.target.value)}
          disabled={sizeDisabled}
          aria-invalid={Boolean(errors.size)}
          className={cn(fieldClassName, errors.size && "border-red-500/70")}
        >
          {sizes.length > 1 && !selectedSize ? (
            <option value="" disabled className="text-black">
              Select a size
            </option>
          ) : null}
          {sizes.map((size) => {
            const hasStock = sizeHasStock(product, size);
            const isCurrent = size === selectedSize;

            return (
              <option
                key={size}
                value={size}
                disabled={!hasStock && !isCurrent}
                className="text-black"
              >
                {size}
                {!hasStock && !isCurrent ? " (Out of stock)" : ""}
              </option>
            );
          })}
        </select>
        {errors.size ? (
          <p className="text-sm text-red-400">{errors.size}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="block text-[11px] font-bold uppercase tracking-[0.24em] text-gray-400">
          Color
        </label>

        {useColorSelect ? (
          <select
            value={selectedColor || ""}
            onChange={(event) => onColorChange?.(event.target.value)}
            disabled={disabled || colors.length <= 1}
            aria-invalid={Boolean(errors.color)}
            className={cn(fieldClassName, errors.color && "border-red-500/70")}
          >
            {colors.length > 1 && !selectedColor ? (
              <option value="" disabled className="text-black">
                Select a color
              </option>
            ) : null}
            {colors.map((color) => {
              const hasStock = colorHasStock(product, selectedSize, color);
              const isCurrent = color === selectedColor;

              return (
                <option
                  key={color}
                  value={color}
                  disabled={!hasStock && !isCurrent}
                  className="text-black"
                >
                  {color}
                  {!hasStock && !isCurrent ? " (Out of stock)" : ""}
                </option>
              );
            })}
          </select>
        ) : (
          <div className="flex flex-wrap gap-3">
            {colors.map((color) => {
              const isSelected = color === selectedColor;
              const hasStock = colorHasStock(product, selectedSize, color);
              const isDisabled = disabled || (!hasStock && !isSelected);

              return (
                <button
                  key={color}
                  type="button"
                  title={color}
                  aria-label={`Select color ${color}`}
                  onClick={() => onColorChange?.(color)}
                  disabled={isDisabled}
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full border-2 transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-40",
                    isSelected
                      ? "border-[#D4AF37] bg-[#D4AF37]/10"
                      : "border-white/15 bg-white/5 hover:border-white/35",
                    errors.color && "border-red-500/70"
                  )}
                >
                  <span
                    className="h-6 w-6 rounded-full border border-black/15"
                    style={{ backgroundColor: resolveColorValue(color) }}
                  />
                </button>
              );
            })}
          </div>
        )}

        {!useColorSelect && selectedColor ? (
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
            Selected: {selectedColor}
          </p>
        ) : null}

        {errors.color ? (
          <p className="text-sm text-red-400">{errors.color}</p>
        ) : null}
      </div>
    </div>
  );
};

export default VariantSelectors;
