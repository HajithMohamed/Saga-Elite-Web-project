import React, { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
// eslint-disable-next-line no-unused-vars -- motion JSX
import { motion } from "framer-motion";
import {
  Building2,
  User as UserIcon,
  Phone,
  Share2,
  BarChart3,
  Sparkles,
  Users,
  Layers,
  Loader2,
  Plus,
  Trash2,
  Image as ImageIcon,
  Save,
  Eye,
  ShieldCheck,
  Star,
  Heart,
  Zap,
  Award,
  Leaf,
  Globe,
  Crown,
  History,
  GalleryHorizontal,
} from "lucide-react";
import { API_V1_URL as API_BASE } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { invalidateShopAbout } from "@/hooks/use-shop-about";
import { AdminPage } from "@/components/admin-components/AdminUI";
import { pageVariants } from "@/components/admin-components/_shared/animations";
import { PrimaryButton, SecondaryButton } from "@/components/admin-components/_shared/Buttons";
import { compressImageFile } from "@/lib/image-compression";

// ── Field config ──────────────────────────────────────────────────────────
// Every editable siteConfig key + which tab it belongs to. Validation rules
// and human labels live here so the JSX stays declarative.

const TABS = [
  { id: "brand", label: "Brand", icon: Building2 },
  { id: "aboutpage", label: "About Page", icon: ImageIcon },
  { id: "founder", label: "Founder", icon: UserIcon },
  { id: "contact", label: "Contact", icon: Phone },
  { id: "social", label: "Socials", icon: Share2 },
  { id: "stats", label: "Stats", icon: BarChart3 },
  { id: "values", label: "Values", icon: Sparkles },
  { id: "team", label: "Team", icon: Users },
  { id: "timeline", label: "Timeline", icon: History },
  { id: "gallery", label: "Studio Gallery", icon: GalleryHorizontal },
  { id: "misc", label: "Materials & Press", icon: Layers },
];

// Fields owned by each tab — used by per-tab "Save section" to figure out
// which keys to PUT on save.
const TAB_KEYS = {
  brand: [
    "shop_brand_name",
    "shop_tagline",
    "shop_logo_url",
    "shop_founded_year",
    "shop_hero_eyebrow",
    "shop_hero_headline",
    "about_brand_story",
  ],
  aboutpage: [
    "about_hero_image",
    "about_hero_title",
    "about_hero_subtitle",
    "about_hero_cta_label",
    "about_hero_cta_url",
    "about_story_image",
  ],
  founder: [
    "shop_founder_name",
    "shop_founder_title",
    "shop_founder_bio",
    "shop_founder_photo_url",
  ],
  contact: [
    "shop_contact_email",
    "shop_support_email",
    "shop_contact_phone",
    "shop_whatsapp_number",
    "shop_address_line1",
    "shop_address_line2",
    "shop_address_city",
    "shop_address_postal",
    "shop_address_country",
    "shop_hours",
    "shop_map_embed_url",
  ],
  social: [
    "shop_social_instagram",
    "shop_social_facebook",
    "shop_social_tiktok",
    "shop_social_youtube",
    "shop_social_twitter",
  ],
  stats: ["about_stats"],
  values: ["about_values"],
  team: ["about_team_heading", "about_team_subtext", "shop_team_members"],
  timeline: ["about_timeline"],
  gallery: ["about_studio_gallery"],
  misc: ["shop_materials", "shop_press_quotes"],
};

const DEFAULT_VALUES = {
  shop_brand_name: "",
  shop_tagline: "",
  shop_logo_url: "",
  shop_founded_year: "",
  shop_hero_eyebrow: "",
  shop_hero_headline: "",
  about_brand_story: [],
  about_hero_image: "",
  about_hero_title: "",
  about_hero_subtitle: "",
  about_hero_cta_label: "",
  about_hero_cta_url: "",
  about_story_image: "",
  shop_founder_name: "",
  shop_founder_title: "",
  shop_founder_bio: "",
  shop_founder_photo_url: "",
  shop_contact_email: "",
  shop_support_email: "",
  shop_contact_phone: "",
  shop_whatsapp_number: "",
  shop_address_line1: "",
  shop_address_line2: "",
  shop_address_city: "",
  shop_address_postal: "",
  shop_address_country: "Sri Lanka",
  shop_hours: [],
  shop_map_embed_url: "",
  shop_social_instagram: "",
  shop_social_facebook: "",
  shop_social_tiktok: "",
  shop_social_youtube: "",
  shop_social_twitter: "",
  about_stats: [],
  about_values: [],
  about_team_heading: "",
  about_team_subtext: "",
  shop_team_members: [],
  about_timeline: [],
  about_studio_gallery: [],
  shop_materials: [],
  shop_press_quotes: [],
};

// Curated icon set for the Values picker. Keep this small — admins shouldn't
// have to scroll through 1000+ Lucide icons.
const VALUE_ICONS = [
  { name: "ShieldCheck", icon: ShieldCheck },
  { name: "Sparkles", icon: Sparkles },
  { name: "Star", icon: Star },
  { name: "Heart", icon: Heart },
  { name: "Zap", icon: Zap },
  { name: "Award", icon: Award },
  { name: "Leaf", icon: Leaf },
  { name: "Globe", icon: Globe },
  { name: "Crown", icon: Crown },
  { name: "Users", icon: Users },
];

const isEmail = (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v));
const isUrl = (v) => !v || /^https?:\/\/.+/i.test(String(v));
const ensureArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);

