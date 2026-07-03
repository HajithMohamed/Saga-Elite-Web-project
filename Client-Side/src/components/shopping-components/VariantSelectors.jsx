import React from "react";
import { cn } from "@/lib/utils";
import {
  ColorSwatch,
  Eyebrow,
  FieldError,
  SizeChip,
  resolveColor,
} from "@/components/ui/editorial";

// Re-export for back-compat — older consumers may import from here.
export const resolveColorValue = resolveColor;

const normalizeLabel = (value = "") => value.trim().toLowerCase();
const uniqueValues = (values = []) => [...new Set(values.filter(Boolean))];

export const getProductSizes = (product = {}) => {
  const directSizes = Array.isArray(product.sizes) ? product.sizes : [];
  if (directSizes.length) return uniqueValues(directSizes);
  return uniqueValues((product.variants || []).map((v) => v?.size));
};

export const getColorsForSize = (product = {}, size) => {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const filtered = size ? variants.filter((v) => v?.size === size) : variants;
  return uniqueValues(filtered.map((v) => v?.color));
};

export const getVariantBySelection = (product = {}, size, color) =>
  (product.variants || []).find(
    (v) => v?.size === size && v?.color === color
  );

const sizeHasStock = (product = {}, size) =>
  (product.variants || [])
    .filter((v) => v?.size === size)
    .some((v) => Number(v?.stock || 0) > 0);

const colorHasStock = (product = {}, size, color) =>
  (product.variants || [])
    .filter((v) => v?.size === size && v?.color === color)
    .some((v) => Number(v?.stock || 0) > 0);

const VariantSelectors = ({
  product,
  selectedSize,
  selectedColor,
  onSizeChange,
  onColorChange,
  errors = {},
  disabled = false,
  hideColors = false,
  className,
}) => {
  const sizes = Array.isArray(product?.sizes) && product.sizes.length > 0 
    ? product.sizes 
    : getProductSizes(product);
  const colors = getColorsForSize(product, selectedSize);

  return (
    <div className={cn("space-y-8", className)}>
      {/* SIZE */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <Eyebrow tone="gold" size="xs">Size</Eyebrow>
          <a
            href="#size-guide"
            className="se-label text-[9px] tracking-[0.28em] text-[#99907c] hover:text-[#f2ca50] transition-colors"
          >
            Size guide →
          </a>
        </div>
        <div className="inline-flex flex-wrap gap-px bg-[#4d4635]/40 p-px">
          {sizes.map((size) => {
            const hasStock = sizeHasStock(product, size);
            const isSelected = size === selectedSize;
            return (
              <SizeChip
                key={size}
                value={size}
                selected={isSelected}
                disabled={disabled || (!hasStock && !isSelected)}
                onClick={() => onSizeChange?.(size)}
              />
            );
          })}
        </div>
        <FieldError>{errors.size}</FieldError>
      </div>

      {/* COLOR */}
      {!hideColors && (
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <Eyebrow tone="gold" size="xs">Colour</Eyebrow>
            {selectedColor && (
              <Eyebrow tone="muted" size="xs">{selectedColor}</Eyebrow>
            )}
          </div>
          {colors.length === 0 ? (
            <p className="se-body text-xs text-[#574500]">
              Select a size to view available colours.
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              {colors.map((color) => {
                const isSelected = color === selectedColor;
                const hasStock = colorHasStock(product, selectedSize, color);
                const isDisabled = disabled || (!hasStock && !isSelected);
                return (
                  <ColorSwatch
                    key={color}
                    color={color}
                    label={color}
                    size={28}
                    selected={isSelected}
                    disabled={isDisabled}
                    onClick={() => onColorChange?.(color)}
                  />
                );
              })}
            </div>
          )}
          <FieldError>{errors.color}</FieldError>
        </div>
      )}
    </div>
  );
};

export default VariantSelectors;
