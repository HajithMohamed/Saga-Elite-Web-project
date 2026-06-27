import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import {
  Loader2,
  Plus,
  Trash2,
  Save,
  Star,
  CheckCircle2,
  MessageSquareQuote,
} from "lucide-react";
import { API_V1_URL as API_BASE } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { AdminPage } from "@/components/admin-components/AdminUI";
import { pageVariants } from "@/components/admin-components/_shared/animations";
import { PrimaryButton } from "@/components/admin-components/_shared/Buttons";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]/40";
const labelClass =
  "mb-1.5 block font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500";

const blankDraft = () => ({
  name: "",
  handle: "",
  avatar: "",
  rating: 5,
  text: "",
  verified: true,
  isActive: true,
  displayOrder: 0,
});

const TestimonialsManager = () => {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyIdx, setBusyIdx] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/testimonials/admin`, {
        withCredentials: true,
      });
      setItems(res.data?.data || []);
    } catch (err) {
      toast({
        title: "Could not load testimonials",
        description: err?.response?.data?.message || err?.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const setField = (idx, field, val) =>
    setItems((curr) =>
      curr.map((it, i) => (i === idx ? { ...it, [field]: val } : it))
    );

  const replaceItem = (idx, data) =>
    setItems((curr) => curr.map((it, i) => (i === idx ? data : it)));

  const addDraft = () => setItems((curr) => [...curr, blankDraft()]);

  const saveCard = async (idx) => {
    const item = items[idx];
    if (!item.name?.trim() || !item.text?.trim()) {
      toast({ title: "Name and text are required", variant: "destructive" });
      return;
    }
    setBusyIdx(idx);
    const payload = {
      name: item.name,
      handle: item.handle,
      avatar: item.avatar,
      rating: Number(item.rating) || 5,
      text: item.text,
      verified: !!item.verified,
      isActive: item.isActive !== false,
      displayOrder: Number(item.displayOrder) || 0,
    };
    try {
      const res = item._id
        ? await axios.patch(
            `${API_BASE}/testimonials/admin/${item._id}`,
            payload,
            { withCredentials: true }
          )
        : await axios.post(`${API_BASE}/testimonials/admin`, payload, {
            withCredentials: true,
          });
      replaceItem(idx, res.data?.data || { ...item, ...payload });
      toast({ title: "Testimonial saved", variant: "success" });
    } catch (err) {
      toast({
        title: "Save failed",
        description: err?.response?.data?.message || err?.message,
        variant: "destructive",
      });
    } finally {
      setBusyIdx(null);
    }
  };

  const deleteCard = async (idx) => {
    const item = items[idx];
    if (!item._id) {
      // Unsaved draft — just drop it.
      setItems((curr) => curr.filter((_, i) => i !== idx));
      return;
    }
    if (!window.confirm(`Delete the testimonial from "${item.name}"?`)) return;
    setBusyIdx(idx);
    try {
      await axios.delete(`${API_BASE}/testimonials/admin/${item._id}`, {
        withCredentials: true,
      });
      setItems((curr) => curr.filter((_, i) => i !== idx));
      toast({ title: "Testimonial deleted", variant: "success" });
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err?.response?.data?.message || err?.message,
        variant: "destructive",
      });
    } finally {
      setBusyIdx(null);
    }
  };

  if (loading) {
    return (
      <AdminPage eyebrow="Content" title="Testimonials">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        </div>
      </AdminPage>
    );
  }

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="w-full">
      <AdminPage
        eyebrow="Content"
        title="Testimonials"
        description="Manage the customer quotes in the homepage 'What members say' carousel. Inactive items are hidden; if none are active, the homepage shows the built-in defaults."
        actions={
          <PrimaryButton
            type="button"
            onClick={addDraft}
            className="inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Add testimonial
          </PrimaryButton>
        }
      >
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-[#0d0d0d] px-6 py-16 text-center">
            <MessageSquareQuote className="mx-auto mb-3 h-8 w-8 text-[#4d4635]" />
            <p className="text-sm text-gray-400">No testimonials yet.</p>
            <p className="mt-1 text-xs text-gray-600">
              The homepage shows the built-in defaults until you add some. Run{" "}
              <span className="font-mono">npm run seed:testimonials</span> to
              import the current ones.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, idx) => {
              const busy = busyIdx === idx;
              return (
                <section
                  key={item._id || `draft-${idx}`}
                  className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-6"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.22em] text-gray-500">
                      <MessageSquareQuote className="h-4 w-4 text-[#D4AF37]" />
                      {item._id ? `#${idx + 1}` : "Draft (unsaved)"}
                      {item.isActive === false ? (
                        <span className="rounded-sm border border-white/10 px-1.5 py-0.5 text-[9px] text-gray-500">
                          Inactive
                        </span>
                      ) : null}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => saveCard(idx)}
                        disabled={busy}
                        className="inline-flex items-center gap-1 rounded-md border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-2.5 py-1.5 text-xs uppercase tracking-[0.18em] text-[#D4AF37] transition hover:bg-[#D4AF37]/20 disabled:opacity-50"
                      >
                        {busy ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Save className="h-3.5 w-3.5" />
                        )}
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCard(idx)}
                        disabled={busy}
                        className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2.5 py-1.5 text-xs uppercase tracking-[0.18em] text-rose-300 transition hover:border-rose-400/40 hover:bg-rose-400/10 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <img
                      src={item.avatar || "/placeholder.jpg"}
                      alt={item.name || "avatar"}
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.jpg";
                      }}
                      className="h-12 w-12 shrink-0 rounded-full border border-white/10 object-cover"
                    />
                    <div className="grid flex-1 gap-3 md:grid-cols-2">
                      <div>
                        <label className={labelClass}>Name *</label>
                        <input
                          value={item.name || ""}
                          onChange={(e) => setField(idx, "name", e.target.value.slice(0, 120))}
                          placeholder="Nadeesha P."
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Handle</label>
                        <input
                          value={item.handle || ""}
                          onChange={(e) => setField(idx, "handle", e.target.value.slice(0, 60))}
                          placeholder="@nadeesha.p"
                          className={inputClass}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelClass}>Avatar URL</label>
                        <input
                          value={item.avatar || ""}
                          onChange={(e) => setField(idx, "avatar", e.target.value)}
                          placeholder="https://…"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className={labelClass}>Quote *</label>
                    <textarea
                      rows={3}
                      value={item.text || ""}
                      onChange={(e) => setField(idx, "text", e.target.value.slice(0, 600))}
                      placeholder="What the customer said…"
                      className={inputClass}
                    />
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-gray-600">
                      {(item.text || "").length} / 600
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap items-end gap-6">
                    <div>
                      <label className={labelClass}>Rating</label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setField(idx, "rating", n)}
                            aria-label={`${n} star${n > 1 ? "s" : ""}`}
                          >
                            <Star
                              className="h-5 w-5"
                              fill={n <= (item.rating || 0) ? "#f2ca50" : "none"}
                              stroke={n <= (item.rating || 0) ? "#f2ca50" : "#4d4635"}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Order</label>
                      <input
                        type="number"
                        value={item.displayOrder ?? 0}
                        onChange={(e) => setField(idx, "displayOrder", e.target.value)}
                        className={`${inputClass} w-24`}
                      />
                    </div>
                    <label className="flex cursor-pointer items-center gap-2 pb-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        checked={item.verified !== false}
                        onChange={(e) => setField(idx, "verified", e.target.checked)}
                        className="accent-[#D4AF37]"
                      />
                      <span className="inline-flex items-center gap-1">
                        Verified <CheckCircle2 className="h-3.5 w-3.5 text-[#D4AF37]" />
                      </span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 pb-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        checked={item.isActive !== false}
                        onChange={(e) => setField(idx, "isActive", e.target.checked)}
                        className="accent-[#D4AF37]"
                      />
                      Active
                    </label>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </AdminPage>
    </motion.div>
  );
};

export default TestimonialsManager;
