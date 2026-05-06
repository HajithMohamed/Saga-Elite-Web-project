import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
} from "framer-motion";
import { ArrowRight, ArrowUpRight, Mail, MapPin } from "lucide-react";
import usePageMeta from "@/hooks/use-page-meta";
import { CONTACT_INFO } from "@/config";
import { API_V1_URL as API_BASE } from "@/lib/api";
import {
  AnimatedLogo,
  Btn,
  Eyebrow,
  Hairline,
  Img,
  Marquee,
  PullQuote,
  Reveal,
} from "@/components/ui/editorial";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1800&q=80&auto=format&fit=crop";
const PROCESS_IMAGE =
  "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1800&q=80&auto=format&fit=crop";
const FOUNDER_IMAGE =
  "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1200&q=80&auto=format&fit=crop";
const ATELIER_IMAGE =
  "https://images.unsplash.com/photo-1558769132-92e28c91c6f9?w=1200&q=80&auto=format&fit=crop";

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

const VALUES = [
  {
    n: "01",
    title: "Slowly",
    body:
      "Each piece passes one bench at a time. The cutter, the seamster, the finisher. Nothing is rushed because nothing is restocked.",
  },
  {
    n: "02",
    title: "Honestly",
    body:
      "We tell you where the wool came from, who finished the buttonhole, how many remain. The price is what it costs to make it well.",
  },
  {
    n: "03",
    title: "Once",
    body:
      "Eighty-four pieces a chapter. When they are gone, they are gone. There is something quiet about a thing that exists only once.",
  },
];

const MATERIALS = [
  ["Wool", "Itoi Mill, Biella · Japan"],
  ["Cotton", "Long-staple, southern coast · Sri Lanka"],
  ["Linings", "Viscose-cupro twill · Lyon"],
  ["Buttons", "Corozo nut · finished by hand in Battaramulla"],
  ["Lining stitch", "Hand-prick · 9 stitches per inch"],
  ["Thread", "Gütermann silk · 30/2"],
];

