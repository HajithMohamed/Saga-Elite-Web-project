import React from "react";

/**
 * Field wrapper: label with required/optional + helper text + error message.
 *
 *   DROP NAME *
 *   Visible to customers. Keep under 40 characters.
 *   ┌──────────────────────────────┐
 *   │ input                        │
 *   └──────────────────────────────┘
 *   ❌ Drop name is required
 */
export function FormField({
  label,
  required = false,
  optional = false,
  helper,
  error,
  hint, // appears beside label (e.g. "0 / 200")
  children,
  htmlFor,
  className = "",
}) {
  return (
    <div className={`space-y-2 ${className}`.trim()}>
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={htmlFor}
          className="text-[11px] uppercase tracking-[0.15em] font-semibold text-white/80 flex items-center gap-1.5"
        >
          {label}
          {required ? <span className="text-[#D4AF37]">*</span> : null}
          {optional && !required ? (
            <span className="ml-1 rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-medium normal-case tracking-normal text-white/40">
              optional
            </span>
          ) : null}
        </label>
        {hint ? (
          <span className="text-[10px] tabular-nums text-white/30">{hint}</span>
        ) : null}
      </div>
      {helper ? (
        <p className="text-[11px] leading-relaxed text-white/40">{helper}</p>
      ) : null}
      {children}
      {error ? (
        <p className="flex items-center gap-1.5 text-[11px] text-rose-400">
          <span aria-hidden>•</span>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default FormField;
