import React from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

// Animated progress bar showing how much of the drop has sold.
// soldPercent computed by parent (DropDetails) from product stocks.
// When undefined or null, the bar hides itself.
const DropAvailabilityBar = ({ soldPercent, totalProducts, totalRemaining }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  if (soldPercent === null || soldPercent === undefined) return null;
  const clamped = Math.max(0, Math.min(100, Math.round(soldPercent)));
  const isHot = clamped >= 70;
  const isCritical = clamped >= 90;

  return (
    <section
      ref={ref}
      className="relative bg-[#050505] py-16 md:py-20 border-y border-[#1a1a1a] overflow-hidden"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[#f2ca50]/6 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        <p
          className={`font-mono text-[10px] tracking-[0.4em] uppercase mb-4 flex items-center justify-center gap-2 ${
            isCritical
              ? "text-[#ffb4ab]"
              : isHot
                ? "text-[#f2ca50]"
                : "text-[#d0c5af]"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isCritical
                ? "bg-[#ffb4ab] animate-pulse"
                : isHot
                  ? "bg-[#f2ca50] animate-pulse"
                  : "bg-[#d0c5af]"
            }`}
          />
          {isCritical
            ? "Almost Gone"
            : isHot
              ? "Selling Fast"
              : "Availability"}
        </p>

        <div className="flex items-baseline justify-center gap-3 mb-8">
          <span className="font-display text-5xl md:text-7xl text-[#FAF7F2] tabular-nums">
            {clamped}
          </span>
          <span className="font-mono text-xl text-[#99907c]">% Sold Out</span>
        </div>

        {/* Progress track */}
        <div className="relative h-2 w-full bg-[#1c1b1b] overflow-hidden rounded-full">
          <motion.div
            initial={{ width: "0%" }}
            animate={inView ? { width: `${clamped}%` } : { width: "0%" }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute inset-y-0 left-0 rounded-full ${
              isCritical
                ? "bg-[#ffb4ab]"
                : isHot
                  ? "bg-[#f2ca50]"
                  : "bg-[#d0c5af]"
            }`}
            style={{
              boxShadow: isCritical
                ? "0 0 16px rgba(255, 180, 171, 0.6)"
                : isHot
                  ? "0 0 16px rgba(242, 202, 80, 0.6)"
                  : undefined,
            }}
          />
          {/* Shimmer */}
          {(isHot || isCritical) && (
            <motion.div
              className="absolute inset-y-0 w-12 bg-white/30 blur-md rounded-full"
              animate={{ x: ["-30px", "100%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              style={{ left: "0%" }}
            />
          )}
        </div>

        {totalProducts != null && totalRemaining != null ? (
          <div className="mt-6 flex justify-center gap-8 font-mono text-[10px] tracking-[0.28em] uppercase text-[#99907c]">
            <span>
              <span className="text-[#f2ca50] font-bold">
                {totalProducts}
              </span>{" "}
              Pieces
            </span>
            <span>
              <span className="text-[#f2ca50] font-bold">
                {totalRemaining}
              </span>{" "}
              Remaining
            </span>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default DropAvailabilityBar;
