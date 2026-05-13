import React, { useState, useEffect } from "react";
import { ColorSwatch, SizeChip, Eyebrow } from "@/components/ui/editorial";
import PriceRangeSlider from "./PriceRangeSlider";
import axios from 'axios';
import { API_V1_URL as API_BASE } from '@/lib/api';

const COMMON_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const COMMON_COLORS = [
  "Black", "Ivory", "Gold", "Olive", "Crimson", "Navy", "Charcoal", "Sand"
];

const FilterSidebar = ({
  selectedColors = [],
  selectedSizes = [],
  priceRange = [0, 50000],
  onToggleColor,
  onToggleSize,
  onChangePrice,
  onClearAll,
  priceMin = 0,
  priceMax = 50000,
}) => {
  const [drops, setDrops] = useState([]);

  useEffect(() => {
    const fetchDrops = async () => {
      try {
        const response = await axios.get(`${API_BASE}/drops/get-all-drops`);
        if (response.data?.success) {
          setDrops(response.data.data || []);
        }
      } catch (err) {
        console.error("Failed to load drops", err);
      }
    };
    fetchDrops();
  }, []);

  return (
    <div className="w-full h-full bg-[#0a0a0a]/60 backdrop-blur-xl border border-[#D4AF37]/15 rounded-lg p-6 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between mx-auto mb-8 border-b border-[#D4AF37]/15 pb-4">
        <h2 className="text-white text-sm font-sans tracking-[0.2em] uppercase font-bold">
          Filter + Sort
        </h2>
        {(selectedColors.length > 0 ||
          selectedSizes.length > 0 ||
          priceRange[0] > priceMin ||
          priceRange[1] < priceMax) && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-[10px] tracking-widest uppercase text-[#99907c] hover:text-[#f2ca50] transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      <div className="space-y-8">
        {/* Category drops (Visual only for now, could be wired up to filter) */}
        <div>
          <Eyebrow tone="muted" size="xs" className="mb-4">
            Collections
          </Eyebrow>
          <div className="space-y-2">
            {Array.isArray(drops) && drops.map((d) => (
              <label key={d._id} className="flex items-center gap-3 group cursor-pointer">
                <div className="w-4 h-4 border border-[#4d4635] rounded-sm group-hover:border-[#D4AF37] flex items-center justify-center transition-colors">
                   {/* Checkbox visual placeholder */}
                </div>
                <span className="text-xs text-[#e5e2e1] uppercase tracking-wider">{d.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Size */}
        <div>
          <Eyebrow tone="muted" size="xs" className="mb-4 flex justify-between items-center">
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
                size={24}
                selected={selectedColors.includes(c.toLowerCase())}
                onClick={() => onToggleColor?.(c.toLowerCase())}
              />
            ))}
          </div>
        </div>

        {/* Price */}
        <div>
          <Eyebrow tone="muted" size="xs" className="mb-4">
            Price Range
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
    </div>
  );
};

export default FilterSidebar;
