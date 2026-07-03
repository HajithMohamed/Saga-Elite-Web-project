import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import {
  Megaphone,
  Loader2,
  Save,
  MousePointerClick,
  CalendarClock,
  Palette,
  Eye,
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

const KEY = "announcement_bar";

const DEFAULTS = {
  enabled: false,
  message: "",
  ctaText: "",
  ctaUrl: "",
  startsAt: "",
  endsAt: "",
  backgroundColor: "#0a0a0a",
  textColor: "#D4AF37",
};

const inputClass =
  "w-full rounded-lg border border-ink/10 bg-black/60 px-3 py-2 text-sm text-ink outline-none focus:border-gold-ink2/40";

const AnnouncementBar = () => {
  const { toast } = useToast();
  const [values, setValues] = useState(DEFAULTS);
  const [original, setOriginal] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/site-config/about`);
      const stored = res.data?.data?.[KEY];
      const merged = { ...DEFAULTS, ...(stored && typeof stored === "object" ? stored : {}) };
      setValues(merged);
      setOriginal(merged);
    } catch (err) {
      toast({
        title: "Could not load announcement bar",
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

  const dirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(original),
    [values, original]
  );

  const save = async () => {
    if (!dirty) {
      toast({ title: "Nothing to save", description: "No changes detected." });
      return;
    }
    setSaving(true);
    try {
      await axios.put(
        `${API_BASE}/site-config/${KEY}`,
        { value: values, label: KEY },
        { withCredentials: true }
      );
      toast({ title: "Announcement bar updated", variant: "success" });
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

  if (loading) {
    return (
      <AdminPage eyebrow="Content" title="Announcement Bar">
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
        title="Announcement Bar"
        description="Manage the site-wide banner shown above the header. Set the message, an optional call-to-action, a schedule, and colors. Visitors can dismiss it for the session."
        actions={
          <PrimaryButton
            type="button"
            onClick={save}
            disabled={saving || !dirty}
            className="inline-flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save announcement
          </PrimaryButton>
        }
      >
        <div className="space-y-6">
          {/* Live preview */}
          <section className="rounded-2xl border border-ink/10 bg-page p-6">
            <header className="mb-4 flex items-center gap-2">
              <Eye className="h-4 w-4 text-gold-ink2" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-ink">
                Live preview
              </h2>
            </header>
            <div className="overflow-hidden rounded-lg border border-ink/10">
              {values.message?.trim() ? (
                <div
                  className="relative flex items-center justify-center gap-3 px-10 py-2.5 text-sm"
                  style={{
                    backgroundColor: values.backgroundColor || "#0a0a0a",
                    color: values.textColor || "#D4AF37",
                  }}
                >
                  <span className="font-medium">{values.message}</span>
                  {values.ctaText ? (
                    <span
                      className="shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em]"
                      style={{ borderColor: values.textColor || "#D4AF37" }}
                    >
                      {values.ctaText}
                    </span>
                  ) : null}
                </div>
              ) : (
                <div className="px-4 py-6 text-center text-xs text-gray-500">
                  Enter a message to preview the bar.
                </div>
              )}
            </div>
            {!values.enabled ? (
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-400/80">
                Disabled — the bar will not show on the public site until enabled.
              </p>
            ) : null}
          </section>

          {/* Message & CTA */}
          <section className="rounded-2xl border border-ink/10 bg-page p-6">
            <header className="mb-4 flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-gold-ink2" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-ink">
                Message
              </h2>
            </header>

            <label className="mb-4 inline-flex cursor-pointer items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={!!values.enabled}
                onChange={(e) => setField("enabled", e.target.checked)}
                className="accent-gold-deep"
              />
              Show announcement bar on the public site
            </label>

            <input
              type="text"
              value={values.message || ""}
              onChange={(e) => setField("message", e.target.value.slice(0, 200))}
              placeholder="e.g. New drop live now — free shipping over LKR 15,000"
              className={inputClass}
            />
            <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500">
              {(values.message || "").length} / 200
            </p>
          </section>

          {/* Call to action */}
          <section className="rounded-2xl border border-ink/10 bg-page p-6">
            <header className="mb-4 flex items-center gap-2">
              <MousePointerClick className="h-4 w-4 text-gold-ink2" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-ink">
                Call to action
              </h2>
            </header>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500">
                  Button text (optional)
                </label>
                <input
                  type="text"
                  value={values.ctaText || ""}
                  onChange={(e) => setField("ctaText", e.target.value.slice(0, 40))}
                  placeholder="Shop now"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500">
                  Link URL (optional)
                </label>
                <input
                  type="text"
                  value={values.ctaUrl || ""}
                  onChange={(e) => setField("ctaUrl", e.target.value)}
                  placeholder="/shopping/listing or https://…"
                  className={inputClass}
                />
              </div>
            </div>
            <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500">
              When a link is set, the whole bar becomes clickable.
            </p>
          </section>

          {/* Schedule */}
          <section className="rounded-2xl border border-ink/10 bg-page p-6">
            <header className="mb-4 flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-gold-ink2" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-ink">
                Schedule
              </h2>
            </header>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500">
                  Starts at (optional)
                </label>
                <input
                  type="datetime-local"
                  value={values.startsAt || ""}
                  onChange={(e) => setField("startsAt", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500">
                  Ends at (optional)
                </label>
                <input
                  type="datetime-local"
                  value={values.endsAt || ""}
                  onChange={(e) => setField("endsAt", e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500">
              Leave blank for no time limit. The bar only shows within this window.
            </p>
          </section>

          {/* Colors */}
          <section className="rounded-2xl border border-ink/10 bg-page p-6">
            <header className="mb-4 flex items-center gap-2">
              <Palette className="h-4 w-4 text-gold-ink2" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-ink">
                Colors
              </h2>
            </header>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500">
                  Background
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={values.backgroundColor || "#0a0a0a"}
                    onChange={(e) => setField("backgroundColor", e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded-md border border-ink/10 bg-black/40"
                  />
                  <input
                    type="text"
                    value={values.backgroundColor || ""}
                    onChange={(e) => setField("backgroundColor", e.target.value)}
                    placeholder="#0a0a0a"
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500">
                  Text
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={values.textColor || "#D4AF37"}
                    onChange={(e) => setField("textColor", e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded-md border border-ink/10 bg-black/40"
                  />
                  <input
                    type="text"
                    value={values.textColor || ""}
                    onChange={(e) => setField("textColor", e.target.value)}
                    placeholder="#D4AF37"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <SecondaryButton
            type="button"
            onClick={() => setValues(original)}
            disabled={!dirty || saving}
          >
            Discard changes
          </SecondaryButton>
        </div>
      </AdminPage>
    </motion.div>
  );
};

export default AnnouncementBar;
