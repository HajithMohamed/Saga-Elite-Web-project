import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Layers3,
  Plus,
  Trash2,
  CheckCircle,
  GripVertical,
  Star,
  ImageIcon,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { API_V1_URL as API_BASE } from "@/lib/api";
import { getAllProducts } from "@/store/admin/product-slice";

const initialForm = {
  name: "",
  description: "",
  bannerImageUrl: "",
  productIds: [],
  isActive: true,
  isFeatured: false,
  displayOrder: 0,
};

const SortableCollectionRow = ({ collection, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: collection._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col items-start gap-4 border-b border-[#2a2a2a] p-6 last:border-b-0 hover:bg-[#1a1a1a] md:flex-row md:items-center md:justify-between"
    >
      <div className="flex flex-1 items-center gap-4">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab text-[#99907c] hover:text-[#f2ca50]"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-5 w-5" />
        </button>
        {collection.bannerImageUrl ? (
          <img
            src={collection.bannerImageUrl}
            alt={collection.name}
            className="h-16 w-24 shrink-0 object-cover"
          />
        ) : (
          <div className="flex h-16 w-24 shrink-0 items-center justify-center border border-[#2a2a2a] bg-[#0a0a0a] text-[#4d4635]">
            <ImageIcon className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg uppercase text-[#FAF7F2]">
              {collection.name}
            </h3>
            {collection.isFeatured ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#f2ca50]/40 bg-[#f2ca50]/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-[#f2ca50]">
                <Star className="h-3 w-3 fill-[#f2ca50]" /> Featured
              </span>
            ) : null}
            {!collection.isActive ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-white/60">
                Inactive
              </span>
            ) : null}
          </div>
          <p className="truncate text-xs text-[#99907c]">
            {(collection.products || []).length} products · slug{" "}
            <span className="font-mono">{collection.slug}</span>
          </p>
          {collection.description ? (
            <p className="mt-1 line-clamp-2 text-xs text-[#666]">
              {collection.description}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onEdit(collection)}
          className="border border-[#4d4635] px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-[#d0c5af] hover:border-[#f2ca50] hover:text-[#f2ca50]"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(collection)}
          className="border border-red-500/20 p-2 text-red-500 hover:bg-red-500/10 hover:text-red-400"
          title="Delete"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

const AdminCollections = () => {
  const dispatch = useDispatch();
  const productList = useSelector(
    (state) => state.product?.productList || []
  );

  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("list");
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialForm);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const res = await axios
        .get(`${API_BASE}/collections/admin`, { withCredentials: true })
        .catch(() => ({ data: { data: { collections: [] } } }));
      setCollections(res.data?.data?.collections || []);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load collections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
    dispatch(getAllProducts({ page: 1, limit: 200, isActive: "all" }));
  }, [dispatch]);

  const productMap = useMemo(() => {
    const map = new Map();
    productList.forEach((p) => map.set(String(p._id), p));
    return map;
  }, [productList]);

  const startCreate = () => {
    setEditingId(null);
    setFormData(initialForm);
    setActiveTab("create");
  };

  const startEdit = (collection) => {
    setEditingId(collection._id);
    setFormData({
      name: collection.name || "",
      description: collection.description || "",
      bannerImageUrl: collection.bannerImageUrl || "",
      productIds: (collection.products || []).map((p) =>
        typeof p === "string" ? p : p._id
      ),
      isActive: collection.isActive ?? true,
      isFeatured: !!collection.isFeatured,
      displayOrder: collection.displayOrder || 0,
    });
    setActiveTab("create");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }

    const payload = {
      name: formData.name,
      description: formData.description,
      bannerImageUrl: formData.bannerImageUrl,
      products: formData.productIds,
      isActive: !!formData.isActive,
      isFeatured: !!formData.isFeatured,
      displayOrder: Number(formData.displayOrder) || 0,
    };

    try {
      setSubmitting(true);
      if (editingId) {
        await axios.patch(
          `${API_BASE}/collections/admin/${editingId}`,
          payload,
          { withCredentials: true }
        );
        toast({ title: "Collection updated" });
      } else {
        await axios.post(`${API_BASE}/collections/admin`, payload, {
          withCredentials: true,
        });
        toast({ title: "Collection created" });
      }
      setFormData(initialForm);
      setEditingId(null);
      setActiveTab("list");
      fetchCollections();
    } catch (err) {
      toast({
        title: "Could not save collection",
        description: err?.response?.data?.message || err?.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (collection) => {
    if (!window.confirm(`Delete "${collection.name}"?`)) return;
    try {
      await axios.delete(`${API_BASE}/collections/admin/${collection._id}`, {
        withCredentials: true,
      });
      toast({ title: "Collection deleted" });
      fetchCollections();
    } catch (err) {
      toast({
        title: "Could not delete",
        description: err?.response?.data?.message || err?.message,
        variant: "destructive",
      });
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = collections.findIndex((c) => c._id === active.id);
    const newIndex = collections.findIndex((c) => c._id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(collections, oldIndex, newIndex);
    setCollections(reordered); // optimistic

    const orders = reordered.map((c, idx) => ({
      id: c._id,
      displayOrder: idx,
    }));
    try {
      await axios.patch(
        `${API_BASE}/collections/admin/reorder`,
        { orders },
        { withCredentials: true }
      );
    } catch (err) {
      toast({
        title: "Reorder failed — reverting",
        description: err?.response?.data?.message || err?.message,
        variant: "destructive",
      });
      fetchCollections();
    }
  };

  const handleToggleProduct = (id) => {
    setFormData((prev) => {
      const has = prev.productIds.includes(id);
      return {
        ...prev,
        productIds: has
          ? prev.productIds.filter((x) => x !== id)
          : [...prev.productIds, id],
      };
    });
  };

  const handleProductOrderChange = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setFormData((prev) => {
      const oldIndex = prev.productIds.indexOf(active.id);
      const newIndex = prev.productIds.indexOf(over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return {
        ...prev,
        productIds: arrayMove(prev.productIds, oldIndex, newIndex),
      };
    });
  };

  return (
    <div className="mx-auto max-w-7xl p-6 text-[#e5e2e1]">
      <div className="mb-8 flex items-center justify-between border-b border-[#2a2a2a] pb-4">
        <div>
          <h1 className="font-display text-4xl uppercase tracking-widest text-[#FAF7F2]">
            Collections
          </h1>
          <p className="mt-2 font-sans text-sm text-[#99907c]">
            Curated product groupings for the storefront. Drag to reorder.
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="flex items-center gap-2 bg-[#f2ca50] px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-[#0a0a0a] transition-colors hover:bg-[#ffe088]"
        >
          <Plus className="h-4 w-4" /> New Collection
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        {[
          { key: "list", label: "All Collections", icon: Layers3 },
          {
            key: "create",
            label: editingId ? "Editing" : "Create",
            icon: Plus,
          },
        ].map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 border px-6 py-3 font-mono text-[11px] uppercase tracking-[0.2em] transition-colors ${
                activeTab === tab.key
                  ? "border-[#f2ca50] bg-[#131313] text-[#f2ca50]"
                  : "border-[#2a2a2a] text-[#888] hover:text-[#e5e2e1]"
              }`}
            >
              <TabIcon className="h-4 w-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-[#f2ca50]" />
        </div>
      ) : activeTab === "list" ? (
        <div className="overflow-hidden rounded-sm border border-[#2a2a2a] bg-[#131313]">
          {collections.length === 0 ? (
            <div className="p-12 text-center font-mono text-xs uppercase tracking-widest text-[#888]">
              No collections yet — click "New Collection" to create one.
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={collections.map((c) => c._id)}
                strategy={verticalListSortingStrategy}
              >
                <div>
                  {collections.map((collection) => (
                    <SortableCollectionRow
                      key={collection._id}
                      collection={collection}
                      onEdit={startEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      ) : (
        <div className="rounded-sm border border-[#f2ca50]/30 bg-[#131313] p-6 md:p-8">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#f2ca50]">
              <Plus className="h-4 w-4" />{" "}
              {editingId ? "Edit Collection" : "Create New Collection"}
            </h2>
            {editingId ? (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormData(initialForm);
                  setActiveTab("list");
                }}
                className="text-xs uppercase tracking-[0.22em] text-[#99907c] hover:text-[#e5e2e1]"
              >
                Cancel edit
              </button>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest text-[#888]">
                  Collection Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="w-full border border-[#2a2a2a] bg-[#0a0a0a] p-3 text-sm text-[#FAF7F2] outline-none focus:border-[#f2ca50]"
                  placeholder="e.g. Summer Essentials"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest text-[#888]">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      displayOrder: e.target.value,
                    })
                  }
                  className="w-full border border-[#2a2a2a] bg-[#0a0a0a] p-3 text-sm text-[#FAF7F2] outline-none focus:border-[#f2ca50]"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest text-[#888]">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={2}
                className="w-full border border-[#2a2a2a] bg-[#0a0a0a] p-3 text-sm text-[#FAF7F2] outline-none focus:border-[#f2ca50]"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest text-[#888]">
                Banner Image URL
              </label>
              <input
                type="text"
                value={formData.bannerImageUrl}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bannerImageUrl: e.target.value,
                  })
                }
                className="w-full border border-[#2a2a2a] bg-[#0a0a0a] p-3 text-sm text-[#FAF7F2] outline-none focus:border-[#f2ca50]"
                placeholder="https://res.cloudinary.com/…"
              />
              {formData.bannerImageUrl ? (
                <img
                  src={formData.bannerImageUrl}
                  alt=""
                  className="mt-3 h-32 w-full max-w-md object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : null}
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[#d0c5af]">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                />
                Active
              </label>
              <label className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[#d0c5af]">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isFeatured: e.target.checked,
                    })
                  }
                />
                Featured (homepage)
              </label>
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest text-[#888]">
                Selected Products ({formData.productIds.length}) — drag to
                reorder
              </label>
              {formData.productIds.length === 0 ? (
                <p className="border border-dashed border-[#2a2a2a] bg-[#0a0a0a] p-4 text-center text-xs text-[#666]">
                  No products selected yet. Pick from the list below.
                </p>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleProductOrderChange}
                >
                  <SortableContext
                    items={formData.productIds}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1 border border-[#2a2a2a] bg-[#0a0a0a] p-2">
                      {formData.productIds.map((id) => {
                        const product = productMap.get(id);
                        return (
                          <SortableProductChip
                            key={id}
                            id={id}
                            label={product?.name || id}
                            onRemove={() => handleToggleProduct(id)}
                          />
                        );
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest text-[#888]">
                Available Products
              </label>
              <div className="max-h-72 overflow-y-auto border border-[#2a2a2a] bg-[#0a0a0a] p-3">
                {productList.length === 0 ? (
                  <p className="p-4 text-center text-xs text-[#666]">
                    Loading products…
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
                    {productList.map((p) => {
                      const checked = formData.productIds.includes(p._id);
                      return (
                        <label
                          key={p._id}
                          className={`flex cursor-pointer items-center gap-3 border px-3 py-2 text-xs ${
                            checked
                              ? "border-[#f2ca50]/50 bg-[#f2ca50]/5"
                              : "border-transparent hover:border-[#4d4635]"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleProduct(p._id)}
                          />
                          <span className="flex-1 truncate text-[#e5e2e1]">
                            {p.name}
                          </span>
                          <span className="font-mono text-[10px] text-[#666]">
                            {p.artNo}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 bg-[#f2ca50] px-6 py-4 font-mono text-[13px] font-bold uppercase tracking-widest text-[#0a0a0a] transition-colors hover:bg-[#ffe088] disabled:opacity-60"
              >
                <CheckCircle className="h-5 w-5" />
                {submitting
                  ? "Saving…"
                  : editingId
                    ? "Save Changes"
                    : "Create Collection"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const SortableProductChip = ({ id, label, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 border border-[#2a2a2a] bg-[#131313] px-3 py-2 text-xs"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab text-[#99907c] hover:text-[#f2ca50]"
        aria-label="Drag"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="flex-1 truncate text-[#e5e2e1]">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="text-[#99907c] hover:text-red-400"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
};

export default AdminCollections;
