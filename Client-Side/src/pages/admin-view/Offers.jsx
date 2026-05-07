import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "@/hooks/use-toast";
import { API_V1_URL as API_BASE } from "@/lib/api";
import {
  Tag,
  AlertTriangle,
  Plus,
  Trash2,
  Calendar,
  CheckCircle,
  Clock,
  Star,
} from "lucide-react";
import { getAllProducts } from "@/store/admin/product-slice";

const OFFER_TYPES = [
  { value: "flash", label: "Flash Sale" },
  { value: "seasonal", label: "Seasonal" },
  { value: "clearance", label: "Clearance" },
  { value: "aging_stock", label: "Aging Stock" },
  { value: "new_product", label: "New Product Launch" },
  { value: "tier-discount", label: "Tier Discount" },
  { value: "mystery-box", label: "Mystery Box" },
];

const TYPE_BADGE_STYLES = {
  flash: "border-[#f2ca50]/40 bg-[#f2ca50]/10 text-[#f2ca50]",
  seasonal: "border-[#d0c5af]/40 bg-[#d0c5af]/10 text-[#d0c5af]",
  clearance: "border-[#ffb4ab]/40 bg-[#ffb4ab]/10 text-[#ffb4ab]",
  aging_stock: "border-[#ffb4ab]/40 bg-[#ffb4ab]/10 text-[#ffb4ab]",
  new_product: "border-[#e5e2e1]/30 bg-[#e5e2e1]/10 text-[#e5e2e1]",
  "tier-discount": "border-[#99907c]/40 bg-[#99907c]/10 text-[#d0c5af]",
  "mystery-box": "border-purple-400/40 bg-purple-400/10 text-purple-300",
};

const MIN_HEALTHY_MARGIN = 15;

const initialForm = {
  name: "",
  badgeText: "",
  description: "",
  type: "flash",
  discountPercent: 10,
  productIds: [],
  applicableCategories: [],
  startsAt: "",
  endsAt: "",
  showOnHomepage: false,
  displayOrder: 0,
  isActive: true,
};

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
};

const computeMarginAfterDiscount = (product, discountPercent) => {
  if (!product) return null;
  const cost = Number(product.costPrice || 0);
  const base = Number(product.basePrice || 0);
  if (cost <= 0 || base <= 0) return null;
  const sale = base * (1 - Number(discountPercent || 0) / 100);
  if (sale <= 0) return -100;
  return Math.round(((sale - cost) / sale) * 100);
};

// Largest integer % discount that still leaves margin >= MIN_HEALTHY_MARGIN.
// Falls back to 15% when costPrice is unknown (conservative, no margin info).
const computeSuggestedDiscount = (product) => {
  const cost = Number(product?.costPrice || 0);
  const base = Number(product?.basePrice || 0);
  if (base <= 0) return { discount: 0, fallback: true };
  if (cost <= 0) return { discount: 15, fallback: true };
  const floor = 1 - MIN_HEALTHY_MARGIN / 100;
  const max = Math.floor(100 * (1 - cost / (base * floor)));
  return { discount: Math.max(5, Math.min(50, max)), fallback: false };
};