// ── Inline image picker ───────────────────────────────────────────────────
// Uploads a single file via the same multipart endpoint as ImageUpload.jsx
// but stores just a URL string in form state.

const ImagePicker = ({ value, onChange, label = "Upload image" }) => {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const inputRef = React.useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const compressed = await compressImageFile(file);
      const fd = new FormData();
      fd.append("refModel", "SiteConfig");
      fd.append("refId", "about_content");
      fd.append("type", "logo");
      fd.append("images", compressed);
      const res = await axios.post(`${API_BASE}/image/upload-image`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      const url = res.data?.images?.[0]?.url || res.data?.url;
      if (!url) throw new Error("Upload returned no URL");
      onChange(url);
      toast({ title: "Image uploaded", variant: "success" });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err?.response?.data?.message || err?.message || "Try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-ink/10 bg-black/40">
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-600">
              <ImageIcon className="h-5 w-5" />
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-md border border-gold-ink2/40 bg-gold-deep/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-gold-ink2 transition hover:bg-gold-deep/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
            {busy ? "Uploading…" : label}
          </button>
          {value ? (
            <button
              type="button"
              onClick={() => onChange("")}
              disabled={busy}
              className="text-[10px] uppercase tracking-[0.18em] text-rose-300 hover:text-rose-200"
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>
      {value ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          className="w-full rounded-lg border border-ink/10 bg-black/60 px-3 py-2 font-mono text-[11px] text-ink outline-none focus:border-gold-ink2/40"
        />
      ) : null}
    </div>
  );
};

// ── Field components ──────────────────────────────────────────────────────

const FieldShell = ({ label, hint, error, children }) => (
  <div className="space-y-1.5">
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-gray-400">
        {label}
      </span>
      {children}
    </label>
    {hint ? <p className="text-[10px] text-gray-500">{hint}</p> : null}
    {error ? <p className="text-[10px] text-rose-300">{error}</p> : null}
  </div>
);

const TextField = ({ label, hint, value, onChange, placeholder, error, type = "text" }) => (
  <FieldShell label={label} hint={hint} error={error}>
    <input
      type={type}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="mt-1 w-full rounded-lg border border-ink/10 bg-black/60 px-3 py-2 text-sm text-ink outline-none transition focus:border-gold-ink2/40"
    />
  </FieldShell>
);

const TextArea = ({ label, hint, value, onChange, placeholder, rows = 4, max }) => (
  <FieldShell
    label={label}
    hint={
      max
        ? `${(value || "").length} / ${max}${hint ? ` · ${hint}` : ""}`
        : hint
    }
  >
    <textarea
      value={value || ""}
      onChange={(e) => {
        const next = max ? e.target.value.slice(0, max) : e.target.value;
        onChange(next);
      }}
      placeholder={placeholder}
      rows={rows}
      className="mt-1 w-full rounded-lg border border-ink/10 bg-black/60 px-3 py-2 text-sm text-ink outline-none transition focus:border-gold-ink2/40"
    />
  </FieldShell>
);

// Dynamic row editor for any array-shaped key. The renderRow callback decides
// how each row's fields look — keeps the rest of the page declarative.
const RowEditor = ({ rows = [], onChange, renderRow, blank, addLabel = "Add row", max }) => {
  const update = (idx, patch) => {
    const next = rows.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    onChange(next);
  };
  const remove = (idx) => {
    const next = rows.filter((_, i) => i !== idx);
    onChange(next);
  };
  const add = () => {
    if (max && rows.length >= max) return;
    onChange([...rows, { ...blank }]);
  };
  return (
    <div className="space-y-3">
      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-ink/10 bg-black/30 px-4 py-6 text-center text-xs text-gray-500">
          No entries yet. Add one to get started.
        </p>
      ) : null}
      {rows.map((row, idx) => (
        <div key={idx} className="rounded-lg border border-ink/10 bg-black/30 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-gray-500">
              #{idx + 1}
            </span>
            <button
              type="button"
              onClick={() => remove(idx)}
              className="inline-flex items-center gap-1 rounded-md border border-ink/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-rose-300 transition hover:border-rose-400/40 hover:bg-rose-400/10"
            >
              <Trash2 className="h-3 w-3" />
              Remove
            </button>
          </div>
          {renderRow(row, (patch) => update(idx, patch))}
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        disabled={max && rows.length >= max}
        className="inline-flex items-center gap-2 rounded-md border border-gold-ink2/40 bg-gold-deep/10 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-gold-ink2 transition hover:bg-gold-deep/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus className="h-3.5 w-3.5" /> {addLabel}
        {max ? <span className="text-[10px] opacity-70">({rows.length} / {max})</span> : null}
      </button>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────

const AboutSiteConfig = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("brand");
  const [values, setValues] = useState(DEFAULT_VALUES);
  const [original, setOriginal] = useState(DEFAULT_VALUES);
  const [loading, setLoading] = useState(true);
  const [savingTab, setSavingTab] = useState(null);
  const [savingAll, setSavingAll] = useState(false);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/site-config/about`);
      const fromServer = res.data?.data || {};
      const merged = { ...DEFAULT_VALUES };
      Object.entries(fromServer).forEach(([key, val]) => {
        if (key in DEFAULT_VALUES) merged[key] = val;
      });
      setValues(merged);
      setOriginal(merged);
    } catch (err) {
      toast({
        title: "Could not load existing content",
        description: err?.response?.data?.message || err?.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const setField = (key, val) => {
    setValues((current) => ({ ...current, [key]: val }));
  };

  // Sequential PUTs for changed keys. The backend logs each via
  // adminLogMiddleware so we get a per-key audit trail.
  const persist = async (keys) => {
    const writes = keys
      .filter((k) => JSON.stringify(values[k]) !== JSON.stringify(original[k]))
      .map((k) => {
        let val = values[k];
        if (k === "shop_founded_year" && val !== "" && val !== null) {
          const n = Number(val);
          val = Number.isFinite(n) ? n : null;
        }
        return axios.put(
          `${API_BASE}/site-config/${k}`,
          { value: val, label: k },
          { withCredentials: true }
        );
      });

    if (writes.length === 0) {
      toast({ title: "Nothing to save", description: "No changes detected." });
      return false;
    }

    await Promise.all(writes);
    return true;
  };

  const saveTab = async (tabId) => {
    setSavingTab(tabId);
    try {
      const changed = await persist(TAB_KEYS[tabId]);
      if (changed) {
        toast({ title: "Saved", description: `${tabId} section updated.`, variant: "success" });
        invalidateShopAbout();
        await loadConfig();
      }
    } catch (err) {
      toast({
        title: "Save failed",
        description: err?.response?.data?.message || err?.message,
        variant: "destructive",
      });
    } finally {
      setSavingTab(null);
    }
  };

  const saveAll = async () => {
    setSavingAll(true);
    try {
      const allKeys = Object.values(TAB_KEYS).flat();
      const changed = await persist(allKeys);
      if (changed) {
        toast({ title: "All sections saved", variant: "success" });
        invalidateShopAbout();
        await loadConfig();
      }
    } catch (err) {
      toast({
        title: "Save failed",
        description: err?.response?.data?.message || err?.message,
        variant: "destructive",
      });
    } finally {
      setSavingAll(false);
    }
  };

  const dirtyKeys = useMemo(
    () =>
      Object.keys(DEFAULT_VALUES).filter(
        (k) => JSON.stringify(values[k]) !== JSON.stringify(original[k])
      ),
    [values, original]
  );

  const dirtyForTab = (tabId) =>
    TAB_KEYS[tabId].some((k) => dirtyKeys.includes(k));

  const BrandTab = (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="Brand name"
          value={values.shop_brand_name}
          onChange={(v) => setField("shop_brand_name", v)}
          placeholder="Saga Elite"
        />
        <TextField
          label="Tagline (≤140 chars)"
          value={values.shop_tagline}
          onChange={(v) => setField("shop_tagline", v.slice(0, 140))}
          placeholder="Limited edition fashion built for the bold."
          hint={`${(values.shop_tagline || "").length} / 140`}
        />
      </div>
      <FieldShell label="Logo" hint="Square preferred. Used in header + footer.">
        <ImagePicker
          value={values.shop_logo_url}
          onChange={(v) => setField("shop_logo_url", v)}
          label="Upload logo"
          guidelines={{ dims: "512×512", aspect: "1:1", maxSize: "2 MB", formats: "PNG / SVG / WEBP" }}
        />
      </FieldShell>
      <div className="grid gap-4 md:grid-cols-3">
        <TextField
          label="Founded year"
          type="number"
          value={values.shop_founded_year}
          onChange={(v) => setField("shop_founded_year", v)}
          placeholder="2024"
        />
        <TextField
          label="Hero eyebrow"
          value={values.shop_hero_eyebrow}
          onChange={(v) => setField("shop_hero_eyebrow", v)}
          placeholder="Atelier · Sri Lanka"
        />
        <TextField
          label="Hero headline"
          value={values.shop_hero_headline}
          onChange={(v) => setField("shop_hero_headline", v)}
          placeholder="Quietly made."
        />
      </div>
      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-gray-400">
          Brand story (paragraphs)
        </p>
        <RowEditor
          rows={(ensureArray(values.about_brand_story) || []).map((p) =>
            typeof p === "string" ? { text: p } : { text: p.text || "" }
          )}
          onChange={(rows) => setField("about_brand_story", rows.map((r) => r.text))}
          blank={{ text: "" }}
          addLabel="Add paragraph"
          renderRow={(row, update) => (
            <textarea
              value={row.text || ""}
              onChange={(e) => update({ text: e.target.value })}
              rows={3}
              placeholder="A paragraph of the brand story…"
              className="w-full rounded-md border border-ink/10 bg-black/50 px-3 py-2 text-sm text-ink outline-none focus:border-gold-ink2/40"
            />
          )}
        />
      </div>
    </div>
  );

  const AboutPageTab = (
    <div className="grid gap-6">
      <div className="grid gap-5 rounded-xl border border-ink/10 bg-black/30 p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold-ink2">
          Hero banner
        </p>
        <FieldShell
          label="Hero image"
          hint="Recommended 1920 × 720 px · 21:9 · object-fit cover · ≤ 2 MB · JPG / PNG / WEBP. Keep key subjects centred."
        >
          <ImagePicker
            value={values.about_hero_image}
            onChange={(v) => setField("about_hero_image", v)}
            label="Upload hero image"
          />
        </FieldShell>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Hero title"
            value={values.about_hero_title}
            onChange={(v) => setField("about_hero_title", v)}
            placeholder="About Saga Elite"
          />
          <TextField
            label="Hero subtitle"
            value={values.about_hero_subtitle}
            onChange={(v) => setField("about_hero_subtitle", v)}
            placeholder="Premium Fashion Designed for Modern Sri Lanka"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="CTA label (optional)"
            value={values.about_hero_cta_label}
            onChange={(v) => setField("about_hero_cta_label", v)}
            placeholder="Shop Collection"
          />
          <TextField
            label="CTA link (optional)"
            value={values.about_hero_cta_url}
            onChange={(v) => setField("about_hero_cta_url", v)}
            placeholder="/shopping/product-list"
            error={values.about_hero_cta_url && !/^(https?:\/\/|\/)/.test(values.about_hero_cta_url) ? "Use a full URL or a path starting with /" : null}
          />
        </div>
      </div>

      <div className="grid gap-5 rounded-xl border border-ink/10 bg-black/30 p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold-ink2">
          Our Story
        </p>
        <FieldShell
          label="Story image"
          hint="Recommended 900 × 1200 px · 3:4 portrait · object-fit cover · ≤ 2 MB · JPG / PNG / WEBP."
        >
          <ImagePicker
            value={values.about_story_image}
            onChange={(v) => setField("about_story_image", v)}
            label="Upload story image"
          />
        </FieldShell>
        <p className="text-[10px] text-gray-500">
          Story text is edited under the <span className="text-gold-ink2">Brand</span> tab (Brand story paragraphs).
        </p>
      </div>
    </div>
  );

  const FounderTab = (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="Founder name"
          value={values.shop_founder_name}
          onChange={(v) => setField("shop_founder_name", v)}
        />
        <TextField
          label="Founder title"
          value={values.shop_founder_title}
          onChange={(v) => setField("shop_founder_title", v)}
          placeholder="Founder & Creative Director"
        />
      </div>
      <FieldShell label="Founder photo">
        <ImagePicker
          value={values.shop_founder_photo_url}
          onChange={(v) => setField("shop_founder_photo_url", v)}
          label="Upload photo"
        />
      </FieldShell>
      <TextArea
        label="Founder bio"
        value={values.shop_founder_bio}
        onChange={(v) => setField("shop_founder_bio", v)}
        rows={6}
        max={2000}
        placeholder="A few paragraphs in the founder's voice…"
      />
    </div>
  );

  const ContactTab = (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="Contact email"
          value={values.shop_contact_email}
          onChange={(v) => setField("shop_contact_email", v)}
          placeholder="hello@sagaelite.com"
          error={!isEmail(values.shop_contact_email) ? "Invalid email format" : null}
        />
        <TextField
          label="Support email"
          value={values.shop_support_email}
          onChange={(v) => setField("shop_support_email", v)}
          placeholder="support@sagaelite.com"
          error={!isEmail(values.shop_support_email) ? "Invalid email format" : null}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="Phone"
          value={values.shop_contact_phone}
          onChange={(v) => setField("shop_contact_phone", v)}
          placeholder="+94 77 070 4274"
        />
        <TextField
          label="WhatsApp number (digits only)"
          value={values.shop_whatsapp_number}
          onChange={(v) => setField("shop_whatsapp_number", v.replace(/[^0-9]/g, ""))}
          placeholder="94770704274"
          hint="Used for wa.me/{number} links"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="Address line 1"
          value={values.shop_address_line1}
          onChange={(v) => setField("shop_address_line1", v)}
        />
        <TextField
          label="Address line 2"
          value={values.shop_address_line2}
          onChange={(v) => setField("shop_address_line2", v)}
        />
        <TextField
          label="City"
          value={values.shop_address_city}
          onChange={(v) => setField("shop_address_city", v)}
        />
        <TextField
          label="Postal code"
          value={values.shop_address_postal}
          onChange={(v) => setField("shop_address_postal", v)}
        />
        <TextField
          label="Country"
          value={values.shop_address_country}
          onChange={(v) => setField("shop_address_country", v)}
        />
      </div>
      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-gray-400">
          Hours
        </p>
        <RowEditor
          rows={ensureArray(values.shop_hours)}
          onChange={(rows) => setField("shop_hours", rows)}
          blank={{ day: "", hours: "" }}
          addLabel="Add hours row"
          renderRow={(row, update) => (
            <div className="grid gap-2 md:grid-cols-2">
              <input
                value={row.day || ""}
                onChange={(e) => update({ day: e.target.value })}
                placeholder="Mon–Fri"
                className="rounded-md border border-ink/10 bg-black/50 px-3 py-2 text-sm text-ink outline-none focus:border-gold-ink2/40"
              />
              <input
                value={row.hours || ""}
                onChange={(e) => update({ hours: e.target.value })}
                placeholder="9:00 AM – 6:00 PM"
                className="rounded-md border border-ink/10 bg-black/50 px-3 py-2 text-sm text-ink outline-none focus:border-gold-ink2/40"
              />
            </div>
          )}
        />
      </div>
      <TextField
        label="Google Maps embed URL"
        value={values.shop_map_embed_url}
        onChange={(v) => setField("shop_map_embed_url", v)}
        placeholder="https://www.google.com/maps/embed?pb=…"
        hint="Paste the src URL from Google Maps → Share → Embed a map"
      />
    </div>
  );

  const SocialTab = (
    <div className="grid gap-4">
      {[
        { key: "shop_social_instagram", label: "Instagram URL" },
        { key: "shop_social_facebook", label: "Facebook URL" },
        { key: "shop_social_tiktok", label: "TikTok URL" },
        { key: "shop_social_youtube", label: "YouTube URL" },
        { key: "shop_social_twitter", label: "Twitter / X URL" },
      ].map((s) => (
        <TextField
          key={s.key}
          label={s.label}
          value={values[s.key]}
          onChange={(v) => setField(s.key, v)}
          placeholder="https://…"
          error={!isUrl(values[s.key]) ? "Must start with http:// or https://" : null}
        />
      ))}
    </div>
  );

  const StatsTab = (
    <div>
      <p className="mb-3 text-xs text-gray-500">
        Cards shown on the About page. Each entry has a label, a value (number or text), and an optional suffix (e.g. "+", "%").
      </p>
      <RowEditor
        rows={ensureArray(values.about_stats)}
        onChange={(rows) => setField("about_stats", rows)}
        blank={{ label: "", value: "", suffix: "" }}
        addLabel="Add stat"
        renderRow={(row, update) => (
          <div className="grid gap-2 md:grid-cols-3">
            <input
              value={row.label || ""}
              onChange={(e) => update({ label: e.target.value })}
              placeholder="Pieces sold"
              className="rounded-md border border-ink/10 bg-black/50 px-3 py-2 text-sm text-ink outline-none focus:border-gold-ink2/40"
            />
            <input
              value={row.value || ""}
              onChange={(e) => update({ value: e.target.value })}
              placeholder="84"
              className="rounded-md border border-ink/10 bg-black/50 px-3 py-2 text-sm text-ink outline-none focus:border-gold-ink2/40"
            />
            <input
              value={row.suffix || ""}
              onChange={(e) => update({ suffix: e.target.value })}
              placeholder="+"
              className="rounded-md border border-ink/10 bg-black/50 px-3 py-2 text-sm text-ink outline-none focus:border-gold-ink2/40"
            />
          </div>
        )}
      />
    </div>
  );

  const ValuesTab = (
    <div>
      <p className="mb-3 text-xs text-gray-500">
        Brand values rendered as cards. Pick an icon, give it a title, write a short body.
      </p>
      <RowEditor
        rows={ensureArray(values.about_values)}
        onChange={(rows) => setField("about_values", rows)}
        blank={{ icon: "ShieldCheck", title: "", body: "" }}
        addLabel="Add value"
        renderRow={(row, update) => (
          <div className="grid gap-3">
            <div>
              <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-gray-500">
                Icon
              </p>
              <div className="flex flex-wrap gap-1.5">
                {VALUE_ICONS.map((opt) => {
                  const Icon = opt.icon;
                  const active = row.icon === opt.name;
                  return (
                    <button
                      key={opt.name}
                      type="button"
                      onClick={() => update({ icon: opt.name })}
                      title={opt.name}
                      className={`flex h-8 w-8 items-center justify-center rounded-md border transition ${
                        active
                          ? "border-gold-ink2 bg-gold-deep/15 text-gold-ink2"
                          : "border-ink/10 bg-black/40 text-gray-400 hover:border-ink/20"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>
            <input
              value={row.title || ""}
              onChange={(e) => update({ title: e.target.value })}
              placeholder="Slowly"
              className="rounded-md border border-ink/10 bg-black/50 px-3 py-2 text-sm text-ink outline-none focus:border-gold-ink2/40"
            />
            <textarea
              value={row.body || ""}
              onChange={(e) => update({ body: e.target.value })}
              placeholder="One short sentence describing this value…"
              rows={2}
              className="rounded-md border border-ink/10 bg-black/50 px-3 py-2 text-sm text-ink outline-none focus:border-gold-ink2/40"
            />
          </div>
        )}
      />
    </div>
  );

  const TeamTab = (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="Section heading"
          value={values.about_team_heading}
          onChange={(v) => setField("about_team_heading", v)}
          placeholder="The atelier hands"
        />
        <TextField
          label="Section subtext"
          value={values.about_team_subtext}
          onChange={(v) => setField("about_team_subtext", v)}
          placeholder="The people behind the work."
        />
      </div>
      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-gray-400">
          Team members (max 12)
        </p>
        <RowEditor
          rows={ensureArray(values.shop_team_members)}
          onChange={(rows) => setField("shop_team_members", rows)}
          blank={{ name: "", title: "", photoUrl: "", bio: "" }}
          addLabel="Add member"
          max={12}
          renderRow={(row, update) => (
            <div className="grid gap-3">
              <div className="grid gap-2 md:grid-cols-2">
                <input
                  value={row.name || ""}
                  onChange={(e) => update({ name: e.target.value })}
                  placeholder="Name"
                  className="rounded-md border border-ink/10 bg-black/50 px-3 py-2 text-sm text-ink outline-none focus:border-gold-ink2/40"
                />
                <input
                  value={row.title || ""}
                  onChange={(e) => update({ title: e.target.value })}
                  placeholder="Title (Pattern Cutter, etc.)"
                  className="rounded-md border border-ink/10 bg-black/50 px-3 py-2 text-sm text-ink outline-none focus:border-gold-ink2/40"
                />
              </div>
              <ImagePicker
                value={row.photoUrl || ""}
                onChange={(url) => update({ photoUrl: url })}
                label="Upload photo"
              />
              <textarea
                value={row.bio || ""}
                onChange={(e) => update({ bio: e.target.value })}
                placeholder="Optional one-line bio…"
                rows={2}
                className="rounded-md border border-ink/10 bg-black/50 px-3 py-2 text-sm text-ink outline-none focus:border-gold-ink2/40"
              />
            </div>
          )}
        />
      </div>
    </div>
  );

  const TimelineTab = (
    <div>
      <p className="mb-3 text-xs text-gray-500">
        Brand journey milestones rendered as a timeline on the About page. Each
        row has a year, a milestone, and an optional image.
      </p>
      <RowEditor
        rows={ensureArray(values.about_timeline)}
        onChange={(rows) => setField("about_timeline", rows)}
        blank={{ year: "", milestone: "", imageUrl: "" }}
        addLabel="Add milestone"
        renderRow={(row, update) => (
          <div className="grid gap-3">
            <div className="grid gap-2 md:grid-cols-3">
              <input
                value={row.year || ""}
                onChange={(e) => update({ year: e.target.value })}
                placeholder="2024"
                className="rounded-md border border-ink/10 bg-black/50 px-3 py-2 text-sm text-ink outline-none focus:border-gold-ink2/40"
              />
              <input
                value={row.milestone || ""}
                onChange={(e) => update({ milestone: e.target.value })}
                placeholder="Saga Elite founded"
                className="md:col-span-2 rounded-md border border-ink/10 bg-black/50 px-3 py-2 text-sm text-ink outline-none focus:border-gold-ink2/40"
              />
            </div>
            <ImagePicker
              value={row.imageUrl || ""}
              onChange={(url) => update({ imageUrl: url })}
              label="Upload image (optional)"
            />
          </div>
        )}
      />
    </div>
  );

  const GalleryTab = (
    <div>
      <p className="mb-3 text-xs text-gray-500">
        Studio / atelier gallery shown on the About page. Add images with
        captions and alt text for accessibility.
      </p>
      <RowEditor
        rows={ensureArray(values.about_studio_gallery)}
        onChange={(rows) => setField("about_studio_gallery", rows)}
        blank={{ imageUrl: "", caption: "", altText: "" }}
        addLabel="Add image"
        renderRow={(row, update) => (
          <div className="grid gap-3">
            <ImagePicker
              value={row.imageUrl || ""}
              onChange={(url) => update({ imageUrl: url })}
              label="Upload image"
            />
            <input
              value={row.caption || ""}
              onChange={(e) => update({ caption: e.target.value })}
              placeholder="Caption (optional)"
              className="rounded-md border border-ink/10 bg-black/50 px-3 py-2 text-sm text-ink outline-none focus:border-gold-ink2/40"
            />
            <input
              value={row.altText || ""}
              onChange={(e) => update({ altText: e.target.value })}
              placeholder="Alt text for screen readers"
              className="rounded-md border border-ink/10 bg-black/50 px-3 py-2 text-sm text-ink outline-none focus:border-gold-ink2/40"
            />
          </div>
        )}
      />
    </div>
  );

  const MiscTab = (
    <div className="grid gap-6">
      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-gray-400">
          Materials & sourcing
        </p>
        <p className="mb-3 text-xs text-gray-500">
          Where do your fabrics / hardware come from? Each row is a card on the About page.
        </p>
        <RowEditor
          rows={ensureArray(values.shop_materials)}
          onChange={(rows) => setField("shop_materials", rows)}
          blank={{ name: "", description: "" }}
          addLabel="Add material"
          renderRow={(row, update) => (
            <div className="grid gap-2">
              <input
                value={row.name || ""}
                onChange={(e) => update({ name: e.target.value })}
                placeholder="Pima cotton"
                className="rounded-md border border-ink/10 bg-black/50 px-3 py-2 text-sm text-ink outline-none focus:border-gold-ink2/40"
              />
              <textarea
                value={row.description || ""}
                onChange={(e) => update({ description: e.target.value })}
                placeholder="Sourced from… honest line about origin or process."
                rows={2}
                className="rounded-md border border-ink/10 bg-black/50 px-3 py-2 text-sm text-ink outline-none focus:border-gold-ink2/40"
              />
            </div>
          )}
        />
      </div>
      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-gray-400">
          Press & quotes
        </p>
        <p className="mb-3 text-xs text-gray-500">Optional. Press mentions or testimonials.</p>
        <RowEditor
          rows={ensureArray(values.shop_press_quotes)}
          onChange={(rows) => setField("shop_press_quotes", rows)}
          blank={{ source: "", quote: "", url: "" }}
          addLabel="Add quote"
          renderRow={(row, update) => (
            <div className="grid gap-2">
              <input
                value={row.source || ""}
                onChange={(e) => update({ source: e.target.value })}
                placeholder="Source (e.g. Vogue)"
                className="rounded-md border border-ink/10 bg-black/50 px-3 py-2 text-sm text-ink outline-none focus:border-gold-ink2/40"
              />
              <textarea
                value={row.quote || ""}
                onChange={(e) => update({ quote: e.target.value })}
                placeholder="Quote text…"
                rows={2}
                className="rounded-md border border-ink/10 bg-black/50 px-3 py-2 text-sm text-ink outline-none focus:border-gold-ink2/40"
              />
              <input
                value={row.url || ""}
                onChange={(e) => update({ url: e.target.value })}
                placeholder="https://… (optional link)"
                className="rounded-md border border-ink/10 bg-black/50 px-3 py-2 text-sm text-ink outline-none focus:border-gold-ink2/40"
              />
            </div>
          )}
        />
      </div>
    </div>
  );

  const tabContent = {
    brand: BrandTab,
    aboutpage: AboutPageTab,
    founder: FounderTab,
    contact: ContactTab,
    social: SocialTab,
    stats: StatsTab,
    values: ValuesTab,
    team: TeamTab,
    timeline: TimelineTab,
    gallery: GalleryTab,
    misc: MiscTab,
  };

  if (loading) {
    return (
      <AdminPage eyebrow="Site content" title="About content">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gold-ink2" />
        </div>
      </AdminPage>
    );
  }

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="w-full">
      <AdminPage
        eyebrow="Site content"
        title="About content"
        description="Edit shop details, founder bio, contact info, social links, and team. Saves to DB and updates the public About / Contact / Footer pages."
        actions={
          <PrimaryButton
            type="button"
            onClick={saveAll}
            disabled={savingAll || dirtyKeys.length === 0}
            className="inline-flex items-center gap-2"
          >
            {savingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save all
            {dirtyKeys.length > 0 ? (
              <span className="rounded-full bg-black/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em]">
                {dirtyKeys.length}
              </span>
            ) : null}
          </PrimaryButton>
        }
      >
        <div className="mb-6 flex flex-wrap gap-2 border-b border-ink/10 pb-3">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            const dirty = dirtyForTab(tab.id);
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
          {tabContent[activeTab]}
        </div>

        <div className="mt-4 flex flex-col items-end gap-2">
          <SecondaryButton
            type="button"
            onClick={() => saveTab(activeTab)}
            disabled={savingTab === activeTab || !dirtyForTab(activeTab)}
            className="inline-flex items-center gap-2"
          >
            {savingTab === activeTab ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save {TABS.find((t) => t.id === activeTab)?.label || activeTab} section
          </SecondaryButton>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500">
            <Eye className="inline h-3 w-3" /> Saved values appear on the public About / Contact / Footer pages immediately.
          </p>
        </div>
      </AdminPage>
    </motion.div>
  );
};

export default AboutSiteConfig;
