import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Clock,
  Flame,
  CalendarClock,
  Zap,
  ShoppingBag,
  CreditCard,
  PackageCheck,
  Search,
  ChevronRight,
  Bell,
} from "lucide-react";
import { API_V1_URL as API_BASE } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import usePageMeta from "@/hooks/use-page-meta";
import { useSocketEvent } from "@/hooks/use-socket-events";
import { Reveal } from "@/components/ui/editorial";
import { Newsletter } from "@/components/landing/CommunitySections";

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Helpers                                                                   */
/* ──────────────────────────────────────────────────────────────────────────── */

const useCountdown = (target) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!target) return null;
  const diff = Math.max(0, new Date(target).getTime() - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s, expired: diff <= 0 };
};

const CountdownDisplay = ({ target, label }) => {
  const cd = useCountdown(target);
  if (!cd || cd.expired) return null;
  const units = [
    { v: cd.d, l: "Days" },
    { v: cd.h, l: "Hours" },
    { v: cd.m, l: "Min" },
    { v: cd.s, l: "Sec" },
  ];
  return (
    <div>
      {label && (
        <p className="se-label text-[10px] uppercase tracking-widest text-gold-ink mb-3">
          {label}
        </p>
      )}
      <div className="flex gap-3">
        {units.map((u) => (
          <div
            key={u.l}
            className="w-[56px] h-[56px] bg-panel border border-ink/10 rounded-[12px] flex flex-col items-center justify-center"
          >
            <span className="font-sans font-bold text-[18px] text-ink leading-none">
              {String(u.v).padStart(2, "0")}
            </span>
            <span className="text-[8px] uppercase tracking-wider text-muted mt-0.5">
              {u.l}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const HOW_STEPS = [
  { icon: Search, title: "Browse Drops", desc: "Explore limited-edition collections." },
  { icon: ShoppingBag, title: "Select Pieces", desc: "Pick your favourites before they sell out." },
  { icon: CreditCard, title: "Secure Checkout", desc: "Complete payment quickly and securely." },
  { icon: PackageCheck, title: "Receive", desc: "Get your exclusive pieces delivered." },
];

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Page Component                                                            */
/* ──────────────────────────────────────────────────────────────────────────── */

const DropsIndex = () => {
  usePageMeta({ title: "Exclusive Drops" });

  const [drops, setDrops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDrops = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE}/drops/get-all-drops`);
      setDrops(Array.isArray(res.data?.drops) ? res.data.drops : []);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Could not load drops");
      if (!silent) toast({ title: "Could not load drops", variant: "destructive" });
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadDrops(); }, [loadDrops]);

  const refetchTimer = useRef(null);
  const debouncedRefetch = useCallback(() => {
    if (refetchTimer.current) clearTimeout(refetchTimer.current);
    refetchTimer.current = setTimeout(() => loadDrops({ silent: true }), 250);
  }, [loadDrops]);
  useEffect(() => () => { if (refetchTimer.current) clearTimeout(refetchTimer.current); }, []);

  useSocketEvent("drop:created", debouncedRefetch, [debouncedRefetch]);
  useSocketEvent("drop:updated", debouncedRefetch, [debouncedRefetch]);

  /* Categorise drops */
  const { active, upcoming, past } = useMemo(() => {
    const now = Date.now();
    const a = [], u = [], p = [];
    drops.forEach((drop) => {
      const release = drop?.releaseDate ? new Date(drop.releaseDate).getTime() : null;
      const end = drop?.endDate ? new Date(drop.endDate).getTime() : null;
      if (release && release > now) u.push(drop);
      else if (end && end < now) p.push(drop);
      else a.push(drop);
    });
    return { active: a, upcoming: u, past: p };
  }, [drops]);

  const endingSoon = useMemo(() => {
    const now = Date.now();
    const TWO_DAYS = 48 * 60 * 60 * 1000;
    return active.filter((d) => d.endDate && new Date(d.endDate).getTime() - now < TWO_DAYS);
  }, [active]);

  const heroImage = active[0]?.images?.[0]?.url || upcoming[0]?.images?.[0]?.url || null;

  return (
    <div className="bg-page text-ink-2 min-h-screen overflow-x-hidden pt-[64px] md:pt-[72px]">

      {/* ── HERO ── */}
      <section className="relative h-[240px] md:h-[320px] lg:h-[420px] overflow-hidden flex items-end justify-center w-full">
        <div className="absolute inset-0">
          {heroImage ? (
            <img src={heroImage} alt="Exclusive Drops" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-page" />
          )}
          <div className="absolute inset-0 bg-page/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-page via-page/50 to-transparent" />
        </div>
        <div className="relative z-10 w-full max-w-7xl px-4 md:px-8 pb-10">
          <nav className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted mb-4">
            <Link to="/" className="hover:text-gold-ink transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-ink font-bold">Exclusive Drops</span>
          </nav>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="se-serif text-ink text-4xl md:text-5xl lg:text-[56px] mb-3">
            Exclusive Drops
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="se-body text-muted text-base md:text-lg max-w-2xl mb-6">
            Discover limited-edition collections available only for a limited time. Once they're gone, they're gone.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex gap-4">
            <Link to="/shopping/product-list">
              <button className="h-[56px] px-8 bg-gold text-ongold rounded-[16px] font-sans font-bold uppercase tracking-wider text-[12px] hover:-translate-y-1 transition-transform">
                Browse Products
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── QUICK OVERVIEW ── */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 -mt-8 relative z-20">
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Zap, label: "Active Drops", value: active.length },
            { icon: Flame, label: "Ending Soon", value: endingSoon.length },
            { icon: CalendarClock, label: "Upcoming", value: upcoming.length },
          ].map((card, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className="bg-card border border-ink/5 rounded-[20px] p-5 md:p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                  <card.icon className="w-6 h-6 text-gold-ink" strokeWidth={1.5} />
                </div>
                <div>
                  <div className="font-serif text-[28px] md:text-[32px] text-gold-ink leading-none">{card.value}</div>
                  <div className="se-label text-[10px] md:text-[11px] text-muted uppercase tracking-wider mt-1">{card.label}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── LOADING / ERROR ── */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-32">
          <motion.div className="w-8 h-8 border-[3px] border-line border-t-gold-ink rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, ease: "linear", repeat: Infinity }} />
          <span className="se-label mt-6 text-muted tracking-widest text-[10px] uppercase">Loading Drops</span>
        </div>
      )}

      {!isLoading && error && (
        <div className="max-w-2xl mx-auto my-16 border border-rose-500/30 bg-rose-500/5 rounded-[20px] px-8 py-10 text-center">
          <p className="text-rose-400 se-body">{error}</p>
        </div>
      )}

      {/* ── HOW DROPS WORK ── */}
      {!isLoading && !error && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
          <Reveal className="text-center mb-12">
            <h2 className="se-serif text-[32px] md:text-[36px] text-ink mb-3">How Drops Work</h2>
            <p className="se-body text-muted text-base max-w-xl mx-auto">
              Exclusive collections that open for a limited window. Once a piece sells out, it's never restocked.
            </p>
          </Reveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_STEPS.map((step, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="bg-card rounded-[20px] border border-ink/5 p-6 text-center h-full flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mb-4">
                    <step.icon className="w-7 h-7 text-gold-ink" strokeWidth={1.5} />
                  </div>
                  <div className="w-7 h-7 rounded-full bg-gold text-ongold font-bold text-[14px] flex items-center justify-center mb-4">
                    {i + 1}
                  </div>
                  <h3 className="font-sans font-semibold text-[16px] text-ink mb-2">{step.title}</h3>
                  <p className="se-body text-[13px] text-muted">{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ── ACTIVE DROPS ── */}
      {!isLoading && !error && active.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 pb-16 md:pb-24">
          <Reveal className="mb-10">
            <h2 className="se-serif text-[32px] text-ink mb-2">Live Now</h2>
            <p className="se-body text-muted">Shop these drops before they close.</p>
          </Reveal>
          <div className="space-y-12">
            {active.map((drop, i) => {
              const endDate = drop.endDate;
              const isEnding = endingSoon.includes(drop);
              return (
                <Reveal key={drop._id || i}>
                  <div className={`grid lg:grid-cols-2 gap-8 bg-card rounded-[24px] border overflow-hidden ${isEnding ? 'border-gold-ink/40' : 'border-ink/5'}`}>
                    {/* Image */}
                    <Link to={`/shopping/drop/${drop.slug}`} className="relative aspect-[16/10] overflow-hidden group">
                      <img
                        src={drop.images?.[0]?.url || "/LOGO.png"}
                        alt={drop.name}
                        loading={i < 2 ? "eager" : "lazy"}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      {isEnding && (
                        <div className="absolute top-4 left-4 px-3 py-1.5 bg-gold text-ongold font-sans font-bold text-[10px] uppercase tracking-wider rounded-full flex items-center gap-1.5">
                          <Flame className="w-3 h-3" /> Ending Soon
                        </div>
                      )}
                      <div className="absolute top-4 right-4 px-3 py-1.5 bg-page/80 backdrop-blur-sm border border-ink/10 text-ink font-sans font-bold text-[10px] uppercase tracking-wider rounded-full">
                        {drop.products?.length ?? 0} Pieces
                      </div>
                    </Link>
                    {/* Info */}
                    <div className="p-6 md:p-8 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="se-label text-[10px] uppercase tracking-widest text-emerald-400">Live</span>
                      </div>
                      <h3 className="se-serif text-[28px] md:text-[32px] text-ink mb-3">{drop.name}</h3>
                      <p className="se-body text-[15px] text-muted leading-relaxed mb-6 line-clamp-3">
                        {drop.description || "Explore this exclusive collection before it closes."}
                      </p>
                      {endDate && <CountdownDisplay target={endDate} label="Closes in" />}
                      <div className="mt-8 flex gap-4">
                        <Link to={`/shopping/drop/${drop.slug}`}>
                          <button className="h-[52px] px-8 bg-gold text-ongold rounded-[16px] font-sans font-bold uppercase tracking-wider text-[12px] hover:-translate-y-1 transition-transform flex items-center gap-2">
                            Shop Drop <ArrowRight className="w-4 h-4" />
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>
      )}

      {/* ── UPCOMING DROPS ── */}
      {!isLoading && !error && upcoming.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 pb-16 md:pb-24">
          <Reveal className="mb-10">
            <h2 className="se-serif text-[32px] text-ink mb-2">Coming Soon</h2>
            <p className="se-body text-muted">Get ready for these upcoming releases.</p>
          </Reveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcoming.map((drop, i) => (
              <Reveal key={drop._id || i} delay={i * 0.1}>
                <div className="bg-card rounded-[24px] border border-gold-ink/20 overflow-hidden group">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img
                      src={drop.images?.[0]?.url || "/LOGO.png"}
                      alt={drop.name}
                      loading="lazy"
                      className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-500"
                    />
                    <div className="absolute inset-0 bg-page/50" />
                    <div className="absolute top-4 left-4 px-3 py-1.5 bg-gold/10 border border-gold-ink/30 text-gold-ink font-sans font-bold text-[10px] uppercase tracking-wider rounded-full flex items-center gap-1.5">
                      <CalendarClock className="w-3 h-3" /> Coming Soon
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-sans font-semibold text-[20px] text-ink mb-2">{drop.name}</h3>
                    <p className="se-body text-[14px] text-muted mb-4 line-clamp-2">
                      {drop.description || "A new chapter is about to open."}
                    </p>
                    {drop.releaseDate && (
                      <div className="flex items-center gap-2 text-[12px] text-gold-ink mb-4">
                        <Clock className="w-4 h-4" />
                        <span>Launches {new Date(drop.releaseDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {drop.releaseDate && <CountdownDisplay target={drop.releaseDate} label="Opens in" />}
                    <button className="mt-6 h-[48px] w-full border border-gold-ink/30 text-gold-ink rounded-[16px] font-sans font-bold uppercase tracking-wider text-[11px] flex items-center justify-center gap-2 hover:bg-gold/10 transition-colors">
                      <Bell className="w-4 h-4" /> Notify Me
                    </button>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ── PAST DROPS ── */}
      {!isLoading && !error && past.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 pb-16 md:pb-24 opacity-70">
          <Reveal className="mb-10">
            <h2 className="se-serif text-[28px] text-muted mb-2">Past Drops</h2>
            <p className="se-body text-muted text-sm">These chapters have closed.</p>
          </Reveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {past.slice(0, 6).map((drop, i) => (
              <Reveal key={drop._id || i} delay={i * 0.05}>
                <Link to={`/shopping/drop/${drop.slug}`} className="block bg-panel rounded-[20px] border border-ink/5 overflow-hidden group">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img src={drop.images?.[0]?.url || "/LOGO.png"} alt={drop.name} loading="lazy" className="w-full h-full object-cover grayscale" />
                    <div className="absolute inset-0 bg-page/60" />
                  </div>
                  <div className="p-5">
                    <h3 className="font-sans font-semibold text-[16px] text-muted mb-1">{drop.name}</h3>
                    <p className="text-[12px] text-muted">{drop.products?.length ?? 0} pieces · Ended</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ── EMPTY STATE ── */}
      {!isLoading && !error && drops.length === 0 && (
        <section className="max-w-2xl mx-auto px-4 py-32 text-center">
          <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-card border border-ink/5 flex items-center justify-center">
            <Zap className="w-10 h-10 text-gold-ink" />
          </div>
          <h3 className="se-serif text-[28px] text-ink mb-3">No Drops Live Just Now</h3>
          <p className="se-body text-muted mb-8">The next chapter opens soon. Stay tuned for exclusive releases.</p>
          <div className="flex justify-center gap-4">
            <Link to="/shopping/product-list">
              <button className="h-[56px] px-8 bg-gold text-ongold rounded-[16px] font-sans font-bold uppercase tracking-wider text-[12px]">Browse Products</button>
            </Link>
            <Link to="/">
              <button className="h-[56px] px-8 border border-ink/10 text-ink rounded-[16px] font-sans font-bold uppercase tracking-wider text-[12px] hover:border-gold-ink hover:text-gold-ink transition-colors">Return Home</button>
            </Link>
          </div>
        </section>
      )}

      {/* ── NEWSLETTER ── */}
      <Newsletter />
    </div>
  );
};

export default DropsIndex;
