import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowRight } from "lucide-react";
import { Eyebrow, Btn } from "@/components/ui/editorial";

const FALLBACK_HEROES = [
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1800&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1800&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1800&q=80&auto=format&fit=crop",
];

const SLIDE_DURATION_MS = 6500;
const FADE_MS = 1400;

// Each slide gets its own subtle Ken Burns transform — slow scale + pan
const KEN_BURNS = [
  { scaleFrom: 1.06, scaleTo: 1.12, x: [-1, 1], y: [-1, 1] },
  { scaleFrom: 1.10, scaleTo: 1.04, x: [1, -1], y: [1, -1] },
  { scaleFrom: 1.04, scaleTo: 1.10, x: [-1, 1], y: [1, -1] },
  { scaleFrom: 1.12, scaleTo: 1.06, x: [1, -1], y: [-1, 1] },
];

export default function HomeHero({
  imageSrc,
  images: imagesProp,
  ready = true,
  primaryHeadline = "Quiet things,",
  secondaryHeadline = "slowly made.",
  paragraph = "Eighty-four pieces, hand-finished in Sri Lanka. There is no restock.",
  eyebrow = "Drop · By appointment",
  topLeft = "Chapter · XIV",
  topRight = "Friday · 18:00 IST",
  pieces = "084",
  photographedAt = "Mirissa, April 2026",
  madeIn = "Battaramulla, Sri Lanka",
  primaryCta,
  secondaryCta,
  scrollHintTargetId,
  autoplay = true,
}) {
  const reduced = useReducedMotion();
  const baseDelay = ready ? 0.15 : 9999;
  const D = (n) => baseDelay + (reduced ? 0 : n);

  const images = useMemo(() => {
    const list = [];
    if (Array.isArray(imagesProp) && imagesProp.length > 0) {
      list.push(
        ...imagesProp
          .map((it) => (typeof it === "string" ? it : it?.url || it?.src))
          .filter(Boolean)
      );
    }
    if (imageSrc) list.push(imageSrc);
    if (list.length === 0) list.push(...FALLBACK_HEROES);
    return Array.from(new Set(list));
  }, [imagesProp, imageSrc]);

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [nudge, setNudge] = useState(0); // forces progress bar to restart on manual jump
  const timerRef = useRef(null);

  // Preload the next image so the crossfade is smooth
  useEffect(() => {
    if (images.length <= 1) return;
    const next = (index + 1) % images.length;
    const img = new Image();
    img.src = images[next];
  }, [index, images]);

  // Auto-advance
  useEffect(() => {
    if (
      !ready ||
      !autoplay ||
      reduced ||
      images.length <= 1 ||
      paused
    ) {
      return;
    }
    timerRef.current = setTimeout(() => {
      setIndex((i) => (i + 1) % images.length);
    }, SLIDE_DURATION_MS);
    return () => clearTimeout(timerRef.current);
  }, [index, ready, autoplay, reduced, images.length, paused, nudge]);

  const goTo = (i) => {
    if (i === index) return;
    clearTimeout(timerRef.current);
    setIndex(((i % images.length) + images.length) % images.length);
    setNudge((n) => n + 1);
  };

  const handleScrollHint = () => {
    if (!scrollHintTargetId) return;
    const el = document.getElementById(scrollHintTargetId);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  const Mdiv = motion.div;
  const Mp = motion.p;

  const total = images.length;
  const counterCurrent = String(index + 1).padStart(2, "0");
  const counterTotal = String(total).padStart(2, "0");

  return (
    <section
      className="relative h-[640px] sm:h-[760px] lg:h-[860px] px-4 sm:px-6 md:px-8 pt-4 md:pt-8 pb-10 md:pb-16 overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slideshow layer — crossfading images with Ken Burns */}
      <div className="absolute inset-0 overflow-hidden bg-[#0a0a0a]">
        <AnimatePresence initial={false} mode="sync">
          {images.map((src, i) =>
            i === index ? (
              <motion.div
                key={`${src}-${i}`}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: FADE_MS / 1000, ease: [0.65, 0, 0.35, 1] }}
              >
                {/* Ken Burns wrapper — scale + tiny drift */}
                <motion.div
                  className="absolute inset-0"
                  initial={
                    reduced
                      ? { scale: 1.04, x: 0, y: 0 }
                      : {
                          scale: KEN_BURNS[i % KEN_BURNS.length].scaleFrom,
                          x: `${KEN_BURNS[i % KEN_BURNS.length].x[0]}%`,
                          y: `${KEN_BURNS[i % KEN_BURNS.length].y[0]}%`,
                        }
                  }
                  animate={
                    reduced
                      ? { scale: 1.04, x: 0, y: 0 }
                      : {
                          scale: KEN_BURNS[i % KEN_BURNS.length].scaleTo,
                          x: `${KEN_BURNS[i % KEN_BURNS.length].x[1]}%`,
                          y: `${KEN_BURNS[i % KEN_BURNS.length].y[1]}%`,
                        }
                  }
                  transition={{
                    duration: reduced ? 0.4 : (SLIDE_DURATION_MS + FADE_MS) / 1000,
                    ease: "linear",
                  }}
                >
                  <img
                    src={src}
                    alt=""
                    className="w-full h-full object-cover"
                    loading={i === 0 ? "eager" : "lazy"}
                    draggable={false}
                  />
                </motion.div>
              </motion.div>
            ) : null
          )}
        </AnimatePresence>

        {/* Editorial gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/35 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/70 via-[#0a0a0a]/10 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(242,202,80,0.08),transparent_55%)]" />
      </div>

      {/* Hairline frame draws after reveal */}
      <motion.div
        className="absolute top-3 md:top-6 left-3 md:left-6 right-3 md:right-6 h-px bg-[#e5e2e1]/20 origin-left"
        initial={{ scaleX: 0 }}
        animate={ready ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 0.9, delay: D(0.1), ease: [0.65, 0, 0.35, 1] }}
      />
      <motion.div
        className="absolute bottom-3 md:bottom-6 left-3 md:left-6 right-3 md:right-6 h-px bg-[#e5e2e1]/20 origin-right"
        initial={{ scaleX: 0 }}
        animate={ready ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 0.9, delay: D(0.2), ease: [0.65, 0, 0.35, 1] }}
      />
      <motion.div
        className="absolute top-3 md:top-6 bottom-3 md:bottom-6 left-3 md:left-6 w-px bg-[#e5e2e1]/15 origin-top"
        initial={{ scaleY: 0 }}
        animate={ready ? { scaleY: 1 } : { scaleY: 0 }}
        transition={{ duration: 1, delay: D(0.25), ease: [0.65, 0, 0.35, 1] }}
      />
      <motion.div
        className="absolute top-3 md:top-6 bottom-3 md:bottom-6 right-3 md:right-6 w-px bg-[#e5e2e1]/15 origin-bottom"
        initial={{ scaleY: 0 }}
        animate={ready ? { scaleY: 1 } : { scaleY: 0 }}
        transition={{ duration: 1, delay: D(0.3), ease: [0.65, 0, 0.35, 1] }}
      />

      <div className="relative h-full flex flex-col justify-between">
        {/* Top eyebrow strip */}
        <Mdiv
          className="flex items-start justify-between pt-4 px-4 md:pt-5 md:px-5"
          initial={{ opacity: 0, y: -8 }}
          animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
          transition={{ duration: 0.6, delay: D(0.1), ease: "easeOut" }}
        >
          <Eyebrow tone="muted" size="sm">{topLeft}</Eyebrow>
          <Eyebrow tone="muted" size="sm">{topRight}</Eyebrow>
        </Mdiv>

        {/* Bottom lockup */}
        <div className="pl-4 pb-4 md:pl-8 md:pb-8 max-w-3xl">
          <Mdiv
            initial={{ opacity: 0, y: 12 }}
            animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={{ duration: 0.6, delay: D(0.35), ease: [0.22, 1, 0.36, 1] }}
          >
            <Eyebrow tone="gold" size="md">{eyebrow}</Eyebrow>
          </Mdiv>

          {/* Headline — line-by-line slide reveal */}
          <h1
            className="se-serif mt-4 md:mt-5 leading-[0.92] text-[#fafafa] text-[44px] sm:text-6xl md:text-7xl lg:text-[120px]"
            style={{ fontWeight: 900, letterSpacing: "-0.02em" }}
          >
            <span className="block overflow-hidden">
              <motion.span
                className="block"
                initial={{ y: "110%" }}
                animate={ready ? { y: "0%" } : { y: "110%" }}
                transition={{ duration: 0.85, delay: D(0.5), ease: [0.22, 1, 0.36, 1] }}
              >
                {primaryHeadline}
              </motion.span>
            </span>
            <span className="block overflow-hidden">
              <motion.span
                className="block"
                initial={{ y: "110%" }}
                animate={ready ? { y: "0%" } : { y: "110%" }}
                transition={{ duration: 0.85, delay: D(0.65), ease: [0.22, 1, 0.36, 1] }}
              >
                {secondaryHeadline}
              </motion.span>
            </span>
          </h1>

          {/* Hairline accent */}
          <motion.div
            className="mt-5 md:mt-7 h-px bg-[#f2ca50] origin-left"
            style={{ width: 80 }}
            initial={{ scaleX: 0 }}
            animate={ready ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.7, delay: D(0.85), ease: [0.65, 0, 0.35, 1] }}
          />

          {/* Paragraph */}
          <Mp
            className="mt-5 md:mt-6 max-w-md se-body text-[#d0c5af]/90 text-sm md:text-base leading-relaxed"
            initial={{ opacity: 0, y: 12 }}
            animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={{ duration: 0.7, delay: D(1.0), ease: "easeOut" }}
          >
            {paragraph}
          </Mp>

          {/* CTAs */}
          <Mdiv
            className="mt-7 md:mt-8 flex items-center gap-3 md:gap-4 flex-wrap"
            initial={{ opacity: 0, y: 12 }}
            animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={{ duration: 0.7, delay: D(1.15), ease: "easeOut" }}
          >
            {primaryCta || (
              <Btn variant="default" iconRight={ArrowRight}>Take a closer look</Btn>
            )}
            {secondaryCta || <Btn variant="outline">Read the chapter</Btn>}
          </Mdiv>
        </div>
      </div>

      {/* Right rail meta — desktop only */}
      <motion.div
        className="absolute right-12 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-end gap-6 z-10"
        initial={{ opacity: 0, x: 24 }}
        animate={ready ? { opacity: 1, x: 0 } : { opacity: 0, x: 24 }}
        transition={{ duration: 0.8, delay: D(0.9), ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex flex-col items-end gap-2 border-r-2 border-[#f2ca50] pr-4">
          <Eyebrow tone="muted" size="xs">Pieces</Eyebrow>
          <span className="se-serif text-[#fafafa] text-5xl tabular-nums leading-none">
            {pieces}
          </span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Eyebrow tone="muted" size="xs">Photographed</Eyebrow>
          <span className="se-body text-[#d0c5af] text-base">{photographedAt}</span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Eyebrow tone="muted" size="xs">Made in</Eyebrow>
          <span className="se-body text-[#d0c5af] text-base">{madeIn}</span>
        </div>
      </motion.div>

      {/* Slideshow indicator — bottom-right (counter + dashes) */}
      {total > 1 && (
        <motion.div
          className="absolute bottom-8 md:bottom-10 right-8 md:right-12 z-10 flex items-center gap-4 md:gap-5"
          initial={{ opacity: 0, y: 8 }}
          animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          transition={{ duration: 0.6, delay: D(1.3), ease: "easeOut" }}
        >
          {/* Counter */}
          <div className="flex items-baseline gap-2 se-mono text-xs tabular-nums">
            <span className="text-[#fafafa]">{counterCurrent}</span>
            <span className="text-[#574500]">/</span>
            <span className="text-[#99907c]">{counterTotal}</span>
          </div>

          {/* Hairline dashes */}
          <div className="flex items-center gap-1.5 md:gap-2">
            {images.map((_, i) => {
              const active = i === index;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Go to image ${i + 1}`}
                  aria-current={active ? "true" : "false"}
                  className="group relative h-3 flex items-center"
                >
                  {/* Inactive base */}
                  <span
                    className={`block h-px transition-all duration-300 ${
                      active
                        ? "w-7 md:w-8 bg-[#99907c]/40"
                        : "w-4 md:w-5 bg-[#99907c]/40 group-hover:bg-[#99907c]/70"
                    }`}
                  />
                  {/* Progress fill on the active dash */}
                  {active && !reduced && autoplay && !paused && (
                    <motion.span
                      key={`fill-${index}-${nudge}`}
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-px bg-[#f2ca50]"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{
                        duration: SLIDE_DURATION_MS / 1000,
                        ease: "linear",
                      }}
                      style={{ display: "block" }}
                    />
                  )}
                  {active && (paused || reduced || !autoplay) && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-px bg-[#f2ca50] w-full" />
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Scroll hint */}
      {scrollHintTargetId && (
        <motion.button
          type="button"
          onClick={handleScrollHint}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 z-10 text-[#99907c] hover:text-[#f2ca50] transition-colors"
          initial={{ opacity: 0 }}
          animate={ready ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: D(1.4), ease: "easeOut" }}
          aria-label="Scroll down"
        >
          <Eyebrow tone="muted" size="xs">Scroll</Eyebrow>
          <motion.span
            animate={!reduced ? { y: [0, 8, 0], opacity: [0.9, 0.4, 0.9] } : {}}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <ArrowDown size={14} strokeWidth={1.5} />
          </motion.span>
        </motion.button>
      )}
    </section>
  );
}
