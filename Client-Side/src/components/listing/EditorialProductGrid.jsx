import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "@/components/shopping-components/ProductCard";

/**
 * Mixed editorial grid. Every Nth tile spans 2×2 (`md:col-span-2 md:row-span-2`)
 * for a cinematic, magazine-style rhythm. Uses `auto-flow: dense` so that
 * smaller tiles back-fill the gaps a featured tile leaves on the row, and
 * `auto-rows: 1fr` to keep the spanned tile a clean square instead of
 * doubling row height.
 *
 * Pass `featuredEvery={Infinity}` (or omit on small lists) to disable
 * featured tiles entirely.
 */
const EditorialProductGrid = ({
  products = [],
  featuredEvery = 7,
  motionKey,
}) => {
  if (!products.length) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={motionKey}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="grid gap-4 md:gap-8 grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 [grid-auto-flow:dense] [grid-auto-rows:1fr]"
      >
        {products.map((product, idx) => {
          const isFeatured =
            Number.isFinite(featuredEvery) &&
            featuredEvery > 0 &&
            (idx + 1) % featuredEvery === 0;
          return (
            <div
              key={product._id || idx}
              className={isFeatured ? "md:col-span-2 md:row-span-2" : undefined}
            >
              <ProductCard product={product} index={idx} tall={isFeatured} />
            </div>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
};

export default EditorialProductGrid;
