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
  maxLength, // with showCount, renders a live "n / max" counter as the hint
  showCount = false,
  value, // current field value — needed for the counter
  children,
  htmlFor,
  className = "",
}) {
  const length = String(value ?? "").length;
  const nearLimit = maxLength ? length >= maxLength * 0.85 : false;
  const counter =
    showCount && maxLength ? (
      <span
        className={`text-[10px] tabular-nums ${
          length > maxLength
            ? "text-rose-400"
            : nearLimit
              ? "text-gold-ink2"
              : "text-ink/30"
        }`}
      >
        {length} / {maxLength}
      </span>
    ) : null;

  return (
    <div className={`space-y-2 ${className}`.trim()}>
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={htmlFor}
          className="text-[11px] uppercase tracking-[0.15em] font-semibold text-ink/80 flex items-center gap-1.5"
        >
          {label}
          {required ? <span className="text-gold-ink2">*</span> : null}
          {optional && !required ? (
            <span className="ml-1 rounded-full bg-ink/[0.06] px-1.5 py-0.5 text-[9px] font-medium normal-case tracking-normal text-ink/40">
              optional
            </span>
          ) : null}
        </label>
        {counter || (hint ? (
          <span className="text-[10px] tabular-nums text-ink/30">{hint}</span>
        ) : null)}
      </div>
      {helper ? (
        <p className="text-[11px] leading-relaxed text-ink/40">{helper}</p>
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
