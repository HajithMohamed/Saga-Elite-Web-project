import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  Mail,
  Check,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/ui/editorial";
import axios from "axios";
import { API_V1_URL as API_BASE } from "@/lib/api";
import { fetchSiteSettings, fetchStoreStats } from "@/services/landing-api";
import { TikTokIcon } from "@/components/common-components/BrandIcons";

const SECTION_CONTAINER = "mx-auto w-full max-w-[1280px] px-4 md:px-8 py-[64px] md:py-[80px] lg:py-[96px]";

// ─────────────────────────────────────────────────────────────────────────────
// 1. Community Gallery — real, admin-uploaded social/UGC imagery only.
//    No stock photos; the whole section hides when there's nothing to show.
// ─────────────────────────────────────────────────────────────────────────────
export function CommunityGallery() {
  const [images, setImages] = useState([]);
  const [instagramUrl, setInstagramUrl] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      axios
        .get(`${API_BASE}/image/get-social-ugc-images`)
        .then((r) => (Array.isArray(r?.data?.images) ? r.data.images : []))
        .catch(() => []),
      fetchSiteSettings(),
    ]).then(([imgs, settings]) => {
      if (!active) return;
      setImages(imgs.filter((img) => img?.url).slice(0, 8));
      setInstagramUrl(settings?.instagramUrl || "");
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

  // No real community imagery → don't render the section at all.
  if (loaded && images.length === 0) return null;
  if (!loaded) return null;

  return (
    <section className={cn(SECTION_CONTAINER, "bg-page border-y border-card")}>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
        <div>
          <h2 className="se-serif text-[32px] md:text-[40px] text-ink-2 mb-4">
            Join the Saga Elite Community
          </h2>
          <p className="se-body text-base md:text-[18px] text-muted max-w-xl">
            See how our customers style their favourite Saga Elite pieces across Sri Lanka.
          </p>
        </div>
        {instagramUrl && (
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-gold-ink text-gold-ink hover:bg-gold hover:text-ongold px-6 py-3 rounded-[14px] font-sans font-semibold text-[14px] transition-colors shrink-0"
          >
            <Instagram className="w-4 h-4" />
            Follow Us
          </a>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-[24px]">
        {images.map((img, i) => {
          const tile = (
            <div className="group relative w-full aspect-square rounded-[20px] overflow-hidden bg-panel">
              <img
                src={img.url}
                alt={img.label || "Saga Elite community"}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
              />
              {img.label && (
                <div className="absolute inset-0 bg-page/40 flex flex-col justify-end p-4 md:p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-250">
                  <p className="font-sans font-semibold text-[14px] md:text-[16px] text-ink-2">
                    {img.label}
                  </p>
                </div>
              )}
            </div>
          );
          return (
            <Reveal key={img._id || i} delay={i * 0.05}>
              {instagramUrl ? (
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="block">
                  {tile}
                </a>
              ) : (
                tile
              )}
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Newsletter — real POST /newsletter/subscribe with loading/success/error.
// ─────────────────────────────────────────────────────────────────────────────
const NEWSLETTER_BENEFITS = [
  "Exclusive Drops",
  "Early Sale Access",
  "Member Rewards",
  "Style Inspiration",
];

export function Newsletter() {
  const user = useSelector((state) => state.auth?.user);
  // Pre-fill with the signed-in user's email so they don't have to retype it.
  const [email, setEmail] = useState(() => user?.email || "");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      await axios.post(`${API_BASE}/newsletter/subscribe`, { email, source: "homepage" });
      setStatus("success");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setErrorMsg(
        err?.response?.data?.message ||
          "Something went wrong. Please try again in a moment."
      );
    }
  };

  return (
    <section className={SECTION_CONTAINER}>
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-card to-page border border-gold-ink/20 p-8 md:p-12 lg:p-16 min-h-[260px] md:min-h-[300px] lg:min-h-[340px] flex flex-col lg:flex-row lg:items-center gap-10 lg:gap-16">
        {/* Glow Accent */}
        <div className="absolute -left-32 -bottom-32 w-96 h-96 bg-gold/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex-1">
          <h2 className="se-serif text-[28px] md:text-[36px] lg:text-[40px] text-ink-2 mb-4 leading-tight">
            Stay Ahead of Every Drop
          </h2>
          <p className="se-body text-[16px] md:text-[18px] text-muted mb-6 max-w-md">
            Be the first to know about exclusive collections, premium offers, and limited-edition releases.
          </p>
          <div className="flex flex-wrap gap-4">
            {NEWSLETTER_BENEFITS.map((b, i) => (
              <div key={i} className="flex items-center gap-2 text-cream">
                <Check className="w-4 h-4 text-gold-ink" />
                <span className="se-body text-[14px]">{b}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 w-full lg:w-[480px]">
          {status === "success" ? (
            <div className="h-[56px] w-full rounded-[16px] border border-gold-ink bg-gold/10 flex items-center justify-center gap-3 text-gold-ink font-sans font-semibold transition-all">
              <Check className="w-5 h-5" />
              You&rsquo;re on the list.
            </div>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === "error") setStatus("idle");
                  }}
                  className="w-full h-[56px] bg-panel border border-ink/10 rounded-[16px] pl-12 pr-4 text-ink-2 se-body text-[16px] placeholder:text-muted focus:outline-none focus:border-gold-ink transition-colors"
                  onInvalid={(e) => e.target.setCustomValidity("Please enter a valid email address.")}
                  onInput={(e) => e.target.setCustomValidity("")}
                />
              </div>
              <button
                type="submit"
                disabled={status === "loading"}
                className="h-[56px] min-w-[180px] bg-gold text-ongold rounded-[16px] font-sans font-bold text-[15px] transition-transform duration-250 hover:-translate-y-[2px] disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {status === "loading" ? "Joining..." : "Subscribe"}
              </button>
            </form>
          )}
          {status === "error" && (
            <p className="mt-3 flex items-center gap-2 text-[13px] text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Follow Saga Elite — social links + live stats, all from the DB.
//    Fake follower counts / hardcoded handles removed; hides when empty.
// ─────────────────────────────────────────────────────────────────────────────
export function InstagramSection() {
  const [settings, setSettings] = useState(null);
  const [stats, setStats] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([fetchSiteSettings(), fetchStoreStats()]).then(([s, st]) => {
      if (!active) return;
      setSettings(s);
      setStats(st);
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

  // Build social links only from configured URLs.
  const socialLinks = [];
  if (settings?.instagramUrl)
    socialLinks.push({ icon: Instagram, name: "Instagram", desc: "Daily style inspiration", href: settings.instagramUrl });
  if (settings?.facebookUrl)
    socialLinks.push({ icon: Facebook, name: "Facebook", desc: "Community updates", href: settings.facebookUrl });
  if (settings?.tiktokUrl)
    socialLinks.push({ icon: TikTokIcon, name: "TikTok", desc: "Style edits & drops", href: settings.tiktokUrl });
  if (settings?.youtubeUrl)
    socialLinks.push({ icon: Youtube, name: "YouTube", desc: "Behind the scenes", href: settings.youtubeUrl });
  if (settings?.twitterUrl)
    socialLinks.push({ icon: Twitter, name: "X", desc: "Brand news & drops", href: settings.twitterUrl });

  // Build stat cards only from real metrics.
  const statCards = [];
  if (stats?.happyCustomers)
    statCards.push({ value: `${Number(stats.happyCustomers).toLocaleString()}+`, label: "Happy Customers" });
  if (stats?.averageRating)
    statCards.push({ value: `${Number(stats.averageRating).toFixed(1)}★`, label: "Average Rating" });
  if (stats?.totalOrders)
    statCards.push({ value: `${Number(stats.totalOrders).toLocaleString()}+`, label: "Orders Delivered" });
  if (stats?.totalProducts)
    statCards.push({ value: Number(stats.totalProducts).toLocaleString(), label: "Pieces Available" });

  // Nothing real to show → hide the section.
  if (!loaded) return null;
  if (socialLinks.length === 0 && statCards.length === 0) return null;

  return (
    <section className={SECTION_CONTAINER}>
      <div className={cn("grid min-w-0 gap-12 lg:gap-24 items-center", socialLinks.length > 0 && statCards.length > 0 ? "lg:grid-cols-2" : "")}>
        {/* Left: Social Media */}
        {socialLinks.length > 0 && (
          <div className="min-w-0">
            <h2 className="se-serif text-[32px] md:text-[40px] text-ink-2 mb-4">
              Follow Saga Elite
            </h2>
            <p className="se-body text-[16px] md:text-[18px] text-muted mb-10 max-w-md">
              Discover daily fashion inspiration, exclusive drops, and behind-the-scenes content.
            </p>

            <div className="flex flex-wrap lg:grid lg:grid-cols-2 gap-4 pb-4">
              {socialLinks.map((link, i) => (
                <a
                  key={i}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 p-2 lg:p-4 rounded-full lg:rounded-[16px] bg-panel border border-ink/5 transition-all duration-250 hover:border-gold-ink/50 shrink-0 lg:w-auto"
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-card text-ink-2 transition-all duration-250 group-hover:bg-gold group-hover:text-ongold">
                    <link.icon className="w-5 h-5" />
                  </div>
                  <div className="hidden lg:block min-w-0">
                    <h4 className="font-sans font-semibold text-[15px] text-ink-2 group-hover:text-gold-ink transition-colors">{link.name}</h4>
                    <p className="text-[12px] text-muted truncate">{link.desc}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Right: Statistics (real values) */}
        {statCards.length > 0 && (
          <div className="grid min-w-0 grid-cols-2 gap-4 md:gap-6">
            {statCards.map((stat, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="flex flex-col items-center justify-center text-center p-8 bg-panel rounded-[20px] border border-ink/5 h-[160px] md:h-[200px]">
                  <div className="font-serif text-[32px] md:text-[48px] text-gold-ink mb-2">{stat.value}</div>
                  <div className="se-label text-[12px] md:text-[14px] text-muted uppercase tracking-wider">{stat.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
