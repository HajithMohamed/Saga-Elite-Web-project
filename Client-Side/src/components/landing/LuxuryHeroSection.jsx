import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Clock, Users } from "lucide-react";
import { Link } from "react-router-dom";

export const GlobalStatusBar = () => {
  return (
    <div className="sticky top-0 z-50 w-full bg-[#050505]/80 backdrop-blur-md border-b border-[#1f1f1f]">
      <div className="w-full overflow-hidden whitespace-nowrap py-2 px-4 flex items-center justify-center">
        <div className="flex items-center gap-4 text-xs font-mono tracking-widest text-[#d0c5af] uppercase animate-marquee md:animate-none">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            142 Users Online
          </span>
          <span className="hidden md:inline text-[#f2ca50]">•</span>
          <span>Next Drop in 48:00:00</span>
          <span className="hidden md:inline text-[#f2ca50]">•</span>
          <span className="hidden md:inline">Global Delivery Available</span>
        </div>
      </div>
    </div>
  );
};

export const LuxuryDropSlider = ({ activeDrops = [], nextDrop = null }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: "hook",
      title: "The Art of the Drop.",
      subtitle: "Exclusive, limited-run pieces. Once they are gone, they are archived forever.",
      image: "https://images.unsplash.com/photo-1618085222100-85f0e9df2528?q=80&w=2000&auto=format&fit=crop",
      type: "editorial"
    },
    ...(activeDrops.length > 0 ? [{
      id: "live",
      title: activeDrops[0].name,
      subtitle: activeDrops[0].description,
      image: activeDrops[0].images?.[0]?.url || activeDrops[0].coverImageUrl || "https://images.unsplash.com/photo-1550639525-c97d455acf70?q=80&w=2000&auto=format&fit=crop",
      endDate: activeDrops[0].endDate,
      slug: activeDrops[0].slug,
      type: "live"
    }] : []),
    ...(nextDrop ? [{
      id: "teaser",
      title: "Classified Intel",
      subtitle: "The next chapter is forming. Prepare for deployment.",
      image: nextDrop.images?.[0]?.url || nextDrop.coverImageUrl || "https://images.unsplash.com/photo-1509319117193-57bab727e09d?q=80&w=2000&auto=format&fit=crop",
      type: "teaser"
    }] : [])
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const slide = slides[currentSlide];

  return (
    <section className="relative w-full h-[75vh] md:h-[90vh] bg-[#050505] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.19, 1, 0.22, 1] }}
          className="absolute inset-0 w-full h-full"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(e, { offset }) => {
            if (offset.x < -50) setCurrentSlide((p) => (p + 1) % slides.length);
            if (offset.x > 50) setCurrentSlide((p) => (p - 1 + slides.length) % slides.length);
          }}
        >
          {/* Background Image */}
          <div className="absolute inset-0">
            <img 
              src={slide.image} 
              alt={slide.title} 
              className={`w-full h-full object-cover ${slide.type === 'teaser' ? 'blur-md brightness-50' : 'opacity-80'}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-0 bg-grain mix-blend-overlay opacity-30 pointer-events-none" />
          </div>

          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-16 lg:p-24 pb-24 md:pb-32">
            <div className="max-w-3xl">
              {slide.type === 'live' && (
                <span className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.3em] uppercase text-[#f2ca50] mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                  Live Drop
                </span>
              )}
              {slide.type === 'teaser' && (
                <span className="inline-block font-mono text-[10px] tracking-[0.3em] uppercase text-[#8c8577] mb-6 border border-[#8c8577]/30 px-3 py-1">
                  Classified
                </span>
              )}

              <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="font-display text-5xl md:text-7xl lg:text-8xl text-[#FAF7F2] uppercase tracking-tighter leading-[0.9] mb-6 drop-shadow-2xl"
              >
                {slide.title}
              </motion.h1>

              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="font-sans text-sm md:text-lg text-[#d0c5af] leading-relaxed max-w-xl mb-10"
              >
                {slide.subtitle}
              </motion.p>

              {slide.type === 'live' && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.8 }}
                >
                  <Link 
                    to={`/shopping/drop/${slide.slug}`}
                    className="inline-flex items-center gap-4 bg-[#f2ca50] text-[#050505] px-8 py-4 font-mono text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#FAF7F2] transition-colors"
                  >
                    Acquire Now <ChevronRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Progress Indicators (Bottom Right) */}
      <div className="absolute bottom-8 right-8 md:bottom-12 md:right-16 flex gap-3 z-20">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className="relative h-1 w-12 md:w-16 bg-[#FAF7F2]/20 overflow-hidden"
          >
            {currentSlide === idx && (
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 6, ease: "linear" }}
                className="absolute top-0 left-0 h-full bg-[#f2ca50]"
              />
            )}
          </button>
        ))}
      </div>
    </section>
  );
};
