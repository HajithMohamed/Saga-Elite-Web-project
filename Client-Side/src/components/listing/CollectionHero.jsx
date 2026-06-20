import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { getCollectionHero, getCollectionTone } from "./collectionConfig";

const CollectionHero = ({ variant = "all" }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Parallax: image moves slower than scroll, copy fades + drifts up.
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.6, 1], [1, 0.6, 0]);
  const copyY = useTransform(scrollYProgress, [0, 1], ["0px", "-40px"]);

  const data = getCollectionHero(variant);
  const tone = getCollectionTone(data.tone);

  return (
    <section
      ref={ref}
      className="relative h-[60vh] md:h-[80vh] max-h-[720px] w-full overflow-hidden bg-[#050505]"
    >
      {/* Parallax background image */}
      <motion.div style={{ y }} className="absolute inset-0">
        <img
          src={data.image}
          alt=""
          aria-hidden="true"
          loading="eager"
          fetchpriority="high"
          srcSet={`${data.image}&w=640 640w, ${data.image}&w=1280 1280w, ${data.image}&w=1920 1920w`}
          sizes="100vw"
          className="w-full h-full object-cover"
        />
        <div className={`absolute inset-0 ${tone.overlay}`} />
      </motion.div>

      {/* Copy block — drifts up + fades on scroll */}
      <motion.div
        style={{ opacity, y: copyY }}
        className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6"
      >
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className={`font-mono text-[10px] md:text-[11px] tracking-[0.4em] uppercase mb-4 flex items-center gap-2 ${tone.accent}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${tone.accentDot}`} />
          {data.eyebrow}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="font-display text-[44px] md:text-[88px] leading-[0.95] uppercase text-[#FAF7F2] tracking-tight max-w-4xl"
        >
          {data.title}
        </motion.h1>

        {data.tagline ? (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            className="font-sans text-sm md:text-base text-[#d0c5af] max-w-xl mt-6 leading-relaxed"
          >
            {data.tagline}
          </motion.p>
        ) : null}

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center gap-1 text-[#99907c]"
          >
            <span className="font-mono text-[9px] tracking-[0.3em] uppercase">
              Scroll
            </span>
            <ChevronDown size={14} strokeWidth={1.5} />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default CollectionHero;
