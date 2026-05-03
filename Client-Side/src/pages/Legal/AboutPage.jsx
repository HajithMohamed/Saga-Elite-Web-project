import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { motion, useInView } from "framer-motion";
import { ShieldCheck, Users, Zap } from "lucide-react";
import usePageMeta from "@/hooks/use-page-meta";
import { CONTACT_INFO } from "@/config";
import { API_V1_URL as API_BASE } from "@/lib/api";

const useAnimatedStat = (target, suffix = "", duration = 1.8) => {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  useEffect(() => {
    if (!isInView || typeof target !== "number") return;
    let start = 0;
    const startTime = performance.now();
    const tick = (now) => {
      const p = Math.min((now - startTime) / (duration * 1000), 1);
      const eased = 1 - (1 - p) ** 3;
      setValue(Math.floor(eased * target));
      if (p < 1) requestAnimationFrame(tick);
      else setValue(target);
    };
    requestAnimationFrame(tick);
  }, [isInView, target, duration]);

  return { ref, display: typeof target === "number" ? `${value}${suffix}` : target };
};

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="h-10 w-10 text-white" aria-hidden="true">
    <path
      fill="currentColor"
      d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
    />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="h-10 w-10 text-white" aria-hidden="true">
    <path
      fill="currentColor"
      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
    />
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="h-10 w-10 text-white" aria-hidden="true">
    <path
      fill="currentColor"
      d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"
    />
  </svg>
);

const FALLBACK_BRAND_PARAS = [
  "Welcome to Saga Elite — a proudly Sri Lankan fashion and lifestyle brand born from a love for modern style and premium craftsmanship.",
  "We started with a simple belief: that everyone deserves access to high-quality, contemporary fashion without exclusive price tags. Rooted in local culture but inspired by global trends, Saga Elite is more than clothing — it's a community of people who express themselves boldly every day.",
  "Our pieces are designed with premium materials so every drop looks incredible and feels made for you — from our roots to your wardrobe.",
];

const FALLBACK_STATS = [
  { number: 100, suffix: "+", label: "Products launched" },
  { number: 15, suffix: "", label: "Days delivery island-wide" },
  { number: "LK", suffix: "", label: "Proudly Sri Lankan" },
];

const FALLBACK_VALUES = [
  {
    icon: "ShieldCheck",
    title: "Premium Quality",
    desc: "Materials and construction chosen for longevity and comfort.",
  },
  {
    icon: "Users",
    title: "Community First",
    desc: "Built with Sri Lankan youth and diaspora at the centre.",
  },
  {
    icon: "Zap",
    title: "Drop Culture",
    desc: "Limited releases — rare fit, forever mindset.",
  },
];

const ICON_BY_NAME = { ShieldCheck, Users, Zap };

const NumericAnimatedStatCard = ({ number, suffix, label, bordered }) => {
  const { ref, display } = useAnimatedStat(number, suffix ?? "");
  return (
    <div
      ref={ref}
      className={`space-y-2 ${bordered ? "border-t border-[#D4AF37]/20 pt-8" : ""}`}
    >
      <p className="font-serif text-6xl font-bold text-[#D4AF37] md:text-7xl">{display}</p>
      <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">{label}</p>
    </div>
  );
};

const StaticStatCard = ({ number, suffix, label, bordered }) => (
  <div className={`space-y-2 ${bordered ? "border-t border-[#D4AF37]/20 pt-8" : ""}`}>
    <p className="font-serif text-6xl font-bold text-[#D4AF37] md:text-7xl">
      {`${number ?? ""}${suffix ?? ""}`}
    </p>
    <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">{label}</p>
  </div>
);

