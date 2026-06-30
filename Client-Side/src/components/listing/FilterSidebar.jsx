import React, { useState, useEffect } from "react";
import { ColorSwatch, SizeChip } from "@/components/ui/editorial";
import PriceRangeSlider from "./PriceRangeSlider";
import axios from 'axios';
import { API_V1_URL as API_BASE } from '@/lib/api';
import { Link, useSearchParams } from "react-router-dom";
import { ChevronDown } from "lucide-react";

const FilterAccordion = ({ title, children, defaultOpen = true }) => (
  <details className="group border-b border-[#4d4635]/30 pb-2 mb-2" open={defaultOpen}>
    <summary className="flex justify-between items-center cursor-pointer list-none py-2 text-[#e5e2e1] text-xs font-sans tracking-[0.1em] uppercase font-bold hover:text-[#f2ca50] transition-colors">
      {title}
      <span className="transition group-open:rotate-180">
        <ChevronDown size={14} className="text-[#99907c]" />
      </span>
    </summary>
    <div className="pt-4 pb-2 overflow-hidden">
      {children}
    </div>
  </details>
);

// A drop is "visible" in the filter when it exists, is active, and has not ended.
const isVisibleDrop = (d, now = Date.now()) => {
  if (!d || d.isActive === false || d.isPublished === false) return false;
  const end = d.endDate ? new Date(d.endDate).getTime() : null;
  if (end && end < now) return false; // expired / archived window
  return true;
};

