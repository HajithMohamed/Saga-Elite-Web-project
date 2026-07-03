import React, { useEffect, useState, useCallback, Fragment, useRef } from "react";
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkUpdateProducts,
} from "@/store/admin/product-slice";
import { PrimaryButton } from "@/components/admin-components/_shared/Buttons";
import useBulkSelection from "@/hooks/use-bulk-selection";
import { getAllDrops } from "@/store/admin/drop-slice";
import { useToast } from "@/hooks/use-toast";
import { useSocketEvent } from "@/hooks/use-socket-events";
import ImageGalleryModal from "@/components/admin-components/ImageGalleryModal";
import axios from "axios";
import axiosInstance from "@/api/axiosInstance";
import { API_V1_URL as API_BASE } from "@/lib/api";
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Package,
  Eye,
  Copy,
  Download,
  Loader2,
  MoreVertical,
  AlertCircle,
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
import { ProductStudio } from "@/components/admin-components/product-studio";
import {
  initialProductForm,
  defaultVariant,
  PRODUCT_DRAFT_KEY,
  validateProductFormData,
  computeVariantStockSummary,
} from "@/components/admin-components/product-studio/ProductFormContext";

const normalizeText = (value = "") => String(value).trim().toLowerCase();

const getErrorMessage = (error, fallback = "Request failed") => {
  if (typeof error === "string") return error;
  return error?.response?.data?.message || error?.message || error?.error || fallback;
};

