import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ColorSwatch, SizeChip, Eyebrow } from "@/components/ui/editorial";
import PriceRangeSlider from "./PriceRangeSlider";

// Common palette for the Refine row. The catalogue uses a small set of
// recurring colors/sizes — hardcoding them avoids a roundtrip to the API
// for filter options. Extend as the catalogue grows.
const COMMON_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const COMMON_COLORS = [
  "Black",
  "Ivory",
  "Gold",
  "Olive",
  "Crimson",
  "Navy",
  "Charcoal",
  "Sand",
];

const RefineRow = ({
  open,
  selectedColors = [],
  selectedSizes = [],
  priceRange = [0, 50000],
  onToggleColor,
  onToggleSize,
  onChangePrice,
  onClearAll,
  priceMin = 0,
  priceMax = 50000,
}) => (
  <AnimatePresence initial={false}>
    {open ? (
      <motion.div
        key="refine"
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden border-t border-[#4d4635]/30"
      >
        <div className="bg-[#0e0e0e]/80 backdrop-blur-md px-5 md:px-12 max-w-7xl mx-auto py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {/* Color */}
            <div>
              <Eyebrow tone="muted" size="xs" className="mb-4">
                Color
              </Eyebrow>
              <div className="flex flex-wrap gap-3">
                {COMMON_COLORS.map((c) => (
                  <ColorSwatch
                    key={c}
                    color={c}
                    label={c}
                    size={28}
                    selected={selectedColors.includes(c.toLowerCase())}
                    onClick={() => onToggleColor?.(c.toLowerCase())}
                  />
                ))}
              </div>
            </div>

            {/* Size */}
            <div>
              <Eyebrow tone="muted" size="xs" className="mb-4">
                Size
              </Eyebrow>
              <div className="flex flex-wrap gap-2">
                {COMMON_SIZES.map((s) => (
                  <SizeChip
                    key={s}
                    value={s}
                    selected={selectedSizes.includes(s)}
                    onClick={() => onToggleSize?.(s)}
                  />
                ))}
              </div>
            </div>

            {/* Price */}
            <div>
              <Eyebrow tone="muted" size="xs" className="mb-4">
                Price
              </Eyebrow>
              <PriceRangeSlider
                min={priceMin}
                max={priceMax}
                step={500}
                value={priceRange}
                onChange={onChangePrice}
              />
            </div>
          </div>

          {(selectedColors.length > 0 ||
            selectedSizes.length > 0 ||
            priceRange[0] > priceMin ||
            priceRange[1] < priceMax) && (
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={onClearAll}
                className="font-mono text-[10px] tracking-[0.22em] uppercase text-[#99907c] hover:text-[#f2ca50] transition-colors"
              >
                Clear refinements
              </button>
            </div>
          )}
        </div>
      </motion.div>
    ) : null}
  </AnimatePresence>
);

export default RefineRow;