const FilterSidebar = ({
  selectedColors = [],
  selectedSizes = [],
  selectedBrands = [],
  availableColors = [],
  availableSizes = [],
  availableBrands = [],
  priceRange = [0, 50000],
  onToggleColor,
  onToggleSize,
  onToggleBrand,
  onChangePrice,
  onClearAll,
  priceMin = 0,
  priceMax = 50000,
}) => {
  const [drops, setDrops] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchParams] = useSearchParams();
  const currentCategory = (searchParams.get("category") || "").toLowerCase();

  useEffect(() => {
    const fetchDrops = async () => {
      try {
        const response = await axios.get(`${API_BASE}/drops/get-all-drops`);
        if (response.data?.success) {
          setDrops((response.data.data || []).filter((d) => isVisibleDrop(d)));
        }
      } catch (err) {
        console.error("Failed to load drops", err);
      }
    };
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_BASE}/categories`);
        if (response.data?.success) {
          setCategories((response.data.data || []).filter(c => c.isActive !== false));
        }
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };
    fetchDrops();
    fetchCategories();
  }, []);

  const isCategoryAncestor = (ancestorId, selectedSlug) => {
    const selectedCat = categories.find(c => (c.slug || c.name).toLowerCase() === selectedSlug);
    if (!selectedCat) return false;
    let current = selectedCat;
    while (current.parentCategory) {
      const parentId = typeof current.parentCategory === 'object' && current.parentCategory !== null
        ? current.parentCategory._id
        : current.parentCategory;
      if (parentId === ancestorId) return true;
      current = categories.find(c => c._id === parentId);
      if (!current) break;
    }
    return false;
  };

  const renderCategoryTree = (parentId = null, depth = 0) => {
    const children = categories.filter(c => {
      if (!parentId) return !c.parentCategory;
      const pId = typeof c.parentCategory === 'object' && c.parentCategory !== null
        ? c.parentCategory._id
        : c.parentCategory;
      return pId === parentId;
    });

    if (children.length === 0) return null;

    return (
      <div className={`space-y-2 ${depth > 0 ? 'ml-4 mt-2 border-l border-[#4d4635] pl-4' : ''}`}>
        {children.map(c => {
          const isSelected = currentCategory === (c.slug || c.name).toLowerCase();
          const isExpanded = isSelected || isCategoryAncestor(c._id, currentCategory);

          return (
            <div key={c._id}>
              <Link to={`/shopping/product-list?category=${c.slug || c.name}`} className="flex items-center gap-3 group cursor-pointer">
                <div className={`w-4 h-4 border rounded-sm flex items-center justify-center transition-colors ${isSelected ? 'bg-[#f2ca50] border-[#f2ca50]' : 'border-[#4d4635] group-hover:border-[#D4AF37]'}`}>
                   {isSelected && <span className="w-2 h-2 bg-black rounded-sm" />}
                </div>
                <span className={`text-xs uppercase tracking-wider ${isSelected ? 'text-[#f2ca50]' : 'text-[#e5e2e1]'}`}>{c.name}</span>
              </Link>
              {isExpanded && renderCategoryTree(c._id, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  const hasActive =
    selectedColors.length > 0 ||
    selectedSizes.length > 0 ||
    selectedBrands.length > 0 ||
    priceRange[0] > priceMin ||
    priceRange[1] < priceMax;

  return (
    <div className="w-full bg-[#0a0a0a]/60 backdrop-blur-xl border border-[#D4AF37]/15 rounded-lg p-6">
      <div className="flex items-center justify-between mx-auto mb-8 border-b border-[#D4AF37]/15 pb-4">
        <h2 className="text-white text-sm font-sans tracking-[0.2em] uppercase font-bold">
          Filter + Sort
        </h2>
        {hasActive && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-[10px] tracking-widest uppercase text-[#99907c] hover:text-[#f2ca50] transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      <div className="space-y-2">
        {/* Exclusive Drops — live / visible drops only, linking to each drop page */}
        {drops.length > 0 && (
          <FilterAccordion title="Exclusive Drops">
            <div className="space-y-3">
              {drops.map((d) => (
                <Link
                  to={`/shopping/drop/${d.slug || d._id}`}
                  key={d._id}
                  className="flex items-center gap-3 group cursor-pointer"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f2ca50] shrink-0" />
                  <span className="text-xs uppercase tracking-wider text-[#e5e2e1] group-hover:text-[#f2ca50] transition-colors">
                    {d.name}
                  </span>
                </Link>
              ))}
            </div>
          </FilterAccordion>
        )}

        {/* Categories */}
        {categories.length > 0 && (
          <FilterAccordion title="Categories">
            {renderCategoryTree()}
          </FilterAccordion>
        )}

        {/* Brand — only brands present in the current catalog */}
        {availableBrands.length > 0 && (
          <FilterAccordion title="Brand">
            <div className="space-y-2">
              {availableBrands.map((b) => {
                const key = b.toLowerCase();
                const isSelected = selectedBrands.includes(key);
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => onToggleBrand?.(key)}
                    className="flex items-center gap-3 group cursor-pointer w-full text-left"
                  >
                    <div className={`w-4 h-4 border rounded-sm flex items-center justify-center transition-colors ${isSelected ? 'bg-[#f2ca50] border-[#f2ca50]' : 'border-[#4d4635] group-hover:border-[#D4AF37]'}`}>
                      {isSelected && <span className="w-2 h-2 bg-black rounded-sm" />}
                    </div>
                    <span className={`text-xs uppercase tracking-wider ${isSelected ? 'text-[#f2ca50]' : 'text-[#e5e2e1]'}`}>{b}</span>
                  </button>
                );
              })}
            </div>
          </FilterAccordion>
        )}

        {/* Size — only sizes present in the current catalog */}
        {availableSizes.length > 0 && (
          <FilterAccordion title="Size">
            <div className="flex flex-wrap gap-2">
              {availableSizes.map((s) => (
                <SizeChip
                  key={s}
                  value={s}
                  selected={selectedSizes.includes(s)}
                  onClick={() => onToggleSize?.(s)}
                />
              ))}
            </div>
          </FilterAccordion>
        )}

        {/* Color — only colors present in the current catalog */}
        {availableColors.length > 0 && (
          <FilterAccordion title="Color">
            <div className="flex flex-wrap gap-3">
              {availableColors.map((c) => (
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
          </FilterAccordion>
        )}

        {/* Price */}
        <FilterAccordion title="Price Range">
          <PriceRangeSlider
            min={priceMin}
            max={priceMax}
            step={500}
            value={priceRange}
            onChange={onChangePrice}
          />
        </FilterAccordion>
      </div>
    </div>
  );
};

export default FilterSidebar;