const revokeBlobUrl = (url) => {
  if (typeof url === "string" && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
};

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

const getProductLedgerMeta = (product) => {
  const summary = computeVariantStockSummary(product.variants || []);
  const colors = summary.colorBreakdown.map((c) => c.color).slice(0, 3);
  const sizes = summary.sizeBreakdown.map((s) => s.size).slice(0, 4);
  const lowThreshold = Number(product.lowStockThreshold) || 5;
  const isLowStock = summary.totalStock > 0 && summary.totalStock <= lowThreshold;
  const isOutOfStock = summary.totalStock === 0;

  return {
    ...summary,
    colors,
    sizes,
    isLowStock,
    isOutOfStock,
    hasDiscount: Number(product.discountPercent) > 0,
  };
};

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

const collectFilterCategoryOptions = (categories = [], path = []) =>
  categories.flatMap((category) => [
    {
      value: category.name,
      label: [...path, category.name].join(" / "),
    },
    ...collectFilterCategoryOptions(category.children || [], [...path, category.name]),
  ]);

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
  const [galleryTitle, setGalleryTitle] = useState("");
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [deleteConfirmSlug, setDeleteConfirmSlug] = useState(null);
  const [showProductSaved, setShowProductSaved] = useState(false);
  const [categoryTree, setCategoryTree] = useState([]);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [bulkPendingAction, setBulkPendingAction] = useState(null);
  const [studioGalleryProduct, setStudioGalleryProduct] = useState(null);

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
        isActive: statusFilter === "low_stock" ? undefined : statusFilter,
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

  useSocketEvent(
    "product:created",
    () => {
      fetchProducts();
      toast({
        title: "Catalog updated",
        description: "A new product was added.",
        variant: "success",
      });
    },
    [fetchProducts, toast]
  );

  useSocketEvent(
    "product:deleted",
    () => {
      fetchProducts();
      toast({
        title: "Catalog updated",
        description: "A product was removed.",
        variant: "success",
      });
    },
    [fetchProducts, toast]
  );

  const stockSnapshotRef = useRef(new Map());

  useEffect(() => {
    const next = new Map();
    productList.forEach((product) => {
      const stock = product.variants?.reduce((sum, v) => sum + Number(v.stock), 0) || 0;
      next.set(String(product._id), stock);
    });
    stockSnapshotRef.current = next;
  }, [productList]);

  useSocketEvent(
    "product:updated",
    (payload = {}) => {
      const productId = String(payload.productId || payload._id || "");
      if (!productId) return;

      const variants = payload.changes?.variants || payload.variants;
      if (!variants) return;

      const prevStock = stockSnapshotRef.current.get(productId);
      const newStock = variants.reduce((sum, v) => sum + Number(v.stock), 0);
      if (prevStock === undefined || prevStock === newStock) return;

      const product = productList.find((p) => String(p._id) === productId);
      toast({
        title: "Stock updated",
        description: product
          ? `${product.name}: ${prevStock} → ${newStock} units`
          : `Inventory changed to ${newStock} units`,
        variant: "success",
      });
    },
    [productList, toast]
  );

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
    setStudioGalleryProduct(null);
    setIsSavingProduct(false);
  };

  const openNewProductForm = () => {
    const draft = loadProductDraft();
    setFormData(
      draft
        ? {
            ...initialProductForm,
            ...draft,
            artNo: "",
            variants: (draft.variants || [{ ...defaultVariant }]).map((v) => ({
              ...v,
              id: v.id || crypto.randomUUID(),
            })),
          }
        : initialProductForm
    );
    setSelectedProductSlug(null);
    setSelectedProductId(null);
    setProductImages([]);
    setStudioGalleryProduct(null);
    setShowForm(true);
    if (draft) {
      toast({
        title: "Draft restored",
        description: "Resumed from your last unsaved product draft.",
      });
    }
  };

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
      drop: product.drop?._id || product.drop || "",
      basePrice: product.basePrice || "0",
      discountPercent: product.discountPercent || "0",
      costPrice: product.costPrice ?? "0",
      maxPerUser: product.maxPerUser ?? "",
      lowStockThreshold: product.lowStockThreshold ?? "5",
      isFeatured: product.isFeatured || false,
      isActive: product.isActive ?? true,
      isLimited: product.isLimited || false,
      tags: Array.isArray(product.tags) ? product.tags : [],
      variants: product.variants?.length
        ? product.variants.map((v) => ({
            ...v,
            id: v.id || v._id || crypto.randomUUID(),
            colorCode: v.colorCode || "",
          }))
        : [{ ...defaultVariant, id: crypto.randomUUID() }],
    });
    setStudioGalleryProduct(product);
    setShowForm(true);
    fetchProductImages(product._id);
  };

  const beginDuplicate = (product) => {
    setSelectedProductSlug(null);
    setSelectedProductId(null);
    setFormData({
      name: `${product.name || "Product"} (Copy)`,
      artNo: "",
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
      drop: product.drop?._id || product.drop || "",
      basePrice: product.basePrice || "0",
      discountPercent: product.discountPercent || "0",
      costPrice: product.costPrice ?? "0",
      maxPerUser: product.maxPerUser ?? "",
      lowStockThreshold: product.lowStockThreshold ?? "5",
      isFeatured: false,
      isActive: false,
      isLimited: product.isLimited || false,
      tags: Array.isArray(product.tags) ? [...product.tags] : [],
      variants: product.variants?.length
        ? product.variants.map((v) => ({
            ...v,
            id: crypto.randomUUID(),
            sku: "",
            colorCode: v.colorCode || "",
          }))
        : [{ ...defaultVariant, id: crypto.randomUUID() }],
    });
    setProductImages([]);
    setStudioGalleryProduct(null);
    setShowForm(true);
  };

  const openStudioGallery = async () => {
    if (!studioGalleryProduct) return;
    await openProductGallery(studioGalleryProduct);
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

  // Persist colorTag edits + removals of already-uploaded images. The studio
  // only edits local state; server state lives in `productImages` (set at
  // beginEdit / after gallery changes), so a diff yields the pending changes.
  const persistImageMetaChanges = async (originalImages, currentImages) => {
    const failures = [];
    const currentById = new Map(
      currentImages.filter((img) => img._id).map((img) => [img._id, img])
    );

    for (const original of originalImages.filter((img) => img._id)) {
      const current = currentById.get(original._id);

      if (!current) {
        // Removed in the studio → delete on the server.
        try {
          await axiosInstance.delete(`/image/delete-image/${original._id}`);
        } catch {
          failures.push("delete");
        }
        continue;
      }

      const originalTag = String(original.colorTag || "").trim();
      const currentTag = String(current.colorTag || "").trim();
      if (originalTag !== currentTag) {
        try {
          await axiosInstance.patch(`/image/update-image/${original._id}`, {
            colorTag: currentTag,
          });
        } catch {
          failures.push("colorTag");
        }
      }
    }

    if (failures.length > 0) {
      toast({
        title: "Some image changes didn't save",
        description:
          "The product was saved, but one or more image updates failed. Re-open the product and try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (studioFormData = formData, studioImages = productImages, setValidationErrors) => {
    if (isSavingProduct) return;

    const { errors, firstError } = validateProductFormData(studioFormData);
    if (firstError) {
      if (typeof setValidationErrors === "function") {
        setValidationErrors(errors);
      }
      toast({ title: "Check the form", description: firstError, variant: "destructive" });
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
        // Editing: sync colorTag edits + removals of existing images first.
        if (selectedProductSlug) {
          await persistImageMetaChanges(productImages, studioImages);
        }

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

                {/* Inline Bulk Actions Bar */}
                <AnimatePresence>
                  {bulk.count > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mb-4"
                      data-testid="admin-bulk-action-bar"
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
                              className={`rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50 ${action.variant === "destructive"
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
                <div className="w-full max-w-full overflow-visible rounded-3xl border border-[#D4AF37]/10 bg-[#0B0B0B]/80 backdrop-blur-xl">
                  <table className="min-w-full border-collapse text-left">
                    <thead className="sticky top-0 z-10 bg-[#050505]/95 backdrop-blur-md rounded-t-3xl">
                      <tr className="border-b border-white/5 text-[11px] uppercase tracking-[0.15em] text-[#A8A8A8] font-bold">
                        <th className="py-5 pl-6 pr-3 w-12 rounded-tl-3xl">
                          <input
                            type="checkbox"
                            aria-label="Select all products on this page"
                            checked={bulk.isAllSelected}
                            ref={(el) => {
                              if (el) el.indeterminate = bulk.isSomeSelected;
                            }}
                            onChange={bulk.toggleAll}
                            className="h-4 w-4 cursor-pointer accent-[#D4AF37] opacity-60 transition hover:opacity-100"
                            data-testid="admin-bulk-select-all"
                          />
                        </th>
                        <th className="py-5 px-4 min-w-[320px]">Product</th>
                        <th className="py-5 px-4 w-[180px]">Inventory</th>
                        <th className="py-5 px-4 w-[150px]">Status</th>
                        <th className="py-5 px-4 w-[150px]">Updated</th>
                        <th className="py-5 pr-6 pl-4 text-right w-[80px] rounded-tr-3xl">Actions</th>
                      </tr>
                    </thead>
                    <motion.tbody
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="divide-y divide-white/5"
                    >
                      {productList.map((product) => {
                        const meta = getProductLedgerMeta(product);
                        const stock = meta.totalStock;
                        const isSelected = bulk.isSelected(product._id);

                        const isHealthy = stock > 10;
                        const isLowStock = meta.isLowStock || (stock > 0 && stock <= 10);
                        const isOutOfStock = meta.isOutOfStock;

                        return (
                          <Fragment key={product._id}>
                            <motion.tr
                              variants={itemVariants}
                              className={`group transition-all duration-300 hover:bg-[#101010] ${
                                isSelected ? "bg-[#D4AF37]/[0.04]" : "bg-transparent"
                              }`}
                            >
                              <td className="py-5 pl-6 pr-3 align-middle">
                                <input
                                  type="checkbox"
                                  aria-label={`Select ${product.name}`}
                                  checked={isSelected}
                                  onChange={() => bulk.toggle(product._id)}
                                  className="h-4 w-4 cursor-pointer accent-[#D4AF37] opacity-30 transition group-hover:opacity-100 checked:opacity-100"
                                  data-testid="admin-bulk-row-select"
                                />
                              </td>
                              <td className="py-5 px-4 align-middle">
                                <div className="flex items-center gap-5">
                                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[14px] border border-white/10 bg-[#151515] flex items-center justify-center shadow-lg">
                                    {product.images && product.images.length > 0 ? (
                                      <img className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" src={product.images[0].url} alt={product.name} />
                                    ) : (
                                      <Package className="h-6 w-6 text-white/20" />
                                    )}
                                  </div>
                                  <div className="flex min-w-0 flex-col justify-center">
                                    <span
                                      onClick={() => beginEdit(product)}
                                      className="block truncate text-[15px] font-semibold tracking-tight text-white transition-colors hover:text-[#D4AF37] cursor-pointer"
                                    >
                                      {product.name}
                                    </span>
                                    <div className="mt-1 flex items-center gap-2">
                                      <span className="text-[11px] font-medium tracking-wider text-[#A8A8A8]">
                                        SKU: {product.artNo || 'N/A'}
                                      </span>
                                    </div>
                                    <span className="mt-1 truncate text-[12px] text-[#707070]">
                                      {formatCategoryPathDisplay(product.categoryPath) || [product.category, product.subCategory].filter(Boolean).join(" > ") || 'Uncategorized'}
                                    </span>
                                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                      {meta.variantCount > 0 && (
                                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/60">
                                          {meta.variantCount} variant{meta.variantCount === 1 ? '' : 's'}
                                        </span>
                                      )}
                                      {meta.colors.length > 0 && (
                                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/60">
                                          {meta.colors.join(', ')}{meta.uniqueColors > meta.colors.length ? '…' : ''}
                                        </span>
                                      )}
                                      {meta.sizes.length > 0 && (
                                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/60">
                                          {meta.sizes.join(', ')}{meta.uniqueSizes > meta.sizes.length ? '…' : ''}
                                        </span>
                                      )}
                                      {product.isFeatured && (
                                        <span className="rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#D4AF37]">
                                          Featured
                                        </span>
                                      )}
                                      {product.isLimited && (
                                        <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-purple-300">
                                          Limited
                                        </span>
                                      )}
                                      {meta.hasDiscount && (
                                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                                          -{product.discountPercent}%
                                        </span>
                                      )}
                                      {isLowStock && !isOutOfStock && (
                                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                                          Low stock
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-5 px-4 align-middle">
                                <div className="flex w-full max-w-[120px] flex-col gap-1.5">
                                  <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider">
                                    <span className="text-[#A8A8A8]">Stock</span>
                                    <span className={isHealthy ? "text-[#3D8B5C]" : isLowStock ? "text-[#D4AF37]" : "text-[#C85C5C]"}>
                                      {stock}
                                    </span>
                                  </div>
                                  <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                                    <div
                                      className={`h-full rounded-full transition-all duration-700 ${
                                        isHealthy ? "bg-[#3D8B5C]" : isLowStock ? "bg-[#D4AF37]" : "bg-[#C85C5C]"
                                      }`}
                                      style={{ width: `${Math.min(100, (stock / 50) * 100)}%` }}
                                    />
                                  </div>
                                  <span className="mt-0.5 text-[11px] text-[#707070]">
                                    {isHealthy ? "Healthy" : isLowStock ? "Low Stock" : "Critical"}
                                  </span>
                                </div>
                              </td>
                              <td className="py-5 px-4 align-middle">
                                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-widest ${
                                  product.isActive
                                    ? 'border-[#D4AF37]/20 bg-[#D4AF37]/[0.12] text-[#D4AF37]'
                                    : 'border-white/10 bg-white/5 text-[#707070]'
                                }`}>
                                  <span className={`h-1.5 w-1.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] ${product.isActive ? 'bg-[#D4AF37] shadow-[#D4AF37]/50' : 'bg-[#707070]'}`} />
                                  {product.isActive ? 'Published' : 'Draft'}
                                </span>
                              </td>
                              <td className="py-5 px-4 align-middle">
                                <div className="flex flex-col">
                                  <span className="text-[13px] text-white/90">
                                    {product.updatedAt ? new Date(product.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                  </span>
                                  <span className="mt-0.5 text-[11px] text-[#707070]">
                                    {product.updatedAt ? new Date(product.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                                  </span>
                                </div>
                              </td>
                              <td className="py-5 pr-6 pl-4 align-middle text-right">
                                <div className="relative inline-block text-left group/menu z-10">
                                  <button className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/5 hover:text-white">
                                    <MoreVertical className="h-5 w-5" />
                                  </button>
                                  <div className="invisible absolute right-0 top-full mt-2 w-48 origin-top-right rounded-xl border border-white/10 bg-[#151515] p-1.5 opacity-0 shadow-2xl transition-all duration-200 group-hover/menu:visible group-hover/menu:opacity-100 group-hover/menu:mt-1">
                                    <button
                                      onClick={() => openProductGallery(product)}
                                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#A8A8A8] transition-colors hover:bg-white/5 hover:text-white"
                                    >
                                      <Eye className="h-4 w-4" /> View Images
                                    </button>
                                    <button
                                      onClick={() => beginEdit(product)}
                                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#D4AF37] transition-colors hover:bg-[#D4AF37]/10"
                                    >
                                      <Edit2 className="h-4 w-4" /> Edit Product
                                    </button>
                                    <button
                                      onClick={() => beginDuplicate(product)}
                                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#A8A8A8] transition-colors hover:bg-white/5 hover:text-white"
                                    >
                                      <Copy className="h-4 w-4" /> Duplicate
                                    </button>
                                    <div className="my-1 mx-2 h-px bg-white/5" />
                                    <button
                                      onClick={() => setDeleteConfirmSlug((s) => (s === product.slug ? null : product.slug))}
                                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#C85C5C] transition-colors hover:bg-[#C85C5C]/10 hover:text-red-400"
                                    >
                                      <Trash2 className="h-4 w-4" /> Delete
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </motion.tr>
                            {deleteConfirmSlug === product.slug && (
                              <tr className="border-b border-white/5 bg-rose-500/[0.02]">
                                <td colSpan={6} className="px-6 py-4">
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
                            className={`w-9 h-9 flex items-center justify-center rounded-lg border text-xs font-semibold transition-colors ${isCurrent
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
            isEditing={!!selectedProductSlug}
            productId={selectedProductId}
            productSlug={selectedProductSlug}
            categoryTree={categoryTree}
            drops={drops}
            onBack={resetForm}
            onSaveDraft={handleSubmit}
            onSubmit={handleSubmit}
            onOpenGallery={openStudioGallery}
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
                  data-testid="admin-bulk-confirm"
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
