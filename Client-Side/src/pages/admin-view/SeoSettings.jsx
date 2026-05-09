import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  Loader2,
  Globe,
  Search,
  AlertTriangle,
  CreditCard,
  Save,
} from "lucide-react";
import { API_V1_URL as API_BASE } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { AdminPage } from "@/components/admin-components/AdminUI";

const TABS = [
  { key: "branding", label: "Branding", icon: Globe },
  { key: "seo", label: "SEO", icon: Search },
  { key: "maintenance", label: "Maintenance", icon: AlertTriangle },
  { key: "payment", label: "Payment Settings", icon: CreditCard },
];

const SEO_PAGES = [
  { key: "home", label: "Home" },
  { key: "product-list", label: "Product List" },
  { key: "about", label: "About" },
  { key: "contact", label: "Contact" },
  { key: "drops", label: "Drops" },
];

const DEFAULT_BRANDING = {
  tagline: "",
  whatsappNumber: "",
  supportEmail: "",
  instagramUrl: "",
  facebookUrl: "",
  tiktokUrl: "",
};

const DEFAULT_MAINTENANCE = {
  enabled: false,
  message: "Saga Elite is offline for a brief moment. We'll be right back.",
  eta: "",
};

const DEFAULT_BANK_DETAILS = {
  bankName: "Sampath Bank",
  branch: "Hatton",
  accountName: "N.Gayathree",
  accountNumber: "108052612262",
  whatsapp: "+94 77 070 4274",
  deadline: "Pay within 24 hours to confirm your order.",
};

const putConfig = (key, payload) =>
  axios.put(`${API_BASE}/site-config/${encodeURIComponent(key)}`, payload, {
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
  });

const getConfig = (key) =>
  axios.get(`${API_BASE}/site-config/${encodeURIComponent(key)}`, {
    withCredentials: true,
  });

/* --------------------------------------------------------------------- */
/* Tab components                                                         */
/* --------------------------------------------------------------------- */

const TextField = ({ label, value, onChange, placeholder, type = "text" }) => (
  <div>
    <label className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-[#99907c]">
      {label}
    </label>
    <input
      type={type}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-[#2a2a2a] bg-[#0a0a0a] p-3 text-sm text-[#FAF7F2] outline-none focus:border-[#f2ca50]"
    />
  </div>
);

const BrandingTab = ({ value, onChange, onSave, saving }) => (
  <div className="space-y-6">
    <p className="text-xs text-[#99907c]">
      Brand-level settings are surfaced sitewide (footer, contact links, OG previews).
    </p>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <TextField
        label="Tagline"
        value={value.tagline}
        onChange={(v) => onChange({ ...value, tagline: v })}
        placeholder="Limited drops, hand-finished."
      />
      <TextField
        label="WhatsApp Business #"
        value={value.whatsappNumber}
        onChange={(v) => onChange({ ...value, whatsappNumber: v })}
        placeholder="+94 77 070 4274"
      />
      <TextField
        label="Support Email"
        value={value.supportEmail}
        onChange={(v) => onChange({ ...value, supportEmail: v })}
        placeholder="hello@sagaelite.lk"
        type="email"
      />
      <TextField
        label="Instagram URL"
        value={value.instagramUrl}
        onChange={(v) => onChange({ ...value, instagramUrl: v })}
        placeholder="https://instagram.com/sagaelite"
      />
      <TextField
        label="Facebook URL"
        value={value.facebookUrl}
        onChange={(v) => onChange({ ...value, facebookUrl: v })}
        placeholder="https://facebook.com/sagaelite"
      />
      <TextField
        label="TikTok URL"
        value={value.tiktokUrl}
        onChange={(v) => onChange({ ...value, tiktokUrl: v })}
        placeholder="https://tiktok.com/@sagaelite"
      />
    </div>
    <button
      type="button"
      onClick={onSave}
      disabled={saving}
      className="inline-flex items-center gap-2 bg-[#f2ca50] px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-[#0a0a0a] hover:bg-[#ffe088] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {saving ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Save className="h-4 w-4" />
      )}
      Save branding
    </button>
  </div>
);

