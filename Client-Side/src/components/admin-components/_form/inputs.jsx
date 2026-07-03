import React from "react";

/**
 * Luxury input primitives.
 *  - Background #111
 *  - Border #2a2a2a
 *  - Text #fff, placeholder #666
 *  - Gold focus ring (#D4AF37) with subtle glow
 *  - Disabled / error variants
 *
 * Always renders a plain `<input>` / `<textarea>` / `<select>` — composable
 * with `<FormField>` for label + helper + error.
 */

const baseInput =
  "w-full bg-panel text-ink placeholder:text-ink/30 " +
  "border border-elevated rounded-xl px-4 py-3 text-sm " +
  "transition-colors duration-200 outline-none " +
  "focus:border-gold-ink2 focus:shadow-[0_0_0_3px_rgba(212,175,55,0.15)] " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

const errorInput =
  "border-rose-500/50 focus:border-rose-500 focus:shadow-[0_0_0_3px_rgba(244,63,94,0.15)]";

export const LuxuryInput = React.forwardRef(function LuxuryInput(
  { className = "", error, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={`${baseInput} ${error ? errorInput : ""} ${className}`.trim()}
      {...props}
    />
  );
});

export const LuxuryTextarea = React.forwardRef(function LuxuryTextarea(
  { className = "", error, rows = 4, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={`${baseInput} ${error ? errorInput : ""} resize-y min-h-[96px] ${className}`.trim()}
      {...props}
    />
  );
});

export const LuxurySelect = React.forwardRef(function LuxurySelect(
  { className = "", error, children, ...props },
  ref
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={`${baseInput} appearance-none cursor-pointer pr-10 ${error ? errorInput : ""} ${className}`.trim()}
        {...props}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-ink/40">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M2 4l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
});

/** Color-scheme: dark applies the dark calendar popup in Chrome/Edge. */
export const LuxuryDateInput = React.forwardRef(function LuxuryDateInput(
  { className = "", error, type = "date", ...props },
  ref
) {
  return (
    <input
      ref={ref}
      type={type}
      className={`${baseInput} ${error ? errorInput : ""} [color-scheme:dark] ${className}`.trim()}
      {...props}
    />
  );
});
