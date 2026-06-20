import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
} from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Copy,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
} from "lucide-react";
import usePageMeta from "@/hooks/use-page-meta";
import { CONTACT_INFO as CONTACT_INFO_FALLBACK } from "@/config";
import useShopAbout from "@/hooks/use-shop-about";
import { API_V1_URL as API_BASE } from "@/lib/api";
import {
  AnimatedLogo,
  Btn,
  Eyebrow,
  FieldError,
  Hairline,
  Marquee,
  Reveal,
} from "@/components/ui/editorial";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1558769132-92e28c91c6f9?w=1800&q=80&auto=format&fit=crop";

const SUBJECT_OPTIONS = [
  "Order inquiry",
  "Return request",
  "Payment issue",
  "General question",
  "Press / Wholesale",
  "Other",
];

const HOURS = [
  ["Mon — Fri", "09:00 — 18:00"],
  ["Saturday", "10:00 — 16:00"],
  ["Sunday", "Closed"],
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateContact = (data, touched = {}) => {
  const e = {};
  if (touched.name && !data.name?.trim()) e.name = "Tell us your name.";
  if (touched.email && !data.email) {
    e.email = "Where should we reply?";
  } else if (data.email && !EMAIL_REGEX.test(data.email)) {
    e.email = "Please enter a valid email address.";
  }
  if (touched.message && !data.message?.trim()) {
    e.message = "Add a few words.";
  } else if (data.message && data.message.trim().length < 10) {
    e.message = "A little more — at least ten characters.";
  }
  return e;
};

const InstagramGlyph = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
    />
  </svg>
);

const FacebookGlyph = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
    />
  </svg>
);

const TikTokGlyph = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"
    />
  </svg>
);

const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.4 });
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-px bg-[#f2ca50] z-[60] origin-left"
      style={{ scaleX }}
      aria-hidden="true"
    />
  );
};

const CopyButton = ({ value, label }) => {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {}
  };
  return (
    <button
      type="button"
      onClick={handle}
      aria-label={`Copy ${label}`}
      className="ml-2 text-[#99907c] hover:text-[#f2ca50] transition-colors"
    >
      {copied ? (
        <CheckCircle2 size={12} strokeWidth={1.75} className="text-[#a8d8b6]" />
      ) : (
        <Copy size={12} strokeWidth={1.5} />
      )}
    </button>
  );
};

