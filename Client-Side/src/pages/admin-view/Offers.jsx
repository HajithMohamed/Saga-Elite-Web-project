import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "@/hooks/use-toast";
import { API_V1_URL as API_BASE } from "@/lib/api";
import {
  Tag,
  AlertTriangle,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Star,
  Sparkles,
  Search,
} from "lucide-react";
import { getAllProducts } from "@/store/admin/product-slice";
import {
  AdminFormShell,
  StickyActionBar,
  FormSection,
  FormField,
  LuxuryInput,
  LuxuryTextarea,
  LuxurySelect,
  LuxuryDateInput,
  StatusPill,
  RightRailPanel,
  RailToggleRow,
  ProgressBar,
} from "@/components/admin-components/_form";

const OFFER_TYPES = [
  { value: "flash", label: "Flash Sale" },
  { value: "seasonal", label: "Seasonal" },
  { value: "clearance", label: "Clearance" },
  { value: "aging_stock", label: "Aging Stock" },
  { value: "new_product", label: "New Product Launch" },
  { value: "tier-discount", label: "Tier Discount" },
  { value: "mystery-box", label: "Mystery Box" },
];

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
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [productSearch, setProductSearch] = useState("");

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

  const filteredProductList = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return productList;
    return productList.filter((p) =>
      String(p.name || "").toLowerCase().includes(q) ||
      String(p.artNo || "").toLowerCase().includes(q)
    );
  }, [productList, productSearch]);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(initialForm);
    setProductSearch("");
  };

  const startCreate = (overrides = {}) => {
    setEditingId(null);
    setFormData({ ...initialForm, ...overrides });
    setShowForm(true);
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
    setShowForm(true);
  };

  const handleSubmitOffer = async (e) => {
    if (e?.preventDefault) e.preventDefault();
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
      resetForm();
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

  const computedStatus = (() => {
    if (!formData.isActive) return "inactive";
    const now = Date.now();
    if (formData.startsAt) {
      const start = new Date(formData.startsAt).getTime();
      if (!Number.isNaN(start) && start > now) return "scheduled";
    }
    if (formData.endsAt) {
      const end = new Date(formData.endsAt).getTime();
      if (!Number.isNaN(end) && end < now) return "archived";
    }
    return "active";
  })();

  const completedCount = [
    formData.name?.trim().length >= 3,
    Number(formData.discountPercent) > 0,
    formData.productIds.length > 0 || formData.applicableCategories.length > 0,
    formData.description?.trim().length > 0,
    Boolean(formData.startsAt) || Boolean(formData.endsAt),
  ].filter(Boolean).length;
  const progressValue = completedCount / 5;

  const renderOfferRow = (offer) => (
    <div
      key={offer._id}
      className="flex flex-col gap-4 border-b border-white/[0.05] p-6 transition-colors hover:bg-white/[0.02] md:flex-row md:items-center md:justify-between"
    >
      <div className="flex-1 min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <h3 className="text-lg font-semibold text-white truncate">
            {offer.name}
          </h3>
          <StatusPill
            tone="published"
            label={offer.type.replace(/_/g, " ")}
            size="sm"
          />
          {offer.badgeText ? (
            <span className="rounded-full border border-rose-400/30 bg-rose-400/[0.10] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-rose-300">
              {offer.badgeText}
            </span>
          ) : null}
          {offer.showOnHomepage ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/[0.10] px-2.5 py-0.5 text-[10px] uppercase tracking-[0.15em] text-[#D4AF37]">
              <Star className="h-3 w-3" /> Homepage
            </span>
          ) : null}
          {offer.isSystemGenerated ? (
            <StatusPill tone="warning" label="System" size="sm" />
          ) : null}
        </div>
        {offer.description ? (
          <p className="text-sm text-white/60">{offer.description}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-4 text-[10px] uppercase tracking-[0.15em] text-white/40">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3 text-[#D4AF37]" />
            {formatDate(offer.startsAt)} → {formatDate(offer.endsAt)}
          </span>
          <span className="text-[#D4AF37]">{offer.discountPercent || 0}% OFF</span>
          <span>{(offer.products || []).length} products</span>
          {(offer.applicableCategories || []).length > 0 ? (
            <span>{offer.applicableCategories.join(" / ")}</span>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => startEdit(offer)}
          className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/80 hover:border-[#D4AF37]/40 hover:text-[#D4AF37] transition"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => handleDeleteOffer(offer._id)}
          disabled={offer.isSystemGenerated}
          className="rounded-full border border-rose-500/20 p-2 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-40 transition"
          title={
            offer.isSystemGenerated
              ? "System offers cannot be deleted"
              : "Delete offer"
          }
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  const offerFormPanel = (
    <AdminFormShell
      onClose={resetForm}
      header={
        <StickyActionBar
          eyebrow={editingId ? "Offer · Editing" : "Offer · New Promotion"}
          title={formData.name?.trim() || (editingId ? "Untitled offer" : "New Offer")}
          subtitle={
            formData.discountPercent
              ? `${formData.discountPercent}% off · ${OFFER_TYPES.find((o) => o.value === formData.type)?.label || ""}`
              : "Set a discount to continue"
          }
          onCancel={resetForm}
          onPublish={handleSubmitOffer}
          publishLabel={editingId ? "Save Changes" : "Publish Offer"}
          isSubmitting={submitting}
        />
      }
      rightRail={
        <>
          <RightRailPanel
            tone="accent"
            title="Live Preview"
            description="The badge that customers see on the storefront."
          >
            <div className="rounded-2xl border border-white/[0.06] bg-[#0F0F0F] p-5">
              <h4 className="text-base font-semibold text-white">
                {formData.name || "Untitled offer"}
              </h4>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusPill status={computedStatus} size="sm" />
                <span className="rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/[0.08] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#D4AF37]">
                  {formData.discountPercent}% off
                </span>
                {formData.badgeText ? (
                  <span className="rounded-full border border-rose-400/30 bg-rose-400/[0.10] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-rose-300">
                    {formData.badgeText}
                  </span>
                ) : null}
              </div>
              <dl className="mt-4 space-y-1.5 border-t border-white/[0.05] pt-3 text-[11px]">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-white/40 uppercase tracking-wider">Type</dt>
                  <dd className="text-white/80 capitalize">
                    {formData.type.replace(/_/g, " ")}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-white/40 uppercase tracking-wider">Window</dt>
                  <dd className="text-white/80 text-right">
                    {formatDate(formData.startsAt)} → {formatDate(formData.endsAt)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-white/40 uppercase tracking-wider">Products</dt>
                  <dd className="text-white/80 tabular-nums">
                    {formData.productIds.length}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-white/40 uppercase tracking-wider">Categories</dt>
                  <dd className="text-white/80">
                    {formData.applicableCategories.length
                      ? formData.applicableCategories.join(", ")
                      : "—"}
                  </dd>
                </div>
              </dl>
            </div>
          </RightRailPanel>

          {minMarginAfter !== null && minMarginAfter < MIN_HEALTHY_MARGIN ? (
            <RightRailPanel title="Margin Warning">
              <div className="rounded-xl border border-rose-400/30 bg-rose-400/[0.06] p-3 text-[11px] leading-relaxed text-rose-300">
                At {formData.discountPercent}% off, the lowest margin in your
                selection drops to <strong>{minMarginAfter}%</strong> — below the{" "}
                {MIN_HEALTHY_MARGIN}% recommended floor.
              </div>
            </RightRailPanel>
          ) : null}

          <RightRailPanel title="Status & Visibility">
            <RailToggleRow
              label="Active"
              helper="Inactive offers cannot apply to checkouts."
              checked={formData.isActive}
              onChange={(v) => setFormData({ ...formData, isActive: v })}
            />
            <RailToggleRow
              label="Show on Homepage"
              helper="Surface this offer in the homepage hero rotation."
              checked={formData.showOnHomepage}
              onChange={(v) => setFormData({ ...formData, showOnHomepage: v })}
            />
          </RightRailPanel>

          <RightRailPanel title="Setup Progress">
            <ProgressBar
              label="Offer completion"
              value={progressValue}
              segments={5}
              filledCount={completedCount}
            />
          </RightRailPanel>

          <RightRailPanel title="Tips">
            <ul className="space-y-2 text-[11px] leading-relaxed text-white/50">
              <li className="flex gap-2">
                <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-[#D4AF37]" />
                Keep healthy margins above {MIN_HEALTHY_MARGIN}% — the right rail
                warns if you cross it.
              </li>
              <li className="flex gap-2">
                <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-[#D4AF37]" />
                Badge text appears on product cards (e.g. "AVURUDU SALE").
              </li>
              <li className="flex gap-2">
                <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-[#D4AF37]" />
                Aging stock recommendations come straight from inventory health.
              </li>
            </ul>
          </RightRailPanel>
        </>
      }
    >
      <FormSection
        number="01"
        title="Offer Identity"
        description="What this promotion is called and what shoppers see."
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField
            label="Internal Name"
            required
            helper="Used for admin reporting and history."
            hint={`${formData.name.length} / 200`}
          >
            <LuxuryInput
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Avurudu 2026 Flash"
              maxLength={200}
            />
          </FormField>

          <FormField
            label="Customer Badge Text"
            optional
            helper="Short caps text shown on product cards (e.g. AVURUDU SALE)."
          >
            <LuxuryInput
              type="text"
              value={formData.badgeText}
              onChange={(e) =>
                setFormData({ ...formData, badgeText: e.target.value })
              }
              placeholder="AVURUDU SALE"
              maxLength={40}
            />
          </FormField>
        </div>

        <FormField
          label="Description"
          optional
          helper="Internal context for admins."
        >
          <LuxuryTextarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={2}
          />
        </FormField>
      </FormSection>

      <FormSection
        number="02"
        title="Discount & Type"
        description="Choose offer type, discount percent, and homepage display order."
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <FormField label="Type" required>
            <LuxurySelect
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              {OFFER_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </LuxurySelect>
          </FormField>

          <FormField label="Discount %" required helper="0 – 99">
            <LuxuryInput
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
            />
          </FormField>

          <FormField
            label="Display Order"
            optional
            helper="Lower = earlier in homepage rotation."
          >
            <LuxuryInput
              type="number"
              value={formData.displayOrder}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  displayOrder: Number(e.target.value),
                })
              }
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection
        number="03"
        title="Schedule"
        description="When this offer is active. Leave both empty to run indefinitely."
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField label="Starts At" optional>
            <LuxuryDateInput
              type="datetime-local"
              value={formData.startsAt}
              onChange={(e) =>
                setFormData({ ...formData, startsAt: e.target.value })
              }
            />
          </FormField>
          <FormField label="Ends At" optional>
            <LuxuryDateInput
              type="datetime-local"
              value={formData.endsAt}
              onChange={(e) =>
                setFormData({ ...formData, endsAt: e.target.value })
              }
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection
        number="04"
        title="Targeting"
        description="Pick the products or categories this offer applies to. Either is enough."
        action={
          <span className="text-[11px] text-white/40">
            {formData.productIds.length} selected
          </span>
        }
      >
        <FormField
          label="Categories"
          optional
          helper="Apply to entire categories — selected products are still added on top."
        >
          <div className="flex flex-wrap gap-2">
            {["Ladies", "Gents", "Unisex"].map((cat) => {
              const active = formData.applicableCategories.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleToggleCategory(cat)}
                  className={`rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] border transition ${
                    active
                      ? "border-[#D4AF37]/40 bg-[#D4AF37]/[0.10] text-[#D4AF37]"
                      : "border-white/10 bg-white/[0.04] text-white/60 hover:text-white hover:border-white/20"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </FormField>

        <FormField
          label="Products"
          optional
          helper="Search by name or art number. Margin badge turns red below 15%."
        >
          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <LuxuryInput
                type="search"
                placeholder="Search products…"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="max-h-72 overflow-y-auto rounded-xl border border-white/[0.06] bg-black/30 p-2">
              {productList.length === 0 ? (
                <p className="p-4 text-center text-xs text-white/40">
                  Loading products…
                </p>
              ) : filteredProductList.length === 0 ? (
                <p className="p-4 text-center text-xs text-white/40">
                  No products match "{productSearch}".
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
                  {filteredProductList.map((p) => {
                    const checked = formData.productIds.includes(p._id);
                    const margin = computeMarginAfterDiscount(
                      p,
                      formData.discountPercent
                    );
                    return (
                      <label
                        key={p._id}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-xs transition ${
                          checked
                            ? "border-[#D4AF37]/40 bg-[#D4AF37]/[0.06]"
                            : "border-transparent hover:border-white/10 hover:bg-white/[0.03]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleProduct(p._id)}
                          className="h-3.5 w-3.5 accent-[#D4AF37]"
                        />
                        <span className="flex-1 truncate text-white/80">
                          {p.name}
                        </span>
                        {margin !== null ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] tabular-nums ${
                              margin < MIN_HEALTHY_MARGIN
                                ? "bg-rose-500/15 text-rose-300"
                                : "bg-emerald-500/15 text-emerald-300"
                            }`}
                          >
                            {margin}%
                          </span>
                        ) : (
                          <span className="text-[10px] text-white/30">
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
        </FormField>
      </FormSection>
    </AdminFormShell>
  );

  return (
    <div className="mx-auto max-w-7xl p-6 text-white">
      <div className="mb-8 flex items-center justify-between border-b border-white/[0.06] pb-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Offers & Clearances
          </h1>
          <p className="mt-2 text-sm text-white/50">
            Manage promotions and handle aging inventory.
          </p>
        </div>
        <button
          onClick={() => startCreate()}
          className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-[#0A0A0A] shadow-[0_4px_14px_rgba(212,175,55,0.35)] hover:bg-[#E2BD45] transition"
        >
          <Plus className="h-4 w-4" /> New Offer
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
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
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition ${
                isActive
                  ? "bg-[#D4AF37]/[0.12] text-[#D4AF37] border border-[#D4AF37]/30"
                  : "border border-white/10 text-white/50 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <TabIcon className="h-3.5 w-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-[#D4AF37]" />
        </div>
      ) : (
        <div className="space-y-6">
          {activeTab === "active" ? (
            <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0F0F0F]">
              <div className="border-b border-white/[0.05] p-5">
                <h2 className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-semibold text-[#D4AF37]">
                  <Tag className="h-3.5 w-3.5" /> Currently Running
                </h2>
              </div>
              {offers.length === 0 ? (
                <div className="p-12 text-center text-xs uppercase tracking-[0.2em] text-white/40">
                  No active offers.
                </div>
              ) : (
                <div className="divide-y divide-white/[0.05]">
                  {offers.map(renderOfferRow)}
                </div>
              )}
            </div>
          ) : null}

          {activeTab === "history" ? (
            <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0F0F0F]">
              <div className="border-b border-white/[0.05] p-5">
                <h2 className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-semibold text-white/60">
                  <Clock className="h-3.5 w-3.5" /> Past & Inactive
                </h2>
              </div>
              {historyOffers.length === 0 ? (
                <div className="p-12 text-center text-xs uppercase tracking-[0.2em] text-white/40">
                  No historical offers yet.
                </div>
              ) : (
                <div className="divide-y divide-white/[0.05] opacity-80">
                  {historyOffers.map(renderOfferRow)}
                </div>
              )}
            </div>
          ) : null}

          {activeTab === "aging" ? (
            <div className="rounded-2xl border border-white/[0.06] bg-[#0F0F0F] p-6">
              <div className="mb-6">
                <h2 className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-semibold text-rose-300">
                  <AlertTriangle className="h-3.5 w-3.5" /> Clearance Recommendations
                </h2>
                <p className="text-sm text-white/50">
                  Inventory unsold for 90+ days. Apply an offer to move them.
                </p>
              </div>

              {agingStock.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/[0.08] p-12 text-center text-xs uppercase tracking-[0.2em] text-white/40">
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
                        className="rounded-2xl border border-white/[0.06] bg-black/30 p-4"
                      >
                        <h4 className="truncate text-sm font-semibold text-white">
                          {item.name}
                        </h4>
                        <p className="mt-1 text-xs text-white/50">
                          Stock: {item.totalStock}
                        </p>
                        <p className="mt-1 text-xs text-rose-300">
                          Idle: {item.daysUnsold ?? "90+"} days
                        </p>
                        <p className="mt-2 text-[10px] uppercase tracking-[0.15em] text-[#D4AF37]">
                          Suggested: {suggestedDiscount}% off
                          {fallback ? " · no cost on file" : ""}
                        </p>
                        {suggestedMargin !== null ? (
                          <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-emerald-400">
                            Margin after discount: {suggestedMargin}%
                          </p>
                        ) : (
                          <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-white/30">
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
                          className="mt-3 text-[10px] uppercase tracking-[0.15em] text-[#D4AF37] hover:underline"
                        >
                          Create Offer →
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      <AnimatePresence mode="wait">
        {showForm ? offerFormPanel : null}
      </AnimatePresence>
    </div>
  );
};

export default AdminOffers;
