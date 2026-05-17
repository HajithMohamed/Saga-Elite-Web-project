import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Box,
  Gift,
  Sparkles,
  Mail,
  Zap,
  ShieldCheck,
  Crown,
  Star,
  Instagram,
  Quote,
  CheckCircle2,
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

const MotionDiv = motion.div;
const seededRandom = (seed) => {
  const value = Math.sin(seed * 9999) * 10000;
  return value - Math.floor(value);
};

// Spline runtime is heavy (~200KB). Lazy-load only when a scene URL is provided.
const Spline = React.lazy(() => import("@splinetool/react-spline"));

const sectionContainer = "max-w-[1440px] mx-auto px-6";

// ⏱ INLINE DROP COUNTDOWN
export const InlineDropCountdown = ({ endDate }) => {
  const [timeLeft, setTimeLeft] = useState(() => getRemainingTime(endDate));

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getRemainingTime(endDate)), 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  return (
    <div className="flex items-center gap-4 text-[#e5e2e1] font-mono text-[11px] md:text-[13px] tracking-widest mt-4">
      {[['D', timeLeft.days ?? timeLeft.d], ['H', timeLeft.hh ?? timeLeft.h], ['M', timeLeft.mm ?? timeLeft.m], ['S', timeLeft.ss ?? timeLeft.s]].map(([label, value]) => (
        <div key={label} className="flex items-baseline gap-1">
          <span className="text-[#f2ca50] font-bold text-lg md:text-xl">
            {value !== undefined ? value.toString().padStart(2, '0') : '00'}
          </span>
          <span className="text-[#99907c]">{label}</span>
        </div>
      ))}
    </div>
  );
};// 🎬 HERO SECTION (MAIN IMPACT ZONE)
export const HeroCarousel = ({ slides = [], activeDrops = [], nextDrop = null }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [initialNow] = useState(() => Date.now());
  const navigate = useNavigate();

  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const sectionRef = useRef(null);

  const handleMouseMove = (e) => {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setMouseOffset({
      x: ((e.clientX - cx) / rect.width) * 14,
      y: ((e.clientY - cy) / rect.height) * 8,
    });
  };

  const handleMouseLeave = () => setMouseOffset({ x: 0, y: 0 });

  const displaySlides = activeDrops.length > 0
    ? activeDrops.map((d, i) => ({
        id: d._id || d.slug || `drop-${i}`,
        imageUrl: d.images?.[0]?.url || d.coverImageUrl || '',
        label: '🔴 LIVE DROP',
        headline: d.name,
        subheadline: d.description,
        ctaText: 'SHOP THE DROP',
        ctaLink: `/shopping/drop/${d.slug}`,
        endDate: d.endDate,
        isDrop: true
      }))
    : slides;

  const nextDropTime = nextDrop?.releaseDate
    ? new Date(nextDrop.releaseDate).getTime()
    : null;
  const dropIsUpcoming = Number.isFinite(nextDropTime) && nextDropTime > initialNow;
  const daysUntilDrop = Number.isFinite(nextDropTime)
    ? (nextDropTime - initialNow) / 86400000
    : 999;
  const isUpcomingSoon = dropIsUpcoming && daysUntilDrop <= 7;

  // Gesture handling for mobile
  const touchStartX = useRef(null);
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 50) {
      if (delta > 0) setActiveIndex(prev => (prev + 1) % displaySlides.length);
      else setActiveIndex(prev => (prev - 1 + displaySlides.length) % displaySlides.length);
    }
    touchStartX.current = null;
  };

  useEffect(() => {
    // If it's upcoming (and no active drops), it shows static Upcoming state, so no rotation.
    if (displaySlides.length === 0 && dropIsUpcoming) return; 
    if (paused || displaySlides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % displaySlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [displaySlides.length, paused, dropIsUpcoming]);

  // STATE: Upcoming drop (only if no active slides/drops)
  if (displaySlides.length === 0 && dropIsUpcoming) {
    return (
      <section className="relative h-[58vh] md:h-[62vh] lg:h-[68vh] max-h-[700px] overflow-hidden bg-[#0a0a0a]">
        <div className="absolute inset-0 grid grid-cols-2 md:grid-cols-4 gap-px opacity-40">
          {(nextDrop.products || []).slice(0, 4).map((p, i) => (
            <div key={i} className="relative overflow-hidden">
              {p.images?.[0]?.url && (
                <img src={p.images[0].url} alt=""
                     className="w-full h-full object-cover filter blur-2xl scale-110 brightness-50"
                     aria-hidden="true" loading="lazy" />
              )}
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-[#0a0a0a]/80" />
        <div className="absolute inset-0 bg-grain opacity-40 mix-blend-overlay pointer-events-none" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#f2ca50] mb-4">
            ⚡ COMING SOON
          </p>
          <h1 className="font-display text-[42px] md:text-[80px] leading-none text-[#FAF7F2] mb-4 uppercase drop-shadow-2xl">
            {nextDrop.name}
          </h1>
          <p className="font-sans text-base text-[#FAF7F2]/70 max-w-md mb-6">
            {nextDrop.description || 'Something rare is being prepared. Stay ready.'}
          </p>
          <p className="font-sans text-sm text-[#d0c5af] mb-8 uppercase tracking-widest font-bold">
            DROPS {new Date(nextDrop.releaseDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {isUpcomingSoon && (
              <button onClick={() => {
                  toast({ title: "You're on the list", description: `We'll notify you when ${nextDrop.name} goes live.` });
                }}
                className="flex items-center justify-center gap-2 bg-[#f2ca50] text-[#0a0a0a] px-8 py-4 font-sans text-[11px] tracking-[0.28em] uppercase hover:bg-[#ffe088] transition-colors font-bold"
              >
                🔔 REMIND ME
              </button>
            )}
            <a href={`https://wa.me/+94770704274?text=Notify me when ${nextDrop.name} drops`}
               target="_blank" rel="noopener noreferrer"
               className="flex items-center justify-center gap-2 border border-[#FAF7F2]/40 text-white px-8 py-4 font-sans text-[11px] tracking-[0.28em] uppercase hover:border-[#25D366] hover:text-[#25D366] transition-colors font-bold">
              <MessageCircle className="w-4 h-4" /> WHATSAPP
            </a>
          </div>
        </div>
      </section>
    );
  }

  // STATE: Carousel (Active Drops or Standard Slides)
  return (
    <section 
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative h-[58vh] md:h-[62vh] lg:h-[68vh] max-h-[700px] w-full overflow-hidden bg-[#050505]"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <AnimatePresence initial={false} custom={activeIndex}>
        {displaySlides.map((slide, index) => {
          if (index !== activeIndex) return null;
          return (
            <motion.div
              key={slide.id || index}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: [0.19, 1, 0.22, 1] }}
              className="absolute inset-0"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              <div
                className="w-full h-full"
                style={{
                  transform: `translate(${mouseOffset.x}px, ${mouseOffset.y}px)`,
                  transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                  willChange: 'transform',
                }}
              >
                {slide.imageUrl ? (
                  <div className="w-full h-full bg-black">
                    <img src={slide.imageUrl} alt={slide.headline} 
                         className="w-full h-full object-contain md:object-cover"
                         loading="eager"
                         onError={(e) => { e.currentTarget.style.display = 'none'; }}
                         srcSet={`${slide.imageUrl}?w=640 640w, ${slide.imageUrl}?w=1280 1280w, ${slide.imageUrl}?w=1920 1920w`}
                         sizes="100vw" />
                  </div>
                ) : (
                  <div className="w-full h-full" style={{ background: slide.fallback }} />
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/90 via-[#0a0a0a]/30 to-transparent" />
              <div className="absolute inset-0 bg-grain opacity-40 mix-blend-overlay pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-full overflow-hidden flex justify-center mix-blend-overlay">
                <span className="font-display text-[20vw] font-black text-[#ffffff] opacity-[0.03] leading-none whitespace-nowrap" style={{ transform: `translate(${mouseOffset.x * -0.5}px, ${mouseOffset.y * -0.5}px)` }}>RARE</span>
              </div>
              
              <div className={`${sectionContainer} h-full relative z-10 flex flex-col justify-end pb-16 md:pb-24`}>
                <div className="bg-[#0a0a0a]/50 backdrop-blur-xl border border-white/10 p-6 md:p-10 max-w-2xl text-left rounded-sm shadow-2xl">
                  <motion.p
                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.8 }}
                    className="font-sans text-[10px] tracking-[0.4em] uppercase text-[#f2ca50] mb-4"
                  >
                    {slide.label || "Exclusive"}
                  </motion.p>
                  <motion.h2
                    initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5, duration: 0.8 }}
                    className="font-display text-[32px] md:text-[56px] leading-[0.9] text-[#FAF7F2] uppercase tracking-tighter"
                  >
                    {slide.headline.split('\n').map((line, i) => (
                      <React.Fragment key={i}>{line}<br /></React.Fragment>
                    ))}
                  </motion.h2>
                  <motion.p
                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7, duration: 0.8 }}
                    className="font-sans text-sm md:text-base text-[#FAF7F2]/80 mt-4 max-w-lg leading-relaxed"
                  >
                    {slide.subheadline}
                  </motion.p>
                  
                  {slide.isDrop && slide.endDate && (
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8, duration: 0.8 }} className="mt-4">
                      <InlineDropCountdown endDate={slide.endDate} />
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.9, duration: 0.8 }}
                    className="mt-8 flex flex-wrap gap-4"
                  >
                    <button
                      onClick={() => navigate(slide.ctaLink)}
                      className="relative overflow-hidden group bg-[#f2ca50] text-[#0a0a0a] px-8 py-4 font-sans text-[11px] uppercase tracking-[0.28em] font-bold"
                    >
                      <span className="relative z-10">{slide.ctaText || "Explore Drop"}</span>
                      <div className="absolute inset-0 bg-[#ffe088] scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-500 ease-[0.19,1,0.22,1]" />
                    </button>
                    {slide.isDrop && (
                      <button
                        onClick={() => navigate('/shopping/drops')}
                        className="border border-[#FAF7F2]/40 text-[#FAF7F2] px-8 py-4 font-sans text-[11px] tracking-[0.28em] uppercase hover:border-[#f2ca50] hover:text-[#f2ca50] transition-colors font-bold"
                      >
                        VIEW ALL PIECES
                      </button>
                    )}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Modern Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        {displaySlides.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={`h-0.5 transition-all duration-300 ${activeIndex === index ? "w-8 bg-[#f2ca50]" : "w-6 bg-[#FAF7F2]/40 hover:bg-[#FAF7F2]/60"}`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
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
    <div className="bg-[#0b0b0b] border-y border-[#4d4635]/40 py-12 relative overflow-hidden">
      {/* Glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-1/2 bg-[#f2ca50]/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-[800px] mx-auto px-6 text-center relative z-10">
        <h3 className="font-mono text-[12px] tracking-[0.4em] uppercase text-[#ffb4ab] mb-3 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#ffb4ab] animate-pulse" />
          {title || "Next Drop"}
        </h3>
        <p className="font-display text-2xl text-[#e5e2e1] mb-8">{description}</p>
        
        <div className="flex justify-center gap-4 text-[#e5e2e1]">
          {[['Days', timeLeft.d], ['Hours', timeLeft.hh], ['Mins', timeLeft.mm], ['Secs', timeLeft.ss]].map(([label, value]) => (
            <div key={label} className="flex flex-col items-center">
               <div className="w-16 h-16 md:w-20 md:h-20 bg-[#131313] border border-[#2a2a2a] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                 <span className="font-mono text-3xl md:text-4xl text-[#f2ca50]">{value.toString().padStart(2, '0')}</span>
               </div>
               <span className="font-body text-[10px] uppercase tracking-widest text-[#d0c5af] mt-2">{label}</span>
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
        <h3 className="font-display text-[32px] md:text-[42px] text-[#e5e2e1] uppercase">Choose Your Identity</h3>
        <p className="font-mono text-[11px] text-[#d0c5af] tracking-[0.3em] uppercase mt-2">Elevated Aesthetics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {categories.map((cat) => (
          <Link key={cat.name} to={cat.link} className="group block relative aspect-[3/4] overflow-hidden bg-[#131313]">
            <img src={cat.image} alt={cat.name} className="w-full h-full object-cover transition-transform duration-[1.5s] ease-[0.19,1,0.22,1] group-hover:scale-105" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e]/90 via-[#0e0e0e]/20 to-transparent" />
            
            {/* Outline box that draws on hover */}
            <div className="absolute inset-4 border border-[#f2ca50]/0 group-hover:border-[#f2ca50]/50 transition-colors duration-500 rounded-sm pointer-events-none" />

            <div className="absolute bottom-8 w-full text-center transform transition-transform duration-500 group-hover:-translate-y-4">
              <h4 className="font-display text-4xl text-[#e5e2e1] uppercase tracking-wider">{cat.name}</h4>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#f2ca50] mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                Explore Collection
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

// 🎁 MYSTERY GIFT SIGNATURE SECTION
export const MysteryGiftSection = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="bg-[#0a0a0a] border-y border-[#1f1f1f] py-12 relative overflow-hidden">
      {/* Background radial gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#d4af37]/5 blur-[100px] rounded-full pointer-events-none" />
      
      <div className={`${sectionContainer} flex flex-col md:flex-row items-center gap-12 relative z-10`}>
        <div className="flex-1 md:pr-12 text-center md:text-left">
          <h2 className="font-display text-[40px] md:text-[56px] leading-[1.1] text-[#e5e2e1] uppercase">
            The Saga <br/> Mystery Box
          </h2>
          <p className="font-body text-[#d0c5af] text-base lg:text-lg mt-6 max-w-md mx-auto md:mx-0">
             Every order over LKR 10,000 unlocks a surprise reward. It could be an unreleased drop, a rare accessory, or a discount code for the future.
          </p>
          <div className="mt-8 flex flex-col gap-4 max-w-sm mx-auto md:mx-0">
             <div className="flex items-center gap-4 border border-[#2a2a2a] bg-[#131313] p-4">
                <Gift className="text-[#f2ca50]" />
                <span className="font-mono text-[11px] text-[#e5e2e1] tracking-widest uppercase">Guaranteed on eligible orders</span>
             </div>
          </div>
        </div>

        <div className="flex-1 relative flex justify-center items-center h-[400px] w-full">
           <motion.div 
              whileHover={!isOpen ? { scale: 1.05, rotate: [0, -2, 2, -2, 0] } : {}}
              transition={{ duration: 0.5 }}
              onClick={() => setIsOpen(true)}
              className="cursor-pointer relative z-20"
           >
              <div className="relative">
                <Box className={`w-40 h-40 ${isOpen ? 'text-[#393939]' : 'text-[#f2ca50]'} transition-colors duration-1000`} strokeWidth={1} />
                
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ scale: 0, y: 20, opacity: 0 }}
                      animate={{ scale: 1, y: -40, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 20 }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#f2ca50] text-[#0e0e0e] font-display text-2xl px-6 py-3 whitespace-nowrap shadow-[0_0_30px_#f2ca50]"
                    >
                      <Sparkles className="inline mr-2 w-5 h-5 mb-1" />
                      UNLOCKED
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
           </motion.div>

           {/* Particle ring */}
           <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-[#f2ca50]/20 pointer-events-none transition-all duration-1000 ${isOpen ? 'scale-150 opacity-0' : 'animate-[spin_10s_linear_infinite]'}`} />
        </div>
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
      <div className="flex justify-between items-end mb-8 border-b border-[#2a2a2a] pb-4">
        <div>
          <h3 className="font-display text-[28px] md:text-[36px] text-[#e5e2e1] uppercase">{title}</h3>
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#d0c5af] uppercase mt-2">{subtitle}</p>
        </div>
        <div className="flex gap-2">
          <button className="h-10 w-10 flex items-center justify-center border border-[#4d4635] text-[#d0c5af] hover:text-[#f2ca50] hover:border-[#f2ca50] transition-colors" onClick={() => scrollBy(-300)} aria-label="Scroll left">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button className="h-10 w-10 flex items-center justify-center border border-[#4d4635] text-[#d0c5af] hover:text-[#f2ca50] hover:border-[#f2ca50] transition-colors" onClick={() => scrollBy(300)} aria-label="Scroll right">
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
    { icon: Gift, text: "MYSTERY REWARDS" },
  ];
  return (
    <section className="bg-[#0b0b0b] border-y border-[#1f1f1f] py-4">
      <div className="max-w-[1000px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-center gap-4">
        {items.map((item) => (
          <div key={item.text} className="flex items-center gap-3 text-[#d0c5af] font-mono text-[10px] tracking-[0.2em] uppercase">
            <item.icon className="h-4 w-4 text-[#f2ca50]" />
            {item.text}
          </div>
        ))}
      </div>
    </section>
  );
};

// 🎪 OFFERS SYSTEM HOMEPAGE SECTION
export const OffersSlider = ({ offers = [] }) => {
  const scrollerRef = useRef(null);
  const scrollBy = (d) => scrollerRef.current?.scrollBy({ left: d, behavior: 'smooth' });
  const offerCards = useMemo(
    () =>
      offers.flatMap((offer, offerIndex) =>
        (offer.products || []).filter(Boolean).map((product, productIndex) => ({
          offer,
          product,
          key: `${offer._id || offer.id || offerIndex}-${product._id || product.id || productIndex}`,
        }))
      ),
    [offers]
  );

  if (offerCards.length === 0) return null;

  return (
    <section className="py-10 bg-[#0e0e0e] border-y border-[#4d4635]/40">
      <div className={sectionContainer}>
        <div className="flex justify-between items-end mb-6">
          <div>
            <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#f2ca50]">
              Active Offers
            </p>
            <h3 className="font-display text-[28px] text-[#e5e2e1] mt-1">
              Limited-Time Deals
            </h3>
            <p className="text-[13px] text-[#d0c5af]">
              Selected pieces at special prices — for a short time only
            </p>
          </div>
          <Link to="/shopping/product-list?filter=offers"
                className="text-[#f2ca50] text-sm hover:text-[#ffe088] transition-colors">
            View All Offers →
          </Link>
        </div>

        <div className="relative">
          <button className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 rounded-full border border-[#4d4635] bg-[#0e0e0e] text-[#e5e2e1] p-2 hover:border-[#f2ca50] transition-colors"
                  onClick={() => scrollBy(-300)} aria-label="Scroll left">
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div ref={scrollerRef} className="flex gap-5 overflow-x-auto snap-x scroll-smooth pb-2 scrollbar-hide">
            {offerCards.map(({ key, product, offer }) => (
              <OfferCard key={key} product={product} offer={offer} />
            ))}
          </div>

          <button className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 rounded-full border border-[#4d4635] bg-[#0e0e0e] text-[#e5e2e1] p-2 hover:border-[#f2ca50] transition-colors"
                  onClick={() => scrollBy(300)} aria-label="Scroll right">
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

// 🎁 OFFER CARD
const OfferCard = ({ product, offer }) => {
  const discountedPrice = Math.round(product.basePrice * (1 - offer.discountPercent / 100));
  const [timeLeft, setTimeLeft] = useState(getRemainingTime(offer.endsAt));

  useEffect(() => {
    const iv = setInterval(() => setTimeLeft(getRemainingTime(offer.endsAt)), 1000);
    return () => clearInterval(iv);
  }, [offer.endsAt]);

  return (
    <Link to={`/shopping/product/${product.slug}`} className="w-[200px] md:w-[220px] shrink-0 snap-start group border border-[#4d4635] bg-[#131313] hover:border-[#f2ca50] transition-colors overflow-hidden block">
      <div className="relative aspect-[3/4] overflow-hidden bg-[#1c1b1b]">
        {product.images?.[0]?.url && (
          <img src={product.images[0].url} alt={product.name} loading="lazy" width={220} height={293} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        )}
        <span className="absolute top-3 left-3 bg-[#ffb4ab] text-[#0a0a0a] font-sans text-[10px] px-2 py-0.5 tracking-[0.1em]">
          {offer.badgeText || `SAVE ${offer.discountPercent}%`}
        </span>
        <div className="absolute bottom-0 left-0 right-0 bg-[#0a0a0a]/90 py-1.5 text-center">
          <span className="font-mono text-[#f2ca50] text-[11px]">
            ⏱ {timeLeft.hh || timeLeft.h || '00'}:{timeLeft.mm || timeLeft.m || '00'}:{timeLeft.ss || timeLeft.s || '00'}
          </span>
        </div>
      </div>
      <div className="p-3">
        <h4 className="font-sans text-sm text-[#e5e2e1] truncate">{product.name}</h4>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-[#f2ca50] font-medium text-sm">{formatLkr(discountedPrice)}</span>
          <span className="text-[#d0c5af] line-through text-xs">{formatLkr(product.basePrice)}</span>
          <span className="bg-[#ffb4ab]/20 text-[#ffb4ab] text-[10px] px-1.5 py-0.5">-{offer.discountPercent}%</span>
        </div>
        <p className="font-sans text-[10px] text-[#99907c] mt-1">{offer.description || 'Limited time offer'}</p>
      </div>
    </Link>
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
    <div className="bg-[#f2ca50] text-[#0a0a0a] py-2 px-4 text-center">
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
           <Link key={cat.name} to={cat.link} className="group relative overflow-hidden aspect-[3/4] cursor-pointer border border-[#4d4635]/60 transition-all duration-500 hover:border-[#f2ca50]/60 hover:[box-shadow:0_0_30px_rgba(242,202,80,0.20),inset_0_0_0_1px_rgba(242,202,80,0.15)] bg-[#131313]">
             <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a]" />
             {cat.img && (
               <img
                 src={cat.img}
                 alt={cat.name}
                 className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 group-hover:opacity-80 transition-all duration-700"
                 loading="lazy"
                 onError={(e) => { e.currentTarget.style.display = 'none'; }}
               />
             )}
             <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/20 to-transparent" />
             <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-center text-center justify-end">
               <div className="transition-transform duration-500 group-hover:-translate-y-2">
                 <h3 className="font-display text-4xl md:text-5xl text-[#FAF7F2] uppercase tracking-widest">{cat.name}</h3>
               </div>
               <p className="mt-1 se-label font-bold text-[9px] tracking-[0.3em] text-[#d0c5af]/80 opacity-0 translate-y-2 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
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

// 🎁 MYSTERY GIFT STRIP
export const MysteryGiftStrip = () => {
  return (
    <section className="border-y border-[#2a2a2a] bg-[#0a0a0a] py-6 relative overflow-hidden group cursor-pointer">
      <div className="absolute inset-0 bg-gradient-to-r from-[#f2ca50]/0 via-[#f2ca50]/10 to-[#f2ca50]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
      <div className="max-w-[1440px] mx-auto px-6 flex flex-col md:flex-row items-center justify-center gap-4 text-center md:text-left">
        <Gift className="w-6 h-6 text-[#f2ca50] animate-pulse" />
        <p className="font-mono text-[11px] tracking-[0.2em] text-[#FAF7F2] uppercase">
          Spend LKR 15,000+ to unlock a <span className="text-[#f2ca50] font-bold">Mystery Reward</span> at checkout.
        </p>
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
        <h3 className="font-display text-[28px] md:text-[36px] text-[#e5e2e1] uppercase">{title}</h3>
        <div className="w-12 h-0.5 bg-[#f2ca50] mx-auto mt-4" />
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
    <section className="py-10 bg-[#050505]">
      <div className={`${sectionContainer}`}>
        <div className="border border-[#2a2a2a] p-8 md:p-12 relative overflow-hidden bg-[#0a0a0a]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#f2ca50] opacity-5 blur-[100px] pointer-events-none" />
          <div className="flex flex-col md:flex-row gap-12 items-center relative z-10">
             <div className="flex-1">
               <span className="bg-[#f2ca50] text-[#0a0a0a] font-mono text-[10px] px-3 py-1 uppercase tracking-widest font-bold">Live Selected Drop</span>
               <h2 className="font-display text-4xl md:text-5xl text-[#FAF7F2] uppercase mt-6 mb-4 leading-none">{activeDrop.name}</h2>
               <p className="font-sans text-[#FAF7F2]/70 text-sm mb-8 leading-relaxed max-w-md">{activeDrop.description}</p>
               <InlineDropCountdown endDate={activeDrop.endDate} />
               <Link to={`/shopping/drop/${activeDrop.slug}`} className="inline-block mt-8 bg-[#f2ca50] text-[#0a0a0a] px-8 py-4 font-mono text-[11px] tracking-[0.2em] font-bold hover:bg-[#ffe088] transition-colors uppercase">
                 View The Collection
               </Link>
             </div>
             {(activeDrop?.images?.[0]?.url || activeDrop?.coverImageUrl) && (
               <div className="flex-1 w-full aspect-square md:aspect-[4/3] bg-[#131313]">
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
    <section className="bg-[#050505] py-12 border-t border-[#1a1a1a]">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <Mail className="w-8 h-8 text-[#f2ca50] mx-auto mb-6" />
        <h3 className="font-display text-4xl text-[#FAF7F2] uppercase mb-4">
          Unlock Future Drops
        </h3>
        <p className="font-sans text-sm text-[#99907c] mb-8">
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
            className="flex-1 bg-[#131313] border border-[#2a2a2a] text-[#FAF7F2] px-4 py-3 font-mono text-[11px] outline-none focus:border-[#f2ca50] transition-colors disabled:opacity-60"
            required
          />
          <button
            type="submit"
            disabled={status === "loading" || status === "success"}
            className="bg-[#FAF7F2] text-[#0a0a0a] px-8 py-3 font-mono text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-[#f2ca50] transition-colors disabled:opacity-60"
          >
            {buttonLabel}
          </button>
        </form>
        {status === "success" ? (
          <p className="mt-4 text-[#f2ca50] text-xs font-mono uppercase tracking-widest">
            You're on the list. Watch your inbox.
          </p>
        ) : null}
        {status === "error" ? (
          <p className="mt-4 text-[#ffb4ab] text-xs font-mono">
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-8 pt-6 border-t border-[#1a1a1a]">
          <p className="font-mono text-[10px] text-[#99907c] tracking-widest uppercase mb-3">
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
   ANNOUNCEMENT BAR — thin animated marquee at top of homepage.
   When a drop is live, it shows the live drop + countdown.
   Otherwise it cycles through static hype messages.
   ────────────────────────────────────────────────────────────────────────── */
const ANNOUNCEMENT_MESSAGES = [
  "🚀 LATEST DROP LIVE NOW",
  "🎁 EVERY ORDER UNLOCKS A MYSTERY REWARD",
  "⚡ LIMITED STOCK · RARE FIT FOREVER",
  "🔥 FREE DELIVERY OVER LKR 10,000",
  "💎 MEMBERS GET EARLY DROP ACCESS",
  "LIMITED TO 1 PIECE PER MEMBER",
  "SRI LANKA'S MOST EXCLUSIVE STREETWEAR",
  "NEW CHAPTER DROPS EVERY MONTH",
  "ISLANDWIDE DELIVERY IN 2-4 DAYS",
  "MEMBERS SEE DROPS 24H EARLY",
];

export const AnnouncementBar = ({ activeDrop = null }) => {
  const [timeLeft, setTimeLeft] = useState(() =>
    activeDrop?.endDate ? getRemainingTime(activeDrop.endDate) : null
  );

  useEffect(() => {
    if (!activeDrop?.endDate) return undefined;
    const iv = setInterval(
      () => setTimeLeft(getRemainingTime(activeDrop.endDate)),
      1000
    );
    return () => clearInterval(iv);
  }, [activeDrop?.endDate]);

  // Drop-aware mode: show live drop with countdown.
  if (activeDrop && timeLeft && (timeLeft.total ?? 1) > 0) {
    const d = timeLeft.days ?? timeLeft.d ?? 0;
    const h = timeLeft.hh ?? timeLeft.h ?? "00";
    const m = timeLeft.mm ?? timeLeft.m ?? "00";
    const s = timeLeft.ss ?? timeLeft.s ?? "00";
    return (
      <Link
        to={`/shopping/drop/${activeDrop.slug}`}
        className="block w-full bg-[#0a0a0a] border-b border-[#f2ca50]/40 relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#f2ca50]/0 via-[#f2ca50]/15 to-[#f2ca50]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[2000ms] ease-out pointer-events-none" />
        <div className="relative z-10 max-w-[1440px] mx-auto px-6 py-2 flex items-center justify-center gap-3 md:gap-6 font-mono text-[10px] md:text-[11px] tracking-[0.28em] uppercase">
          <span className="flex items-center gap-2 text-[#f2ca50] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#f2ca50] animate-pulse shadow-[0_0_8px_#f2ca50]" />
            LIVE NOW · {activeDrop.name}
          </span>
          <span className="hidden md:inline text-[#574500]">|</span>
          <span className="text-[#e5e2e1] tabular-nums">
            ENDS IN {d > 0 ? `${d}D ` : ""}
            <span className="text-[#f2ca50]">{String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}</span>
          </span>
          <span className="hidden md:inline text-[#f2ca50] underline underline-offset-4 font-bold">
            SHOP DROP →
          </span>
        </div>
      </Link>
    );
  }

  // Marquee mode: infinite scroll of hype messages.
  const messages = [...ANNOUNCEMENT_MESSAGES, ...ANNOUNCEMENT_MESSAGES];
  return (
    <div className="w-full bg-[#0a0a0a] border-b border-[#1a1a1a] py-2 overflow-hidden relative">
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
      <MotionDiv
        className="flex gap-12 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
      >
        {messages.map((msg, i) => (
          <span
            key={i}
            className="font-mono text-[10px] md:text-[11px] tracking-[0.3em] uppercase text-[#d0c5af] flex items-center gap-3"
            style={
              /DROP|MEMBER|MYSTERY|LIMITED|EXCLUSIVE/.test(msg)
                ? { textShadow: "0 0 12px rgba(242,202,80,0.35)" }
                : undefined
            }
          >
            {msg}
            <span className="text-[#574500]">·</span>
          </span>
        ))}
      </MotionDiv>
    </div>
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
    <section className="relative bg-[#050505] py-20 md:py-28 overflow-hidden border-y border-[#1a1a1a]">
      {/* Radial gold + violet ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-[#f2ca50]/8 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#a855f7]/8 blur-[140px] rounded-full pointer-events-none" />

      {/* Floating particle accents */}
      {[...Array(18)].map((_, i) => (
        <motion.span
          key={i}
          className="absolute w-1 h-1 rounded-full bg-[#f2ca50]/60"
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
        <p className="font-mono text-[11px] tracking-[0.4em] uppercase text-[#a855f7] mb-3 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#a855f7] animate-pulse shadow-[0_0_10px_#a855f7]" />
          Hold Ready
        </p>
        <h2
          ref={headlineRef}
          className="font-display text-[40px] md:text-[80px] leading-none uppercase text-[#FAF7F2] mb-3 tracking-tight"
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
          <p className="font-sans text-base md:text-lg text-[#d0c5af] max-w-2xl mx-auto mb-12">
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
              <div className="relative w-20 h-20 md:w-28 md:h-28 bg-[#0e0e0e] border border-[#4d4635] flex items-center justify-center">
                <div className="absolute inset-0 bg-[#f2ca50]/5 blur-md" />
                <span className="relative font-mono tabular-nums text-3xl md:text-5xl text-[#f2ca50] font-bold drop-shadow-[0_0_12px_rgba(242,202,80,0.4)]">
                  {String(value).padStart(2, "0")}
                </span>
              </div>
              <span className="font-mono text-[10px] tracking-[0.3em] text-[#99907c] mt-3 uppercase">
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
   MYSTERY GIFT — Spline 3D box (when sceneUrl is provided), with a pure-CSS
   fallback that always works. The fallback is a glowing rotating box icon.
   ────────────────────────────────────────────────────────────────────────── */
const MysteryFallbackBox = () => {
  const [opened, setOpened] = useState(false);
  return (
    <div className="relative h-[360px] w-full flex items-center justify-center">
      <motion.div
        className="absolute w-[280px] h-[280px] rounded-full border border-[#f2ca50]/20"
        animate={{ rotate: 360 }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute w-[200px] h-[200px] rounded-full border border-[#a855f7]/25"
        animate={{ rotate: -360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      />
      <div className="absolute w-[400px] h-[400px] bg-[#f2ca50]/8 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute w-[300px] h-[300px] bg-[#a855f7]/10 blur-[80px] rounded-full pointer-events-none translate-x-12 -translate-y-8" />

      <motion.button
        type="button"
        onClick={() => setOpened((v) => !v)}
        whileHover={{ scale: 1.05, rotate: [0, -3, 3, 0] }}
        transition={{ duration: 0.6 }}
        className="relative z-10 group"
      >
        <Box
          className={`w-40 h-40 transition-colors duration-700 ${
            opened ? "text-[#a855f7]" : "text-[#f2ca50]"
          }`}
          strokeWidth={1}
          style={{
            filter: opened
              ? "drop-shadow(0 0 24px rgba(168, 85, 247, 0.6))"
              : "drop-shadow(0 0 18px rgba(242, 202, 80, 0.4))",
          }}
        />
        <AnimatePresence>
          {opened && (
            <motion.div
              initial={{ scale: 0, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: -50, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 18 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#f2ca50] text-[#0a0a0a] font-display text-2xl px-6 py-3 whitespace-nowrap shadow-[0_0_30px_#f2ca50] flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              UNLOCKED
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};

export const MysteryGiftSpline = ({ sceneUrl = null }) => (
  <section className="relative bg-[#0a0a0a] border-y border-[#1a1a1a] py-16 md:py-24 overflow-hidden">
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[700px] bg-[#a855f7]/5 blur-[120px] rounded-full pointer-events-none" />

    <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
      <div className="text-center md:text-left">
        <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-[#a855f7] mb-3">
          Signature Feature
        </p>
        <h2 className="font-display text-[40px] md:text-[60px] leading-none text-[#FAF7F2] uppercase mb-6">
          Every order <br />
          <span className="text-[#f2ca50]">unlocks a reward.</span>
        </h2>
        <p className="font-sans text-base text-[#d0c5af] leading-relaxed max-w-md mx-auto md:mx-0 mb-8">
          Could be an unreleased piece. Could be a discount code for the next drop.
          Could be access to a closed community channel. You won't know until your
          parcel lands.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto md:mx-0">
          <div className="flex items-center gap-3 border border-[#4d4635] bg-[#131313] px-4 py-3">
            <Gift className="w-4 h-4 text-[#f2ca50] shrink-0" />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#e5e2e1]">
              Guaranteed on every order
            </span>
          </div>
        </div>
      </div>

      <div className="relative h-[400px] md:h-[480px] w-full">
        {sceneUrl ? (
          <Suspense fallback={<MysteryFallbackBox />}>
            <Spline scene={sceneUrl} />
          </Suspense>
        ) : (
          <MysteryFallbackBox />
        )}
      </div>
    </div>
  </section>
);

/* ──────────────────────────────────────────────────────────────────────────
   WHY CHOOSE SAGA — 5 feature cards with cursor-following tilt + glow.
   ────────────────────────────────────────────────────────────────────────── */
const TILT_FEATURES = [
  {
    icon: Flame,
    title: "Limited Drops",
    desc: "Capsule releases. Once gone, never restocked.",
  },
  {
    icon: Diamond,
    title: "Premium Quality",
    desc: "Hand-finished pieces. Made in Sri Lanka.",
  },
  {
    icon: Gift,
    title: "Mystery Rewards",
    desc: "Every order ships with an unannounced extra.",
  },
  {
    icon: Truck,
    title: "Islandwide Delivery",
    desc: "Anywhere in Sri Lanka. Free over LKR 10,000.",
  },
  {
    icon: ShieldCheck,
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
      className="group relative bg-[#0e0e0e] border border-[#1f1f1f] p-6 md:p-8 hover:border-[#f2ca50]/50 transition-colors"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#f2ca50]/0 via-[#f2ca50]/5 to-[#a855f7]/8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="relative z-10">
        <div className="w-12 h-12 mb-5 flex items-center justify-center border border-[#4d4635] bg-[#131313] group-hover:border-[#f2ca50] transition-colors">
          <FeatureIcon className="w-5 h-5 text-[#f2ca50] group-hover:scale-110 transition-transform" strokeWidth={1.5} />
        </div>
        <h3 className="font-display text-xl md:text-2xl text-[#FAF7F2] uppercase mb-2 tracking-wider">
          {title}
        </h3>
        <p className="font-sans text-sm text-[#99907c] leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
};

export const WhyChooseSaga = () => (
  <section className="bg-[#050505] py-16 md:py-24 border-y border-[#1a1a1a]">
    <div className="max-w-[1440px] mx-auto px-6">
      <div className="text-center mb-12">
        <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-[#f2ca50] mb-3">
          Why Saga Elite
        </p>
        <h2 className="font-display text-[36px] md:text-[52px] leading-none text-[#FAF7F2] uppercase">
          Built for those who notice
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
        {TILT_FEATURES.map((f, i) => (
          <TiltCard
            key={f.title}
            Icon={f.icon}
            title={f.title}
            desc={f.desc}
            index={i}
          />
        ))}
      </div>
    </div>
  </section>
);

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
      className="relative shrink-0 w-[200px] md:w-[260px] aspect-[3/4] overflow-hidden border border-[#1f1f1f] bg-[#131313] group block"
    >
      <img
        src={url}
        alt={product?.name || "Trending fit"}
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/90 via-transparent to-transparent" />
      {product?.name && (
        <div className="absolute bottom-3 left-3 right-3">
          <p className="font-sans text-xs text-[#FAF7F2] truncate">{product.name}</p>
          {product.basePrice ? (
            <p className="font-mono text-[10px] text-[#f2ca50] mt-1">
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
    <section className="bg-[#0a0a0a] py-16 md:py-20 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-6 mb-10 text-center">
        <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-[#a855f7] mb-3">
          Most Wanted
        </p>
        <h2 className="font-display text-[36px] md:text-[56px] leading-none text-[#FAF7F2] uppercase mb-3">
          Trending Fits
        </h2>
        <p className="font-sans text-sm text-[#99907c] max-w-md mx-auto">
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

export const CommunityFeed = ({ images = [] }) => {
  const tiles = images.length > 0
    ? images.map((url, i) => ({ url, span: COMMUNITY_FALLBACK[i % COMMUNITY_FALLBACK.length].span }))
    : COMMUNITY_FALLBACK;

  return (
    <section className="bg-[#050505] py-16 md:py-24 border-y border-[#1a1a1a]">
      <div className="max-w-[1440px] mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <p className="se-label text-[#f2ca50] text-[10px] tracking-[0.4em]">
              COMMUNITY · THE STREETS SPEAK
            </p>
            <h2 className="se-serif text-[#e5e2e1] text-4xl md:text-6xl mt-3">
              Worn by the bold.
            </h2>
            <p className="font-sans text-sm text-[#99907c] mt-3 max-w-lg">
              Tag us. The best fits get featured here and on our story.
            </p>
          </div>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-[#4d4635] hover:border-[#f2ca50] text-[#d0c5af] hover:text-[#f2ca50] px-6 py-3 font-mono text-[10px] tracking-[0.28em] uppercase transition-colors shrink-0"
          >
            <Instagram className="w-4 h-4" />
            Follow on Instagram
          </a>
        </div>

        <div className="columns-2 md:columns-3 lg:columns-4 gap-2 space-y-2">
          {tiles.slice(0, 6).map((tile, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.04, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="break-inside-avoid group relative overflow-hidden cursor-pointer"
              style={{
                aspectRatio: i % 5 === 0 ? '3/4' : i % 5 === 1 ? '1/1' : i % 5 === 2 ? '2/3' : i % 5 === 3 ? '4/5' : '3/5',
              }}
            >
              <img
                src={tile.url || tile}
                alt={`Community look ${i + 1}`}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-[#0a0a0a]/0 group-hover:bg-[#0a0a0a]/30 transition-all duration-400 flex items-end p-3">
                <span className="se-label text-[9px] tracking-[0.3em] text-white/0 group-hover:text-white/70 transition-all duration-300">
                  SAGA ELITE
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ──────────────────────────────────────────────────────────────────────────
   TESTIMONIALS — auto-rotating glassmorphism review cards.
   ────────────────────────────────────────────────────────────────────────── */
const TESTIMONIALS = [
  {
    name: "Nadeesha P.",
    handle: "@nadeesha.p",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
    rating: 5,
    text: "The mystery gift in my last drop was a hand-numbered patch I've never seen anywhere else. This brand actually feels rare.",
    verified: true,
  },
  {
    name: "Tharindu K.",
    handle: "@tharik.fits",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
    rating: 5,
    text: "Cop. Wear. Get DMs about it. The fits sit different — and the drop hype is real.",
    verified: true,
  },
  {
    name: "Sashini R.",
    handle: "@sash.r",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
    rating: 5,
    text: "Premium feel without the import shipping headache. Got my piece in two days, in Galle. Boxed like a gift.",
    verified: true,
  },
];

export const Testimonials = () => {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % TESTIMONIALS.length), 6000);
    return () => clearInterval(t);
  }, []);
  const t = TESTIMONIALS[i];

  return (
    <section className="relative bg-[#0a0a0a] py-16 md:py-24 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#f2ca50]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-[900px] mx-auto px-6 relative z-10">
        <div className="text-center mb-12">
          <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-[#f2ca50] mb-3">
            Verified Pieces
          </p>
          <h2 className="font-display text-[36px] md:text-[52px] leading-none text-[#FAF7F2] uppercase">
            What members say
          </h2>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={t.handle}
            initial={{ opacity: 0, y: 30, rotateX: -4 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative bg-[#131313]/70 backdrop-blur-md border border-[#4d4635]/60 p-8 md:p-12"
            style={{ perspective: "1000px" }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#f2ca50]/5 via-transparent to-[#a855f7]/5 pointer-events-none" />
            <Quote className="absolute top-6 right-6 w-8 h-8 text-[#f2ca50]/30" strokeWidth={1} />

            <div className="relative">
              <div className="flex gap-1 mb-5">
                {Array.from({ length: t.rating }).map((_, k) => (
                  <Star
                    key={k}
                    className="w-4 h-4 text-[#f2ca50]"
                    fill="#f2ca50"
                  />
                ))}
              </div>
              <p className="font-display text-xl md:text-2xl text-[#FAF7F2] leading-snug mb-8">
                "{t.text}"
              </p>
              <div className="flex items-center gap-4">
                <img
                  src={t.avatar}
                  alt={t.name}
                  loading="lazy"
                  className="w-12 h-12 rounded-full object-cover border border-[#4d4635]"
                />
                <div>
                  <p className="font-sans text-sm text-[#FAF7F2] font-medium flex items-center gap-2">
                    {t.name}
                    {t.verified && (
                      <CheckCircle2
                        className="w-4 h-4 text-[#f2ca50]"
                        fill="#f2ca50"
                        stroke="#0a0a0a"
                        strokeWidth={2.5}
                      />
                    )}
                  </p>
                  <p className="font-mono text-[10px] tracking-[0.2em] text-[#99907c] uppercase mt-0.5">
                    {t.handle}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-center gap-2 mt-8">
          {TESTIMONIALS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              className={`h-0.5 transition-all duration-500 ${
                i === idx ? "w-10 bg-[#f2ca50]" : "w-6 bg-[#4d4635] hover:bg-[#99907c]"
              }`}
              aria-label={`Show testimonial ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

/* ──────────────────────────────────────────────────────────────────────────
   VIP MEMBERSHIP — full-bleed gradient CTA.
   ────────────────────────────────────────────────────────────────────────── */
export const VipMembership = () => (
  <section className="relative bg-[#050505] py-20 md:py-28 overflow-hidden border-y border-[#1a1a1a]">
    {/* Layered glow */}
    <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[600px] h-[600px] bg-[#f2ca50]/8 blur-[140px] rounded-full pointer-events-none" />
    <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[600px] h-[600px] bg-[#a855f7]/10 blur-[140px] rounded-full pointer-events-none" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(242,202,80,0.06),transparent_60%)] pointer-events-none" />

    <div className="relative z-10 max-w-[900px] mx-auto px-6 text-center">
      <div className="inline-flex items-center gap-2 border border-[#f2ca50]/40 bg-[#f2ca50]/5 px-4 py-2 mb-6">
        <Crown className="w-3.5 h-3.5 text-[#f2ca50]" />
        <span className="font-mono text-[10px] tracking-[0.32em] uppercase text-[#f2ca50]">
          Members Only
        </span>
      </div>
      <h2 className="font-display text-[44px] md:text-[80px] leading-none text-[#FAF7F2] uppercase mb-6">
        Become <span className="text-[#f2ca50]">Elite</span>
      </h2>
      <p className="font-sans text-base md:text-lg text-[#d0c5af] max-w-xl mx-auto mb-10 leading-relaxed">
        Get early drop access, members-only mystery rewards, and a private channel
        where the next chapter previews 48 hours before anyone else.
      </p>

      <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mb-10 max-w-2xl mx-auto">
        {[
          ["Early drop access", Zap],
          ["Members-only rewards", Gift],
          ["Closed community channel", Award],
          ["Founders-list status", Crown],
        ].map(([label, IconComponent]) => (
          <div key={label} className="flex items-center gap-2 text-[#d0c5af]">
            {React.createElement(IconComponent, {
              className: "w-4 h-4 text-[#f2ca50]",
              strokeWidth: 1.5,
            })}
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase">
              {label}
            </span>
          </div>
        ))}
      </div>

      <Link
        to="/auth/register"
        className="inline-flex items-center gap-3 bg-[#f2ca50] hover:bg-[#ffe088] text-[#0a0a0a] px-10 py-5 font-mono text-[11px] tracking-[0.3em] uppercase font-bold transition-colors group"
        style={{ boxShadow: "0 0 32px rgba(242,202,80,0.25)" }}
      >
        Claim Elite Access
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  </section>
);
