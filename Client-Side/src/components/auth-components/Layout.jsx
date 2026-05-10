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
    {/* Cinematic Video Background */}
    <video
      autoPlay
      loop
      muted
      playsInline
      className="absolute inset-0 w-full h-full object-cover opacity-60"
      poster="/LOGO.png"
    >
      {/* High-quality fashion-oriented placeholder video from Pexels, can be swapped later */}
      <source src="https://videos.pexels.com/video-files/5825708/5825708-hd_1080_1920_24fps.mp4" type="video/mp4" />
    </video>

    {/* Luxury Grain/Noise Texture Overlay */}
    <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC45IiBudW1PY3RhdmVzPSIzIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI24pIiBvcGFjaXR5PSIwLjM1Ii8+PC9zdmc+')] mix-blend-overlay"></div>

    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          "linear-gradient(90deg, rgba(10,10,10,0.4) 0%, rgba(10,10,10,0.9) 100%)",
      }}
    />

    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      className="relative flex flex-col items-center text-center z-10"
    >
      <img
        src="/LOGO.png"
        alt="Saga Elite"
        className="w-56 h-56 lg:w-72 lg:h-72 object-contain select-none pointer-events-none"
        style={{ filter: "drop-shadow(0 8px 32px rgba(242,202,80,0.3))" }}
        draggable={false}
        onError={(e) => (e.currentTarget.style.display = "none")}
      />
      <div className="mt-8">
        <Wordmark size="lg" tagline />
      </div>
      <p className="mt-6 se-body text-sm text-[#e5e2e1] max-w-xs leading-relaxed uppercase tracking-widest">
        Rare Fit Forever
      </p>
      <p className="mt-2 text-xs text-[#99907c] max-w-sm font-light">
        Limited edition collections reserved for the elite. 
      </p>
    </motion.div>
  </aside>
);

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col relative overflow-hidden">
      {/* Global Grain Texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.15] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC45IiBudW1PY3RhdmVzPSIzIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI24pIiBvcGFjaXR5PSIwLjM1Ii8+PC9zdmc+')] mix-blend-overlay z-0"></div>
      
      <div className="relative z-10 w-full">
        <Marquee items={HEADER_MARQUEE} tone="dark" speed={35} />
      </div>

      <div className="flex flex-1 min-h-0 relative z-10">
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
