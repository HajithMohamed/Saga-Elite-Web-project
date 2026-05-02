import React, { useMemo, useState } from "react";
import axios from "axios";
import { Loader2, Instagram, Facebook } from "lucide-react";
import LegalLayout from "@/components/Legal/LegalLayout";
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

  const whatsappNumber = useMemo(
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

  return (
    <LegalLayout title="Contact Us">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <section className="space-y-5">
          <h2 id="contact-information" className="text-xl font-semibold text-white">
            Contact information
          </h2>
          <div className="grid gap-4">
            <a
              href={`mailto:${CONTACT_INFO.email}`}
              className="rounded border border-white/10 bg-[#0f0f0f] px-5 py-4 transition-colors hover:border-[#D4AF37]/50"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                Email
              </p>
              <p className="mt-2 text-sm text-white">{CONTACT_INFO.email}</p>
            </a>
            <a
              href={`https://wa.me/${whatsappNumber}`}
              className="rounded border border-white/10 bg-[#0f0f0f] px-5 py-4 transition-colors hover:border-[#D4AF37]/50"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                Phone / WhatsApp
              </p>
              <p className="mt-2 text-sm text-white">{CONTACT_INFO.phone}</p>
            </a>
            <div className="rounded border border-white/10 bg-[#0f0f0f] px-5 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                Social Media
              </p>
              <div className="mt-4 flex gap-4">
                <a
                  href={CONTACT_INFO.socials.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="text-white/60 hover:text-[#D4AF37] transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                  <span className="sr-only">Instagram</span>
                </a>
                <a
                  href={CONTACT_INFO.socials.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="text-white/60 hover:text-[#D4AF37] transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                  <span className="sr-only">Facebook</span>
                </a>
                <a
                  href={CONTACT_INFO.socials.tiktok}
                  target="_blank"
                  rel="noreferrer"
                  className="text-white/60 hover:text-[#D4AF37] transition-colors"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
                  </svg>
                  <span className="sr-only">TikTok</span>
                </a>
              </div>
            </div>
            <div className="rounded border border-white/10 bg-[#0f0f0f] px-5 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                Operating Hours
              </p>
              <p className="mt-2 text-sm text-white">{CONTACT_INFO.hours}</p>
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <h2 id="contact-form" className="text-xl font-semibold text-white">
            Send a message
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm text-white/80">
                Full name
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded border border-white/10 bg-black px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </label>
              <label className="text-sm text-white/80">
                Email address
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded border border-white/10 bg-black px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </label>
            </div>

            <label className="text-sm text-white/80">
              Subject
              <select
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="mt-2 w-full rounded border border-white/10 bg-black px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
              >
                {SUBJECT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-white/80">
              Message
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                maxLength={500}
                rows={6}
                required
                className="mt-2 w-full rounded border border-white/10 bg-black px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
              />
              <div className="mt-1 text-right text-xs text-white/50">
                {messageCount}/500
              </div>
            </label>

            {status.type !== "idle" && (
              <div
                className={`rounded border px-4 py-3 text-sm ${
                  status.type === "success"
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                    : "border-red-500/40 bg-red-500/10 text-red-200"
                }`}
                role="status"
                aria-live="polite"
              >
                {status.message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded border border-[#D4AF37]/40 px-5 py-2 text-xs uppercase tracking-[0.2em] text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending
                </>
              ) : (
                "Submit"
              )}
            </button>
          </form>
        </section>
      </div>
    </LegalLayout>
  );
};

export default ContactPage;
