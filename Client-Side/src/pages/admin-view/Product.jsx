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
  Loader2,
} from "lucide-react";
import { AdminPage } from "@/components/admin-components/AdminUI";
import { SearchFilterBar } from "@/components/admin-components/_shared/SearchFilterBar";
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

  const activeRootNode = findCategoryNode(categoryTree, activeTag) || categoryTree[0] || null;
  const visibleCategoryTree = activeRootNode ? activeRootNode.children || [] : [];

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

  const renderNodes = useCallback(
    (nodes = [], path = []) =>
      nodes.map((category) => {
        const nextPath = [...path, category.name];
        return (
          <div key={category._id} className="space-y-3">
            <div className="rounded-2xl border border-white/5 bg-black/20 p-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
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
                <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-[#d0c5af]">{nextPath.join(" / ")}</p>
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

            {category.children?.length ? (
              <div className="pl-4 border-l border-white/5">{renderNodes(category.children, nextPath)}</div>
            ) : null}
          </div>
        );
      }),
    [handleDelete, startEdit]
  );

  const categoryOptions = collectCategoryOptions(activeRootNode ? [activeRootNode] : []).filter((option) => option.value !== editingId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="mb-8 overflow-hidden rounded-3xl border border-white/10 bg-[#111111] p-5 md:p-6"
    >
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37]">Inline taxonomy editor</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Category management</h3>
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

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          {renderNodes(visibleCategoryTree, activeRootNode ? [activeRootNode.name] : [])}
          {activeRootNode && visibleCategoryTree.length === 0 ? (
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
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [productImages, setProductImages] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);
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
      })
    );
  }, [dispatch, currentPage, statusFilter, searchQuery]);

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

  const validateProductForm = () => {
    if (!formData.name.trim()) return "Product name is required.";
    if (!formData.category?.trim() && !formData.categoryId?.trim()) return "Category is required.";
    if (formData.basePrice === "" || formData.basePrice === null || Number(formData.basePrice) < 0) {
      return "Base price must be 0 or greater.";
    }
    const validVariants = formData.variants.filter(
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
    const partialCount = formData.variants.length - validVariants.length;
    if (partialCount > 0) {
      return "Each variant needs size, color, and stock. Remove or complete partial rows.";
    }
    return null;
  };

  const handleSubmit = async () => {
    if (isSavingProduct) return;

    const validationError = validateProductForm();
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
        ...formData,
        categoryId: formData.categoryId || undefined,
        subCategory: formData.subCategory || undefined,
        variants: formData.variants.filter(
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
        const newImages = productImages.filter((img) => !img.isUploaded && img.file);
        if (newImages.length > 0) {
          const fd = new FormData();
          fd.append("refModel", "Product");
          fd.append("refId", productId);
          fd.append("type", "product");
          newImages.forEach((img) => fd.append("images", img.file));
          try {
            await axios.post(`${API_BASE}/image/upload-image`, fd, {
              headers: { "Content-Type": "multipart/form-data" },
              withCredentials: true,
            });
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
    const rootCategory = selectedPath[0];
    const firstSubcategory = selectedPath[1];
    const selectedLeaf = selectedPath[selectedPath.length - 1];

    setFormData((prev) => ({
      ...prev,
      category: rootCategory?.name || prev.category,
      categoryId: selectedLeaf?._id ? String(selectedLeaf._id) : prev.categoryId,
      subCategory: firstSubcategory?.name || selectedLeaf?.name || "",
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
    Boolean(formData.category?.trim() || formData.categoryId?.trim()),
    Number(formData.basePrice) > 0,
    formData.variants.some(
      (v) => v.size?.trim() && v.color?.trim() && v.stock !== ""
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
              ? `${formData.artNo} · ${formatCategoryPathDisplay(formData.categoryPath) || [formData.category, formData.subCategory].filter(Boolean).join(" / ") || "Uncategorized"} · ${formData.brand}`
              : "Art number will be generated automatically on save"
          }
          onCancel={resetForm}
          onPublish={handleSubmit}
          publishLabel={
            isSavingProduct
              ? selectedProductSlug
                ? "Saving Product"
                : "Creating Product"
              : selectedProductSlug
                ? "Save Product"
                : "Publish Product"
          }
          isSubmitting={isSavingProduct}
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
                    ? `LKR ${Number(formData.basePrice).toLocaleString()}`
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
              optional
              helper={
                selectedProductSlug
                  ? "Stable internal SKU root. Cannot be changed after orders exist."
                  : "Generated automatically when the product is saved."
              }
            >
              <LuxuryInput
                type="text"
                value={formData.artNo}
                readOnly
                disabled={!selectedProductSlug}
                placeholder="Generated automatically"
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

            <FormField
              label="Category"
              required
              helper="Pick an existing system category or create a new one on the fly."
            >
              <div className="space-y-3">
                <LuxurySelect
                  value={categorySelection}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                >
                  <option value="">Select Category</option>
                  {categoryTree.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                  <option value={CUSTOM_OPTION}>Other / New category</option>
                </LuxurySelect>

                {categorySelection === CUSTOM_OPTION ? (
                  <LuxuryInput
                    type="text"
                    value={formData.category}
                    onChange={(e) => handleCategoryTextChange(e.target.value)}
                    placeholder="Enter a new category"
                    maxLength={100}
                  />
                ) : null}
              </div>
            </FormField>

            <FormField
              label="Sub-Category Division"
              optional
              helper="Choose any nested division under the selected category, or add a new one."
            >
              {categorySelection ? (
                <div className="space-y-3">
                  {activeSubcategories.length > 0 ? (
                    <LuxurySelect
                      value={subCategorySelection}
                      onChange={(e) => handleSubCategoryChange(e.target.value)}
                    >
                      <option value="">No sub-category</option>
                      {activeSubcategories.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                      <option value={CUSTOM_OPTION}>Other / New sub-category</option>
                    </LuxurySelect>
                  ) : (
                    <LuxuryInput
                      type="text"
                      value={formData.subCategory}
                      onChange={(e) => handleSubCategoryTextChange(e.target.value)}
                      placeholder="Enter a sub-category"
                      maxLength={120}
                    />
                  )}

                  {activeSubcategories.length > 0 && subCategorySelection === CUSTOM_OPTION ? (
                    <LuxuryInput
                      type="text"
                      value={formData.subCategory}
                      onChange={(e) => handleSubCategoryTextChange(e.target.value)}
                      placeholder="Enter a new sub-category"
                      maxLength={120}
                    />
                  ) : null}

                  {formData.categoryPath ? (
                    <p className="text-[11px] leading-relaxed text-white/35">
                      {formatCategoryPathDisplay(formData.categoryPath)}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="text-[11px] leading-relaxed text-white/35">
                  Select a category first to add or pick a sub-category.
                </p>
              )}
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
            <FormField
              label="Fabric / Material"
              optional
              helper="Choose a common material or enter a custom one."
            >
              <div className="space-y-3">
                <LuxurySelect
                  value={fabricSelection}
                  onChange={(e) => handleFabricSelectionChange(e.target.value)}
                >
                  <option value="">Select material</option>
                  {MATERIAL_OPTIONS.map((material) => (
                    <option key={material} value={material}>
                      {material}
                    </option>
                  ))}
                  <option value={CUSTOM_OPTION}>Other / Custom material</option>
                </LuxurySelect>

                {fabricSelection === CUSTOM_OPTION ? (
                  <LuxuryInput
                    type="text"
                    value={formData.fabric}
                    onChange={(e) => handleFabricTextChange(e.target.value)}
                    placeholder="Enter a custom material"
                    maxLength={200}
                  />
                ) : null}
              </div>
            </FormField>

            <FormField
              label="GSM"
              optional
              helper="Choose a common fabric weight or enter your own."
            >
              <div className="space-y-3">
                <LuxurySelect
                  value={gsmSelection}
                  onChange={(e) => handleGsmSelectionChange(e.target.value)}
                >
                  <option value="">Select GSM</option>
                  {GSM_OPTIONS.map((gsm) => (
                    <option key={gsm} value={gsm}>
                      {gsm} GSM
                    </option>
                  ))}
                  <option value={CUSTOM_OPTION}>Other / Custom GSM</option>
                </LuxurySelect>

                {gsmSelection === CUSTOM_OPTION ? (
                  <LuxuryInput
                    type="text"
                    value={formData.gsm}
                    onChange={(e) => handleGsmTextChange(e.target.value)}
                    placeholder="Enter a custom GSM"
                    maxLength={100}
                  />
                ) : null}
              </div>
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
            helper="Pick a country template or keep a custom size guide."
            hint={`${(formData.sizeGuide || '').length} / 2000`}
          >
            <div className="space-y-3">
              <LuxurySelect
                value={sizeGuideSelection}
                onChange={(e) => handleSizeGuideSelectionChange(e.target.value)}
              >
                <option value="">Select a size guide</option>
                {SIZE_GUIDE_PRESETS.map((preset) => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
                <option value={CUSTOM_OPTION}>Other / Custom size guide</option>
              </LuxurySelect>

              <LuxuryTextarea
                value={formData.sizeGuide}
                onChange={(e) => handleSizeGuideTextChange(e.target.value)}
                placeholder="Model wears size M. Height 185cm, chest 96cm…"
                rows={3}
                maxLength={2000}
              />
            </div>
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
                  placeholder="e.g. 4500"
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
                placeholder="0"
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
                placeholder="e.g. 2"
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
                placeholder="e.g. 2800"
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
          <div className="overflow-x-auto admin-panel border border-white/[0.06]">
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
                            placeholder={formData.artNo ? "Auto-generated" : "Generated after save"}
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

                      {/* Color picker with optional preset names */}
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={getVariantColorCode(v)}
                            onChange={(e) => handleVariantColorPick(i, e.target.value)}
                            className="h-8 w-8 shrink-0 cursor-pointer rounded border border-white/20 bg-transparent p-0.5"
                            title="Pick color"
                          />
                          <LuxuryInput
                            type="text"
                            value={v.color || ""}
                            list={`variant-color-options-${i}`}
                            onChange={(e) => handleVariantChange(i, "color", e.target.value)}
                            placeholder="Color name"
                            className="text-xs py-1.5 flex-1"
                          />
                          <datalist id={`variant-color-options-${i}`}>
                            {COLOR_OPTIONS.map((c) => (
                              <option key={c.name} value={c.name} />
                            ))}
                          </datalist>
                        </div>
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
                          placeholder="0"
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
                          placeholder="0"
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
          <ImageUpload
            images={productImages}
            setImages={setProductImages}
            isMultiple
            refModel="Product"
            refId={selectedProductId || undefined}
            type="product"
            stagedOnly={!selectedProductId}
          />
          {!selectedProductId ? (
            <p className="mt-3 text-[11px] text-white/40">
              Pick images now. They stay in the browser until you save the product, then they upload automatically.
            </p>
          ) : productImages.length > 0 ? (
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
              disabled={isFirst || isSavingProduct}
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
                disabled={isSavingProduct}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-black transition hover:bg-[#D4AF37]/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingProduct ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : null}
                {isSavingProduct
                  ? selectedProductSlug
                    ? "Saving product"
                    : "Creating product"
                  : selectedProductSlug
                    ? "Save product"
                    : "Publish product"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveFormTab(tabIds[idx + 1])}
                disabled={isSavingProduct}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/[0.08] px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-[#D4AF37] transition hover:bg-[#D4AF37]/15 disabled:cursor-not-allowed disabled:opacity-50"
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
      className="flex-1 flex flex-col bg-surface text-on-surface rounded-3xl border border-white/10"
    >
      <div className="border-b border-white/10 px-6 py-3">
        <ToastFlash show={showProductSaved} message="Product saved" />
      </div>

      <div className="px-8 md:px-16 pt-8 pb-12 scroll-smooth">
        {isLoading ? (
          <SkeletonGrid count={6} />
        ) : (
        <>
        <SearchFilterBar 
          searchValue={searchQuery} 
          onSearchChange={setSearchQuery} 
          searchPlaceholder="Search the collection…"
          className="mb-8 justify-between"
        >
          <div className="flex flex-wrap gap-4 items-center">
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
              type="button"
              onClick={() => setCategoryManagerOpen((state) => !state)}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/[0.08] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#D4AF37] transition hover:bg-[#D4AF37]/15"
            >
              <Settings className="h-3.5 w-3.5" />
              {categoryManagerOpen ? "Hide Categories" : "Manage Categories"}
            </button>
            <PrimaryButton onClick={openNewProductForm}>
              <Plus className="w-3 h-3" />
              New Product
            </PrimaryButton>
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
                className={`group relative grid grid-cols-1 md:grid-cols-12 gap-4 items-center admin-panel border ${
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

                <div className="col-span-1 md:col-span-2 min-w-0 pr-4">
                  <span className="block truncate text-[10px] uppercase tracking-widest text-on-surface-variant px-3 py-1 bg-surface-container-highest">
                    {formatCategoryPathDisplay(product.categoryPath) || [product.category, product.subCategory].filter(Boolean).join(" / ") || 'Uncategorized'}
                  </span>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <span className="text-[10px] uppercase tracking-widest text-saga-primary font-bold">LKR {Number(product.basePrice || 0).toLocaleString()}</span>
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
