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
  Zap,
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
import Pagination from "@/components/common-components/Pagination";
import usePagination from "@/hooks/use-pagination";
import ImagePicker from "@/components/admin-components/_shared/ImagePicker";

const OFFER_TYPES = [
  { value: "percentage_discount", label: "Percentage Discount" },
  { value: "fixed_amount", label: "Fixed Amount Off" },
  { value: "category_discount", label: "Category Discount" },
  { value: "product_discount", label: "Product Discount" },
  { value: "buy_x_get_y", label: "Buy X Get Y" },
  { value: "cart_value", label: "Cart Value Discount" },
  { value: "seasonal_campaign", label: "Seasonal Campaign" },
  { value: "flash", label: "Flash Sale" },
  { value: "seasonal", label: "Seasonal" },
  { value: "clearance", label: "Clearance" },
  { value: "aging_stock", label: "Aging Stock" },
  { value: "new_product", label: "New Product Launch" },
  { value: "tier-discount", label: "Tier Discount" },
];

const MIN_HEALTHY_MARGIN = 15;

const initialForm = {
  name: "",
  badgeText: "",
  description: "",
  type: "percentage_discount",
  discountPercent: 10,
  discountAmount: "",
  minCartValue: "",
  triggerProduct: "",
  rewardProduct: "",
  rewardQuantity: 1,
  triggerQuantity: 1,
  productIds: [],
  applicableCategories: [],
  excludedProducts: [],
  excludedCategories: [],
  maxApplicationsPerUser: "",
  maxApplicationsTotal: "",
  bannerImage: "",
  themeColor: "",
  campaignLandingPage: "",
  startsAt: "",
  endsAt: "",
  showOnHomepage: true,
  displayOrder: 0,
  isActive: true,
  appliesToLeastSellingItems: false,
  customerClassificationDiscounts: {},
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

const normalizeDiscountMap = (classifications = [], discounts = {}, fallback = 10) =>
  Object.fromEntries(
    classifications.map((classification) => {
      const value = Number(discounts?.[classification.key]);
      return [
        classification.key,
        Number.isFinite(value) ? value : Number(fallback) || 0,
      ];
    })
  );

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
  const [customerClassifications, setCustomerClassifications] = useState([]);
  const [defaultClassificationDiscounts, setDefaultClassificationDiscounts] = useState({});

  const offersPg = usePagination(offers, 10);
  const historyPg = usePagination(historyOffers, 10);
  const agingPg = usePagination(agingStock, 12);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const [activeRes, historyRes, agingRes, classificationsRes] = await Promise.all([
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
        axios
          .get(`${API_BASE}/offers/admin/classifications`, {
            withCredentials: true,
          })
          .catch(() => ({ data: { data: { classifications: [], defaultDiscounts: {} } } })),
      ]);
      setOffers(activeRes.data?.data?.offers || []);
      setHistoryOffers(historyRes.data?.data?.offers || []);
      setAgingStock(agingRes.data?.data?.products || []);
      setCustomerClassifications(
        classificationsRes.data?.data?.classifications || []
      );
      setDefaultClassificationDiscounts(
        classificationsRes.data?.data?.defaultDiscounts || {}
      );
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

  const defaultFlashDealDiscounts = useMemo(
    () =>
      normalizeDiscountMap(
        customerClassifications,
        defaultClassificationDiscounts,
        formData.discountPercent || initialForm.discountPercent
      ),
    [customerClassifications, defaultClassificationDiscounts, formData.discountPercent]
  );

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
    const nextType = overrides.type || initialForm.type;
    const classificationDiscounts =
      nextType === "flash"
        ? normalizeDiscountMap(
            customerClassifications,
            overrides.customerClassificationDiscounts ||
              defaultClassificationDiscounts,
            overrides.discountPercent || initialForm.discountPercent
          )
        : {};
    setEditingId(null);
    setFormData({
      ...initialForm,
      ...overrides,
      customerClassificationDiscounts: classificationDiscounts,
    });
    setShowForm(true);
  };

  const startEdit = (offer) => {
    setEditingId(offer._id);
    setFormData({
      name: offer.name || "",
      badgeText: offer.badgeText || "",
      description: offer.description || "",
      type: offer.type || "percentage_discount",
      discountPercent: offer.discountPercent ?? 10,
      discountAmount: offer.discountAmount ?? "",
      minCartValue: offer.minCartValue ?? "",
      triggerProduct: offer.triggerProduct ?? "",
      rewardProduct: offer.rewardProduct ?? "",
      rewardQuantity: offer.rewardQuantity ?? 1,
      triggerQuantity: offer.triggerQuantity ?? 1,
      productIds: (offer.products || []).map((p) =>
        typeof p === "string" ? p : p._id
      ),
      applicableCategories: offer.applicableCategories || [],
      excludedProducts: offer.excludedProducts || [],
      excludedCategories: offer.excludedCategories || [],
      maxApplicationsPerUser: offer.maxApplicationsPerUser ?? "",
      maxApplicationsTotal: offer.maxApplicationsTotal ?? "",
      bannerImage: offer.bannerImage ?? "",
      themeColor: offer.themeColor ?? "",
      campaignLandingPage: offer.campaignLandingPage ?? "",
      startsAt: offer.startsAt
        ? new Date(offer.startsAt).toISOString().slice(0, 16)
        : "",
      endsAt: offer.endsAt
        ? new Date(offer.endsAt).toISOString().slice(0, 16)
        : "",
      showOnHomepage: !!offer.showOnHomepage,
      displayOrder: offer.displayOrder || 0,
      isActive: offer.isActive ?? true,
      appliesToLeastSellingItems: !!offer.appliesToLeastSellingItems,
      customerClassificationDiscounts: normalizeDiscountMap(
        customerClassifications,
        offer.customerClassificationDiscounts || {},
        offer.discountPercent ?? initialForm.discountPercent
      ),
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
      formData.applicableCategories.length === 0 &&
      !formData.appliesToLeastSellingItems
    ) {
      toast({
        title: "Select products or categories",
        description: "An offer needs a target, or enable least-selling items.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      name: formData.name,
      badgeText: formData.badgeText,
      description: formData.description,
      type: formData.type,
      discountPercent: formData.type === "fixed_amount" ? undefined : (Number(formData.discountPercent) || 0),
      discountAmount: formData.type === "fixed_amount" ? (Number(formData.discountAmount) || 0) : undefined,
      minCartValue: formData.minCartValue ? Number(formData.minCartValue) : undefined,
      triggerProduct: formData.type === "buy_x_get_y" && formData.triggerProduct ? formData.triggerProduct : undefined,
      rewardProduct: formData.type === "buy_x_get_y" && formData.rewardProduct ? formData.rewardProduct : undefined,
      rewardQuantity: formData.type === "buy_x_get_y" ? (Number(formData.rewardQuantity) || 1) : undefined,
      triggerQuantity: formData.type === "buy_x_get_y" ? (Number(formData.triggerQuantity) || 1) : undefined,
      products: formData.productIds,
      applicableCategories: formData.applicableCategories,
      excludedProducts: formData.excludedProducts,
      excludedCategories: formData.excludedCategories,
      maxApplicationsPerUser: formData.maxApplicationsPerUser ? Number(formData.maxApplicationsPerUser) : undefined,
      maxApplicationsTotal: formData.maxApplicationsTotal ? Number(formData.maxApplicationsTotal) : undefined,
      bannerImage: formData.bannerImage || undefined,
      themeColor: formData.themeColor || undefined,
      campaignLandingPage: formData.campaignLandingPage || undefined,
      startsAt: formData.startsAt
        ? new Date(formData.startsAt).toISOString()
        : null,
      endsAt: formData.endsAt ? new Date(formData.endsAt).toISOString() : null,
      showOnHomepage: !!formData.showOnHomepage,
      displayOrder: Number(formData.displayOrder) || 0,
      isActive: !!formData.isActive,
      appliesToLeastSellingItems: !!formData.appliesToLeastSellingItems,
      customerClassificationDiscounts:
        formData.type === "flash"
          ? normalizeDiscountMap(
              customerClassifications,
              formData.customerClassificationDiscounts,
              formData.discountPercent
            )
          : undefined,
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
    formData.type === "fixed_amount" ? (Number(formData.discountAmount) > 0) : (Number(formData.discountPercent) > 0),
    formData.appliesToLeastSellingItems ||
      formData.productIds.length > 0 ||
      formData.applicableCategories.length > 0,
    formData.description?.trim().length > 0,
    Boolean(formData.startsAt) || Boolean(formData.endsAt),
  ].filter(Boolean).length;
  const progressValue = completedCount / 5;

  const renderOfferRow = (offer) => (
    <div
      key={offer._id}
      className="flex flex-col gap-4 border-b border-ink/[0.05] p-6 transition-colors hover:bg-ink/[0.02] md:flex-row md:items-center md:justify-between"
    >
      <div className="flex-1 min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <h3 className="text-lg font-semibold text-ink truncate">
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
            <span className="inline-flex items-center gap-1 rounded-full border border-gold-ink2/40 bg-gold-deep/[0.10] px-2.5 py-0.5 text-[10px] uppercase tracking-[0.15em] text-gold-ink2">
              <Star className="h-3 w-3" /> Homepage
            </span>
          ) : null}
          {offer.isSystemGenerated ? (
            <StatusPill tone="warning" label="System" size="sm" />
          ) : null}
        </div>
        {offer.description ? (
          <p className="text-sm text-ink/60">{offer.description}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-4 text-[10px] uppercase tracking-[0.15em] text-ink/40">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3 text-gold-ink2" />
            {formatDate(offer.startsAt)} → {formatDate(offer.endsAt)}
          </span>
          <span className="text-gold-ink2">{offer.type === "fixed_amount" ? `LKR ${offer.discountAmount || 0} OFF` : `${offer.discountPercent || 0}% OFF`}</span>
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
          className="rounded-full border border-ink/10 bg-ink/[0.04] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-ink/80 hover:border-gold-ink2/40 hover:text-gold-ink2 transition"
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
            formData.type === "fixed_amount"
              ? formData.discountAmount
                ? `LKR ${formData.discountAmount} off · ${OFFER_TYPES.find((o) => o.value === formData.type)?.label || ""}`
                : "Set a discount amount to continue"
              : formData.discountPercent
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
            <div className="rounded-2xl border border-ink/[0.06] bg-panel p-5">
              <h4 className="text-base font-semibold text-ink">
                {formData.name || "Untitled offer"}
              </h4>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusPill status={computedStatus} size="sm" />
                {formData.type === "fixed_amount" ? (
                  <span className="rounded-full border border-gold-ink2/30 bg-gold-deep/[0.08] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-ink2">
                    LKR {formData.discountAmount || 0} off
                  </span>
                ) : (
                  <span className="rounded-full border border-gold-ink2/30 bg-gold-deep/[0.08] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-ink2">
                    {formData.discountPercent}% off
                  </span>
                )}
                {formData.badgeText ? (
                  <span className="rounded-full border border-rose-400/30 bg-rose-400/[0.10] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-rose-300">
                    {formData.badgeText}
                  </span>
                ) : null}
              </div>
              <dl className="mt-4 space-y-1.5 border-t border-ink/[0.05] pt-3 text-[11px]">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink/40 uppercase tracking-wider">Type</dt>
                  <dd className="text-ink/80 capitalize">
                    {formData.type.replace(/_/g, " ")}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink/40 uppercase tracking-wider">Window</dt>
                  <dd className="text-ink/80 text-right">
                    {formatDate(formData.startsAt)} → {formatDate(formData.endsAt)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink/40 uppercase tracking-wider">Products</dt>
                  <dd className="text-ink/80 tabular-nums">
                    {formData.productIds.length}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink/40 uppercase tracking-wider">Categories</dt>
                  <dd className="text-ink/80">
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
            <ul className="space-y-2 text-[11px] leading-relaxed text-ink/50">
              <li className="flex gap-2">
                <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-gold-ink2" />
                Keep healthy margins above {MIN_HEALTHY_MARGIN}% — the right rail
                warns if you cross it.
              </li>
              <li className="flex gap-2">
                <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-gold-ink2" />
                Badge text appears on product cards (e.g. "AVURUDU SALE").
              </li>
              <li className="flex gap-2">
                <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-gold-ink2" />
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

        <FormField
          label="Homepage Banner Image"
          optional
          helper="Appears in the homepage hero slider and links shoppers to the offers page. Recommended 1280 × 420 px (21:9). Requires 'Show on Homepage' enabled."
        >
          <ImagePicker
            value={formData.bannerImage}
            onChange={(v) => setFormData({ ...formData, bannerImage: v })}
            label="Upload banner"
            refModel="Offer"
            refId={editingId || "new_offer"}
            type="offerBanner"
          />
          {formData.bannerImage ? (
            <div className="mt-3 overflow-hidden rounded-xl border border-ink/10 bg-page aspect-[1280/420]">
              <img
                src={formData.bannerImage}
                alt="Banner preview"
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          ) : null}
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

      {formData.type === "fixed_amount" ? (
        <FormSection
          number="03"
          title="Fixed Amount Discount"
          description="Set a flat amount off instead of a percentage."
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FormField label="Discount Amount (LKR)" required>
              <LuxuryInput
                type="number"
                min="0"
                value={formData.discountAmount}
                onChange={(e) =>
                  setFormData({ ...formData, discountAmount: e.target.value })
                }
                placeholder="e.g. 500"
              />
            </FormField>
            <FormField label="Min Cart Value (LKR)" optional helper="Leave empty for no minimum.">
              <LuxuryInput
                type="number"
                min="0"
                value={formData.minCartValue}
                onChange={(e) =>
                  setFormData({ ...formData, minCartValue: e.target.value })
                }
                placeholder="e.g. 2500"
              />
            </FormField>
          </div>
        </FormSection>
      ) : null}

      {formData.type === "cart_value" ? (
        <FormSection
          number="03"
          title="Cart Value Discount"
          description="Discount kicks in when the cart reaches a minimum value."
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FormField label="Min Cart Value (LKR)" required>
              <LuxuryInput
                type="number"
                min="0"
                value={formData.minCartValue}
                onChange={(e) =>
                  setFormData({ ...formData, minCartValue: e.target.value })
                }
                placeholder="e.g. 5000"
              />
            </FormField>
            <FormField label="Discount %" required>
              <LuxuryInput
                type="number"
                min="0"
                max="100"
                value={formData.discountPercent}
                onChange={(e) =>
                  setFormData({ ...formData, discountPercent: Number(e.target.value) })
                }
              />
            </FormField>
          </div>
        </FormSection>
      ) : null}

      {formData.type === "buy_x_get_y" ? (
        <FormSection
          number="03"
          title="Buy X Get Y"
          description="Free / discounted reward product when customer buys a trigger product."
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FormField label="Trigger Product" required helper="Product the customer must purchase.">
              <LuxurySelect
                value={formData.triggerProduct}
                onChange={(e) => setFormData({ ...formData, triggerProduct: e.target.value })}
              >
                <option value="">Select trigger product</option>
                {productList.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </LuxurySelect>
            </FormField>
            <FormField label="Trigger Quantity" optional helper="How many to buy (default: 1).">
              <LuxuryInput
                type="number"
                min="1"
                value={formData.triggerQuantity}
                onChange={(e) => setFormData({ ...formData, triggerQuantity: Number(e.target.value) })}
              />
            </FormField>
            <FormField label="Reward Product" required helper="Product the customer receives.">
              <LuxurySelect
                value={formData.rewardProduct}
                onChange={(e) => setFormData({ ...formData, rewardProduct: e.target.value })}
              >
                <option value="">Select reward product</option>
                {productList.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </LuxurySelect>
            </FormField>
            <FormField label="Reward Quantity" optional helper="How many they get (default: 1).">
              <LuxuryInput
                type="number"
                min="1"
                value={formData.rewardQuantity}
                onChange={(e) => setFormData({ ...formData, rewardQuantity: Number(e.target.value) })}
              />
            </FormField>
          </div>
        </FormSection>
      ) : null}

      {formData.type === "seasonal_campaign" ? (
        <FormSection
          number="03"
          title="Campaign Assets"
          description="Visual branding for the campaign landing page. The homepage banner image is set in section 01."
        >
          <div className="grid grid-cols-1 gap-5">
            <div className="grid grid-cols-2 gap-5">
              <FormField label="Theme Color" optional helper="Hex colour code (e.g. #D4AF37).">
                <LuxuryInput
                  type="text"
                  value={formData.themeColor}
                  onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                  placeholder="#D4AF37"
                />
              </FormField>
              <FormField label="Campaign Page" optional helper="Custom route slug for the landing page.">
                <LuxuryInput
                  type="text"
                  value={formData.campaignLandingPage}
                  onChange={(e) => setFormData({ ...formData, campaignLandingPage: e.target.value })}
                  placeholder="/campaign/avurudu"
                />
              </FormField>
            </div>
          </div>
        </FormSection>
      ) : null}

      <FormSection
        number={["fixed_amount", "cart_value", "buy_x_get_y", "seasonal_campaign"].includes(formData.type) ? "04" : "03"}
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

      {formData.type === "flash" ? (
        <FormSection
          number={["fixed_amount", "cart_value", "buy_x_get_y", "seasonal_campaign"].includes(formData.type) ? "05" : "04"}
          title="Flash Deal Settings"
          description="Configure customer classification discounts and auto-fill least-selling products."
          action={
            <span className="inline-flex items-center gap-1.5 text-[11px] text-amber-400">
              <Zap className="h-3 w-3" /> Flash
            </span>
          }
        >
          <RailToggleRow
            label="Auto-fill Least Selling Items"
            helper="When enabled, the server replaces the product list with the current least-selling stocked products at save time."
            checked={formData.appliesToLeastSellingItems}
            onChange={(v) =>
              setFormData({ ...formData, appliesToLeastSellingItems: v })
            }
          />

          <FormField
            label="Discounts by Customer Classification"
            helper="Set a discount percentage for each customer classification. Leave unchanged to use the system defaults."
          >
            {customerClassifications.length === 0 ? (
              <p className="text-xs text-ink/40">
                No customer classifications loaded.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {customerClassifications.map((cls) => {
                  const currentValue =
                    formData.customerClassificationDiscounts?.[cls.key] ??
                    defaultFlashDealDiscounts[cls.key] ??
                    "";
                  return (
                    <div
                      key={cls.key}
                      className="flex items-center gap-3 rounded-xl border border-ink/[0.06] bg-black/20 px-3 py-2.5"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-ink/80 truncate">
                          {cls.label}
                        </p>
                        {cls.description ? (
                          <p className="text-[10px] text-ink/40 truncate">
                            {cls.description}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <LuxuryInput
                          type="number"
                          min="0"
                          max="100"
                          value={currentValue}
                          onChange={(e) => {
                            const val = e.target.value === "" ? "" : Number(e.target.value);
                            setFormData((prev) => ({
                              ...prev,
                              customerClassificationDiscounts: {
                                ...prev.customerClassificationDiscounts,
                                [cls.key]: val,
                              },
                            }));
                          }}
                          className="!w-20 text-center tabular-nums"
                          placeholder="—"
                        />
                        <span className="text-[10px] font-medium text-ink/40">%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </FormField>
        </FormSection>
      ) : null}

      <FormSection
        number={
          formData.type === "flash"
            ? (["fixed_amount", "cart_value", "buy_x_get_y", "seasonal_campaign"].includes(formData.type) ? "06" : "05")
            : (["fixed_amount", "cart_value", "buy_x_get_y", "seasonal_campaign"].includes(formData.type) ? "05" : "04")
        }
        title="Targeting"
        description={
          formData.appliesToLeastSellingItems
            ? "Products are auto-filled from least-selling inventory. You can still add categories."
            : "Pick the products or categories this offer applies to. Either is enough."
        }
        action={
          <span className="text-[11px] text-ink/40">
            {formData.appliesToLeastSellingItems
              ? "Auto-fill enabled"
              : `${formData.productIds.length} selected`}
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
                      ? "border-gold-ink2/40 bg-gold-deep/[0.10] text-gold-ink2"
                      : "border-ink/10 bg-ink/[0.04] text-ink/60 hover:text-ink hover:border-ink/20"
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
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
              <LuxuryInput
                type="search"
                placeholder="Search products…"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="max-h-72 overflow-y-auto rounded-xl border border-ink/[0.06] bg-black/30 p-2">
              {productList.length === 0 ? (
                <p className="p-4 text-center text-xs text-ink/40">
                  Loading products…
                </p>
              ) : filteredProductList.length === 0 ? (
                <p className="p-4 text-center text-xs text-ink/40">
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
                            ? "border-gold-ink2/40 bg-gold-deep/[0.06]"
                            : "border-transparent hover:border-ink/10 hover:bg-ink/[0.03]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleProduct(p._id)}
                          className="h-3.5 w-3.5 accent-gold-deep"
                        />
                        <span className="flex-1 truncate text-ink/80">
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
                          <span className="text-[10px] text-ink/30">
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
    <div className="w-full p-4 text-ink md:p-6">
      <div className="mb-8 flex items-center justify-between border-b border-ink/[0.06] pb-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">
            Offers & Clearances
          </h1>
          <p className="mt-2 text-sm text-ink/50">
            Manage promotions and handle aging inventory.
          </p>
        </div>
        <button
          onClick={() => startCreate()}
          className="inline-flex items-center gap-2 rounded-full bg-gold-deep px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-ongold shadow-[0_4px_14px_rgba(212,175,55,0.35)] hover:bg-gold-deep transition"
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
                  ? "bg-gold-deep/[0.12] text-gold-ink2 border border-gold-ink2/30"
                  : "border border-ink/10 text-ink/50 hover:text-ink hover:bg-ink/[0.04]"
              }`}
            >
              <TabIcon className="h-3.5 w-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-gold-ink2" />
        </div>
      ) : (
        <div className="space-y-6">
          {activeTab === "active" ? (
            <div className="overflow-hidden rounded-2xl border border-ink/[0.06] bg-panel">
              <div className="border-b border-ink/[0.05] p-5">
                <h2 className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-semibold text-gold-ink2">
                  <Tag className="h-3.5 w-3.5" /> Currently Running
                </h2>
              </div>
              {offers.length === 0 ? (
                <div className="p-12 text-center text-xs uppercase tracking-[0.2em] text-ink/40">
                  No active offers.
                </div>
              ) : (
                <>
                  <div className="divide-y divide-ink/[0.05]">
                    {offersPg.pageItems.map(renderOfferRow)}
                  </div>
                  <Pagination
                    page={offersPg.page}
                    pageCount={offersPg.pageCount}
                    onPageChange={offersPg.setPage}
                    total={offersPg.total}
                    pageSize={offersPg.pageSize}
                    label="offers"
                    className="px-5 pb-5"
                  />
                </>
              )}
            </div>
          ) : null}

          {activeTab === "history" ? (
            <div className="overflow-hidden rounded-2xl border border-ink/[0.06] bg-panel">
              <div className="border-b border-ink/[0.05] p-5">
                <h2 className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-semibold text-ink/60">
                  <Clock className="h-3.5 w-3.5" /> Past & Inactive
                </h2>
              </div>
              {historyOffers.length === 0 ? (
                <div className="p-12 text-center text-xs uppercase tracking-[0.2em] text-ink/40">
                  No historical offers yet.
                </div>
              ) : (
                <>
                  <div className="divide-y divide-ink/[0.05] opacity-80">
                    {historyPg.pageItems.map(renderOfferRow)}
                  </div>
                  <Pagination
                    page={historyPg.page}
                    pageCount={historyPg.pageCount}
                    onPageChange={historyPg.setPage}
                    total={historyPg.total}
                    pageSize={historyPg.pageSize}
                    label="offers"
                    className="px-5 pb-5"
                  />
                </>
              )}
            </div>
          ) : null}

          {activeTab === "aging" ? (
            <div className="rounded-2xl border border-ink/[0.06] bg-panel p-6">
              <div className="mb-6">
                <h2 className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-semibold text-rose-300">
                  <AlertTriangle className="h-3.5 w-3.5" /> Clearance Recommendations
                </h2>
                <p className="text-sm text-ink/50">
                  Inventory unsold for 90+ days. Apply an offer to move them.
                </p>
              </div>

              {agingStock.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-ink/[0.08] p-12 text-center text-xs uppercase tracking-[0.2em] text-ink/40">
                  Inventory looks healthy. No aging stock detected.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {agingPg.pageItems.map((item) => {
                    const { discount: suggestedDiscount, fallback } =
                      computeSuggestedDiscount(item);
                    const suggestedMargin = computeMarginAfterDiscount(
                      item,
                      suggestedDiscount
                    );
                    return (
                      <div
                        key={item._id}
                        className="rounded-2xl border border-ink/[0.06] bg-black/30 p-4"
                      >
                        <h4 className="truncate text-sm font-semibold text-ink">
                          {item.name}
                        </h4>
                        <p className="mt-1 text-xs text-ink/50">
                          Stock: {item.totalStock}
                        </p>
                        <p className="mt-1 text-xs text-rose-300">
                          Idle: {item.daysUnsold ?? "90+"} days
                        </p>
                        <p className="mt-2 text-[10px] uppercase tracking-[0.15em] text-gold-ink2">
                          Suggested: {suggestedDiscount}% off
                          {fallback ? " · no cost on file" : ""}
                        </p>
                        {suggestedMargin !== null ? (
                          <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-emerald-400">
                            Margin after discount: {suggestedMargin}%
                          </p>
                        ) : (
                          <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-ink/30">
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
                          className="mt-3 text-[10px] uppercase tracking-[0.15em] text-gold-ink2 hover:underline"
                        >
                          Create Offer →
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <Pagination
                page={agingPg.page}
                pageCount={agingPg.pageCount}
                onPageChange={agingPg.setPage}
                total={agingPg.total}
                pageSize={agingPg.pageSize}
                label="products"
              />
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
