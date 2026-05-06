import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Loader2, Search } from "lucide-react";
import { AdminPage, AdminPanel } from "@/components/admin-components/AdminUI";
import { pageVariants } from "@/components/admin-components/_shared/animations";
import { PrimaryButton } from "@/components/admin-components/_shared/Buttons";
import { useToast } from "@/hooks/use-toast";
import { API_V1_URL } from "@/lib/api";

const emptyForm = {
  name: "",
  drop: "global",
  isActive: true,
  condition: "always",
  minOrderValue: 0,
  description: "",
  internalNotes: "",
  imageUrl: "",
};

const money = (value = 0) =>
  Number(value || 0).toLocaleString("en-LK", { maximumFractionDigits: 0 });

const GiftManager = () => {
  const { toast } = useToast();
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
        title: "Unable to load gifts",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDrops();
    fetchGifts();
  }, [fetchDrops, fetchGifts]);

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
      condition: gift.condition || "always",
      minOrderValue: gift.minOrderValue || 0,
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
      toast({ title: "Validation error", description: "Gift name is required.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        drop: form.drop === "global" ? null : form.drop,
        minOrderValue: Number(form.minOrderValue || 0),
      };

      if (editingGift) {
        await axios.patch(`${API_V1_URL}/gifts/${editingGift._id}`, payload, { withCredentials: true });
      } else {
        await axios.post(`${API_V1_URL}/gifts`, payload, { withCredentials: true });
      }

      toast({
        title: editingGift ? "Gift updated" : "Gift created",
        description: "Gift settings saved successfully.",
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
      toast({ title: "Gift deactivated", description: `${gift.name} is no longer active.`, variant: "success" });
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
        eyebrow="Gifts"
        title="Surprise gift manager"
        description="Create global or drop-specific gifts, then inspect which orders received them."
        actions={
          <>
            <PrimaryButton onClick={fetchGifts}>Refresh</PrimaryButton>
            <PrimaryButton onClick={openCreate}>New gift</PrimaryButton>
          </>
        }
      >
        <AdminPanel title="Gift catalog" description="Manage the mystery item attached to each checkout.">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative max-w-xl flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search gifts, drops, or conditions"
                className="w-full rounded-2xl border border-white/10 bg-black/40 py-3 pl-11 pr-4 text-sm text-white outline-none transition focus:border-[#D4AF37]/40"
              />
            </div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
              {filteredGifts.length} gift{filteredGifts.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10">
            <div className="grid grid-cols-[1.4fr_1fr_1fr_.8fr_.8fr_auto] gap-4 border-b border-white/10 bg-white/[0.02] px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-gray-500">
              <span>Name</span>
              <span>Scope</span>
              <span>Condition</span>
              <span>Status</span>
              <span>Orders</span>
              <span>Actions</span>
            </div>

            <div className="divide-y divide-white/10">
              {loading ? (
                <div className="flex items-center justify-center p-10 text-gray-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : filteredGifts.length === 0 ? (
                <div className="p-10 text-center text-sm text-gray-400">No gifts found.</div>
              ) : (
                filteredGifts.map((gift) => (
                  <div key={gift._id} className="grid grid-cols-[1.4fr_1fr_1fr_.8fr_.8fr_auto] gap-4 px-4 py-4 text-sm text-white">
                    <div>
                      <p className="font-semibold">{gift.name}</p>
                      <p className="mt-1 line-clamp-1 text-xs text-gray-500">{gift.description || "No description"}</p>
                    </div>
                    <div className="text-gray-300">{gift.drop?.name || "Global"}</div>
                    <div className="text-gray-300">
                      {gift.condition}
                      {gift.condition === "min_order_value" ? ` · LKR ${money(gift.minOrderValue)}` : ""}
                    </div>
                    <div>
                      <span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.2em] ${gift.isActive ? "bg-emerald-500/10 text-emerald-300" : "bg-gray-500/10 text-gray-400"}`}>
                        {gift.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="text-gray-300">{gift.orderCount || 0}</div>
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => loadGiftOrders(gift)}
                        className="rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-300 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
                      >
                        View orders
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(gift)}
                        className="rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-300 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={!gift.isActive}
                        onClick={() => setInactive(gift)}
                        className="rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-300 transition hover:border-rose-500/40 hover:text-rose-300 disabled:opacity-40"
                      >
                        Deactivate
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </AdminPanel>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
          <AdminPanel title={selectedGift ? `${selectedGift.name} orders` : "Gift orders"} description="Orders that received the currently selected gift.">
            {!selectedGift ? (
              <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm text-gray-500">
                Select a gift to inspect its orders.
              </div>
            ) : ordersLoading ? (
              <div className="flex min-h-[220px] items-center justify-center text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : selectedOrders.length === 0 ? (
              <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm text-gray-500">
                No orders have received this gift yet.
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

          <AdminPanel title={editingGift ? "Edit gift" : "Create gift"} description="Assign a drop or leave it global.">
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
                <PrimaryButton type="submit" disabled={saving}>{saving ? "Saving..." : editingGift ? "Update gift" : "Create gift"}</PrimaryButton>
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

      </AdminPage>
    </motion.div>
  );
};

export default GiftManager;