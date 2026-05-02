import React, { useMemo, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Mail,
  Clock,
  CheckCircle2,
  MessageCircle,
} from "lucide-react";
import usePageMeta from "@/hooks/use-page-meta";
import { CONTACT_INFO } from "@/config";
import { API_V1_URL as API_BASE } from "@/lib/api";

const SUBJECT_OPTIONS = [
  "Order inquiry",
  "Return request",
  "Payment issue",
  "General question",
  "Other",
];

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

const ContactPage = () => {
  usePageMeta({
    title: "Contact Us",
    description:
      "Get in touch with Saga Elite for orders, returns, payments, or general inquiries.",
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: SUBJECT_OPTIONS[0],
    message: "",
  });
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const whatsappDigits = useMemo(
    () => CONTACT_INFO.whatsapp.replace(/\D/g, ""),
    []
  );

  const messageCount = formData.message.length;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: "idle", message: "" });

    try {
      await axios.post(`${API_BASE}/contact`, formData);
      setStatus({
        type: "success",
        message:
          "Thanks for reaching out. We have received your message and will respond shortly.",
      });
      setFormData({
        name: "",
        email: "",
        subject: SUBJECT_OPTIONS[0],
        message: "",
      });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        "Unable to send your message. Please try again.";
      setStatus({ type: "error", message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const cardClass =
    "flex flex-col rounded-xl border border-[#D4AF37]/20 bg-surface-container-low p-6 transition-shadow hover:shadow-[0_0_30px_rgba(212,175,55,0.1)] dark:bg-surface-container-low";

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <section className="border-b border-border bg-black py-16 text-center text-white md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="container mx-auto max-w-7xl px-4 md:px-6"
        >
          <h1 className="font-serif text-5xl font-bold md:text-[64px] md:leading-tight">
            Let&apos;s Talk
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/75">
            We&apos;re always here for our community.
          </p>
        </motion.div>
      </section>

      <div className="container mx-auto max-w-7xl px-4 py-14 md:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          <motion.a
            href={`https://wa.me/${whatsappDigits}?text=${encodeURIComponent("Hi Saga Elite")}`}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.02 }}
            className={`${cardClass} motion-safe:hover:scale-[1.02]`}
          >
            <MessageCircle className="mb-4 h-10 w-10 text-emerald-500" />
            <p className="font-mono text-lg font-semibold text-[#D4AF37]">
              {CONTACT_INFO.phone}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Message us on WhatsApp
            </p>
          </motion.a>

          <motion.a
            href={`mailto:${CONTACT_INFO.email}`}
            whileHover={{ scale: 1.02 }}
            className={cardClass}
          >
            <Mail className="mb-4 h-10 w-10 text-[#D4AF37]" />
            <p className="break-all text-lg font-semibold">{CONTACT_INFO.email}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Send us an email
            </p>
          </motion.a>

          <motion.a
            href={CONTACT_INFO.socials.instagram}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.02 }}
            className={cardClass}
          >
            <InstagramGlyph className="mb-4 h-10 w-10 text-[#D4AF37]" />
            <p className="text-lg font-semibold">@sagaaelite</p>
            <p className="mt-2 text-sm text-muted-foreground">DM us anytime</p>
          </motion.a>
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-[1fr_1.25fr]">
          <section className="space-y-4 rounded-xl border border-border bg-muted/20 p-8 dark:bg-surface-container-low/40">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#D4AF37]" />
              <h2 className="font-serif text-xl font-semibold">
                Business Hours
              </h2>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Mon–Fri: 9:00 AM – 6:00 PM (Sri Lanka Time)</li>
              <li>Sat: 10:00 AM – 4:00 PM</li>
              <li>Sunday: Closed</li>
            </ul>
            <p className="text-sm text-on-surface/80">
              Response time is typically within 2–4 hours on business days.
            </p>
          </section>

          <section>
            <h2 className="mb-6 font-serif text-2xl font-semibold">
              Send a message
            </h2>
            <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="text-muted-foreground">Full name</span>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  />
                </label>
                <label className="text-sm">
                  <span className="text-muted-foreground">Email</span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  />
                </label>
              </div>

              <label className="text-sm">
                <span className="text-muted-foreground">Subject</span>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                >
                  {SUBJECT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm">
                <span className="text-muted-foreground">Message</span>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  maxLength={500}
                  rows={6}
                  required
                  className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
                <div className="mt-1 text-right text-xs text-muted-foreground">
                  {messageCount}/500
                </div>
              </label>

              <AnimatePresence mode="wait">
                {status.type === "success" ? (
                  <motion.div
                    key="ok"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400"
                  >
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    {status.message}
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {status.type === "error" ? (
                <div
                  className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400"
                  role="alert"
                >
                  {status.message}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF37] py-4 text-xs font-bold uppercase tracking-[0.25em] text-black transition hover:bg-[#c49e30] disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Sending
                  </>
                ) : (
                  "Submit"
                )}
              </button>
            </form>
          </section>
        </div>

        <section className="mt-20 border-t border-border pt-12 text-center">
          <h2 className="font-serif text-2xl font-semibold">
            Find us on social media
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-6">
            <motion.a
              href={CONTACT_INFO.socials.instagram}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.08 }}
              className="rounded-full border border-[#D4AF37]/30 p-5 text-on-surface hover:border-[#D4AF37] hover:text-[#D4AF37]"
              aria-label="Instagram"
            >
              <InstagramGlyph className="h-8 w-8" />
            </motion.a>
            <motion.a
              href={CONTACT_INFO.socials.facebook}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.08 }}
              className="rounded-full border border-[#D4AF37]/30 p-5 text-on-surface hover:border-[#D4AF37] hover:text-[#D4AF37]"
              aria-label="Facebook"
            >
              <FacebookGlyph className="h-8 w-8" />
            </motion.a>
            <motion.a
              href={CONTACT_INFO.socials.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.08 }}
              className="rounded-full border border-[#D4AF37]/30 p-5 text-on-surface hover:border-[#D4AF37] hover:text-[#D4AF37]"
              aria-label="TikTok"
            >
              <TikTokGlyph className="h-8 w-8" />
            </motion.a>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ContactPage;
