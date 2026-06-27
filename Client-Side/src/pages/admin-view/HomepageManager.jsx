import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import {
  Loader2,
  Save,
  Plus,
  Trash2,
  Quote,
  LayoutGrid,
  BarChart3,
  Flame,
  Diamond,
  Gift,
  Truck,
  ShieldCheck,
  Sparkles,
  Crown,
  Award,
  Zap,
  Star,
  Lock,
} from "lucide-react";
import { API_V1_URL as API_BASE } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { invalidateShopAbout } from "@/hooks/use-shop-about";
import { AdminPage } from "@/components/admin-components/AdminUI";
import { pageVariants } from "@/components/admin-components/_shared/animations";
import {
  PrimaryButton,
  SecondaryButton,
} from "@/components/admin-components/_shared/Buttons";

// Keep in sync with FEATURE_ICONS in components/landing/LandingSections.jsx
const ICONS = {
  Flame,
  Diamond,
  Gift,
  Truck,
  ShieldCheck,
  Sparkles,
  Crown,
  Award,
  Zap,
  Star,
  Lock,
};
const ICON_NAMES = Object.keys(ICONS);

const KEYS = ["homepage_sections", "brand_features", "site_stats"];

const DEFAULTS = {
  homepage_sections: {
    manifesto: { heading: "", highlight: "", body: "", tag: "" },
    whyChoose: { eyebrow: "", headline: "" },
  },
  brand_features: [],
  site_stats: [],
};

const inputClass =
  "w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]/40";
const labelClass =
  "mb-1.5 block font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500";
const cardClass = "rounded-2xl border border-white/10 bg-[#0d0d0d] p-6";

const ensureArray = (v) => (Array.isArray(v) ? v : []);

