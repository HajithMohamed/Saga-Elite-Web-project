import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ShieldCheck, Truck, Star } from "lucide-react";
import { Link } from "react-router-dom";

export const LuxuryDropSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: "hero-1",
      image: "https://images.unsplash.com/photo-1618085222100-85f0e9df2528?q=80&w=2000&auto=format&fit=crop"
    },
    {
      id: "hero-2",
      image: "https://images.unsplash.com/photo-1550639525-c97d455acf70?q=80&w=2000&auto=format&fit=crop"
    },
    {
      id: "hero-3",
      image: "https://images.unsplash.com/photo-1509319117193-57bab727e09d?q=80&w=2000&auto=format&fit=crop"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="relative w-full overflow-hidden bg-primary h-[500px] md:h-[560px] lg:h-[620px] xl:h-[680px] 2xl:h-[720px] group">
      
      {/* Background Slider */}
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, scale: 1.05 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 0.7, ease: "easeInOut" }, scale: { duration: 6, ease: "linear" } }}
            className="absolute inset-0 w-full h-full"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(e, { offset }) => {
              if (offset.x < -50) setCurrentSlide((p) => (p + 1) % slides.length);
              if (offset.x > 50) setCurrentSlide((p) => (p - 1 + slides.length) % slides.length);
            }}
          >
            <img 
              src={slides[currentSlide].image} 
              alt="Luxury Fashion"
              className="w-full h-full object-cover object-center"
            />
            {/* Dark overlay gradient to ensure text readability */}
            <div 
              className="absolute inset-0"
              style={{
                background: "linear-gradient(90deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.15) 100%)"
              }}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Hero Content Container */}
      <div className="relative h-full max-w-[1280px] mx-auto flex flex-col justify-center px-[24px] md:px-[48px] lg:px-[80px]">
        <div className="w-full md:w-[480px] lg:w-[560px] ml-0 lg:ml-[10%]">
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-display text-[40px] md:text-[56px] lg:text-[64px] text-white font-bold leading-[1.1] mb-4"
          >
            Luxury Fashion for Men, Women & Unisex
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="font-sans text-[16px] md:text-[18px] text-[#e0e0e0] leading-relaxed mb-[32px]"
          >
            Discover premium clothing, footwear and accessories curated for modern lifestyles.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 mb-[48px]"
          >
            <Link 
              to="/shopping/product-list"
              className="flex items-center justify-center bg-accent text-primary h-[56px] min-w-[180px] px-8 font-sans text-[16px] font-bold rounded-[16px] hover:-translate-y-[2px] transition-transform duration-250 shadow-medium"
            >
              Shop Now
            </Link>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
            >
              <Link 
                to="#categories"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex items-center justify-center bg-transparent border border-accent text-accent h-[52px] min-w-[180px] px-8 font-sans text-[16px] font-bold rounded-[16px] hover:-translate-y-[2px] transition-transform duration-250"
              >
                Browse Categories
              </Link>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="flex items-center gap-6"
          >
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-accent" />
              <span className="font-sans text-[12px] text-[#b5b5b5] font-bold uppercase tracking-wider">Islandwide Delivery</span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-accent" />
              <span className="font-sans text-[12px] text-[#b5b5b5] font-bold uppercase tracking-wider">Secure Checkout</span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <Star className="w-5 h-5 text-accent" />
              <span className="font-sans text-[12px] text-[#b5b5b5] font-bold uppercase tracking-wider">Premium Quality</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Navigation Arrows (Desktop / Tablet only) */}
      <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 left-4 lg:left-8 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button 
          onClick={() => setCurrentSlide((p) => (p - 1 + slides.length) % slides.length)}
          className="w-[40px] h-[40px] lg:w-[48px] lg:h-[48px] rounded-full bg-black/40 border border-accent flex items-center justify-center text-accent hover:bg-black/60 transition-colors backdrop-blur-sm"
        >
          <ChevronRight className="w-6 h-6 rotate-180" />
        </button>
      </div>
      <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 right-4 lg:right-8 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button 
          onClick={() => setCurrentSlide((p) => (p + 1) % slides.length)}
          className="w-[40px] h-[40px] lg:w-[48px] lg:h-[48px] rounded-full bg-black/40 border border-accent flex items-center justify-center text-accent hover:bg-black/60 transition-colors backdrop-blur-sm"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Carousel Indicators */}
      <div className="absolute bottom-[16px] left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className="group relative flex items-center justify-center h-[20px]"
          >
            <div 
              className={`rounded-full transition-all duration-300 ${currentSlide === idx ? 'w-[12px] h-[12px] bg-accent' : 'w-[10px] h-[10px] bg-gray-500'}`} 
            />
          </button>
        ))}
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        animate={{ y: [0, 8, 0] }} 
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="absolute bottom-[32px] right-[50px] lg:right-[80px] z-20 hidden md:block opacity-70"
      >
        <div className="w-[24px] h-[40px] border-2 border-white/50 rounded-full flex justify-center pt-2">
          <div className="w-[4px] h-[8px] bg-white rounded-full" />
        </div>
      </motion.div>
    </section>
  );
};
