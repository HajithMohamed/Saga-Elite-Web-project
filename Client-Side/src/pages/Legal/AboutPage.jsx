import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
} from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Mail,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  Heart,
  Zap,
  Award,
  Leaf,
  Globe,
  Crown,
  Users,
} from "lucide-react";
import usePageMeta from "@/hooks/use-page-meta";
import { CONTACT_INFO as CONTACT_INFO_FALLBACK } from "@/config";
import useShopAbout from "@/hooks/use-shop-about";
import { API_V1_URL as API_BASE } from "@/lib/api";
import {
  AnimatedLogo,
  Btn,
  Eyebrow,
  Hairline,
  Marquee,
  Reveal,
} from "@/components/ui/editorial";

const VALUE_ICON_MAP = {
  ShieldCheck,
  Sparkles,
  Star,
  Heart,
  Zap,
  Award,
  Leaf,
  Globe,
  Crown,
  Users,
};

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
    display: typeof target === "number" ? `${value}${suffix}` : target,
  };
};

const StatCell = ({ stat, index }) => {
  const raw = stat.number ?? stat.value ?? "";
  const suffix = stat.suffix || "";
  const isNumeric = typeof raw === "number" || /^\d+$/.test(String(raw));
  const numericTarget = isNumeric ? Number(raw) : null;
  const animated = useAnimatedNumber(numericTarget ?? 0, suffix);

  const display = isNumeric
    ? animated.display
    : `${raw}${suffix}`;

  return (
    <div ref={isNumeric ? animated.ref : undefined} className="bg-[#0e0e0e] p-5 md:p-7">
      <span className="block se-serif text-[#fafafa] text-5xl md:text-7xl tabular-nums leading-none">
        {display}
      </span>
      <Eyebrow tone="muted" size="xs" className="block mt-4">
        {stat.label || ""}
      </Eyebrow>
    </div>
  );
};

const InstagramGlyph = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path
      fill="currentColor"
      d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
    />
  </svg>
);

const FacebookGlyph = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path
      fill="currentColor"
      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
    />
  </svg>
);

const TikTokGlyph = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path
      fill="currentColor"
      d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"
    />
  </svg>
);

const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.4 });
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-px bg-[#f2ca50] z-[60] origin-left"
      style={{ scaleX }}
      aria-hidden="true"
    />
  );
};

const BrandColorBlock = ({ className = "" }) => (
  <div
    className={`w-full h-full bg-gradient-to-br from-[#1a1810] via-[#0a0a0a] to-[#0e0e0e] ${className}`}
    aria-hidden="true"
  >
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_40%,rgba(242,202,80,0.12),transparent_60%)]" />
  </div>
);

