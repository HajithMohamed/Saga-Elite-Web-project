import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Loader2,
  Search,
  Gift as GiftIcon,
  Award,
  Save,
  Star,
} from "lucide-react";
import { AdminPage, AdminPanel } from "@/components/admin-components/AdminUI";
import { pageVariants } from "@/components/admin-components/_shared/animations";
import { PrimaryButton } from "@/components/admin-components/_shared/Buttons";
import { useToast } from "@/hooks/use-toast";
import { API_V1_URL } from "@/lib/api";

const emptyForm = {
  name: "",
  drop: "global",
  isActive: true,
  probability: 100,
  condition: "always",
  minOrderValue: 0,
  rarity: "common",
  description: "",
  internalNotes: "",
  imageUrl: "",
};

const RARITY_TIERS = [
  {
    key: "common",
    label: "Common",
    description: "Stickers, low-value tokens",
    border: "border-gray-500/40",
    glow: "shadow-[0_0_24px_rgba(156,163,175,0.18)]",
    text: "text-gray-300",
    chip: "bg-gray-500/10 text-gray-300 border-gray-500/30",
  },
  {
    key: "rare",
    label: "Rare",
    description: "Wristbands, branded merch",
    border: "border-sky-400/40",
    glow: "shadow-[0_0_24px_rgba(56,189,248,0.22)]",
    text: "text-sky-300",
    chip: "bg-sky-500/10 text-sky-300 border-sky-500/30",
  },
  {
    key: "epic",
    label: "Epic",
    description: "Metallic cards, premium items",
    border: "border-violet-400/40",
    glow: "shadow-[0_0_28px_rgba(167,139,250,0.28)]",
    text: "text-violet-300",
    chip: "bg-violet-500/10 text-violet-300 border-violet-500/30",
  },
  {
    key: "legendary",
    label: "Legendary",
    description: "Ultra-limited collectibles",
    border: "border-[#f2ca50]/60",
    glow: "shadow-[0_0_36px_rgba(242,202,80,0.35)]",
    text: "text-[#f2ca50]",
    chip: "bg-[#f2ca50]/10 text-[#f2ca50] border-[#f2ca50]/40",
  },
];

const rarityTier = (key) =>
  RARITY_TIERS.find((tier) => tier.key === key) || RARITY_TIERS[0];

const money = (value = 0) =>
  Number(value || 0).toLocaleString("en-LK", { maximumFractionDigits: 0 });

