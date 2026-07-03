import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  Lock,
  MessageCircle,
  Truck,
  Gift,
  Sparkles,
  Mail,
  Zap,
  ShieldCheck,
  Crown,
  Star,
  Instagram,
  Flame,
  Award,
  Diamond,
} from "lucide-react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { formatLkr } from "@/utils/currency";
import { getRemainingTime } from "@/utils/time";
import { API_V1_URL as API_BASE } from "@/lib/api";
import ProductCard from "@/components/shopping-components/ProductCard";
import { toast } from "@/hooks/use-toast";
import { useAuthDrawer } from "@/components/auth-components/AuthDrawer";
import { useSelector } from "react-redux";

const MotionDiv = motion.div;
const seededRandom = (seed) => {
  const value = Math.sin(seed * 9999) * 10000;
  return value - Math.floor(value);
};


const sectionContainer = "max-w-[1440px] mx-auto px-6";

// ⏱ INLINE DROP COUNTDOWN
const FlipNumber = ({ value }) => (
  <div className="relative inline-block overflow-hidden" style={{ height: '1.2em' }}>
    <AnimatePresence mode="popLayout">
      <motion.span
        key={value}
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: "0%", opacity: 1 }}
        exit={{ y: "-100%", opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="block text-gold-ink font-bold text-lg md:text-xl drop-shadow-[0_0_8px_rgba(242,202,80,0.15)]"
      >
        {value}
      </motion.span>
    </AnimatePresence>
  </div>
);

export const InlineDropCountdown = ({ endDate }) => {
  const [timeLeft, setTimeLeft] = useState(() => getRemainingTime(endDate));

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getRemainingTime(endDate)), 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  return (
    <div className="flex items-center gap-4 text-ink-2 font-mono text-[11px] md:text-[13px] tracking-widest mt-4">
      {[['D', timeLeft.days ?? timeLeft.d], ['H', timeLeft.hh ?? timeLeft.h], ['M', timeLeft.mm ?? timeLeft.m], ['S', timeLeft.ss ?? timeLeft.s]].map(([label, value]) => (
        <div key={label} className="flex items-center gap-1">
          <FlipNumber value={value !== undefined ? value.toString().padStart(2, '0') : '00'} />
          <span className="text-muted">{label}</span>
        </div>
      ))}
    </div>
  );
};

