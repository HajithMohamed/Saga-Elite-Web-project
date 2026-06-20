import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const AuthLayout = ({ children, isImageRight = false }) => {
  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] text-white flex flex-col md:flex-row overflow-hidden font-sans">
      {/* Mobile Background Overlay */}
      <div className="md:hidden fixed inset-0 z-0 select-none pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90 z-10" />
        <img
          src="https://images.unsplash.com/photo-1542272604-787c38520267?q=80&w=1500&auto=format&fit=crop"
          alt="Streetwear BG"
          className="w-full h-full object-cover object-center opacity-40 blur-sm"
        />
      </div>

      {/* Left / Right Cinematic Visual Pane (desktop) */}
      <div
        className={`hidden md:flex flex-1 relative ${
          isImageRight ? "order-last" : "order-first"
        } items-center justify-center overflow-hidden`}
      >
        <div className="absolute inset-0 z-10 bg-gradient-to-tr from-black/90 via-black/40 to-transparent" />
        <img
          src={
            isImageRight
              ? "https://images.unsplash.com/photo-1550614000-4b95d85820bb?q=80&w=2000&auto=format&fit=crop"
              : "https://images.unsplash.com/photo-1542272604-787c38520267?q=80&w=2000&auto=format&fit=crop"
          }
          className="absolute inset-0 w-full h-full object-cover object-center"
          alt="Premium Fashion"
        />
        
        {/* Animated Brand Content */}
        <motion.div 
          className="relative z-20 text-center px-12"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
        >
          <h2 className="text-5xl lg:text-7xl font-bold tracking-tighter mb-4 font-['Bebas_Neue',_sans-serif] uppercase drop-shadow-2xl">
            Rare Fit Forever
          </h2>
          <p className="text-gray-300 text-lg lg:text-xl font-light tracking-wide max-w-md mx-auto drop-shadow-md">
            Exclusive Streetwear. Built For The Bold. Join the club.
          </p>
        </motion.div>
      </div>

      {/* Right / Left Auth Form Pane */}
      <div className="flex-1 flex flex-col justify-center relative z-10 p-6 md:p-12 lg:p-24 min-h-screen">
        <Link to="/" className="absolute top-8 left-8 z-20 group">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-2xl font-bold font-['Bebas_Neue',_sans-serif] tracking-widest flex items-center gap-2"
          >
            SAGA ELITE
            <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
          </motion.div>
        </Link>
        
        <div className="w-full max-w-md mx-auto backdrop-blur-xl md:backdrop-blur-none bg-black/40 md:bg-transparent p-8 md:p-0 rounded-3xl md:rounded-none border md:border-none border-white/10 shadow-2xl md:shadow-none">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
