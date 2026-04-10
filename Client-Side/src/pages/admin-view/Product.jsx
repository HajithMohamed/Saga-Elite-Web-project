import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/store/admin/product-slice";
import { getAllDrops } from "@/store/admin/drop-slice";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const categoryOptions = ["Unisex", "Boys", "Girls"];

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
  brand: "",
  category: "Unisex",
  drop: "",
  basePrice: "",
  discountPercent: "0",
  maxPerUser: "2",
  isFeatured: false,
  isActive: true,
  isLimited: true,
  variants: [defaultVariant],
};

/*
|--------------------------------------------------------------------------
| Subcomponents
|--------------------------------------------------------------------------
*/

const StatusBadge = ({ isActive }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
      isActive
        ? "bg-green-900/40 text-green-400 border border-green-800"
        : "bg-red-900/40 text-red-400 border border-red-800"
    }`}
  >
    {isActive ? "Active" : "Inactive"}
  </span>
);

const FormField = ({ label, error, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
      {label}
    </label>
    {children}
    {error && <p className="text-xs text-red-400">{error}</p>}
  </div>
);

const inputClass =
  "bg-[#1a1a1a] border border-[#2a2a2a] text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-yellow-500 transition-colors placeholder:text-gray-600 w-full";

const selectClass =
  "bg-[#1a1a1a] border border-[#2a2a2a] text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-yellow-500 transition-colors w-full";

/*
|--------------------------------------------------------------------------
| Product Form Modal
|--------------------------------------------------------------------------
*/

const ProductFormModal = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
  isSubmitting,
  isEditing,
  dropList,
}) => {
  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleVariantChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) =>
        i === index ? { ...v, [field]: value } : v
      ),
    }));
  };

  const addVariantRow = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, { ...defaultVariant }],
    }));
  };

  const removeVariantRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="relative z-10 h-full w-full max-w-2xl bg-[#111111] border-l border-[#2a2a2a] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a] shrink-0">
          <div>
            <h2 className="text-white font-semibold text-lg">
              {isEditing ? "Edit Product" : "Add New Product"}
            </h2>
            <p className="text-gray-500 text-xs mt-0.5">
              {isEditing
                ? "Update the product details below"
                : "Fill in the details to create a new product"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Basic Info */}
          <div>
            <p className="text-yellow-500 text-xs font-semibold uppercase tracking-widest mb-3">
              Basic Info
            </p>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Product Name *">
                <input
                  className={inputClass}
                  placeholder="e.g. Lounge Shirt"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                />
              </FormField>
              <FormField label="Art No *">
                <input
                  className={inputClass}
                  placeholder="e.g. FLS-001"
                  value={formData.artNo}
                  onChange={(e) => handleChange("artNo", e.target.value)}
                  disabled={isEditing}
                />
              </FormField>
              <FormField label="Brand *">
                <input
                  className={inputClass}
                  placeholder="e.g. Saga Elite"
                  value={formData.brand}
                  onChange={(e) => handleChange("brand", e.target.value)}
                />
              </FormField>
              <FormField label="Category">
                <select
                  className={selectClass}
                  value={formData.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                >
                  {categoryOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
            <div className="mt-4">
              <FormField label="Description">
                <textarea
                  className={`${inputClass} resize-none`}
                  rows={3}
                  placeholder="Product description..."
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                />
              </FormField>
            </div>
          </div>

          {/* Pricing & Drop */}
          <div>
            <p className="text-yellow-500 text-xs font-semibold uppercase tracking-widest mb-3">
              Pricing & Drop
            </p>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Base Price (LKR) *">
                <input
                  className={inputClass}
                  type="number"
                  placeholder="2500"
                  value={formData.basePrice}
                  onChange={(e) => handleChange("basePrice", e.target.value)}
                />
              </FormField>
              <FormField label="Discount %">
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={formData.discountPercent}
                  onChange={(e) =>
                    handleChange("discountPercent", e.target.value)
                  }
                />
              </FormField>
              <FormField label="Drop *">
                <select
                  className={selectClass}
                  value={formData.drop}
                  onChange={(e) => handleChange("drop", e.target.value)}
                >
                  <option value="">Select a drop</option>
                  {dropList.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Max Per User">
                <input
                  className={inputClass}
                  type="number"
                  min="1"
                  value={formData.maxPerUser}
                  onChange={(e) => handleChange("maxPerUser", e.target.value)}
                />
              </FormField>
            </div>
          </div>

          {/* Flags */}
          <div>
            <p className="text-yellow-500 text-xs font-semibold uppercase tracking-widest mb-3">
              Settings
            </p>
            <div className="flex flex-wrap gap-6">
              {[
                { key: "isActive", label: "Active" },
                { key: "isFeatured", label: "Featured" },
                { key: "isLimited", label: "Limited Edition" },
              ].map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-yellow-500"
                    checked={formData[key]}
                    onChange={(e) => handleChange(key, e.target.checked)}
                  />
                  <span className="text-sm text-gray-300">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Variants */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-yellow-500 text-xs font-semibold uppercase tracking-widest">
                Variants
              </p>
              <button
                onClick={addVariantRow}
                className="text-xs text-yellow-500 hover:text-yellow-400 flex items-center gap-1 transition-colors"
              >
                <Plus size={13} /> Add Variant
              </button>
            </div>

            {formData.variants.length === 0 && (
              <p className="text-gray-600 text-sm text-center py-4">
                No variants added yet
              </p>
            )}

            <div className="space-y-2">
              {formData.variants.map((variant, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1fr_1fr_1fr_80px_80px_32px] gap-2 items-center bg-[#1a1a1a] border border-[#2a2a2a] rounded px-3 py-2"
                >
                  <input
                    className="bg-transparent text-white text-xs focus:outline-none placeholder:text-gray-600 border-b border-[#2a2a2a] pb-0.5"
                    placeholder="SKU"
                    value={variant.sku}
                    onChange={(e) =>
                      handleVariantChange(index, "sku", e.target.value)
                    }
                  />
                  <input
                    className="bg-transparent text-white text-xs focus:outline-none placeholder:text-gray-600 border-b border-[#2a2a2a] pb-0.5"
                    placeholder="Size"
                    value={variant.size}
                    onChange={(e) =>
                      handleVariantChange(index, "size", e.target.value)
                    }
                  />
                  <input
                    className="bg-transparent text-white text-xs focus:outline-none placeholder:text-gray-600 border-b border-[#2a2a2a] pb-0.5"
                    placeholder="Color"
                    value={variant.color}
                    onChange={(e) =>
                      handleVariantChange(index, "color", e.target.value)
                    }
                  />
                  <input
                    className="bg-transparent text-white text-xs focus:outline-none placeholder:text-gray-600 border-b border-[#2a2a2a] pb-0.5 text-center"
                    placeholder="Stock"
                    type="number"
                    value={variant.stock}
                    onChange={(e) =>
                      handleVariantChange(index, "stock", e.target.value)
                    }
                  />
                  <input
                    className="bg-transparent text-white text-xs focus:outline-none placeholder:text-gray-600 border-b border-[#2a2a2a] pb-0.5 text-center"
                    placeholder="+/- Price"
                    type="number"
                    value={variant.priceAdjustment}
                    onChange={(e) =>
                      handleVariantChange(
                        index,
                        "priceAdjustment",
                        e.target.value
                      )
                    }
                  />
                  <button
                    onClick={() => removeVariantRow(index)}
                    className="text-gray-600 hover:text-red-400 transition-colors flex items-center justify-center"
                    disabled={formData.variants.length === 1}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}

              {formData.variants.length > 0 && (
                <div className="grid grid-cols-[1fr_1fr_1fr_80px_80px_32px] gap-2 px-3">
                  {["SKU", "Size", "Color", "Stock", "+/- Price", ""].map(
                    (h) => (
                      <span key={h} className="text-[10px] text-gray-600">
                        {h}
                      </span>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#2a2a2a] flex items-center justify-end gap-3 shrink-0 bg-[#0d0d0d]">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-6"
          >
            {isSubmitting
              ? isEditing
                ? "Updating..."
                : "Creating..."
              : isEditing
              ? "Update Product"
              : "Create Product"}
          </Button>
        </div>
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Main Product Page
|--------------------------------------------------------------------------
*/

const Product = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialProductForm);
  const [selectedProductSlug, setSelectedProductSlug] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const LIMIT = 10;

  const dispatch = useDispatch();
  const productList = useSelector((state) => state.product?.productList ?? []);
  const pagination = useSelector((state) => state.product?.pagination ?? {});
  const isLoading = useSelector((state) => state.product?.isLoading ?? false);
  const isSubmitting = useSelector(
    (state) => state.product?.isSubmitting ?? false
  );
  const dropList = useSelector((state) => state.drop?.drops ?? []);
  const { toast } = useToast();

  /*
  |----------------------------------------------------------
  | Fetch
  |----------------------------------------------------------
  */

  const fetchProducts = useCallback(() => {
    dispatch(
      getAllProducts({
        page: currentPage,
        limit: LIMIT,
        isActive: statusFilter,
        search: searchQuery || undefined,
      })
    );
  }, [dispatch, currentPage, statusFilter, searchQuery]);

  useEffect(() => {
    dispatch(getAllDrops());
  }, [dispatch]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery]);

  /*
  |----------------------------------------------------------
  | Helpers
  |----------------------------------------------------------
  */

  const resetForm = useCallback(() => {
    setFormData(initialProductForm);
    setSelectedProductSlug(null);
    setShowForm(false);
  }, []);

  const beginEdit = useCallback((product) => {
    setSelectedProductSlug(product.slug);
    setShowForm(true);
    setFormData({
      name: product.name || "",
      artNo: product.artNo || "",
      description: product.description || "",
      brand: product.brand || "",
      category: product.category || "Unisex",
      drop: product.drop?._id || product.drop || "",
      basePrice: product.basePrice?.toString() || "",
      discountPercent: product.discountPercent?.toString() || "0",
      maxPerUser: product.maxPerUser?.toString() || "2",
      isFeatured: Boolean(product.isFeatured),
      isActive: Boolean(product.isActive),
      isLimited: Boolean(product.isLimited),
      variants:
        product.variants?.length > 0
          ? product.variants.map((v) => ({
              sku: v.sku || "",
              size: v.size || "",
              color: v.color || "",
              stock: v.stock?.toString() || "0",
              priceAdjustment: v.priceAdjustment?.toString() || "0",
            }))
          : [{ ...defaultVariant }],
    });
  }, []);

  const buildPayload = useCallback(
    () => ({
      name: formData.name.trim(),
      artNo: formData.artNo.trim(),
      description: formData.description.trim(),
      brand: formData.brand.trim(),
      category: formData.category,
      drop: formData.drop,
      basePrice: Number(formData.basePrice || 0),
      discountPercent: Number(formData.discountPercent || 0),
      maxPerUser: Number(formData.maxPerUser || 1),
      isFeatured: formData.isFeatured,
      isActive: formData.isActive,
      isLimited: formData.isLimited,
      variants: formData.variants.map((v) => ({
        sku: v.sku.trim(),
        size: v.size.trim(),
        color: v.color.trim(),
        stock: Number(v.stock || 0),
        priceAdjustment: Number(v.priceAdjustment || 0),
      })),
    }),
    [formData]
  );

  const isValidForm = useCallback(() => {
    if (
      !formData.name ||
      !formData.artNo ||
      !formData.brand ||
      !formData.drop ||
      !formData.basePrice
    )
      return false;
    return formData.variants.every(
      (v) => v.sku && v.size && v.color && v.stock !== ""
    );
  }, [formData]);

  /*
  |----------------------------------------------------------
  | Submit / Delete
  |----------------------------------------------------------
  */

  const handleSubmit = async () => {
    if (!isValidForm()) {
      toast({
        title: "Incomplete form",
        description: "Please fill all required fields and variant details.",
        variant: "destructive",
      });
      return;
    }

    const payload = buildPayload();

    try {
      if (selectedProductSlug) {
        await dispatch(
          updateProduct({ slug: selectedProductSlug, productData: payload })
        ).unwrap();
        toast({ title: "Product updated successfully" });
      } else {
        await dispatch(createProduct(payload)).unwrap();
        toast({ title: "Product created successfully" });
      }
      resetForm();
      fetchProducts();
    } catch (err) {
      toast({
        title: "Operation failed",
        description: err?.message || "Something went wrong.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (slug, name) => {
    if (
      !window.confirm(`Are you sure you want to permanently delete "${name}"?`)
    )
      return;

    try {
      await dispatch(deleteProduct(slug)).unwrap();
      toast({ title: "Product deleted" });
      fetchProducts();
    } catch (err) {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  /*
  |----------------------------------------------------------
  | Pagination
  |----------------------------------------------------------
  */

  const totalPages = Math.ceil((pagination.total || 0) / LIMIT);

  /*
  |----------------------------------------------------------
  | Render
  |----------------------------------------------------------
  */

  return (
    <>
      <div className="p-6 text-white min-h-screen">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Products</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {pagination.total ?? 0} total product
              {pagination.total !== 1 ? "s" : ""}
            </p>
          </div>
          <Button
            onClick={() => {
              setFormData(initialProductForm);
              setSelectedProductSlug(null);
              setShowForm(true);
            }}
            className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold flex items-center gap-2"
          >
            <Plus size={16} />
            Add Product
          </Button>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white text-sm rounded pl-9 pr-4 py-2 focus:outline-none focus:border-yellow-500 placeholder:text-gray-600 transition-colors"
              placeholder="Search by name, art no, brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex rounded overflow-hidden border border-[#2a2a2a]">
            {[
              { value: "all", label: "All" },
              { value: "true", label: "Active" },
              { value: "false", label: "Inactive" },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`px-4 py-2 text-sm transition-colors ${
                  statusFilter === value
                    ? "bg-yellow-500 text-black font-medium"
                    : "text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-[#2a2a2a] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2a2a] bg-[#111111]">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    #
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Art No
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Drop
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-[#1e1e1e] rounded w-3/4" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : productList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center">
                      <Package
                        size={32}
                        className="mx-auto text-gray-700 mb-3"
                      />
                      <p className="text-gray-500 text-sm">
                        {searchQuery
                          ? `No products found for "${searchQuery}"`
                          : "No products yet"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  productList.map((product, index) => {
                    const primaryImage = product.images?.find(
                      (img) => img.isPrimary
                    );
                    const rowNumber =
                      (currentPage - 1) * LIMIT + index + 1;

                    return (
                      <tr
                        key={product.slug}
                        className="hover:bg-[#161616] transition-colors group"
                      >
                        {/* Row Number */}
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {rowNumber}
                        </td>

                        {/* Product */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {primaryImage ? (
                              <img
                                src={primaryImage.url}
                                alt={product.name}
                                className="w-9 h-9 rounded object-cover border border-[#2a2a2a] shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded bg-[#1e1e1e] border border-[#2a2a2a] flex items-center justify-center shrink-0">
                                <Package size={14} className="text-gray-600" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-white text-sm leading-tight">
                                {product.name}
                              </p>
                              <p className="text-gray-500 text-xs mt-0.5">
                                {product.brand} · {product.category}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Art No */}
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-gray-400 bg-[#1a1a1a] px-2 py-0.5 rounded">
                            {product.artNo}
                          </span>
                        </td>

                        {/* Drop */}
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {product.drop?.name || (
                            <span className="text-gray-600">—</span>
                          )}
                        </td>

                        {/* Price */}
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-white text-sm font-medium">
                              Rs. {product.basePrice?.toLocaleString()}
                            </p>
                            {product.discountPercent > 0 && (
                              <p className="text-xs text-green-500 mt-0.5">
                                -{product.discountPercent}% off
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Stock */}
                        <td className="px-4 py-3">
                          <span
                            className={`text-sm font-medium ${
                              product.totalStock === 0
                                ? "text-red-400"
                                : product.totalStock < 10
                                ? "text-yellow-400"
                                : "text-gray-300"
                            }`}
                          >
                            {product.totalStock ?? 0}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <StatusBadge isActive={product.isActive} />
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => beginEdit(product)}
                              className="p-1.5 rounded text-gray-500 hover:text-yellow-500 hover:bg-yellow-500/10 transition-colors"
                              title="Edit product"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() =>
                                handleDelete(product.slug, product.name)
                              }
                              className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                              title="Delete product"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#2a2a2a] bg-[#0d0d0d]">
              <p className="text-xs text-gray-500">
                Showing {(currentPage - 1) * LIMIT + 1}–
                {Math.min(currentPage * LIMIT, pagination.total)} of{" "}
                {pagination.total}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === totalPages ||
                      Math.abs(p - currentPage) <= 1
                  )
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) {
                      acc.push("...");
                    }
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "..." ? (
                      <span key={`ellipsis-${i}`} className="px-2 text-gray-600 text-sm">
                        ...
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`w-7 h-7 rounded text-xs transition-colors ${
                          currentPage === p
                            ? "bg-yellow-500 text-black font-semibold"
                            : "text-gray-400 hover:text-white hover:bg-[#1e1e1e]"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Form Drawer */}
      <ProductFormModal
        isOpen={showForm}
        onClose={resetForm}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        isEditing={!!selectedProductSlug}
        dropList={dropList}
      />
    </>
  );
};

export default Product;