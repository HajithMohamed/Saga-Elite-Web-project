import React, { useEffect, useState, useCallback, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/store/admin/product-slice";
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
} from "lucide-react";
import { AdminPage } from "@/components/admin-components/AdminUI";
import {
  pageVariants,
  containerVariants,
  itemVariants,
  slideInPanelVariants,
} from "@/components/admin-components/_shared/animations";
import { ConfirmInline } from "@/components/admin-components/_shared/ConfirmInline";
import { ToastFlash } from "@/components/admin-components/_shared/ToastFlash";
import { SkeletonGrid } from "@/components/admin-components/_shared/SkeletonCard";

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
  stock: "0",
  priceAdjustment: "0",
};

const initialProductForm = {
  name: "",
  artNo: "",
  description: "",
  brand: "Sovereign Elite",
  category: "Unisex",
  drop: "",
  basePrice: "",
  discountPercent: "0",
  costPrice: "",
  maxPerUser: "",
  isFeatured: false,
  isActive: true,
  isLimited: false,
  tags: [],
  variants: [defaultVariant],
};

const PRODUCT_TAG_OPTIONS = [
  "LIMITED",
  "RARE",
  "TRENDING",
  "NEW DROP",
  "BESTSELLER",
];

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
  }, [fetchProducts]);

  const resetForm = () => {
    setFormData(initialProductForm);
    setSelectedProductSlug(null);
    setSelectedProductId(null);
    setShowForm(false);
    setProductImages([]);
  };

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
      brand: product.brand || "Sovereign Elite",
      category: product.category || "Unisex",
      drop: product.drop?._id || "",
      basePrice: product.basePrice || "",
      discountPercent: product.discountPercent || "0",
      costPrice: product.costPrice ?? "",
      maxPerUser: product.maxPerUser ?? "",
      isFeatured: product.isFeatured || false,
      isActive: product.isActive ?? true,
      isLimited: product.isLimited || false,
      tags: Array.isArray(product.tags) ? product.tags : [],
      variants: product.variants?.length ? product.variants : [defaultVariant],
    });
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
      setShowProductSaved(true);
      resetForm();
      fetchProducts();
    } catch (e) {
      toast({ title: "Failed to save product", description: e?.message, variant: "destructive" });
    }
  };

  useEffect(() => {
    if (!showProductSaved) return undefined;
    const t = setTimeout(() => setShowProductSaved(false), 2800);
    return () => clearTimeout(t);
  }, [showProductSaved]);

  const handleVariantChange = (index, field, value) => {
    const updatedVariants = [...formData.variants];
    updatedVariants[index] = { ...updatedVariants[index], [field]: value };
    setFormData({ ...formData, variants: updatedVariants });
  };

  const addVariant = () => {
    setFormData({ ...formData, variants: [...formData.variants, { ...defaultVariant }] });
  };

  const removeVariant = (index) => {
    const updatedVariants = formData.variants.filter((_, i) => i !== index);
    setFormData({ ...formData, variants: updatedVariants });
  };

  // ----- ATELIER FORM (slide-in panel 2I) -----
  const atelierForm = (
      <motion.div
        key="product-atelier"
        variants={slideInPanelVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="fixed inset-0 z-[60] overflow-x-hidden overflow-y-auto bg-[#050505]"
      >
      <div className="flex min-h-screen bg-surface text-on-surface font-sans selection:bg-primary-container selection:text-on-primary-container overflow-x-hidden w-full">
        <main className="flex-1 w-full flex flex-col overflow-y-auto">
          {/* Header */}
          <header className="bg-surface-container-low flex justify-between items-center w-full px-8 md:px-16 py-6 border-b border-outline-variant/10 sticky top-0 z-10">
            <div className="flex flex-col">
              <h1 className="font-serif text-3xl font-bold tracking-tighter text-saga-primary">Saga Elite</h1>
              <p className="text-[10px] uppercase tracking-[0.1em] text-on-surface-variant opacity-70 mt-1">Product Atelier / Variant Studio</p>
            </div>
            <div className="flex items-center gap-8">
              <button onClick={resetForm} className="text-sm uppercase tracking-[0.1em] text-on-surface hover:text-saga-primary transition-colors duration-300">
                Cancel
              </button>
              <button onClick={handleSubmit} className="bg-primary-container text-on-primary-container px-8 py-3 text-sm uppercase font-extrabold tracking-widest hover:brightness-110 transition-all duration-300 shadow-[0_0_15px_rgba(212,175,55,0.2)] hover:shadow-[0_0_25px_rgba(212,175,55,0.4)]">
                Save Product
              </button>
            </div>
          </header>

          <div className="w-full px-0 py-12 grid grid-cols-1 md:grid-cols-12 gap-12">

            {/* Left Column: Media & Visuals */}
            <div className="col-span-1 md:col-span-4 space-y-12">
              <section>
                <h2 className="font-serif text-xl mb-6 text-on-surface">Product Visuals</h2>
                <div className="bg-surface-container-low p-4">
                  <ImageUpload
                    images={productImages}
                    setImages={setProductImages}
                    isMultiple
                    refModel="Product"
                    refId={selectedProductId}
                    type="product"
                  />
                  {productImages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => openProductGallery({ name: formData.name, _id: selectedProductId, images: productImages })}
                      className="mt-3 inline-flex items-center justify-center rounded-full border border-saga-primary px-4 py-2 text-sm font-semibold text-saga-primary hover:bg-saga-primary/10 transition"
                    >
                      View all images
                    </button>
                  )}
                </div>
              </section>

              <section className="bg-surface-container-low p-8 space-y-6 border border-outline-variant/10">
                <h2 className="font-serif text-xl text-on-surface">Status &amp; Visibility</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-surface-container-high">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-saga-primary font-bold">Is Featured</p>
                      <p className="text-xs text-on-surface-variant mt-1">Promote on homepage carousel</p>
                    </div>
                    <ToggleSwitch
                      checked={formData.isFeatured}
                      onChange={() => setFormData({ ...formData, isFeatured: !formData.isFeatured })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-surface-container-high border-l-2 border-saga-primary">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-saga-primary font-bold">Is Active</p>
                      <p className="text-xs text-on-surface-variant mt-1">Visible in public storefront</p>
                    </div>
                    <ToggleSwitch
                      checked={formData.isActive}
                      onChange={() => setFormData({ ...formData, isActive: !formData.isActive })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-surface-container-high">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-saga-primary font-bold">Is Limited</p>
                      <p className="text-xs text-on-surface-variant mt-1">Badge as exclusive drop</p>
                    </div>
                    <ToggleSwitch
                      checked={formData.isLimited}
                      onChange={() => setFormData({ ...formData, isLimited: !formData.isLimited })}
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Form Data */}
            <div className="col-span-1 md:col-span-8 space-y-12">

              {/* Basic Info */}
              <section className="bg-surface-container-low p-8 md:p-12 border border-outline-variant/10">
                <div className="flex items-baseline gap-4 mb-10">
                  <span className="font-serif text-4xl text-saga-primary opacity-20">01</span>
                  <h2 className="font-serif text-2xl text-on-surface">Basic Information</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="col-span-1 md:col-span-2">
                    <label className="text-[10px] uppercase tracking-[0.1em] text-saga-primary font-bold block mb-3">Product Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-surface-container-highest border-none p-4 text-on-surface focus:ring-1 focus:ring-saga-primary placeholder:text-on-surface-variant/30"
                      placeholder="e.g. Aethelgard Signature Oxford"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="text-[10px] uppercase tracking-[0.1em] text-saga-primary font-bold block mb-3">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-surface-container-highest border-none p-4 text-on-surface focus:ring-1 focus:ring-saga-primary placeholder:text-on-surface-variant/30 min-h-[100px] resize-y"
                      placeholder="Product details..."
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.1em] text-saga-primary font-bold block mb-3">Art No. (SKU Root)</label>
                    <input
                      type="text"
                      value={formData.artNo}
                      onChange={e => setFormData({ ...formData, artNo: e.target.value })}
                      className="w-full bg-surface-container-highest border-none p-4 text-on-surface focus:ring-1 focus:ring-saga-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.1em] text-saga-primary font-bold block mb-3">Brand Identity</label>
                    <select
                      value={formData.brand}
                      onChange={e => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full bg-surface-container-highest border-none p-4 text-on-surface focus:ring-1 focus:ring-saga-primary appearance-none cursor-pointer"
                    >
                      <option value="Sovereign Elite">Sovereign Elite</option>
                      <option value="Atelier Reserve">Atelier Reserve</option>
                      <option value="Nomad Lux">Nomad Lux</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.1em] text-saga-primary font-bold block mb-3">Category Suite</label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-surface-container-highest border-none p-4 text-on-surface focus:ring-1 focus:ring-saga-primary appearance-none cursor-pointer"
                    >
                      <option value="Ladies">Ladies</option>
                      <option value="Gents">Gents</option>
                      <option value="Unisex">Unisex</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.1em] text-saga-primary font-bold block mb-3">Collection Drop</label>
                    <select
                      value={formData.drop}
                      onChange={e => setFormData({ ...formData, drop: e.target.value })}
                      className="w-full bg-surface-container-highest border-none p-4 text-on-surface focus:ring-1 focus:ring-saga-primary appearance-none cursor-pointer"
                    >
                      <option value="">Standalone / Core Collection</option>
                      {drops.map(d => (
                        <option key={d._id} value={d._id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              {/* Fiscal Configuration */}
              <section className="bg-surface-container-low p-8 md:p-12 border border-outline-variant/10">
                <div className="flex items-baseline gap-4 mb-10">
                  <span className="font-serif text-4xl text-saga-primary opacity-20">02</span>
                  <h2 className="font-serif text-2xl text-on-surface">Fiscal Configuration</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.1em] text-saga-primary font-bold block mb-3">Base Price (USD)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">$</span>
                      <input
                        type="number"
                        value={formData.basePrice}
                        onChange={e => setFormData({ ...formData, basePrice: e.target.value })}
                        className="w-full bg-surface-container-highest border-none p-4 pl-8 text-on-surface focus:ring-1 focus:ring-saga-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.1em] text-saga-primary font-bold block mb-3">Discount (%)</label>
                    <input
                      type="number"
                      value={formData.discountPercent}
                      onChange={e => setFormData({ ...formData, discountPercent: e.target.value })}
                      className="w-full bg-surface-container-highest border-none p-4 text-on-surface focus:ring-1 focus:ring-saga-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.1em] text-saga-primary font-bold block mb-3">Max Per User</label>
                    <input
                      type="number"
                      value={formData.maxPerUser}
                      onChange={e => setFormData({ ...formData, maxPerUser: e.target.value })}
                      className="w-full bg-surface-container-highest border-none p-4 text-on-surface focus:ring-1 focus:ring-saga-primary"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-[10px] uppercase tracking-[0.1em] text-saga-primary font-bold block mb-3">
                      Cost / Wholesale Price (LKR) — Admin Only
                    </label>
                    <input
                      type="number"
                      value={formData.costPrice}
                      onChange={e => setFormData({ ...formData, costPrice: e.target.value })}
                      placeholder="0"
                      className="w-full bg-surface-container-highest border-none p-4 text-on-surface focus:ring-1 focus:ring-saga-primary"
                    />
                    <p className="mt-2 text-[10px] tracking-[0.1em] text-on-surface-variant/60">
                      Never shown to customers. Used for margin calculations and offer suggestions.
                    </p>
                    {Number(formData.costPrice) > 0 && Number(formData.basePrice) > 0 ? (
                      <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-[#99907c]">
                        Current margin:{" "}
                        <span className="text-[#f2ca50] font-bold">
                          {Math.round(
                            ((Number(formData.basePrice) - Number(formData.costPrice)) / Number(formData.basePrice)) * 100
                          )}
                          %
                        </span>
                        {Number(formData.discountPercent) > 0 ? (
                          <>
                            {" "}→ at {formData.discountPercent}% off:{" "}
                            <span className="text-[#f2ca50] font-bold">
                              {(() => {
                                const sale = Number(formData.basePrice) * (1 - Number(formData.discountPercent) / 100);
                                if (sale <= 0) return "—";
                                return `${Math.round(((sale - Number(formData.costPrice)) / sale) * 100)}%`;
                              })()}
                            </span>
                          </>
                        ) : null}
                      </p>
                    ) : null}
                  </div>
                </div>
              </section>

              {/* Variant Studio */}
              <section className="bg-surface-container-low p-8 md:p-12 border border-outline-variant/10">
                <div className="flex justify-between items-end mb-10 border-b border-outline-variant/20 pb-4">
                  <div className="flex items-baseline gap-4">
                    <span className="font-serif text-4xl text-saga-primary opacity-20">03</span>
                    <h2 className="font-serif text-2xl text-on-surface">Variant Studio</h2>
                  </div>
                  <button
                    type="button"
                    onClick={addVariant}
                    className="text-[10px] uppercase tracking-[0.1em] text-saga-primary font-bold border border-saga-primary/30 px-6 py-2 hover:bg-saga-primary hover:text-surface transition-all duration-300"
                  >
                    + Add Variant
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[600px]">
                    <thead>
                      <tr className="border-b border-outline-variant/15 text-on-surface-variant font-bold uppercase tracking-widest text-[10px]">
                        <th className="py-4 font-normal">SKU Identifier</th>
                        <th className="py-4 font-normal">Size</th>
                        <th className="py-4 font-normal">Color/Material</th>
                        <th className="py-4 font-normal text-right">Price Adj.</th>
                        <th className="py-4 font-normal text-right">Qty</th>
                        <th className="py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      <AnimatePresence initial={false}>
                      {formData.variants.map((v, i) => (
                        <motion.tr
                          key={`variant-row-${i}`}
                          layout
                          initial={{ opacity: 0, y: -14 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.28, ease: "easeOut" }}
                          className="hover:bg-surface-bright/10 transition-colors"
                        >
                          <td className="py-4 pr-4">
                            <input
                              type="text" value={v.sku} onChange={(e) => handleVariantChange(i, 'sku', e.target.value)}
                              placeholder="SKU-001"
                              className="w-full bg-surface-container-highest border-transparent p-3 text-xs font-mono focus:border-saga-primary focus:ring-1 focus:ring-saga-primary"
                            />
                          </td>
                          <td className="py-4 pr-4">
                            <input
                              type="text" value={v.size} onChange={(e) => handleVariantChange(i, 'size', e.target.value)}
                              placeholder="EU 42"
                              className="w-[80px] bg-surface-container-highest border-transparent p-3 text-sm focus:border-saga-primary focus:ring-1 focus:ring-saga-primary"
                            />
                          </td>
                          <td className="py-4 pr-4">
                            <input
                              type="text" value={v.color} onChange={(e) => handleVariantChange(i, 'color', e.target.value)}
                              placeholder="Obsidian"
                              className="w-full bg-surface-container-highest border-transparent p-3 text-sm focus:border-saga-primary focus:ring-1 focus:ring-saga-primary"
                            />
                          </td>
                          <td className="py-4 pr-4 text-right">
                            <input
                              type="number" value={v.priceAdjustment} onChange={(e) => handleVariantChange(i, 'priceAdjustment', e.target.value)}
                              className="w-[100px] bg-surface-container-highest border-transparent p-3 text-sm focus:border-saga-primary text-right focus:ring-1 focus:ring-saga-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </td>
                          <td className="py-4 text-right">
                            <input
                              type="number" value={v.stock} onChange={(e) => handleVariantChange(i, 'stock', e.target.value)}
                              className="w-[80px] bg-surface-container-highest border-transparent p-3 text-sm focus:border-saga-primary text-right focus:ring-1 focus:ring-saga-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </td>
                          <td className="py-4 text-right pl-4">
                            {formData.variants.length > 1 && (
                              <button onClick={() => removeVariant(i)} className="text-on-surface-variant hover:text-saga-error transition-colors">
                                <Trash className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Tags & Identity */}
              <section className="bg-surface-container-low p-8 md:p-12 border border-outline-variant/10">
                <div className="flex items-baseline gap-4 mb-8">
                  <span className="font-serif text-4xl text-saga-primary opacity-20">04</span>
                  <h2 className="font-serif text-2xl text-on-surface">Tags & Identity</h2>
                </div>
                <p className="mb-6 text-xs text-on-surface-variant/70">
                  Tags drive merchandising — applied tags surface on the storefront and in filters.
                </p>
                <div className="flex flex-wrap gap-3">
                  {PRODUCT_TAG_OPTIONS.map((tag) => {
                    const active = Array.isArray(formData.tags) && formData.tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-4 py-1.5 text-[10px] tracking-[0.22em] uppercase border transition-colors ${
                          active
                            ? "border-[#f2ca50] text-[#f2ca50] bg-[#f2ca50]/10"
                            : "border-[#4d4635] text-[#99907c] hover:border-[#d0c5af] hover:text-[#d0c5af]"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </section>

            </div>
          </div>
        </main>
      </div>
      </motion.div>
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
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="bg-surface-container-highest border border-outline-variant/30 px-6 py-2 text-[10px] uppercase tracking-widest text-saga-primary flex items-center gap-2 hover:bg-surface-bright transition-colors font-bold shadow-[0_0_10px_rgba(242,202,80,0.1)]"
            >
              <Plus className="w-3 h-3" />
              New Product
            </button>
          </div>
        </div>

        {/* Bento Grid List Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 mb-4 py-4 bg-surface-container-low text-[10px] uppercase tracking-[0.2em] text-outline-variant font-bold border border-outline-variant/10">
          <div className="col-span-5">Product Details</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2">Valuation</div>
          <div className="col-span-1">Stock</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1 text-right">Actions</div>
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
                className="group relative grid grid-cols-1 md:grid-cols-12 gap-4 items-center rounded-[28px] border border-outline-variant/5 bg-surface-container/30 p-6 transition-colors hover:bg-surface-bright/80"
              >
                <div className="absolute left-0 top-0 bottom-0 w-[2px] origin-top scale-y-0 bg-saga-primary transition-transform duration-300 group-hover:scale-y-100" />

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
    </Fragment>
  );
};
export default Product;