// 🎬 HERO CAROUSEL (COMPACT LUXURY GRID)
export const HeroCarousel = ({ activeDrops = [], nextDrop = null }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { open: openAuthDrawer } = useAuthDrawer();
  const { isAuthenticated } = useSelector((state) => state.auth || { isAuthenticated: false });

  // Auto-advance logic for the carousel
  useEffect(() => {
    if (!activeDrops || activeDrops.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeDrops.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [activeDrops]);

  const liveDrop = activeDrops && activeDrops.length > 0 ? activeDrops[currentSlide] : null;

  return (
    <section className="w-full bg-page border-b border-card">
      {/* Container: Strict Heights from Prompt 07 */}
      <div className="w-full h-[480px] sm:h-[500px] md:h-[560px] lg:h-[620px] xl:h-[680px] flex flex-col lg:flex-row">

        {/* LEFT SECTION (75%) */}
        <div className="relative w-full lg:w-[75%] h-[60%] md:h-full bg-panel overflow-hidden">
          <AnimatePresence mode="wait">
            {liveDrop ? (
              <motion.div
                key={liveDrop._id || currentSlide}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: "easeInOut" }}
                className="w-full h-full grid grid-cols-1 md:grid-cols-[65%_35%] relative"
              >
                {/* Image Area (65%) */}
                <div className="w-full h-full relative overflow-hidden bg-page">
                  <motion.img
                    src={liveDrop.images?.[0]?.url || liveDrop.coverImageUrl || "https://images.unsplash.com/photo-1549439602-43ebca2327af?w=1920&q=80"}
                    alt={liveDrop.name}
                    initial={{ scale: 1 }}
                    animate={{ scale: 1.05 }}
                    transition={{ duration: 6, ease: "linear" }}
                    className="w-full h-full object-contain object-center opacity-80"
                  />
                  <div className="absolute inset-0 bg-grain opacity-20 pointer-events-none" />
                  {/* Fade out on right for content blending */}
                  <div className="hidden md:block absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-page to-transparent pointer-events-none" />
                  <div className="md:hidden absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-page to-transparent pointer-events-none" />
                </div>

                {/* Content Area (35%) */}
                <div className="absolute inset-0 md:relative flex flex-col justify-end md:justify-center p-8 md:p-12 lg:p-16 z-10 bg-gradient-to-t md:bg-gradient-to-l from-page via-page/90 to-transparent md:bg-page">
                  <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-gold-ink mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                    LIVE DROP
                  </span>

                  <motion.h1 
                    initial={{ y: 20, opacity: 0 }} 
                    animate={{ y: 0, opacity: 1 }} 
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="font-display text-4xl md:text-5xl lg:text-6xl text-ink uppercase tracking-tighter leading-[0.9] mb-4 drop-shadow-md"
                  >
                    {liveDrop.name}
                  </motion.h1>

                  <motion.p 
                    initial={{ y: 15, opacity: 0 }} 
                    animate={{ y: 0, opacity: 1 }} 
                    transition={{ delay: 0.35, duration: 0.6 }}
                    className="font-sans text-sm md:text-base text-cream leading-relaxed mb-8 max-w-sm line-clamp-3"
                  >
                    {liveDrop.description}
                  </motion.p>

                  <div className="flex flex-col gap-4">
                    <Link to={`/shopping/drop/${liveDrop.slug}`} className="relative overflow-hidden group/btn inline-flex items-center justify-center bg-gold text-ongold px-8 py-4 font-sans text-[11px] uppercase tracking-[0.3em] font-bold">
                      <span className="relative z-10">SHOP NOW</span>
                      <div className="absolute inset-0 bg-ivory scale-x-0 origin-left group-hover/btn:scale-x-100 transition-transform duration-500 ease-[0.19,1,0.22,1]" />
                    </Link>

                    {liveDrop.endDate && (
                      <div className="flex flex-col justify-center border border-card bg-page px-6 py-4">
                        <span className="font-mono text-[9px] uppercase tracking-widest text-muted">Ends In</span>
                        <div className="-mt-2">
                          <InlineDropCountdown endDate={liveDrop.endDate} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-page">
                <span className="font-mono text-xs text-muted uppercase tracking-widest mb-4">No Active Drops</span>
                <Link to="/shopping/product-list" className="font-mono text-[9px] uppercase tracking-[0.2em] text-gold-ink border-b border-gold-ink/30 pb-1">Explore Collections</Link>
              </div>
            )}
          </AnimatePresence>

          {/* Slide Indicators */}
          {activeDrops && activeDrops.length > 1 && (
            <div className="absolute bottom-6 left-8 flex gap-2 z-20">
              {activeDrops.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`h-1 transition-all duration-300 ${i === currentSlide ? 'w-8 bg-gold' : 'w-2 bg-ivory/30 hover:bg-ivory/50'}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT SECTION (25%) */}
        <div className="w-full lg:w-[25%] flex flex-col h-auto md:h-full border-t lg:border-t-0 lg:border-l border-card">

          {/* Top Card: Upcoming Drop (50% height) */}
          <div className="flex-1 min-h-[250px] border-b border-card relative overflow-hidden group bg-page hover:bg-page transition-colors p-8 flex flex-col justify-center">
            {nextDrop ? (
              <>
                {/* Background Thumbnail */}
                <div className="absolute inset-0 z-0">
                  <img
                    src={nextDrop.images?.[0]?.url || nextDrop.coverImageUrl || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1920&q=80"}
                    alt={nextDrop.name}
                    className="w-full h-full object-cover opacity-20 group-hover:opacity-30 group-hover:scale-105 transition-all duration-[2s]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-page via-page/90 to-transparent" />
                </div>

                <div className="relative z-10 flex flex-col h-full justify-end">
                  <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-3 block">Upcoming Drop</span>
                  <h3 className="font-display text-2xl lg:text-3xl text-ink uppercase tracking-wide group-hover:text-gold-ink transition-colors mb-2 leading-none drop-shadow-md">{nextDrop.name}</h3>
                  <div className="flex flex-col gap-1 mb-4">
                    <p className="font-mono text-[10px] text-cream tracking-[0.1em]">
                      {new Date(nextDrop.releaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <div className="scale-75 origin-left -mt-2">
                      <InlineDropCountdown endDate={nextDrop.releaseDate} />
                    </div>
                  </div>
                  <div>
                    <Link to="/shopping/drops" className="inline-block font-mono text-[9px] uppercase tracking-[0.2em] text-gold-ink border-b border-gold-ink/30 pb-1 hover:border-gold-ink transition-colors">
                      Explore Details
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                  <Sparkles className="w-32 h-32 text-ink" />
                </div>
                <div className="relative z-10">
                  <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-3 block">Coming Soon</span>
                  <h3 className="font-display text-2xl lg:text-3xl text-ink uppercase tracking-wide group-hover:text-gold-ink transition-colors mb-4 leading-none">A New Chapter<br />is forming.</h3>
                  <Link to="/shopping/product-list" className="inline-block font-mono text-[9px] uppercase tracking-[0.2em] text-gold-ink border-b border-gold-ink/30 pb-1 hover:border-gold-ink transition-colors">
                    Explore Collections
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Bottom Card: VIP Access (50% height) */}
          <div className="flex-1 min-h-[250px] relative overflow-hidden group bg-page hover:bg-page transition-colors p-8 flex flex-col justify-center">
            <div className="absolute bottom-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity transform group-hover:scale-110">
              <Diamond className="w-32 h-32 text-ink" />
            </div>
            <div className="relative z-10">
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-3 block">Saga Elite</span>
              <h3 className="font-display text-2xl lg:text-3xl text-ink uppercase tracking-wide group-hover:text-gold-ink transition-colors mb-2 leading-none">VIP Access</h3>
              <p className="font-sans text-xs text-muted mb-6 max-w-[200px]">
                Early access benefits, exclusive member drops, and private events.
              </p>
              <button onClick={() => isAuthenticated ? undefined : openAuthDrawer('register')} className="inline-block font-mono text-[9px] uppercase tracking-[0.2em] text-ink border-b border-ink/30 pb-1 hover:border-ink transition-colors">
                Unlock Privileges
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

// 🎇 SEASONAL EVENT BANNER (PREMIUM COUNTDOWN & BENEFITS)
export const SeasonalEventBanner = ({ targetDate, title, benefits = [], ctaText, ctaLink }) => {
  const [timeLeft, setTimeLeft] = useState(() => getRemainingTime(targetDate));

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getRemainingTime(targetDate)), 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <section className="relative w-full bg-[#d7d5d2] overflow-hidden py-16 md:py-24">
      {/* Fake concrete background layer */}
      <div className="absolute inset-0 opacity-40 mix-blend-multiply pointer-events-none bg-grain" />

      <div className="relative z-10 max-w-[1200px] mx-auto px-4 lg:px-8">

        <div className="text-center mb-10">
          <h2 className="font-display text-4xl md:text-[56px] text-[#1f1e1d] uppercase tracking-wide leading-none">
            {title} ENDS IN
          </h2>
        </div>

        {/* Geometric Countdown */}
        <div className="flex justify-center flex-wrap gap-3 md:gap-5 mb-14">
          {[['Days', timeLeft.d ?? timeLeft.days], ['Hours', timeLeft.hh ?? timeLeft.h], ['Minutes', timeLeft.mm ?? timeLeft.m], ['Seconds', timeLeft.ss ?? timeLeft.s]].map(([label, value]) => (
            <div key={label} className="flex flex-col items-center">
              <div className="relative flex w-[80px] h-[80px] md:w-[130px] md:h-[130px] lg:w-[150px] lg:h-[150px] shadow-2xl overflow-hidden mb-4 rounded-sm">
                {/* Left Copper */}
                <div className="w-1/2 h-full bg-gradient-to-br from-[#d4a373] to-[#b07049]" />
                {/* Right Concrete */}
                <div className="w-1/2 h-full bg-gradient-to-br from-[#dfdbd8] to-[#b3b1ad]" />
                {/* Midline indent */}
                <div className="absolute left-1/2 top-0 bottom-0 w-[2px] -ml-[1px] bg-card/10 shadow-[inset_1px_0_2px_rgba(0,0,0,0.1)]" />
                {/* Horizontal line indent */}
                <div className="absolute top-1/2 left-0 right-0 h-[2px] -mt-[1px] bg-card/10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]" />

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="font-display text-5xl md:text-6xl lg:text-[80px] font-medium text-ongold">
                    {value !== undefined ? value.toString().padStart(2, '0') : '00'}
                  </span>
                </div>
              </div>
              <span className="font-sans text-[15px] md:text-lg lg:text-[22px] text-ongold font-medium">{label}</span>
            </div>
          ))}
        </div>

        {/* Floating Benefit Bar */}
        <div className="bg-ivory rounded-xl p-4 md:p-6 lg:p-8 flex flex-col xl:flex-row items-center justify-between gap-6 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)]">
          <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-8 w-full xl:w-auto">
            <h3 className="font-display text-2xl md:text-3xl text-ongold whitespace-nowrap mb-2 xl:mb-0">
              🎉 {title}
            </h3>
            <div className="flex flex-wrap justify-center xl:justify-start gap-x-6 gap-y-3 font-sans text-[13px] md:text-[15px] text-ongold">
              {benefits.map((b, i) => (
                <span key={i} className="flex items-center gap-2 font-medium">
                  <span className="text-black font-bold">✓</span> {b}
                </span>
              ))}
            </div>
          </div>

          {ctaText && (
            <Link to={ctaLink || "#"} className="shrink-0 w-full xl:w-auto">
              <button className="w-full xl:w-auto bg-elevated text-ink px-8 py-4 font-sans text-sm md:text-base font-medium rounded-lg hover:bg-page transition-colors whitespace-nowrap">
                [{ctaText}]
              </button>
            </Link>
          )}
        </div>

      </div>
    </section>
  );
};

// ⏳ LIVE DROP COUNTDOWN (HYPE ENGINE)
export const CountdownWidget = ({ targetDate, title, description }) => {
  const [timeLeft, setTimeLeft] = useState(() => getRemainingTime(targetDate));

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getRemainingTime(targetDate)), 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="bg-page border-y border-line/40 py-12 relative overflow-hidden">
      {/* Glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-1/2 bg-gold/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-[800px] mx-auto px-6 text-center relative z-10">
        <h3 className="font-mono text-[12px] tracking-[0.4em] uppercase text-danger-ink mb-3 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-danger-ink animate-pulse" />
          {title || "Next Drop"}
        </h3>
        <p className="font-display text-2xl text-ink-2 mb-8">{description}</p>

        <div className="flex justify-center gap-4 text-ink-2">
          {[['Days', timeLeft.d], ['Hours', timeLeft.hh], ['Mins', timeLeft.mm], ['Secs', timeLeft.ss]].map(([label, value]) => (
            <div key={label} className="flex flex-col items-center">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-panel border border-elevated rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                <span className="font-mono text-3xl md:text-4xl text-gold-ink">{value.toString().padStart(2, '0')}</span>
              </div>
              <span className="font-body text-[10px] uppercase tracking-widest text-cream mt-2">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 👕 COLLECTION ENTRY (3 MASSIVE LUXURY CARDS)
export const IdentityCategoryGrid = ({ categories = [] }) => {
  return (
    <section className={`${sectionContainer} py-10`}>
      <div className="text-center mb-12">
        <h3 className="font-display text-[32px] md:text-[42px] text-ink-2 uppercase">Choose Your Identity</h3>
        <p className="font-mono text-[11px] text-cream tracking-[0.3em] uppercase mt-2">Elevated Aesthetics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {categories.map((cat) => (
          <Link key={cat.name} to={cat.link} className="group block relative aspect-[3/4] overflow-hidden bg-panel">
            <img src={cat.image} alt={cat.name} className="w-full h-full object-cover transition-transform duration-[1.5s] ease-[0.19,1,0.22,1] group-hover:scale-105" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-page/90 via-page/20 to-transparent" />

            {/* Outline box that draws on hover */}
            <div className="absolute inset-4 border border-gold-ink/0 group-hover:border-gold-ink/50 transition-colors duration-500 rounded-sm pointer-events-none" />

            <div className="absolute bottom-8 w-full text-center transform transition-transform duration-500 group-hover:-translate-y-4">
              <h4 className="font-display text-4xl text-ink-2 uppercase tracking-wider">{cat.name}</h4>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold-ink mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                Explore Collection
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};




// 🔥 FEATURED DROPS / TRENDING (Horizontal Scroll)
export const ProductSlider = ({ title, subtitle, products = [], deal = false }) => {
  const scrollerRef = useRef(null);
  const scrollBy = (distance) => scrollerRef.current?.scrollBy({ left: distance, behavior: "smooth" });

  return (
    <section className={`${sectionContainer} py-8`}>
      <div className="flex justify-between items-end mb-8 border-b border-elevated pb-4">
        <div>
          <h3 className="font-display text-[28px] md:text-[36px] text-ink-2 uppercase">{title}</h3>
          <p className="font-mono text-[10px] tracking-[0.2em] text-cream uppercase mt-2">{subtitle}</p>
        </div>
        <div className="flex gap-2">
          <button className="h-10 w-10 flex items-center justify-center border border-line text-cream hover:text-gold-ink hover:border-gold-ink transition-colors" onClick={() => scrollBy(-300)} aria-label="Scroll left">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button className="h-10 w-10 flex items-center justify-center border border-line text-cream hover:text-gold-ink hover:border-gold-ink transition-colors" onClick={() => scrollBy(300)} aria-label="Scroll right">
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div ref={scrollerRef} className="flex gap-6 overflow-x-auto snap-x scroll-smooth pb-8 hide-scrollbar group/slider">
        {products.map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="snap-start shrink-0 transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] hover:scale-[1.03] hover:z-10 hover:shadow-2xl group-hover/slider:opacity-30 hover:!opacity-100 cursor-open"
          >
            <ProductCard product={product} badge={deal ? "deal" : "new"} />
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export const TrustBar = () => {
  const items = [
    { icon: Truck, text: "ISLANDWIDE DELIVERY" },
    { icon: Lock, text: "SECURE CHECKOUT" },
    { icon: Gift, text: "EXCLUSIVE PERKS" },
  ];
  return (
    <section className="bg-page border-y border-card py-4">
      <div className="max-w-[1000px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-center gap-4">
        {items.map((item) => (
          <div key={item.text} className="flex items-center gap-3 text-cream font-mono text-[10px] tracking-[0.2em] uppercase">
            <item.icon className="h-4 w-4 text-gold-ink" />
            {item.text}
          </div>
        ))}
      </div>
    </section>
  );
};

// 🎪 SEASONAL CAMPAIGN SLIDER (LUXURY EDITORIAL SECTION)
export const SeasonalCampaignSlider = ({ offers = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filter and sort campaigns
  const campaigns = useMemo(() => {
    // We only want active offers that haven't ended yet
    const now = new Date().getTime();
    let valid = offers.filter(o => !o.endDate || new Date(o.endDate).getTime() > now);

    // Sort logic:
    // 1. Highest discount first
    // 2. Closest ending campaign second
    valid.sort((a, b) => {
      const discountA = a.discountPercentage || 0;
      const discountB = b.discountPercentage || 0;
      if (discountB !== discountA) return discountB - discountA;

      const endA = a.endDate ? new Date(a.endDate).getTime() : Infinity;
      const endB = b.endDate ? new Date(b.endDate).getTime() : Infinity;
      return endA - endB;
    });
    return valid;
  }, [offers]);

  useEffect(() => {
    if (campaigns.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % campaigns.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [campaigns.length]);

  if (campaigns.length === 0) return null;

  const currentCampaign = campaigns[currentIndex];

  const handleNext = () => setCurrentIndex(prev => (prev + 1) % campaigns.length);
  const handlePrev = () => setCurrentIndex(prev => (prev - 1 + campaigns.length) % campaigns.length);

  return (
    <section className="bg-page w-full min-h-[350px] md:min-h-[400px] relative overflow-hidden flex border-b border-card">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentCampaign._id || currentIndex}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="w-full flex flex-col md:flex-row relative"
          // Add touch swipe support
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = offset.x;
            if (swipe < -50) handleNext();
            else if (swipe > 50) handlePrev();
          }}
        >
          {/* LEFT 55%: Content */}
          <div className="w-full md:w-[55%] flex flex-col justify-center px-8 py-8 md:px-12 lg:px-16 z-10 bg-page relative order-2 md:order-1">
            <div className="absolute inset-0 bg-grain opacity-10 pointer-events-none" />

            <div className="relative z-10 max-w-xl">
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-gold-ink mb-3 flex items-center gap-2">
                <span className="w-1 h-1 bg-gold rounded-full animate-pulse" />
                {currentCampaign.campaignType || "Seasonal Campaign"}
              </span>

              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-ink uppercase tracking-tighter leading-[0.9] mb-3 drop-shadow-sm">
                {currentCampaign.title || currentCampaign.name}
              </h2>

              <p className="font-sans text-xs md:text-sm text-cream leading-relaxed mb-6 font-light max-w-md line-clamp-3">
                {currentCampaign.description}
              </p>

              <div className="flex flex-wrap gap-x-6 gap-y-3 mb-6 items-center">
                {currentCampaign.discountPercentage > 0 && (
                  <div className="flex flex-col">
                    <span className="font-mono text-[8px] uppercase tracking-widest text-muted mb-1">Discount</span>
                    <span className="font-sans text-lg text-gold-ink tracking-tighter">{currentCampaign.discountPercentage}% OFF</span>
                  </div>
                )}

                {currentCampaign.endDate && (
                  <div className="flex flex-col">
                    <span className="font-mono text-[8px] uppercase tracking-widest text-muted mb-1">Ends In</span>
                    <div className="scale-75 origin-left -ml-1 mt-0">
                      <InlineDropCountdown endDate={currentCampaign.endDate} />
                    </div>
                  </div>
                )}

                {currentCampaign.products && currentCampaign.products.length > 0 && (
                  <div className="flex flex-col">
                    <span className="font-mono text-[8px] uppercase tracking-widest text-muted mb-1">Collection Size</span>
                    <span className="font-sans text-xs text-ink tracking-widest uppercase mt-0.5">{currentCampaign.products.length} Products</span>
                  </div>
                )}
              </div>

              {currentCampaign.categories && currentCampaign.categories.length > 0 && (
                <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted mb-6">
                  {currentCampaign.categories.join(' • ')}
                </div>
              )}

              <Link
                to={`/shopping/product-list?offer=${currentCampaign._id}`}
                className="inline-flex bg-ivory text-ongold px-6 py-3 font-sans text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gold transition-colors"
              >
                SHOP COLLECTION
              </Link>
            </div>
          </div>

          {/* RIGHT 45%: Image */}
          <div className="w-full md:w-[45%] h-[200px] md:h-auto relative bg-page overflow-hidden order-1 md:order-2 flex items-center justify-center pointer-events-none">
            {currentCampaign.bannerImage ? (
              <img
                src={currentCampaign.bannerImage}
                alt={currentCampaign.title || currentCampaign.name}
                className="w-full h-full object-cover object-center opacity-90 scale-105 hover:scale-110 transition-transform duration-[10s] ease-out"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#12100A] via-page to-[#1A1608] flex items-center justify-center p-8 text-center">
                <div className="font-display text-6xl md:text-8xl text-gold-ink/5 uppercase tracking-tighter leading-none break-words absolute inset-0 flex items-center justify-center rotate-[-10deg] scale-150">
                  {currentCampaign.title || currentCampaign.name}
                </div>
                <div className="relative z-10 border border-gold-ink/20 p-8">
                  <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-gold-ink">Limited Edition</span>
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-page to-transparent md:bg-gradient-to-r md:from-page md:via-page/40 md:to-transparent" />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Progress & Navigation overlay */}
      {campaigns.length > 1 && (
        <div className="absolute bottom-6 left-8 md:left-16 lg:left-24 z-20 flex items-center gap-8">
          <div className="flex gap-2">
            {campaigns.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-1 transition-all duration-300 ${i === currentIndex ? 'w-8 bg-gold' : 'w-2 bg-ivory/20 hover:bg-ivory/40'}`}
              />
            ))}
          </div>

          <div className="hidden md:flex gap-4 items-center">
            <button onClick={handlePrev} className="text-muted hover:text-gold-ink transition-colors"><ArrowLeft className="w-5 h-5" /></button>
            <button onClick={handleNext} className="text-muted hover:text-gold-ink transition-colors"><ArrowRight className="w-5 h-5" /></button>
          </div>
        </div>
      )}
    </section>
  );
};

