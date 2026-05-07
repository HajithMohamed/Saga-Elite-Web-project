import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "@/hooks/use-toast";
import { API_V1_URL as API_BASE } from "@/lib/api";
import {
  Tag,
  Plus,
  Trash2,
  Copy,
  CheckCircle,
  Calendar,
  Users,
} from "lucide-react";

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
  const [activeTab, setActiveTab] = useState("list");
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

  const startCreate = () => {
    setEditingId(null);
    setFormData(initialForm);
    setActiveTab("create");
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
    setActiveTab("create");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
        // Code is immutable post-create — strip from update payload.
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
      setFormData(initialForm);
      setEditingId(null);
      setActiveTab("list");
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

  return (
    <div className="mx-auto max-w-7xl p-6 text-[#e5e2e1]">
      <div className="mb-8 flex items-center justify-between border-b border-[#2a2a2a] pb-4">
        <div>
          <h1 className="font-display text-4xl uppercase tracking-widest text-[#FAF7F2]">
            Coupons
          </h1>
          <p className="mt-2 font-sans text-sm text-[#99907c]">
            Promo codes for campaigns, VIPs, review rewards, and one-off perks.
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="flex items-center gap-2 bg-[#f2ca50] px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-[#0a0a0a] transition-colors hover:bg-[#ffe088]"
        >
          <Plus className="h-4 w-4" /> New Coupon
        </button>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="border border-[#2a2a2a] bg-[#131313] p-4">
          <p className="text-[10px] uppercase tracking-[0.26em] text-[#99907c]">
            Total coupons
          </p>
          <p className="mt-2 text-2xl font-bold text-[#e5e2e1]">
            {coupons.length}
          </p>
        </div>
        <div className="border border-[#2a2a2a] bg-[#131313] p-4">
          <p className="text-[10px] uppercase tracking-[0.26em] text-[#99907c]">
            Total redemptions
          </p>
          <p className="mt-2 text-2xl font-bold text-[#f2ca50]">
            {totalRedemptions}
          </p>
        </div>
        <div className="border border-[#2a2a2a] bg-[#131313] p-4">
          <p className="text-[10px] uppercase tracking-[0.26em] text-[#99907c]">
            Active right now
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-400">
            {coupons.filter((c) => c.isLive).length}
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        {[
          { key: "list", label: "All Coupons", icon: Tag },
          { key: "create", label: editingId ? "Editing" : "Create", icon: Plus },
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
          {coupons.length === 0 ? (
            <div className="p-12 text-center font-mono text-xs uppercase tracking-widest text-[#888]">
              No coupons yet — click "New Coupon" to issue one.
            </div>
          ) : (
            <div className="divide-y divide-[#2a2a2a]">
              {coupons.map((c) => (
                <div
                  key={c._id}
                  className="flex flex-col gap-4 p-6 hover:bg-[#1a1a1a] md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-mono text-xl font-bold tracking-[0.18em] text-[#FAF7F2]">
                        {c.code}
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleCopy(c.code)}
                        className="text-[#99907c] hover:text-[#f2ca50]"
                        title="Copy code"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <span className="rounded-full border border-[#f2ca50]/40 bg-[#f2ca50]/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-[#f2ca50]">
                        {formatDiscount(c)}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] ${
                          c.isLive
                            ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                            : c.isActive
                              ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
                              : "border-white/10 bg-white/5 text-white/60"
                        }`}
                      >
                        {c.isLive
                          ? "Live"
                          : c.isActive
                            ? "Pending / Expired"
                            : "Inactive"}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-white/70">
                        {c.issuedFor}
                      </span>
                    </div>
                    {c.description ? (
                      <p className="mt-2 text-sm text-[#99907c]">
                        {c.description}
                      </p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-4 font-mono text-[10px] uppercase tracking-widest text-[#888]">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-[#f2ca50]" />
                        {c.usedCount || 0}
                        {c.maxUses != null ? ` / ${c.maxUses}` : " / ∞"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-[#f2ca50]" />
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
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(c)}
                      className="border border-[#4d4635] px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-[#d0c5af] hover:border-[#f2ca50] hover:text-[#f2ca50]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(c._id)}
                      disabled={c.usedCount > 0}
                      className="border border-red-500/20 p-2 text-red-500 hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                      title={
                        c.usedCount > 0
                          ? "Used coupons can't be deleted — deactivate instead"
                          : "Delete"
                      }
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-sm border border-[#f2ca50]/30 bg-[#131313] p-6 md:p-8">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#f2ca50]">
              <Plus className="h-4 w-4" />{" "}
              {editingId ? "Edit Coupon" : "Create New Coupon"}
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
                  Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    disabled={!!editingId}
                    required
                    className="w-full border border-[#2a2a2a] bg-[#0a0a0a] p-3 font-mono text-sm uppercase text-[#FAF7F2] outline-none focus:border-[#f2ca50] disabled:opacity-60"
                    placeholder="REVIEW-7B2X"
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
                      className="border border-[#4d4635] px-3 text-[10px] uppercase tracking-[0.22em] text-[#d0c5af] hover:border-[#f2ca50] hover:text-[#f2ca50]"
                    >
                      Auto
                    </button>
                  ) : null}
                </div>
                {editingId ? (
                  <p className="mt-2 text-[10px] text-[#666]">
                    Codes are immutable after creation.
                  </p>
                ) : null}
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest text-[#888]">
                  Issued for
                </label>
                <select
                  value={formData.issuedFor}
                  onChange={(e) =>
                    setFormData({ ...formData, issuedFor: e.target.value })
                  }
                  className="w-full border border-[#2a2a2a] bg-[#0a0a0a] p-3 text-sm text-[#FAF7F2] outline-none focus:border-[#f2ca50]"
                >
                  {ISSUED_FOR_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
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
                  Discount type
                </label>
                <select
                  value={formData.discountType}
                  onChange={(e) =>
                    setFormData({ ...formData, discountType: e.target.value })
                  }
                  className="w-full border border-[#2a2a2a] bg-[#0a0a0a] p-3 text-sm text-[#FAF7F2] outline-none focus:border-[#f2ca50]"
                >
                  <option value="percent">Percent (%)</option>
                  <option value="fixed">Fixed (LKR)</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest text-[#888]">
                  Discount value
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.discountValue}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discountValue: e.target.value,
                    })
                  }
                  required
                  className="w-full border border-[#2a2a2a] bg-[#0a0a0a] p-3 text-sm text-[#FAF7F2] outline-none focus:border-[#f2ca50]"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest text-[#888]">
                  Min order (LKR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.minOrderValue}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minOrderValue: e.target.value,
                    })
                  }
                  className="w-full border border-[#2a2a2a] bg-[#0a0a0a] p-3 text-sm text-[#FAF7F2] outline-none focus:border-[#f2ca50]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest text-[#888]">
                  Max uses (blank = ∞)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.maxUses}
                  onChange={(e) =>
                    setFormData({ ...formData, maxUses: e.target.value })
                  }
                  className="w-full border border-[#2a2a2a] bg-[#0a0a0a] p-3 text-sm text-[#FAF7F2] outline-none focus:border-[#f2ca50]"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest text-[#888]">
                  Starts at
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
                  Ends at
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

            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest text-[#888]">
                Apply to categories (optional)
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
                    : "Issue Coupon"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
