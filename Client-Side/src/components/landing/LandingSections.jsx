import React, { useEffect, useMemo, useRef, useState } from "react";
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
} from "lucide-react";
import { formatLkr } from "@/utils/currency";
import { getRemainingTime } from "@/utils/time";
import ProductCard from "@/components/shopping-components/ProductCard";

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
};

// 🎬 HERO SECTION (MAIN IMPACT ZONE)
export const HeroCarousel = ({ slides = [], activeDrop = null, nextDrop = null }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const navigate = useNavigate();

  const dropIsLive = activeDrop && new Date(activeDrop.releaseDate) <= new Date() && new Date(activeDrop.endDate) >= new Date();
  const dropIsUpcoming = nextDrop && new Date(nextDrop.releaseDate) > new Date();

  // Gesture handling for mobile
  const touchStartX = useRef(null);
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 50) {
      if (delta > 0) setActiveIndex(prev => (prev + 1) % slides.length);
      else setActiveIndex(prev => (prev - 1 + slides.length) % slides.length);
    }
    touchStartX.current = null;
  };

  useEffect(() => {
    if (dropIsLive || dropIsUpcoming) return; // No auto-rotate when drop takes over
    if (paused || slides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length, paused, dropIsLive, dropIsUpcoming]);

  // STATE A: Live drop
  if (dropIsLive) {
    const heroImage = activeDrop.coverImageUrl || slides[0]?.imageUrl || '';
    return (
      <section className="relative h-[60vh] md:h-[85vh] max-h-[720px] overflow-hidden bg-[#0a0a0a]">
        <img src={heroImage} alt={activeDrop.name}
             className="w-full h-full object-cover"
             loading="eager"
             srcSet={`${heroImage}?w=640 640w, ${heroImage}?w=1280 1280w, ${heroImage}?w=1920 1920w`}
             sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-6 md:px-16 pb-16">
          <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#f2ca50] mb-3">
            🔴 LIVE DROP
          </p>
          <h1 className="font-display text-[42px] md:text-[80px] leading-none text-[#FAF7F2] mb-4">
            {activeDrop.name}
          </h1>
          <p className="font-sans text-base text-[#FAF7F2]/80 max-w-lg mb-6">
            {activeDrop.description}
          </p>
          <InlineDropCountdown endDate={activeDrop.endDate} />
          <div className="flex flex-wrap gap-4 mt-6">
            <Link to={`/shopping/drop/${activeDrop.slug}`}
                  className="bg-[#f2ca50] text-[#0a0a0a] px-8 py-4 font-sans text-[11px] tracking-[0.28em] uppercase hover:bg-[#ffe088] transition-colors font-bold">
              SHOP THE DROP
            </Link>
            <Link to="/shopping/product-list?category=drops"
                  className="border border-[#FAF7F2]/40 text-[#FAF7F2] px-8 py-4 font-sans text-[11px] tracking-[0.28em] uppercase hover:border-[#f2ca50] hover:text-[#f2ca50] transition-colors font-bold">
              VIEW ALL PIECES
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // STATE B: Upcoming drop
  if (dropIsUpcoming) {
    return (
      <section className="relative h-[60vh] md:h-[85vh] max-h-[720px] overflow-hidden bg-[#0a0a0a]">
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
        <div className="absolute inset-0 bg-[#0a0a0a]/70" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#f2ca50] mb-4">
            ⚡ COMING SOON
          </p>
          <h1 className="font-display text-[42px] md:text-[80px] leading-none text-[#FAF7F2] mb-4 uppercase">
            {nextDrop.name}
          </h1>
          <p className="font-sans text-base text-[#FAF7F2]/70 max-w-md mb-6">
            {nextDrop.description || 'Something rare is being prepared. Stay ready.'}
          </p>
          <p className="font-sans text-sm text-[#d0c5af] mb-8 uppercase tracking-widest">
            DROPS {new Date(nextDrop.releaseDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <a href={`https://wa.me/+94770704274?text=Notify me when ${nextDrop.name} drops`}
             target="_blank" rel="noopener noreferrer"
             className="flex items-center gap-2 bg-[#25D366] text-white px-8 py-4 font-sans text-[11px] tracking-[0.28em] uppercase hover:bg-[#20bd5a] transition-colors font-bold">
            <MessageCircle className="w-4 h-4" /> NOTIFY ME ON WHATSAPP
          </a>
        </div>
      </section>
    );
  }

  // STATE C: Standard catalogue
  return (
    <section 
      className="relative h-[60vh] md:h-[85vh] max-h-[720px] w-full overflow-hidden bg-[#050505]"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <AnimatePresence initial={false} custom={activeIndex}>
        {slides.map((slide, index) => {
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
              {slide.imageUrl ? (
                <img src={slide.imageUrl} alt={slide.headline} 
                     className="w-full h-full object-cover"
                     loading="eager"
                     srcSet={`${slide.imageUrl}?w=640 640w, ${slide.imageUrl}?w=1280 1280w, ${slide.imageUrl}?w=1920 1920w`}
                     sizes="100vw" />
              ) : (
                <div className="w-full h-full" style={{ background: slide.fallback }} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/30 to-transparent" />
              
              <div className={`${sectionContainer} h-full relative z-10 flex flex-col justify-center md:items-start text-center md:text-left`}>
                <motion.p
                  initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.8 }}
                  className="font-sans text-[10px] tracking-[0.4em] uppercase text-[#f2ca50] mb-4"
                >
                  {slide.label || "Exclusive"}
                </motion.p>
                <motion.h2
                  initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5, duration: 0.8 }}
                  className="font-display text-[42px] md:text-[80px] leading-[0.9] text-[#FAF7F2] uppercase tracking-tighter"
                >
                  {slide.headline.split('\\n').map((line, i) => (
                    <React.Fragment key={i}>{line}<br /></React.Fragment>
                  ))}
                </motion.h2>
                <motion.p
                  initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7, duration: 0.8 }}
                  className="font-sans text-base text-[#FAF7F2]/80 mt-6 max-w-lg leading-relaxed"
                >
                  {slide.subheadline}
                </motion.p>
                
                <motion.div
                  initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.9, duration: 0.8 }}
                  className="mt-10 flex flex-wrap justify-center md:justify-start gap-4"
                >
                  <button
                    onClick={() => navigate(slide.ctaLink)}
                    className="relative overflow-hidden group bg-[#f2ca50] text-[#0a0a0a] px-8 py-4 font-sans text-[11px] uppercase tracking-[0.28em] font-bold"
                  >
                    <span className="relative z-10">{slide.ctaText || "Explore Drop"}</span>
                    <div className="absolute inset-0 bg-[#ffe088] scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-500 ease-[0.19,1,0.22,1]" />
                  </button>
                </motion.div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Modern Dots - lines instead of circles */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        {slides.map((_, index) => (
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
          {[['Days', timeLeft.d], ['Hours', timeLeft.h], ['Mins', timeLeft.m], ['Secs', timeLeft.s]].map(([label, value]) => (
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
    <section className={`${sectionContainer} py-20`}>
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
    <section className="bg-[#0a0a0a] border-y border-[#1f1f1f] py-24 relative overflow-hidden">
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
    <section className={`${sectionContainer} py-16`}>
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
      
      <div ref={scrollerRef} className="flex gap-6 overflow-x-auto snap-x scroll-smooth pb-8 hide-scrollbar">
        {products.map((product) => (
           <div key={product.id} className="snap-start shrink-0">
             <ProductCard product={product} badge={deal ? "deal" : "new"} />
           </div>
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
