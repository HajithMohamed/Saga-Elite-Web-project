import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import {
  FileText,
  Loader2,
  Save,
  Plus,
  Trash2,
  Link as LinkIcon,
  CreditCard,
  Copyright,
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
import ImagePicker from "@/components/admin-components/_shared/ImagePicker";

const KEYS = [
  "footer_brand_description",
  "footer_shop_links",
  "footer_support_links",
  "footer_quick_links",
  "footer_payment_methods",
  "footer_copyright",
];

const LINK_KEYS = ["footer_shop_links", "footer_support_links", "footer_quick_links"];

const DEFAULTS = {
  footer_brand_description: "",
  footer_shop_links: [],
  footer_support_links: [],
  footer_quick_links: [],
  footer_payment_methods: [],
  footer_copyright: "© {year} Saga Elite. All rights reserved.",
};

const ensureArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);

const FooterManager = () => {
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
      const merged = { ...DEFAULTS };
      KEYS.forEach((k) => {
        if (k in data && data[k] !== undefined && data[k] !== null) {
          merged[k] = data[k];
        }
      });
      // Normalize array shapes
      LINK_KEYS.forEach((k) => {
        merged[k] = ensureArray(merged[k]);
      });
      merged.footer_payment_methods = ensureArray(merged.footer_payment_methods);
      setValues(merged);
      setOriginal(merged);
    } catch (err) {
      toast({
        title: "Could not load footer",
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

  const setField = (key, val) =>
    setValues((curr) => ({ ...curr, [key]: val }));

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
      toast({ title: "Footer updated", variant: "success" });
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

  const updateLinkRow = (key, idx, patch) => {
    const next = (values[key] || []).map((r, i) =>
      i === idx ? { ...r, ...patch } : r
    );
    setField(key, next);
  };

  const removeLinkRow = (key, idx) => {
    setField(
      key,
      (values[key] || []).filter((_, i) => i !== idx)
    );
  };

  const addLinkRow = (key) =>
    setField(key, [
      ...(values[key] || []),
      { label: "", url: "", openInNewTab: false },
    ]);

  const updatePayRow = (idx, patch) => {
    const next = values.footer_payment_methods.map((r, i) =>
      i === idx ? { ...r, ...patch } : r
    );
    setField("footer_payment_methods", next);
  };

  const removePayRow = (idx) => {
    setField(
      "footer_payment_methods",
      values.footer_payment_methods.filter((_, i) => i !== idx)
    );
  };

  const addPayRow = () =>
    setField("footer_payment_methods", [
      ...values.footer_payment_methods,
      { name: "", iconUrl: "" },
    ]);

  // Shared renderer for the three footer link columns (Shop / Support / Company).
  // Each row is { label, url, openInNewTab } and is edited via the generalized
  // updateLinkRow / removeLinkRow / addLinkRow helpers keyed by site-config key.
  const renderLinkSection = (key, title, emptyText) => {
    const rows = values[key] || [];
    return (
      <section className="rounded-2xl border border-ink/10 bg-page p-6">
        <header className="mb-4 flex items-center gap-2">
          <LinkIcon className="h-4 w-4 text-gold-ink2" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-ink">
            {title}
          </h2>
        </header>
        {rows.length === 0 ? (
          <p className="mb-3 rounded-lg border border-dashed border-ink/10 bg-black/30 px-4 py-6 text-center text-xs text-gray-500">
            {emptyText}
          </p>
        ) : null}
        <div className="space-y-3">
          {rows.map((row, idx) => (
            <div key={idx} className="rounded-lg border border-ink/10 bg-black/30 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-gray-500">
                  #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeLinkRow(key, idx)}
                  className="inline-flex items-center gap-1 rounded-md border border-ink/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-rose-300 transition hover:border-rose-400/40 hover:bg-rose-400/10"
                >
                  <Trash2 className="h-3 w-3" /> Remove
                </button>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <input
                  value={row.label || ""}
                  onChange={(e) => updateLinkRow(key, idx, { label: e.target.value })}
                  placeholder="Label (e.g. New Drops)"
                  className="rounded-md border border-ink/10 bg-black/50 px-3 py-2 text-sm text-ink outline-none focus:border-gold-ink2/40"
                />
                <input
                  value={row.url || ""}
                  onChange={(e) => updateLinkRow(key, idx, { url: e.target.value })}
                  placeholder="URL (e.g. /shopping/product-list or https://…)"
                  className="rounded-md border border-ink/10 bg-black/50 px-3 py-2 text-sm text-ink outline-none focus:border-gold-ink2/40"
                />
              </div>
              <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-xs text-gray-400">
                <input
                  type="checkbox"
                  checked={!!row.openInNewTab}
                  onChange={(e) => updateLinkRow(key, idx, { openInNewTab: e.target.checked })}
                  className="accent-gold-deep"
                />
                Open in new tab
              </label>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => addLinkRow(key)}
          className="mt-3 inline-flex items-center gap-2 rounded-md border border-gold-ink2/40 bg-gold-deep/10 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-gold-ink2 transition hover:bg-gold-deep/20"
        >
          <Plus className="h-3.5 w-3.5" /> Add link
        </button>
      </section>
    );
  };

  if (loading) {
    return (
      <AdminPage eyebrow="Content" title="Footer">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gold-ink2" />
        </div>
      </AdminPage>
    );
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="w-full"
    >
      <AdminPage
        eyebrow="Content"
        title="Footer"
        description="Edit the public footer's brand blurb, the Shop / Support / Company link columns, payment method icons, and copyright. Social links, the WhatsApp number, and contact details are managed in Brand & About."
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
            Save footer
            {dirtyKeys.length > 0 ? (
              <span className="rounded-full bg-black/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em]">
                {dirtyKeys.length}
              </span>
            ) : null}
          </PrimaryButton>
        }
      >
        <div className="space-y-6">
          {/* Brand description */}
          <section className="rounded-2xl border border-ink/10 bg-page p-6">
            <header className="mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-gold-ink2" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-ink">
                Brand description
              </h2>
            </header>
            <textarea
              value={values.footer_brand_description || ""}
              onChange={(e) =>
                setField("footer_brand_description", e.target.value.slice(0, 600))
              }
              rows={4}
              placeholder="A short blurb about the brand for the footer."
              className="w-full rounded-lg border border-ink/10 bg-black/60 px-3 py-2 text-sm text-ink outline-none focus:border-gold-ink2/40"
            />
            <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500">
              {(values.footer_brand_description || "").length} / 600
            </p>
          </section>

          {/* Shop column links */}
          {renderLinkSection(
            "footer_shop_links",
            "Shop column",
            "No shop links yet — the public footer shows the built-in defaults until you add some."
          )}

          {/* Support column links */}
          {renderLinkSection(
            "footer_support_links",
            "Support column",
            "No support links yet — the public footer shows the built-in defaults until you add some."
          )}

          {/* Company / quick links */}
          {renderLinkSection(
            "footer_quick_links",
            "Company links",
            "No links yet. Add one to get started."
          )}

          {/* Payment methods */}
          <section className="rounded-2xl border border-ink/10 bg-page p-6">
            <header className="mb-4 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-gold-ink2" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-ink">
                Payment methods
              </h2>
            </header>
            {values.footer_payment_methods.length === 0 ? (
              <p className="mb-3 rounded-lg border border-dashed border-ink/10 bg-black/30 px-4 py-6 text-center text-xs text-gray-500">
                No payment icons yet. Add one to get started.
              </p>
            ) : null}
            <div className="space-y-3">
              {values.footer_payment_methods.map((row, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-ink/10 bg-black/30 p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-gray-500">
                      #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removePayRow(idx)}
                      className="inline-flex items-center gap-1 rounded-md border border-ink/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-rose-300 transition hover:border-rose-400/40 hover:bg-rose-400/10"
                    >
                      <Trash2 className="h-3 w-3" /> Remove
                    </button>
                  </div>
                  <div className="grid gap-3">
                    <input
                      value={row.name || ""}
                      onChange={(e) =>
                        updatePayRow(idx, { name: e.target.value })
                      }
                      placeholder="Name (Visa, Mastercard, PayHere…)"
                      className="rounded-md border border-ink/10 bg-black/50 px-3 py-2 text-sm text-ink outline-none focus:border-gold-ink2/40"
                    />
                    <ImagePicker
                      value={row.iconUrl || ""}
                      onChange={(url) => updatePayRow(idx, { iconUrl: url })}
                      label="Upload icon"
                      type="logo"
                      refId={`footer_payment_${idx}`}
                      guidelines={{ dims: "120×76", maxSize: "1 MB", formats: "PNG / SVG / WEBP" }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addPayRow}
              className="mt-3 inline-flex items-center gap-2 rounded-md border border-gold-ink2/40 bg-gold-deep/10 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-gold-ink2 transition hover:bg-gold-deep/20"
            >
              <Plus className="h-3.5 w-3.5" /> Add icon
            </button>
          </section>

          {/* Copyright */}
          <section className="rounded-2xl border border-ink/10 bg-page p-6">
            <header className="mb-4 flex items-center gap-2">
              <Copyright className="h-4 w-4 text-gold-ink2" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-ink">
                Copyright text
              </h2>
            </header>
            <input
              type="text"
              value={values.footer_copyright || ""}
              onChange={(e) => setField("footer_copyright", e.target.value)}
              placeholder="© {year} Saga Elite. All rights reserved."
              className="w-full rounded-lg border border-ink/10 bg-black/60 px-3 py-2 text-sm text-ink outline-none focus:border-gold-ink2/40"
            />
            <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500">
              Use {"{year}"} to insert the current year automatically on the
              public site.
            </p>
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

export default FooterManager;
