import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { getAllProducts, createProduct, updateProduct, deleteProduct } from "@/store/admin/product-slice";
import { getAllDrops } from "@/store/admin/drop-slice";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, ChevronLeft } from "lucide-react";
import ImageUpload from "@/components/admin-components/ImageUpload";
import axios from "axios";

const categoryOptions = ["Unisex", "Boys", "Girls"];
const defaultVariant = { sku: "", size: "", color: "", stock: "0", priceAdjustment: "0" };

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

const Product = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialProductForm);
  const [selectedProductSlug, setSelectedProductSlug] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [productImages, setProductImages] = useState([]);

  const dispatch = useDispatch();
  const productList = useSelector((state) => state.product?.productList ?? []);
  const isLoading = useSelector((state) => state.product?.isLoading ?? false);
  const isSubmitting = useSelector((state) => state.product?.isSubmitting ?? false);
  const error = useSelector((state) => state.product?.error ?? null);
  const dropList = useSelector((state) => state.drop?.dropList ?? []);
  const { toast } = useToast();

  useEffect(() => {
    dispatch(getAllDrops());
  }, [dispatch]);

  useEffect(() => {
    dispatch(getAllProducts({ isActive: statusFilter, limit: 100 }));
  }, [dispatch, statusFilter]);

  const variants = useMemo(() => formData.variants || [], [formData.variants]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return productList;
    }
    const normalized = searchQuery.trim().toLowerCase();
    return productList.filter((product) => {
      const name = product.name?.toLowerCase() || "";
      const artNo = product.artNo?.toLowerCase() || "";
      const brand = product.brand?.toLowerCase() || "";
      const dropName = product.drop?.name?.toLowerCase() || "";
      return (
        name.includes(normalized) ||
        artNo.includes(normalized) ||
        brand.includes(normalized) ||
        dropName.includes(normalized)
      );
    });
  }, [productList, searchQuery]);

  const resetForm = () => {
    setFormData(initialProductForm);
    setSelectedProductSlug(null);
    setSelectedProductId(null);
    setShowForm(false);
    setProductImages([]);
  };

  const fetchProductImages = async (productId) => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL
        ? `${import.meta.env.VITE_API_URL}/v1`
        : 'http://localhost:5001/api/v1';
      const response = await axios.get(`${API_BASE}/images/get-product-images/${productId}`, {
        withCredentials: true,
      });
      if (response.data.success) {
        setProductImages(response.data.images);
      }
    } catch (error) {
      console.error('Failed to fetch product images:', error);
      setProductImages([]);
    }
  };

  const beginEdit = (product) => {
    setSelectedProductSlug(product.slug);
    setSelectedProductId(product._id);
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
          ? product.variants.map((variant) => ({
              sku: variant.sku || "",
              size: variant.size || "",
              color: variant.color || "",
              stock: variant.stock?.toString() || "0",
              priceAdjustment: variant.priceAdjustment?.toString() || "0",
            }))
          : [defaultVariant],
    });
    // Fetch existing images for the product
    fetchProductImages(product._id);
  };

  const handleVariantChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((variant, idx) =>
        idx === index ? { ...variant, [field]: value } : variant,
      ),
    }));
  };

  const addVariantRow = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, defaultVariant],
    }));
  };

  const removeVariantRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, idx) => idx !== index),
    }));
  };

  const buildPayload = () => {
    return {
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
      variants: formData.variants.map((variant) => ({
        sku: variant.sku.trim(),
        size: variant.size.trim(),
        color: variant.color.trim(),
        stock: Number(variant.stock || 0),
        priceAdjustment: Number(variant.priceAdjustment || 0),
      })),
    };
  };

  const isValidForm = () => {
    if (!formData.name || !formData.artNo || !formData.brand || !formData.drop || !formData.basePrice) {
      return false;
    }
    if (!Array.isArray(formData.variants) || formData.variants.length === 0) {
      return false;
    }
    return formData.variants.every((variant) => variant.sku && variant.size && variant.color && variant.stock !== "");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isValidForm()) {
      toast({ title: "Product form is incomplete", variant: "destructive" });
      return;
    }

    const payload = buildPayload();

    try {
      let productResult;
      if (selectedProductSlug) {
        // Update existing product
        productResult = await dispatch(updateProduct({ slug: selectedProductSlug, productData: payload })).unwrap();
        if (productResult?.success) {
          toast({ title: "Product updated", description: "Product details saved successfully." });
        } else {
          toast({ title: "Update failed", description: productResult?.message || "Unable to save product.", variant: "destructive" });
          return;
        }
      } else {
        // Create new product
        productResult = await dispatch(createProduct(payload)).unwrap();
        if (productResult?.success) {
          toast({ title: "Product created", description: "New product added successfully." });
        } else {
          toast({ title: "Create failed", description: productResult?.message || "Unable to add product.", variant: "destructive" });
          return;
        }
      }

      // Handle image uploads if there are new images to upload
      const newImagesToUpload = productImages.filter(img => !img.isUploaded);
      if (newImagesToUpload.length > 0) {
        const productId = productResult.product._id;
        
        // Create FormData for image upload
        const formData = new FormData();
        formData.append('refModel', 'Product');
        formData.append('refId', productId);
        
        newImagesToUpload.forEach(img => {
          formData.append('images', img.file);
        });

        const API_BASE = import.meta.env.VITE_API_URL
          ? `${import.meta.env.VITE_API_URL}/v1`
          : 'http://localhost:5001/api/v1';

        try {
          const imageResponse = await axios.post(`${API_BASE}/images/upload-image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            withCredentials: true,
          });

          if (imageResponse.data.success) {
            toast({ title: "Images uploaded", description: `${imageResponse.data.results} images uploaded successfully.` });
          } else {
            toast({ title: "Image upload failed", description: imageResponse.data.message || "Failed to upload images.", variant: "destructive" });
          }
        } catch (imageError) {
          console.error('Image upload error:', imageError);
          toast({ title: "Image upload failed", description: "Failed to upload images.", variant: "destructive" });
        }
      }

      // Refresh the product list and reset form
      dispatch(getAllProducts({ isActive: statusFilter, limit: 100 }));
      resetForm();
    } catch (error) {
      console.error('Submit error:', error);
      toast({ title: "Operation failed", description: "An unexpected error occurred.", variant: "destructive" });
    }
  };

  const handleDelete = async (slug) => {
    if (!window.confirm("Delete this product permanently?")) {
      return;
    }
    const result = await dispatch(deleteProduct(slug)).unwrap().catch((err) => err);
    if (result?.success) {
      toast({ title: "Product removed", description: "Product deleted from inventory." });
      dispatch(getAllProducts({ isActive: statusFilter, limit: 100 }));
    } else {
      toast({ title: "Delete failed", description: result?.message || "Unable to remove product.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-[#101010] text-[#e2e2e2] p-4 md:p-8 font-['Manrope']">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-[#d4af37]">Admin Product Management</p>
          <h1 className="mt-3 text-3xl font-bold text-white">Products</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-400">
            Create, update, and remove catalog products. Use the status filter to manage active and inactive inventory.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs uppercase tracking-[0.3em] text-gray-400">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-gray-700 bg-[#111111] px-3 py-2 text-sm text-white outline-none focus:border-[#d4af37]"
            >
              <option value="all">All products</option>
              <option value="true">Active only</option>
              <option value="false">Inactive only</option>
            </select>
          </div>
          <Button
            onClick={() => {
              setShowForm(true);
              setSelectedProductSlug(null);
              setFormData(initialProductForm);
              setProductImages([]);
            }}
            className="bg-[#d4af37] text-black hover:bg-[#b69a2d]"
          >
            <Plus className="h-4 w-4" /> Add New Product
          </Button>
        </div>
      </div>

      <div className={showForm ? "grid gap-6 xl:grid-cols-[1.8fr_1.2fr]" : "grid gap-6"}>
        <section className="rounded-3xl border border-[#2a2a2a] bg-[#131313]/90 p-6 shadow-[0_0_40px_rgba(0,0,0,0.30)]">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Product catalog</h2>
              <p className="text-sm text-gray-400">Showing {filteredProducts?.length ?? 0} products</p>
            </div>
            <div className="min-w-[240px] flex-1 sm:min-w-[320px]">
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search products by name, art no, brand or drop"
                className="w-full rounded-md border border-gray-700 bg-[#111111] px-3 py-2 text-sm text-white outline-none focus:border-[#d4af37]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
              <thead>
                <tr className="text-gray-400">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Art No</th>
                  <th className="px-4 py-3">Brand</th>
                  <th className="px-4 py-3">Drop</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-400">
                      Loading products...
                    </td>
                  </tr>
                ) : filteredProducts?.length > 0 ? (
                  filteredProducts.map((product) => (
                    <tr key={product.slug} className="rounded-xl bg-[#121212] border border-[#1e1e1e] hover:border-[#d4af37]/50 transition-all">
                      <td className="px-4 py-4 font-semibold text-white">{product.name}</td>
                      <td className="px-4 py-4 text-[#d4af37]">{product.artNo}</td>
                      <td className="px-4 py-4 text-gray-300">{product.brand}</td>
                      <td className="px-4 py-4 text-gray-300">{product.drop?.name || "Unknown"}</td>
                      <td className="px-4 py-4 text-gray-300">₹{product.basePrice?.toFixed(2)}</td>
                      <td className="px-4 py-4 text-gray-300">{product.totalStock ?? 0}</td>
                      <td className={`px-4 py-4 font-semibold ${product.isActive ? "text-emerald-400" : "text-rose-400"}`}>
                        {product.isActive ? "Active" : "Inactive"}
                      </td>
                      <td className="px-4 py-4 space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => beginEdit(product)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(product.slug)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-400">
                      No products found for the selected filter or search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {showForm && (
          <section className="rounded-3xl border border-[#2a2a2a] bg-[#131313]/90 p-6 shadow-[0_0_40px_rgba(0,0,0,0.30)]">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-[#d4af37]">{selectedProductSlug ? "Edit product" : "New product"}</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{selectedProductSlug ? "Update details" : "Create product"}</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <ChevronLeft className="h-4 w-4" /> Cancel
              </Button>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-3 rounded-2xl bg-[#0f0f0f] p-4">
              <label className="text-xs uppercase tracking-[0.3em] text-gray-400">Name</label>
              <input
                value={formData.name}
                onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                className="w-full rounded-lg border border-gray-800 bg-[#111111] px-4 py-3 text-sm text-white outline-none focus:border-[#d4af37]"
                placeholder="Product title"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3 rounded-2xl bg-[#0f0f0f] p-4">
                <label className="text-xs uppercase tracking-[0.3em] text-gray-400">Art No</label>
                <input
                  value={formData.artNo}
                  onChange={(event) => setFormData({ ...formData, artNo: event.target.value })}
                  className="w-full rounded-lg border border-gray-800 bg-[#111111] px-4 py-3 text-sm text-white outline-none focus:border-[#d4af37]"
                  placeholder="SKU or art number"
                  required
                />
              </div>
              <div className="space-y-3 rounded-2xl bg-[#0f0f0f] p-4">
                <label className="text-xs uppercase tracking-[0.3em] text-gray-400">Brand</label>
                <input
                  value={formData.brand}
                  onChange={(event) => setFormData({ ...formData, brand: event.target.value })}
                  className="w-full rounded-lg border border-gray-800 bg-[#111111] px-4 py-3 text-sm text-white outline-none focus:border-[#d4af37]"
                  placeholder="Brand name"
                  required
                />
              </div>
            </div>

            <div className="space-y-3 rounded-2xl bg-[#0f0f0f] p-4">
              <label className="text-xs uppercase tracking-[0.3em] text-gray-400">Description</label>
              <textarea
                value={formData.description}
                onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                rows={4}
                className="w-full rounded-lg border border-gray-800 bg-[#111111] px-4 py-3 text-sm text-white outline-none focus:border-[#d4af37] resize-none"
                placeholder="Write a short summary for the product"
              />
            </div>

            <div className="space-y-3 rounded-2xl bg-[#0f0f0f] p-4">
              <label className="text-xs uppercase tracking-[0.3em] text-gray-400">Product Images</label>
              <ImageUpload
                images={productImages}
                setImages={setProductImages}
                isMultiple={true}
                refModel="Product"
                refId={selectedProductSlug ? undefined : undefined} // Will be handled in submit
                className="w-full"
                disabled={!selectedProductSlug} // Only allow uploads for existing products
              />
              {!selectedProductSlug && productImages.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  Images will be uploaded after saving the product.
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3 rounded-2xl bg-[#0f0f0f] p-4">
                <label className="text-xs uppercase tracking-[0.3em] text-gray-400">Category</label>
                <select
                  value={formData.category}
                  onChange={(event) => setFormData({ ...formData, category: event.target.value })}
                  className="w-full rounded-lg border border-gray-800 bg-[#111111] px-4 py-3 text-sm text-white outline-none focus:border-[#d4af37]"
                >
                  {categoryOptions.map((category) => (
                    <option key={category} value={category} className="bg-[#111111] text-white">
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-3 rounded-2xl bg-[#0f0f0f] p-4">
                <label className="text-xs uppercase tracking-[0.3em] text-gray-400">Drop</label>
                <select
                  value={formData.drop}
                  onChange={(event) => setFormData({ ...formData, drop: event.target.value })}
                  className="w-full rounded-lg border border-gray-800 bg-[#111111] px-4 py-3 text-sm text-white outline-none focus:border-[#d4af37]"
                  required
                >
                  <option value="" disabled>
                    Select a drop
                  </option>
                  {dropList?.map((drop) => (
                    <option key={drop._id} value={drop._id} className="bg-[#111111] text-white">
                      {drop.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3 rounded-2xl bg-[#0f0f0f] p-4">
                <label className="text-xs uppercase tracking-[0.3em] text-gray-400">Base price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.basePrice}
                  onChange={(event) => setFormData({ ...formData, basePrice: event.target.value })}
                  className="w-full rounded-lg border border-gray-800 bg-[#111111] px-4 py-3 text-sm text-white outline-none focus:border-[#d4af37]"
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-3 rounded-2xl bg-[#0f0f0f] p-4">
                <label className="text-xs uppercase tracking-[0.3em] text-gray-400">Discount %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discountPercent}
                  onChange={(event) => setFormData({ ...formData, discountPercent: event.target.value })}
                  className="w-full rounded-lg border border-gray-800 bg-[#111111] px-4 py-3 text-sm text-white outline-none focus:border-[#d4af37]"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3 rounded-2xl bg-[#0f0f0f] p-4">
                <label className="text-xs uppercase tracking-[0.3em] text-gray-400">Max per user</label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxPerUser}
                  onChange={(event) => setFormData({ ...formData, maxPerUser: event.target.value })}
                  className="w-full rounded-lg border border-gray-800 bg-[#111111] px-4 py-3 text-sm text-white outline-none focus:border-[#d4af37]"
                />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  { key: "isActive", label: "Active" },
                  { key: "isFeatured", label: "Featured" },
                  { key: "isLimited", label: "Limited" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 rounded-2xl bg-[#0f0f0f] p-4 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={formData[key]}
                      onChange={(event) => setFormData({ ...formData, [key]: event.target.checked })}
                      className="h-4 w-4 rounded border-gray-600 bg-[#111111] text-[#d4af37] focus:ring-[#d4af37]"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-4 rounded-2xl bg-[#0f0f0f] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Variants</p>
                  <p className="text-xs text-gray-500">Each product variant requires SKU, size, color, and stock.</p>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={addVariantRow}>
                  Add variant
                </Button>
              </div>

              <div className="space-y-4">
                {variants.map((variant, index) => (
                  <div key={index} className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_1fr_0.6fr] items-end rounded-xl border border-gray-800 bg-[#111111] p-4">
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.3em] text-gray-500">SKU</label>
                      <input
                        value={variant.sku}
                        onChange={(event) => handleVariantChange(index, "sku", event.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-700 bg-[#0f0f0f] px-3 py-2 text-sm text-white outline-none focus:border-[#d4af37]"
                        placeholder="SKU"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Size</label>
                      <input
                        value={variant.size}
                        onChange={(event) => handleVariantChange(index, "size", event.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-700 bg-[#0f0f0f] px-3 py-2 text-sm text-white outline-none focus:border-[#d4af37]"
                        placeholder="Size"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Color</label>
                      <input
                        value={variant.color}
                        onChange={(event) => handleVariantChange(index, "color", event.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-700 bg-[#0f0f0f] px-3 py-2 text-sm text-white outline-none focus:border-[#d4af37]"
                        placeholder="Color"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Stock</label>
                      <input
                        type="number"
                        min="0"
                        value={variant.stock}
                        onChange={(event) => handleVariantChange(index, "stock", event.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-700 bg-[#0f0f0f] px-3 py-2 text-sm text-white outline-none focus:border-[#d4af37]"
                        placeholder="0"
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVariantRow(index)}
                      className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-rose-500 text-white text-sm font-semibold hover:bg-rose-400 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-gray-400">
                {selectedProductSlug ? "Editing an existing product entry." : "Create a new product for the catalogue."}
              </div>
              <Button type="submit" className="bg-[#d4af37] text-black hover:bg-[#b69a2d]" disabled={isSubmitting}>
                {selectedProductSlug ? "Update Product" : "Save Product"}
              </Button>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </form>
        </section>
      )}
      </div>
    </div>
  );
};

export default Product;
