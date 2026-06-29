import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export const ExclusiveDropsBanner = ({ nextDrop }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!nextDrop?.releaseDate) return;

    const targetDate = new Date(nextDrop.releaseDate).getTime();
    
    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [nextDrop]);

  if (!nextDrop) {
    // Empty state - replace with Featured Collection per prompt
    return (
      <section className="w-full py-16 px-4 md:px-6 flex justify-center">
        <div className="w-full max-w-[1280px] bg-card rounded-[24px] p-8 md:p-16 flex items-center justify-between shadow-medium border border-border">
          <div>
            <span className="font-sans text-[12px] uppercase tracking-[0.15em] text-accent font-bold mb-2 block">Featured Collection</span>
            <h3 className="font-display text-[32px] md:text-[40px] text-foreground font-bold leading-tight mb-4">The Essentials</h3>
            <p className="font-sans text-[16px] text-secondary-foreground mb-8">Curated pieces that form the foundation of a modern luxury wardrobe.</p>
            <Link to="/shopping/product-list" className="inline-flex items-center justify-center bg-accent text-primary h-[56px] min-w-[180px] px-8 font-sans text-[16px] font-bold rounded-[16px] hover:-translate-y-[2px] transition-transform duration-250">
              Explore Essentials
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full py-[64px] md:py-[96px] px-4 md:px-6 flex justify-center">
      <div className="w-full max-w-[1280px] bg-card rounded-[24px] shadow-large border border-border overflow-hidden flex flex-col md:flex-row relative group">
        
        {/* Subtle Animated Gold Glow Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent opacity-50 group-hover:opacity-80 transition-opacity duration-700 pointer-events-none" />

        {/* Content (Left - 45%) */}
        <div className="w-full md:w-[45%] p-[32px] md:p-[64px] flex flex-col justify-center relative z-10">
          <span className="font-sans text-[12px] uppercase tracking-[0.15em] text-accent font-bold mb-2">Upcoming Drop</span>
          <h3 className="font-display text-[32px] md:text-[48px] text-foreground font-bold leading-[1.1] mb-6">{nextDrop.name}</h3>
          
          <p className="font-sans text-[16px] text-secondary-foreground mb-[32px] max-w-sm">
            {nextDrop.description || "A new classified drop is on the horizon. Quantities are strictly limited."}
          </p>
          
          {/* Countdown Timer */}
          <div className="flex items-center gap-4 md:gap-6 mb-[48px]">
            {Object.entries(timeLeft).map(([unit, value]) => (
              <div key={unit} className="flex flex-col items-center">
                <span 
                  className="font-sans text-[36px] md:text-[48px] lg:text-[64px] text-accent font-bold leading-none tabular-nums drop-shadow-[0_0_12px_rgba(242,202,80,0.3)]"
                  style={{ textShadow: "0 0 20px rgba(242, 202, 80, 0.4)" }}
                >
                  {value.toString().padStart(2, '0')}
                </span>
                <span className="font-sans text-[12px] md:text-[14px] text-foreground uppercase tracking-widest mt-2">{unit}</span>
              </div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <button className="flex items-center justify-center bg-accent text-primary h-[56px] min-w-[180px] px-8 font-sans text-[16px] font-bold rounded-[16px] hover:-translate-y-[2px] transition-transform duration-250 shadow-small">
              Notify Me
            </button>
          </motion.div>
        </div>

        {/* Image (Right - 55%) */}
        <div className="w-full md:w-[55%] h-[300px] md:h-auto min-h-[380px] overflow-hidden order-first md:order-last">
          <img 
            src={nextDrop.images?.[0]?.url || nextDrop.coverImageUrl || "https://images.unsplash.com/photo-1509319117193-57bab727e09d?q=80&w=1200&auto=format&fit=crop"} 
            alt={nextDrop.name} 
            className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-1000 ease-in-out"
          />
        </div>

      </div>
    </section>
  );
};
