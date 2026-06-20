import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export default function OtpCells({
  length = 4,
  value = "",
  onChange,
  autoFocus = true,
  disabled = false,
  ariaLabel = "One-time passcode",
  success = false,
}) {
  const refs = useRef([]);
  const [focusedIdx, setFocusedIdx] = useState(null);

  useEffect(() => {
    if (autoFocus && !disabled) refs.current[0]?.focus();
  }, [autoFocus, disabled]);

  const digits = Array.from({ length }, (_, i) => value[i] || "");

  const setDigit = (idx, ch) => {
    const arr = digits.slice();
    arr[idx] = ch;
    onChange?.(arr.join("").slice(0, length));
  };

  const handleChange = (e, idx) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) {
      setDigit(idx, "");
      return;
    }
    if (raw.length === 1) {
      setDigit(idx, raw);
      if (idx < length - 1) refs.current[idx + 1]?.focus();
    } else {
      const next = raw.slice(0, length - idx);
      const arr = digits.slice();
      next.split("").forEach((c, k) => {
        arr[idx + k] = c;
      });
      onChange?.(arr.join("").slice(0, length));
      const focusIdx = Math.min(idx + next.length, length - 1);
      refs.current[focusIdx]?.focus();
    }
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === "Backspace") {
      if (digits[idx]) {
        setDigit(idx, "");
      } else if (idx > 0) {
        refs.current[idx - 1]?.focus();
        const arr = digits.slice();
        arr[idx - 1] = "";
        onChange?.(arr.join("").slice(0, length));
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      refs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < length - 1) {
      refs.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const text = (e.clipboardData?.getData("text") || "").replace(/\D/g, "");
    if (!text) return;
    e.preventDefault();
    onChange?.(text.slice(0, length));
    const focusIdx = Math.min(text.length, length - 1);
    refs.current[focusIdx]?.focus();
  };

  const cellClass = success
    ? "h-14 w-12 sm:h-16 sm:w-14 text-center se-mono text-2xl sm:text-3xl text-[#a8d8b6] bg-[#1c1b1b] border border-[#a8d8b6] focus:outline-none ring-2 ring-[#a8d8b6]/40 transition-all caret-[#a8d8b6] placeholder:text-[#574500]"
    : "h-14 w-12 sm:h-16 sm:w-14 text-center se-mono text-2xl sm:text-3xl text-[#e5e2e1] bg-[#1c1b1b] border border-[#4d4635] focus:border-[#f2ca50] focus:outline-none focus:ring-2 focus:ring-[#f2ca50]/40 transition-all caret-[#f2ca50] placeholder:text-[#574500]";

  return (
    <div
      className="flex items-center justify-center gap-2 sm:gap-3"
      role="group"
      aria-label={ariaLabel}
    >
      {digits.map((d, i) => (
        <motion.div
          key={i}
          className="relative"
          initial={success ? { scale: 0.9 } : false}
          animate={success ? { scale: 1 } : {}}
          transition={success ? { delay: i * 0.06, duration: 0.3 } : {}}
        >
          {focusedIdx === i && !success && (
            <span
              className="absolute inset-0 bg-[#f2ca50]/15 blur-md pointer-events-none"
              aria-hidden="true"
            />
          )}
          <input
            ref={(el) => (refs.current[i] = el)}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={length}
            value={d}
            disabled={disabled}
            onChange={(e) => handleChange(e, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            onPaste={handlePaste}
            onFocus={() => setFocusedIdx(i)}
            onBlur={() => setFocusedIdx(null)}
            aria-label={`Digit ${i + 1}`}
            className={`relative ${cellClass}`}
            placeholder="·"
          />
        </motion.div>
      ))}
    </div>
  );
}
