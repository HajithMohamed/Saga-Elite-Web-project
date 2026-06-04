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
import { PrimaryButton } from "@/components/admin-components/_shared/Buttons";
import useBulkSelection from "@/hooks/use-bulk-selection";
import { getAllDrops } from "@/store/admin/drop-slice";
import { useToast } from "@/hooks/use-toast";
import ImageUpload from "@/components/admin-components/ImageUpload";
import ImageGalleryModal from "@/components/admin-components/ImageGalleryModal";
import axios from "axios";
import { API_V1_URL as API_BASE } from "@/lib/api";
import { compressImageFile } from "@/lib/image-compression";
import {
  Search,
  Settings,
  Bell,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
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
  FolderTree,
  GripVertical,
  Check,
  X as XIcon,
  AlertCircle,
  Download,
  Loader2,
} from "lucide-react";
import { AdminPage } from "@/components/admin-components/AdminUI";
import { SearchFilterBar, FilterSelect } from "@/components/admin-components/_shared/SearchFilterBar";
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
import { ProductStudio } from "@/components/admin-components/product-studio";

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
  stock: "",
  priceAdjustment: "",
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
  brand: "Sovereign Elite",
  category: "",
  categoryId: "",
  subCategory: "",
  categoryPath: "",
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

const isHexColor = (value) => /^#[0-9A-F]{6}$/i.test(String(value || ""));

const getVariantColorCode = (variant) => {
  if (isHexColor(variant.colorCode)) return variant.colorCode;
  const preset = COLOR_OPTIONS.find(
    (color) => color.name.toLowerCase() === String(variant.color || "").toLowerCase()
  );
  return preset?.hex || "#000000";
};

const normalizeColorKey = (value = "") => String(value || "").trim().toLowerCase();

const getImageForVariantColor = (images = [], color = "") => {
  const colorKey = normalizeColorKey(color);
  if (!colorKey) return null;
  return (
    images.find((image) => normalizeColorKey(image?.colorTag) === colorKey) || null
  );
};

const revokeBlobUrl = (url) => {
  if (typeof url === "string" && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
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
  return error?.response?.data?.message || error?.message || error?.error || fallback;
};

const rollbackCreatedProduct = async (product) => {
  const slug = product?.slug;
  if (!slug) return false;

  try {
    await axios.delete(`${API_BASE}/products/delete-product/${encodeURIComponent(slug)}`, {
      withCredentials: true,
    });
    return true;
  } catch (error) {
    console.error("[Product] rollback failed after image upload error", error);
    return false;
  }
};

const CUSTOM_OPTION = "__custom__";
const CATEGORY_ROOT_TAGS = ["Gents", "Ladies", "Unisex"];
const CATEGORY_MANAGER_PAGE_SIZE = 6;

const MATERIAL_OPTIONS = [
  "Cotton",
  "Organic Cotton",
  "Linen",
  "Linen Blend",
  "Denim",
  "Jersey",
  "French Terry",
  "Fleece",
  "Twill",
  "Wool",
  "Silk",
  "Rayon",
  "Viscose",
  "Polyester",
  "Nylon",
  "Spandex",
  "Tencel",
  "Bamboo",
  "Leather",
];

const GSM_OPTIONS = ["120", "140", "160", "180", "200", "220", "240", "260", "280", "300", "320", "340", "360", "380", "400"];

const buildSizeGuideTemplate = (title) => [
  `${title} size guide`,
  "",
  "Size | Chest (cm) | Length (cm)",
  "XS | 86-91 | 66",
  "S | 91-96 | 68",
  "M | 96-101 | 70",
  "L | 101-106 | 72",
  "XL | 106-111 | 74",
  "XXL | 111-116 | 76",
  "",
  "Measurements are approximate and may vary by style.",
].join("\n");

const SIZE_GUIDE_PRESETS = [
  { value: "Sri Lanka", label: "Sri Lanka", guide: buildSizeGuideTemplate("Sri Lanka") },
  { value: "India", label: "India", guide: buildSizeGuideTemplate("India") },
  { value: "United States", label: "United States", guide: buildSizeGuideTemplate("United States") },
  { value: "United Kingdom", label: "United Kingdom", guide: buildSizeGuideTemplate("United Kingdom") },
  { value: "European Union", label: "European Union", guide: buildSizeGuideTemplate("European Union") },
  { value: "Australia", label: "Australia", guide: buildSizeGuideTemplate("Australia") },
];

const normalizeText = (value = "") => String(value).trim().toLowerCase();

const normalizeCategorySegment = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const buildCategoryTree = (categories = []) => {
  const nodes = categories.map((category) => ({ ...category, children: [] }));
  const byId = new Map(nodes.map((category) => [String(category._id), category]));
  const roots = [];

  nodes.forEach((category) => {
    const parentId = category.parentCategory ? String(category.parentCategory) : null;
    if (parentId && byId.has(parentId)) {
      byId.get(parentId).children.push(category);
    } else {
      roots.push(category);
    }
  });

  const sortNodes = (list) =>
    list
      .sort(
        (a, b) =>
          Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0) ||
          normalizeText(a.name).localeCompare(normalizeText(b.name))
      )
      .map((node) => ({
        ...node,
        children: sortNodes(node.children || []),
      }));

  return sortNodes(roots);
};

const findCategoryNode = (categories = [], value) => {
  const target = normalizeText(value);
  if (!target) return null;

  for (const category of categories) {
    if (
      normalizeText(category._id) === target ||
      normalizeText(category.name) === target ||
      normalizeText(category.slug) === target
    ) {
      return category;
    }

    const childMatch = findCategoryNode(category.children || [], value);
    if (childMatch) return childMatch;
  }

  return null;
};

const findCategoryPath = (categories = [], value, path = []) => {
  const target = normalizeText(value);
  if (!target) return [];

  for (const category of categories) {
    const nextPath = [...path, category];
    if (
      normalizeText(category._id) === target ||
      normalizeText(category.name) === target ||
      normalizeText(category.slug) === target
    ) {
      return nextPath;
    }

    const childPath = findCategoryPath(category.children || [], value, nextPath);
    if (childPath.length) return childPath;
  }

  return [];
};

const findCategoryPathBySegments = (categories = [], rawPath = "") => {
  const segments = String(rawPath || "")
    .split(/\/|>|\|/)
    .map((segment) => normalizeCategorySegment(segment))
    .filter(Boolean);

  if (!segments.length) return [];

  const path = [];
  let candidates = categories;

  for (const segment of segments) {
    const match = candidates.find(
      (category) =>
        normalizeCategorySegment(category.slug) === segment ||
        normalizeCategorySegment(category.name) === segment ||
        normalizeCategorySegment(category._id) === segment
    );

    if (!match) return [];

    path.push(match);
    candidates = match.children || [];
  }

  return path;
};