const AboutPage = () => {
  usePageMeta({
    title: "About",
    description:
      "Saga Elite — a proudly Sri Lankan fashion and lifestyle brand built on drop culture and community.",
  });

  const { data: about, loading } = useShopAbout();
  const reduced = useReducedMotion();
  const [logoUrl, setLogoUrl] = useState(null);

  const CONTACT_INFO = useMemo(
    () => ({
      email: about?.shop_contact_email || CONTACT_INFO_FALLBACK.email,
      phone: about?.shop_contact_phone || CONTACT_INFO_FALLBACK.phone,
      whatsapp: about?.shop_whatsapp_number || CONTACT_INFO_FALLBACK.whatsapp,
      addressLine1: about?.shop_address_line1 || CONTACT_INFO_FALLBACK.addressLine1,
      addressLine2:
        [about?.shop_address_city, about?.shop_address_country]
          .filter(Boolean)
          .join(", ") || CONTACT_INFO_FALLBACK.addressLine2,
      hours:
        Array.isArray(about?.shop_hours) && about.shop_hours.length > 0
          ? about.shop_hours
          : null,
      socials: {
        instagram:
          about?.shop_social_instagram || CONTACT_INFO_FALLBACK.socials.instagram,
        facebook:
          about?.shop_social_facebook || CONTACT_INFO_FALLBACK.socials.facebook,
        tiktok: about?.shop_social_tiktok || CONTACT_INFO_FALLBACK.socials.tiktok,
      },
    }),
    [about]
  );

  const heroEyebrow = about?.shop_hero_eyebrow?.trim() || "";
  const heroHeadline = about?.shop_hero_headline?.trim() || "";
  const brandStory = useMemo(
    () =>
      (Array.isArray(about?.about_brand_story) ? about.about_brand_story : [])
        .map((p) => (typeof p === "string" ? p : p?.text || ""))
        .filter(Boolean),
    [about?.about_brand_story]
  );
  const stats = useMemo(
    () => (Array.isArray(about?.about_stats) ? about.about_stats : []).filter((s) => s?.label),
    [about?.about_stats]
  );
  const values = useMemo(
    () =>
      (Array.isArray(about?.about_values) ? about.about_values : []).filter(
        (v) => v?.title
      ),
    [about?.about_values]
  );
  const materials = useMemo(
    () =>
      (Array.isArray(about?.shop_materials) ? about.shop_materials : []).filter(
        (m) => m?.name?.trim()
      ),
    [about?.shop_materials]
  );

  const hasFounder =
    about?.shop_founder_name?.trim() &&
    about?.shop_founder_bio?.trim() &&
    about?.shop_founder_photo_url?.trim();

  const heroImage = about?.shop_logo_url || logoUrl;

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

  const marqueeItems = useMemo(() => {
    if (stats.length > 0) {
      return stats.map((s) => `${s.number ?? s.value ?? ""}${s.suffix || ""} ${s.label}`.trim());
    }
    return ["Made in Sri Lanka", "Limited drops", "Rare fit forever"];
  }, [stats]);

  const headlineWords = heroHeadline ? heroHeadline.split(/\s+/) : [];

  if (loading && !about?.about_brand_story) {
    return (
      <div className="bg-[#0a0a0a] text-[#e5e2e1] min-h-screen flex items-center justify-center">
        <div className="animate-pulse se-body text-[#574500]">Loading…</div>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0a] text-[#e5e2e1] se-body min-h-screen overflow-x-hidden">
      <ScrollProgress />

      {/* HERO */}
      <section className="relative min-h-[75vh] md:min-h-[85vh] overflow-hidden flex items-end">
        <motion.div
          className="absolute inset-0 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduced ? 0.3 : 0.8 }}
        >
          {heroImage ? (
            <img
              src={heroImage}
              alt=""
              className="w-full h-full object-contain object-center opacity-30"
              loading="eager"
            />
          ) : (
            <BrandColorBlock />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/70 to-[#0a0a0a]/40" />
        </motion.div>

        <div className="relative w-full px-5 md:px-12 lg:px-16 pb-16 md:pb-20 max-w-7xl">
          {heroEyebrow ? (
            <Reveal>
              <Eyebrow tone="gold" size="md">{heroEyebrow}</Eyebrow>
            </Reveal>
          ) : null}

          {heroHeadline ? (
            <h1 className="mt-5 md:mt-7 se-serif text-[#fafafa] leading-[0.92] text-5xl sm:text-6xl md:text-8xl max-w-5xl">
              {headlineWords.length > 1 ? (
                headlineWords.map((word, i) => (
                  <span key={i} className="block overflow-hidden">
                    <motion.span
                      className="block"
                      initial={{ y: "110%" }}
                      animate={{ y: "0%" }}
                      transition={{
                        duration: 0.85,
                        delay: 0.2 + i * 0.12,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      {word}
                    </motion.span>
                  </span>
                ))
              ) : (
                <span>{heroHeadline}</span>
              )}
            </h1>
          ) : (
            <h1 className="mt-5 se-serif text-[#fafafa] text-5xl md:text-7xl">About Saga Elite</h1>
          )}

          {brandStory[0] ? (
            <Reveal delay={0.2}>
              <p className="mt-6 max-w-xl se-body text-[#d0c5af] text-base md:text-lg leading-relaxed">
                {brandStory[0]}
              </p>
            </Reveal>
          ) : null}

          <Reveal delay={0.3}>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link to="/shopping/product-list">
                <Btn variant="default" iconRight={ArrowRight}>Shop drops</Btn>
              </Link>
              <Link to="/contact">
                <Btn variant="outline">Contact us</Btn>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {marqueeItems.length > 0 ? <Marquee tone="gold" items={marqueeItems} /> : null}

      {/* LOGO MOMENT */}
      <section className="relative bg-[#0a0a0a] border-b border-[#4d4635]/40 overflow-hidden">
        <div className="relative px-5 md:px-12 py-20 md:py-28 max-w-7xl mx-auto flex flex-col items-center">
          <Reveal>
            <Eyebrow tone="gold" size="md">
              {about?.shop_brand_name || "Saga Elite"}
            </Eyebrow>
          </Reveal>
          <div className="mt-12 md:mt-16 flex justify-center">
            <AnimatedLogo
              diameter={420}
              eyebrow={about?.shop_tagline || "RARE FIT FOREVER"}
              caption="MADE IN SRI LANKA"
            />
          </div>
        </div>
      </section>

      {/* BRAND STORY */}
      {brandStory.length > 0 ? (
        <section className="px-5 md:px-12 py-16 md:py-28 max-w-4xl mx-auto">
          <Reveal>
            <Eyebrow tone="gold" size="md">Our story</Eyebrow>
            <h2 className="mt-4 se-serif text-[#e5e2e1] text-3xl md:text-5xl leading-tight">
              Who we are
            </h2>
          </Reveal>
          <div className="mt-8 space-y-5">
            {brandStory.map((para, i) => (
              <Reveal key={i} delay={i * 0.06}>
                <p className="se-body text-[#d0c5af] text-base md:text-lg leading-[1.7]">
                  {para}
                </p>
              </Reveal>
            ))}
          </div>
        </section>
      ) : (
        <section className="px-5 md:px-12 py-16 max-w-4xl mx-auto">
          <p className="se-body text-[#574500] text-center">
            Brand story content will appear here once configured in the admin.
          </p>
        </section>
      )}

      {/* STATS */}
      {stats.length > 0 ? (
        <section className="border-y border-[#4d4635]/40 bg-[#0e0e0e]">
          <div className="px-5 md:px-12 py-12 md:py-16 max-w-7xl mx-auto">
            <Reveal>
              <Eyebrow tone="gold" size="md">By the numbers</Eyebrow>
            </Reveal>
            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-px bg-[#4d4635]/40">
              {stats.map((stat, i) => (
                <StatCell key={i} stat={stat} index={i} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* VALUES */}
      {values.length > 0 ? (
        <section className="px-5 md:px-12 py-16 md:py-28 max-w-7xl mx-auto">
          <Reveal>
            <Eyebrow tone="gold" size="md">What we stand for</Eyebrow>
            <h2 className="mt-3 se-serif text-[#e5e2e1] text-3xl md:text-5xl">Our values</h2>
          </Reveal>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-px bg-[#4d4635]/40">
            {values.map((v, i) => {
              const Icon = VALUE_ICON_MAP[v.icon] || Sparkles;
              const body = v.desc || v.body || "";
              return (
                <Reveal key={i} delay={i * 0.08} className="bg-[#0a0a0a]">
                  <div className="p-7 md:p-10 h-full flex flex-col">
                    <Icon className="h-8 w-8 text-[#f2ca50]" strokeWidth={1.25} />
                    <h3 className="mt-6 se-headline text-[#e5e2e1] text-2xl md:text-3xl">
                      {v.title}
                    </h3>
                    <Hairline className="mt-5" />
                    {body ? (
                      <p className="mt-5 se-body text-[#d0c5af] text-sm md:text-base leading-relaxed">
                        {body}
                      </p>
                    ) : null}
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* FOUNDER — only when fully configured */}
      {hasFounder ? (
        <section className="px-5 md:px-12 py-16 md:py-28 max-w-7xl mx-auto border-t border-[#4d4635]/40">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <Reveal className="lg:col-span-5">
              <div className="relative" style={{ aspectRatio: "4/5" }}>
                <img
                  src={about.shop_founder_photo_url}
                  alt={about.shop_founder_name}
                  className="w-full h-full object-cover border border-[#4d4635]"
                  loading="lazy"
                />
              </div>
            </Reveal>
            <Reveal className="lg:col-span-7 lg:pt-8" delay={0.1}>
              <Eyebrow tone="gold" size="md">Founder</Eyebrow>
              <h2 className="mt-3 se-serif text-[#e5e2e1] text-3xl md:text-5xl">
                {about.shop_founder_name}
              </h2>
              {about.shop_founder_title ? (
                <p className="mt-2 se-body text-[#99907c]">{about.shop_founder_title}</p>
              ) : null}
              <p className="mt-6 se-body text-[#d0c5af] text-base leading-[1.7] whitespace-pre-line">
                {about.shop_founder_bio}
              </p>
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* MATERIALS — only when configured */}
      {materials.length > 0 ? (
        <section className="border-t border-[#4d4635]/40 bg-[#0e0e0e]">
          <div className="px-5 md:px-12 py-16 md:py-28 max-w-7xl mx-auto">
            <Reveal>
              <Eyebrow tone="gold" size="md">Materials</Eyebrow>
              <h2 className="mt-3 se-serif text-[#e5e2e1] text-3xl md:text-5xl">What we use</h2>
            </Reveal>
            <div className="mt-10 border border-[#4d4635]">
              {materials.map((m, i) => (
                <div
                  key={i}
                  className={`flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 px-5 md:px-7 py-5 ${
                    i < materials.length - 1 ? "border-b border-[#4d4635]/60" : ""
                  }`}
                >
                  <Eyebrow tone="muted" size="xs">{m.name}</Eyebrow>
                  {m.description ? (
                    <span className="se-body text-sm md:text-base text-[#e5e2e1] sm:text-right sm:max-w-[60%]">
                      {m.description}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* VISIT */}
      <section className="px-5 md:px-12 py-16 md:py-28 max-w-7xl mx-auto">
        <Reveal>
          <Eyebrow tone="gold" size="md">Visit</Eyebrow>
          <h2 className="mt-3 se-serif text-[#e5e2e1] text-3xl md:text-5xl">Get in touch</h2>
        </Reveal>
        <div className="mt-10 border border-[#4d4635] max-w-xl">
          <div className="flex items-baseline justify-between gap-4 px-5 py-4 border-b border-[#4d4635]/60">
            <Eyebrow tone="muted" size="xs">Where</Eyebrow>
            <span className="se-body text-sm text-[#e5e2e1] text-right">
              {CONTACT_INFO.addressLine1}
              {CONTACT_INFO.addressLine2 ? `, ${CONTACT_INFO.addressLine2}` : ""}
            </span>
          </div>
          {CONTACT_INFO.hours ? (
            <div className="px-5 py-4 border-b border-[#4d4635]/60">
              <Eyebrow tone="muted" size="xs">Business hours</Eyebrow>
              <ul className="mt-3 space-y-2">
                {CONTACT_INFO.hours.map((row, i) => (
                  <li key={i} className="flex justify-between gap-4 text-sm">
                    <span className="text-[#99907c]">{row.day}</span>
                    <span className="se-mono text-[#e5e2e1] tabular-nums">{row.hours}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="flex items-baseline justify-between gap-4 px-5 py-4 border-b border-[#4d4635]/60">
            <Eyebrow tone="muted" size="xs">Email</Eyebrow>
            <a
              href={`mailto:${CONTACT_INFO.email}`}
              className="se-mono text-sm text-[#f2ca50] hover:text-[#ffe088] transition-colors"
            >
              {CONTACT_INFO.email}
            </a>
          </div>
          <div className="flex items-baseline justify-between gap-4 px-5 py-4">
            <Eyebrow tone="muted" size="xs">Phone</Eyebrow>
            <a href={`tel:${CONTACT_INFO.phone}`} className="se-mono text-sm text-[#e5e2e1]">
              {CONTACT_INFO.phone}
            </a>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link to="/contact">
            <Btn variant="default" icon={Mail}>Contact us</Btn>
          </Link>
          <a
            href={`https://wa.me/${(CONTACT_INFO.whatsapp || "").replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Btn variant="outline" icon={MapPin}>WhatsApp</Btn>
          </a>
        </div>
      </section>

      {/* SOCIALS */}
      <section className="border-t border-[#4d4635]/40 bg-[#0e0e0e]">
        <div className="px-5 md:px-12 py-16 md:py-24 max-w-7xl mx-auto">
          <Reveal>
            <Eyebrow tone="gold" size="md">Connect</Eyebrow>
            <h2 className="mt-3 se-serif text-[#e5e2e1] text-3xl md:text-5xl">Follow along</h2>
          </Reveal>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-px bg-[#4d4635]/40">
            {[
              { href: CONTACT_INFO.socials.instagram, label: "Instagram", Glyph: InstagramGlyph },
              { href: CONTACT_INFO.socials.facebook, label: "Facebook", Glyph: FacebookGlyph },
              { href: CONTACT_INFO.socials.tiktok, label: "TikTok", Glyph: TikTokGlyph },
            ]
              .filter((s) => s.href)
              .map((s, i) => (
                <Reveal key={s.label} delay={i * 0.06} className="bg-[#0a0a0a]">
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block p-7 md:p-10 h-full transition-colors hover:bg-[#131313]"
                  >
                    <div className="flex items-start justify-between">
                      <s.Glyph className="h-7 w-7 text-[#f2ca50]" />
                      <ArrowUpRight
                        size={18}
                        strokeWidth={1.25}
                        className="text-[#99907c] transition-all group-hover:text-[#f2ca50] group-hover:translate-x-1 group-hover:-translate-y-1"
                      />
                    </div>
                    <Eyebrow tone="muted" size="xs" className="mt-8 block">
                      {s.label}
                    </Eyebrow>
                    <Hairline className="mt-5" />
                  </a>
                </Reveal>
              ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 md:px-12 py-16 md:py-28 max-w-7xl mx-auto">
        <Reveal>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <Eyebrow tone="gold" size="md">Join us</Eyebrow>
              <h2 className="mt-4 se-serif text-[#e5e2e1] text-4xl md:text-6xl leading-tight">
                Become part of the community
              </h2>
            </div>
            <div className="lg:col-span-4 flex flex-wrap gap-4 lg:justify-end">
              <Link to="/auth/register">
                <Btn variant="default" size="lg" iconRight={ArrowRight}>Create account</Btn>
              </Link>
              <Link to="/shopping/product-list">
                <Btn variant="outline" size="lg">Browse drops</Btn>
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
};

export default AboutPage;