// 📣 PERSISTENT DROP NOTIFICATION BAND
export const DropCountdownBand = ({ activeDrop }) => {
  const endDate = activeDrop?.endDate;
  const [timeLeft, setTimeLeft] = useState(() =>
    endDate ? getRemainingTime(endDate) : null
  );

  useEffect(() => {
    if (!endDate) return undefined;
    const timer = setInterval(() => setTimeLeft(getRemainingTime(endDate)), 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  if (!activeDrop || !timeLeft) return null;

  return (
    <div className="bg-gold text-ongold py-2 px-4 text-center">
      <Link to={`/shopping/drop/${activeDrop.slug}`} className="flex flex-wrap items-center justify-center gap-2 md:gap-4 font-mono text-[10px] md:text-xs tracking-widest uppercase hover:opacity-80 transition-opacity">
        <span className="font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
          LIVE NOW: {activeDrop.name}
        </span>
        <span className="hidden md:inline">|</span>
        <span>ENDS IN: {timeLeft.d}D {timeLeft.h}H {timeLeft.m}M {timeLeft.s}S</span>
        <span className="underline underline-offset-4 font-bold ml-2">SHOP DROP →</span>
      </Link>
    </div>
  );
};

// 👕 CATEGORY LOCKUP
const CATEGORY_FALLBACK_IMAGES = {
  ladies: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&q=80",
  gents: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
  unisex: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&q=80",
};

const pickCategoryImage = (categoryImages, key, fallback) => {
  const bucket = categoryImages?.[key];
  if (typeof bucket === "string" && bucket) return bucket;
  if (bucket && typeof bucket === "object") {
    const firstUrl = Object.values(bucket).find(
      (value) => typeof value === "string" && value
    );
    if (firstUrl) return firstUrl;
  }
  return fallback;
};

export const CategoryLockup = ({ categoryImages = {} }) => {
  const categories = [
    {
      name: "Ladies",
      link: "/shopping/product-list?category=ladies",
      img: pickCategoryImage(categoryImages, "ladies", CATEGORY_FALLBACK_IMAGES.ladies),
    },
    {
      name: "Gents",
      link: "/shopping/product-list?category=gents",
      img: pickCategoryImage(categoryImages, "gents", CATEGORY_FALLBACK_IMAGES.gents),
    },
    {
      name: "Unisex",
      link: "/shopping/product-list?category=unisex",
      img: pickCategoryImage(categoryImages, "unisex", CATEGORY_FALLBACK_IMAGES.unisex),
    },
  ];

  return (
    <section className={`${sectionContainer} py-12`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const label = cat.name;
          return (
            <Link key={cat.name} to={cat.link} className="group relative overflow-hidden aspect-[3/4] cursor-pointer border border-line/60 transition-all duration-500 hover:border-gold-ink/60 hover:[box-shadow:0_0_30px_rgba(242,202,80,0.20),inset_0_0_0_1px_rgba(242,202,80,0.15)] bg-panel">
              <div className="absolute inset-0 bg-gradient-to-b from-card to-page" />
              {cat.img && (
                <img
                  src={cat.img}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 group-hover:opacity-80 transition-all duration-700"
                  loading="lazy"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-page via-page/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-center text-center justify-end">
                <div className="transition-transform duration-500 group-hover:-translate-y-2">
                  <h3 className="font-display text-4xl md:text-5xl text-ink uppercase tracking-widest">{cat.name}</h3>
                </div>
                <p className="mt-1 se-label font-bold text-[9px] tracking-[0.3em] text-cream/80 opacity-0 translate-y-2 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
                  {label === 'Gents' ? 'BOLD · OVERSIZED · RARE' : label === 'Ladies' ? 'ICONIC · EDITORIAL · ELEGANT' : 'NO RULES · SHARED · UNLIMITED'}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};



// 🎯 RECOMMENDATIONS SECTION
export const RecommendationsSection = ({ title = "Recommended For You", products = [] }) => {
  if (!products || products.length === 0) return null;
  return (
    <section className={`${sectionContainer} py-8`}>
      <div className="text-center mb-10">
        <h3 className="font-display text-[28px] md:text-[36px] text-ink-2 uppercase">{title}</h3>
        <div className="w-12 h-0.5 bg-gold mx-auto mt-4" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {products.slice(0, 4).map((product) => (
          <ProductCard key={product._id || product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

// 🔥 LIVE DROP DEDICATED SECTION
export const LiveDropSection = ({ activeDrop }) => {
  if (!activeDrop) return null;

  return (
    <section className="py-10 bg-page">
      <div className={`${sectionContainer}`}>
        <div className="border border-elevated p-8 md:p-12 relative overflow-hidden bg-page">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold opacity-5 blur-[100px] pointer-events-none" />
          <div className="flex flex-col md:flex-row gap-12 items-center relative z-10">
            <div className="flex-1">
              <span className="bg-gold text-ongold font-mono text-[10px] px-3 py-1 uppercase tracking-widest font-bold">Live Selected Drop</span>
              <h2 className="font-display text-4xl md:text-5xl text-ink uppercase mt-6 mb-4 leading-none">{activeDrop.name}</h2>
              <p className="font-sans text-ink/70 text-sm mb-8 leading-relaxed max-w-md">{activeDrop.description}</p>
              <InlineDropCountdown endDate={activeDrop.endDate} />
              <Link to={`/shopping/drop/${activeDrop.slug}`} className="inline-block mt-8 bg-gold text-ongold px-8 py-4 font-mono text-[11px] tracking-[0.2em] font-bold hover:bg-gold-hover transition-colors uppercase">
                View The Collection
              </Link>
            </div>
            {(activeDrop?.images?.[0]?.url || activeDrop?.coverImageUrl) && (
              <div className="flex-1 w-full aspect-square md:aspect-[4/3] bg-panel">
                <img src={activeDrop?.images?.[0]?.url || activeDrop?.coverImageUrl} alt={activeDrop.name} className="w-full h-full object-cover" loading="lazy" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

// ✉️ NEWSLETTER SECTION
export const NewsletterSection = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    setErrorMessage("");
    try {
      await axios.post(`${API_BASE}/newsletter/subscribe`, {
        email,
        source: "homepage",
      });
      setStatus("success");
      setEmail("");
      setTimeout(() => setStatus("idle"), 5000);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Subscription failed. Try again.";
      setErrorMessage(msg);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 4000);
    }
  };

  const buttonLabel =
    status === "loading"
      ? "Joining…"
      : status === "success"
        ? "✓ Joined"
        : "Subscribe";

  return (
    <section className="bg-page py-12 border-t border-card">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <Mail className="w-8 h-8 text-gold-ink mx-auto mb-6" />
        <h3 className="font-display text-4xl text-ink uppercase mb-4">
          Unlock Future Drops
        </h3>
        <p className="font-sans text-sm text-muted mb-8">
          Be first when a drop goes live. Members only — no spam.
        </p>
        <form
          className="flex flex-col md:flex-row gap-4 max-w-md mx-auto"
          onSubmit={handleSubmit}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ENTER YOUR EMAIL"
            disabled={status === "loading"}
            className="flex-1 bg-panel border border-elevated text-ink px-4 py-3 font-mono text-[11px] outline-none focus:border-gold-ink transition-colors disabled:opacity-60"
            required
          />
          <button
            type="submit"
            disabled={status === "loading" || status === "success"}
            className="bg-ivory text-ongold px-8 py-3 font-mono text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-gold transition-colors disabled:opacity-60"
          >
            {buttonLabel}
          </button>
        </form>
        {status === "success" ? (
          <p className="mt-4 text-gold-ink text-xs font-mono uppercase tracking-widest">
            You're on the list. Watch your inbox.
          </p>
        ) : null}
        {status === "error" ? (
          <p className="mt-4 text-danger-ink text-xs font-mono">
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-8 pt-6 border-t border-card">
          <p className="font-mono text-[10px] text-muted tracking-widest uppercase mb-3">
            Prefer WhatsApp? Get drop alerts in your chat.
          </p>
          <a
            href="https://wa.me/+94770704274?text=Add%20me%20to%20the%20Saga%20Elite%20drop%20alerts%20list"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-[#25D366]/40 hover:border-[#25D366] text-[#25D366] px-6 py-2.5 font-mono text-[10px] tracking-[0.24em] uppercase transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            Join WhatsApp Alerts
          </a>
        </div>
      </div>
    </section>
  );
};



/* ──────────────────────────────────────────────────────────────────────────
   HERO BACKDROP FX — Three.js floating gold particles behind the hero.
   Renders absolutely positioned. WebGL required; gracefully no-op if not.
   ────────────────────────────────────────────────────────────────────────── */
const ParticleField = () => {
  const ref = useRef(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(300); // 100 particles × 3 coords
    for (let i = 0; i < arr.length; i += 3) {
      arr[i] = (seededRandom(i + 1) - 0.5) * 6;
      arr[i + 1] = (seededRandom(i + 2) - 0.5) * 4;
      arr[i + 2] = (seededRandom(i + 3) - 0.5) * 4;
    }
    return arr;
  }, []);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.x += delta * 0.005;
    ref.current.rotation.y += delta * 0.01;
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled>
      <PointMaterial
        transparent
        color="#f2ca50"
        size={0.01}
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
      />
    </Points>
  );
};

export const HeroBackdropFX = () => {
  const [hasError, setHasError] = useState(false);
  const canvasRef = useRef(null);

  const handleContextLost = useCallback((event) => {
    event.preventDefault();
    setHasError(true);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    canvas.addEventListener("webglcontextlost", handleContextLost);
    return () => {
      canvas.removeEventListener("webglcontextlost", handleContextLost);
    };
  }, [handleContextLost]);

  // If WebGL context was lost, gracefully render nothing
  if (hasError) return null;

  return (
    <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
      <Canvas
        camera={{ position: [0, 0, 1.5], fov: 75 }}
        gl={{ antialias: false, powerPreference: "low-power" }}
        dpr={[1, 1.5]}
        frameloop="demand"
        onCreated={({ gl }) => {
          canvasRef.current = gl.domElement;
        }}
      >
        <ParticleField />
      </Canvas>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────────────────
   LIVE DROP COUNTDOWN XL — full-bleed cinematic countdown.
   GSAP letter-reveal on the headline; pulsing glow on digits; particles bg.
   ────────────────────────────────────────────────────────────────────────── */
export const LiveDropCountdownXL = ({ targetDate, title = "Next Drop", description }) => {
  const [timeLeft, setTimeLeft] = useState(() => getRemainingTime(targetDate));
  const headlineRef = useRef(null);

  useEffect(() => {
    const iv = setInterval(() => setTimeLeft(getRemainingTime(targetDate)), 1000);
    return () => clearInterval(iv);
  }, [targetDate]);

  useGSAP(
    () => {
      if (!headlineRef.current) return;
      const letters = headlineRef.current.querySelectorAll("[data-letter]");
      gsap.fromTo(
        letters,
        { opacity: 0, y: 30, rotateX: -90 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          stagger: 0.04,
          duration: 0.8,
          ease: "power3.out",
        }
      );
    },
    { scope: headlineRef }
  );

  const headline = `Drops in ${title}`;
  const days = timeLeft.days ?? timeLeft.d ?? 0;
  const hours = timeLeft.hh ?? timeLeft.h ?? "00";
  const mins = timeLeft.mm ?? timeLeft.m ?? "00";
  const secs = timeLeft.ss ?? timeLeft.s ?? "00";

  return (
    <section className="relative bg-page py-20 md:py-28 overflow-hidden border-y border-card">
      {/* Radial gold + violet ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-gold/8 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-vip/8 blur-[140px] rounded-full pointer-events-none" />

      {/* Floating particle accents */}
      {[...Array(18)].map((_, i) => (
        <motion.span
          key={i}
          className="absolute w-1 h-1 rounded-full bg-gold/60"
          style={{
            top: `${seededRandom(i + 1) * 100}%`,
            left: `${seededRandom(i + 19) * 100}%`,
          }}
          animate={{
            y: [0, -25, 0],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: 4 + seededRandom(i + 37) * 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: seededRandom(i + 55) * 2,
          }}
        />
      ))}

      <div className="relative z-10 max-w-[1100px] mx-auto px-6 text-center">
        <p className="font-mono text-[11px] tracking-[0.4em] uppercase text-vip mb-3 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-vip animate-pulse shadow-[0_0_10px_#a855f7]" />
          Hold Ready
        </p>
        <h2
          ref={headlineRef}
          className="font-display text-[40px] md:text-[80px] leading-none uppercase text-ink mb-3 tracking-tight"
          style={{ perspective: "600px" }}
        >
          {headline.split("").map((ch, i) => (
            <span
              key={i}
              data-letter
              className="inline-block"
              style={{ whiteSpace: ch === " " ? "pre" : "normal" }}
            >
              {ch}
            </span>
          ))}
        </h2>
        {description && (
          <p className="font-sans text-base md:text-lg text-cream max-w-2xl mx-auto mb-12">
            {description}
          </p>
        )}

        <div className="flex flex-wrap justify-center gap-3 md:gap-6">
          {[
            ["Days", days],
            ["Hours", hours],
            ["Mins", mins],
            ["Secs", secs],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col items-center">
              <div className="relative w-20 h-20 md:w-28 md:h-28 bg-page border border-line flex items-center justify-center">
                <div className="absolute inset-0 bg-gold/5 blur-md" />
                <span className="relative font-mono tabular-nums text-3xl md:text-5xl text-gold-ink font-bold drop-shadow-[0_0_12px_rgba(242,202,80,0.4)]">
                  {String(value).padStart(2, "0")}
                </span>
              </div>
              <span className="font-mono text-[10px] tracking-[0.3em] text-muted mt-3 uppercase">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};



/* ──────────────────────────────────────────────────────────────────────────
   WHY CHOOSE SAGA — 5 feature cards with cursor-following tilt + glow.
   ────────────────────────────────────────────────────────────────────────── */
// Icon registry — admin stores an icon by name (string); we resolve it here.
// Keep keys in sync with the options offered in the Homepage admin editor.
const FEATURE_ICONS = { Flame, Diamond, Gift, Truck, ShieldCheck, Sparkles, Crown, Award, Zap, Star, Lock };
const DEFAULT_FEATURE_ICON = Flame;

const TILT_FEATURES = [
  {
    icon: "Flame",
    title: "Limited Drops",
    desc: "Capsule releases. Once gone, never restocked.",
  },
  {
    icon: "Diamond",
    title: "Premium Quality",
    desc: "Hand-finished pieces. Made in Sri Lanka.",
  },
  {
    icon: "Gift",
    title: "Exclusive Perks",
    desc: "Every order ships with an unannounced extra.",
  },
  {
    icon: "Truck",
    title: "Islandwide Delivery",
    desc: "Anywhere in Sri Lanka. Free over LKR 10,000.",
  },
  {
    icon: "ShieldCheck",
    title: "Secure Checkout",
    desc: "Encrypted payments. Cash or card. Your call.",
  },
];

const TiltCard = ({ Icon, title, desc, index }) => {
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const FeatureIcon = Icon;

  const onMove = (e) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setTilt({ x: (py - 0.5) * -10, y: (px - 0.5) * 10 });
  };
  const onLeave = () => setTilt({ x: 0, y: 0 });

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ delay: index * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{
        transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: "transform 0.2s ease-out",
      }}
      className="group relative bg-page border border-card p-6 md:p-8 hover:border-gold-ink/50 transition-colors"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-gold/0 via-gold/5 to-vip/8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="relative z-10">
        <div className="w-12 h-12 mb-5 flex items-center justify-center border border-line bg-panel group-hover:border-gold-ink transition-colors">
          <FeatureIcon className="w-5 h-5 text-gold-ink group-hover:scale-110 transition-transform" strokeWidth={1.5} />
        </div>
        <h3 className="font-display text-xl md:text-2xl text-ink uppercase mb-2 tracking-wider">
          {title}
        </h3>
        <p className="font-sans text-sm text-muted leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
};

export const WhyChooseSaga = () => {
  // Static feature cards — see TILT_FEATURES.
  const features = TILT_FEATURES.map((f) => ({
    icon: f.icon,
    title: f.title,
    desc: f.desc ?? f.description ?? "",
  }));

  const eyebrow = "Why Saga Elite";
  const headline = "Built for those who notice";

  return (
    <section className="bg-page py-16 md:py-24 border-y border-card">
      <div className="max-w-[1440px] mx-auto px-6">
        <div className="text-center mb-12">
          <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-gold-ink mb-3">
            {eyebrow}
          </p>
          <h2 className="font-display text-[36px] md:text-[52px] leading-none text-ink uppercase">
            {headline}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
          {features.map((f, i) => (
            <TiltCard
              key={`${f.title}-${i}`}
              Icon={FEATURE_ICONS[f.icon] || DEFAULT_FEATURE_ICON}
              title={f.title}
              desc={f.desc}
              index={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

/* ──────────────────────────────────────────────────────────────────────────
   TRENDING FITS MARQUEE — two rows scrolling in opposite directions.
   ────────────────────────────────────────────────────────────────────────── */
const TRENDING_FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=80",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80",
  "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&q=80",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&q=80",
  "https://images.unsplash.com/photo-1551803091-e20673f15770?w=600&q=80",
  "https://images.unsplash.com/photo-1492447166138-50c3889fccb1?w=600&q=80",
  "https://images.unsplash.com/photo-1485518882345-15568b007407?w=600&q=80",
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&q=80",
];

const MarqueeProductTile = ({ product, fallbackImage }) => {
  const url =
    product?.images?.[0]?.url ||
    product?.imageUrl ||
    fallbackImage;
  const slug = product?.slug || product?._id;
  const Wrapper = slug ? Link : "div";
  const wrapperProps = slug ? { to: `/shopping/product/${slug}` } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className="relative shrink-0 w-[200px] md:w-[260px] aspect-[3/4] overflow-hidden border border-card bg-panel group block"
    >
      <img
        src={url}
        alt={product?.name || "Trending fit"}
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-page/90 via-transparent to-transparent" />
      {product?.name && (
        <div className="absolute bottom-3 left-3 right-3">
          <p className="font-sans text-xs text-ink truncate">{product.name}</p>
          {product.basePrice ? (
            <p className="font-mono text-[10px] text-gold-ink mt-1">
              {formatLkr(
                Math.round(
                  product.basePrice * (1 - (product.discountPercent || 0) / 100)
                )
              )}
            </p>
          ) : null}
        </div>
      )}
    </Wrapper>
  );
};

const MarqueeRow = ({ products, direction = "left", duration = 40 }) => {
  const items = products.length > 0 ? products : TRENDING_FALLBACK_IMAGES.map((u) => ({ images: [{ url: u }] }));
  const doubled = [...items, ...items];
  return (
    <div className="overflow-hidden relative">
      <motion.div
        className="flex gap-4 md:gap-5"
        animate={{ x: direction === "left" ? ["0%", "-50%"] : ["-50%", "0%"] }}
        transition={{ duration, repeat: Infinity, ease: "linear" }}
      >
        {doubled.map((p, i) => (
          <MarqueeProductTile
            key={i}
            product={p}
            fallbackImage={
              TRENDING_FALLBACK_IMAGES[i % TRENDING_FALLBACK_IMAGES.length]
            }
          />
        ))}
      </motion.div>
    </div>
  );
};

export const TrendingFitsMarquee = ({ products = [] }) => {
  const half = Math.ceil(products.length / 2);
  const rowA = products.slice(0, half);
  const rowB = products.slice(half);
  return (
    <section className="bg-page py-16 md:py-20 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-6 mb-10 text-center">
        <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-vip mb-3">
          Most Wanted
        </p>
        <h2 className="font-display text-[36px] md:text-[56px] leading-none text-ink uppercase mb-3">
          Trending Fits
        </h2>
        <p className="font-sans text-sm text-muted max-w-md mx-auto">
          The pieces every other Saga is wearing this week.
        </p>
      </div>
      <div className="space-y-4 md:space-y-5">
        <MarqueeRow products={rowA} direction="left" duration={50} />
        <MarqueeRow products={rowB} direction="right" duration={55} />
      </div>
    </section>
  );
};

/* ──────────────────────────────────────────────────────────────────────────
   COMMUNITY FEED — masonry-ish grid of placeholder community shots.
   ────────────────────────────────────────────────────────────────────────── */
const COMMUNITY_FALLBACK = [
  { url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80", span: "row" },
  { url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80", span: "" },
  { url: "https://images.unsplash.com/photo-1492447166138-50c3889fccb1?w=800&q=80", span: "" },
  { url: "https://images.unsplash.com/photo-1551803091-e20673f15770?w=800&q=80", span: "col" },
  { url: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80", span: "" },
  { url: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&q=80", span: "" },
];



/* ──────────────────────────────────────────────────────────────────────────
   VIP MEMBERSHIP — full-bleed gradient CTA.
   ────────────────────────────────────────────────────────────────────────── */
// Admin-managed VIP block (vip_membership) with hardcoded fallback.
const DEFAULT_VIP_PERKS = [
  { icon: "Zap", label: "Early drop access" },
  { icon: "Gift", label: "Members-only rewards" },
  { icon: "Award", label: "Closed community channel" },
  { icon: "Crown", label: "Founders-list status" },
];

export const VipMembership = () => {
  const { open: openAuthDrawer } = useAuthDrawer();
  const { isAuthenticated } = useSelector((state) => state.auth || { isAuthenticated: false });

  // Static editorial copy + perks.
  const eyebrow = "Members Only";
  const headline = "Become";
  const highlight = "Elite";
  const body =
    "Get early drop access, members-only rewards, and a private channel where the next chapter previews 48 hours before anyone else.";
  const ctaText = "Claim Elite Access";
  const perks = DEFAULT_VIP_PERKS;

  const ctaClass =
    "inline-flex items-center gap-3 bg-gold hover:bg-gold-hover text-ongold px-10 py-5 font-mono text-[11px] tracking-[0.3em] uppercase font-bold transition-colors group";
  const ctaStyle = { boxShadow: "0 0 32px rgba(242,202,80,0.25)" };

  return (
    <section className="relative bg-page py-20 md:py-28 overflow-hidden border-y border-card">
      {/* Layered glow */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[600px] h-[600px] bg-gold/8 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[600px] h-[600px] bg-vip/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(242,202,80,0.06),transparent_60%)] pointer-events-none" />

      <div className="relative z-10 max-w-[900px] mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 border border-gold-ink/40 bg-gold/5 px-4 py-2 mb-6">
          <Crown className="w-3.5 h-3.5 text-gold-ink" />
          <span className="font-mono text-[10px] tracking-[0.32em] uppercase text-gold-ink">
            {eyebrow}
          </span>
        </div>
        <h2 className="font-display text-[44px] md:text-[80px] leading-none text-ink uppercase mb-6">
          {headline}
          {highlight ? (
            <>
              {" "}
              <span className="text-gold-ink">{highlight}</span>
            </>
          ) : null}
        </h2>
        <p className="font-sans text-base md:text-lg text-cream max-w-xl mx-auto mb-10 leading-relaxed">
          {body}
        </p>

        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mb-10 max-w-2xl mx-auto">
          {perks.map((perk, i) => {
            const PerkIcon = FEATURE_ICONS[perk.icon] || Crown;
            return (
              <div
                key={`${perk.label}-${i}`}
                className="flex items-center gap-2 text-cream"
              >
                <PerkIcon
                  className="w-4 h-4 text-gold-ink"
                  strokeWidth={1.5}
                />
                <span className="font-mono text-[10px] tracking-[0.22em] uppercase">
                  {perk.label}
                </span>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => (isAuthenticated ? undefined : openAuthDrawer("register"))}
          className={ctaClass}
          style={ctaStyle}
        >
          {ctaText}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </section>
  );
};
