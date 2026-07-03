import React from "react";

/**
 * Right-rail panel — minimal card for the sticky 30% sidebar.
 *
 *   ┌─────────────────────────┐
 *   │ TITLE         (action)  │
 *   │ description             │
 *   ├─────────────────────────┤
 *   │  children               │
 *   └─────────────────────────┘
 */
export function RightRailPanel({
  title,
  description,
  action,
  children,
  className = "",
  tone = "default", // "default" | "accent"
}) {
  const accent =
    tone === "accent"
      ? "border-gold-ink2/30 bg-gradient-to-br from-gold-deep/[0.08] to-transparent"
      : "border-ink/[0.06] bg-panel";

  return (
    <section className={`rounded-2xl border ${accent} p-5 ${className}`.trim()}>
      {(title || action) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title ? (
              <h3 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-ink/80">
                {title}
              </h3>
            ) : null}
            {description ? (
              <p className="mt-1 text-[11px] leading-relaxed text-ink/40">
                {description}
              </p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      )}
      <div className="space-y-3">{children}</div>
    </section>
  );
}

/**
 * Switch row used inside RightRailPanel — label + helper + toggle on the right.
 */
export function RailToggleRow({ label, helper, checked, onChange, disabled }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-ink/[0.06] bg-black/30 px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-ink truncate">{label}</p>
        {helper ? (
          <p className="mt-0.5 text-[11px] leading-relaxed text-ink/40">
            {helper}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => !disabled && onChange?.(!checked)}
        disabled={disabled}
        aria-pressed={checked}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${
          checked ? "bg-gold-deep" : "bg-ink/[0.1]"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export default RightRailPanel;
