import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Clock,
  Tag,
  Percent,
  Timer,
  ShoppingBag,
  ChevronRight,
} from "lucide-react";
import { API_V1_URL as API_BASE } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import usePageMeta from "@/hooks/use-page-meta";
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
    { v: cd.h, l: "Hrs" },
    { v: cd.m, l: "Min" },
    { v: cd.s, l: "Sec" },
  ];
  return (
    <div>
      {label && (
        <p className="se-label text-[10px] uppercase tracking-widest text-gold-ink mb-2">
          {label}
        </p>
      )}
      <div className="flex gap-2">
        {units.map((u) => (
          <div
            key={u.l}
            className="w-[48px] h-[48px] bg-panel border border-ink/10 rounded-[12px] flex flex-col items-center justify-center"
          >
            <span className="font-sans font-bold text-[16px] text-ink leading-none">
              {String(u.v).padStart(2, "0")}
            </span>
            <span className="text-[7px] uppercase tracking-wider text-muted mt-0.5">
              {u.l}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Page Component                                                            */
/* ──────────────────────────────────────────────────────────────────────────── */

const OffersPage = () => {
  usePageMeta({ title: "Special Offers" });

  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadOffers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE}/offers`);
      const activeOffers = (res.data?.data?.offers || []).filter((o) => {
        const end = o.endsAt ? new Date(o.endsAt).getTime() : null;
        return !end || end > Date.now();
      });
      setOffers(activeOffers);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Could not load offers");
      toast({ title: "Could not load offers", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadOffers(); }, [loadOffers]);

  const { highestDiscount, limitedTimeOffers } = useMemo(() => {
    let max = 0;
    let limited = 0;
    offers.forEach((o) => {
      if (o.discountPercent > max) max = o.discountPercent;
      if (o.endsAt) limited++;
    });
    return { highestDiscount: max, limitedTimeOffers: limited };
  }, [offers]);

  const heroImage = offers[0]?.image || "/LOGO.png"; // Use first offer image or fallback

  return (
    <div className="bg-page text-ink-2 min-h-screen overflow-x-hidden pt-[64px] md:pt-[72px]">

      {/* ── HERO ── */}
      <section className="relative h-[240px] md:h-[320px] lg:h-[420px] overflow-hidden flex items-end justify-center w-full">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Special Offers" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-page/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-page via-page/50 to-transparent" />
        </div>
        <div className="relative z-10 w-full max-w-7xl px-4 md:px-8 pb-10">
          <nav className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted mb-4">
            <Link to="/" className="hover:text-gold-ink transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-ink font-bold">Special Offers</span>
          </nav>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="se-serif text-ink text-4xl md:text-5xl lg:text-[56px] mb-3">
            Special Offers
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="se-body text-muted text-base md:text-lg max-w-2xl mb-6">
            Save more with our latest discounts and limited-time promotions. Treat yourself to luxury for less.
          </motion.p>
        </div>
      </section>

      {/* ── QUICK OVERVIEW ── */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 -mt-8 relative z-20">
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Tag, label: "Active Offers", value: offers.length },
            { icon: Percent, label: "Highest Discount", value: `${highestDiscount}%` },
            { icon: Timer, label: "Limited Time", value: limitedTimeOffers },
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
          <span className="se-label mt-6 text-muted tracking-widest text-[10px] uppercase">Loading Offers</span>
        </div>
      )}

      {!isLoading && error && (
        <div className="max-w-2xl mx-auto my-16 border border-rose-500/30 bg-rose-500/5 rounded-[20px] px-8 py-10 text-center">
          <p className="text-rose-400 se-body">{error}</p>
        </div>
      )}

      {/* ── OFFERS GRID ── */}
      {!isLoading && !error && offers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
          <Reveal className="mb-10">
            <h2 className="se-serif text-[32px] text-ink mb-2">Current Promotions</h2>
            <p className="se-body text-muted">Explore active discounts and shop the collections.</p>
          </Reveal>
          <div className="space-y-12">
            {offers.map((offer, i) => (
              <Reveal key={offer._id || i}>
                <div className="bg-card rounded-[24px] border border-ink/5 overflow-hidden flex flex-col md:flex-row group">
                  {/* Banner Image */}
                  <div className="w-full md:w-1/2 lg:w-3/5 relative overflow-hidden">
                     {/* Aspect Ratio 16:5 approximation on desktop, but letting flex handle it nicely */}
                    <div className="absolute inset-0 pb-[40%] md:pb-[31%]">
                        <img
                          src={offer.image || "/LOGO.png"}
                          alt={offer.name}
                          loading={i < 2 ? "eager" : "lazy"}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
                    </div>
                     <div className="absolute top-4 left-4 px-4 py-2 bg-gold text-ongold font-sans font-bold text-[12px] uppercase tracking-wider rounded-full flex items-center gap-1.5 shadow-lg">
                        <Percent className="w-4 h-4" /> {offer.discountPercent}% OFF
                      </div>
                  </div>
                  
                  {/* Info */}
                  <div className="w-full md:w-1/2 lg:w-2/5 p-6 md:p-8 flex flex-col justify-center bg-panel relative z-10 border-l border-ink/5">
                    <h3 className="se-serif text-[28px] md:text-[32px] text-ink mb-3">{offer.name}</h3>
                    <p className="se-body text-[15px] text-muted leading-relaxed mb-6 line-clamp-3">
                      {offer.description || "Take advantage of this special promotion on selected premium items."}
                    </p>
                    
                    {offer.applicableCategories && offer.applicableCategories.length > 0 && (
                        <div className="mb-6 flex flex-wrap gap-2">
                           {offer.applicableCategories.map((cat, idx) => (
                               <span key={idx} className="px-3 py-1 bg-ink/5 rounded-full text-[10px] uppercase tracking-widest text-cream">
                                  {typeof cat === 'object' ? cat.name : cat}
                               </span>
                           ))}
                        </div>
                    )}

                    {offer.endsAt && (
                      <div className="mb-8">
                         <CountdownDisplay target={offer.endsAt} label="Offer ends in" />
                      </div>
                    )}
                    
                    <div className="mt-auto">
                      <Link to={`/shopping/product-list?filter=offers&offerId=${offer._id}`}>
                        <button className="h-[52px] w-full px-8 bg-transparent border border-gold-ink text-gold-ink rounded-[16px] font-sans font-bold uppercase tracking-wider text-[12px] hover:bg-gold hover:text-ongold transition-colors flex items-center justify-center gap-2">
                          Shop Offer <ArrowRight className="w-4 h-4" />
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ── EMPTY STATE ── */}
      {!isLoading && !error && offers.length === 0 && (
        <section className="max-w-2xl mx-auto px-4 py-32 text-center">
          <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-card border border-ink/5 flex items-center justify-center">
            <Tag className="w-10 h-10 text-gold-ink" />
          </div>
          <h3 className="se-serif text-[28px] text-ink mb-3">No Active Offers</h3>
          <p className="se-body text-muted mb-8">We don't have any special promotions running right now. Check back later or browse our collection.</p>
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

export default OffersPage;