const AboutPage = () => {
  usePageMeta({
    title: "About",
    description:
      "Saga Elite — an atelier of limited-edition streetwear, made in Sri Lanka.",
  });

  const reduced = useReducedMotion();
  const [logoUrl, setLogoUrl] = useState(null);

  const statPieces = useAnimatedNumber(84);
  const statCountries = useAnimatedNumber(93);
  const statChapters = useAnimatedNumber(14);
  const statHours = useAnimatedNumber(36);

  useEffect(() => {
    axios
      .get(`${API_BASE}/image/get-logo-images`)
      .then((res) => {
        const url = res?.data?.images?.[0]?.url;
        if (url) setLogoUrl(url);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="bg-[#0a0a0a] text-[#e5e2e1] se-body min-h-screen overflow-x-hidden">
      <ScrollProgress />

      {/* HERO ── editorial cover */}
      <section className="relative min-h-[88vh] md:min-h-[92vh] overflow-hidden flex items-end">
        {/* Background image with slow zoom */}
        <motion.div
          className="absolute inset-0 overflow-hidden"
          initial={{ scale: 1.08, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: reduced ? 0.4 : 1.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <img
            src={HERO_IMAGE}
            alt=""
            className="w-full h-full object-cover"
            loading="eager"
          />
          <motion.div
            className="absolute inset-0"
            animate={!reduced ? { scale: [1, 1.04] } : {}}
            transition={{ duration: 22, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/55 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/70 via-transparent to-[#0a0a0a]/40" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_25%,rgba(242,202,80,0.08),transparent_55%)]" />
        </motion.div>

        {/* Hairline frame */}
        {[
          { c: "top-3 md:top-6 left-3 md:left-6 right-3 md:right-6 h-px origin-left", k: "scaleX", t: 0.1 },
          { c: "bottom-3 md:bottom-6 left-3 md:left-6 right-3 md:right-6 h-px origin-right", k: "scaleX", t: 0.2 },
          { c: "top-3 md:top-6 bottom-3 md:bottom-6 left-3 md:left-6 w-px origin-top", k: "scaleY", t: 0.25 },
          { c: "top-3 md:top-6 bottom-3 md:bottom-6 right-3 md:right-6 w-px origin-bottom", k: "scaleY", t: 0.3 },
        ].map((f, i) => (
          <motion.div
            key={i}
            className={`absolute ${f.c} bg-[#e5e2e1]/15`}
            initial={{ [f.k]: 0 }}
            animate={{ [f.k]: 1 }}
            transition={{ duration: 1, delay: f.t, ease: [0.65, 0, 0.35, 1] }}
          />
        ))}

        {/* Top corner labels */}
        <motion.div
          className="absolute top-8 md:top-12 left-8 md:left-12 right-8 md:right-12 flex items-start justify-between"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
        >
          <Eyebrow tone="muted" size="sm">EST · MMXXVI · COLOMBO</Eyebrow>
          <Eyebrow tone="muted" size="sm">Origin · The Atelier</Eyebrow>
        </motion.div>

        {/* Lockup */}
        <div className="relative w-full px-5 md:px-12 lg:px-16 pb-16 md:pb-20 lg:pb-28 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <Eyebrow tone="gold" size="md">About · The atelier</Eyebrow>
          </motion.div>

          <h1 className="mt-5 md:mt-7 se-serif text-[#fafafa] leading-[0.92] text-5xl sm:text-7xl md:text-[110px] lg:text-[140px] max-w-5xl">
            <span className="block overflow-hidden">
              <motion.span
                className="block"
                initial={{ y: "110%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 0.85, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                Quietly
              </motion.span>
            </span>
            <span className="block overflow-hidden">
              <motion.span
                className="block"
                initial={{ y: "110%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 0.85, delay: 0.85, ease: [0.22, 1, 0.36, 1] }}
              >
                made.
              </motion.span>
            </span>
          </h1>

          <motion.div
            className="mt-7 md:mt-9 h-px bg-[#f2ca50] origin-left"
            style={{ width: 84 }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.7, delay: 1.05, ease: [0.65, 0, 0.35, 1] }}
          />

          <motion.p
            className="mt-6 max-w-xl se-body text-[#d0c5af] text-base md:text-lg leading-relaxed"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.2 }}
          >
            An atelier of limited-edition streetwear, made by hand in Sri Lanka and sent to
            ninety-three countries. Eighty-four pieces a chapter. Nothing restocks.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-wrap items-center gap-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.35 }}
          >
            <Link to="/shopping/product-list">
              <Btn variant="default" iconRight={ArrowRight}>Read this chapter</Btn>
            </Link>
            <Link to="/contact">
              <Btn variant="outline">Visit the atelier</Btn>
            </Link>
          </motion.div>
        </div>

        {/* Bottom-left chapter mark */}
        <motion.div
          className="absolute bottom-3 md:bottom-6 left-8 md:left-12 flex items-center gap-2 se-mono text-[10px] text-[#574500]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.6 }}
        >
          <motion.span
            className="w-1.5 h-1.5 rounded-full bg-[#f2ca50]"
            animate={!reduced ? { opacity: [1, 0.3, 1] } : {}}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
          Open by appointment
        </motion.div>
      </section>

      {/* VALUES MARQUEE */}
      <Marquee
        tone="gold"
        items={[
          "Eighty-four pieces a chapter",
          "Made in Sri Lanka",
          "Hand-finished in Battaramulla",
          "No restock",
          "Ninety-three countries",
          "Members enter first",
        ]}
      />

      {/* BRAND MOMENT ── animated solar logo */}
      <section className="relative bg-[#0a0a0a] border-b border-[#4d4635]/40 overflow-hidden">
        {/* Soft ambient gold gradient backdrop */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 50%, rgba(242,202,80,0.06) 0%, rgba(212,175,55,0.02) 40%, transparent 70%)",
          }}
        />
        {/* Subtle grain */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), radial-gradient(rgba(0,0,0,0.4) 1px, transparent 1px)",
            backgroundSize: "3px 3px, 4px 4px",
            backgroundPosition: "0 0, 1px 2px",
          }}
        />

        <div className="relative px-5 md:px-12 py-20 md:py-28 max-w-7xl mx-auto flex flex-col items-center">
          <Reveal>
            <Eyebrow tone="gold" size="md">The atelier</Eyebrow>
          </Reveal>
          <Reveal delay={0.06}>
            <h2 className="mt-3 se-serif text-[#e5e2e1] text-center leading-[1.0] text-2xl md:text-4xl max-w-md mx-auto">
              A small house, a slow orbit.
            </h2>
          </Reveal>

          <div className="mt-12 md:mt-16 flex justify-center">
            <AnimatedLogo
              diameter={420}
              eyebrow="EST · MMXXVI · COLOMBO"
              caption="MADE IN SRI LANKA"
            />
          </div>

          <Reveal delay={0.4}>
            <div className="mt-20 md:mt-24 flex items-center gap-4">
              <Hairline tone="strong" className="w-10" />
              <span className="se-label text-[10px] tracking-[0.32em] text-[#99907c]">
                Sent to ninety-three countries
              </span>
              <Hairline tone="strong" className="w-10" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ORIGIN ── 7/5 split */}
      <section className="px-5 md:px-12 py-16 md:py-28 lg:py-32 max-w-7xl mx-auto">
        <Reveal>
          <Eyebrow tone="gold" size="md">Origin</Eyebrow>
          <h2 className="mt-4 se-serif text-[#e5e2e1] leading-[1.0] text-3xl md:text-5xl lg:text-6xl max-w-3xl">
            We began with a question, not a collection.
          </h2>
        </Reveal>

        <div className="mt-12 md:mt-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <Reveal className="lg:col-span-7">
            <div className="relative" style={{ aspectRatio: "4/5" }}>
              <img
                src={FOUNDER_IMAGE}
                alt="Hajith de Silva, founder"
                className="w-full h-full object-cover border border-[#4d4635]"
                loading="lazy"
              />
              <div className="absolute -bottom-3 -right-3 bg-[#0a0a0a] border border-[#4d4635] px-4 py-3">
                <Eyebrow tone="muted" size="xs">Hajith de Silva</Eyebrow>
                <div className="mt-1 se-body text-xs text-[#d0c5af]">Founder · Cutter</div>
              </div>
            </div>
          </Reveal>

          <Reveal className="lg:col-span-5 lg:pt-12" delay={0.1}>
            <Eyebrow tone="muted" size="xs">A note from the atelier</Eyebrow>
            <p className="mt-4 se-body text-[#e5e2e1] text-base md:text-lg leading-[1.7]">
              Could clothing be made the way it was — by hand, in small numbers, by
              people who wear it themselves — and still arrive in front of a customer
              today? That was the question.
            </p>
            <p className="mt-5 se-body text-[#d0c5af] text-sm md:text-base leading-[1.7]">
              We opened the atelier in early MMXXVI on the second floor of a quiet
              building in Battaramulla. There were three sewing machines, two cutting
              tables, and a kettle. We made the first piece, the Tally Coat, by
              hand, signed it inside the placket, and posted a single photograph
              the next morning. It sold to a customer in Mirissa within an hour.
            </p>
            <p className="mt-5 se-body text-[#d0c5af] text-sm md:text-base leading-[1.7]">
              The rule has not changed since: nothing leaves the atelier without
              someone in it. Nothing restocks. Each chapter is photographed,
              numbered, and released as a single drop. When it is finished, it
              is finished.
            </p>

            <div className="mt-8 flex items-center gap-3">
              <Hairline tone="strong" className="w-12" />
              <span className="se-label text-[10px] tracking-[0.32em] text-[#99907c]">
                Battaramulla · MMXXVI
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* LEDGER ── animated stat row */}
      <section className="border-y border-[#4d4635]/40 bg-[#0e0e0e]">
        <div className="px-5 md:px-12 py-12 md:py-16 max-w-7xl mx-auto">
          <Reveal>
            <Eyebrow tone="gold" size="md">The ledger</Eyebrow>
            <h2 className="mt-3 se-serif text-[#e5e2e1] text-2xl md:text-4xl">
              Numbers, kept honestly.
            </h2>
          </Reveal>

          <div className="mt-10 md:mt-12 grid grid-cols-2 md:grid-cols-4 gap-px bg-[#4d4635]/40">
            {[
              { n: statPieces, label: "Pieces this chapter", hint: "Tide & Tally · 14" },
              { n: statCountries, label: "Countries shipped to", hint: "Across six continents" },
              { n: statChapters, label: "Chapters released", hint: "Since opening" },
              { n: statHours, label: "Hours per piece", hint: "Cut, sewn, finished" },
            ].map((s, i) => (
              <div
                key={i}
                ref={s.n.ref}
                className="bg-[#0e0e0e] p-5 md:p-7"
              >
                <span className="block se-serif text-[#fafafa] text-5xl md:text-7xl tabular-nums leading-none">
                  {s.n.display}
                </span>
                <Eyebrow tone="muted" size="xs" className="block mt-4">
                  {s.label}
                </Eyebrow>
                <span className="block mt-2 se-body text-xs text-[#574500]">
                  {s.hint}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PULL QUOTE ── full-bleed image */}
      <section className="relative">
        <div className="relative h-[420px] md:h-[640px] overflow-hidden">
          <img
            src={PROCESS_IMAGE}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/95 via-[#0a0a0a]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/80 via-transparent to-transparent" />
        </div>
        <div className="px-5 md:px-12 py-12 md:py-20 max-w-4xl mx-auto md:-mt-32 relative">
          <PullQuote attribution="Hajith de Silva, founder">
            We do not chase the season. We do not chase anyone.
            A piece is finished when it is finished.
          </PullQuote>
        </div>
      </section>

      {/* THREE VALUES */}
      <section className="px-5 md:px-12 py-16 md:py-28 max-w-7xl mx-auto">
        <Reveal>
          <Eyebrow tone="gold" size="md">House rules</Eyebrow>
          <h2 className="mt-3 se-serif text-[#e5e2e1] leading-[1.0] text-3xl md:text-5xl lg:text-6xl max-w-3xl">
            Three principles,<br />held quietly.
          </h2>
        </Reveal>

        <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-px bg-[#4d4635]/40">
          {VALUES.map((v, i) => (
            <Reveal key={v.n} delay={i * 0.08} className="bg-[#0a0a0a]">
              <div className="p-7 md:p-10 h-full flex flex-col">
                <span className="se-serif text-[#f2ca50] text-7xl md:text-8xl tabular-nums leading-none">
                  {v.n}
                </span>
                <h3 className="mt-8 se-headline text-[#e5e2e1] text-3xl md:text-4xl">
                  {v.title}
                </h3>
                <Hairline className="mt-5" />
                <p className="mt-5 se-body text-[#d0c5af] text-sm md:text-base leading-relaxed">
                  {v.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* MATERIALS LEDGER */}
      <section className="border-t border-[#4d4635]/40 bg-[#0e0e0e]">
        <div className="px-5 md:px-12 py-16 md:py-28 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            <Reveal className="lg:col-span-5">
              <Eyebrow tone="gold" size="md">The materials</Eyebrow>
              <h2 className="mt-3 se-serif text-[#e5e2e1] leading-[1.0] text-3xl md:text-5xl">
                Sourced<br />by hand.
              </h2>
              <p className="mt-6 se-body text-[#d0c5af] text-sm md:text-base leading-relaxed max-w-md">
                Every piece begins with where its parts come from. We tell you because
                you are buying a thing made of other things, and you should know.
              </p>
            </Reveal>

            <Reveal className="lg:col-span-7" delay={0.08}>
              <div className="border border-[#4d4635]">
                {MATERIALS.map(([k, v], i) => (
                  <div
                    key={k}
                    className={`flex items-baseline justify-between gap-6 px-5 md:px-7 py-5 ${
                      i < MATERIALS.length - 1 ? "border-b border-[#4d4635]/60" : ""
                    }`}
                  >
                    <Eyebrow tone="muted" size="xs">{k}</Eyebrow>
                    <span className="se-body text-sm md:text-base text-[#e5e2e1] text-right max-w-[60%]">
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ATELIER ADDRESS ── hairline location card */}
      <section className="px-5 md:px-12 py-16 md:py-28 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-stretch">
          <Reveal className="lg:col-span-7">
            <div className="relative" style={{ aspectRatio: "4/3" }}>
              <img
                src={ATELIER_IMAGE}
                alt="The atelier"
                className="w-full h-full object-cover border border-[#4d4635]"
                loading="lazy"
              />
              <div className="absolute top-4 left-4 bg-[#0a0a0a]/85 backdrop-blur-sm border border-[#4d4635] px-3 py-2">
                <Eyebrow tone="gold" size="xs">The atelier</Eyebrow>
              </div>
            </div>
          </Reveal>

          <Reveal className="lg:col-span-5" delay={0.08}>
            <Eyebrow tone="gold" size="md">Visit</Eyebrow>
            <h2 className="mt-3 se-serif text-[#e5e2e1] leading-[1.0] text-3xl md:text-5xl">
              By appointment,<br />always.
            </h2>
            <p className="mt-5 se-body text-[#d0c5af] text-sm md:text-base leading-relaxed">
              The atelier is a workplace, not a shop. Members may visit between
              nine and seven on Saturdays, by appointment. We will pour something.
            </p>

            <div className="mt-8 border border-[#4d4635]">
              <div className="flex items-baseline justify-between gap-4 px-5 py-4 border-b border-[#4d4635]/60">
                <Eyebrow tone="muted" size="xs">Where</Eyebrow>
                <span className="se-body text-sm text-[#e5e2e1] text-right">
                  {CONTACT_INFO.addressLine1}, {CONTACT_INFO.addressLine2}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-4 px-5 py-4 border-b border-[#4d4635]/60">
                <Eyebrow tone="muted" size="xs">Hours</Eyebrow>
                <span className="se-body text-xs text-[#d0c5af] text-right max-w-[60%]">
                  {CONTACT_INFO.hours}
                </span>
              </div>
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
                <a
                  href={`tel:${CONTACT_INFO.phone}`}
                  className="se-mono text-sm text-[#e5e2e1]"
                >
                  {CONTACT_INFO.phone}
                </a>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/contact">
                <Btn variant="default" icon={Mail}>Reach the atelier</Btn>
              </Link>
              <a
                href={`https://wa.me/${(CONTACT_INFO.whatsapp || "").replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Btn variant="outline" icon={MapPin}>Find on map</Btn>
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CONNECT ── editorial socials */}
      <section className="border-t border-[#4d4635]/40 bg-[#0e0e0e]">
        <div className="px-5 md:px-12 py-16 md:py-24 max-w-7xl mx-auto">
          <Reveal>
            <Eyebrow tone="gold" size="md">Connect</Eyebrow>
            <h2 className="mt-3 se-serif text-[#e5e2e1] leading-[1.0] text-3xl md:text-5xl">
              Read the journal,<br />slowly.
            </h2>
          </Reveal>

          <div className="mt-12 md:mt-14 grid grid-cols-1 md:grid-cols-3 gap-px bg-[#4d4635]/40">
            {[
              {
                href: CONTACT_INFO.socials.instagram,
                handle: "@sagaaelite",
                label: "Instagram",
                Glyph: InstagramGlyph,
                hint: "Daily photographs",
              },
              {
                href: CONTACT_INFO.socials.facebook,
                handle: "Saga Elite",
                label: "Facebook",
                Glyph: FacebookGlyph,
                hint: "The longer journal",
              },
              {
                href: CONTACT_INFO.socials.tiktok,
                handle: "@sagaa_elite",
                label: "TikTok",
                Glyph: TikTokGlyph,
                hint: "From the atelier floor",
              },
            ].map((s, i) => (
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
                  <div className="mt-2 se-headline text-[#e5e2e1] text-2xl md:text-3xl">
                    {s.handle}
                  </div>
                  <Hairline className="mt-5" />
                  <span className="block mt-5 se-body text-xs md:text-sm text-[#d0c5af]">
                    {s.hint}
                  </span>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA ── next chapter */}
      <section className="px-5 md:px-12 py-16 md:py-28 max-w-7xl mx-auto">
        <Reveal>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
            <div className="lg:col-span-8">
              <Eyebrow tone="gold" size="md">Next chapter</Eyebrow>
              <h2 className="mt-4 se-serif text-[#e5e2e1] leading-[0.95] text-4xl md:text-6xl lg:text-7xl">
                Become a member.<br />Enter first.
              </h2>
              <p className="mt-6 se-body text-[#d0c5af] text-base md:text-lg max-w-2xl leading-relaxed">
                Members receive private viewing thirty-six hours before each chapter
                opens, an occasional essay, and a private link to the lookbook.
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-wrap items-center gap-4 lg:justify-end">
              <Link to="/auth/register">
                <Btn variant="default" size="lg" iconRight={ArrowRight}>
                  Open an account
                </Btn>
              </Link>
              <Link to="/shopping/product-list">
                <Btn variant="outline" size="lg">
                  Browse this chapter
                </Btn>
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Optional brand watermark from logo */}
      {logoUrl ? (
        <div
          className="pointer-events-none fixed inset-x-0 bottom-0 h-32 opacity-[0.025] bg-no-repeat bg-center bg-contain"
          style={{ backgroundImage: `url(${logoUrl})` }}
          aria-hidden="true"
        />
      ) : null}
    </div>
  );
};

export default AboutPage;
