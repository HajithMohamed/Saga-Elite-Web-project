import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Eyebrow } from "@/components/ui/editorial";

const ITEMS = [
  { label: "Limited Edition" },
  { label: "Islandwide Delivery" },
  { label: "Premium Fabric" },
  { label: "Mystery Gift Included" },
];

const TrustStrip = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    className="my-8 md:my-10 border-y border-line/40 bg-page"
    aria-label="Saga Elite promises"
  >
    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-line/30">
      {ITEMS.map((item) => (
        <div
          key={item.label}
          className="bg-page px-4 md:px-6 py-5 md:py-6 flex items-center gap-3 group hover:bg-panel transition-colors"
        >
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-gold-ink/40 bg-card shrink-0 group-hover:border-gold-ink transition-colors">
            <Check
              size={12}
              strokeWidth={2.25}
              className="text-gold-ink group-hover:[filter:drop-shadow(0_0_4px_rgba(242,202,80,0.6))] transition"
            />
          </span>
          <Eyebrow tone="default" size="xs" className="leading-snug">
            {item.label}
          </Eyebrow>
        </div>
      ))}
    </div>
  </motion.div>
);

export default TrustStrip;
