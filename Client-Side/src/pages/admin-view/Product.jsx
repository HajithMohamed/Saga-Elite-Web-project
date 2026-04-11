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
import ImageUpload from "@/components/admin-components/ImageUpload";
import axios from "axios";

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

const ProductFormModal = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
  isSubmitting,
  isEditing,
  dropList,
  productImages,
  setProductImages,
  selectedProductId,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl bg-[#111] p-6 overflow-y-auto">
        <h2 className="text-white text-lg mb-4">
          {isEditing ? "Edit Product" : "Add Product"}
        </h2>

        <input
          className="w-full mb-3 p-2 bg-[#1a1a1a] text-white"
          placeholder="Name"
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
        />

        <ImageUpload
          images={productImages}
          setImages={setProductImages}
          isMultiple
          refModel="Product"
          refId={selectedProductId}
        />

        <Button onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
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

  const LIMIT = 10;

  const dispatch = useDispatch();
  const { toast } = useToast();

  const productList = useSelector((state) => state.product.productList || []);
  const pagination = useSelector((state) => state.product.pagination || {});
  const isLoading = useSelector((state) => state.product.isLoading);

  const fetchProducts = useCallback(() => {
    dispatch(
      getAllProducts({
        page: currentPage,
        limit: LIMIT,
        isActive: statusFilter,
        search: searchQuery,
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
      const res = await axios.get(`/images/get-product-images/${id}`);
      setProductImages(res.data.images || []);
    } catch {
      setProductImages([]);
    }
  };

  const beginEdit = (product) => {
    setSelectedProductSlug(product.slug);
    setSelectedProductId(product._id);
    setFormData(product);
    setShowForm(true);
    fetchProductImages(product._id);
  };

  const handleSubmit = async () => {
    try {
      let result;

      if (selectedProductSlug) {
        result = await dispatch(
          updateProduct({ slug: selectedProductSlug, productData: formData })
        ).unwrap();
      } else {
        result = await dispatch(createProduct(formData)).unwrap();
      }

      const newImages = productImages.filter((img) => !img.isUploaded);

      if (newImages.length > 0) {
        const fd = new FormData();
        fd.append("refId", result.product._id);

        newImages.forEach((img) => fd.append("images", img.file));

        await axios.post("/images/upload-image", fd);
      }

      toast({ title: "Success" });
      resetForm();
      fetchProducts();
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  return (
    <>
      <div className="p-6 text-white">
        <div className="flex justify-between mb-4">
          <h1>Products</h1>
          <Button
            onClick={() => {
              setFormData(initialProductForm);
              setProductImages([]);
              setShowForm(true);
            }}
          >
            <Plus size={16} /> Add
          </Button>
        </div>

        <input
          className="mb-4 p-2 bg-[#1a1a1a]"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <table className="w-full">
          <tbody>
            {productList.map((p) => (
              <tr key={p._id}>
                <td>{p.name}</td>
                <td>
                  <button onClick={() => beginEdit(p)}>
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => dispatch(deleteProduct(p.slug))}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ProductFormModal
        isOpen={showForm}
        onClose={resetForm}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        isEditing={!!selectedProductSlug}
        productImages={productImages}
        setProductImages={setProductImages}
        selectedProductId={selectedProductId}
      />
    </>
  );
};

export default Product;