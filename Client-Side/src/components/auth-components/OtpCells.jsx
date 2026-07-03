import React, { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const OtpCells = ({ length = 6, value, onChange, disabled, success = false, error = false }) => {
  const inputs = useRef([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Focus first empty on mount
  useEffect(() => {
    if (!disabled && value.length < length && inputs.current[value.length]) {
      inputs.current[value.length].focus();
    }
  }, [disabled, length]); // Removed value from deps to avoid stealing focus on every stroke

  const focusNext = (index) => {
    if (index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const focusPrev = (index) => {
    if (index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleChange = (e, index) => {
    const val = e.target.value.replace(/\D/g, "");
    if (!val) return;

    const char = val[val.length - 1]; // take last char if they typed fast
    const newVal = value.substring(0, index) + char + value.substring(index + 1);
    onChange(newVal.slice(0, length));
    focusNext(index);
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (value[index]) {
        // Delete current
        onChange(value.substring(0, index) + value.substring(index + 1));
      } else {
        // Delete previous and move back
        onChange(value.substring(0, index - 1) + value.substring(index));
        focusPrev(index);
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusPrev(index);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focusNext(index);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;

    onChange(pasted);
    
    // Focus appropriate cell
    const nextEmptyIndex = Math.min(pasted.length, length - 1);
    inputs.current[nextEmptyIndex]?.focus();
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3 md:gap-4 justify-center" onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => {
        const char = value[i] || "";
        const isActive = focusedIndex === i;
        
        return (
          <motion.div
            key={i}
            animate={{
              scale: isActive ? 1.05 : 1,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <input
              ref={(el) => (inputs.current[i] = el)}
              type="text"
              inputMode="numeric"
              pattern="\d*"
              maxLength={2} // allow 2 to catch fast typing before replacing
              value={char}
              onChange={(e) => handleChange(e, i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              onFocus={() => setFocusedIndex(i)}
              onBlur={() => setFocusedIndex(-1)}
              disabled={disabled}
              className={cn(
                "w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-center text-xl md:text-2xl font-mono rounded-[16px]",
                "border border-ink/10 bg-page text-ink-2 transition-colors duration-200",
                "focus:outline-none focus:border-gold-ink focus:ring-1 focus:ring-gold-ink/30 focus:shadow-[0_0_15px_rgba(242,202,80,0.15)]",
                success && "border-success/50 text-success bg-success/5",
                error && "border-rose-500/50 text-rose-400 bg-rose-500/5",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              aria-label={`Digit ${i + 1}`}
            />
          </motion.div>
        );
      })}
    </div>
  );
};

export default OtpCells;