const GiftManager = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("gifts");
  const [gifts, setGifts] = useState([]);
  const [drops, setDrops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [editingGift, setEditingGift] = useState(null);
  const [selectedGift, setSelectedGift] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [analytics, setAnalytics] = useState(null);

  const fetchDrops = useCallback(async () => {
    try {
      const res = await axios.get(`${API_V1_URL}/drops/get-all-drops`, { withCredentials: true });
      setDrops(res.data?.drops || []);
    } catch {
      setDrops([]);
    }
  }, []);

  const fetchGifts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_V1_URL}/gifts`, { withCredentials: true });
      setGifts(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (error) {
      toast({
        title: "Unable to load collectibles",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await axios.get(`${API_V1_URL}/gifts/analytics`, {
        withCredentials: true,
      });
      setAnalytics(res.data?.data || null);
    } catch {
      setAnalytics(null);
    }
  }, []);

  useEffect(() => {
    fetchDrops();
    fetchGifts();
    fetchAnalytics();
  }, [fetchDrops, fetchGifts, fetchAnalytics]);

  const filteredGifts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return gifts;
    return gifts.filter((gift) => {
      const dropName = gift.drop?.name || "global";
      return [gift.name, gift.description, dropName, gift.condition]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [gifts, search]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingGift(null);
  };

  const openCreate = () => {
    setEditingGift(null);
    setForm(emptyForm);
  };

  const openEdit = (gift) => {
    setEditingGift(gift);
    setForm({
      name: gift.name || "",
      drop: gift.drop?._id || gift.drop || "global",
      isActive: gift.isActive !== false,
      probability: gift.probability ?? 100,
      condition: gift.condition || "always",
      minOrderValue: gift.minOrderValue || 0,
      rarity: gift.rarity || "common",
      description: gift.description || "",
      internalNotes: gift.internalNotes || "",
      imageUrl: gift.imageUrl || "",
    });
  };

  const loadGiftOrders = useCallback(async (gift) => {
    setSelectedGift(gift);
    setOrdersLoading(true);
    try {
      const res = await axios.get(`${API_V1_URL}/gifts/${gift._id}/orders`, { withCredentials: true });
      setSelectedGift(res.data?.data?.gift || gift);
      setSelectedOrders(res.data?.data?.orders || []);
    } catch (error) {
      toast({
        title: "Unable to load orders",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      });
      setSelectedOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, [toast]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast({ title: "Validation error", description: "Collectible name is required.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        drop: form.drop === "global" ? null : form.drop,
        probability: Math.max(0, Math.min(100, Number(form.probability ?? 100))),
        minOrderValue: Number(form.minOrderValue || 0),
      };

      if (editingGift) {
        await axios.patch(`${API_V1_URL}/gifts/${editingGift._id}`, payload, { withCredentials: true });
      } else {
        await axios.post(`${API_V1_URL}/gifts`, payload, { withCredentials: true });
      }

      toast({
        title: editingGift ? "Collectible updated" : "Collectible created",
        description: "Collectible settings saved successfully.",
        variant: "success",
      });

      resetForm();
      fetchGifts();
    } catch (error) {
      toast({
        title: "Save failed",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const setInactive = async (gift) => {
    try {
      await axios.patch(`${API_V1_URL}/gifts/${gift._id}`, { isActive: false }, { withCredentials: true });
      toast({ title: "Collectible deactivated", description: `${gift.name} is no longer active.`, variant: "success" });
      fetchGifts();
      if (selectedGift?._id === gift._id) {
        setSelectedGift(null);
        setSelectedOrders([]);
      }
    } catch (error) {
      toast({
        title: "Deactivate failed",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="w-full min-h-0">
      <AdminPage
        eyebrow="Mystery Collectibles & Rewards"
        title="Mystery collectibles vault"
        description="Rarity-tiered surprise items attached to orders, plus review-reward campaigns."
        actions={
          activeTab === "gifts" ? (
            <>
              <PrimaryButton onClick={() => { fetchGifts(); fetchAnalytics(); }}>Refresh</PrimaryButton>
              <PrimaryButton onClick={openCreate}>New collectible</PrimaryButton>
            </>
          ) : null
        }
      >
        <div className="mb-6 flex flex-wrap gap-2 border-b border-white/10 pb-3">
          {[
            { key: "gifts", label: "Collectibles", icon: GiftIcon },
            { key: "rewards", label: "Rewards", icon: Award },
          ].map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors ${
                  isActive
                    ? "bg-[#D4AF37] text-black"
                    : "border border-white/10 text-gray-300 hover:border-[#D4AF37]/40 hover:text-white"
                }`}
              >
                <TabIcon className="h-4 w-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "rewards" ? (
          <RewardsPanel toast={toast} />
        ) : null}

        <div className={activeTab === "gifts" ? "" : "hidden"}>
        {analytics ? (
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-[#0e0e0e] p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-gray-500">
                Collectibles attached
              </p>
              <p className="mt-2 text-2xl font-bold text-white">
                {analytics.totalAttached || 0}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0e0e0e] p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-gray-500">
                Revealed
              </p>
              <p className="mt-2 text-2xl font-bold text-emerald-400">
                {analytics.totalRevealed || 0}
              </p>
              <p className="mt-1 text-[10px] text-gray-500">
                {Math.round((analytics.revealRate || 0) * 100)}% reveal rate
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0e0e0e] p-4 md:col-span-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-gray-500">
                Most common collectible
              </p>
              {analytics.mostCommon ? (
                <>
                  <p className="mt-2 truncate text-lg font-bold text-[#D4AF37]">
                    {analytics.mostCommon.name || "Unknown collectible"}
                  </p>
                  <p className="mt-1 text-[10px] text-gray-500">
                    Attached to {analytics.mostCommon.count} order
                    {analytics.mostCommon.count === 1 ? "" : "s"}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-gray-500">No collectibles attached yet.</p>
              )}
            </div>
          </div>
        ) : null}

        <AdminPanel title="Collectible catalog" description="Rarity-tiered mystery items attached to checkout. Hover a card to inspect.">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative max-w-xl flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search collectibles, drops, or conditions"
                className="w-full rounded-2xl border border-white/10 bg-black/40 py-3 pl-11 pr-4 text-sm text-white outline-none transition focus:border-[#D4AF37]/40"
              />
            </div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
              {filteredGifts.length} collectible{filteredGifts.length === 1 ? "" : "s"}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center rounded-2xl border border-white/10 p-12 text-gray-400">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : filteredGifts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center text-sm text-gray-400">
              No collectibles found. Create your first mystery drop reward.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredGifts.map((gift) => {
                const tier = rarityTier(gift.rarity);
                return (
                  <motion.div
                    key={gift._id}
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.2 }}
                    className={`group relative overflow-hidden rounded-2xl border ${tier.border} bg-[#0e0e0e] ${
                      gift.isActive ? tier.glow : "opacity-70"
                    }`}
                  >
                    <div className="relative aspect-square w-full overflow-hidden bg-black/40">
                      {gift.imageUrl ? (
                        <img
                          src={gift.imageUrl}
                          alt={gift.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <GiftIcon className={`h-20 w-20 ${tier.text} opacity-60`} />
                        </div>
                      )}
                      <span
                        className={`absolute right-3 top-3 rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.24em] ${tier.chip}`}
                      >
                        {tier.label}
                      </span>
                      {!gift.isActive ? (
                        <span className="absolute left-3 top-3 rounded-full border border-gray-500/40 bg-black/70 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.24em] text-gray-300">
                          Inactive
                        </span>
                      ) : null}
                    </div>

                    <div className="space-y-3 p-4">
                      <div>
                        <p className="truncate text-base font-bold text-white">{gift.name}</p>
                        <p className="mt-1 line-clamp-2 min-h-[32px] text-xs text-gray-500">
                          {gift.description || "No description"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em]">
                        <span className="rounded-full border border-white/10 bg-black/40 px-2 py-1 text-gray-400">
                          {gift.drop?.name || "Global"}
                        </span>
                        <span className="rounded-full border border-white/10 bg-black/40 px-2 py-1 text-gray-400">
                          {gift.condition === "min_order_value"
                            ? `Min LKR ${money(gift.minOrderValue)}`
                            : gift.condition.replace(/_/g, " ")}
                        </span>
                        <span className="rounded-full border border-white/10 bg-black/40 px-2 py-1 text-gray-400">
                          {gift.orderCount || 0} orders
                        </span>
                        <span className="rounded-full border border-white/10 bg-black/40 px-2 py-1 text-gray-400">
                          weight {gift.probability ?? 100}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => loadGiftOrders(gift)}
                          className="rounded-lg border border-white/10 px-2 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-gray-300 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(gift)}
                          className="rounded-lg border border-white/10 px-2 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-gray-300 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={!gift.isActive}
                          onClick={() => setInactive(gift)}
                          className="rounded-lg border border-white/10 px-2 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-gray-300 transition hover:border-rose-500/40 hover:text-rose-300 disabled:opacity-40"
                        >
                          Hide
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AdminPanel>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
          <AdminPanel title={selectedGift ? `${selectedGift.name} orders` : "Collectible orders"} description="Orders that received the currently selected collectible.">
            {!selectedGift ? (
              <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm text-gray-500">
                Select a collectible to inspect its orders.
              </div>
            ) : ordersLoading ? (
              <div className="flex min-h-[220px] items-center justify-center text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : selectedOrders.length === 0 ? (
              <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm text-gray-500">
                No orders have received this collectible yet.
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-white/10">
                <div className="grid grid-cols-[1fr_.9fr_.8fr_.7fr] gap-4 border-b border-white/10 bg-white/[0.02] px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-gray-500">
                  <span>Order</span>
                  <span>Customer</span>
                  <span>Status</span>
                  <span>Revealed</span>
                </div>
                <div className="divide-y divide-white/10">
                  {selectedOrders.map((order) => (
                    <div key={order._id} className="grid grid-cols-[1fr_.9fr_.8fr_.7fr] gap-4 px-4 py-4 text-sm text-white">
                      <span className="font-mono text-xs text-gray-300">{String(order._id).slice(-10)}</span>
                      <span className="text-gray-300">{order.user?.email || order.guest?.email || order.guestEmail || "Unknown"}</span>
                      <span className="text-gray-300">{order.status}</span>
                      <span className="text-gray-300">{order.gift?.revealed ? "Yes" : "No"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </AdminPanel>

          <AdminPanel title={editingGift ? "Edit collectible" : "Create collectible"} description="Assign a drop or leave it global. Rarity drives the visual tier.">
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <label className="grid gap-2 text-sm text-gray-300">
                Name
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#D4AF37]/40"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm text-gray-300">
                  Scope
                  <select
                    value={form.drop}
                    onChange={(event) => setForm((current) => ({ ...current, drop: event.target.value }))}
                    className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#D4AF37]/40"
                  >
                    <option value="global">Global</option>
                    {drops.map((drop) => (
                      <option key={drop._id} value={drop._id}>{drop.name}</option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm text-gray-300">
                  Condition
                  <select
                    value={form.condition}
                    onChange={(event) => setForm((current) => ({ ...current, condition: event.target.value }))}
                    className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#D4AF37]/40"
                  >
                    <option value="always">Always</option>
                    <option value="min_order_value">Minimum order value</option>
                    <option value="per_drop">Per drop</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-2 text-sm text-gray-300">
                <span>Rarity tier</span>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {RARITY_TIERS.map((tier) => {
                    const isActive = form.rarity === tier.key;
                    return (
                      <button
                        key={tier.key}
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, rarity: tier.key }))}
                        className={`flex flex-col items-start gap-1 rounded-2xl border px-3 py-3 text-left transition ${
                          isActive
                            ? `${tier.border} bg-black/60 ${tier.glow}`
                            : "border-white/10 bg-black/40 hover:border-white/20"
                        }`}
                      >
                        <span
                          className={`font-mono text-[10px] uppercase tracking-[0.24em] ${
                            isActive ? tier.text : "text-gray-400"
                          }`}
                        >
                          {tier.label}
                        </span>
                        <span className="text-[10px] leading-tight text-gray-500">
                          {tier.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="grid gap-2 text-sm text-gray-300">
                Minimum order value
                <input
                  type="number"
                  min="0"
                  value={form.minOrderValue}
                  onChange={(event) => setForm((current) => ({ ...current, minOrderValue: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#D4AF37]/40"
                />
              </label>

              <label className="grid gap-2 text-sm text-gray-300">
                Selection weight (%)
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.probability}
                  onChange={(event) => setForm((current) => ({ ...current, probability: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#D4AF37]/40"
                />
              </label>

              <label className="grid gap-2 text-sm text-gray-300">
                Description shown after delivery
                <textarea
                  rows="3"
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#D4AF37]/40"
                />
              </label>

              <label className="grid gap-2 text-sm text-gray-300">
                Internal notes
                <textarea
                  rows="3"
                  value={form.internalNotes}
                  onChange={(event) => setForm((current) => ({ ...current, internalNotes: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#D4AF37]/40"
                />
              </label>

              <label className="grid gap-2 text-sm text-gray-300">
                Image URL
                <input
                  value={form.imageUrl}
                  onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#D4AF37]/40"
                />
              </label>

              <label className="flex items-center gap-3 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                  className="h-4 w-4 rounded border-white/20 bg-black/40"
                />
                Active
              </label>

              <div className="flex flex-wrap gap-3 pt-2">
                <PrimaryButton type="submit" disabled={saving}>{saving ? "Saving..." : editingGift ? "Update collectible" : "Create collectible"}</PrimaryButton>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full border border-white/10 px-5 py-3 text-sm text-gray-300 transition hover:border-white/20 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          </AdminPanel>
        </div>
        </div>

      </AdminPage>
    </motion.div>
  );
};

/* --------------------------------------------------------------------- */
/* RewardsPanel — Review-discount campaign config                         */
/* --------------------------------------------------------------------- */

const DEFAULT_REWARD = {
  enabled: false,
  discountType: "percent",
  discountValue: 10,
  codePrefix: "REVIEW",
  expiryDays: 30,
  maxUses: 1,
};

function RewardsPanel({ toast }) {
  const [config, setConfig] = useState(DEFAULT_REWARD);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await axios.get(
          `${API_V1_URL}/site-config/reward_review_discount`,
          { withCredentials: true }
        );
        const value = res.data?.data ?? res.data?.value;
        if (!cancelled) {
          setConfig(
            value && typeof value === "object"
              ? { ...DEFAULT_REWARD, ...value }
              : DEFAULT_REWARD
          );
        }
      } catch {
        if (!cancelled) setConfig(DEFAULT_REWARD);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await axios.put(
        `${API_V1_URL}/site-config/reward_review_discount`,
        {
          label: "Review Discount Reward",
          value: {
            enabled: !!config.enabled,
            discountType:
              config.discountType === "fixed" ? "fixed" : "percent",
            discountValue: Number(config.discountValue) || 0,
            codePrefix: String(config.codePrefix || "REVIEW")
              .toUpperCase()
              .replace(/[^A-Z0-9-]/g, "")
              .slice(0, 12),
            expiryDays: Math.max(1, Number(config.expiryDays) || 30),
            maxUses: Math.max(1, Number(config.maxUses) || 1),
          },
        },
        { withCredentials: true }
      );
      toast({
        title: config.enabled ? "Reward campaign live" : "Reward saved",
        description: config.enabled
          ? "Approved reviews will automatically issue a one-time coupon."
          : "Settings saved (campaign is currently disabled).",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Save failed",
        description: err?.response?.data?.message || err?.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPanel
        title="Review discount campaign"
        description="When enabled, every approved review issues a one-time coupon to the customer via email. Fires automatically on review approval."
      >
        <div className="grid gap-6">
          <label className="flex items-center gap-3 text-sm text-white">
            <input
              type="checkbox"
              checked={!!config.enabled}
              onChange={(e) =>
                setConfig({ ...config, enabled: e.target.checked })
              }
              className="h-4 w-4"
            />
            Campaign enabled
          </label>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-2 text-sm text-gray-300">
              Discount type
              <select
                value={config.discountType}
                onChange={(e) =>
                  setConfig({ ...config, discountType: e.target.value })
                }
                className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#D4AF37]/40"
              >
                <option value="percent">Percent (%)</option>
                <option value="fixed">Fixed (LKR)</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm text-gray-300">
              Discount value
              <input
                type="number"
                min="0"
                step="0.01"
                value={config.discountValue}
                onChange={(e) =>
                  setConfig({ ...config, discountValue: e.target.value })
                }
                className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#D4AF37]/40"
              />
            </label>
            <label className="grid gap-2 text-sm text-gray-300">
              Code prefix
              <input
                type="text"
                maxLength={12}
                value={config.codePrefix}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    codePrefix: e.target.value.toUpperCase(),
                  })
                }
                placeholder="REVIEW"
                className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-white outline-none focus:border-[#D4AF37]/40"
              />
              <span className="text-[10px] text-gray-500">
                Codes look like{" "}
                <span className="font-mono text-[#D4AF37]">
                  {config.codePrefix || "REVIEW"}-XXXX
                </span>
              </span>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-gray-300">
              Expiry (days from issue)
              <input
                type="number"
                min="1"
                value={config.expiryDays}
                onChange={(e) =>
                  setConfig({ ...config, expiryDays: e.target.value })
                }
                className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#D4AF37]/40"
              />
            </label>
            <label className="grid gap-2 text-sm text-gray-300">
              Max uses per coupon
              <input
                type="number"
                min="1"
                value={config.maxUses}
                onChange={(e) =>
                  setConfig({ ...config, maxUses: e.target.value })
                }
                className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#D4AF37]/40"
              />
            </label>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-gray-400">
            <p className="mb-1 flex items-center gap-2 text-[#D4AF37]">
              <Star className="h-3 w-3" /> How it works
            </p>
            <p>
              Each time a review is approved on the moderation page, the system
              checks this campaign. If enabled, a unique coupon is created
              (issuedFor: <span className="font-mono">review_reward</span>) and
              emailed to the customer. Each review issues one coupon, ever — the
              hook is idempotent.
            </p>
          </div>

          <div>
            <PrimaryButton
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save campaign
            </PrimaryButton>
          </div>
        </div>
      </AdminPanel>

      <AdminPanel
        title="Future reward types"
        description="Birthday & referral rewards are scaffolded for a follow-up wave."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/30 p-5 text-sm text-gray-400">
            <p className="font-bold uppercase tracking-[0.22em] text-gray-300">
              Birthday Offer
            </p>
            <p className="mt-2 text-xs">
              Auto-issues a coupon on a customer's birthday. Needs a `birthday`
              field on the User model.
            </p>
            <p className="mt-3 inline-block rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-gray-500">
              Coming soon
            </p>
          </div>
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/30 p-5 text-sm text-gray-400">
            <p className="font-bold uppercase tracking-[0.22em] text-gray-300">
              Referral Reward
            </p>
            <p className="mt-2 text-xs">
              Both referrer and referee get a coupon when the referee places
              their first delivered order.
            </p>
            <p className="mt-3 inline-block rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-gray-500">
              Coming soon
            </p>
          </div>
        </div>
      </AdminPanel>
    </div>
  );
}

export default GiftManager;