const buildCategoryPathValue = (path = []) =>
  path
    .map((category) => category.slug || normalizeCategorySegment(category.name))
    .filter(Boolean)
    .join("/");

const collectSubcategoryOptions = (rootCategory) => {
  if (!rootCategory) return [];

  const walk = (nodes = [], path = []) =>
    nodes.flatMap((node) => {
      const nextPath = [...path, node];
      return [
        {
          value: String(node._id),
          label: nextPath.map((item) => item.name).join(" / "),
          node,
          path: [rootCategory, ...nextPath],
        },
        ...walk(node.children || [], nextPath),
      ];
    });

  return walk(rootCategory.children || []);
};

const formatCategoryPathDisplay = (value = "") =>
  String(value || "")
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) =>
      segment
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    )
    .join(" / ");

const findPresetByValue = (value, presets) => presets.find((preset) => preset.value === value) || null;

const collectCategoryOptions = (categories = [], path = []) =>
  categories.flatMap((category) => [
    {
      value: String(category._id),
      label: [...path, category.name].join(" / "),
    },
    ...collectCategoryOptions(category.children || [], [...path, category.name]),
  ]);

const collectFilterCategoryOptions = (categories = [], path = []) =>
  categories.flatMap((category) => [
    {
      value: category.name,
      label: [...path, category.name].join(" / "),
    },
    ...collectFilterCategoryOptions(category.children || [], [...path, category.name]),
  ]);

const flattenCategoryRows = (categories = [], path = []) =>
  categories.flatMap((category) => {
    const nextPath = [...path, category];

    return [
      {
        ...category,
        breadcrumb: nextPath.map((item) => item.name).join(" / "),
        level: Math.max(0, nextPath.length - 1),
      },
      ...flattenCategoryRows(category.children || [], nextPath),
    ];
  });

