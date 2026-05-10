import React from "react";
import { motion, useReducedMotion } from "framer-motion";

const Tile = ({ tall = false, shimmer = true }) => (
  <div className="bg-[#0e0e0e] flex flex-col">
    <div
      className={`relative w-full overflow-hidden bg-[#131313] rounded-[1rem] border border-[#1c1b1b] ${
        tall ? "aspect-square" : "aspect-[3/4]"
      }`}
    >
      {shimmer && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 1.6, ease: "linear", repeat: Infinity }}
        />
      )}
    </div>
    <div className="mt-3 px-2 space-y-2 pb-2">
      <div className="h-3 bg-[#1c1b1b] w-3/5 rounded-sm" />
      <div className="h-3 bg-[#1c1b1b] w-1/3 rounded-sm" />
    </div>
  </div>
);

/**
 * Skeleton that mirrors EditorialProductGrid's layout exactly so the swap
 * to real cards is layout-stable.
 */
const ProductGridSkeleton = ({ count = 12, featuredEvery = 7 }) => {
  const reduced = useReducedMotion();
  const tiles = Array.from({ length: count });

  return (
    <div className="grid gap-px bg-[#4d4635]/40 border border-[#4d4635]/40 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 [grid-auto-flow:dense] [grid-auto-rows:1fr]">
      {tiles.map((_, idx) => {
        const isFeatured =
          Number.isFinite(featuredEvery) &&
          featuredEvery > 0 &&
          (idx + 1) % featuredEvery === 0;
        return (
          <div
            key={idx}
            className={isFeatured ? "md:col-span-2 md:row-span-2" : undefined}
          >
            <Tile tall={isFeatured} shimmer={!reduced} />
          </div>
        );
      })}
    </div>
  );
};

export default ProductGridSkeleton;