const HomepageManager = () => {
  const { toast } = useToast();
  const [values, setValues] = useState(DEFAULTS);
  const [original, setOriginal] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/site-config/about`);
      const data = res.data?.data || {};
      const merged = {
        homepage_sections: {
          manifesto: {
            ...DEFAULTS.homepage_sections.manifesto,
            ...(data.homepage_sections?.manifesto || {}),
          },
          whyChoose: {
            ...DEFAULTS.homepage_sections.whyChoose,
            ...(data.homepage_sections?.whyChoose || {}),
          },
        },
        brand_features: ensureArray(data.brand_features),
        site_stats: ensureArray(data.site_stats),
      };
      setValues(merged);
      setOriginal(merged);
    } catch (err) {
      toast({
        title: "Could not load homepage content",
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

  const dirtyKeys = useMemo(
    () =>
      KEYS.filter(
        (k) => JSON.stringify(values[k]) !== JSON.stringify(original[k])
      ),
    [values, original]
  );

  const save = async () => {
    if (dirtyKeys.length === 0) {
      toast({ title: "Nothing to save", description: "No changes detected." });
      return;
    }
    setSaving(true);
    try {
      await Promise.all(
        dirtyKeys.map((k) =>
          axios.put(
            `${API_BASE}/site-config/${k}`,
            { value: values[k], label: k },
            { withCredentials: true }
          )
        )
      );
      toast({ title: "Homepage updated", variant: "success" });
      invalidateShopAbout();
      await load();
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

  // ── Manifesto / section-heading helpers ──────────────────────────────────
  const setManifesto = (field, val) =>
    setValues((c) => ({
      ...c,
      homepage_sections: {
        ...c.homepage_sections,
        manifesto: { ...c.homepage_sections.manifesto, [field]: val },
      },
    }));
  const setWhyChoose = (field, val) =>
    setValues((c) => ({
      ...c,
      homepage_sections: {
        ...c.homepage_sections,
        whyChoose: { ...c.homepage_sections.whyChoose, [field]: val },
      },
    }));

  // ── Array helpers ────────────────────────────────────────────────────────
  const updateRow = (key, idx, patch) =>
    setValues((c) => ({
      ...c,
      [key]: c[key].map((r, i) => (i === idx ? { ...r, ...patch } : r)),
    }));
  const removeRow = (key, idx) =>
    setValues((c) => ({ ...c, [key]: c[key].filter((_, i) => i !== idx) }));
  const addFeature = () =>
    setValues((c) => ({
      ...c,
      brand_features: [
        ...c.brand_features,
        { icon: "Flame", title: "", description: "" },
      ],
    }));
  const addStat = () =>
    setValues((c) => ({
      ...c,
      site_stats: [...c.site_stats, { value: "", label: "" }],
    }));

  const manifesto = values.homepage_sections.manifesto;
  const whyChoose = values.homepage_sections.whyChoose;

  if (loading) {
    return (
      <AdminPage eyebrow="Content" title="Homepage">
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
        title="Homepage"
        description="Edit the homepage editorial content — brand manifesto, the 'Why Saga Elite' feature cards, and the brand stat lines shown in the footer. Empty fields fall back to the built-in defaults."
        actions={
          <PrimaryButton
            type="button"
            onClick={save}
            disabled={saving || dirtyKeys.length === 0}
            className="inline-flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save homepage
            {dirtyKeys.length > 0 ? (
              <span className="rounded-full bg-black/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em]">
                {dirtyKeys.length}
              </span>
            ) : null}
          </PrimaryButton>
        }
      >
        <div className="space-y-6">
          {/* Brand manifesto */}
          <section className={cardClass}>
            <header className="mb-4 flex items-center gap-2">
              <Quote className="h-4 w-4 text-[#D4AF37]" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-white">
                Brand manifesto
              </h2>
            </header>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Heading</label>
                <input
                  value={manifesto.heading}
                  onChange={(e) => setManifesto("heading", e.target.value)}
                  placeholder="Built for the"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Highlight (gold italic)</label>
                <input
                  value={manifesto.highlight}
                  onChange={(e) => setManifesto("highlight", e.target.value)}
                  placeholder="rare few."
                  className={inputClass}
                />
              </div>
            </div>
            <div className="mt-4">
              <label className={labelClass}>Body</label>
              <textarea
                rows={3}
                value={manifesto.body}
                onChange={(e) => setManifesto("body", e.target.value)}
                placeholder="Every drop is intentionally limited. No mass production…"
                className={inputClass}
              />
            </div>
            <div className="mt-4">
              <label className={labelClass}>Accent tag</label>
              <input
                value={manifesto.tag}
                onChange={(e) => setManifesto("tag", e.target.value)}
                placeholder="This is not fast fashion"
                className={inputClass}
              />
            </div>
          </section>

          {/* Why Saga Elite — feature cards */}
          <section className={cardClass}>
            <header className="mb-4 flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-[#D4AF37]" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-white">
                Why Saga Elite
              </h2>
            </header>
            <div className="mb-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Section eyebrow</label>
                <input
                  value={whyChoose.eyebrow}
                  onChange={(e) => setWhyChoose("eyebrow", e.target.value)}
                  placeholder="Why Saga Elite"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Section headline</label>
                <input
                  value={whyChoose.headline}
                  onChange={(e) => setWhyChoose("headline", e.target.value)}
                  placeholder="Built for those who notice"
                  className={inputClass}
                />
              </div>
            </div>

            <label className={labelClass}>Feature cards</label>
            {values.brand_features.length === 0 ? (
              <p className="mb-3 rounded-lg border border-dashed border-white/10 bg-black/30 px-4 py-6 text-center text-xs text-gray-500">
                No cards configured — the homepage shows the 5 built-in defaults.
                Add cards to override them.
              </p>
            ) : null}
            <div className="space-y-3">
              {values.brand_features.map((row, idx) => {
                const Icon = ICONS[row.icon] || Flame;
                return (
                  <div
                    key={idx}
                    className="rounded-lg border border-white/10 bg-black/30 p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.22em] text-gray-500">
                        <Icon className="h-4 w-4 text-[#D4AF37]" /> Card #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeRow("brand_features", idx)}
                        className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-rose-300 transition hover:border-rose-400/40 hover:bg-rose-400/10"
                      >
                        <Trash2 className="h-3 w-3" /> Remove
                      </button>
                    </div>
                    <div className="grid gap-2 md:grid-cols-[140px_1fr]">
                      <select
                        value={row.icon || "Flame"}
                        onChange={(e) =>
                          updateRow("brand_features", idx, { icon: e.target.value })
                        }
                        className={inputClass}
                      >
                        {ICON_NAMES.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                      <input
                        value={row.title || ""}
                        onChange={(e) =>
                          updateRow("brand_features", idx, {
                            title: e.target.value.slice(0, 40),
                          })
                        }
                        placeholder="Title (e.g. Limited Drops)"
                        className={inputClass}
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={row.description || ""}
                      onChange={(e) =>
                        updateRow("brand_features", idx, {
                          description: e.target.value.slice(0, 160),
                        })
                      }
                      placeholder="Short description"
                      className={`${inputClass} mt-2`}
                    />
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={addFeature}
              className="mt-3 inline-flex items-center gap-2 rounded-md border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-[#D4AF37] transition hover:bg-[#D4AF37]/20"
            >
              <Plus className="h-3.5 w-3.5" /> Add card
            </button>
          </section>

          {/* Brand stats */}
          <section className={cardClass}>
            <header className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#D4AF37]" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-white">
                Brand stats
              </h2>
            </header>
            <p className="mb-3 text-xs text-gray-500">
              Shown in the footer brand column. Leave empty to use the built-in
              defaults.
            </p>
            <div className="space-y-3">
              {values.site_stats.map((row, idx) => (
                <div
                  key={idx}
                  className="grid items-center gap-2 md:grid-cols-[140px_1fr_auto]"
                >
                  <input
                    value={row.value || ""}
                    onChange={(e) =>
                      updateRow("site_stats", idx, {
                        value: e.target.value.slice(0, 16),
                      })
                    }
                    placeholder="Value (12K+)"
                    className={inputClass}
                  />
                  <input
                    value={row.label || ""}
                    onChange={(e) =>
                      updateRow("site_stats", idx, {
                        label: e.target.value.slice(0, 40),
                      })
                    }
                    placeholder="Label (Elite Members)"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => removeRow("site_stats", idx)}
                    className="inline-flex items-center justify-center gap-1 rounded-md border border-white/10 px-2 py-2 text-[10px] uppercase tracking-[0.18em] text-rose-300 transition hover:border-rose-400/40 hover:bg-rose-400/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addStat}
              className="mt-3 inline-flex items-center gap-2 rounded-md border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-[#D4AF37] transition hover:bg-[#D4AF37]/20"
            >
              <Plus className="h-3.5 w-3.5" /> Add stat
            </button>
          </section>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <SecondaryButton
            type="button"
            onClick={() => setValues(original)}
            disabled={dirtyKeys.length === 0 || saving}
          >
            Discard changes
          </SecondaryButton>
        </div>
      </AdminPage>
    </motion.div>
  );
};

export default HomepageManager;
