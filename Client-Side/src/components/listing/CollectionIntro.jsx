import React from "react";
import { motion } from "framer-motion";
import { Hairline } from "@/components/ui/editorial";

const CollectionIntro = ({ eyebrow, body }) => {
  if (!body) return null;
  return (
    <section className="bg-page py-16 md:py-24 border-b border-card">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-2xl mx-auto px-6 text-center"
      >
        {eyebrow ? (
          <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-muted mb-5">
            {eyebrow}
          </p>
        ) : null}
        <p className="font-display text-2xl md:text-3xl text-ink-2 leading-snug">
          {body}
        </p>
        <Hairline className="mt-8 max-w-[60px] mx-auto" tone="strong" />
      </motion.div>
    </section>
  );
};

export default CollectionIntro;