const CategoryManagerPanel = ({ categoryTree, onRefreshCategories, onClose }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTag, setActiveTag] = useState(CATEGORY_ROOT_TAGS[0]);
  const [editingId, setEditingId] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [parentCategory, setParentCategory] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [isFeatured, setIsFeatured] = useState(false);
  const [showOnHome, setShowOnHome] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const activeRootNode = findCategoryNode(categoryTree, activeTag) || categoryTree[0] || null;
  const visibleCategoryRows = activeRootNode ? flattenCategoryRows(activeRootNode.children || [], [activeRootNode]) : [];
  const totalPages = Math.max(1, Math.ceil(visibleCategoryRows.length / CATEGORY_MANAGER_PAGE_SIZE));
  const activePage = Math.min(currentPage, totalPages);
  const pageStart = (activePage - 1) * CATEGORY_MANAGER_PAGE_SIZE;
  const pageEnd = Math.min(pageStart + CATEGORY_MANAGER_PAGE_SIZE, visibleCategoryRows.length);
  const pagedCategoryRows = visibleCategoryRows.slice(pageStart, pageEnd);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTag]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const resetForm = useCallback(
    (nextParentCategory = activeRootNode ? String(activeRootNode._id) : "") => {
      setEditingId("");
      setName("");
      setSlug("");
      setParentCategory(nextParentCategory);
      setSortOrder("0");
      setIsFeatured(false);
      setShowOnHome(false);
      setIsActive(true);
      setError(null);
    },
    [activeRootNode]
  );

  useEffect(() => {
    if (!categoryTree.length) return;

    const activeRootExists = findCategoryNode(categoryTree, activeTag);
    if (activeRootExists) return;

    const fallbackTag = CATEGORY_ROOT_TAGS.find((tag) => findCategoryNode(categoryTree, tag));
    if (fallbackTag) {
      setActiveTag(fallbackTag);
    }
  }, [activeTag, categoryTree]);

  const switchActiveTag = useCallback(
    (tag) => {
      const nextTag = CATEGORY_ROOT_TAGS.find((candidate) => normalizeText(candidate) === normalizeText(tag)) || CATEGORY_ROOT_TAGS[0];
      const nextRootNode = findCategoryNode(categoryTree, nextTag);

      setActiveTag(nextTag);
      setCurrentPage(1);
      resetForm(nextRootNode ? String(nextRootNode._id) : "");
    },
    [categoryTree, resetForm]
  );

  const startEdit = useCallback((category) => {
    setEditingId(String(category._id));
    setName(category.name || "");
    setSlug(category.slug || "");
    setParentCategory(category.parentCategory ? String(category.parentCategory) : activeRootNode ? String(activeRootNode._id) : "");
    setSortOrder(String(category.sortOrder ?? 0));
    setIsFeatured(!!category.isFeatured);
    setShowOnHome(!!category.showOnHome);
    setIsActive(category.isActive ?? true);
    setError(null);
  }, [activeRootNode]);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      parentCategory: parentCategory || (activeRootNode ? String(activeRootNode._id) : null),
      sortOrder: Number(sortOrder || 0),
      isFeatured,
      showOnHome,
      isActive,
    };

    try {
      if (editingId) {
        await axios.put(`${API_BASE}/admin/categories/${editingId}`, payload, { withCredentials: true });
      } else {
        await axios.post(`${API_BASE}/admin/categories`, payload, { withCredentials: true });
      }

      await onRefreshCategories();
      if (!editingId) {
        setCurrentPage(1);
      }
      toast({
        title: editingId ? "Category updated" : "Category created",
        variant: "success",
      });
      resetForm();
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Failed to save category";
      setError(message);
      toast({ title: "Category save failed", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [activeRootNode, editingId, isActive, isFeatured, name, onRefreshCategories, parentCategory, resetForm, showOnHome, slug, sortOrder, toast]);

  const handleDelete = useCallback(
    async (category) => {
      if (!window.confirm(`Delete ${category.name}?`)) return;
      setLoading(true);
      setError(null);

      try {
        await axios.delete(`${API_BASE}/admin/categories/${category._id}`, { withCredentials: true });
        await onRefreshCategories();
        if (editingId === String(category._id)) {
          resetForm();
        }
        toast({ title: "Category deleted", variant: "success" });
      } catch (err) {
        const message = err?.response?.data?.message || err?.message || "Failed to delete category";
        setError(message);
        toast({ title: "Delete failed", description: message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    },
    [editingId, onRefreshCategories, resetForm, toast]
  );

  const categoryOptions = collectCategoryOptions(activeRootNode ? [activeRootNode] : []).filter((option) => option.value !== editingId);

  return (
    <motion.div
      id="category-manager-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-manager-title"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="mb-8 rounded-3xl border border-white/10 bg-[#111111] p-5 md:p-6"
    >
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37]">Inline taxonomy editor</p>
          <h3 id="category-manager-title" className="mt-2 text-xl font-semibold text-white">Category management</h3>
          <p className="mt-1 text-sm text-white/50">Manage one root tag at a time so subcategory CRUD stays scoped and readable.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onRefreshCategories()}
            className="rounded-full border border-white/10 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-white/70 transition hover:border-[#D4AF37]/30 hover:text-[#D4AF37]"
          >
            Refresh tree
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-white/70 transition hover:border-white/25 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {CATEGORY_ROOT_TAGS.map((tag) => {
          const isActive = normalizeText(activeTag) === normalizeText(tag);
          const rootNode = findCategoryNode(categoryTree, tag);

          return (
            <button
              key={tag}
              type="button"
              onClick={() => switchActiveTag(tag)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] transition ${
                isActive
                  ? "border-[#D4AF37]/45 bg-[#D4AF37]/[0.12] text-[#D4AF37]"
                  : "border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white"
              }`}
            >
              {tag}
              <span className="rounded-full border border-current/20 px-2 py-0.5 text-[9px] tracking-[0.12em]">
                {rootNode?.children?.length || 0}
              </span>
            </button>
          );
        })}
      </div>

      {activeRootNode ? (
        <div className="mb-4 rounded-2xl border border-[#D4AF37]/15 bg-[#D4AF37]/[0.06] px-4 py-3 text-sm text-[#f2ca50]">
          Active tag: <span className="font-semibold">{activeRootNode.name}</span>
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-2xl border border-[#ffb4ab]/25 bg-[#ffb4ab]/10 px-4 py-3 text-sm text-[#ffb4ab]">
          {error}
        </div>
      ) : null}

      {visibleCategoryRows.length > CATEGORY_MANAGER_PAGE_SIZE ? (
        <div className="mb-4 rounded-2xl border border-white/5 bg-black/20 px-4 py-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-[10px] uppercase tracking-[0.22em] text-white/45">
              Showing {pageStart + 1}-{pageEnd} of {visibleCategoryRows.length} categories
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={activePage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/70 transition hover:border-[#D4AF37]/35 hover:text-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Previous category page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {[...Array(totalPages)].map((_, index) => {
                const pageNumber = index + 1;
                const isActivePage = activePage === pageNumber;

                return (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`inline-flex h-9 min-w-9 items-center justify-center rounded-full border px-3 text-[10px] font-bold uppercase tracking-[0.2em] transition ${
                      isActivePage
                        ? "border-[#D4AF37]/45 bg-[#D4AF37]/[0.12] text-[#D4AF37]"
                        : "border-white/10 bg-black/40 text-white/65 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}

              <button
                type="button"
                disabled={activePage === totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/70 transition hover:border-[#D4AF37]/35 hover:text-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Next category page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          {pagedCategoryRows.map((category) => (
            <div key={category._id} className="rounded-2xl border border-white/5 bg-black/20 p-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between" style={{ marginLeft: `${Math.min(category.level, 3) * 10}px` }}>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-white">{category.name}</p>
                  <span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.2em] ${category.isActive ? "bg-emerald-500/15 text-emerald-300" : "bg-white/5 text-white/40"}`}>
                    {category.isActive ? "Active" : "Inactive"}
                  </span>
                  {category.children?.length ? (
                    <span className="rounded-full bg-[#D4AF37]/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-[#D4AF37]">
                      {category.children.length} children
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-[#d0c5af]">{category.breadcrumb}</p>
                <p className="mt-1 text-[11px] text-white/40">/{category.slug}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(category)}
                  className="rounded-full border border-[#D4AF37]/35 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] transition hover:bg-[#D4AF37]/10"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(category)}
                  className="rounded-full border border-[#ffb4ab]/35 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-[#ffb4ab] transition hover:bg-[#ffb4ab]/10"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {activeRootNode && visibleCategoryRows.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-black/20 p-6 text-sm text-white/45">
              No subcategories exist under {activeRootNode.name} yet.
            </div>
          ) : null}
          {!activeRootNode ? (
            <div className="rounded-2xl border border-white/5 bg-black/20 p-6 text-sm text-white/45">
              No categories loaded yet.
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-white/5 bg-black/20 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-[#d0c5af]">{editingId ? "Edit category" : "Create category"}</p>
              <h4 className="mt-1 text-base font-semibold text-white">{editingId ? "Update taxonomy node" : "New taxonomy node"}</h4>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-white/10 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-white/60 transition hover:text-white"
            >
              New
            </button>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-white/50">Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm text-white outline-none transition focus:border-[#D4AF37]/40"
                placeholder="Ladies / Clothing / Dresses"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-white/50">Slug</span>
              <input
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm text-white outline-none transition focus:border-[#D4AF37]/40"
                placeholder="dresses"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-white/50">Parent category</span>
              <select
                value={parentCategory}
                onChange={(event) => setParentCategory(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm text-white outline-none transition focus:border-[#D4AF37]/40"
              >
                <option value="" disabled>
                  Select a parent inside {activeRootNode?.name || activeTag}
                </option>
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-white/50">Sort order</span>
              <input
                type="number"
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm text-white outline-none transition focus:border-[#D4AF37]/40"
                placeholder="e.g. 10"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm text-white">
                <span>Active</span>
                <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm text-white">
                <span>Featured</span>
                <input type="checkbox" checked={isFeatured} onChange={(event) => setIsFeatured(event.target.checked)} />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm text-white sm:col-span-2">
                <span>Show on home</span>
                <input type="checkbox" checked={showOnHome} onChange={(event) => setShowOnHome(event.target.checked)} />
              </label>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="rounded-full bg-[#D4AF37] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-black transition hover:bg-[#D4AF37]/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Saving..." : editingId ? "Update category" : "Create category"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-white/10 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-white/70 transition hover:border-white/25 hover:text-white"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Product = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialProductForm);
  const [selectedProductSlug, setSelectedProductSlug] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);

  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dropFilter, setDropFilter] = useState("");
  const [sortFilter, setSortFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [productImages, setProductImages] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);
  const [uploadColorTag, setUploadColorTag] = useState("");
  const [variantImageBusyIndex, setVariantImageBusyIndex] = useState(null);
  const [galleryTitle, setGalleryTitle] = useState("");
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [deleteConfirmSlug, setDeleteConfirmSlug] = useState(null);
  const [showProductSaved, setShowProductSaved] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState("basic");
  const [categoryTree, setCategoryTree] = useState([]);
  const [activeSubcategories, setActiveSubcategories] = useState([]);
  const [categorySelection, setCategorySelection] = useState("");
  const [subCategorySelection, setSubCategorySelection] = useState("");
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [fabricSelection, setFabricSelection] = useState("");
  const [gsmSelection, setGsmSelection] = useState("");
  const [sizeGuideSelection, setSizeGuideSelection] = useState(CUSTOM_OPTION);
  const [formSyncToken, setFormSyncToken] = useState(0);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [bulkPendingAction, setBulkPendingAction] = useState(null);

  const LIMIT = 10;
  const dispatch = useDispatch();
  const { toast } = useToast();

  const productList = useSelector((state) => state.product.productList || []);
  const isLoading = useSelector((state) => state.product.isLoading);
  const pagination = useSelector((state) => state.product.pagination || {});
  const { drops = [] } = useSelector((state) => state.drop) || {};

  const fetchProducts = useCallback(() => {
    return dispatch(
      getAllProducts({
        page: currentPage,
        limit: LIMIT,
        isActive: statusFilter === "all" || statusFilter === "low_stock" ? undefined : statusFilter,
        search: searchQuery,
        maxStock: statusFilter === "low_stock" ? 5 : undefined,
        category: categoryFilter || undefined,
        drop: dropFilter || undefined,
        sort: sortFilter || undefined,
      })
    );
  }, [dispatch, currentPage, statusFilter, searchQuery, categoryFilter, dropFilter, sortFilter]);

  const handleStatusFilterChange = (val) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };
  const handleCategoryFilterChange = (val) => {
    setCategoryFilter(val);
    setCurrentPage(1);
  };
  const handleDropFilterChange = (val) => {
    setDropFilter(val);
    setCurrentPage(1);
  };
  const handleSortFilterChange = (val) => {
    setSortFilter(val);
    setCurrentPage(1);
  };
  const handleSearchFilterChange = (val) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };
  const handleResetFilters = () => {
    setStatusFilter("all");
    setCategoryFilter("");
    setDropFilter("");
    setSortFilter("");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handleExport = () => {
    if (productList.length === 0) {
      toast({
        title: "No products to export",
        description: "The product list is empty.",
        variant: "warning"
      });
      return;
    }
    const headers = ["Name", "Art No", "Category", "SubCategory", "Base Price", "Total Stock", "Status", "Updated At"];
    const rows = productList.map(product => {
      const stock = product.variants?.reduce((sum, v) => sum + Number(v.stock), 0) || 0;
      return [
        `"${product.name.replace(/"/g, '""')}"`,
        `"${product.artNo || ''}"`,
        `"${product.category || ''}"`,
        `"${product.subCategory || ''}"`,
        product.basePrice || 0,
        stock,
        product.isActive ? "Published" : "Draft",
        product.updatedAt ? new Date(product.updatedAt).toISOString() : ""
      ];
    });
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Product_Ledger_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: "Export Successful",
      description: `Exported ${productList.length} products to CSV.`,
      variant: "success"
    });
  };

  const loadCategoryTree = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/categories`);
      if (response.data?.success) {
        const categories = response.data.data || [];
        setCategoryTree(buildCategoryTree(categories));
        return categories;
      }
    } catch (err) {
      console.error("Failed to load categories for admin form", err);
    }

    setCategoryTree([]);
    return [];
  }, []);

  useEffect(() => {
    dispatch(getAllDrops());
    fetchProducts();
    loadCategoryTree();
  }, [dispatch, fetchProducts, loadCategoryTree]);

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
    setUploadColorTag("");
    setVariantImageBusyIndex(null);
    setIsSavingProduct(false);
    setFormSyncToken((token) => token + 1);
    setActiveFormTab("basic");
    setCategorySelection("");
    setSubCategorySelection("");
    setFabricSelection("");
    setGsmSelection("");
    setSizeGuideSelection(CUSTOM_OPTION);
  };

  const openNewProductForm = () => {
    const draft = loadProductDraft();
    setFormData(draft ? { ...initialProductForm, ...draft, artNo: "" } : initialProductForm);
    setSelectedProductSlug(null);
    setSelectedProductId(null);
    setProductImages([]);
    setUploadColorTag("");
    setVariantImageBusyIndex(null);
    setActiveFormTab("basic");
    setShowForm(true);
    setFormSyncToken((token) => token + 1);
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
      const loadedImages = (res.data.images || []).map((image) => ({
        ...image,
        isUploaded: true,
      }));
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

  const syncFormSelections = useCallback(
    (nextFormData) => {
      let categoryPath = findCategoryPathBySegments(categoryTree, nextFormData.categoryPath);

      if (!categoryPath.length && nextFormData.categoryId) {
        categoryPath = findCategoryPath(categoryTree, nextFormData.categoryId);
      }

      if (!categoryPath.length && nextFormData.category) {
        categoryPath = findCategoryPath(categoryTree, nextFormData.category);
      }

      if (categoryPath.length === 1 && nextFormData.subCategory) {
        const childPath = findCategoryPath(categoryPath[0].children || [], nextFormData.subCategory);
        if (childPath.length) {
          categoryPath = [categoryPath[0], ...childPath];
        }
      }

      const categoryNode = categoryPath[0] || null;
      const selectedLeaf = categoryPath[categoryPath.length - 1] || null;
      const firstSubcategory = categoryPath[1] || null;

      if (categoryNode) {
        const normalizedCategory = categoryNode.name || nextFormData.category || "";
        const normalizedSubCategory = firstSubcategory?.name || nextFormData.subCategory || "";
        const normalizedCategoryId = String(selectedLeaf?._id || categoryNode._id);
        const normalizedCategoryPath = buildCategoryPathValue(categoryPath);
        const options = collectSubcategoryOptions(categoryNode);

        setCategorySelection(String(categoryNode._id));
        setActiveSubcategories(options);
        setSubCategorySelection(categoryPath.length > 1 ? String(selectedLeaf._id) : normalizedSubCategory ? CUSTOM_OPTION : "");

        if (
          nextFormData.category !== normalizedCategory ||
          nextFormData.subCategory !== normalizedSubCategory ||
          nextFormData.categoryId !== normalizedCategoryId ||
          nextFormData.categoryPath !== normalizedCategoryPath
        ) {
          setFormData((prev) => ({
            ...prev,
            category: normalizedCategory,
            subCategory: normalizedSubCategory,
            categoryId: normalizedCategoryId,
            categoryPath: normalizedCategoryPath,
          }));
        }
      } else {
        setCategorySelection(nextFormData.category ? CUSTOM_OPTION : "");
        setActiveSubcategories([]);
        setSubCategorySelection(nextFormData.subCategory ? CUSTOM_OPTION : "");
      }

      setFabricSelection(
        nextFormData.fabric
          ? MATERIAL_OPTIONS.includes(nextFormData.fabric)
            ? nextFormData.fabric
            : CUSTOM_OPTION
          : ""
      );
      setGsmSelection(
        nextFormData.gsm
          ? GSM_OPTIONS.includes(String(nextFormData.gsm))
            ? String(nextFormData.gsm)
            : CUSTOM_OPTION
          : ""
      );

      const matchedSizeGuide = findPresetByValue(nextFormData.sizeGuide, SIZE_GUIDE_PRESETS);
      setSizeGuideSelection(matchedSizeGuide ? matchedSizeGuide.value : nextFormData.sizeGuide ? CUSTOM_OPTION : "");
    },
    [categoryTree]
  );

  useEffect(() => {
    if (!showForm) return;
    if (categoryTree.length === 0) return;
    syncFormSelections(formData);
  }, [showForm, categoryTree, formSyncToken, syncFormSelections]);

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
      brand: product.brand || "Sovereign Elite",
      category: product.category || "",
      categoryId: product.categoryId || "",
      subCategory: product.subCategory || "",
      categoryPath: product.categoryPath || "",
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
    setFormSyncToken((token) => token + 1);
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

  const validateProductForm = (data = formData) => {
    if (!data.name.trim()) return "Product name is required.";
    if (!data.category?.trim() && !data.categoryId?.trim()) return "Category is required.";
    if (data.basePrice === "" || data.basePrice === null || Number(data.basePrice) < 0) {
      return "Base price must be 0 or greater.";
    }
    const validVariants = data.variants.filter(
      (v) =>
        v.size?.trim() &&
        v.color?.trim() &&
        v.stock !== "" &&
        v.stock !== null &&
        v.stock !== undefined
    );
    if (validVariants.length === 0) {
      return "At least one variant with size, color, and stock is required.";
    }
    const partialCount = data.variants.length - validVariants.length;
    if (partialCount > 0) {
      return "Each variant needs size, color, and stock. Remove or complete partial rows.";
    }
    return null;
  };

  const uploadProductImagesByColorTag = async (productId, imagesToUpload = []) => {
    const groups = imagesToUpload.reduce((map, image) => {
      const tag = String(image?.colorTag || "").trim();
      const key = tag.toLowerCase();
      const existing = map.get(key) || { colorTag: tag, images: [] };
      existing.images.push(image);
      map.set(key, existing);
      return map;
    }, new Map());

    const uploadedImages = [];

    for (const group of groups.values()) {
      const fd = new FormData();
      fd.append("refModel", "Product");
      fd.append("refId", productId);
      fd.append("type", "product");
      if (group.colorTag) fd.append("colorTag", group.colorTag);
      group.images.forEach((img) => fd.append("images", img.file));

      const res = await axios.post(`${API_BASE}/image/upload-image`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      uploadedImages.push(
        ...(res.data?.images || []).map((image) => ({
          ...image,
          isUploaded: true,
        }))
      );

      group.images.forEach((img) => revokeBlobUrl(img.url));
    }

    return uploadedImages;
  };

  const handleSubmit = async (studioFormData = formData, studioImages = productImages) => {
    if (isSavingProduct) return;

    const validationError = validateProductForm(studioFormData);
    if (validationError) {
      toast({ title: "Check the form", description: validationError, variant: "destructive" });
      return;
    }

    setIsSavingProduct(true);

    const isCreatingProduct = !selectedProductSlug;
    let createdProductForRollback = null;

    try {
      let result;
      const cleanData = {
        ...studioFormData,
        categoryId: studioFormData.categoryId || undefined,
        subCategory: studioFormData.subCategory || undefined,
        variants: studioFormData.variants.filter(
          (v) =>
            v.size?.trim() &&
            v.color?.trim() &&
            v.stock !== "" &&
            v.stock !== null &&
            v.stock !== undefined
        ),
      };

      if (!cleanData.categoryId) delete cleanData.categoryId;
      if (!cleanData.subCategory) delete cleanData.subCategory;

      if (selectedProductSlug) {
        result = await dispatch(updateProduct({ slug: selectedProductSlug, productData: cleanData })).unwrap();
      } else {
        result = await dispatch(createProduct(cleanData)).unwrap();
        createdProductForRollback = result.product || null;
      }

      const productId = result.product?._id;
      if (productId) {
        const newImages = studioImages.filter((img) => !img.isUploaded && img.file);
        if (newImages.length > 0) {
          try {
            await uploadProductImagesByColorTag(productId, newImages);
          } catch (uploadError) {
            if (isCreatingProduct && createdProductForRollback) {
              const rolledBack = await rollbackCreatedProduct(createdProductForRollback);
              if (rolledBack) fetchProducts();
              const uploadMessage = getErrorMessage(uploadError, "Image upload failed.");
              throw new Error(
                rolledBack
                  ? `${uploadMessage} Product was not created.`
                  : `${uploadMessage} Product was created, but automatic cleanup failed. Please delete it manually.`
              );
            }
            throw uploadError;
          }
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
    } finally {
      setIsSavingProduct(false);
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

  const handleVariantColorPick = (index, hex) => {
    const pickedHex = isHexColor(hex) ? hex : "#000000";
    const preset = COLOR_OPTIONS.find(
      (color) => color.hex.toLowerCase() === pickedHex.toLowerCase()
    );
    const updatedVariants = [...formData.variants];
    const current = updatedVariants[index] || {};
    const nextColor = preset?.name || current.color || "Custom";
    const variant = {
      ...current,
      color: nextColor,
      colorCode: pickedHex,
    };

    const currentAuto = generateSku(formData.artNo, current.size, current.color);
    if (!variant.sku || variant.sku === currentAuto) {
      variant.sku = generateSku(formData.artNo, variant.size, variant.color);
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

  const handleVariantImageSelect = (index) => {
    const variant = formData.variants[index];
    const colorTag = String(variant?.color || "").trim();

    if (!colorTag) {
      toast({
        title: "Add a colour first",
        description: "Variant images are matched by the colour name.",
        variant: "destructive",
      });
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (event) => {
      const originalFile = event.target.files?.[0];
      if (!originalFile) return;

      setVariantImageBusyIndex(index);

      try {
        const file = await compressImageFile(originalFile);
        if (!file) return;

        const existingImage = getImageForVariantColor(productImages, colorTag);

        if (!selectedProductId) {
          const stagedImage = {
            file,
            url: URL.createObjectURL(file),
            isUploaded: false,
            label: `Variant: ${colorTag}`,
            colorTag,
          };

          setProductImages((prev) => {
            const existingIndex = prev.findIndex(
              (img) => normalizeColorKey(img?.colorTag) === normalizeColorKey(colorTag)
            );
            if (existingIndex === -1) return [...prev, stagedImage];

            const next = [...prev];
            revokeBlobUrl(next[existingIndex]?.url);
            next[existingIndex] = stagedImage;
            return next;
          });
          setUploadColorTag(colorTag);
          toast({
            title: "Variant image staged",
            description: `${colorTag} image will upload when the product is saved.`,
            variant: "success",
          });
          return;
        }

        if (existingImage?._id) {
          const fd = new FormData();
          fd.append("image", file);

          const res = await axios.patch(
            `${API_BASE}/image/update-image/${existingImage._id}`,
            fd,
            {
              headers: { "Content-Type": "multipart/form-data" },
              withCredentials: true,
            }
          );

          if (res.data?.success) {
            const updatedImage = {
              ...res.data.image,
              colorTag: res.data.image?.colorTag || existingImage.colorTag || colorTag,
              isUploaded: true,
            };
            setProductImages((prev) =>
              prev.map((img) => (img._id === existingImage._id ? updatedImage : img))
            );
            setUploadColorTag(colorTag);
            toast({
              title: "Variant image updated",
              description: `${colorTag} image was replaced.`,
              variant: "success",
            });
          }
          return;
        }

        const fd = new FormData();
        fd.append("refModel", "Product");
        fd.append("refId", selectedProductId);
        fd.append("type", "product");
        fd.append("colorTag", colorTag);
        fd.append("images", file);

        const res = await axios.post(`${API_BASE}/image/upload-image`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        });

        if (res.data?.success) {
          const uploaded = (res.data.images || []).map((image) => ({
            ...image,
            isUploaded: true,
          }));
          setProductImages((prev) => [...prev, ...uploaded]);
          setUploadColorTag(colorTag);
          toast({
            title: "Variant image added",
            description: `${colorTag} image is ready for storefront switching.`,
            variant: "success",
          });
        }
      } catch (error) {
        toast({
          title: "Variant image failed",
          description: getErrorMessage(error, "Could not save this variant image."),
          variant: "destructive",
        });
      } finally {
        setVariantImageBusyIndex(null);
        input.value = "";
      }
    };

    input.click();
  };

  const handleCategoryChange = (value) => {
    setCategorySelection(value);

    if (!value || value === CUSTOM_OPTION) {
      setActiveSubcategories([]);
      setSubCategorySelection("");
      setFormData((prev) => ({
        ...prev,
        category: "",
        categoryId: "",
        subCategory: "",
        categoryPath: "",
      }));
      return;
    }

    const selectedCategory = findCategoryNode(categoryTree, value);
    if (!selectedCategory) {
      setActiveSubcategories([]);
      setSubCategorySelection("");
      setFormData((prev) => ({
        ...prev,
        categoryId: value,
        category: "",
        subCategory: "",
        categoryPath: "",
      }));
      return;
    }

    setActiveSubcategories(collectSubcategoryOptions(selectedCategory));
    setSubCategorySelection("");
    const rootPath = buildCategoryPathValue([selectedCategory]);
    setFormData((prev) => ({
      ...prev,
      category: selectedCategory.name || "",
      categoryId: String(selectedCategory._id),
      subCategory: "",
      categoryPath: rootPath,
    }));
  };

  const handleCategoryTextChange = (value) => {
    setCategorySelection(CUSTOM_OPTION);
    setSubCategorySelection("");
    setActiveSubcategories([]);
    setFormData((prev) => ({
      ...prev,
      category: value,
      categoryId: "",
      subCategory: "",
      categoryPath: "",
    }));
  };

  const handleSubCategoryChange = (value) => {
    setSubCategorySelection(value);

    if (!value || value === CUSTOM_OPTION) {
      const rootCategory = findCategoryNode(categoryTree, categorySelection);
      setFormData((prev) => ({
        ...prev,
        categoryId: rootCategory?._id ? String(rootCategory._id) : prev.categoryId,
        subCategory: "",
        categoryPath: rootCategory ? buildCategoryPathValue([rootCategory]) : prev.categoryPath,
      }));
      return;
    }

    const selectedOption = activeSubcategories.find((option) => option.value === value);
    if (!selectedOption) {
      setFormData((prev) => ({ ...prev, subCategory: value }));
      return;
    }

    const selectedPath = selectedOption.path || [];
    const selectedLeaf = selectedPath[selectedPath.length - 1];

    setCategorySelection(String(selectedLeaf._id));
    setActiveSubcategories(collectSubcategoryOptions(selectedLeaf));
    setSubCategorySelection("");

    setFormData((prev) => ({
      ...prev,
      category: selectedLeaf?.name || prev.category,
      categoryId: selectedLeaf?._id ? String(selectedLeaf._id) : prev.categoryId,
      subCategory: "",
      categoryPath: buildCategoryPathValue(selectedPath),
    }));
  };

  const handleSubCategoryTextChange = (value) => {
    setSubCategorySelection(CUSTOM_OPTION);
    const rootCategory = findCategoryNode(categoryTree, categorySelection);
    const rootPath = rootCategory ? buildCategoryPathValue([rootCategory]) : "";
    const customPath = [rootPath, normalizeCategorySegment(value)].filter(Boolean).join("/");
    setFormData((prev) => ({
      ...prev,
      categoryId: rootCategory?._id ? String(rootCategory._id) : prev.categoryId,
      subCategory: value,
      categoryPath: customPath,
    }));
  };

  const handleFabricSelectionChange = (value) => {
    setFabricSelection(value);
    if (!value || value === CUSTOM_OPTION) {
      setFormData((prev) => ({ ...prev, fabric: "" }));
      return;
    }
    setFormData((prev) => ({ ...prev, fabric: value }));
  };

  const handleFabricTextChange = (value) => {
    setFabricSelection(CUSTOM_OPTION);
    setFormData((prev) => ({ ...prev, fabric: value }));
  };

  const handleGsmSelectionChange = (value) => {
    setGsmSelection(value);
    if (!value || value === CUSTOM_OPTION) {
      setFormData((prev) => ({ ...prev, gsm: "" }));
      return;
    }
    setFormData((prev) => ({ ...prev, gsm: value }));
  };

  const handleGsmTextChange = (value) => {
    setGsmSelection(CUSTOM_OPTION);
    setFormData((prev) => ({ ...prev, gsm: value }));
  };

  const handleSizeGuideSelectionChange = (value) => {
    setSizeGuideSelection(value);
    if (!value || value === CUSTOM_OPTION) return;
    const preset = findPresetByValue(value, SIZE_GUIDE_PRESETS);
    if (preset) {
      setFormData((prev) => ({ ...prev, sizeGuide: preset.guide }));
    }
  };

  const handleSizeGuideTextChange = (value) => {
    setSizeGuideSelection(CUSTOM_OPTION);
    setFormData((prev) => ({ ...prev, sizeGuide: value }));
  };

  // ----- ATELIER FORM (Luxury Control Panel with Tabs) -----
  // ----- LEDGER LIST VIEW -----
  // ----- ATELIER FORM (Luxury Control Panel with Tabs) -----
  // ----- LEDGER LIST VIEW -----
  const bulkActions = [
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
  ];

  const runBulkAction = (action) => {
    if (action.confirm) {
      setBulkPendingAction(action);
      return;
    }
    action.onClick?.();
  };

  const confirmBulkPending = () => {
    if (!bulkPendingAction) return;
    bulkPendingAction.onClick?.();
    setBulkPendingAction(null);
  };

  return (
    <Fragment>
    <AdminPage
      eyebrow="Catalog management"
      title="Product Ledger"
      description="Manage products, variants, stock, visibility, and gallery assets."
      actions={
        <>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/5"
          >
            <Download className="h-4 w-4" /> Export
          </button>
          <PrimaryButton onClick={openNewProductForm}>
            <Plus className="h-4 w-4" /> Create Product
          </PrimaryButton>
        </>
      }
    >
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="w-full flex-1 flex flex-col max-w-full overflow-x-hidden"
    >
      <div className="w-full">
        <ToastFlash show={showProductSaved} message="Product saved" />
      </div>

      <div className="w-full pb-12 pt-6 scroll-smooth">
        {isLoading ? (
          <SkeletonGrid count={6} />
        ) : (
        <>
        <SearchFilterBar 
          searchValue={searchQuery} 
          onSearchChange={handleSearchFilterChange} 
          searchPlaceholder="Search the collection…"
          className="mb-8 justify-between"
        >
          <div className="flex flex-wrap gap-3 items-center">
            {/* Status Dropdown */}
            <FilterSelect
              value={statusFilter}
              onChange={handleStatusFilterChange}
              options={[
                { value: "all", label: "Status: All" },
                { value: "true", label: "Status: Active" },
                { value: "false", label: "Status: Inactive" },
                { value: "low_stock", label: "Status: Low Stock" }
              ]}
              className="min-w-[150px]"
            />

            {/* Category Dropdown */}
            <FilterSelect
              value={categoryFilter}
              onChange={handleCategoryFilterChange}
              options={[
                { value: "", label: "Category: All" },
                ...collectFilterCategoryOptions(categoryTree)
              ]}
              className="min-w-[170px]"
            />

            {/* Drop Dropdown */}
            <FilterSelect
              value={dropFilter}
              onChange={handleDropFilterChange}
              options={[
                { value: "", label: "Drop: All" },
                ...drops.map(d => ({ value: d._id, label: `Drop: ${d.name}` }))
              ]}
              className="min-w-[160px]"
            />

            {/* Sort Dropdown */}
            <FilterSelect
              value={sortFilter}
              onChange={handleSortFilterChange}
              options={[
                { value: "", label: "Sort By: Newest" },
                { value: "basePrice", label: "Price: Low to High" },
                { value: "-basePrice", label: "Price: High to Low" },
                { value: "name", label: "Name: A-Z" },
                { value: "-name", label: "Name: Z-A" }
              ]}
              className="min-w-[160px]"
            />

            {/* Manage Categories inline toggle */}
            <button
              type="button"
              onClick={() => setCategoryManagerOpen((state) => !state)}
              aria-expanded={categoryManagerOpen}
              aria-controls="category-manager-panel"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D4AF37]/20 bg-transparent px-4 text-[13px] font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/10"
            >
              <Settings className="h-4 w-4" />
              Taxonomy
            </button>

            {/* Reset Filters button */}
            {(statusFilter !== "all" || categoryFilter !== "" || dropFilter !== "" || sortFilter !== "" || searchQuery !== "") && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-semibold text-white/50 hover:text-white transition-colors underline decoration-dotted underline-offset-4"
              >
                Reset Filters
              </button>
            )}
          </div>
        </SearchFilterBar>

        <AnimatePresence>
          {categoryManagerOpen ? (
            <CategoryManagerPanel
              categoryTree={categoryTree}
              onRefreshCategories={loadCategoryTree}
              onClose={() => setCategoryManagerOpen(false)}
            />
          ) : null}
        </AnimatePresence>

        {/* Inline Bulk Actions Bar */}
        <AnimatePresence>
          {bulk.count > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-saga-primary/30 bg-saga-primary/[0.03] px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white" data-testid="admin-bulk-count">
                    {bulk.count}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-[#D4AF37]">selected</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {bulkActions.map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      disabled={bulkPending}
                      onClick={() => runBulkAction(action)}
                      data-testid={`admin-bulk-action-${action.label.toLowerCase().replace(/\s+/g, "-")}`}
                      className={`rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50 ${
                        action.variant === "destructive"
                          ? "border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                          : "border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20"
                      }`}
                    >
                      {bulkPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        action.label
                      )}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={bulk.clear}
                    disabled={bulkPending}
                    className="rounded-full border border-white/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/60 transition hover:border-white/20 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Native Data Table Layout */}
        <div className="w-full max-w-full overflow-x-auto rounded-[20px] border border-[#D4AF37]/12 bg-[#090909]">
          <table className="min-w-full border-collapse text-left text-[14px]">
            <thead className="sticky top-0 z-10 bg-[#0B0B0B]">
              <tr className="border-b border-[#D4AF37]/12 bg-[#111] text-[12px] uppercase tracking-wider text-[#A0A0A0] font-semibold">
                <th className="py-4 pl-4 pr-3 w-10">
                  <input
                    type="checkbox"
                    aria-label="Select all products on this page"
                    checked={bulk.isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = bulk.isSomeSelected;
                    }}
                    onChange={bulk.toggleAll}
                    className="h-4 w-4 cursor-pointer accent-[#D4AF37]"
                    data-testid="admin-bulk-select-all"
                  />
                </th>
                <th className="py-4 px-3 min-w-[220px]">Product</th>
                <th className="py-4 px-3 w-[120px]">Art No.</th>
                <th className="py-4 px-3 min-w-[160px]">Category</th>
                <th className="py-4 px-3 w-[100px]">Variants</th>
                <th className="py-4 px-3 w-[120px]">Price</th>
                <th className="py-4 px-3 w-[100px]">Stock</th>
                <th className="py-4 px-3 w-[125px]">Status</th>
                <th className="py-4 px-3 w-[120px]">Updated</th>
                <th className="py-4 px-3 text-right pr-4 w-[110px]">Actions</th>
              </tr>
            </thead>
            <motion.tbody
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {productList.map((product) => {
                const stock = product.variants?.reduce((sum, v) => sum + Number(v.stock), 0) || 0;
                const isSelected = bulk.isSelected(product._id);
                return (
                  <Fragment key={product._id}>
                    <motion.tr
                      variants={itemVariants}
                      whileHover={{ backgroundColor: "#101010" }}
                      transition={{ duration: 0.2 }}
                      className={`border-b border-[#D4AF37]/12 transition-colors hover:bg-[#101010] even:bg-[#050505] odd:bg-[#0B0B0B] ${
                        isSelected ? "bg-[#D4AF37]/10" : ""
                      }`}
                    >
                      <td className="py-4 pl-4 pr-3">
                        <input
                          type="checkbox"
                          aria-label={`Select ${product.name}`}
                          checked={isSelected}
                          onChange={() => bulk.toggle(product._id)}
                          className="h-4 w-4 cursor-pointer accent-[#D4AF37]"
                          data-testid="admin-bulk-row-select"
                        />
                      </td>
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-[#101010] shrink-0 overflow-hidden border border-[#D4AF37]/12 flex items-center justify-center rounded-lg">
                            {product.images && product.images.length > 0 ? (
                              <img className="w-full h-full object-cover" src={product.images[0].url} alt={product.name} />
                            ) : (
                              <Package className="w-5 h-5 text-white/30" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span 
                              onClick={() => beginEdit(product)}
                              className="block text-[14px] font-normal text-white truncate hover:text-[#D4AF37] cursor-pointer transition-colors"
                            >
                              {product.name}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-3 text-[12px] font-normal text-[#707070]">
                        {product.artNo || 'N/A'}
                      </td>
                      <td className="py-4 px-3 text-[14px] font-normal text-[#A0A0A0]">
                        {formatCategoryPathDisplay(product.categoryPath) || [product.category, product.subCategory].filter(Boolean).join(" / ") || 'Uncategorized'}
                      </td>
                      <td className="py-4 px-3 text-[12px] font-normal text-[#707070]">
                        {product.variants?.length || 0} variant{product.variants?.length === 1 ? '' : 's'}
                      </td>
                      <td className="py-4 px-3 text-[14px] font-normal text-white">
                        LKR {Number(product.basePrice || 0).toLocaleString()}
                      </td>
                      <td className="py-4 px-3 text-[14px] font-normal">
                        <span className={`${stock === 0 ? 'text-rose-400 font-bold' : stock <= 5 ? 'text-amber-400 font-medium' : 'text-[#A0A0A0]'}`}>
                          {stock} units
                        </span>
                      </td>
                      <td className="py-4 px-3">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${product.isActive ? 'border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]' : 'border-[#707070]/20 bg-black/40 text-[#707070]'}`}>
                          {product.isActive ? 'Active' : 'Draft'}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-[12px] font-normal text-[#707070]">
                        {product.updatedAt ? new Date(product.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                      </td>
                      <td className="py-4 px-3 text-right pr-4">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            type="button" 
                            onClick={() => openProductGallery(product)} 
                            className="hover:text-[#D4AF37] hover:bg-white/5 transition-all text-white/60 p-2 rounded-lg" 
                            title="View images"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            type="button" 
                            onClick={() => beginEdit(product)} 
                            className="hover:text-[#D4AF37] hover:bg-white/5 transition-all text-white/60 p-2 rounded-lg" 
                            title="Edit product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmSlug((s) => (s === product.slug ? null : product.slug))}
                            className="hover:text-rose-400 hover:bg-white/5 transition-all text-white/60 p-2 rounded-lg"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                    {deleteConfirmSlug === product.slug && (
                      <tr className="border-b border-white/5 bg-rose-500/[0.02]">
                        <td colSpan={10} className="py-3 px-6">
                          <ConfirmInline
                            show={true}
                            message="Delete this product permanently?"
                            onCancel={() => setDeleteConfirmSlug(null)}
                            onConfirm={() => {
                              const slug = product.slug;
                              setDeleteConfirmSlug(null);
                              dispatch(deleteProduct(slug)).then(() => fetchProducts());
                            }}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </motion.tbody>
          </table>

          {productList.length === 0 && (
            <div className="py-20 text-center border-t border-white/10 text-white/40 font-sans">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No products found in the ledger.</p>
            </div>
          )}
        </div>

        {/* Boxed Style Pagination */}
        {productList.length > 0 && pagination.totalPages > 1 && (
          <div className="mt-8 flex flex-col sm:flex-row justify-between items-center border border-white/10 bg-black/40 rounded-2xl p-4 gap-4">
            <span className="text-xs uppercase tracking-widest text-white/40 font-semibold">
              Showing {productList.length} products
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-white/10 bg-transparent text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {[...Array(pagination.totalPages)].map((_, i) => {
                const pageNum = i + 1;
                const isCurrent = currentPage === pageNum;
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg border text-xs font-semibold transition-colors ${
                      isCurrent
                        ? 'bg-white text-black border-transparent font-bold'
                        : 'border-white/10 bg-transparent text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                disabled={currentPage === pagination.totalPages}
                onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-white/10 bg-transparent text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        </>
        )}
      </div>
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
    <AnimatePresence mode="wait">
      {showForm ? (
        <ProductStudio 
          initialData={formData} 
          initialImages={productImages}
          isDraftMode={!selectedProductSlug}
          categoryTree={categoryTree} 
          drops={drops}
          onBack={resetForm}
          onSaveDraft={() => handleSubmit(formData, productImages)}
          onSubmit={handleSubmit}
        />
      ) : null}
    </AnimatePresence>

    {/* Bulk Actions confirmation dialog */}
    <AnimatePresence>
      {bulkPendingAction && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setBulkPendingAction(null)}
        >
          <motion.div
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-black p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-rose-500/30 bg-rose-500/10">
                <AlertCircle className="h-5 w-5 text-rose-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">
                  {bulkPendingAction.confirm.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-400">
                  {bulkPendingAction.confirm.body}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setBulkPendingAction(null)}
                className="rounded-full border border-gray-700 px-5 py-2 text-xs font-bold uppercase tracking-widest text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmBulkPending}
                className="rounded-full border border-rose-500/40 bg-rose-500/20 px-5 py-2 text-xs font-bold uppercase tracking-widest text-rose-200 hover:bg-rose-500/30"
              >
                {bulkPendingAction.confirm.confirmLabel || "Confirm"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </Fragment>
  );
};
export default Product;
