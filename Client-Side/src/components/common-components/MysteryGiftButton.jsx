import React, { useState } from "react";
import { useLocation } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { Gift, X, Sparkles } from "lucide-react";

// Storefront "Mystery Gift" widget — a floating glass button that opens a
// premium popup. Replaces the old WhatsApp floating button. Mirrors the gold /
// dark styling of the hero "Mystery Gift" panel for visual consistency.

const GIFT_PERKS = [
  "Premium Accessories",
  "Exclusive Merchandise",
  "Discount Coupons",
  "Limited Edition Items",
  "Member Rewards",
];

const MysteryGiftButton = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // Storefront only — never on the admin dashboard, and never during the
  // standalone checkout / payment flow (those pages are intentionally
  // distraction-free, with no surrounding chrome).
  const CHECKOUT_FLOW_PATHS = [
    "/shopping/checkout",
    "/shopping/manual-payment",
    "/shopping/card-payment",
    "/shopping/find-payment",
  ];
  const inCheckoutFlow = CHECKOUT_FLOW_PATHS.some((p) =>
    location.pathname.startsWith(p)
  );
  if (location.pathname.startsWith("/admin") || inCheckoutFlow) {
    return null;
  }

  // The shopping layout renders a fixed mobile bottom nav (h-16, `md:hidden`)
  // on `/shopping/*`. Lift the button above it on small screens so they don't
  // overlap; on md+ (no bottom nav) and on public pages keep the default offset.
  const onShopping = location.pathname.startsWith("/shopping");
  const positionClass = onShopping
    ? "bottom-24 right-6 md:bottom-6"
    : "bottom-6 right-6";

  return (
    <>
      {/* Floating action button */}
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open your mystery gift"
        title="Every order includes a mystery gift"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
        transition={{
          opacity: { duration: 0.4, delay: 1.2 },
          scale: { duration: 0.4, delay: 1.2 },
          y: { duration: 4.5, repeat: Infinity, ease: "easeInOut" },
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className={`fixed ${positionClass} z-50 flex h-14 w-14 items-center justify-center rounded-full border border-gold-ink2/40 bg-page/80 text-gold-ink shadow-[0_10px_30px_rgba(0,0,0,0.55)] backdrop-blur-md transition-shadow hover:shadow-[0_0_28px_rgba(212,175,55,0.45)] focus:outline-none focus:ring-2 focus:ring-gold-ink2/60`}
      >
        {/* Pulsing gold ring */}
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full border border-gold-ink2/50"
          animate={{ scale: [1, 1.5], opacity: [0.55, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
        />
        <Sparkles
          aria-hidden="true"
          className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 text-gold-ink2"
        />
        <Gift className="h-6 w-6" />
      </motion.button>

      {/* Popup */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Overlay */}
            <motion.div
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Panel */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Mystery gift details"
              initial={{ opacity: 0, scale: 0.96, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 18 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-gold-ink2/30 bg-gradient-to-b from-card to-page p-7 text-center shadow-2xl"
            >
              {/* Ambient gold glow */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-gold-deep/10 blur-3xl"
              />

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-ink/5 hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-gold-ink2/40 bg-gold-deep/10 text-gold-ink">
                  <Gift className="h-7 w-7" />
                </div>

                <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-gold-ink2">
                  Saga Elite
                </p>
                <h2 className="mt-2 font-display text-2xl uppercase tracking-wide text-ink">
                  Every Order Includes a Mystery Gift
                </h2>

                <p className="mt-4 text-sm leading-relaxed text-ink/70">
                  Every purchase from Saga Elite includes a complimentary mystery
                  gift. The surprise is revealed only after your order is
                  successfully delivered. You never know what you&apos;ll receive.
                </p>

                <p className="mt-6 text-left font-mono text-[10px] uppercase tracking-[0.3em] text-ink/40">
                  It could be
                </p>
                <ul className="mt-3 space-y-2 text-left">
                  {GIFT_PERKS.map((perk) => (
                    <li
                      key={perk}
                      className="flex items-center gap-3 text-sm text-ink/80"
                    >
                      <span className="h-1.5 w-1.5 rotate-45 bg-gold-deep" />
                      {perk}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mt-7 w-full rounded-full bg-gold-deep py-3 text-xs font-semibold uppercase tracking-[0.25em] text-ongold transition-colors hover:bg-gold"
                >
                  Continue Shopping
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MysteryGiftButton;
