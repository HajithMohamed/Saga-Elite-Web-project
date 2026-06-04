import React, { useState, useEffect } from "react";
import { ColorSwatch, SizeChip, Eyebrow } from "@/components/ui/editorial";
import PriceRangeSlider from "./PriceRangeSlider";
import axios from 'axios';
import { API_V1_URL as API_BASE } from '@/lib/api';
import { Link, useSearchParams } from "react-router-dom";

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
  const [categories, setCategories] = useState([]);
  const [searchParams] = useSearchParams();
  const currentCategory = (searchParams.get("category") || "").toLowerCase();

  useEffect(() => {
    const fetchDrops = async () => {
      try {
        const response = await axios.get(`${API_BASE}/drops/get-all-drops`);
        if (response.data?.success) {
          setDrops((response.data.data || []).filter(d => d.isActive !== false));
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

  return (
    <div className="w-full bg-[#0a0a0a]/60 backdrop-blur-xl border border-[#D4AF37]/15 rounded-lg p-6">
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
        {/* Category drops */}
        <div>
          <Eyebrow tone="muted" size="xs" className="mb-4">
            Collections
          </Eyebrow>
          <div className="space-y-2">
            {Array.isArray(drops) && drops.map((d) => {
              const isSelected = currentCategory === (d.slug || d.name).toLowerCase();
              return (
                <Link to={`/shopping/product-list?category=${d.slug || d.name}`} key={d._id} className="flex items-center gap-3 group cursor-pointer">
                  <div className={`w-4 h-4 border rounded-sm flex items-center justify-center transition-colors ${isSelected ? 'bg-[#f2ca50] border-[#f2ca50]' : 'border-[#4d4635] group-hover:border-[#D4AF37]'}`}>
                     {isSelected && <span className="w-2 h-2 bg-black rounded-sm" />}
                  </div>
                  <span className={`text-xs uppercase tracking-wider ${isSelected ? 'text-[#f2ca50]' : 'text-[#e5e2e1]'}`}>{d.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div>
            <Eyebrow tone="muted" size="xs" className="mb-4">
              Categories
            </Eyebrow>
            {renderCategoryTree()}
          </div>
        )}

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
