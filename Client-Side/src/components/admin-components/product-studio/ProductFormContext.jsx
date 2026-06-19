import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';

const ProductFormContext = createContext(null);

export const PRODUCT_DRAFT_KEY = 'saga.admin.product.draft';
export const CUSTOM_OPTION = '__custom__';

export const SIZE_OPTIONS = [
  'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'FREE',
  '36', '38', '40', '42', '44', '46', '48', '50',
];

export const MATERIAL_OPTIONS = [
  'Cotton', 'Organic Cotton', 'Linen', 'Linen Blend', 'Denim', 'Jersey',
  'French Terry', 'Fleece', 'Twill', 'Wool', 'Silk', 'Rayon', 'Viscose',
  'Polyester', 'Nylon', 'Spandex', 'Tencel', 'Bamboo', 'Leather',
];

export const GSM_OPTIONS = [
  '120', '140', '160', '180', '200', '220', '240', '260', '280',
  '300', '320', '340', '360', '380', '400',
];

export const PRODUCT_TAG_OPTIONS = [
  'LIMITED', 'RARE', 'TRENDING', 'NEW DROP', 'BESTSELLER',
];

export const FIT_OPTIONS = [
  'Oversized Fit', 'Regular Fit', 'Slim Fit', 'Relaxed Fit', 
  'Boxy Fit', 'Tailored Fit', 'Cropped Fit', 'Athletic Fit'
];

export const CARE_INSTRUCTION_OPTIONS = [
  { id: 'wash-cold', label: 'Machine wash cold (30°C)', icon: 'Waves' },
  { id: 'wash-inside-out', label: 'Turn garment inside out before washing', icon: 'RotateCw' },
  { id: 'similar-colors', label: 'Wash with similar colors', icon: 'Palette' },
  { id: 'no-bleach', label: 'Do not use bleach', icon: 'DropletOff' },
  { id: 'no-tumble-dry', label: 'Do not tumble dry on high heat', icon: 'Wind' },
  { id: 'hang-dry', label: 'Hang dry for best fabric longevity', icon: 'Sun' },
  { id: 'iron-low', label: 'Iron on low to medium heat if needed', icon: 'Thermometer' },
  { id: 'no-iron-print', label: 'Do not iron directly on printed labels or graphics', icon: 'Ban' },
  { id: 'no-sunlight', label: 'Avoid prolonged direct sunlight when drying', icon: 'CloudSun' },
  { id: 'dry-clean', label: 'Dry clean recommended', icon: 'Sparkles' }
];

export const buildSizeGuideTemplate = (title) => [
  `${title} size guide`,
  '',
  'Size | Chest (cm) | Length (cm)',
  'XS | 86-91 | 66',
  'S | 91-96 | 68',
  'M | 96-101 | 70',
  'L | 101-106 | 72',
  'XL | 106-111 | 74',
  'XXL | 111-116 | 76',
  '',
  'Measurements are approximate and may vary by style.',
].join('\n');

export const SIZE_GUIDE_PRESETS = [
  { value: 'Sri Lanka', label: 'Sri Lanka', guide: buildSizeGuideTemplate('Sri Lanka') },
  { value: 'India', label: 'India', guide: buildSizeGuideTemplate('India') },
  { value: 'United States', label: 'United States', guide: buildSizeGuideTemplate('United States') },
  { value: 'United Kingdom', label: 'United Kingdom', guide: buildSizeGuideTemplate('United Kingdom') },
  { value: 'European Union', label: 'European Union', guide: buildSizeGuideTemplate('European Union') },
  { value: 'Australia', label: 'Australia', guide: buildSizeGuideTemplate('Australia') },
];

export const findPresetByValue = (value, presets) =>
  presets.find((preset) => preset.value === value) || null;

export const parseSizeGuideTable = (guideText = '') => {
  const lines = String(guideText || '').split('\n').map((l) => l.trim()).filter(Boolean);
  const tableLines = lines.filter((line) => line.includes('|'));
  if (tableLines.length < 2) return null;

  const rows = tableLines.map((line) =>
    line.split('|').map((cell) => cell.trim()).filter(Boolean)
  );
  if (rows.length < 2) return null;

  const [header, ...body] = rows;
  return { header, body };
};

export const normalizeColorKey = (value = '') => String(value || '').trim().toLowerCase();

export const getImageForVariantColor = (images = [], color = '') => {
  const colorKey = normalizeColorKey(color);
  if (!colorKey) return null;
  return images.find((image) => normalizeColorKey(image?.colorTag) === colorKey) || null;
};

