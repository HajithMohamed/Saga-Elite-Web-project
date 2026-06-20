import React, { useRef } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { HeroBackdropFX } from "@/components/landing/LandingSections";

// Fullscreen cinematic drop hero. Three.js particles + GSAP char-by-char
// reveal on the drop name. Image fades in slowly under the headline.
const DropHeroCinematic = ({ drop, isLive = false, isExpired = false }) => {
  const headlineRef = useRef(null);

  useGSAP(
    () => {
      if (!headlineRef.current) return;
      const letters = headlineRef.current.querySelectorAll("[data-letter]");
      gsap.fromTo(
        letters,
        { opacity: 0, y: 50, rotateX: -90 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          stagger: 0.04,
          duration: 0.9,
          delay: 0.4,
          ease: "power3.out",
        }
      );
    },
    { scope: headlineRef, dependencies: [drop?.name] }
  );

  if (!drop) return null;

  const heroImage = drop?.images?.[0]?.url;
  const name = drop?.name || "Untitled drop";

  return (
    <section className="relative h-[88vh] min-h-[640px] max-h-[920px] w-full overflow-hidden bg-[#050505]">
      {/* Image */}
      {heroImage ? (
        <motion.img
          src={heroImage}
          alt={name}
          loading="eager"
          fetchpriority="high"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: isExpired ? 0.3 : 0.55, scale: 1 }}
          transition={{ duration: 1.6, ease: "easeOut" }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0e00] via-[#0a0a0a] to-[#000000]" />
      )}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/30 via-[#0a0a0a]/55 to-[#0a0a0a]" />

      {/* Three.js particles — kept subtle so the headline reads cleanly */}
      <div className="absolute inset-0 z-0 opacity-50 pointer-events-none">
        <HeroBackdropFX />
      </div>

      {/* Copy */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="font-mono text-[10px] md:text-[11px] tracking-[0.42em] uppercase text-[#f2ca50] mb-5 flex items-center gap-2"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isExpired
                ? "bg-[#574500]"
                : isLive
                  ? "bg-[#f2ca50] animate-pulse shadow-[0_0_10px_#f2ca50]"
                  : "bg-[#a855f7] animate-pulse shadow-[0_0_10px_#a855f7]"
            }`}
          />
          {isExpired ? "Drop Closed" : isLive ? "Live Drop" : "Coming Soon"}
        </motion.p>

        <h1
          ref={headlineRef}
          className="font-display text-[48px] md:text-[112px] leading-[0.95] uppercase text-[#FAF7F2] tracking-tight mb-5 max-w-5xl"
          style={{ perspective: "800px" }}
        >
          {name.split("").map((ch, i) => (
            <span
              key={i}
              data-letter
              className="inline-block"
              style={{ whiteSpace: ch === " " ? "pre" : "normal" }}
            >
              {ch}
            </span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.1 }}
          className="font-mono text-[11px] md:text-[13px] tracking-[0.5em] uppercase text-[#d0c5af]"
        >
          Rare Fit Forever
        </motion.p>
      </div>

      {/* Subtle scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-12 bg-gradient-to-b from-[#f2ca50] to-transparent"
        />
      </motion.div>
    </section>
  );
};

export default DropHeroCinematic;
