import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';

const ProductFormContext = createContext(null);

export const COLOR_OPTIONS = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Navy", hex: "#1B2A4A" },
  { name: "Charcoal", hex: "#36454F" },
  { name: "Olive", hex: "#556B2F" },
  { name: "Cream", hex: "#FFFDD0" },
  { name: "Sand", hex: "#C2B280" },
  { name: "Burgundy", hex: "#800020" },
  { name: "Forest Green", hex: "#228B22" },
  { name: "Tan", hex: "#D2B48C" },
  { name: "Grey", hex: "#808080" },
  { name: "Red", hex: "#B22222" },
  { name: "Royal Blue", hex: "#4169E1" },
  { name: "Camel", hex: "#C19A6B" },
  { name: "Sage", hex: "#B2AC88" },
  { name: "Rust", hex: "#B7410E" },
  { name: "Gold", hex: "#D4AF37" },
  { name: "Pink", hex: "#FFB6C1" },
  { name: "Lavender", hex: "#E6E6FA" },
];

export const generateSku = (artNo, size, color) => {
  if (!artNo) return "";
  const parts = [artNo.trim().toUpperCase()];
  if (size) parts.push(size.toUpperCase().replace(/\s+/g, ""));
  if (color) parts.push(color.toUpperCase().replace(/\s+/g, "").slice(0, 3));
  return parts.join("-");
};

export const defaultVariant = {
  id: crypto.randomUUID(),
  sku: "",
  size: "",
  color: "",
  colorCode: "",
  stock: "0",
  priceAdjustment: "0",
};

export const initialProductForm = {
  name: "",
  artNo: "",
  description: "",
  story: "",
  fabric: "",
  gsm: "",
  fitType: "",
  careInstructions: "",
  sizeGuide: "",
  brand: "Sovereign Elite",
  category: "",
  categoryId: "",
  subCategory: "",
  categoryPath: "",
  drop: "",
  basePrice: "0",
  discountPercent: "0",
  costPrice: "0",
  maxPerUser: "",
  lowStockThreshold: "5",
  isFeatured: false,
  isActive: true,
  isLimited: false,
  tags: [],
  variants: [{ ...defaultVariant }],
};

export const ProductFormProvider = ({ children, initialData = null, initialImages = [], isDraftMode = false }) => {
  const [formData, setFormData] = useState(initialData || initialProductForm);
  const [images, setImages] = useState(initialImages);
  const [removedImages, setRemovedImages] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Auto-save the form to localStorage every ~600ms while creating a NEW product (isDraftMode).
  useEffect(() => {
    if (!isDraftMode) return undefined;
    const id = setTimeout(() => {
      try {
        localStorage.setItem("saga.admin.product.draft", JSON.stringify(formData));
      } catch {
        /* quota or disabled — silent */
      }
    }, 600);
    return () => clearTimeout(id);
  }, [formData, isDraftMode]);

  const updateField = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error when typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [validationErrors]);

  const addVariant = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, { ...defaultVariant, id: crypto.randomUUID() }]
    }));
  }, []);

  const updateVariant = useCallback((id, field, value) => {
    setFormData((prev) => {
      const updatedVariants = prev.variants.map((v) => {
        if (v.id !== id) return v;
        const variant = { ...v, [field]: value };
        
        if (field === "color") {
          const preset = COLOR_OPTIONS.find((c) => c.name.toLowerCase() === value.toLowerCase());
          if (preset) variant.colorCode = preset.hex;
        }

        if (field === "size" || field === "color") {
          const currentAuto = generateSku(prev.artNo, v.size, v.color);
          if (!variant.sku || variant.sku === currentAuto) {
            variant.sku = generateSku(prev.artNo, variant.size, variant.color);
          }
        }
        return variant;
      });
      return { ...prev, variants: updatedVariants };
    });
  }, []);

  const removeVariant = useCallback((id) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((v) => v.id !== id)
    }));
  }, []);

  // Health Score Calculation
  const healthScore = useMemo(() => {
    let score = 0;
    let totalFields = 10;
    
    if (formData.name?.length > 3) score++;
    if (formData.description?.length > 20) score++;
    if (formData.basePrice > 0) score++;
    if (images.length > 0) score++;
    if (formData.categoryId) score++;
    if (formData.artNo) score++;
    if (formData.fabric) score++;
    if (formData.variants?.length > 0 && formData.variants[0].sku) score++;
    if (formData.variants?.some(v => parseInt(v.stock) > 0)) score++;
    if (formData.tags?.length > 0) score++;

    return Math.round((score / totalFields) * 100);
  }, [formData, images]);

  // Margin Calculation
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
      margin: margin.toFixed(1)
    };
  }, [formData.basePrice, formData.costPrice, formData.discountPercent]);

  const value = {
    formData,
    setFormData,
    updateField,
    addVariant,
    updateVariant,
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
    marginAnalytics
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
    throw new Error("useProductForm must be used within a ProductFormProvider");
  }
  return context;
};