const AboutPage = () => {
  usePageMeta({
    title: "About Us",
    description:
      "Discover the story, values, and community behind Saga Elite streetwear.",
  });

  const [logoUrl, setLogoUrl] = useState(null);
  const [aboutData, setAboutData] = useState(null);

  useEffect(() => {
    axios
      .get(`${API_BASE}/image/get-logo-images`)
      .then((res) => {
        const url = res?.data?.images?.[0]?.url;
        if (url) setLogoUrl(url);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    axios
      .get(`${API_BASE}/site-config/about`)
      .then((res) => {
        if (res?.data?.success && res.data.data) setAboutData(res.data.data);
      })
      .catch(() => {});
  }, []);

  const brandParagraphs = Array.isArray(aboutData?.about_brand_story)
    ? aboutData.about_brand_story.filter(Boolean)
    : FALLBACK_BRAND_PARAS;

  const statsRows = Array.isArray(aboutData?.about_stats) ? aboutData.about_stats : FALLBACK_STATS;

  const valuesList = Array.isArray(aboutData?.about_values) ? aboutData.about_values : FALLBACK_VALUES;

  const teamHeading =
    typeof aboutData?.about_team_heading === "string" && aboutData.about_team_heading.trim()
      ? aboutData.about_team_heading
      : "Our Story, In Your Hands";

  const teamSubtext =
    typeof aboutData?.about_team_subtext === "string" && aboutData.about_team_subtext.trim()
      ? aboutData.about_team_subtext
      : "Team imagery coming soon — the spotlight is on you.";

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black px-6 text-center">
        {logoUrl ? (
          <div
            className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-10"
            style={{ backgroundImage: `url(${logoUrl})` }}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/90 to-black" />
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75 }}
          className="relative z-10 max-w-3xl"
        >
          <h1 className="font-serif text-5xl font-bold text-white md:text-7xl">
            We Are Saga Elite
          </h1>
          <p className="mt-6 font-sans text-lg tracking-wide text-white/80 md:text-xl">
            Born in Sri Lanka. Built for the bold.
          </p>
        </motion.div>
      </section>

      <section className="border-t border-border py-20">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
            <div className="space-y-10">
              {statsRows.map((stat, idx) => {
                const bordered = idx > 0;
                if (typeof stat?.number === "number") {
                  return (
                    <NumericAnimatedStatCard
                      key={stat.label ?? idx}
                      number={stat.number}
                      suffix={stat.suffix}
                      label={stat.label}
                      bordered={bordered}
                    />
                  );
                }
                return (
                  <StaticStatCard
                    key={stat.label ?? idx}
                    number={stat.number}
                    suffix={stat.suffix}
                    label={stat.label}
                    bordered={bordered}
                  />
                );
              })}
            </div>
            <div className="space-y-6 leading-relaxed text-on-surface/90 md:text-lg md:leading-8">
              {brandParagraphs.map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-muted/20 py-20 dark:bg-surface-container-lowest/50">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          <h2 className="mb-12 text-center font-serif text-3xl md:text-4xl">
            Our values
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {valuesList.map((v, i) => {
              const IconComp =
                ICON_BY_NAME[v.icon] || ICON_BY_NAME.ShieldCheck || ShieldCheck;
              return (
                <motion.div
                  key={`${v.title}-${i}`}
                  initial={{ opacity: 0, y: 36 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="rounded-2xl border border-[#D4AF37]/15 bg-background p-8 shadow-sm dark:bg-surface-container-low"
                >
                  <IconComp className="mb-4 h-10 w-10 text-[#D4AF37]" />
                  <h3 className="font-serif text-xl font-semibold">{v.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          <div className="about-team-shimmer relative flex min-h-[280px] flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-[#D4AF37]/50 bg-muted/30 px-6 dark:bg-black/40">
            <p className="font-serif text-2xl text-[#D4AF37] md:text-3xl">{teamHeading}</p>
            <p className="mt-2 text-center text-sm text-muted-foreground">{teamSubtext}</p>
          </div>
        </div>
      </section>

      <section className="border-t border-border py-16">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          <h2 className="mb-10 text-center font-serif text-3xl">Connect</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <motion.a
              href={CONTACT_INFO.socials.instagram}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.03 }}
              className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600 px-8 py-12 text-center text-white shadow-lg"
            >
              <InstagramIcon />
              <span className="mt-4 font-semibold">@sagaaelite</span>
            </motion.a>
            <motion.a
              href={CONTACT_INFO.socials.facebook}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.03 }}
              className="flex flex-col items-center justify-center rounded-2xl bg-[#1877F2] px-8 py-12 text-center text-white shadow-lg"
            >
              <FacebookIcon />
              <span className="mt-4 font-semibold">Saga Elite</span>
            </motion.a>
            <motion.a
              href={CONTACT_INFO.socials.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.03 }}
              className="flex flex-col items-center justify-center rounded-2xl bg-black px-8 py-12 text-center text-white shadow-lg ring-1 ring-white/10"
            >
              <TikTokIcon />
              <span className="mt-4 font-semibold">@sagaa_elite</span>
            </motion.a>
          </div>
        </div>
      </section>

      <section className="bg-[#D4AF37] py-16 text-black">
        <div className="container mx-auto max-w-7xl px-4 text-center md:px-6">
          <h2 className="font-serif text-3xl font-bold md:text-4xl">
            Ready to elevate your style?
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/shopping/product-list"
              className="rounded-full bg-black px-10 py-4 text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]"
            >
              Shop Now
            </Link>
            <Link
              to="/contact"
              className="rounded-full border-2 border-black px-10 py-4 text-xs font-bold uppercase tracking-[0.2em] text-black hover:bg-black hover:text-[#D4AF37]"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes about-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .about-team-shimmer::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            105deg,
            transparent 40%,
            rgba(212, 175, 55, 0.08) 50%,
            transparent 60%
          );
          background-size: 200% 100%;
          animation: about-shimmer 4s ease-in-out infinite;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default AboutPage;