export const computeVariantStockSummary = (variants = []) => {
  const colorMap = new Map();
  const sizeMap = new Map();
  let totalStock = 0;

  variants.forEach((v) => {
    const stock = Number(v.stock) || 0;
    totalStock += stock;

    const color = String(v.color || '').trim();
    if (color) {
      colorMap.set(color, (colorMap.get(color) || 0) + stock);
    }

    const size = String(v.size || '').trim();
    if (size) {
      sizeMap.set(size, (sizeMap.get(size) || 0) + stock);
    }
  });

  const colorBreakdown = [...colorMap.entries()].map(([color, stock]) => ({ color, stock }));
  const sizeBreakdown = [...sizeMap.entries()].map(([size, stock]) => ({ size, stock }));

  return {
    totalStock,
    variantCount: variants.length,
    uniqueColors: colorMap.size,
    uniqueSizes: sizeMap.size,
    colorBreakdown,
    sizeBreakdown,
  };
};

export const validateProductFormData = (data) => {
  const errors = {};
  if (!data.name?.trim()) errors.name = 'Product name is required.';
  if (!data.category?.trim() && !data.categoryId?.trim()) errors.category = 'Category is required.';
  if (data.basePrice === '' || data.basePrice === null || Number(data.basePrice) < 0) {
    errors.basePrice = 'Base price must be 0 or greater.';
  }

  const validVariants = (data.variants || []).filter(
    (v) =>
      v.size?.trim() &&
      v.color?.trim() &&
      v.stock !== '' &&
      v.stock !== null &&
      v.stock !== undefined
  );

  if (validVariants.length === 0) {
    errors.variants = 'At least one variant with size, color, and stock is required.';
  } else {
    const partialCount = (data.variants || []).length - validVariants.length;
    if (partialCount > 0) {
      errors.variants = 'Each variant needs size, color, and stock. Remove or complete partial rows.';
    }
  }

  const firstError = Object.values(errors)[0] || null;
  return { errors, firstError };
};

export const COLOR_OPTIONS = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Navy', hex: '#1B2A4A' },
  { name: 'Charcoal', hex: '#36454F' },
  { name: 'Olive', hex: '#556B2F' },
  { name: 'Cream', hex: '#FFFDD0' },
  { name: 'Sand', hex: '#C2B280' },
  { name: 'Burgundy', hex: '#800020' },
  { name: 'Forest Green', hex: '#228B22' },
  { name: 'Tan', hex: '#D2B48C' },
  { name: 'Grey', hex: '#808080' },
  { name: 'Red', hex: '#B22222' },
  { name: 'Royal Blue', hex: '#4169E1' },
  { name: 'Camel', hex: '#C19A6B' },
  { name: 'Sage', hex: '#B2AC88' },
  { name: 'Rust', hex: '#B7410E' },
  { name: 'Gold', hex: '#D4AF37' },
  { name: 'Pink', hex: '#FFB6C1' },
  { name: 'Lavender', hex: '#E6E6FA' },
];

export const generateSku = (artNo, size, color) => {
  if (!artNo) return '';
  const parts = [artNo.trim().toUpperCase()];
  if (size) parts.push(size.toUpperCase().replace(/\s+/g, ''));
  if (color) parts.push(color.toUpperCase().replace(/\s+/g, '').slice(0, 3));
  return parts.join('-');
};

export const defaultVariant = {
  id: crypto.randomUUID(),
  sku: '',
  size: '',
  color: '',
  colorCode: '',
  stock: '0',
  priceAdjustment: '0',
};

export const initialProductForm = {
  name: '',
  artNo: '',
  description: '',
  story: '',
  fabric: '',
  gsm: '',
  fitType: '',
  careInstructions: '',
  sizeGuide: '',
  brand: 'Sovereign Elite',
  category: '',
  categoryId: '',
  subCategory: '',
  categoryPath: '',
  drop: '',
  basePrice: '0',
  discountPercent: '0',
  costPrice: '0',
  maxPerUser: '',
  lowStockThreshold: '5',
  isFeatured: false,
  isActive: true,
  isLimited: false,
  tags: [],
  variants: [{ ...defaultVariant, id: crypto.randomUUID() }],
};

const stableStringify = (value) => JSON.stringify(value);