const ContactPage = () => {
  usePageMeta({
    title: "Contact",
    description:
      "Reach the Saga Elite atelier — questions, orders, returns, press.",
  });

  // Merge siteConfig (shop owner edits) with the literal fallback. Any field
  // unset in siteConfig falls through to CONTACT_INFO_FALLBACK so the page
  // never breaks during partial migrations.
  const { data: about } = useShopAbout();
  const CONTACT_INFO = useMemo(
    () => ({
      email: about?.shop_contact_email || CONTACT_INFO_FALLBACK.email,
      phone: about?.shop_contact_phone || CONTACT_INFO_FALLBACK.phone,
      whatsapp: about?.shop_whatsapp_number || CONTACT_INFO_FALLBACK.whatsapp,
      addressLine1: about?.shop_address_line1 || CONTACT_INFO_FALLBACK.addressLine1,
      addressLine2:
        [about?.shop_address_city, about?.shop_address_country]
          .filter(Boolean)
          .join(", ") || CONTACT_INFO_FALLBACK.addressLine2,
      hours:
        Array.isArray(about?.shop_hours) && about.shop_hours.length > 0
          ? about.shop_hours
              .map((h) => `${h.day || ""}: ${h.hours || ""}`.trim())
              .join(" | ")
          : CONTACT_INFO_FALLBACK.hours,
      socials: {
        instagram:
          about?.shop_social_instagram || CONTACT_INFO_FALLBACK.socials.instagram,
        facebook:
          about?.shop_social_facebook || CONTACT_INFO_FALLBACK.socials.facebook,
        tiktok: about?.shop_social_tiktok || CONTACT_INFO_FALLBACK.socials.tiktok,
      },
    }),
    [about]
  );

  const reduced = useReducedMotion();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: SUBJECT_OPTIONS[0],
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const whatsappDigits = useMemo(
    () => (CONTACT_INFO.whatsapp || "").replace(/\D/g, ""),
    [CONTACT_INFO.whatsapp]
  );
  const messageCount = formData.message.length;
  const messageMax = 500;

  useEffect(() => {
    setErrors(validateContact(formData, touched));
  }, [formData, touched]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allTouched = { name: true, email: true, message: true };
    setTouched(allTouched);
    const fresh = validateContact(formData, allTouched);
    setErrors(fresh);
    if (Object.keys(fresh).length > 0) return;

    setIsSubmitting(true);
    setStatus({ type: "idle", message: "" });
    try {
      await axios.post(`${API_BASE}/contact`, formData);
      setStatus({
        type: "success",
        message: "Your note is with the atelier. We'll write back within hours.",
      });
      setFormData({
        name: "",
        email: "",
        subject: SUBJECT_OPTIONS[0],
        message: "",
      });
      setTouched({});
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Couldn't send your note. Try again or reach us on WhatsApp.";
      setStatus({ type: "error", message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputBase =
    "mt-2 w-full bg-transparent border-b py-3 text-[#e5e2e1] placeholder:text-[#574500] outline-none se-body text-base transition-colors";
  const inputOk = "border-[#4d4635] focus:border-[#f2ca50]";
  const inputErr = "border-[#ffb4ab] focus:border-[#ffb4ab]";

  return (
    <div className="bg-[#0a0a0a] text-[#e5e2e1] se-body min-h-screen overflow-x-hidden">
      <ScrollProgress />

      {/* HERO ── editorial cover */}
      <section className="relative min-h-[68vh] md:min-h-[78vh] overflow-hidden flex items-end">
        <motion.div
          className="absolute inset-0 overflow-hidden"
          initial={{ scale: 1.08, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: reduced ? 0.4 : 1.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <img
            src={HERO_IMAGE}
            alt=""
            className="w-full h-full object-cover"
            loading="eager"
          />
          <motion.div
            className="absolute inset-0"
            animate={!reduced ? { scale: [1, 1.04] } : {}}
            transition={{ duration: 22, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/75 via-transparent to-[#0a0a0a]/30" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_30%,rgba(242,202,80,0.10),transparent_55%)]" />
        </motion.div>

        {/* Hairline frame */}
        {[
          { c: "top-3 md:top-6 left-3 md:left-6 right-3 md:right-6 h-px origin-left", k: "scaleX", t: 0.1 },
          { c: "bottom-3 md:bottom-6 left-3 md:left-6 right-3 md:right-6 h-px origin-right", k: "scaleX", t: 0.2 },
          { c: "top-3 md:top-6 bottom-3 md:bottom-6 left-3 md:left-6 w-px origin-top", k: "scaleY", t: 0.25 },
          { c: "top-3 md:top-6 bottom-3 md:bottom-6 right-3 md:right-6 w-px origin-bottom", k: "scaleY", t: 0.3 },
        ].map((f, i) => (
          <motion.div
            key={i}
            className={`absolute ${f.c} bg-[#e5e2e1]/15`}
            initial={{ [f.k]: 0 }}
            animate={{ [f.k]: 1 }}
            transition={{ duration: 1, delay: f.t, ease: [0.65, 0, 0.35, 1] }}
          />
        ))}

        {/* Top corner labels */}
        <motion.div
          className="absolute top-8 md:top-12 left-8 md:left-12 right-8 md:right-12 flex items-start justify-between"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
        >
          <Eyebrow tone="muted" size="sm">Contact · The atelier</Eyebrow>
          <Eyebrow tone="muted" size="sm">Replies · Within hours</Eyebrow>
        </motion.div>

        <div className="relative w-full px-5 md:px-12 lg:px-16 pb-14 md:pb-20 lg:pb-24 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
          >
            <Eyebrow tone="gold" size="md">Reach us</Eyebrow>
          </motion.div>

          <h1 className="mt-5 md:mt-7 se-serif text-[#fafafa] leading-[0.92] text-5xl sm:text-7xl md:text-[100px] lg:text-[130px] max-w-5xl">
            <span className="block overflow-hidden">
              <motion.span
                className="block"
                initial={{ y: "110%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 0.85, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                Write to
              </motion.span>
            </span>
            <span className="block overflow-hidden">
              <motion.span
                className="block"
                initial={{ y: "110%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 0.85, delay: 0.85, ease: [0.22, 1, 0.36, 1] }}
              >
                the atelier.
              </motion.span>
            </span>
          </h1>

          <motion.div
            className="mt-7 md:mt-9 h-px bg-[#f2ca50] origin-left"
            style={{ width: 84 }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.7, delay: 1.05, ease: [0.65, 0, 0.35, 1] }}
          />

          <motion.p
            className="mt-6 max-w-xl se-body text-[#d0c5af] text-base md:text-lg leading-relaxed"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.2 }}
          >
            For orders, returns, press, or simply to ask. Replies arrive between
            nine and seven, Sri Lankan time — usually within a few hours.
          </motion.p>
        </div>

        {/* Bottom-left status */}
        <motion.div
          className="absolute bottom-3 md:bottom-6 left-8 md:left-12 flex items-center gap-2 se-mono text-[10px] text-[#574500]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.6 }}
        >
          <motion.span
            className="w-1.5 h-1.5 rounded-full bg-[#f2ca50]"
            animate={!reduced ? { opacity: [1, 0.3, 1] } : {}}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
          Atelier · Open
        </motion.div>
      </section>

      {/* MARQUEE */}
      <Marquee
        tone="gold"
        items={[
          "Replies within hours",
          "WhatsApp · 09:00 — 19:00 IST",
          "Made in Sri Lanka",
          "Members enter first",
          "Orders · returns · press",
        ]}
      />

      {/* BRAND MOMENT ── animated solar logo */}
      <section className="relative bg-[#0a0a0a] border-b border-[#4d4635]/40 overflow-hidden">
        {/* Soft ambient gold gradient backdrop */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 50%, rgba(242,202,80,0.06) 0%, rgba(212,175,55,0.02) 40%, transparent 70%)",
          }}
        />
        {/* Subtle grain */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), radial-gradient(rgba(0,0,0,0.4) 1px, transparent 1px)",
            backgroundSize: "3px 3px, 4px 4px",
            backgroundPosition: "0 0, 1px 2px",
          }}
        />

        <div className="relative px-5 md:px-12 py-20 md:py-28 max-w-7xl mx-auto flex flex-col items-center">
          <Reveal>
            <Eyebrow tone="gold" size="md">A note</Eyebrow>
          </Reveal>
          <Reveal delay={0.06}>
            <h2 className="mt-3 se-serif text-[#e5e2e1] text-center leading-[1.0] text-2xl md:text-4xl max-w-lg mx-auto">
              You're writing to a small atelier — please write at our pace.
            </h2>
          </Reveal>

          <div className="mt-12 md:mt-16 flex justify-center">
            <AnimatedLogo
              diameter={420}
              eyebrow="ATELIER · OPEN"
              caption="WE READ EVERY NOTE"
            />
          </div>

          <Reveal delay={0.4}>
            <div className="mt-20 md:mt-24 flex items-center gap-4">
              <Hairline tone="strong" className="w-10" />
              <span className="se-label text-[10px] tracking-[0.32em] text-[#99907c]">
                Replies within hours · 09:00 — 19:00 IST
              </span>
              <Hairline tone="strong" className="w-10" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* QUICK CHANNELS ── 3 hairline cards */}
      <section className="px-5 md:px-12 py-16 md:py-24 max-w-7xl mx-auto">
        <Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#4d4635]/40 border border-[#4d4635]/40">
            {/* WhatsApp */}
            <a
              href={
                whatsappDigits
                  ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent("Hi Saga Elite")}`
                  : "#"
              }
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-[#0a0a0a] p-7 md:p-9 transition-colors hover:bg-[#131313]"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 border border-[#4d4635] flex items-center justify-center text-[#a8d8b6]">
                  <MessageCircle size={18} strokeWidth={1.5} />
                </div>
                <ArrowUpRight
                  size={16}
                  strokeWidth={1.25}
                  className="text-[#99907c] transition-all group-hover:text-[#f2ca50] group-hover:translate-x-1 group-hover:-translate-y-1"
                />
              </div>
              <Eyebrow tone="muted" size="xs" className="mt-7 block">WhatsApp</Eyebrow>
              <div className="mt-2 se-mono text-base md:text-lg text-[#e5e2e1]">
                {CONTACT_INFO.phone}
              </div>
              <Hairline className="mt-5" />
              <span className="block mt-5 se-body text-xs md:text-sm text-[#d0c5af]">
                Fastest. We reply within an hour during atelier hours.
              </span>
            </a>

            {/* Email */}
            <a
              href={`mailto:${CONTACT_INFO.email}`}
              className="group bg-[#0a0a0a] p-7 md:p-9 transition-colors hover:bg-[#131313]"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 border border-[#4d4635] flex items-center justify-center text-[#f2ca50]">
                  <Mail size={18} strokeWidth={1.5} />
                </div>
                <ArrowUpRight
                  size={16}
                  strokeWidth={1.25}
                  className="text-[#99907c] transition-all group-hover:text-[#f2ca50] group-hover:translate-x-1 group-hover:-translate-y-1"
                />
              </div>
              <Eyebrow tone="muted" size="xs" className="mt-7 block">Email</Eyebrow>
              <div className="mt-2 se-mono text-base md:text-lg text-[#e5e2e1] break-all">
                {CONTACT_INFO.email}
              </div>
              <Hairline className="mt-5" />
              <span className="block mt-5 se-body text-xs md:text-sm text-[#d0c5af]">
                For longer notes, returns, or wholesale.
              </span>
            </a>

            {/* Instagram DM */}
            <a
              href={CONTACT_INFO.socials.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-[#0a0a0a] p-7 md:p-9 transition-colors hover:bg-[#131313]"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 border border-[#4d4635] flex items-center justify-center text-[#f2ca50]">
                  <InstagramGlyph className="h-4 w-4" />
                </div>
                <ArrowUpRight
                  size={16}
                  strokeWidth={1.25}
                  className="text-[#99907c] transition-all group-hover:text-[#f2ca50] group-hover:translate-x-1 group-hover:-translate-y-1"
                />
              </div>
              <Eyebrow tone="muted" size="xs" className="mt-7 block">Instagram</Eyebrow>
              <div className="mt-2 se-mono text-base md:text-lg text-[#e5e2e1]">
                @sagaaelite
              </div>
              <Hairline className="mt-5" />
              <span className="block mt-5 se-body text-xs md:text-sm text-[#d0c5af]">
                DM us anytime. Photos welcome.
              </span>
            </a>
          </div>
        </Reveal>
      </section>

      {/* MAIN FORM ── 5/7 split */}
      <section className="border-y border-[#4d4635]/40 bg-[#0e0e0e]">
        <div className="px-5 md:px-12 py-16 md:py-28 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            {/* Left: meta panel */}
            <Reveal className="lg:col-span-5">
              <Eyebrow tone="gold" size="md">Send a note</Eyebrow>
              <h2 className="mt-3 se-serif text-[#e5e2e1] leading-[1.0] text-3xl md:text-5xl">
                Tell us<br />everything.
              </h2>
              <p className="mt-6 se-body text-[#d0c5af] text-sm md:text-base leading-relaxed max-w-md">
                Use this form for anything you'd rather not say in a DM. Order
                numbers, screenshots, the long story. We read every note ourselves.
              </p>

              {/* Hours card */}
              <div className="mt-10 border border-[#4d4635]">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-[#4d4635]/60">
                  <Clock size={14} strokeWidth={1.5} className="text-[#f2ca50]" />
                  <Eyebrow tone="gold" size="xs">Atelier hours</Eyebrow>
                </div>
                {HOURS.map(([k, v], i) => (
                  <div
                    key={k}
                    className={`flex items-baseline justify-between gap-4 px-5 py-3 ${
                      i < HOURS.length - 1 ? "border-b border-[#4d4635]/60" : ""
                    }`}
                  >
                    <Eyebrow tone="muted" size="xs">{k}</Eyebrow>
                    <span className="se-mono text-sm text-[#e5e2e1] tabular-nums">{v}</span>
                  </div>
                ))}
              </div>

              <p className="mt-6 se-body text-xs text-[#574500]">
                Response time · within 2–4 hours on business days
              </p>
            </Reveal>

            {/* Right: form */}
            <Reveal className="lg:col-span-7" delay={0.1}>
              <form onSubmit={handleSubmit} noValidate className="space-y-7">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Eyebrow tone="muted" size="xs">Name</Eyebrow>
                    <input
                      type="text"
                      name="name"
                      autoComplete="name"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                      placeholder="As you'd like to be addressed"
                      aria-invalid={Boolean(touched.name && errors.name)}
                      className={`${inputBase} ${touched.name && errors.name ? inputErr : inputOk}`}
                    />
                    <FieldError>{touched.name ? errors.name : null}</FieldError>
                  </div>
                  <div>
                    <Eyebrow tone="muted" size="xs">Email</Eyebrow>
                    <input
                      type="email"
                      name="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                      placeholder="your.name@email.com"
                      aria-invalid={Boolean(touched.email && errors.email)}
                      className={`${inputBase} ${touched.email && errors.email ? inputErr : inputOk}`}
                    />
                    <FieldError>{touched.email ? errors.email : null}</FieldError>
                  </div>
                </div>

                {/* Subject ── pill selector */}
                <div>
                  <Eyebrow tone="muted" size="xs">Subject</Eyebrow>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {SUBJECT_OPTIONS.map((opt) => {
                      const sel = formData.subject === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, subject: opt }))}
                          aria-pressed={sel}
                          className={`px-4 py-2 se-label text-[10px] tracking-[0.18em] border transition-colors ${
                            sel
                              ? "bg-[#f2ca50] text-[#1b1c1c] border-[#e9c349]"
                              : "bg-transparent text-[#d0c5af] border-[#4d4635] hover:bg-[#1c1b1b] hover:border-[#99907c]"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <div className="flex items-baseline justify-between">
                    <Eyebrow tone="muted" size="xs">Message</Eyebrow>
                    <span
                      className={`se-mono text-[10px] tabular-nums ${
                        messageCount > messageMax * 0.9
                          ? "text-[#ffb4ab]"
                          : "text-[#574500]"
                      }`}
                    >
                      {messageCount} / {messageMax}
                    </span>
                  </div>
                  <textarea
                    name="message"
                    rows={6}
                    maxLength={messageMax}
                    value={formData.message}
                    onChange={handleChange}
                    onBlur={() => setTouched((t) => ({ ...t, message: true }))}
                    placeholder="The story, in your own words."
                    aria-invalid={Boolean(touched.message && errors.message)}
                    className={`mt-2 w-full bg-transparent border py-3 px-4 text-[#e5e2e1] placeholder:text-[#574500] outline-none se-body text-base leading-relaxed transition-colors resize-y min-h-[140px] ${
                      touched.message && errors.message ? inputErr : inputOk
                    }`}
                  />
                  <FieldError>{touched.message ? errors.message : null}</FieldError>
                </div>

                {/* Status messages */}
                <AnimatePresence mode="wait">
                  {status.type === "success" && (
                    <motion.div
                      key="ok"
                      initial={{ opacity: 0, y: -4, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -4, height: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="border border-[#a8d8b6]/40 bg-[#a8d8b6]/5 px-5 py-4 flex items-start gap-3">
                        <CheckCircle2
                          size={16}
                          strokeWidth={1.75}
                          className="mt-0.5 shrink-0 text-[#a8d8b6]"
                        />
                        <span className="se-body text-sm text-[#a8d8b6] leading-relaxed">
                          {status.message}
                        </span>
                      </div>
                    </motion.div>
                  )}
                  {status.type === "error" && (
                    <motion.div
                      key="err"
                      initial={{ opacity: 0, y: -4, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -4, height: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="border border-[#ffb4ab]/40 bg-[#ffb4ab]/5 px-5 py-4 flex items-start gap-3">
                        <span className="se-body text-sm text-[#ffb4ab] leading-relaxed">
                          {status.message}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <span className="se-body text-xs text-[#574500] max-w-md">
                    By sending this, you agree we may reply by email or WhatsApp.
                  </span>
                  <Btn
                    variant="default"
                    size="lg"
                    iconRight={isSubmitting ? Loader2 : ArrowRight}
                    type="submit"
                    disabled={isSubmitting}
                    className={isSubmitting ? "[&_svg]:animate-spin" : ""}
                  >
                    {isSubmitting ? "Sending" : "Send the note"}
                  </Btn>
                </div>
              </form>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ATELIER ADDRESS LEDGER */}
      <section className="px-5 md:px-12 py-16 md:py-24 max-w-7xl mx-auto">
        <Reveal>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
            <div className="lg:col-span-7">
              <Eyebrow tone="gold" size="md">Coordinates</Eyebrow>
              <h2 className="mt-3 se-serif text-[#e5e2e1] leading-[1.0] text-3xl md:text-5xl lg:text-6xl">
                Find us on a map,<br />or on a slow walk.
              </h2>
            </div>
            <div className="lg:col-span-5">
              <a
                href={
                  whatsappDigits
                    ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent("Hi Saga Elite, I'd like to visit the atelier.")}`
                    : `mailto:${CONTACT_INFO.email}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <Btn variant="outline" size="lg" iconRight={ArrowRight}>
                  Book a visit
                </Btn>
              </a>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="mt-10 md:mt-14 grid grid-cols-1 md:grid-cols-2 gap-px bg-[#4d4635]/40 border border-[#4d4635]/40">
            {/* Where */}
            <div className="bg-[#0a0a0a] p-7 md:p-9 flex flex-col">
              <div className="flex items-center gap-3">
                <MapPin size={14} strokeWidth={1.5} className="text-[#f2ca50]" />
                <Eyebrow tone="gold" size="xs">Where</Eyebrow>
              </div>
              <span className="mt-5 se-headline text-[#e5e2e1] text-2xl md:text-3xl">
                {CONTACT_INFO.addressLine1}
              </span>
              <span className="mt-1 se-body text-[#99907c]">{CONTACT_INFO.addressLine2}</span>
              <Hairline className="mt-6" />
              <p className="mt-5 se-body text-xs md:text-sm text-[#d0c5af] leading-relaxed">
                Open by appointment on Saturdays. Members may visit any weekday by
                arrangement.
              </p>
            </div>

            {/* Reach */}
            <div className="bg-[#0a0a0a] p-7 md:p-9 flex flex-col">
              <div className="flex items-center gap-3">
                <MessageCircle size={14} strokeWidth={1.5} className="text-[#f2ca50]" />
                <Eyebrow tone="gold" size="xs">Reach</Eyebrow>
              </div>
              <div className="mt-5 space-y-4">
                <div className="flex items-baseline justify-between gap-4">
                  <Eyebrow tone="muted" size="xs">Email</Eyebrow>
                  <div className="flex items-center">
                    <a
                      href={`mailto:${CONTACT_INFO.email}`}
                      className="se-mono text-sm text-[#f2ca50] hover:text-[#ffe088] transition-colors break-all"
                    >
                      {CONTACT_INFO.email}
                    </a>
                    <CopyButton value={CONTACT_INFO.email} label="email" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <Eyebrow tone="muted" size="xs">Phone</Eyebrow>
                  <div className="flex items-center">
                    <a
                      href={`tel:${CONTACT_INFO.phone}`}
                      className="se-mono text-sm text-[#e5e2e1]"
                    >
                      {CONTACT_INFO.phone}
                    </a>
                    <CopyButton value={CONTACT_INFO.phone} label="phone" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <Eyebrow tone="muted" size="xs">WhatsApp</Eyebrow>
                  <a
                    href={
                      whatsappDigits
                        ? `https://wa.me/${whatsappDigits}`
                        : "#"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="se-mono text-sm text-[#a8d8b6] hover:text-[#c5e6cf] transition-colors"
                  >
                    Open chat
                  </a>
                </div>
              </div>
              <Hairline className="mt-6" />
              <p className="mt-5 se-body text-xs md:text-sm text-[#d0c5af] leading-relaxed">
                We reply between nine and seven, Sri Lankan time. Outside hours,
                we'll write back the next morning.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* SOCIALS ── editorial 3-up */}
      <section className="border-t border-[#4d4635]/40 bg-[#0e0e0e]">
        <div className="px-5 md:px-12 py-16 md:py-24 max-w-7xl mx-auto">
          <Reveal>
            <Eyebrow tone="gold" size="md">Follow</Eyebrow>
            <h2 className="mt-3 se-serif text-[#e5e2e1] leading-[1.0] text-3xl md:text-5xl">
              From the atelier<br />floor.
            </h2>
          </Reveal>

          <div className="mt-10 md:mt-14 grid grid-cols-1 md:grid-cols-3 gap-px bg-[#4d4635]/40">
            {[
              {
                href: CONTACT_INFO.socials.instagram,
                handle: "@sagaaelite",
                label: "Instagram",
                Glyph: InstagramGlyph,
                hint: "Daily photographs",
              },
              {
                href: CONTACT_INFO.socials.facebook,
                handle: "Saga Elite",
                label: "Facebook",
                Glyph: FacebookGlyph,
                hint: "The longer journal",
              },
              {
                href: CONTACT_INFO.socials.tiktok,
                handle: "@sagaa_elite",
                label: "TikTok",
                Glyph: TikTokGlyph,
                hint: "From the floor",
              },
            ].map((s, i) => (
              <Reveal key={s.label} delay={i * 0.06} className="bg-[#0a0a0a]">
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block p-7 md:p-10 h-full transition-colors hover:bg-[#131313]"
                >
                  <div className="flex items-start justify-between">
                    <s.Glyph className="h-7 w-7 text-[#f2ca50]" />
                    <ArrowUpRight
                      size={18}
                      strokeWidth={1.25}
                      className="text-[#99907c] transition-all group-hover:text-[#f2ca50] group-hover:translate-x-1 group-hover:-translate-y-1"
                    />
                  </div>
                  <Eyebrow tone="muted" size="xs" className="mt-8 block">
                    {s.label}
                  </Eyebrow>
                  <div className="mt-2 se-headline text-[#e5e2e1] text-2xl md:text-3xl">
                    {s.handle}
                  </div>
                  <Hairline className="mt-5" />
                  <span className="block mt-5 se-body text-xs md:text-sm text-[#d0c5af]">
                    {s.hint}
                  </span>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CLOSING NOTE */}
      <section className="px-5 md:px-12 py-16 md:py-24 max-w-7xl mx-auto">
        <Reveal>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <Eyebrow tone="gold" size="md">Once more</Eyebrow>
              <h2 className="mt-4 se-serif text-[#e5e2e1] leading-[0.95] text-4xl md:text-6xl">
                We read every note,<br />ourselves.
              </h2>
              <p className="mt-6 se-body text-[#d0c5af] text-base md:text-lg max-w-2xl leading-relaxed">
                There is no support team. There is the atelier. So please write as
                though you're writing to a tailor — patiently, and we'll do the same back.
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-wrap items-center gap-4 lg:justify-end">
              <Link to="/about">
                <Btn variant="outline" size="lg">Read the journal</Btn>
              </Link>
              <Link to="/shopping/product-list">
                <Btn variant="default" size="lg" iconRight={ArrowRight}>
                  Browse the atelier
                </Btn>
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
};

export default ContactPage;
