import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { API_V1_URL as API_BASE } from "@/lib/api";
import {
  Tag,
  Plus,
  Trash2,
  Copy,
  Calendar,
  Users,
  Sparkles,
  Wand2,
} from "lucide-react";
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

const ISSUED_FOR_OPTIONS = [
  { value: "manual", label: "Manual" },
  { value: "campaign", label: "Campaign" },
  { value: "vip", label: "VIP" },
  { value: "review_reward", label: "Review reward" },
  { value: "referral", label: "Referral" },
  { value: "birthday", label: "Birthday" },
];

const initialForm = {
  code: "",
  description: "",
  discountType: "percent",
  discountValue: 10,
  minOrderValue: 0,
  maxUses: "",
  applicableCategories: [],
  startsAt: "",
  endsAt: "",
  isActive: true,
  issuedFor: "manual",
};

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
};

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("en-LK", { maximumFractionDigits: 0 });

const generateRandomCode = (prefix = "") => {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i += 1) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}${suffix}`;
};

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialForm);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await axios
        .get(`${API_BASE}/coupons/admin`, { withCredentials: true })
        .catch(() => ({ data: { data: { coupons: [] } } }));
      setCoupons(res.data?.data?.coupons || []);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load coupons",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const totalRedemptions = useMemo(
    () => coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0),
    [coupons]
  );

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(initialForm);
  };

  const startCreate = () => {
    setEditingId(null);
    setFormData(initialForm);
    setShowForm(true);
  };

  const startEdit = (coupon) => {
    setEditingId(coupon._id);
    setFormData({
      code: coupon.code || "",
      description: coupon.description || "",
      discountType: coupon.discountType || "percent",
      discountValue: coupon.discountValue ?? 0,
      minOrderValue: coupon.minOrderValue ?? 0,
      maxUses: coupon.maxUses == null ? "" : coupon.maxUses,
      applicableCategories: coupon.applicableCategories || [],
      startsAt: coupon.startsAt
        ? new Date(coupon.startsAt).toISOString().slice(0, 16)
        : "",
      endsAt: coupon.endsAt
        ? new Date(coupon.endsAt).toISOString().slice(0, 16)
        : "",
      isActive: coupon.isActive ?? true,
      issuedFor: coupon.issuedFor || "manual",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();

    if (!formData.code.trim()) {
      toast({ title: "Code required", variant: "destructive" });
      return;
    }
    if (
      formData.discountType === "percent" &&
      Number(formData.discountValue) > 100
    ) {
      toast({
        title: "Percent discount cannot exceed 100",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      code: formData.code.trim().toUpperCase(),
      description: formData.description,
      discountType: formData.discountType,
      discountValue: Number(formData.discountValue) || 0,
      minOrderValue: Number(formData.minOrderValue) || 0,
      maxUses:
        formData.maxUses === "" || formData.maxUses === null
          ? null
          : Number(formData.maxUses),
      applicableCategories: formData.applicableCategories,
      startsAt: formData.startsAt
        ? new Date(formData.startsAt).toISOString()
        : null,
      endsAt: formData.endsAt ? new Date(formData.endsAt).toISOString() : null,
      isActive: !!formData.isActive,
      issuedFor: formData.issuedFor,
    };

    try {
      setSubmitting(true);
      if (editingId) {
        const { code: _drop, ...rest } = payload;
        void _drop;
        await axios.patch(`${API_BASE}/coupons/admin/${editingId}`, rest, {
          withCredentials: true,
        });
        toast({ title: "Coupon updated" });
      } else {
        await axios.post(`${API_BASE}/coupons/admin`, payload, {
          withCredentials: true,
        });
        toast({ title: "Coupon created" });
      }
      resetForm();
      fetchCoupons();
    } catch (err) {
      toast({
        title: "Could not save coupon",
        description: err?.response?.data?.message || err?.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this coupon?")) return;
    try {
      await axios.delete(`${API_BASE}/coupons/admin/${id}`, {
        withCredentials: true,
      });
      toast({ title: "Coupon deleted" });
      fetchCoupons();
    } catch (err) {
      toast({
        title: "Could not delete",
        description: err?.response?.data?.message || err?.message,
        variant: "destructive",
      });
    }
  };

  const handleCopy = (code) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(code);
    toast({ title: `Copied ${code} to clipboard` });
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

  const formatDiscount = (c) =>
    c.discountType === "percent"
      ? `${c.discountValue}% off`
      : `LKR ${formatCurrency(c.discountValue)} off`;

  // Computed status for the right rail preview / pill.
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

  // Completion progress: code, discountValue, issuedFor are required-ish; rest are bonuses.
  const completedCount = [
    formData.code?.trim().length >= 3,
    Number(formData.discountValue) > 0,
    Boolean(formData.issuedFor),
    formData.description?.trim().length > 0,
    Boolean(formData.startsAt) || Boolean(formData.endsAt),
  ].filter(Boolean).length;
  const progressValue = completedCount / 5;

  const previewDiscount =
    formData.discountType === "percent"
      ? `${Number(formData.discountValue) || 0}%`
      : `LKR ${formatCurrency(formData.discountValue)}`;

  const couponFormPanel = (
    <AdminFormShell
      onClose={resetForm}
      header={
        <StickyActionBar
          eyebrow={editingId ? "Coupon · Editing" : "Coupon · New Issue"}
          title={formData.code?.trim() || (editingId ? "Untitled coupon" : "New Coupon")}
          subtitle={
            formData.discountValue
              ? `${previewDiscount} · ${ISSUED_FOR_OPTIONS.find((o) => o.value === formData.issuedFor)?.label || ""}`
              : "Set a discount to continue"
          }
          onCancel={resetForm}
          onPublish={handleSubmit}
          publishLabel={editingId ? "Save Changes" : "Issue Coupon"}
          isSubmitting={submitting}
        />
      }
      rightRail={
        <>
          <RightRailPanel
            tone="accent"
            title="Live Preview"
            description="The badge that customers see at checkout."
          >
            <div className="rounded-2xl border border-white/[0.06] bg-[#0F0F0F] p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-mono text-lg font-bold tracking-[0.18em] text-white">
                  {formData.code?.trim() || "YOUR-CODE"}
                </h4>
                <button
                  type="button"
                  onClick={() => handleCopy(formData.code || "")}
                  className="text-white/40 hover:text-[#D4AF37]"
                  title="Copy"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-3 inline-flex rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/[0.08] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#D4AF37]">
                {previewDiscount} off
              </div>
              <dl className="mt-4 space-y-1.5 border-t border-white/[0.05] pt-3 text-[11px]">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-white/40 uppercase tracking-wider">Status</dt>
                  <dd>
                    <StatusPill status={computedStatus} size="sm" />
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-white/40 uppercase tracking-wider">Issued for</dt>
                  <dd className="text-white/80 capitalize">
                    {formData.issuedFor.replace(/_/g, " ")}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-white/40 uppercase tracking-wider">Window</dt>
                  <dd className="text-white/80 text-right">
                    {formatDate(formData.startsAt)} → {formatDate(formData.endsAt)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-white/40 uppercase tracking-wider">Min order</dt>
                  <dd className="text-white/80 tabular-nums">
                    {Number(formData.minOrderValue) > 0
                      ? `LKR ${formatCurrency(formData.minOrderValue)}`
                      : "None"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-white/40 uppercase tracking-wider">Max uses</dt>
                  <dd className="text-white/80 tabular-nums">
                    {formData.maxUses === "" || formData.maxUses === null
                      ? "Unlimited"
                      : formData.maxUses}
                  </dd>
                </div>
              </dl>
            </div>
          </RightRailPanel>

          <RightRailPanel title="Status & Visibility">
            <RailToggleRow
              label="Active"
              helper="Inactive coupons cannot be redeemed at checkout."
              checked={formData.isActive}
              onChange={(v) => setFormData({ ...formData, isActive: v })}
            />
          </RightRailPanel>

          <RightRailPanel title="Setup Progress">
            <ProgressBar
              label="Coupon completion"
              value={progressValue}
              segments={5}
              filledCount={completedCount}
            />
            <p className="mt-2 text-[11px] leading-relaxed text-white/40">
              Required: code and discount. Add a description and validity window for
              campaign clarity.
            </p>
          </RightRailPanel>

          <RightRailPanel title="Tips">
            <ul className="space-y-2 text-[11px] leading-relaxed text-white/50">
              <li className="flex gap-2">
                <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-[#D4AF37]" />
                Codes are immutable after issue. Use the auto-generator for clean,
                unguessable codes.
              </li>
              <li className="flex gap-2">
                <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-[#D4AF37]" />
                For percent discounts, the value cannot exceed 100.
              </li>
              <li className="flex gap-2">
                <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-[#D4AF37]" />
                Limit to specific categories when running tier-only campaigns.
              </li>
            </ul>
          </RightRailPanel>
        </>
      }
    >
      <FormSection
        number="01"
        title="Code & Audience"
        description="Who is this coupon for and how should it appear at checkout?"
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField
            label="Code"
            required
            helper="Uppercase letters and numbers only. Codes are immutable after issue."
            hint={`${formData.code.length} / 40`}
          >
            <div className="flex gap-2">
              <LuxuryInput
                type="text"
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
                disabled={!!editingId}
                placeholder="REVIEW-7B2X"
                maxLength={40}
                className="font-mono uppercase"
              />
              {!editingId ? (
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      code: generateRandomCode(""),
                    }))
                  }
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/70 hover:border-[#D4AF37]/40 hover:text-[#D4AF37] transition"
                >
                  <Wand2 className="h-3.5 w-3.5" />
                  Auto
                </button>
              ) : null}
            </div>
          </FormField>

          <FormField
            label="Issued For"
            required
            helper="Categorises the coupon for reporting and audit."
          >
            <LuxurySelect
              value={formData.issuedFor}
              onChange={(e) =>
                setFormData({ ...formData, issuedFor: e.target.value })
              }
            >
              {ISSUED_FOR_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </LuxurySelect>
          </FormField>
        </div>

        <FormField
          label="Description"
          optional
          helper="Internal note. Shown to admins in the coupon ledger."
        >
          <LuxuryTextarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="What is this coupon for?"
            rows={2}
          />
        </FormField>
      </FormSection>

      <FormSection
        number="02"
        title="Discount"
        description="Choose between a percentage or fixed-amount discount."
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <FormField label="Discount Type" required>
            <LuxurySelect
              value={formData.discountType}
              onChange={(e) =>
                setFormData({ ...formData, discountType: e.target.value })
              }
            >
              <option value="percent">Percent (%)</option>
              <option value="fixed">Fixed (LKR)</option>
            </LuxurySelect>
          </FormField>

          <FormField
            label="Discount Value"
            required
            helper={
              formData.discountType === "percent"
                ? "0 to 100"
                : "Amount in LKR"
            }
          >
            <LuxuryInput
              type="number"
              min="0"
              step="0.01"
              value={formData.discountValue}
              onChange={(e) =>
                setFormData({ ...formData, discountValue: e.target.value })
              }
            />
          </FormField>

          <FormField
            label="Minimum Order"
            optional
            helper="Order must reach this value (LKR) to redeem."
          >
            <LuxuryInput
              type="number"
              min="0"
              value={formData.minOrderValue}
              onChange={(e) =>
                setFormData({ ...formData, minOrderValue: e.target.value })
              }
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection
        number="03"
        title="Validity Window"
        description="Restrict when this coupon can be redeemed and how often."
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <FormField
            label="Max Uses"
            optional
            helper="Leave blank for unlimited."
          >
            <LuxuryInput
              type="number"
              min="0"
              value={formData.maxUses}
              onChange={(e) =>
                setFormData({ ...formData, maxUses: e.target.value })
              }
              placeholder="∞"
            />
          </FormField>

          <FormField
            label="Starts At"
            optional
            helper="Coupon becomes redeemable from this time."
          >
            <LuxuryDateInput
              type="datetime-local"
              value={formData.startsAt}
              onChange={(e) =>
                setFormData({ ...formData, startsAt: e.target.value })
              }
            />
          </FormField>

          <FormField
            label="Ends At"
            optional
            helper="Coupon expires at this time."
          >
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
        title="Category Restriction"
        description="Optionally restrict this coupon to one or more categories. Leave empty to apply to all."
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
      </FormSection>
    </AdminFormShell>
  );

  return (
    <div className="mx-auto max-w-7xl p-6 text-white">
      <div className="mb-8 flex items-center justify-between border-b border-white/[0.06] pb-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Coupons
          </h1>
          <p className="mt-2 text-sm text-white/50">
            Promo codes for campaigns, VIPs, review rewards, and one-off perks.
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-[#0A0A0A] shadow-[0_4px_14px_rgba(212,175,55,0.35)] hover:bg-[#E2BD45] transition"
        >
          <Plus className="h-4 w-4" /> New Coupon
        </button>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.06] bg-[#0F0F0F] p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">
            Total coupons
          </p>
          <p className="mt-2 text-3xl font-semibold text-white tabular-nums">
            {coupons.length}
          </p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-[#0F0F0F] p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">
            Total redemptions
          </p>
          <p className="mt-2 text-3xl font-semibold text-[#D4AF37] tabular-nums">
            {totalRedemptions}
          </p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-[#0F0F0F] p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">
            Active right now
          </p>
          <p className="mt-2 text-3xl font-semibold text-emerald-400 tabular-nums">
            {coupons.filter((c) => c.isLive).length}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-[#D4AF37]" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0F0F0F]">
          {coupons.length === 0 ? (
            <div className="p-12 text-center text-xs uppercase tracking-[0.2em] text-white/40">
              <Tag className="mx-auto mb-3 h-8 w-8 text-white/20" />
              No coupons yet — click "New Coupon" to issue one.
            </div>
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {coupons.map((c) => (
                <div
                  key={c._id}
                  className="flex flex-col gap-4 p-6 hover:bg-white/[0.02] md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-mono text-lg font-bold tracking-[0.18em] text-white">
                        {c.code}
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleCopy(c.code)}
                        className="text-white/40 hover:text-[#D4AF37]"
                        title="Copy code"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <StatusPill status="published" label={formatDiscount(c)} size="sm" />
                      <StatusPill
                        status={
                          c.isLive
                            ? "active"
                            : c.isActive
                              ? "scheduled"
                              : "inactive"
                        }
                        label={
                          c.isLive
                            ? "Live"
                            : c.isActive
                              ? "Pending / Expired"
                              : "Inactive"
                        }
                        size="sm"
                      />
                      <StatusPill
                        tone="draft"
                        label={c.issuedFor}
                        size="sm"
                      />
                    </div>
                    {c.description ? (
                      <p className="mt-2 text-sm text-white/60">
                        {c.description}
                      </p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-4 text-[10px] uppercase tracking-[0.15em] text-white/40">
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3 w-3 text-[#D4AF37]" />
                        {c.usedCount || 0}
                        {c.maxUses != null ? ` / ${c.maxUses}` : " / ∞"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-[#D4AF37]" />
                        {formatDate(c.startsAt)} → {formatDate(c.endsAt)}
                      </span>
                      {c.minOrderValue ? (
                        <span>min LKR {formatCurrency(c.minOrderValue)}</span>
                      ) : null}
                      {(c.applicableCategories || []).length > 0 ? (
                        <span>{c.applicableCategories.join(" / ")}</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEdit(c)}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/80 hover:border-[#D4AF37]/40 hover:text-[#D4AF37] transition"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(c._id)}
                      disabled={c.usedCount > 0}
                      className="rounded-full border border-rose-500/20 p-2 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-40 transition"
                      title={
                        c.usedCount > 0
                          ? "Used coupons can't be deleted — deactivate instead"
                          : "Delete"
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <AnimatePresence mode="wait">
        {showForm ? couponFormPanel : null}
      </AnimatePresence>
    </div>
  );
};

export default AdminCoupons;
