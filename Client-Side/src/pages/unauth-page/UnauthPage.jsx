import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldOff } from "lucide-react";
import { Btn, Eyebrow, Wordmark } from "@/components/ui/editorial";

const UnauthPage = () => {
  return (
    <div className="min-h-screen bg-page flex flex-col items-center justify-center px-6 text-center">
      <div className="relative flex items-center justify-center mb-8">
        <div
          className="absolute w-32 h-32 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(255,180,171,0.12) 0%, transparent 70%)",
          }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-16 h-16 rounded-full bg-card border border-danger-ink/30 flex items-center justify-center"
        >
          <ShieldOff size={24} strokeWidth={1.5} className="text-danger-ink" />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <Eyebrow tone="muted" size="xs">Access restricted</Eyebrow>
        <h1 className="mt-4 se-serif text-ink-2 text-4xl md:text-5xl leading-[1.0]">
          Not<br />authorised.
        </h1>
        <p className="mt-4 se-body text-sm text-cream max-w-xs mx-auto leading-relaxed">
          You don't have permission to access this section.
          If you believe this is an error, contact your administrator.
        </p>
      </motion.div>

      <div className="w-16 h-px bg-line my-8" />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="flex flex-col sm:flex-row items-center gap-3"
      >
        <Link to="/shopping/home">
          <Btn variant="default" size="lg">Back to shop</Btn>
        </Link>
        <Link to="/auth/login">
          <Btn variant="outline" size="lg">Sign in</Btn>
        </Link>
      </motion.div>

      <div className="mt-16 opacity-30">
        <Wordmark size="sm" />
      </div>
    </div>
  );
};

export default UnauthPage;
