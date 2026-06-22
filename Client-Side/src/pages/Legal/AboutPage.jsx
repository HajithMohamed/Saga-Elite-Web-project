import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ArrowRight,
  Crown,
  Headphones,
  Lock,
  Package,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Zap,
} from "lucide-react";
import usePageMeta from "@/hooks/use-page-meta";
import useShopAbout from "@/hooks/use-shop-about";
import { API_V1_URL as API_BASE } from "@/lib/api";
import { Btn, Eyebrow, Reveal } from "@/components/ui/editorial";

const VALUE_ICON_MAP = {
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Lock,
  Headphones,
  Crown,
  Zap,
  Package,
};

const DEFAULT_TIMELINE = [
  { year: "2022", milestone: "The idea began" },
  { year: "2023", milestone: "First customers" },
  { year: "2024", milestone: "Islandwide delivery" },
  { year: "2025", milestone: "Thousands of orders" },
];

const DEFAULT_STATS = [
  { value: 10000, suffix: "+", label: "Orders Delivered" },
  { value: 25, suffix: "+", label: "Districts Served" },
  { value: 98, suffix: "%", label: "Customer Satisfaction" },
  { value: "4.9★", suffix: "", label: "Average Rating" },
];

const DEFAULT_WHY_CHOOSE = [
  { icon: "Truck", title: "Islandwide Delivery", body: "From Colombo to Jaffna — we deliver across Sri Lanka." },
  { icon: "ShieldCheck", title: "Premium Quality", body: "Curated pieces built to last, never mass-produced." },
  { icon: "Lock", title: "Secure Payments", body: "Bank transfer, card, and trusted checkout options." },
  { icon: "Headphones", title: "Customer Support", body: "Real people on WhatsApp and email when you need us." },
  { icon: "Crown", title: "Exclusive Collections", body: "Limited drops you won't find anywhere else on the island." },
  { icon: "Zap", title: "Fast Shipping", body: "Orders packed and dispatched within 24–48 hours." },
];

const DEFAULT_VALUES = [
  { icon: "Sparkles", title: "Quality" },
  { icon: "ShieldCheck", title: "Authenticity" },
  { icon: "Star", title: "Community" },
  { icon: "Zap", title: "Innovation" },
];

const DEFAULT_GALLERY = [
  {
    imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
    caption: "Colombo lifestyle",
    altText: "Premium lifestyle in Colombo",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1607083206869-4c7672591458?w=800&q=80",
    caption: "Packaging process",
    altText: "Careful product packaging",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1566576721346-4c3b9795ad51?w=800&q=80",
    caption: "Islandwide deliveries",
    altText: "Delivery across Sri Lanka",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80",
    caption: "Customer moments",
    altText: "Happy customer unboxing",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
    caption: "Products in real environments",
    altText: "Products styled in everyday settings",
  },
];

const DEFAULT_REVIEWS = [
  {
    quote: "Best online shopping experience I've had in Sri Lanka.",
    source: "Verified Customer",
  },
  {
    quote: "Quality is unmatched. Fast delivery to Kandy — will order again.",
    source: "Repeat Buyer",
  },
  {
    quote: "Finally a local brand that feels international. Love the drops.",
    source: "Saga Elite Member",
  },
];

const HERO_BG =
  "https://images.unsplash.com/photo-1441984904996-e0b6a687762d?w=1920&q=80";

const GlassCard = React.forwardRef(({ children, className = "" }, ref) => (
  <div
    ref={ref}
    className={`rounded-sm border border-white/[0.08] bg-white/[0.03] backdrop-blur-md ${className}`}
  >
    {children}
  </div>
));
GlassCard.displayName = "GlassCard";

const useAnimatedNumber = (target, suffix = "", duration = 2.0) => {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(reduced ? target : 0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  useEffect(() => {
    if (!inView || typeof target !== "number" || reduced) {
      if (typeof target === "number" && reduced) setValue(target);
      return;
    }
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - (1 - p) ** 3;
      setValue(Math.floor(eased * target));
      if (p < 1) requestAnimationFrame(tick);
      else setValue(target);
    };
    requestAnimationFrame(tick);
  }, [inView, target, duration, reduced]);

  return {
    ref,
    display: typeof target === "number" ? `${value.toLocaleString()}${suffix}` : target,
  };
};

