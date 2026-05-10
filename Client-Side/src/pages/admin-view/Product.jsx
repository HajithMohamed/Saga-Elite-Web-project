import React, { useEffect, useState, useCallback, Fragment } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkUpdateProducts,
} from "@/store/admin/product-slice";
import BulkActionBar from "@/components/admin-components/_shared/BulkActionBar";
import useBulkSelection from "@/hooks/use-bulk-selection";
import { getAllDrops } from "@/store/admin/drop-slice";
import { useToast } from "@/hooks/use-toast";
import ImageUpload from "@/components/admin-components/ImageUpload";
import ImageGalleryModal from "@/components/admin-components/ImageGalleryModal";
import axios from "axios";
import { API_V1_URL as API_BASE } from "@/lib/api";
import {
  Search,
  Settings,
  Bell,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash,
  Package,
  Eye,
  Info,
  DollarSign,
  Layers,
  Image as ImageIcon,
  Tag as TagIcon,
  Sparkles,
} from "lucide-react";
import { AdminPage } from "@/components/admin-components/AdminUI";
import {
  pageVariants,
  containerVariants,
  itemVariants,
} from "@/components/admin-components/_shared/animations";
import { ConfirmInline } from "@/components/admin-components/_shared/ConfirmInline";
import { ToastFlash } from "@/components/admin-components/_shared/ToastFlash";
import { SkeletonGrid } from "@/components/admin-components/_shared/SkeletonCard";
import {
  AdminFormShell,
  StickyActionBar,
  FormSection,
  FormField,
  LuxuryInput,
  LuxuryTextarea,
  LuxurySelect,
  StatusPill,
  RightRailPanel,
  RailToggleRow,
  LivePreviewCard,
  FormTabs,
  ProgressBar,
} from "@/components/admin-components/_form";

// Helper components for visual consistency
const PulseDot = ({ active }) => (
  <span className={`w-2 h-2 ${active ? 'bg-saga-primary animate-pulse' : 'bg-outline-variant'} shrink-0`} />
);

const ToggleSwitch = ({ checked, onChange, activeColor = "bg-primary-container", activeThumb = "bg-on-primary-container" }) => (
  <div onClick={onChange} className={`w-10 h-5 ${checked ? activeColor : 'bg-surface-variant'} relative cursor-pointer transition-colors duration-300`}>
    <div className={`absolute top-0 w-5 h-5 transition-transform duration-300 ${checked ? `right-0 ${activeThumb}` : 'left-0 bg-outline-variant'}`} />
  </div>
);

const defaultVariant = {
  sku: "",
  size: "",
  color: "",
  colorCode: "",
  stock: "0",
  priceAdjustment: "0",
};

const initialProductForm = {
  name: "",
  artNo: "",
  description: "",
  story: "",
  fabric: "",
  gsm: "",
  fitType: "",
  careInstructions: "",
  sizeGuide: "",
  categoryPath: "",
  brand: "Sovereign Elite",
  category: "Unisex",
  drop: "",
  basePrice: "",
  discountPercent: "0",
  costPrice: "",
  maxPerUser: "",
  lowStockThreshold: "",
  isFeatured: false,
  isActive: true,
  isLimited: false,
  tags: [],
  variants: [defaultVariant],
};

const SIZE_OPTIONS = [
  "XS", "S", "M", "L", "XL", "XXL", "3XL", "FREE",
  "36", "38", "40", "42", "44", "46", "48", "50",
];

