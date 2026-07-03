import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import {
  ScrollText,
  ShieldCheck,
  RotateCcw,
  Truck,
  Loader2,
  Save,
  Eye,
} from "lucide-react";
import { API_V1_URL as API_BASE } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { invalidateShopAbout } from "@/hooks/use-shop-about";
import useUnsavedChanges from "@/hooks/use-unsaved-changes";
import { AdminPage } from "@/components/admin-components/AdminUI";
import { pageVariants } from "@/components/admin-components/_shared/animations";
import {
  PrimaryButton,
  SecondaryButton,
} from "@/components/admin-components/_shared/Buttons";
import RichTextEditor from "@/components/admin-components/_shared/RichTextEditor";

const TABS = [
  { id: "policy_terms", label: "Terms & Conditions", icon: ScrollText },
  { id: "policy_privacy", label: "Privacy Policy", icon: ShieldCheck },
  { id: "policy_refund", label: "Refund Policy", icon: RotateCcw },
  { id: "policy_shipping", label: "Delivery Policy", icon: Truck },
];

const blankPolicy = {
  html: "",
  plainText: "",
  lastUpdated: null,
  metaTitle: "",
  metaDescription: "",
};

const normalizePolicy = (raw) => {
  if (!raw || typeof raw !== "object") return { ...blankPolicy };
  return {
    html: typeof raw.html === "string" ? raw.html : "",
    plainText: typeof raw.plainText === "string" ? raw.plainText : "",
    lastUpdated: raw.lastUpdated || null,
    metaTitle: raw.metaTitle || "",
    metaDescription: raw.metaDescription || "",
  };
};

const formatDate = (iso) => {
  if (!iso) return "Never saved";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return "—";
  }
};

const PoliciesManager = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [values, setValues] = useState(() =>
    Object.fromEntries(TABS.map((t) => [t.id, { ...blankPolicy }]))
  );
  const [original, setOriginal] = useState(() =>
    Object.fromEntries(TABS.map((t) => [t.id, { ...blankPolicy }]))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/site-config/about`);
      const data = res.data?.data || {};
      const next = Object.fromEntries(
        TABS.map((t) => [t.id, normalizePolicy(data[t.id])])
      );
      setValues(next);
      setOriginal(next);
    } catch (err) {
      toast({
        title: "Could not load policies",
        description: err?.response?.data?.message || err?.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const setActiveField = (patch) => {
    setValues((current) => ({
      ...current,
      [activeTab]: { ...current[activeTab], ...patch },
    }));
  };

  const isDirty = useCallback(
    (tabId) =>
      JSON.stringify(values[tabId]) !== JSON.stringify(original[tabId]),
    [values, original]
  );

  const dirtyCount = useMemo(
    () => TABS.filter((t) => isDirty(t.id)).length,
    [isDirty]
  );

  // Warn on tab close / refresh while any policy tab has unsaved edits.
  useUnsavedChanges(dirtyCount > 0);

  const saveActive = async () => {
    if (!isDirty(activeTab)) {
      toast({ title: "Nothing to save", description: "No changes detected." });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...values[activeTab],
        lastUpdated: new Date().toISOString(),
      };
      await axios.put(
        `${API_BASE}/site-config/${activeTab}`,
        { value: payload, label: activeTab },
        { withCredentials: true }
      );
      toast({
        title: "Policy saved",
        description: `${TABS.find((t) => t.id === activeTab)?.label} updated.`,
        variant: "success",
      });
      invalidateShopAbout();
      await loadAll();
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

  const active = values[activeTab] || blankPolicy;

  if (loading) {
    return (
      <AdminPage eyebrow="Content" title="Policies">
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
        title="Policies"
        description="Edit Terms, Privacy, Refund, and Delivery policies. Rich text supports headings, lists, links, and tables. Saves immediately to the public site."
      >
        <div className="mb-6 flex flex-wrap gap-2 border-b border-ink/10 pb-3">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            const dirty = isDirty(tab.id);
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-widest transition ${
                  active
                    ? "bg-gold-deep text-black"
                    : "border border-ink/10 text-gray-300 hover:border-gold-ink2/40 hover:text-ink"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
                {dirty ? (
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-rose-400"
                    title="Unsaved changes"
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-ink/10 bg-page p-6">
          <div className="mb-4 flex items-center justify-between gap-4 text-xs text-gray-400">
            <span className="font-mono uppercase tracking-[0.22em]">
              Last updated · {formatDate(active.lastUpdated)}
            </span>
            <span className="font-mono uppercase tracking-[0.22em]">
              {(active.plainText || "").length} chars
            </span>
          </div>

          <div className="mb-5">
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-gray-400">
              Body
            </p>
            <RichTextEditor
              value={active.html}
              onChange={({ html, plainText }) =>
                setActiveField({ html, plainText })
              }
              placeholder="Write the policy. Use H2 for sections, lists for clauses, links for references…"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-gray-400">
                SEO meta title
              </p>
              <input
                type="text"
                value={active.metaTitle || ""}
                onChange={(e) => setActiveField({ metaTitle: e.target.value })}
                placeholder="Privacy Policy · Saga Elite"
                className="w-full rounded-lg border border-ink/10 bg-black/60 px-3 py-2 text-sm text-ink outline-none focus:border-gold-ink2/40"
              />
            </div>
            <div>
              <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-gray-400">
                SEO meta description
              </p>
              <input
                type="text"
                value={active.metaDescription || ""}
                onChange={(e) =>
                  setActiveField({ metaDescription: e.target.value })
                }
                placeholder="Brief summary shown in search results."
                className="w-full rounded-lg border border-ink/10 bg-black/60 px-3 py-2 text-sm text-ink outline-none focus:border-gold-ink2/40"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col items-end gap-2">
          <div className="flex items-center gap-3">
            <SecondaryButton
              type="button"
              onClick={() =>
                setValues((curr) => ({
                  ...curr,
                  [activeTab]: original[activeTab],
                }))
              }
              disabled={!isDirty(activeTab) || saving}
            >
              Discard changes
            </SecondaryButton>
            <PrimaryButton
              type="button"
              onClick={saveActive}
              disabled={saving || !isDirty(activeTab)}
              className="inline-flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save policy
              {dirtyCount > 0 ? (
                <span className="rounded-full bg-black/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em]">
                  {dirtyCount} unsaved
                </span>
              ) : null}
            </PrimaryButton>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500">
            <Eye className="inline h-3 w-3" /> Saved policies are served via
            /api/v1/site-config/{activeTab}
          </p>
        </div>
      </AdminPage>
    </motion.div>
  );
};

export default PoliciesManager;
