import React from "react";
import { motion } from "framer-motion";

// Editorial story block. Asymmetric two-column on desktop, stacked on mobile.
// Designed for medium-length brand prose — falls back gracefully when no story.
const DropStory = ({ description, eyebrow = "Drop Story" }) => {
  if (!description) return null;
  return (
    <section className="bg-[#0a0a0a] py-20 md:py-28 border-y border-[#1a1a1a]">
      <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="md:col-span-4 md:sticky md:top-32 md:self-start"
        >
          <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-[#f2ca50] mb-4">
            {eyebrow}
          </p>
          <div className="w-12 h-px bg-[#f2ca50]" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="md:col-span-8"
        >
          <p className="font-display text-2xl md:text-4xl text-[#e5e2e1] leading-[1.25] first-letter:text-[#f2ca50] first-letter:font-bold">
            {description}
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default DropStory;
