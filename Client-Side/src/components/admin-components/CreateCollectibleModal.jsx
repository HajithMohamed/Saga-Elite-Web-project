import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { modalBackdropVariants, modalCardVariants } from "@/components/admin-components/_shared/animations";
import { PrimaryButton } from "@/components/admin-components/_shared/Buttons";

export const RARITY_TIERS = [
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

export const emptyGiftForm = {
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

const CreateCollectibleModal = ({
  isOpen,
  onClose,
  initialData,
  drops,
  onSubmit,
  saving,
}) => {
  const [form, setForm] = useState(emptyGiftForm);

  // Sync form state when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          name: initialData.name || "",
          drop: initialData.drop?._id || initialData.drop || "global",
          isActive: initialData.isActive !== false,
          probability: initialData.probability ?? 100,
          condition: initialData.condition || "always",
          minOrderValue: initialData.minOrderValue || 0,
          rarity: initialData.rarity || "common",
          description: initialData.description || "",
          internalNotes: initialData.internalNotes || "",
          imageUrl: initialData.imageUrl || "",
        });
      } else {
        setForm(emptyGiftForm);
      }
    }
  }, [isOpen, initialData]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          variants={modalBackdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={!saving ? onClose : undefined}
          />

          {/* Modal Card */}
          <motion.div
            className="relative flex w-full max-w-2xl max-h-[90vh] flex-col rounded-2xl border border-white/10 bg-[#0e0e0e] shadow-2xl overflow-hidden"
            variants={modalCardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {initialData ? "Edit collectible" : "Create collectible"}
                </h2>
                <p className="text-xs text-gray-500">
                  Assign a drop or leave it global. Rarity drives the visual tier.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-full p-2 text-gray-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
              <form id="collectible-form" className="grid gap-5" onSubmit={handleSubmit}>
                <label className="grid gap-2 text-sm text-gray-300">
                  Name
                  <input
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, name: event.target.value }))
                    }
                    className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#D4AF37]/40"
                    placeholder="e.g. Golden Wristband"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm text-gray-300">
                    Scope
                    <select
                      value={form.drop}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, drop: event.target.value }))
                      }
                      className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#D4AF37]/40"
                    >
                      <option value="global">Global</option>
                      {drops.map((drop) => (
                        <option key={drop._id} value={drop._id}>
                          {drop.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-2 text-sm text-gray-300">
                    Condition
                    <select
                      value={form.condition}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, condition: event.target.value }))
                      }
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
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {RARITY_TIERS.map((tier) => {
                      const isActive = form.rarity === tier.key;
                      return (
                        <button
                          key={tier.key}
                          type="button"
                          onClick={() =>
                            setForm((current) => ({ ...current, rarity: tier.key }))
                          }
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
                          <span className="text-[10px] leading-tight text-gray-500 line-clamp-2">
                            {tier.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm text-gray-300">
                    <span className="flex items-center justify-between">
                      Minimum order value
                      <span className="text-xs text-gray-500">LKR</span>
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={form.minOrderValue}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, minOrderValue: event.target.value }))
                      }
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
                      onChange={(event) =>
                        setForm((current) => ({ ...current, probability: event.target.value }))
                      }
                      className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#D4AF37]/40"
                    />
                  </label>
                </div>

                <label className="grid gap-2 text-sm text-gray-300">
                  Description shown after delivery
                  <textarea
                    rows="3"
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, description: event.target.value }))
                    }
                    className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#D4AF37]/40"
                    placeholder="This exclusive item..."
                  />
                </label>

                <label className="grid gap-2 text-sm text-gray-300">
                  Internal notes
                  <textarea
                    rows="2"
                    value={form.internalNotes}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, internalNotes: event.target.value }))
                    }
                    className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#D4AF37]/40"
                  />
                </label>

                <label className="grid gap-2 text-sm text-gray-300">
                  Image URL
                  <input
                    value={form.imageUrl}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, imageUrl: event.target.value }))
                    }
                    className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#D4AF37]/40"
                    placeholder="https://..."
                  />
                </label>

                <label className="flex items-center gap-3 text-sm text-gray-300 mt-2">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, isActive: event.target.checked }))
                    }
                    className="h-4 w-4 rounded border-white/20 bg-black/40 text-[#D4AF37] focus:ring-[#D4AF37]"
                  />
                  Active (distribute to orders)
                </label>
              </form>
            </div>

            {/* Footer */}
            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-white/10 bg-black/20 px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-full px-5 py-2.5 text-sm font-semibold text-gray-300 transition hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>
              <PrimaryButton
                type="submit"
                form="collectible-form"
                disabled={saving}
                className="inline-flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>{initialData ? "Save changes" : "Create collectible"}</>
                )}
              </PrimaryButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateCollectibleModal;
