import React from "react";
import { motion } from "framer-motion";
import { MessageSquareText, Phone, Mail, Headphones } from "lucide-react";
import { cn } from "@/lib/utils";

const MOTION_EASE = [0.16, 1, 0.3, 1];

const toWhatsAppDigits = (raw) => {
  if (!raw) return "";
  return String(raw).replace(/\D/g, "");
};

const ContactSupportSection = ({
  bankDetails = {},
  referenceNumber,
}) => {
  const whatsappNumber = bankDetails.supportWhatsapp || "+94770704274";
  const phoneNumber = bankDetails.supportPhone || whatsappNumber;
  const emailAddress = bankDetails.supportEmail || "support@sagaelite.com";

  const waDigits = toWhatsAppDigits(whatsappNumber);
  const waMessage = referenceNumber
    ? `Hi Saga Elite — I need help with my manual bank transfer. My payment reference is: ${referenceNumber}.`
    : "Hi Saga Elite — I need help with my manual bank transfer payment.";
  const waHref =
    waDigits.length >= 8
      ? `https://wa.me/${waDigits}?text=${encodeURIComponent(waMessage)}`
      : null;

  const phoneHref = phoneNumber
    ? `tel:${toWhatsAppDigits(phoneNumber)}`
    : null;

  const emailHref = emailAddress ? `mailto:${emailAddress}` : null;

  const buttons = [
    waHref && {
      href: waHref,
      icon: MessageSquareText,
      label: "WhatsApp",
      style:
        "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20",
      external: true,
    },
    phoneHref && {
      href: phoneHref,
      icon: Phone,
      label: "Call",
      style:
        "border-sky-500/30 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20",
      external: false,
    },
    emailHref && {
      href: emailHref,
      icon: Mail,
      label: "Email",
      style:
        "border-[#F2CA50]/30 bg-[#F2CA50]/10 text-[#F2CA50] hover:bg-[#F2CA50]/20",
      external: false,
    },
  ].filter(Boolean);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: MOTION_EASE, delay: 0.35 }}
      className="rounded-[24px] border border-white/10 bg-[#0d0d0d] p-6 sm:p-8"
      aria-label="Contact support"
    >
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
          <Headphones className="h-5 w-5 text-[#d0c5af]" />
        </div>
        <div>
          <h3 className="se-serif text-[22px] text-[#e5e2e1]">Need Help?</h3>
          <p className="se-body mt-0.5 text-sm text-[#99907c]">
            Contact us if you're having trouble verifying your payment.
          </p>
        </div>
      </div>

      {/* Verification time hint */}
      <div className="mb-5 rounded-2xl border border-[#F2CA50]/15 bg-[#F2CA50]/5 px-4 py-3">
        <p className="se-body text-sm leading-6 text-[#d0c5af]">
          <span className="font-semibold text-[#F2CA50]">
            Verification usually takes 1–24 hours
          </span>{" "}
          during business hours. We'll notify you via email and WhatsApp once
          your payment is confirmed.
        </p>
      </div>

      {/* Buttons */}
      <div className="grid gap-3 sm:grid-cols-3">
        {buttons.map((btn) => {
          const Icon = btn.icon;
          return (
            <a
              key={btn.label}
              href={btn.href}
              target={btn.external ? "_blank" : undefined}
              rel={btn.external ? "noopener noreferrer" : undefined}
              className={cn(
                "se-label flex h-[52px] items-center justify-center gap-2 rounded-2xl border text-[10px] tracking-[0.2em] transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2CA50]",
                btn.style
              )}
            >
              <Icon className="h-4 w-4" />
              {btn.label}
            </a>
          );
        })}
      </div>
    </motion.section>
  );
};

export default ContactSupportSection;
