import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { Bell, Loader2, Save, Eye } from "lucide-react";
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

const DEFAULT = {
  enabled: false,
  message: "",
  ctaText: "",
  ctaUrl: "",
  backgroundColor: "#0a0a0a",
  textColor: "#D4AF37",
  startsAt: "",
  endsAt: "",
};

const normalize = (raw) => {
  if (!raw || typeof raw !== "object") return { ...DEFAULT };
  return {
    enabled: !!raw.enabled,
    message: typeof raw.message === "string" ? raw.message : "",
    ctaText: typeof raw.ctaText === "string" ? raw.ctaText : "",
    ctaUrl: typeof raw.ctaUrl === "string" ? raw.ctaUrl : "",
    backgroundColor: raw.backgroundColor || "#0a0a0a",
    textColor: raw.textColor || "#D4AF37",
    startsAt: raw.startsAt ? String(raw.startsAt).slice(0, 16) : "",
    endsAt: raw.endsAt ? String(raw.endsAt).slice(0, 16) : "",
  };
};

const AnnouncementBar = () => {
  const { toast } = useToast();
  const [value, setValue] = useState(DEFAULT);
  const [original, setOriginal] = useState(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/site-config/about`);
      const fromServer = res.data?.data?.[KEY];
      const next = normalize(fromServer);
      setValue(next);
      setOriginal(next);
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

  const dirty = useMemo(
    () => JSON.stringify(value) !== JSON.stringify(original),
    [value, original]
  );

  const set = (patch) => setValue((curr) => ({ ...curr, ...patch }));

  const save = async () => {
    if (!dirty) {
      toast({ title: "Nothing to save", description: "No changes detected." });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...value,
        startsAt: value.startsAt
          ? new Date(value.startsAt).toISOString()
          : null,
        endsAt: value.endsAt ? new Date(value.endsAt).toISOString() : null,
      };
      await axios.put(
        `${API_BASE}/site-config/${KEY}`,
        { value: payload, label: KEY },
        { withCredentials: true }
      );
      toast({ title: "Announcement saved", variant: "success" });
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
      <AdminPage eyebrow="Content" title="Announcement bar">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
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
        title="Announcement bar"
        description="The slim notice strip at the top of every public page. Schedule with start/end dates or leave them empty to show indefinitely while enabled."
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
            Save
          </PrimaryButton>
        }
      >
        {/* Live preview */}
        <div className="mb-6">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-gray-400">
            <Eye className="inline h-3 w-3" /> Live preview
          </p>
          <div
            className="flex items-center justify-center gap-3 rounded-lg border border-white/10 px-4 py-2.5 text-sm transition"
            style={{
              backgroundColor: value.backgroundColor || "#0a0a0a",
              color: value.textColor || "#D4AF37",
              opacity: value.enabled ? 1 : 0.45,
            }}
          >
            <span className="font-medium">
              {value.message ||
                "Your announcement message will appear here."}
            </span>
            {value.ctaText ? (
              <span
                className="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em]"
                style={{ borderColor: value.textColor || "#D4AF37" }}
              >
                {value.ctaText}
              </span>
            ) : null}
            {!value.enabled ? (
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] opacity-70">
                · disabled
              </span>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-6">
          <label className="mb-5 inline-flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={!!value.enabled}
              onChange={(e) => set({ enabled: e.target.checked })}
              className="h-4 w-4 accent-[#D4AF37]"
            />
            <span className="flex items-center gap-2 text-sm font-semibold text-white">
              <Bell className="h-4 w-4 text-[#D4AF37]" />
              Show announcement bar
            </span>
          </label>

          <div className="grid gap-5">
            <div>
              <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-gray-400">
                Message
              </p>
              <input
                type="text"
                value={value.message}
                onChange={(e) =>
                  set({ message: e.target.value.slice(0, 200) })
                }
                placeholder="Free insured delivery on orders above LKR 20,000"
                className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]/40"
              />
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500">
                {value.message.length} / 200
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-gray-400">
                  CTA text (optional)
                </p>
                <input
                  type="text"
                  value={value.ctaText}
                  onChange={(e) =>
                    set({ ctaText: e.target.value.slice(0, 40) })
                  }
                  placeholder="Shop now"
                  className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]/40"
                />
              </div>
              <div>
                <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-gray-400">
                  CTA URL (optional)
                </p>
                <input
                  type="text"
                  value={value.ctaUrl}
                  onChange={(e) => set({ ctaUrl: e.target.value })}
                  placeholder="/shopping/product-list"
                  className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]/40"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-gray-400">
                  Background color
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={value.backgroundColor}
                    onChange={(e) => set({ backgroundColor: e.target.value })}
                    className="h-10 w-14 cursor-pointer rounded border border-white/10 bg-transparent"
                  />
                  <input
                    type="text"
                    value={value.backgroundColor}
                    onChange={(e) => set({ backgroundColor: e.target.value })}
                    className="w-32 rounded-lg border border-white/10 bg-black/60 px-3 py-2 font-mono text-sm text-white outline-none focus:border-[#D4AF37]/40"
                  />
                </div>
              </div>
              <div>
                <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-gray-400">
                  Text color
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={value.textColor}
                    onChange={(e) => set({ textColor: e.target.value })}
                    className="h-10 w-14 cursor-pointer rounded border border-white/10 bg-transparent"
                  />
                  <input
                    type="text"
                    value={value.textColor}
                    onChange={(e) => set({ textColor: e.target.value })}
                    className="w-32 rounded-lg border border-white/10 bg-black/60 px-3 py-2 font-mono text-sm text-white outline-none focus:border-[#D4AF37]/40"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-gray-400">
                  Show from (optional)
                </p>
                <input
                  type="datetime-local"
                  value={value.startsAt}
                  onChange={(e) => set({ startsAt: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]/40"
                />
              </div>
              <div>
                <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-gray-400">
                  Hide after (optional)
                </p>
                <input
                  type="datetime-local"
                  value={value.endsAt}
                  onChange={(e) => set({ endsAt: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]/40"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-3">
          <SecondaryButton
            type="button"
            onClick={() => setValue(original)}
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