export const ProductFormProvider = ({
  children,
  initialData = null,
  initialImages = [],
  isDraftMode = false,
}) => {
  const [formData, setFormData] = useState(initialData || initialProductForm);
  const [images, setImages] = useState(initialImages);
  const [removedImages, setRemovedImages] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const baselineFormRef = useRef(stableStringify(initialData || initialProductForm));
  const baselineImagesRef = useRef(stableStringify(initialImages));

  useEffect(() => {
    baselineFormRef.current = stableStringify(initialData || initialProductForm);
    baselineImagesRef.current = stableStringify(initialImages);
  }, [initialData, initialImages]);

  useEffect(() => {
    setImages(initialImages);
  }, [initialImages]);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  useEffect(() => {
    if (!isDraftMode) return undefined;
    const id = setTimeout(() => {
      try {
        localStorage.setItem(PRODUCT_DRAFT_KEY, JSON.stringify(formData));
      } catch {
        /* quota or disabled — silent */
      }
    }, 600);
    return () => clearTimeout(id);
  }, [formData, isDraftMode]);

  const updateField = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setValidationErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const addVariant = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, { ...defaultVariant, id: crypto.randomUUID() }],
    }));
  }, []);

  const updateVariant = useCallback((id, field, value) => {
    setFormData((prev) => {
      const updatedVariants = prev.variants.map((v) => {
        if (v.id !== id) return v;
        const variant = { ...v, [field]: value };

        if (field === 'color') {
          const preset = COLOR_OPTIONS.find((c) => c.name.toLowerCase() === value.toLowerCase());
          if (preset) variant.colorCode = preset.hex;
        }

        if (field === 'size' || field === 'color') {
          const currentAuto = generateSku(prev.artNo, v.size, v.color);
          if (!variant.sku || variant.sku === currentAuto) {
            variant.sku = generateSku(prev.artNo, variant.size, variant.color);
          }
        }
        return variant;
      });
      return { ...prev, variants: updatedVariants };
    });
    setValidationErrors((prev) => {
      if (!prev.variants) return prev;
      const next = { ...prev };
      delete next.variants;
      return next;
    });
  }, []);

  const duplicateVariant = useCallback((id) => {
    setFormData((prev) => {
      const source = prev.variants.find((v) => v.id === id);
      if (!source) return prev;
      const copy = {
        ...source,
        id: crypto.randomUUID(),
        sku: generateSku(prev.artNo, source.size, source.color),
      };
      return { ...prev, variants: [...prev.variants, copy] };
    });
  }, []);

  const removeVariant = useCallback((id) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((v) => v.id !== id),
    }));
  }, []);

  const isDirty = useMemo(
    () =>
      stableStringify(formData) !== baselineFormRef.current ||
      stableStringify(images) !== baselineImagesRef.current,
    [formData, images]
  );

  const variantStockSummary = useMemo(
    () => computeVariantStockSummary(formData.variants || []),
    [formData.variants]
  );

  const healthScore = useMemo(() => {
    let score = 0;
    const totalFields = 10;

    if (formData.name?.length > 3) score++;
    if (formData.description?.length > 20) score++;
    if (formData.basePrice > 0) score++;
    if (images.length > 0) score++;
    if (formData.categoryId) score++;
    if (formData.artNo) score++;
    if (formData.fabric) score++;
    if (formData.variants?.length > 0 && formData.variants[0].sku) score++;
    if (formData.variants?.some((v) => parseInt(v.stock, 10) > 0)) score++;
    if (formData.tags?.length > 0) score++;

    return Math.round((score / totalFields) * 100);
  }, [formData, images]);

  const marginAnalytics = useMemo(() => {
    const basePrice = parseFloat(formData.basePrice) || 0;
    const costPrice = parseFloat(formData.costPrice) || 0;
    const discount = parseFloat(formData.discountPercent) || 0;

    const finalPrice = basePrice * (1 - discount / 100);
    const profit = finalPrice - costPrice;
    const margin = finalPrice > 0 ? (profit / finalPrice) * 100 : 0;

    return {
      finalPrice: finalPrice.toFixed(2),
      profit: profit.toFixed(2),
      margin: margin.toFixed(1),
    };
  }, [formData.basePrice, formData.costPrice, formData.discountPercent]);

  const value = {
    formData,
    setFormData,
    updateField,
    addVariant,
    updateVariant,
    duplicateVariant,
    removeVariant,
    images,
    setImages,
    removedImages,
    setRemovedImages,
    isSaving,
    setIsSaving,
    validationErrors,
    setValidationErrors,
    healthScore,
    marginAnalytics,
    variantStockSummary,
    isDirty,
    isDraftMode,
  };

  return (
    <ProductFormContext.Provider value={value}>
      {children}
    </ProductFormContext.Provider>
  );
};

export const useProductForm = () => {
  const context = useContext(ProductFormContext);
  if (!context) {
    throw new Error('useProductForm must be used within a ProductFormProvider');
  }
  return context;
};