const SeoTab = ({ value, onChange, onSave, saving }) => (
  <div className="space-y-6">
    <p className="text-xs text-[#99907c]">
      Per-page meta tags. Title and description show in search results; OG image is used for link previews.
    </p>
    {SEO_PAGES.map((page) => {
      const meta = value[page.key] || {
        title: "",
        description: "",
        ogImage: "",
      };
      return (
        <section
          key={page.key}
          className="border border-[#2a2a2a] bg-[#131313] p-5"
        >
          <h3 className="mb-3 font-mono text-xs uppercase tracking-[0.26em] text-[#f2ca50]">
            {page.label}
          </h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <TextField
              label="Meta title"
              value={meta.title}
              onChange={(v) =>
                onChange({ ...value, [page.key]: { ...meta, title: v } })
              }
              placeholder={`Saga Elite — ${page.label}`}
            />
            <TextField
              label="OG image URL"
              value={meta.ogImage}
              onChange={(v) =>
                onChange({ ...value, [page.key]: { ...meta, ogImage: v } })
              }
              placeholder="https://res.cloudinary.com/…"
            />
            <div className="md:col-span-2">
              <label className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-[#99907c]">
                Meta description
              </label>
              <textarea
                rows={2}
                value={meta.description || ""}
                onChange={(e) =>
                  onChange({
                    ...value,
                    [page.key]: { ...meta, description: e.target.value },
                  })
                }
                className="w-full border border-[#2a2a2a] bg-[#0a0a0a] p-3 text-sm text-[#FAF7F2] outline-none focus:border-[#f2ca50]"
              />
            </div>
          </div>
        </section>
      );
    })}
    <button
      type="button"
      onClick={onSave}
      disabled={saving}
      className="inline-flex items-center gap-2 bg-[#f2ca50] px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-[#0a0a0a] hover:bg-[#ffe088] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {saving ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Save className="h-4 w-4" />
      )}
      Save SEO meta
    </button>
  </div>
);

const MaintenanceTab = ({ value, onChange, onSave, saving }) => (
  <div className="space-y-6">
    {value.enabled ? (
      <div className="flex items-start gap-3 border border-[#ffb4ab]/40 bg-[#ffb4ab]/5 p-4 text-sm text-[#ffb4ab]">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <div>
          <p className="font-bold uppercase tracking-[0.22em]">
            Maintenance mode is currently ACTIVE
          </p>
          <p className="mt-1 text-xs">
            All public requests (products, drops, orders, etc.) are returning 503.
            Admin and auth endpoints remain accessible. Toggle off to restore the storefront.
          </p>
        </div>
      </div>
    ) : (
      <p className="text-xs text-[#99907c]">
        Toggle this on to take the storefront offline. The admin panel and auth
        flows continue to work normally so you can keep editing.
      </p>
    )}

    <label className="flex items-center gap-3 text-sm text-[#e5e2e1]">
      <input
        type="checkbox"
        checked={!!value.enabled}
        onChange={(e) => onChange({ ...value, enabled: e.target.checked })}
        className="h-4 w-4"
      />
      Enable maintenance mode
    </label>

    <div>
      <label className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-[#99907c]">
        Customer-facing message
      </label>
      <textarea
        rows={3}
        value={value.message || ""}
        onChange={(e) => onChange({ ...value, message: e.target.value })}
        className="w-full border border-[#2a2a2a] bg-[#0a0a0a] p-3 text-sm text-[#FAF7F2] outline-none focus:border-[#f2ca50]"
      />
    </div>

    <TextField
      label="Estimated return time (free text)"
      value={value.eta}
      onChange={(v) => onChange({ ...value, eta: v })}
      placeholder="Back online by 8 PM SLT"
    />

    <button
      type="button"
      onClick={onSave}
      disabled={saving}
      className={`inline-flex items-center gap-2 px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-widest disabled:cursor-not-allowed disabled:opacity-60 ${
        value.enabled
          ? "bg-[#ffb4ab] text-[#0a0a0a] hover:bg-[#ffc7c0]"
          : "bg-[#f2ca50] text-[#0a0a0a] hover:bg-[#ffe088]"
      }`}
    >
      {saving ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Save className="h-4 w-4" />
      )}
      {value.enabled
        ? "Save & take storefront offline"
        : "Save maintenance settings"}
    </button>
  </div>
);

