import React, { useEffect, useRef } from "react";

export default function OtpCells({
  length = 4,
  value = "",
  onChange,
  autoFocus = true,
  disabled = false,
  ariaLabel = "One-time passcode",
}) {
  const refs = useRef([]);

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

  return (
    <div
      className="flex items-center justify-center gap-2 sm:gap-3"
      role="group"
      aria-label={ariaLabel}
    >
      {digits.map((d, i) => (
        <input
          key={i}
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
          aria-label={`Digit ${i + 1}`}
          className="h-14 w-12 sm:h-16 sm:w-14 text-center se-mono text-2xl sm:text-3xl text-[#e5e2e1] bg-[#1c1b1b] border border-[#4d4635] focus:border-[#f2ca50] focus:outline-none focus:ring-2 focus:ring-[#f2ca50]/40 transition-all caret-[#f2ca50] placeholder:text-[#574500]"
          placeholder="·"
        />
      ))}
    </div>
  );
}