const COLOR_OPTIONS = [
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

const generateSku = (artNo, size, color) => {
  if (!artNo) return "";
  const parts = [artNo.trim().toUpperCase()];
  if (size) parts.push(size.toUpperCase().replace(/\s+/g, ""));
  if (color) parts.push(color.toUpperCase().replace(/\s+/g, "").slice(0, 3));
  return parts.join("-");
};

// Draft key for the wizard's auto-save. Only used when creating a NEW product
// (editing an existing one always loads server state, never a stale draft).
const PRODUCT_DRAFT_KEY = "saga.admin.product.draft";

const loadProductDraft = () => {
  try {
    const raw = localStorage.getItem(PRODUCT_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
};

const clearProductDraft = () => {
  try {
    localStorage.removeItem(PRODUCT_DRAFT_KEY);
  } catch {
    /* storage disabled — silent */
  }
};

const PRODUCT_TAG_OPTIONS = [
  "LIMITED",
  "RARE",
  "TRENDING",
  "NEW DROP",
  "BESTSELLER",
];

const getErrorMessage = (error, fallback = "Request failed") => {
  if (typeof error === "string") return error;
  return error?.message || error?.error || error?.response?.data?.message || fallback;
};

const Product = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialProductForm);
  const [selectedProductSlug, setSelectedProductSlug] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [productImages, setProductImages] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryTitle, setGalleryTitle] = useState("");
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [deleteConfirmSlug, setDeleteConfirmSlug] = useState(null);
  const [showProductSaved, setShowProductSaved] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState("basic");

  const LIMIT = 10;
  const dispatch = useDispatch();
  const { toast } = useToast();

  const productList = useSelector((state) => state.product.productList || []);
  const isLoading = useSelector((state) => state.product.isLoading);
  const pagination = useSelector((state) => state.product.pagination || {});
  const { drops = [] } = useSelector((state) => state.drop) || {};

  const fetchProducts = useCallback(() => {
    dispatch(
      getAllProducts({
        page: currentPage,
        limit: LIMIT,
        isActive: statusFilter === "all" || statusFilter === "low_stock" ? undefined : statusFilter,
        search: searchQuery,
        maxStock: statusFilter === "low_stock" ? 5 : undefined,
      })
    );
  }, [dispatch, currentPage, statusFilter, searchQuery]);

  useEffect(() => {
    dispatch(getAllDrops());
    fetchProducts();
  }, [dispatch, fetchProducts]);

  // Bulk operations on the product list. Selection wipes when productList
  // identity changes (filter/page change), so stale IDs can't leak through.
  const bulk = useBulkSelection(productList);
  const [bulkPending, setBulkPending] = useState(false);
  const runBulkProductAction = useCallback(
    async (action) => {
      const ids = bulk.selectedIds;
      if (ids.length === 0) return;
      setBulkPending(true);
      try {
        const result = await dispatch(bulkUpdateProducts({ ids, action })).unwrap();
        const ok = result.succeeded?.length || 0;
        const fail = result.failed?.length || 0;
        toast({
          title:
            fail === 0
              ? `Bulk ${action}: ${ok} product${ok === 1 ? "" : "s"}`
              : `Bulk ${action}: ${ok} updated, ${fail} skipped`,
          variant: fail === 0 ? "success" : "destructive",
        });
        bulk.clear();
        fetchProducts();
      } catch (err) {
        toast({
          title: `Bulk ${action} failed`,
          description: typeof err === "string" ? err : "Try again.",
          variant: "destructive",
        });
      } finally {
        setBulkPending(false);
      }
    },
    [bulk, dispatch, fetchProducts, toast]
  );

  const resetForm = () => {
    setFormData(initialProductForm);
    setSelectedProductSlug(null);
    setSelectedProductId(null);
    setShowForm(false);
    setProductImages([]);
    setActiveFormTab("basic");
  };

  const openNewProductForm = () => {
    const draft = loadProductDraft();
    setFormData(draft ? { ...initialProductForm, ...draft } : initialProductForm);
    setSelectedProductSlug(null);
    setSelectedProductId(null);
    setProductImages([]);
    setActiveFormTab("basic");
    setShowForm(true);
    if (draft) {
      toast({
        title: "Draft restored",
        description: "Resumed from your last unsaved product draft.",
      });
    }
  };

  // Auto-save the form to localStorage every ~600ms while creating a NEW product.
  // Editing an existing product never persists a draft (would clobber server state on next open).
  useEffect(() => {
    if (!showForm || selectedProductSlug) return undefined;
    const id = setTimeout(() => {
      try {
        localStorage.setItem(PRODUCT_DRAFT_KEY, JSON.stringify(formData));
      } catch {
        /* quota or disabled — silent */
      }
    }, 600);
    return () => clearTimeout(id);
  }, [formData, showForm, selectedProductSlug]);

  const fetchProductImages = async (id) => {
    try {
      const res = await axios.get(`${API_BASE}/image/get-product-images/${id}`);
      const loadedImages = res.data.images || [];
      setProductImages(loadedImages);
      return loadedImages;
    } catch {
      setProductImages([]);
      return [];
    }
  };

  const openProductGallery = async (product) => {
    setGalleryTitle(product.name || "Product Images");
    let imagesToShow = [];

    if (product.images && product.images.length > 0) {
      imagesToShow = product.images.filter((img) => img._id);
    } else {
      imagesToShow = await fetchProductImages(product._id);
    }

    setGalleryImages(imagesToShow);
    setIsGalleryOpen(true);
  };

  const closeGallery = () => setIsGalleryOpen(false);

  const handleGalleryImagesUpdate = (updatedImages) => {
    setGalleryImages(updatedImages);
    setProductImages((prev) => {
      const pending = prev.filter((img) => !img._id);
      return [...updatedImages, ...pending];
    });
  };

  const beginEdit = (product) => {
    setSelectedProductSlug(product.slug);
    setSelectedProductId(product._id);
    setFormData({
      name: product.name || "",
      artNo: product.artNo || "",
      description: product.description || "",
      story: product.story || "",
      fabric: product.fabric || "",
      gsm: product.gsm || "",
      fitType: product.fitType || "",
      careInstructions: product.careInstructions || "",
      sizeGuide: product.sizeGuide || "",
      categoryPath: product.categoryPath || "",
      brand: product.brand || "Sovereign Elite",
      category: product.category || "Unisex",
      drop: product.drop?._id || "",
      basePrice: product.basePrice || "",
      discountPercent: product.discountPercent || "0",
      costPrice: product.costPrice ?? "",
      maxPerUser: product.maxPerUser ?? "",
      lowStockThreshold: product.lowStockThreshold ?? "",
      isFeatured: product.isFeatured || false,
      isActive: product.isActive ?? true,
      isLimited: product.isLimited || false,
      tags: Array.isArray(product.tags) ? product.tags : [],
      variants: product.variants?.length
        ? product.variants.map((v) => ({ ...v, colorCode: v.colorCode || "" }))
        : [defaultVariant],
    });
    setActiveFormTab("basic");
    setShowForm(true);
    fetchProductImages(product._id);
  };

  const toggleTag = (tag) => {
    setFormData((prev) => {
      const current = Array.isArray(prev.tags) ? prev.tags : [];
      const next = current.includes(tag)
        ? current.filter((t) => t !== tag)
        : [...current, tag];
      return { ...prev, tags: next };
    });
  };

  const validateProductForm = () => {
    if (!formData.name.trim()) return "Product name is required.";
    if (!formData.artNo.trim()) return "Art No is required.";
    if (!formData.basePrice || Number(formData.basePrice) < 0) {
      return "Base price must be 0 or greater.";
    }
    const validVariants = formData.variants.filter(
      (v) =>
        v.sku?.trim() &&
        v.size?.trim() &&
        v.color?.trim() &&
        v.stock !== "" &&
        v.stock !== null &&
        v.stock !== undefined
    );
    if (validVariants.length === 0) {
      return "At least one variant with SKU, size, color, and stock is required.";
    }
    const partialCount = formData.variants.length - validVariants.length;
    if (partialCount > 0) {
      return "Each variant needs SKU, size, color, and stock. Remove or complete partial rows.";
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateProductForm();
    if (validationError) {
      toast({ title: "Check the form", description: validationError, variant: "destructive" });
      return;
    }

    try {
      let result;
      const cleanData = {
        ...formData,
        variants: formData.variants.filter(
          (v) =>
            v.sku?.trim() &&
            v.size?.trim() &&
            v.color?.trim() &&
            v.stock !== "" &&
            v.stock !== null &&
            v.stock !== undefined
        ),
      };

      if (selectedProductSlug) {
        result = await dispatch(updateProduct({ slug: selectedProductSlug, productData: cleanData })).unwrap();
      } else {
        result = await dispatch(createProduct(cleanData)).unwrap();
      }

      const productId = result.product?._id;
      if (productId) {
        const newImages = productImages.filter((img) => !img.isUploaded && img.file);
        if (newImages.length > 0) {
          const fd = new FormData();
          fd.append("refModel", "Product");
          fd.append("refId", productId);
          fd.append("type", "product");
          newImages.forEach((img) => fd.append("images", img.file));
          await axios.post(`${API_BASE}/image/upload-image`, fd, {
            headers: { "Content-Type": "multipart/form-data" },
            withCredentials: true,
          });
        }
      }

      toast({
        title: selectedProductSlug ? "Product updated successfully" : "Product created successfully",
        className: "bg-surface border border-primary-container text-saga-primary",
      });
      // Successful create — drop the draft so the next "New Product" starts fresh.
      if (!selectedProductSlug) clearProductDraft();
      setShowProductSaved(true);
      resetForm();
      fetchProducts();
    } catch (e) {
      toast({
        title: "Failed to save product",
        description: getErrorMessage(e, "Something went wrong while saving the product."),
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!showProductSaved) return undefined;
    const t = setTimeout(() => setShowProductSaved(false), 2800);
    return () => clearTimeout(t);
  }, [showProductSaved]);

  const handleVariantChange = (index, field, value) => {
    const updatedVariants = [...formData.variants];
    const variant = { ...updatedVariants[index], [field]: value };

    // Auto-set colorCode when color changes to a known preset
    if (field === "color") {
      const preset = COLOR_OPTIONS.find((c) => c.name.toLowerCase() === value.toLowerCase());
      if (preset) variant.colorCode = preset.hex;
    }

    // Auto-generate SKU when size or color changes (only if sku was auto-generated or empty)
    if (field === "size" || field === "color") {
      const currentAuto = generateSku(formData.artNo, updatedVariants[index].size, updatedVariants[index].color);
      if (!variant.sku || variant.sku === currentAuto) {
        variant.sku = generateSku(formData.artNo, variant.size, variant.color);
      }
    }

    updatedVariants[index] = variant;
    setFormData({ ...formData, variants: updatedVariants });
  };

  const addVariant = () => {
    setFormData({ ...formData, variants: [...formData.variants, { ...defaultVariant }] });
  };

  const removeVariant = (index) => {
    const updatedVariants = formData.variants.filter((_, i) => i !== index);
    setFormData({ ...formData, variants: updatedVariants });
  };

  // ----- ATELIER FORM (Luxury Control Panel with Tabs) -----

  // Tabs
  const PRODUCT_TABS = [
    { id: "basic", label: "Basic Info", icon: Info },
    { id: "details", label: "Details", icon: Sparkles },
    { id: "pricing", label: "Pricing", icon: DollarSign },
    { id: "variants", label: "Variants", icon: Layers, count: formData.variants.length },
    { id: "media", label: "Media", icon: ImageIcon, count: productImages.length },
    { id: "tags", label: "Tags", icon: TagIcon, count: (formData.tags || []).length },
  ];

  // Computed margin for the right rail.
  const currentMargin = (() => {
    const cost = Number(formData.costPrice);
    const base = Number(formData.basePrice);
    if (!cost || !base) return null;
    return Math.round(((base - cost) / base) * 100);
  })();
  const discountedMargin = (() => {
    const cost = Number(formData.costPrice);
    const base = Number(formData.basePrice);
    const disc = Number(formData.discountPercent || 0);
    if (!cost || !base || disc <= 0) return null;
    const sale = base * (1 - disc / 100);
    if (sale <= 0) return null;
    return Math.round(((sale - cost) / sale) * 100);
  })();

  const totalStock = formData.variants.reduce(
    (sum, v) => sum + Number(v.stock || 0),
    0
  );

  const heroProductImage = productImages[0]?.url || null;
  const productStatus = formData.isActive ? "live" : "archived";

  // Setup completion progress
  const completedCount = [
    formData.name?.trim().length >= 3,
    formData.artNo?.trim().length >= 2,
    Number(formData.basePrice) > 0,
    formData.variants.some(
      (v) => v.sku?.trim() && v.size?.trim() && v.color?.trim() && v.stock !== ""
    ),
    productImages.length > 0,
    formData.description?.trim().length > 0,
  ].filter(Boolean).length;
  const progressValue = completedCount / 6;

  const atelierForm = (
    <AdminFormShell
      onClose={resetForm}
      header={
        <StickyActionBar
          eyebrow={selectedProductSlug ? "Product Atelier · Editing" : "Product Atelier · New Product"}
          title={formData.name?.trim() || (selectedProductSlug ? "Untitled product" : "New Product")}
          subtitle={
            formData.artNo
              ? `${formData.artNo} · ${formData.category} · ${formData.brand}`
              : "Set art number and pricing to continue"
          }
          onCancel={resetForm}
          onPublish={handleSubmit}
          publishLabel={selectedProductSlug ? "Save Product" : "Publish Product"}
        />
      }
      rightRail={
        <>
          <RightRailPanel
            tone="accent"
            title="Live Preview"
            description="Storefront card preview."
          >
            <LivePreviewCard
              image={heroProductImage}
              eyebrow={formData.brand}
              title={formData.name?.trim() || "Untitled product"}
              status={productStatus}
              statusLabel={formData.isActive ? "Live" : "Archived"}
              meta={[
                {
                  label: "Price",
                  value: formData.basePrice
                    ? `$${Number(formData.basePrice).toLocaleString()}`
                    : "—",
                },
                ...(Number(formData.discountPercent) > 0
                  ? [
                      {
                        label: "Discount",
                        value: `${formData.discountPercent}%`,
                      },
                    ]
                  : []),
                { label: "Stock", value: `${totalStock} units` },
                { label: "Variants", value: formData.variants.length },
                ...((formData.tags || []).length > 0
                  ? [{ label: "Tags", value: formData.tags.join(", ") }]
                  : []),
              ]}
            />
          </RightRailPanel>

          <RightRailPanel title="Status & Visibility">
            <RailToggleRow
              label="Active"
              helper="Visible in the public storefront."
              checked={formData.isActive}
              onChange={(v) => setFormData({ ...formData, isActive: v })}
            />
            <RailToggleRow
              label="Featured"
              helper="Promote on homepage carousel."
              checked={formData.isFeatured}
              onChange={(v) => setFormData({ ...formData, isFeatured: v })}
            />
            <RailToggleRow
              label="Limited"
              helper="Badge as exclusive drop."
              checked={formData.isLimited}
              onChange={(v) => setFormData({ ...formData, isLimited: v })}
            />
          </RightRailPanel>

          {currentMargin !== null ? (
            <RightRailPanel title="Margin">
              <div className="rounded-xl border border-white/[0.06] bg-black/30 px-4 py-3 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-white/50 uppercase tracking-wider">
                    Base
                  </span>
                  <span
                    className={`tabular-nums font-semibold ${
                      currentMargin < 15 ? "text-rose-300" : "text-emerald-300"
                    }`}
                  >
                    {currentMargin}%
                  </span>
                </div>
                {discountedMargin !== null ? (
                  <div className="mt-2 flex items-center justify-between border-t border-white/[0.05] pt-2">
                    <span className="text-white/50 uppercase tracking-wider">
                      After {formData.discountPercent}% off
                    </span>
                    <span
                      className={`tabular-nums font-semibold ${
                        discountedMargin < 15 ? "text-rose-300" : "text-emerald-300"
                      }`}
                    >
                      {discountedMargin}%
                    </span>
                  </div>
                ) : null}
              </div>
            </RightRailPanel>
          ) : null}

          <RightRailPanel title="Setup Progress">
            <ProgressBar
              label="Product completion"
              value={progressValue}
              segments={6}
              filledCount={completedCount}
            />
          </RightRailPanel>

          <RightRailPanel title="Tips">
            <ul className="space-y-2 text-[11px] leading-relaxed text-white/50">
              <li className="flex gap-2">
                <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-[#D4AF37]" />
                Use the tabs above to step through Basic Info → Pricing →
                Variants → Media → Tags.
              </li>
              <li className="flex gap-2">
                <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-[#D4AF37]" />
                Set <strong>cost price</strong> for accurate margin warnings on
                offers.
              </li>
              <li className="flex gap-2">
                <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-[#D4AF37]" />
                Hero image at 1600×2000 (4:5) gives the cleanest storefront look.
              </li>
            </ul>
          </RightRailPanel>
        </>
      }
    >
      <FormTabs tabs={PRODUCT_TABS} active={activeFormTab} onChange={setActiveFormTab} />

      {activeFormTab === "basic" ? (
        <FormSection
          number="01"
          title="Basic Information"
          description="The product identity. Shown to customers on listing and detail pages."
        >
          <FormField
            label="Product Name"
            required
            helper="Shown on the storefront listing and product detail. Keep it concise."
            hint={`${formData.name.length} / 200`}
          >
            <LuxuryInput
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Aethelgard Signature Oxford"
              maxLength={200}
            />
          </FormField>

          <FormField
            label="Description"
            optional
            helper="Long-form copy for the product detail page."
            hint={`${formData.description.length} / 2000`}
          >
            <LuxuryTextarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe the materials, fit, and craftsmanship…"
              rows={5}
              maxLength={2000}
            />
          </FormField>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FormField
              label="Art Number"
              required
              helper="Stable internal SKU root. Cannot be changed after orders exist."
            >
              <LuxuryInput
                type="text"
                value={formData.artNo}
                onChange={(e) =>
                  setFormData({ ...formData, artNo: e.target.value })
                }
                placeholder="SE-OX-001"
                className="font-mono uppercase"
              />
            </FormField>

            <FormField label="Brand" required>
              <LuxurySelect
                value={formData.brand}
                onChange={(e) =>
                  setFormData({ ...formData, brand: e.target.value })
                }
              >
                <option value="Sovereign Elite">Sovereign Elite</option>
                <option value="Atelier Reserve">Atelier Reserve</option>
                <option value="Nomad Lux">Nomad Lux</option>
              </LuxurySelect>
            </FormField>

            <FormField label="Category" required>
              <LuxurySelect
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              >
                <option value="Ladies">Ladies</option>
                <option value="Gents">Gents</option>
                <option value="Unisex">Unisex</option>
              </LuxurySelect>
            </FormField>

            <FormField
              label="Collection Drop"
              optional
              helper="Attach to a drop, or leave standalone."
            >
              <LuxurySelect
                value={formData.drop}
                onChange={(e) =>
                  setFormData({ ...formData, drop: e.target.value })
                }
              >
                <option value="">Standalone / Core Collection</option>
                {drops.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </LuxurySelect>
            </FormField>
          </div>
        </FormSection>
      ) : null}

      {activeFormTab === "details" ? (
        <FormSection
          number="02"
          title="Product Details"
          description="Rich content fields for the product detail page — story, materials, fit, and care."
        >
          <FormField
            label="Product Story"
            optional
            helper="Editorial narrative about this piece."
            hint={`${(formData.story || '').length} / 3000`}
          >
            <LuxuryTextarea
              value={formData.story}
              onChange={(e) => setFormData({ ...formData, story: e.target.value })}
              placeholder="Tell the story behind this piece — inspiration, craftsmanship, cultural references…"
              rows={5}
              maxLength={3000}
            />
          </FormField>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FormField label="Fabric / Material" optional helper="E.g. 100% Premium Cotton">
              <LuxuryInput
                type="text"
                value={formData.fabric}
                onChange={(e) => setFormData({ ...formData, fabric: e.target.value })}
                placeholder="100% Premium Cotton"
                maxLength={200}
              />
            </FormField>

            <FormField label="GSM" optional helper="Fabric weight, e.g. 280gsm">
              <LuxuryInput
                type="text"
                value={formData.gsm}
                onChange={(e) => setFormData({ ...formData, gsm: e.target.value })}
                placeholder="280gsm"
                maxLength={100}
              />
            </FormField>

            <FormField label="Fit Type" optional helper="E.g. Oversized, Slim, Regular">
              <LuxurySelect
                value={formData.fitType}
                onChange={(e) => setFormData({ ...formData, fitType: e.target.value })}
              >
                <option value="">Select fit type</option>
                <option value="Slim">Slim</option>
                <option value="Regular">Regular</option>
                <option value="Relaxed">Relaxed</option>
                <option value="Oversized">Oversized</option>
                <option value="Boxy">Boxy</option>
                <option value="Tailored">Tailored</option>
              </LuxurySelect>
            </FormField>

            <FormField label="Category Path" optional helper="Breadcrumb path, e.g. Ladies > Dresses > Midi">
              <LuxuryInput
                type="text"
                value={formData.categoryPath}
                onChange={(e) => setFormData({ ...formData, categoryPath: e.target.value })}
                placeholder="Ladies > Tops > T-Shirts"
                maxLength={200}
              />
            </FormField>
          </div>

          <FormField
            label="Care Instructions"
            optional
            helper="Washing, ironing, dry cleaning notes."
            hint={`${(formData.careInstructions || '').length} / 1000`}
          >
            <LuxuryTextarea
              value={formData.careInstructions}
              onChange={(e) => setFormData({ ...formData, careInstructions: e.target.value })}
              placeholder="Machine wash cold. Hang dry. Do not bleach…"
              rows={3}
              maxLength={1000}
            />
          </FormField>

          <FormField
            label="Size Guide"
            optional
            helper="Sizing information and measurement notes."
            hint={`${(formData.sizeGuide || '').length} / 2000`}
          >
            <LuxuryTextarea
              value={formData.sizeGuide}
              onChange={(e) => setFormData({ ...formData, sizeGuide: e.target.value })}
              placeholder="Model wears size M. Height 185cm, chest 96cm…"
              rows={3}
              maxLength={2000}
            />
          </FormField>
        </FormSection>
      ) : null}

      {activeFormTab === "pricing" ? (
        <FormSection
          number="03"
          title="Pricing & Limits"
          description="Storefront price, optional discount, and per-customer limits."
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <FormField label="Base Price" required helper="Customer-facing price.">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
                  $
                </span>
                <LuxuryInput
                  type="number"
                  min="0"
                  value={formData.basePrice}
                  onChange={(e) =>
                    setFormData({ ...formData, basePrice: e.target.value })
                  }
                  className="pl-7"
                />
              </div>
            </FormField>

            <FormField
              label="Discount %"
              optional
              helper="0 if no discount."
            >
              <LuxuryInput
                type="number"
                min="0"
                max="100"
                value={formData.discountPercent}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discountPercent: e.target.value,
                  })
                }
              />
            </FormField>

            <FormField
              label="Max per User"
              optional
              helper="Cap purchases per customer (anti-bot)."
            >
              <LuxuryInput
                type="number"
                min="0"
                value={formData.maxPerUser}
                onChange={(e) =>
                  setFormData({ ...formData, maxPerUser: e.target.value })
                }
              />
            </FormField>

            <FormField
              label="Low Stock Threshold"
              optional
              helper="Alert when total stock drops to this level or below. Leave blank to use the global default."
            >
              <LuxuryInput
                type="number"
                min="0"
                placeholder="Use global default"
                value={formData.lowStockThreshold}
                onChange={(e) =>
                  setFormData({ ...formData, lowStockThreshold: e.target.value })
                }
              />
            </FormField>
          </div>

          <FormField
            label="Cost / Wholesale Price"
            optional
            helper="Admin-only. Powers margin warnings and aging stock recommendations."
          >
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] uppercase text-white/40">
                LKR
              </span>
              <LuxuryInput
                type="number"
                min="0"
                value={formData.costPrice}
                onChange={(e) =>
                  setFormData({ ...formData, costPrice: e.target.value })
                }
                className="pl-12"
                placeholder="0"
              />
            </div>
          </FormField>
        </FormSection>
      ) : null}

      {activeFormTab === "variants" ? (
        <FormSection
          number="04"
          title="Variants"
          description="Each combination of size and colour with its own SKU and stock."
          action={
            <button
              type="button"
              onClick={addVariant}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/[0.08] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#D4AF37] hover:bg-[#D4AF37]/[0.16] transition"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Variant
            </button>
          }
        >
          <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
            <table className="w-full text-left min-w-[640px]">
              <thead className="bg-white/[0.02]">
                <tr className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/50">
                  <th className="px-4 py-3 font-semibold">SKU</th>
                  <th className="px-4 py-3 font-semibold">Size</th>
                  <th className="px-4 py-3 font-semibold">Color</th>
                  <th className="px-4 py-3 font-semibold text-right">Price Adj.</th>
                  <th className="px-4 py-3 font-semibold text-right">Stock</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                <AnimatePresence initial={false}>
                  {formData.variants.map((v, i) => (
                    <motion.tr
                      key={`variant-row-${i}`}
                      layout
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="hover:bg-white/[0.02] transition"
                    >
                      {/* Auto-generated SKU (editable) */}
                      <td className="px-4 py-2.5">
                        <div className="relative">
                          <LuxuryInput
                            type="text"
                            value={v.sku}
                            onChange={(e) =>
                              handleVariantChange(i, "sku", e.target.value)
                            }
                            placeholder="Auto-generated"
                            className="font-mono uppercase text-xs py-2"
                          />
                          {!v.sku && formData.artNo && (
                            <button
                              type="button"
                              onClick={() => handleVariantChange(i, "sku", generateSku(formData.artNo, v.size, v.color))}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-[#D4AF37] uppercase tracking-wider hover:underline"
                              title="Auto-generate SKU"
                            >
                              Gen
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Size dropdown with presets */}
                      <td className="px-4 py-2.5">
                        <LuxurySelect
                          value={SIZE_OPTIONS.includes(v.size) ? v.size : (v.size ? "__custom" : "")}
                          onChange={(e) => {
                            if (e.target.value === "__custom") {
                              handleVariantChange(i, "size", "");
                            } else {
                              handleVariantChange(i, "size", e.target.value);
                            }
                          }}
                          className="text-xs py-2"
                        >
                          <option value="">Size…</option>
                          {SIZE_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                          <option value="__custom">Custom…</option>
                        </LuxurySelect>
                        {v.size && !SIZE_OPTIONS.includes(v.size) && (
                          <LuxuryInput
                            type="text"
                            value={v.size}
                            onChange={(e) => handleVariantChange(i, "size", e.target.value)}
                            placeholder="Custom size"
                            className="text-xs py-1.5 mt-1"
                          />
                        )}
                      </td>

                      {/* Color dropdown with swatches */}
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          {v.colorCode && (
                            <span
                              className="w-4 h-4 shrink-0 rounded-full border border-white/20"
                              style={{ backgroundColor: v.colorCode }}
                            />
                          )}
                          <LuxurySelect
                            value={COLOR_OPTIONS.find((c) => c.name.toLowerCase() === (v.color || "").toLowerCase()) ? v.color : (v.color ? "__custom" : "")}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "__custom") {
                                handleVariantChange(i, "color", "");
                                handleVariantChange(i, "colorCode", "");
                              } else {
                                handleVariantChange(i, "color", val);
                              }
                            }}
                            className="text-xs py-2 flex-1"
                          >
                            <option value="">Color…</option>
                            {COLOR_OPTIONS.map((c) => (
                              <option key={c.name} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                            <option value="__custom">Custom…</option>
                          </LuxurySelect>
                        </div>
                        {v.color && !COLOR_OPTIONS.find((c) => c.name.toLowerCase() === v.color.toLowerCase()) && (
                          <div className="flex gap-2 mt-1">
                            <LuxuryInput
                              type="text"
                              value={v.color}
                              onChange={(e) => handleVariantChange(i, "color", e.target.value)}
                              placeholder="Color name"
                              className="text-xs py-1.5 flex-1"
                            />
                            <input
                              type="color"
                              value={v.colorCode || "#000000"}
                              onChange={(e) => handleVariantChange(i, "colorCode", e.target.value)}
                              className="w-8 h-8 border-0 bg-transparent cursor-pointer"
                              title="Pick color"
                            />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <LuxuryInput
                          type="number"
                          value={v.priceAdjustment}
                          onChange={(e) =>
                            handleVariantChange(
                              i,
                              "priceAdjustment",
                              e.target.value
                            )
                          }
                          className="text-xs py-2 text-right w-24"
                        />
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <LuxuryInput
                          type="number"
                          value={v.stock}
                          onChange={(e) =>
                            handleVariantChange(i, "stock", e.target.value)
                          }
                          className="text-xs py-2 text-right w-20"
                        />
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {formData.variants.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removeVariant(i)}
                            className="text-white/40 hover:text-rose-400 transition"
                            title="Remove variant"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        ) : null}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </FormSection>
      ) : null}

      {activeFormTab === "media" ? (
        <FormSection
          number="05"
          title="Media"
          description="Hero and supporting imagery shown on storefront cards and detail pages."
        >
          {!selectedProductId ? (
            <div className="rounded-2xl border border-dashed border-white/[0.08] bg-black/30 p-8 text-center">
              <ImageIcon className="mx-auto mb-3 h-8 w-8 text-white/20" />
              <p className="text-xs uppercase tracking-[0.2em] font-semibold text-[#D4AF37]">
                Save the product to upload images
              </p>
              <p className="mt-2 text-[11px] text-white/40">
                Recommended hero size: 1600×2000 · JPG / WEBP · Max 5 MB
              </p>
            </div>
          ) : (
            <>
              <ImageUpload
                images={productImages}
                setImages={setProductImages}
                isMultiple
                refModel="Product"
                refId={selectedProductId}
                type="product"
              />
              {productImages.length > 0 ? (
                <button
                  type="button"
                  onClick={() =>
                    openProductGallery({
                      name: formData.name,
                      _id: selectedProductId,
                      images: productImages,
                    })
                  }
                  className="mt-3 inline-flex items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/[0.08] px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#D4AF37] hover:bg-[#D4AF37]/[0.16] transition"
                >
                  View all images
                </button>
              ) : null}
            </>
          )}
        </FormSection>
      ) : null}

      {activeFormTab === "tags" ? (
        <FormSection
          number="06"
          title="Tags & Identity"
          description="Tags drive merchandising — applied tags surface on the storefront and in filters."
        >
          <div className="flex flex-wrap gap-2">
            {PRODUCT_TAG_OPTIONS.map((tag) => {
              const active =
                Array.isArray(formData.tags) && formData.tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] border transition ${
                    active
                      ? "border-[#D4AF37]/40 bg-[#D4AF37]/[0.10] text-[#D4AF37]"
                      : "border-white/10 bg-white/[0.04] text-white/60 hover:text-white hover:border-white/20"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </FormSection>
      ) : null}

      {/* Step navigation — wizard Back / Next, with Save & Publish on the final step */}
      {(() => {
        const tabIds = PRODUCT_TABS.map((t) => t.id);
        const idx = tabIds.indexOf(activeFormTab);
        const isFirst = idx <= 0;
        const isLast = idx >= tabIds.length - 1;
        return (
          <div className="mt-6 flex flex-col gap-3 border-t border-white/[0.06] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              disabled={isFirst}
              onClick={() => !isFirst && setActiveFormTab(tabIds[idx - 1])}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-3 w-3" /> Back
            </button>

            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
              Step {idx + 1} of {tabIds.length} · {PRODUCT_TABS[idx]?.label}
            </span>

            {isLast ? (
              <button
                type="button"
                onClick={handleSubmit}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-black transition hover:bg-[#D4AF37]/90"
              >
                {selectedProductSlug ? "Save product" : "Publish product"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveFormTab(tabIds[idx + 1])}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/[0.08] px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-[#D4AF37] transition hover:bg-[#D4AF37]/15"
              >
                Next <ChevronRight className="h-3 w-3" />
              </button>
            )}
          </div>
        );
      })()}
    </AdminFormShell>
  );

  // ----- LEDGER LIST VIEW -----
  return (
    <Fragment>
    <AdminPage
      eyebrow="Catalog management"
      title="Product Ledger"
      description="Manage products, variants, stock, visibility, and gallery assets."
    >
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="flex-1 flex flex-col overflow-hidden bg-surface min-h-[calc(100vh-80px)] text-on-surface rounded-3xl border border-white/10"
    >
      <div className="border-b border-white/10 px-6 py-3">
        <ToastFlash show={showProductSaved} message="Product saved" />
      </div>
      {/* List Header */}
      <header className="flex flex-col md:flex-row justify-between items-center w-full px-8 md:px-16 py-6 bg-surface-dim z-10 gap-6">
        <div className="flex items-center gap-8 w-full md:w-auto">
          <div className="relative w-full md:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/60 py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-[#D4AF37] placeholder:text-gray-500"
              placeholder="Search the collection…"
              type="search"
            />
          </div>
        </div>
        <div className="flex items-center gap-6 self-end md:self-auto">
          <button className="hover:text-saga-primary transition-colors text-on-surface-variant relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-saga-primary rounded-full"></span>
          </button>
          <button className="hover:text-saga-primary transition-colors text-on-surface-variant">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-8 md:px-16 py-12 scroll-smooth">
        {isLoading ? (
          <SkeletonGrid count={6} />
        ) : (
        <>
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
          <div className="max-w-2xl">
            <span className="text-[10px] uppercase tracking-[0.3em] text-saga-primary mb-3 block font-bold" style={{ textShadow: "0px 0px 12px rgba(242, 202, 80, 0.2)" }}>Inventory Registry</span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black font-serif tracking-tighter text-white leading-none mb-4">Product Ledger</h2>
            <p className="text-on-surface-variant text-sm max-w-lg leading-relaxed font-sans">
              Manage the digital heartbeat of your luxury portfolio. Curate availability, adjust valuation, and monitor stock levels.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex bg-surface-container-low p-1 border border-outline-variant/10">
              <button
                onClick={() => setStatusFilter("true")}
                className={`px-6 py-2 text-[10px] uppercase tracking-widest font-bold transition-colors ${statusFilter === "true" ? 'bg-primary-container text-on-primary-container' : 'text-on-surface opacity-50 hover:opacity-100'}`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-6 py-2 text-[10px] uppercase tracking-widest font-bold transition-colors ${statusFilter === "all" ? 'bg-primary-container text-on-primary-container' : 'text-on-surface opacity-50 hover:opacity-100'}`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("false")}
                className={`px-6 py-2 text-[10px] uppercase tracking-widest font-bold transition-colors ${statusFilter === "false" ? 'bg-primary-container text-on-primary-container' : 'text-on-surface opacity-50 hover:opacity-100'}`}
              >
                Inactive
              </button>
              <button
                onClick={() => setStatusFilter("low_stock")}
                className={`px-6 py-2 text-[10px] uppercase tracking-widest font-bold transition-colors ${statusFilter === "low_stock" ? 'bg-[#ffb4ab]/20 text-[#ffb4ab]' : 'text-on-surface opacity-50 hover:opacity-100'}`}
              >
                Low Stock (≤5)
              </button>
            </div>
            <button
              onClick={openNewProductForm}
              className="bg-surface-container-highest border border-outline-variant/30 px-6 py-2 text-[10px] uppercase tracking-widest text-saga-primary flex items-center gap-2 hover:bg-surface-bright transition-colors font-bold shadow-[0_0_10px_rgba(242,202,80,0.1)]"
            >
              <Plus className="w-3 h-3" />
              New Product
            </button>
          </div>
        </div>

        {/* Bento Grid List Header */}
        <div className="hidden md:flex items-center gap-4 px-6 mb-4 py-4 bg-surface-container-low text-[10px] uppercase tracking-[0.2em] text-outline-variant font-bold border border-outline-variant/10">
          <input
            type="checkbox"
            aria-label="Select all products on this page"
            checked={bulk.isAllSelected}
            ref={(el) => {
              if (el) el.indeterminate = bulk.isSomeSelected;
            }}
            onChange={bulk.toggleAll}
            className="h-4 w-4 cursor-pointer accent-saga-primary"
            data-testid="admin-bulk-select-all"
          />
          <div className="grid grid-cols-12 gap-4 flex-1">
            <div className="col-span-5">Product Details</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2">Valuation</div>
            <div className="col-span-1">Stock</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>
        </div>

        {/* Product Rows */}
        <motion.div
          className="space-y-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {productList.map((product) => {
            const stock = product.variants?.reduce((sum, v) => sum + Number(v.stock), 0) || 0;
            return (
              <motion.div
                key={product._id}
                variants={itemVariants}
                whileHover={{ y: -3, borderColor: "rgba(212,175,55,0.35)" }}
                transition={{ duration: 0.2 }}
                className={`group relative grid grid-cols-1 md:grid-cols-12 gap-4 items-center rounded-[28px] border ${
                  bulk.isSelected(product._id)
                    ? "border-saga-primary/60 bg-saga-primary/5"
                    : "border-outline-variant/5 bg-surface-container/30"
                } p-6 transition-colors hover:bg-surface-bright/80`}
              >
                <div className="absolute left-0 top-0 bottom-0 w-[2px] origin-top scale-y-0 bg-saga-primary transition-transform duration-300 group-hover:scale-y-100" />
                <input
                  type="checkbox"
                  aria-label={`Select ${product.name}`}
                  checked={bulk.isSelected(product._id)}
                  onChange={() => bulk.toggle(product._id)}
                  className="absolute top-3 right-3 z-10 h-4 w-4 cursor-pointer accent-saga-primary md:top-1/2 md:right-auto md:left-1 md:-translate-y-1/2"
                  data-testid="admin-bulk-row-select"
                />

                <div className="col-span-1 md:col-span-5 flex items-center gap-6">
                  <div className="w-16 h-16 bg-surface-container-highest shrink-0 overflow-hidden ring-1 ring-outline-variant/20 flex items-center justify-center">
                    {product.images && product.images.length > 0 ? (
                      <img className="w-full h-full object-cover" src={product.images[0].url} alt={product.name} />
                    ) : (
                      <Package className="w-6 h-6 text-outline-variant/50" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-white font-serif font-bold text-lg leading-tight group-hover:text-saga-primary transition-colors">{product.name}</h4>
                    <p className="text-xs text-on-surface-variant opacity-60 mt-1 uppercase font-mono">SKU: {product.artNo || 'N/A'}</p>
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <span className="text-[10px] uppercase tracking-widest text-on-surface-variant px-3 py-1 bg-surface-container-highest whitespace-nowrap">
                    {product.category || 'Uncategorized'}
                  </span>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <span className="font-serif text-saga-primary font-bold text-lg">${product.basePrice || 0}</span>
                </div>

                <div className="col-span-1 md:col-span-1">
                  <span className={`text-sm ${stock === 0 ? 'text-saga-error font-bold' : 'text-on-surface'}`}>{stock} Units</span>
                </div>

                <div className="col-span-1 md:col-span-1">
                  <div className="flex items-center gap-2">
                    <PulseDot active={product.isActive} />
                    <span className={`text-[10px] uppercase tracking-widest font-bold ${product.isActive ? 'text-saga-primary' : 'text-outline-variant'}`}>
                      {product.isActive ? 'Live' : 'Archived'}
                    </span>
                  </div>
                </div>

                <div className="col-span-1 flex flex-wrap justify-end gap-3 md:col-span-1">
                  <button type="button" onClick={() => openProductGallery(product)} className="hover:text-saga-primary transition-colors text-on-surface-variant bg-surface-container-high p-2" title="View images">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => beginEdit(product)} className="hover:text-saga-primary transition-colors text-on-surface-variant bg-surface-container-high p-2" title="Edit product">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmSlug((s) => (s === product.slug ? null : product.slug))}
                    className="hover:text-saga-error transition-colors text-on-surface-variant bg-surface-container-high p-2"
                    title="Delete product"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="col-span-1 md:col-span-12">
                  <ConfirmInline
                    show={deleteConfirmSlug === product.slug}
                    message="Delete this product permanently?"
                    onCancel={() => setDeleteConfirmSlug(null)}
                    onConfirm={() => {
                      const slug = product.slug;
                      setDeleteConfirmSlug(null);
                      dispatch(deleteProduct(slug)).then(() => fetchProducts());
                    }}
                  />
                </div>
              </motion.div>
            );
          })}

          {productList.length === 0 && (
            <div className="py-20 text-center border border-dashed border-outline-variant/30 text-on-surface-variant font-sans">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No products found in the ledger.</p>
            </div>
          )}
        </motion.div>

        {/* Pagination */}
        {productList.length > 0 && pagination.totalPages > 1 && (
          <div className="mt-12 flex flex-col md:flex-row justify-between items-center bg-surface-container-low p-6 border border-outline-variant/10 gap-4">
            <span className="text-xs uppercase tracking-widest text-outline-variant font-bold">Showing {productList.length} masterpieces</span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="w-10 h-10 flex items-center justify-center bg-surface-container-highest border border-outline-variant/20 text-on-surface-variant hover:text-saga-primary transition-colors disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {[...Array(pagination.totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 flex items-center justify-center border font-bold text-xs transition-colors ${
                    currentPage === i + 1
                      ? 'bg-saga-primary text-on-primary border-saga-primary'
                      : 'bg-surface-container-highest border-outline-variant/20 text-on-surface-variant hover:text-saga-primary'
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                disabled={currentPage === pagination.totalPages}
                onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                className="w-10 h-10 flex items-center justify-center bg-surface-container-highest border border-outline-variant/20 text-on-surface-variant hover:text-saga-primary transition-colors disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        </>
        )}
      </main>
      {isGalleryOpen ? (
        <ImageGalleryModal
          title={galleryTitle}
          images={galleryImages}
          onClose={closeGallery}
          onImagesUpdate={handleGalleryImagesUpdate}
        />
      ) : null}
    </motion.div>
    </AdminPage>
    <AnimatePresence mode="wait">{showForm ? atelierForm : null}</AnimatePresence>
    <BulkActionBar
      count={bulk.count}
      onClear={bulk.clear}
      pending={bulkPending}
      label="products selected"
      actions={[
        { label: "Activate", onClick: () => runBulkProductAction("activate") },
        { label: "Deactivate", onClick: () => runBulkProductAction("deactivate") },
        {
          label: "Delete",
          variant: "destructive",
          confirm: {
            title: `Delete ${bulk.count} product${bulk.count === 1 ? "" : "s"}?`,
            body: "Products will be permanently removed. Order history is preserved but the product pages will return 404.",
            confirmLabel: "Delete forever",
          },
          onClick: () => runBulkProductAction("delete"),
        },
      ]}
    />
    </Fragment>
  );
};
export default Product;
