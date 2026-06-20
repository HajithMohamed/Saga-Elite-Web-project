import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import {
  Phone,
  HelpCircle,
  Mail,
  MessageCircle,
  Loader2,
  Save,
  Plus,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";
import { API_V1_URL as API_BASE } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { invalidateShopAbout } from "@/hooks/use-shop-about";
import { AdminPage } from "@/components/admin-components/AdminUI";
import { pageVariants } from "@/components/admin-components/_shared/animations";
import {
  PrimaryButton,
  SecondaryButton,
} from "@/components/admin-components/_shared/Buttons";
import RichTextEditor from "@/components/admin-components/_shared/RichTextEditor";

const TABS = [
  { id: "info", label: "Contact Info", icon: Phone },
  { id: "faq", label: "FAQ", icon: HelpCircle },
  { id: "form", label: "Form Settings", icon: Mail },
  { id: "whatsapp", label: "WhatsApp CTA", icon: MessageCircle },
];

const TAB_KEYS = {
  faq: ["faq_items"],
  form: ["contact_form_settings"],
  whatsapp: ["whatsapp_cta"],
  info: [], // read-only summary
};

const DEFAULTS = {
  faq_items: [],
  contact_form_settings: {
    enabled: true,
    recipientEmail: "",
    autoResponseSubject: "We received your message",
    autoResponseBody:
      "Thanks for reaching out — we'll get back to you within one business day.",
  },
  whatsapp_cta: {
    enabled: false,
    message: "Hi! I have a question about Saga Elite.",
    displayPosition: "floating",
  },
};

// Read-only contact info summary (managed in Brand & About)
const INFO_KEYS = [
  { key: "shop_contact_email", label: "Email" },
  { key: "shop_support_email", label: "Support email" },
  { key: "shop_contact_phone", label: "Phone" },
  { key: "shop_whatsapp_number", label: "WhatsApp" },
  { key: "shop_address_line1", label: "Address" },
  { key: "shop_map_embed_url", label: "Map embed URL" },
];

const ensureArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);

