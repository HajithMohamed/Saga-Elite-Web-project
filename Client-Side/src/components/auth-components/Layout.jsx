import React from "react";
import { Link, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Marquee, Wordmark } from "@/components/ui/editorial";

const HEADER_MARQUEE = [
  "Free island-wide delivery",
  "Members enter first",
  "Rare fit, forever",
  "Made in Sri Lanka",
  "New chapter every fortnight",
];

const SimpleBrandPanel = () => (
  <aside className="relative h-full overflow-hidden bg-[#0a0a0a] flex items-center justify-center px-12 py-16">
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          "radial-gradient(ellipse at 50% 50%, rgba(242,202,80,0.10) 0%, rgba(212,175,55,0.04) 35%, rgba(7,7,7,0) 65%)",
      }}
    />

    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex flex-col items-center text-center"
    >
      <img
        src="/LOGO.png"
        alt="Saga Elite"
        className="w-56 h-56 lg:w-72 lg:h-72 object-contain select-none pointer-events-none"
        style={{ filter: "drop-shadow(0 8px 32px rgba(242,202,80,0.15))" }}
        draggable={false}
        onError={(e) => (e.currentTarget.style.display = "none")}
      />
      <div className="mt-6">
        <Wordmark size="lg" tagline />
      </div>
      <p className="mt-6 se-body text-sm text-[#d0c5af] max-w-xs leading-relaxed">
        Limited drops, members-only chapters, made in Sri Lanka.
      </p>
    </motion.div>
  </aside>
);

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <Marquee items={HEADER_MARQUEE} tone="dark" speed={35} />

      <div className="flex flex-1 min-h-0">
        {/* LEFT — simple brand panel (hidden on mobile) */}
        <div className="hidden md:block md:w-[45%] lg:w-[50%]">
          <SimpleBrandPanel />
        </div>

        {/* RIGHT — form panel */}
        <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-12 overflow-y-auto">
          {/* Back to home link — visible on every auth page, top-left of form pane */}
          <Link
            to="/"
            className="absolute top-6 left-6 inline-flex items-center gap-2 se-label text-[10px] tracking-[0.28em] text-[#99907c] hover:text-[#f2ca50] transition-colors"
          >
            <ArrowLeft size={12} strokeWidth={1.5} />
            Back to home
          </Link>

          {/* Mobile logo (only on mobile) */}
          <Link to="/" className="md:hidden mb-8 mt-4 flex items-center gap-3">
            <img
              src="/LOGO.png"
              alt=""
              className="h-8 w-8 object-contain"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
            <Wordmark size="md" />
          </Link>

          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
