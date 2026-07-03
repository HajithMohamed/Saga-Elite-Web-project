import React from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Zap,
  Package,
  Heart,
  MessageSquareText,
  Mail,
  HelpCircle,
  ChevronDown
} from "lucide-react";
import useShopAbout from "@/hooks/use-shop-about";
import { cn } from "@/lib/utils";

const MOTION_EASE = [0.16, 1, 0.3, 1];

const FAQ_ITEMS = [
  {
    question: "Why do I need an account?",
    answer: "An account unlocks the full Saga Elite experience: faster checkout, order tracking, exclusive drop access, and the ability to save your wishlist.",
  },
  {
    question: "How do I reset my password?",
    answer: "Click 'Forgot Password' on the login page. We'll send a secure code to your registered email to help you create a new password.",
  },
  {
    question: "I didn't receive my verification code.",
    answer: "Please check your spam or junk folder. If you still can't find it, you can request a new code after the countdown timer expires.",
  },
];

const AccordionItem = ({ item, isOpen, onToggle }) => (
  <div className="border-b border-ink/5 last:border-0">
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:text-gold-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink"
    >
      <span className={cn("se-body text-sm font-medium transition-colors", isOpen ? "text-gold-ink" : "text-ink-2")}>
        {item.question}
      </span>
      <ChevronDown className={cn("h-4 w-4 shrink-0 text-goldshadow transition-transform duration-300", isOpen && "rotate-180 text-gold-ink")} />
    </button>
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: MOTION_EASE }}
          className="overflow-hidden"
        >
          <p className="se-body pb-5 text-sm leading-6 text-muted">{item.answer}</p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const AuthPageWrapper = ({ children, title, description, badgeText = "Secure Authentication" }) => {
  const [openFAQ, setOpenFAQ] = React.useState(null);
  const { data: about } = useShopAbout();
  
  const whatsappRaw = about?.contact?.whatsapp || "+94770704274";
  const whatsappDigits = whatsappRaw.replace(/\D/g, "");
  const whatsappUrl = whatsappDigits ? `https://wa.me/${whatsappDigits}` : null;
  const emailUrl = about?.contact?.email ? `mailto:${about.contact.email}` : "mailto:support@sagaelite.com";

  return (
    <div className="flex min-h-screen flex-col bg-page">
      {/* Hero Section */}
      <section className="relative flex w-full flex-col items-center justify-center overflow-hidden bg-page px-4 py-12 md:py-0 min-h-[220px] sm:min-h-[260px] md:min-h-[320px]">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1542272604-787c38520267?q=80&w=2000&auto=format&fit=crop"
            alt="Saga Elite Editorial"
            className="h-full w-full object-cover object-center opacity-30 blur-[2px]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-page/80 via-page/60 to-page" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: MOTION_EASE }}
          className="relative z-10 text-center max-w-2xl mx-auto mt-6"
        >
          {badgeText && (
            <div className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-gold-ink/20 bg-gold/5 px-3 py-1.5 backdrop-blur-sm">
              <ShieldCheck className="h-3.5 w-3.5 text-gold-ink" />
              <span className="se-label text-[9px] uppercase tracking-[0.25em] text-gold-ink">
                {badgeText}
              </span>
            </div>
          )}
          <h1 className="se-serif text-[32px] sm:text-[40px] md:text-[48px] leading-[1.1] text-ink-2">
            {title}
          </h1>
          {description && (
            <p className="se-body mx-auto mt-4 max-w-md text-sm sm:text-base leading-relaxed text-cream">
              {description}
            </p>
          )}
        </motion.div>
      </section>

      {/* Main Content Area */}
      <main className="relative z-20 flex-1 w-full px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-12 md:-mt-16 pb-24">
        
        {/* Auth Card Container */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: MOTION_EASE, delay: 0.1 }}
          className="mx-auto w-full max-w-[520px] rounded-[24px] border border-ink/10 bg-page/95 backdrop-blur-xl p-6 sm:p-8 md:p-10 shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
        >
          {children}
        </motion.div>

        {/* Trust Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mx-auto mt-12 max-w-[520px]"
        >
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { icon: ShieldCheck, label: "Secure Login" },
              { icon: Zap, label: "Fast Checkout" },
              { icon: Package, label: "Order Tracking" },
              { icon: Heart, label: "Wishlist" },
            ].map((feature, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 text-center opacity-70 transition-opacity hover:opacity-100">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-ink/10 bg-ink/[0.02] text-muted">
                  <feature.icon className="h-4 w-4" />
                </div>
                <span className="se-label text-[9px] uppercase tracking-[0.2em] text-goldshadow">
                  {feature.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mx-auto mt-16 max-w-[520px] rounded-[24px] border border-ink/5 bg-page p-6 sm:p-8"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold-ink/15 bg-gold/5">
              <HelpCircle className="h-5 w-5 text-gold-ink" />
            </div>
            <div>
              <h3 className="se-serif text-[22px] text-ink-2">Need Help?</h3>
              <p className="se-body mt-0.5 text-sm text-muted">
                Contact our concierge team
              </p>
            </div>
          </div>

          {/* Support Buttons */}
          <div className="mb-8 grid grid-cols-2 gap-3">
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-[11px] font-medium uppercase tracking-[0.15em] text-emerald-400 transition-colors hover:bg-emerald-500/20">
                <MessageSquareText className="h-4 w-4" /> WhatsApp
              </a>
            )}
            <a href={emailUrl} className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-gold-ink/20 bg-gold/10 text-[11px] font-medium uppercase tracking-[0.15em] text-gold-ink transition-colors hover:bg-gold/20">
              <Mail className="h-4 w-4" /> Email Us
            </a>
          </div>

          {/* FAQ Accordion */}
          <div className="border-t border-ink/5 pt-2">
            {FAQ_ITEMS.map((item, idx) => (
              <AccordionItem
                key={idx}
                item={item}
                isOpen={openFAQ === idx}
                onToggle={() => setOpenFAQ(openFAQ === idx ? null : idx)}
              />
            ))}
          </div>
        </motion.div>

      </main>
    </div>
  );
};

export default AuthPageWrapper;