const ContactPageManager = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("info");
  const [values, setValues] = useState(DEFAULTS);
  const [original, setOriginal] = useState(DEFAULTS);
  const [info, setInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/site-config/about`);
      const data = res.data?.data || {};
      const merged = {
        faq_items: ensureArray(data.faq_items),
        contact_form_settings: {
          ...DEFAULTS.contact_form_settings,
          ...(data.contact_form_settings || {}),
        },
        whatsapp_cta: {
          ...DEFAULTS.whatsapp_cta,
          ...(data.whatsapp_cta || {}),
        },
      };
      setValues(merged);
      setOriginal(merged);
      const infoSnapshot = {};
      INFO_KEYS.forEach(({ key }) => {
        infoSnapshot[key] = data[key] || "";
      });
      setInfo(infoSnapshot);
    } catch (err) {
      toast({
        title: "Could not load contact content",
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

  const set = (key, val) => setValues((curr) => ({ ...curr, [key]: val }));

  const isDirty = useCallback(
    (tabId) =>
      (TAB_KEYS[tabId] || []).some(
        (k) => JSON.stringify(values[k]) !== JSON.stringify(original[k])
      ),
    [values, original]
  );

  const dirtyKeys = useMemo(
    () =>
      Object.keys(values).filter(
        (k) => JSON.stringify(values[k]) !== JSON.stringify(original[k])
      ),
    [values, original]
  );

  const saveTab = async () => {
    const keys = TAB_KEYS[activeTab] || [];
    const changed = keys.filter(
      (k) => JSON.stringify(values[k]) !== JSON.stringify(original[k])
    );
    if (changed.length === 0) {
      toast({ title: "Nothing to save", description: "No changes detected." });
      return;
    }
    setSaving(true);
    try {
      await Promise.all(
        changed.map((k) =>
          axios.put(
            `${API_BASE}/site-config/${k}`,
            { value: values[k], label: k },
            { withCredentials: true }
          )
        )
      );
      toast({ title: "Saved", variant: "success" });
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

  const updateFaq = (idx, patch) => {
    const next = (values.faq_items || []).map((r, i) =>
      i === idx ? { ...r, ...patch } : r
    );
    set("faq_items", next);
  };
  const addFaq = () =>
    set("faq_items", [
      ...(values.faq_items || []),
      { question: "", answer: "" },
    ]);
  const removeFaq = (idx) =>
    set(
      "faq_items",
      (values.faq_items || []).filter((_, i) => i !== idx)
    );

  if (loading) {
    return (
      <AdminPage eyebrow="Content" title="Contact & FAQ">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        </div>
      </AdminPage>
    );
  }

  const InfoTab = (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">
        Contact details — phone, email, address, hours, map embed — are
        managed centrally in <strong>Brand & About</strong> so the footer,
        contact page, and About page all stay in sync. Use the link below to
        edit them.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {INFO_KEYS.map((row) => (
          <div
            key={row.key}
            className="rounded-lg border border-white/10 bg-black/40 p-3"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500">
              {row.label}
            </p>
            <p className="mt-1 text-sm text-white">
              {info[row.key] ? (
                <span className="break-all">{info[row.key]}</span>
              ) : (
                <span className="text-gray-500">— not set —</span>
              )}
            </p>
          </div>
        ))}
      </div>
      <Link
        to="/admin/about-content"
        className="inline-flex items-center gap-2 rounded-md border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-[#D4AF37] transition hover:bg-[#D4AF37]/20"
      >
        <ExternalLink className="h-3.5 w-3.5" /> Edit in Brand & About
      </Link>
    </div>
  );

  const FaqTab = (
    <div className="space-y-3">
      <p className="text-sm text-gray-400">
        Add common customer questions. Answers support rich text — use H3 for
        sub-questions, lists for steps, links for references.
      </p>
      {(values.faq_items || []).length === 0 ? (
        <p className="rounded-lg border border-dashed border-white/10 bg-black/30 px-4 py-6 text-center text-xs text-gray-500">
          No FAQs yet. Add one to get started.
        </p>
      ) : null}
      {(values.faq_items || []).map((row, idx) => (
        <div
          key={idx}
          className="rounded-lg border border-white/10 bg-black/30 p-4"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-gray-500">
              Q#{idx + 1}
            </span>
            <button
              type="button"
              onClick={() => removeFaq(idx)}
              className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-rose-300 transition hover:border-rose-400/40 hover:bg-rose-400/10"
            >
              <Trash2 className="h-3 w-3" /> Remove
            </button>
          </div>
          <input
            value={row.question || ""}
            onChange={(e) => updateFaq(idx, { question: e.target.value })}
            placeholder="Question"
            className="mb-3 w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]/40"
          />
          <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-gray-400">
            Answer
          </p>
          <RichTextEditor
            value={row.answer || ""}
            onChange={({ html }) => updateFaq(idx, { answer: html })}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={addFaq}
        className="inline-flex items-center gap-2 rounded-md border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-[#D4AF37] transition hover:bg-[#D4AF37]/20"
      >
        <Plus className="h-3.5 w-3.5" /> Add question
      </button>
    </div>
  );

  const FormTab = (
    <div className="grid gap-5">
      <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-white">
        <input
          type="checkbox"
          checked={!!values.contact_form_settings.enabled}
          onChange={(e) =>
            set("contact_form_settings", {
              ...values.contact_form_settings,
              enabled: e.target.checked,
            })
          }
          className="h-4 w-4 accent-[#D4AF37]"
        />
        Enable contact form on the public site
      </label>
      <div>
        <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-gray-400">
          Recipient email
        </p>
        <input
          type="email"
          value={values.contact_form_settings.recipientEmail || ""}
          onChange={(e) =>
            set("contact_form_settings", {
              ...values.contact_form_settings,
              recipientEmail: e.target.value,
            })
          }
          placeholder="hello@sagaelite.com"
          className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]/40"
        />
      </div>
      <div>
        <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-gray-400">
          Auto-response subject
        </p>
        <input
          type="text"
          value={values.contact_form_settings.autoResponseSubject || ""}
          onChange={(e) =>
            set("contact_form_settings", {
              ...values.contact_form_settings,
              autoResponseSubject: e.target.value,
            })
          }
          className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]/40"
        />
      </div>
      <div>
        <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-gray-400">
          Auto-response body
        </p>
        <textarea
          rows={5}
          value={values.contact_form_settings.autoResponseBody || ""}
          onChange={(e) =>
            set("contact_form_settings", {
              ...values.contact_form_settings,
              autoResponseBody: e.target.value,
            })
          }
          className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]/40"
        />
      </div>
    </div>
  );

  const WhatsappTab = (
    <div className="grid gap-5">
      <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-white">
        <input
          type="checkbox"
          checked={!!values.whatsapp_cta.enabled}
          onChange={(e) =>
            set("whatsapp_cta", {
              ...values.whatsapp_cta,
              enabled: e.target.checked,
            })
          }
          className="h-4 w-4 accent-[#D4AF37]"
        />
        Enable WhatsApp CTA on the contact page
      </label>
      <div>
        <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-gray-400">
          Pre-filled message
        </p>
        <textarea
          rows={3}
          value={values.whatsapp_cta.message || ""}
          onChange={(e) =>
            set("whatsapp_cta", {
              ...values.whatsapp_cta,
              message: e.target.value,
            })
          }
          placeholder="Hi! I have a question about Saga Elite."
          className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]/40"
        />
      </div>
      <div>
        <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-gray-400">
          Display position
        </p>
        <div className="flex gap-2">
          {[
            { id: "floating", label: "Floating button (corner)" },
            { id: "section", label: "Section block on contact page" },
          ].map((opt) => {
            const active = values.whatsapp_cta.displayPosition === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() =>
                  set("whatsapp_cta", {
                    ...values.whatsapp_cta,
                    displayPosition: opt.id,
                  })
                }
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-widest transition ${
                  active
                    ? "bg-[#D4AF37] text-black"
                    : "border border-white/10 text-gray-300 hover:border-[#D4AF37]/40 hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
      <p className="text-xs text-gray-500">
        The WhatsApp number itself is configured in <strong>Brand & About →
        Contact</strong>.
      </p>
    </div>
  );

  const tabContent = {
    info: InfoTab,
    faq: FaqTab,
    form: FormTab,
    whatsapp: WhatsappTab,
  };

  const isInfoTab = activeTab === "info";

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="w-full"
    >
      <AdminPage
        eyebrow="Content"
        title="Contact & FAQ"
        description="Manage the customer-facing FAQ, contact-form behavior, and WhatsApp CTA. Phone / email / address are read-only here — edit them in Brand & About."
        actions={
          !isInfoTab ? (
            <PrimaryButton
              type="button"
              onClick={saveTab}
              disabled={saving || !isDirty(activeTab)}
              className="inline-flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save section
              {dirtyKeys.length > 0 ? (
                <span className="rounded-full bg-black/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em]">
                  {dirtyKeys.length}
                </span>
              ) : null}
            </PrimaryButton>
          ) : null
        }
      >
        <div className="mb-6 flex flex-wrap gap-2 border-b border-white/10 pb-3">
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
                    ? "bg-[#D4AF37] text-black"
                    : "border border-white/10 text-gray-300 hover:border-[#D4AF37]/40 hover:text-white"
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

        <div className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-6">
          {tabContent[activeTab]}
        </div>

        {!isInfoTab ? (
          <div className="mt-4 flex items-center justify-end gap-3">
            <SecondaryButton
              type="button"
              onClick={() => setValues(original)}
              disabled={dirtyKeys.length === 0 || saving}
            >
              Discard changes
            </SecondaryButton>
          </div>
        ) : null}
      </AdminPage>
    </motion.div>
  );
};

export default ContactPageManager;