const PaymentTab = ({ value, onChange, onSave, saving }) => (
  <div className="space-y-6">
    <p className="text-xs text-[#99907c]">
      Bank account details shown on the manual-payment screen and bundled in
      generated invoices.
    </p>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <TextField
        label="Bank name"
        value={value.bankName}
        onChange={(v) => onChange({ ...value, bankName: v })}
      />
      <TextField
        label="Branch"
        value={value.branch}
        onChange={(v) => onChange({ ...value, branch: v })}
      />
      <TextField
        label="Account name"
        value={value.accountName}
        onChange={(v) => onChange({ ...value, accountName: v })}
      />
      <TextField
        label="Account number"
        value={value.accountNumber}
        onChange={(v) => onChange({ ...value, accountNumber: v })}
      />
      <TextField
        label="WhatsApp"
        value={value.whatsapp}
        onChange={(v) => onChange({ ...value, whatsapp: v })}
      />
      <div className="md:col-span-2">
        <TextField
          label="Deadline note"
          value={value.deadline}
          onChange={(v) => onChange({ ...value, deadline: v })}
        />
      </div>
    </div>
    <button
      type="button"
      onClick={onSave}
      disabled={saving}
      className="inline-flex items-center gap-2 bg-[#f2ca50] px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-[#0a0a0a] hover:bg-[#ffe088] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {saving ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Save className="h-4 w-4" />
      )}
      Save payment settings
    </button>
  </div>
);

/* --------------------------------------------------------------------- */
/* Main                                                                   */
/* --------------------------------------------------------------------- */

const SeoSettings = () => {
  const [activeTab, setActiveTab] = useState("branding");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [branding, setBranding] = useState(DEFAULT_BRANDING);
  const [seoPages, setSeoPages] = useState({});
  const [maintenance, setMaintenance] = useState(DEFAULT_MAINTENANCE);
  const [bankDetails, setBankDetails] = useState(DEFAULT_BANK_DETAILS);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const safeGet = async (key, fallback) => {
      try {
        const res = await getConfig(key);
        const value = res.data?.data ?? res.data?.value;
        if (value && typeof value === "object" && !Array.isArray(value)) {
          return { ...fallback, ...value };
        }
        return value ?? fallback;
      } catch {
        return fallback;
      }
    };

    const [b, s, m, bd] = await Promise.all([
      safeGet("branding", DEFAULT_BRANDING),
      safeGet("seo_pages", {}),
      safeGet("maintenance", DEFAULT_MAINTENANCE),
      safeGet("bank_details", DEFAULT_BANK_DETAILS),
    ]);

    setBranding(b);
    setSeoPages(s && typeof s === "object" ? s : {});
    setMaintenance(m);
    setBankDetails(bd);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const saveKey = async (key, label, value) => {
    setSaving(true);
    try {
      await putConfig(key, { label, value });
      toast({ title: "Saved", description: `${label} updated.` });
    } catch (err) {
      toast({
        title: "Save failed",
        description:
          err?.response?.data?.message || err?.message || "Could not save",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminPage
      eyebrow="Site Configuration"
      title="SEO & Branding"
      description="Brand-wide settings, SEO meta tags, maintenance mode, and payment details."
    >
      <div className="mx-auto max-w-5xl pb-20">
        <div className="mb-6 flex flex-wrap gap-2 border-b border-[#2a2a2a] pb-4">
          {TABS.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 border px-5 py-3 font-mono text-[11px] uppercase tracking-[0.2em] transition-colors ${
                  isActive
                    ? "border-[#f2ca50] bg-[#131313] text-[#f2ca50]"
                    : "border-[#2a2a2a] text-[#888] hover:text-[#e5e2e1]"
                }`}
              >
                <TabIcon className="h-4 w-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#f2ca50]" />
          </div>
        ) : activeTab === "branding" ? (
          <BrandingTab
            value={branding}
            onChange={setBranding}
            saving={saving}
            onSave={() => saveKey("branding", "Branding", branding)}
          />
        ) : activeTab === "seo" ? (
          <SeoTab
            value={seoPages}
            onChange={setSeoPages}
            saving={saving}
            onSave={() => saveKey("seo_pages", "SEO Page Meta", seoPages)}
          />
        ) : activeTab === "maintenance" ? (
          <MaintenanceTab
            value={maintenance}
            onChange={setMaintenance}
            saving={saving}
            onSave={() =>
              saveKey("maintenance", "Maintenance Mode", maintenance)
            }
          />
        ) : (
          <PaymentTab
            value={bankDetails}
            onChange={setBankDetails}
            saving={saving}
            onSave={() =>
              saveKey("bank_details", "Bank Details", bankDetails)
            }
          />
        )}
      </div>
    </AdminPage>
  );
};

export default SeoSettings;