const AdminOffers = () => {
  const dispatch = useDispatch();
  const productList = useSelector(
    (state) => state.product?.productList || []
  );

  const [activeTab, setActiveTab] = useState("active");
  const [offers, setOffers] = useState([]);
  const [agingStock, setAgingStock] = useState([]);
  const [historyOffers, setHistoryOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialForm);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const [activeRes, historyRes, agingRes] = await Promise.all([
        axios
          .get(`${API_BASE}/offers/admin?status=active`, {
            withCredentials: true,
          })
          .catch(() => ({ data: { data: { offers: [] } } })),
        axios
          .get(`${API_BASE}/offers/admin?status=history`, {
            withCredentials: true,
          })
          .catch(() => ({ data: { data: { offers: [] } } })),
        axios
          .get(`${API_BASE}/admin/products/aging`, {
            withCredentials: true,
          })
          .catch(() => ({ data: { data: { products: [] } } })),
      ]);
      setOffers(activeRes.data?.data?.offers || []);
      setHistoryOffers(historyRes.data?.data?.offers || []);
      setAgingStock(agingRes.data?.data?.products || []);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load offers data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
    dispatch(getAllProducts({ page: 1, limit: 200, isActive: "all" }));
  }, [dispatch]);

  const productMap = useMemo(() => {
    const map = new Map();
    productList.forEach((p) => map.set(String(p._id), p));
    return map;
  }, [productList]);

  const selectedProducts = useMemo(
    () =>
      formData.productIds
        .map((id) => productMap.get(String(id)))
        .filter(Boolean),
    [formData.productIds, productMap]
  );

  const minMarginAfter = useMemo(() => {
    if (!selectedProducts.length) return null;
    const margins = selectedProducts
      .map((p) => computeMarginAfterDiscount(p, formData.discountPercent))
      .filter((m) => m !== null);
    if (!margins.length) return null;
    return Math.min(...margins);
  }, [selectedProducts, formData.discountPercent]);

  const startCreate = (overrides = {}) => {
    setEditingId(null);
    setFormData({ ...initialForm, ...overrides });
    setActiveTab("create");
  };

  const startEdit = (offer) => {
    setEditingId(offer._id);
    setFormData({
      name: offer.name || "",
      badgeText: offer.badgeText || "",
      description: offer.description || "",
      type: offer.type || "flash",
      discountPercent: offer.discountPercent ?? 10,
      productIds: (offer.products || []).map((p) =>
        typeof p === "string" ? p : p._id
      ),
      applicableCategories: offer.applicableCategories || [],
      startsAt: offer.startsAt
        ? new Date(offer.startsAt).toISOString().slice(0, 16)
        : "",
      endsAt: offer.endsAt
        ? new Date(offer.endsAt).toISOString().slice(0, 16)
        : "",
      showOnHomepage: !!offer.showOnHomepage,
      displayOrder: offer.displayOrder || 0,
      isActive: offer.isActive ?? true,
    });
    setActiveTab("create");
  };

  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    if (
      formData.productIds.length === 0 &&
      formData.applicableCategories.length === 0
    ) {
      toast({
        title: "Select products or categories",
        description: "An offer needs at least one target.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      name: formData.name,
      badgeText: formData.badgeText,
      description: formData.description,
      type: formData.type,
      discountPercent: Number(formData.discountPercent) || 0,
      products: formData.productIds,
      applicableCategories: formData.applicableCategories,
      startsAt: formData.startsAt
        ? new Date(formData.startsAt).toISOString()
        : null,
      endsAt: formData.endsAt ? new Date(formData.endsAt).toISOString() : null,
      showOnHomepage: !!formData.showOnHomepage,
      displayOrder: Number(formData.displayOrder) || 0,
      isActive: !!formData.isActive,
    };

    try {
      setSubmitting(true);
      if (editingId) {
        await axios.patch(`${API_BASE}/offers/admin/${editingId}`, payload, {
          withCredentials: true,
        });
        toast({ title: "Offer updated" });
      } else {
        await axios.post(`${API_BASE}/offers/admin`, payload, {
          withCredentials: true,
        });
        toast({ title: "Offer created" });
      }
      setFormData(initialForm);
      setEditingId(null);
      setActiveTab("active");
      fetchOffers();
    } catch (err) {
      toast({
        title: "Could not save offer",
        description: err?.response?.data?.message || err?.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOffer = async (id) => {
    if (!window.confirm("Delete this offer?")) return;
    try {
      await axios.delete(`${API_BASE}/offers/admin/${id}`, {
        withCredentials: true,
      });
      toast({ title: "Offer deleted" });
      fetchOffers();
    } catch (err) {
      toast({
        title: "Could not delete",
        description: err?.response?.data?.message || err?.message,
        variant: "destructive",
      });
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

  const handleToggleCategory = (cat) => {
    setFormData((prev) => {
      const has = prev.applicableCategories.includes(cat);
      return {
        ...prev,
        applicableCategories: has
          ? prev.applicableCategories.filter((c) => c !== cat)
          : [...prev.applicableCategories, cat],
      };
    });
  };

  const renderOfferRow = (offer) => (
    <div
      key={offer._id}
      className="flex flex-col gap-4 border-b border-[#2a2a2a] p-6 transition-colors hover:bg-[#1a1a1a] md:flex-row md:items-center md:justify-between"
    >
      <div className="flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <h3 className="font-display text-2xl uppercase text-[#FAF7F2]">
            {offer.name}
          </h3>
          <span
            className={`rounded-full border px-3 py-0.5 text-[10px] font-bold uppercase tracking-[0.22em] ${
              TYPE_BADGE_STYLES[offer.type] ||
              "border-white/10 bg-white/5 text-white/70"
            }`}
          >
            {offer.type.replace(/_/g, " ")}
          </span>
          {offer.badgeText ? (
            <span className="bg-[#ffb4ab] px-2 py-0.5 text-[10px] font-bold text-[#0a0a0a]">
              {offer.badgeText}
            </span>
          ) : null}
          {offer.showOnHomepage ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#f2ca50]/40 bg-[#f2ca50]/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-[#f2ca50]">
              <Star className="h-3 w-3" /> Homepage
            </span>
          ) : null}
          {offer.isSystemGenerated ? (
            <span className="rounded-full border border-purple-400/40 bg-purple-400/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-purple-300">
              System
            </span>
          ) : null}
        </div>
        {offer.description ? (
          <p className="text-sm text-[#99907c]">{offer.description}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-4 font-mono text-[10px] uppercase tracking-widest text-[#888]">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-[#f2ca50]" />
            {formatDate(offer.startsAt)} → {formatDate(offer.endsAt)}
          </span>
          <span className="text-[#f2ca50]">{offer.discountPercent || 0}% OFF</span>
          <span>{(offer.products || []).length} products</span>
          {(offer.applicableCategories || []).length > 0 ? (
            <span>{offer.applicableCategories.join(" / ")}</span>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => startEdit(offer)}
          className="border border-[#4d4635] px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-[#d0c5af] hover:border-[#f2ca50] hover:text-[#f2ca50]"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => handleDeleteOffer(offer._id)}
          disabled={offer.isSystemGenerated}
          className="border border-red-500/20 p-2 text-red-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
          title={
            offer.isSystemGenerated
              ? "System offers cannot be deleted"
              : "Delete offer"
          }
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl p-6 text-[#e5e2e1]">
      <div className="mb-8 flex items-center justify-between border-b border-[#2a2a2a] pb-4">
        <div>
          <h1 className="font-display text-4xl uppercase tracking-widest text-[#FAF7F2]">
            Offers & Clearances
          </h1>
          <p className="mt-2 font-sans text-sm text-[#99907c]">
            Manage promotions and handle aging inventory.
          </p>
        </div>
        <button
          onClick={() => startCreate()}
          className="flex items-center gap-2 bg-[#f2ca50] px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-[#0a0a0a] transition-colors hover:bg-[#ffe088]"
        >
          <Plus className="h-4 w-4" /> New Offer
        </button>
      </div>

      <div className="mb-8 flex flex-wrap gap-3">
        {[
          { key: "active", label: "Active Offers", icon: Tag },
          {
            key: "aging",
            label: `Aging Stock${agingStock.length ? ` (${agingStock.length})` : ""}`,
            icon: AlertTriangle,
          },
          { key: "history", label: "History", icon: Clock },
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
              <TabIcon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-[#f2ca50]" />
        </div>
      ) : (
        <div className="space-y-6">
          {activeTab === "active" ? (
            <div className="overflow-hidden rounded-sm border border-[#2a2a2a] bg-[#131313]">
              <div className="border-b border-[#2a2a2a] p-6">
                <h2 className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#f2ca50]">
                  <Tag className="h-4 w-4" /> Currently Running
                </h2>
              </div>
              {offers.length === 0 ? (
                <div className="p-12 text-center font-mono text-xs uppercase tracking-widest text-[#888]">
                  No active offers.
                </div>
              ) : (
                <div className="divide-y divide-[#2a2a2a]">
                  {offers.map(renderOfferRow)}
                </div>
              )}
            </div>
          ) : null}

          {activeTab === "history" ? (
            <div className="overflow-hidden rounded-sm border border-[#2a2a2a] bg-[#131313]">
              <div className="border-b border-[#2a2a2a] p-6">
                <h2 className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#99907c]">
                  <Clock className="h-4 w-4" /> Past & Inactive
                </h2>
              </div>
              {historyOffers.length === 0 ? (
                <div className="p-12 text-center font-mono text-xs uppercase tracking-widest text-[#888]">
                  No historical offers yet.
                </div>
              ) : (
                <div className="divide-y divide-[#2a2a2a] opacity-80">
                  {historyOffers.map(renderOfferRow)}
                </div>
              )}
            </div>
          ) : null}

          {activeTab === "aging" ? (
            <div className="rounded-sm border border-[#2a2a2a] bg-[#131313] p-6">
              <div className="mb-6">
                <h2 className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#ffb4ab]">
                  <AlertTriangle className="h-4 w-4" /> Clearance Recommendations
                </h2>
                <p className="text-sm text-[#99907c]">
                  Inventory unsold for 90+ days. Apply an offer to move them.
                </p>
              </div>

              {agingStock.length === 0 ? (
                <div className="border border-dashed border-[#2a2a2a] p-12 text-center font-mono text-xs uppercase tracking-widest text-[#888]">
                  Inventory looks healthy. No aging stock detected.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {agingStock.map((item) => {
                    const { discount: suggestedDiscount, fallback } =
                      computeSuggestedDiscount(item);
                    const suggestedMargin = computeMarginAfterDiscount(
                      item,
                      suggestedDiscount
                    );
                    return (
                      <div
                        key={item._id}
                        className="flex gap-4 border border-[#2a2a2a] bg-[#0a0a0a] p-4"
                      >
                        <div className="flex-1">
                          <h4 className="truncate font-sans text-sm text-[#e5e2e1]">
                            {item.name}
                          </h4>
                          <p className="mt-1 text-xs text-[#888]">
                            Stock: {item.totalStock}
                          </p>
                          <p className="mt-1 text-xs text-[#ffb4ab]">
                            Idle: {item.daysUnsold ?? "90+"} days
                          </p>
                          <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[#f2ca50]">
                            Suggested: {suggestedDiscount}% off
                            {fallback ? " (no cost on file)" : ""}
                          </p>
                          {suggestedMargin !== null ? (
                            <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-emerald-400">
                              Margin after discount: {suggestedMargin}%
                            </p>
                          ) : (
                            <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[#666]">
                              Margin: unknown — set costPrice for safety check
                            </p>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              startCreate({
                                productIds: [item._id],
                                name: `Clearance: ${item.name}`,
                                discountPercent: suggestedDiscount,
                                badgeText: "CLEARANCE",
                                type: "aging_stock",
                              })
                            }
                            className="mt-3 font-mono text-[10px] uppercase tracking-widest text-[#f2ca50] hover:underline"
                          >
                            Create Offer →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}

          {activeTab === "create" ? (
            <div className="rounded-sm border border-[#f2ca50]/30 bg-[#131313] p-6 md:p-8">
              <div className="mb-8 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#f2ca50]">
                  <Plus className="h-4 w-4" />{" "}
                  {editingId ? "Edit Offer" : "Create New Offer"}
                </h2>
                {editingId ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setFormData(initialForm);
                      setActiveTab("active");
                    }}
                    className="text-xs uppercase tracking-[0.22em] text-[#99907c] hover:text-[#e5e2e1]"
                  >
                    Cancel edit
                  </button>
                ) : null}
              </div>

              <form onSubmit={handleSubmitOffer} className="max-w-3xl space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-widest text-[#888]">
                      Internal Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      className="w-full border border-[#2a2a2a] bg-[#0a0a0a] p-3 text-sm text-[#FAF7F2] outline-none focus:border-[#f2ca50]"
                      placeholder="e.g. Avurudu 2026 Flash"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-widest text-[#888]">
                      Customer-facing Badge Text
                    </label>
                    <input
                      type="text"
                      value={formData.badgeText}
                      onChange={(e) =>
                        setFormData({ ...formData, badgeText: e.target.value })
                      }
                      className="w-full border border-[#2a2a2a] bg-[#0a0a0a] p-3 text-sm text-[#FAF7F2] outline-none focus:border-[#f2ca50]"
                      placeholder="e.g. AVURUDU SALE"
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

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-widest text-[#888]">
                      Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                      className="w-full border border-[#2a2a2a] bg-[#0a0a0a] p-3 text-sm text-[#FAF7F2] outline-none focus:border-[#f2ca50]"
                    >
                      {OFFER_TYPES.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-widest text-[#888]">
                      Discount %
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={formData.discountPercent}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discountPercent: Number(e.target.value),
                        })
                      }
                      className="w-full border border-[#2a2a2a] bg-[#0a0a0a] p-3 text-sm text-[#FAF7F2] outline-none focus:border-[#f2ca50]"
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
                          displayOrder: Number(e.target.value),
                        })
                      }
                      className="w-full border border-[#2a2a2a] bg-[#0a0a0a] p-3 text-sm text-[#FAF7F2] outline-none focus:border-[#f2ca50]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-widest text-[#888]">
                      Starts At
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.startsAt}
                      onChange={(e) =>
                        setFormData({ ...formData, startsAt: e.target.value })
                      }
                      className="w-full border border-[#2a2a2a] bg-[#0a0a0a] p-3 text-sm text-[#FAF7F2] outline-none focus:border-[#f2ca50]"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-widest text-[#888]">
                      Ends At
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.endsAt}
                      onChange={(e) =>
                        setFormData({ ...formData, endsAt: e.target.value })
                      }
                      className="w-full border border-[#2a2a2a] bg-[#0a0a0a] p-3 text-sm text-[#FAF7F2] outline-none focus:border-[#f2ca50]"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[#d0c5af]">
                    <input
                      type="checkbox"
                      checked={formData.showOnHomepage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          showOnHomepage: e.target.checked,
                        })
                      }
                    />
                    Show on Homepage
                  </label>
                  <label className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[#d0c5af]">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isActive: e.target.checked,
                        })
                      }
                    />
                    Active
                  </label>
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-widest text-[#888]">
                    Apply to Categories (optional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["Ladies", "Gents", "Unisex"].map((cat) => {
                      const active = formData.applicableCategories.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => handleToggleCategory(cat)}
                          className={`px-4 py-1.5 text-[10px] uppercase tracking-[0.22em] border transition-colors ${
                            active
                              ? "border-[#f2ca50] bg-[#f2ca50]/10 text-[#f2ca50]"
                              : "border-[#4d4635] text-[#99907c] hover:border-[#d0c5af]"
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-widest text-[#888]">
                    Target Products ({formData.productIds.length} selected)
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
                          const margin = computeMarginAfterDiscount(
                            p,
                            formData.discountPercent
                          );
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
                              {margin !== null ? (
                                <span
                                  className={`font-mono text-[10px] ${
                                    margin < MIN_HEALTHY_MARGIN
                                      ? "text-[#ffb4ab]"
                                      : "text-emerald-400"
                                  }`}
                                >
                                  {margin}%
                                </span>
                              ) : (
                                <span className="font-mono text-[10px] text-[#666]">
                                  no cost
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {minMarginAfter !== null &&
                minMarginAfter < MIN_HEALTHY_MARGIN ? (
                  <div className="border border-[#ffb4ab]/40 bg-[#ffb4ab]/5 p-3 text-sm text-[#ffb4ab]">
                    ⚠ At {formData.discountPercent}% off, the lowest margin in
                    your selection drops to {minMarginAfter}% — below the{" "}
                    {MIN_HEALTHY_MARGIN}% recommended floor.
                  </div>
                ) : null}

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
                        : "Publish New Offer"}
                  </button>
                </div>
              </form>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default AdminOffers;