const StatCell = ({ stat }) => {
  const raw = stat.number ?? stat.value ?? "";
  const suffix = stat.suffix || "";
  const isNumeric = typeof raw === "number" || /^\d+$/.test(String(raw));
  const numericTarget = isNumeric ? Number(raw) : null;
  const animated = useAnimatedNumber(numericTarget ?? 0, suffix);
  const display = isNumeric ? animated.display : `${raw}${suffix}`;

  return (
    <GlassCard
      ref={isNumeric ? animated.ref : undefined}
      className="p-6 md:p-10 text-center group hover:border-[#D4AF37]/30 transition-colors duration-500"
    >
      <span className="block se-serif text-[#fafafa] text-4xl sm:text-5xl md:text-6xl lg:text-7xl tabular-nums leading-none group-hover:text-[#D4AF37] transition-colors duration-500">
        {display}
      </span>
      <Eyebrow tone="muted" size="xs" className="block mt-4 md:mt-6">
        {stat.label || ""}
      </Eyebrow>
    </GlassCard>
  );
};

const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.4 });
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-px bg-[#D4AF37] z-[60] origin-left"
      style={{ scaleX }}
      aria-hidden="true"
    />
  );
};

const AboutPage = () => {
  usePageMeta({
    title: "About",
    description:
      "Saga Elite — premium lifestyle products for Sri Lanka. Crafted with passion, delivered islandwide.",
  });

  const { data: about, loading } = useShopAbout();
  const reduced = useReducedMotion();
  const [logoUrl, setLogoUrl] = useState(null);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", reduced ? "0%" : "28%"]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, reduced ? 1 : 1.12]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.3]);

  const timeline = useMemo(() => {
    const rows = Array.isArray(about?.about_timeline)
      ? about.about_timeline.filter((r) => r?.year && r?.milestone)
      : [];
    return rows.length > 0 ? rows : DEFAULT_TIMELINE;
  }, [about?.about_timeline]);

  const stats = useMemo(() => {
    const rows = Array.isArray(about?.about_stats)
      ? about.about_stats.filter((s) => s?.label)
      : [];
    return rows.length > 0 ? rows : DEFAULT_STATS;
  }, [about?.about_stats]);

  const whyChoose = DEFAULT_WHY_CHOOSE;

  const values = useMemo(() => {
    const rows = Array.isArray(about?.about_values)
      ? about.about_values.filter((v) => v?.title)
      : [];
    return rows.length > 0 ? rows : DEFAULT_VALUES;
  }, [about?.about_values]);

  const gallery = useMemo(() => {
    const rows = Array.isArray(about?.about_studio_gallery)
      ? about.about_studio_gallery.filter((g) => g?.imageUrl)
      : [];
    return rows.length > 0 ? rows : DEFAULT_GALLERY;
  }, [about?.about_studio_gallery]);

  const reviews = useMemo(() => {
    const rows = Array.isArray(about?.shop_press_quotes)
      ? about.shop_press_quotes.filter((r) => r?.quote?.trim())
      : [];
    return rows.length > 0 ? rows : DEFAULT_REVIEWS;
  }, [about?.shop_press_quotes]);

  const heroImage =
    about?.shop_logo_url ||
    logoUrl ||
    gallery[0]?.imageUrl ||
    HERO_BG;

  const brandName = about?.shop_brand_name?.trim() || "Saga Elite";
  const heroSubline = about?.shop_tagline?.trim() || "Premium lifestyle products for Sri Lanka.";

  useEffect(() => {
    if (about?.shop_logo_url) return;
    axios
      .get(`${API_BASE}/image/get-logo-images`)
      .then((res) => {
        const url = res?.data?.images?.[0]?.url;
        if (url) setLogoUrl(url);
      })
      .catch(() => {});
  }, [about?.shop_logo_url]);

  const [reviewIndex, setReviewIndex] = useState(0);
  useEffect(() => {
    if (reviews.length <= 1) return undefined;
    const timer = setInterval(
      () => setReviewIndex((i) => (i + 1) % reviews.length),
      6000
    );
    return () => clearInterval(timer);
  }, [reviews.length]);

  if (loading && !about?.about_brand_story) {
    return (
      <div className="bg-[#0A0A0A] text-[#e5e2e1] min-h-screen flex items-center justify-center">
        <div className="animate-pulse se-body text-[#574500]">Loading…</div>
      </div>
    );
  }

  const activeReview = reviews[reviewIndex];

  return (
    <div className="bg-[#0A0A0A] text-[#e5e2e1] se-body min-h-screen overflow-x-hidden">
      <ScrollProgress />

      {/* 1. CINEMATIC HERO */}
      <section
        ref={heroRef}
        className="relative min-h-screen overflow-hidden flex items-end"
      >
        <motion.div
          className="absolute inset-0 overflow-hidden"
          style={{ opacity: heroOpacity }}
        >
          <motion.div className="absolute inset-0" style={{ y: bgY, scale: bgScale }}>
            <img
              src={heroImage}
              alt=""
              className="w-full h-full object-cover object-center scale-105"
              loading="eager"
            />
          </motion.div>
          <div className="absolute inset-0 bg-[#0A0A0A]/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/50 to-[#0A0A0A]/20" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(212,175,55,0.12),transparent_55%)]" />
        </motion.div>

        <div className="relative w-full px-5 md:px-12 lg:px-16 pb-16 md:pb-24 max-w-7xl mx-auto">
          <Reveal>
            <Eyebrow tone="gold" size="md">
              {about?.shop_hero_eyebrow?.trim() || `${brandName} · Sri Lanka`}
            </Eyebrow>
          </Reveal>

          <h1 className="mt-6 md:mt-8 max-w-5xl">
            {about?.shop_hero_headline?.trim() ? (
              <span className="se-serif text-[#fafafa] leading-[0.92] text-4xl sm:text-5xl md:text-7xl lg:text-8xl block">
                {about.shop_hero_headline}
              </span>
            ) : (
              <>
                <span className="block overflow-hidden">
                  <motion.span
                    className="block se-serif text-[#fafafa] leading-[0.92] text-4xl sm:text-5xl md:text-7xl lg:text-8xl uppercase tracking-tight"
                    initial={{ y: "110%" }}
                    animate={{ y: "0%" }}
                    transition={{ duration: 0.85, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                  >
                    We don&apos;t sell products.
                  </motion.span>
                </span>
                <span className="block overflow-hidden mt-1 md:mt-2">
                  <motion.span
                    className="block se-serif text-[#D4AF37] leading-[0.92] text-4xl sm:text-5xl md:text-7xl lg:text-8xl uppercase tracking-tight"
                    initial={{ y: "110%" }}
                    animate={{ y: "0%" }}
                    transition={{ duration: 0.85, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  >
                    We create experiences.
                  </motion.span>
                </span>
              </>
            )}
          </h1>

          <Reveal delay={0.2}>
            <div className="mt-8 md:mt-10 max-w-lg space-y-1">
              <p className="se-body text-[#d0c5af] text-base md:text-lg">{heroSubline}</p>
              <p className="se-body text-[#99907c] text-sm md:text-base">Crafted with passion.</p>
              <p className="se-body text-[#99907c] text-sm md:text-base">Delivered islandwide.</p>
            </div>
          </Reveal>

          <Reveal delay={0.35}>
            <div className="mt-10 md:mt-12 flex flex-wrap items-center gap-4">
              <Link to="/shopping/product-list">
                <Btn variant="default" iconRight={ArrowRight}>
                  Explore Collection
                </Btn>
              </Link>
              <a href="#brand-story">
                <Btn variant="outline">Our Story</Btn>
              </a>
            </div>
          </Reveal>
        </div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          aria-hidden="true"
        >
          <span className="se-label text-[9px] text-[#574500] tracking-[0.35em]">Scroll</span>
          <motion.div
            className="w-px h-10 bg-gradient-to-b from-[#D4AF37] to-transparent"
            animate={{ scaleY: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </section>

      {/* 2. BRAND STORY TIMELINE */}
      <section id="brand-story" className="relative px-5 md:px-12 py-20 md:py-32 max-w-7xl mx-auto">
        <Reveal>
          <Eyebrow tone="gold" size="md">Our journey</Eyebrow>
          <h2 className="mt-4 se-serif text-[#fafafa] text-3xl md:text-5xl lg:text-6xl leading-tight">
            The {brandName} story
          </h2>
        </Reveal>

        <div className="mt-14 md:mt-20 relative">
          <div
            className="absolute left-0 right-0 top-1/2 hidden md:block h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent"
            aria-hidden="true"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {timeline.map((item, i) => (
              <Reveal key={`${item.year}-${i}`} delay={i * 0.08}>
                <GlassCard className="p-6 md:p-8 h-full hover:border-[#D4AF37]/25 transition-all duration-500 group">
                  <span className="se-mono text-[#D4AF37] text-sm md:text-base tabular-nums">
                    {item.year}
                  </span>
                  <p className="mt-3 se-headline text-[#fafafa] text-xl md:text-2xl leading-snug group-hover:text-[#D4AF37] transition-colors duration-300">
                    {item.milestone}
                  </p>
                  {item.imageUrl ? (
                    <div className="mt-5 aspect-[4/3] overflow-hidden rounded-sm border border-white/[0.06]">
                      <img
                        src={item.imageUrl}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                      />
                    </div>
                  ) : null}
                </GlassCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 3. STATISTICS */}
      <section className="relative px-5 md:px-12 py-20 md:py-28 border-y border-white/[0.06] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(212,175,55,0.06),transparent_60%)] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto">
          <Reveal className="text-center mb-12 md:mb-16">
            <Eyebrow tone="gold" size="md">By the numbers</Eyebrow>
            <h2 className="mt-4 se-serif text-[#fafafa] text-3xl md:text-5xl">
              Trusted across the island
            </h2>
          </Reveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {stats.map((stat, i) => (
              <StatCell key={i} stat={stat} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. WHY CUSTOMERS CHOOSE US */}
      <section className="px-5 md:px-12 py-20 md:py-32 max-w-7xl mx-auto">
        <Reveal>
          <Eyebrow tone="gold" size="md">Why choose us</Eyebrow>
          <h2 className="mt-4 se-serif text-[#fafafa] text-3xl md:text-5xl lg:text-6xl leading-tight max-w-3xl">
            Built for Sri Lankan customers
          </h2>
        </Reveal>

        <div className="mt-12 md:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {whyChoose.map((item, i) => {
            const Icon = VALUE_ICON_MAP[item.icon] || Sparkles;
            return (
              <Reveal key={item.title} delay={i * 0.06}>
                <GlassCard className="p-7 md:p-9 h-full hover:border-[#D4AF37]/25 hover:bg-white/[0.05] transition-all duration-500 group">
                  <div className="flex h-14 w-14 items-center justify-center rounded-sm border border-[#D4AF37]/20 bg-[#D4AF37]/5 group-hover:bg-[#D4AF37]/10 transition-colors duration-500">
                    <Icon className="h-7 w-7 text-[#D4AF37]" strokeWidth={1.25} />
                  </div>
                  <h3 className="mt-6 se-headline text-[#fafafa] text-xl md:text-2xl">
                    {item.title}
                  </h3>
                  <p className="mt-3 se-body text-[#99907c] text-sm md:text-base leading-relaxed">
                    {item.body}
                  </p>
                </GlassCard>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* 5. LIFESTYLE GALLERY */}
      <section className="relative px-5 md:px-12 py-20 md:py-32 border-t border-white/[0.06] overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <Eyebrow tone="gold" size="md">Life with {brandName}</Eyebrow>
            <h2 className="mt-4 se-serif text-[#fafafa] text-3xl md:text-5xl lg:text-6xl leading-tight">
              Sri Lankan lifestyle gallery
            </h2>
          </Reveal>

          <div className="mt-12 md:mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 auto-rows-[140px] md:auto-rows-[200px]">
            {gallery.map((item, i) => {
              const span =
                i === 0
                  ? "col-span-2 row-span-2"
                  : i === 3
                    ? "col-span-2 md:col-span-1 row-span-1"
                    : "";
              return (
                <Reveal
                  key={`${item.imageUrl}-${i}`}
                  delay={i * 0.05}
                  className={`relative overflow-hidden rounded-sm group ${span}`}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.altText || item.caption || ""}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/80 via-[#0A0A0A]/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
                  {item.caption ? (
                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                      <Eyebrow tone="gold" size="xs">
                        {item.caption}
                      </Eyebrow>
                    </div>
                  ) : null}
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. CUSTOMER REVIEWS */}
      <section className="relative px-5 md:px-12 py-20 md:py-32 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[#D4AF37]/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          <Reveal className="text-center mb-12 md:mb-16">
            <Eyebrow tone="gold" size="md">Customer reviews</Eyebrow>
            <h2 className="mt-4 se-serif text-[#fafafa] text-3xl md:text-5xl">
              What our customers say
            </h2>
          </Reveal>

          <AnimatePresence mode="wait">
            <motion.div
              key={reviewIndex}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <GlassCard className="relative p-8 md:p-14 text-center">
                <Quote
                  className="absolute top-6 right-6 h-8 w-8 text-[#D4AF37]/25"
                  strokeWidth={1}
                />
                <div className="flex justify-center gap-1 mb-6">
                  {Array.from({ length: 5 }).map((_, k) => (
                    <Star
                      key={k}
                      className="h-4 w-4 text-[#D4AF37]"
                      fill="#D4AF37"
                      strokeWidth={0}
                    />
                  ))}
                </div>
                <p className="se-serif text-[#fafafa] text-xl md:text-3xl leading-snug italic">
                  &ldquo;{activeReview.quote}&rdquo;
                </p>
                <p className="mt-8 se-label text-[#99907c] text-xs tracking-[0.25em]">
                  — {activeReview.source || "Customer"}
                </p>
              </GlassCard>
            </motion.div>
          </AnimatePresence>

          {reviews.length > 1 ? (
            <div className="flex justify-center gap-2 mt-8">
              {reviews.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setReviewIndex(idx)}
                  className={`h-0.5 transition-all duration-500 ${
                    reviewIndex === idx
                      ? "w-10 bg-[#D4AF37]"
                      : "w-6 bg-[#4d4635] hover:bg-[#99907c]"
                  }`}
                  aria-label={`Show review ${idx + 1}`}
                />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* 7. COMPANY VALUES */}
      <section className="px-5 md:px-12 py-20 md:py-32 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto">
          <Reveal className="text-center mb-12 md:mb-16">
            <Eyebrow tone="gold" size="md">What we stand for</Eyebrow>
            <h2 className="mt-4 se-serif text-[#fafafa] text-3xl md:text-5xl">
              Our values
            </h2>
          </Reveal>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {values.map((v, i) => {
              const Icon = VALUE_ICON_MAP[v.icon] || Sparkles;
              return (
                <Reveal key={v.title || i} delay={i * 0.06}>
                  <GlassCard className="p-8 md:p-10 text-center hover:border-[#D4AF37]/30 transition-all duration-500 group">
                    <Icon
                      className="mx-auto h-6 w-6 text-[#D4AF37]/70 group-hover:text-[#D4AF37] transition-colors"
                      strokeWidth={1.25}
                    />
                    <h3 className="mt-5 se-headline text-[#fafafa] text-lg md:text-xl uppercase tracking-wide">
                      {v.title}
                    </h3>
                  </GlassCard>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. FINAL CTA */}
      <section className="relative px-5 md:px-12 py-24 md:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(212,175,55,0.08),transparent_60%)] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0A0A0A]/50 to-[#0A0A0A] pointer-events-none" />

        <Reveal className="relative max-w-4xl mx-auto text-center">
          <Eyebrow tone="gold" size="md">Start your journey</Eyebrow>
          <h2 className="mt-6 se-serif text-[#fafafa] text-4xl md:text-6xl lg:text-7xl leading-[0.95]">
            Ready to experience something different?
          </h2>
          <p className="mt-6 se-body text-[#99907c] text-base md:text-lg max-w-xl mx-auto">
            Discover limited drops, premium quality, and islandwide delivery — all from one Sri Lankan brand.
          </p>
          <div className="mt-10 md:mt-12 flex justify-center">
            <Link to="/shopping/product-list">
              <Btn variant="default" size="lg" iconRight={ArrowRight}>
                Shop Now
              </Btn>
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
};

export default AboutPage;
