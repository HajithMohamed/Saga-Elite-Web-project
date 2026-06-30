import React, { useState, useEffect } from "react";
import { ArrowUp, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";

const FloatingActions = () => {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 600) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openSupportChat = () => {
    toast({ title: "Support Chat", description: "Connecting to a style advisor..." });
  };

  return (
    <div className="fixed bottom-24 md:bottom-8 right-4 md:right-8 z-50 flex flex-col gap-4">
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={scrollToTop}
            className="w-12 h-12 bg-[#1A1A1A] border border-white/10 text-[#fafafa] rounded-full flex items-center justify-center shadow-elegant hover:bg-white/5 hover:border-[#F2CA50] hover:text-[#F2CA50] transition-colors"
            aria-label="Back to top"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={openSupportChat}
        className="w-14 h-14 bg-[#F2CA50] text-[#0e0e0e] rounded-full flex items-center justify-center shadow-[0_0_24px_rgba(242,202,80,0.3)] hover:scale-110 transition-transform"
        aria-label="Support Chat"
      >
        <MessageCircle className="w-6 h-6" />
      </motion.button>
    </div>
  );
};

export default FloatingActions;
