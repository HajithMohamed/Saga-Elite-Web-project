import React from "react";

/**
 * Tiny completion bar, e.g. "Drop Setup ██████░░░░ 60%".
 *
 * Props:
 *  - label: leading label.
 *  - value: 0-1 (number).
 *  - segments: optional total step count for "3 / 5" style.
 *  - filledCount: optional, used with segments.
 */
export function ProgressBar({ label, value = 0, segments, filledCount, className = "" }) {
  const pct = Math.max(0, Math.min(1, value));
  const display =
    typeof segments === "number" && typeof filledCount === "number"
      ? `${filledCount} / ${segments}`
      : `${Math.round(pct * 100)}%`;

  return (
    <div className={className}>
      {label ? (
        <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] font-semibold">
          <span className="text-white/60">{label}</span>
          <span className="text-[#D4AF37] tabular-nums">{display}</span>
        </div>
      ) : null}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F2CA50] transition-all duration-500"
          style={{ width: `${pct * 100}%` }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
