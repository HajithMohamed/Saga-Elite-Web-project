import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, MessageCircle, RotateCcw } from "lucide-react";

const NotFound = () => {
  return (
    <section className="relative min-h-screen bg-page flex items-center justify-center overflow-hidden px-4">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/[0.03] rounded-full blur-[120px]" />
        <div className="absolute top-0 left-0 w-full h-full bg-grain opacity-30" />
      </div>

      <div className="relative z-10 max-w-2xl text-center">
        {/* Large 404 */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-[10px] font-sans font-bold uppercase tracking-[0.4em] text-gold-ink mb-6">
            Error 404
          </p>
          <h1 className="se-serif text-[80px] md:text-[120px] lg:text-[160px] text-ink leading-none tracking-tight mb-4 select-none">
            404
          </h1>
          <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mb-8" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="font-sans text-2xl md:text-3xl font-bold text-ink mb-4">
            Page Not Found
          </h2>
          <p className="se-body text-[15px] text-muted max-w-md mx-auto mb-10 leading-relaxed">
            The page you're looking for has been moved, removed, or doesn't exist. 
            Let's get you back on track.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            to="/shopping/home"
            className="se-btn se-btn-primary gap-2 w-full sm:w-auto"
          >
            <Home className="w-4 h-4" /> Return Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="se-btn se-btn-secondary gap-2 w-full sm:w-auto"
          >
            <RotateCcw className="w-4 h-4" /> Go Back
          </button>
          <Link
            to="/contact"
            className="se-btn se-btn-ghost gap-2 w-full sm:w-auto"
          >
            <MessageCircle className="w-4 h-4" /> Contact Support
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default NotFound;
