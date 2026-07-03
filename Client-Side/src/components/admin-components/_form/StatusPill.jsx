import React from "react";

/**
 * Color-coded status pill for the right rail.
 *
 *   ●  Draft       ●  Scheduled    ●  Published    ●  Archived
 *   gray            blue            green/gold       rose
 *
 * Pass either a `status` key or a custom `tone` + `label`.
 *
 * Available tones:
 *  - draft (gray) | scheduled (blue) | published (gold) | live (gold) |
 *  - archived (rose) | active (emerald) | inactive (gray) | warning (amber)
 */
const TONES = {
  draft:      { dot: "bg-ink/40",        text: "text-ink/60",     ring: "border-ink/10",            bg: "bg-ink/[0.04]" },
  scheduled:  { dot: "bg-sky-400",         text: "text-sky-300",      ring: "border-sky-400/30",          bg: "bg-sky-400/[0.08]" },
  published:  { dot: "bg-gold-deep",       text: "text-gold-ink2",    ring: "border-gold-ink2/30",        bg: "bg-gold-deep/[0.08]" },
  live:       { dot: "bg-gold-deep",       text: "text-gold-ink2",    ring: "border-gold-ink2/30",        bg: "bg-gold-deep/[0.08]" },
  active:     { dot: "bg-emerald-400",     text: "text-emerald-300",  ring: "border-emerald-400/30",      bg: "bg-emerald-400/[0.08]" },
  inactive:   { dot: "bg-ink/40",        text: "text-ink/60",     ring: "border-ink/10",            bg: "bg-ink/[0.04]" },
  archived:   { dot: "bg-rose-400",        text: "text-rose-300",     ring: "border-rose-400/30",         bg: "bg-rose-400/[0.08]" },
  warning:    { dot: "bg-amber-400",       text: "text-amber-300",    ring: "border-amber-400/30",        bg: "bg-amber-400/[0.08]" },
  error:      { dot: "bg-rose-500",        text: "text-rose-400",     ring: "border-rose-500/40",         bg: "bg-rose-500/[0.10]" },
};

function resolveTone({ tone, status }) {
  if (tone && TONES[tone]) return TONES[tone];
  const key = String(status || "").toLowerCase();
  if (TONES[key]) return TONES[key];
  return TONES.draft;
}

export function StatusPill({ status, tone, label, size = "sm", className = "" }) {
  const t = resolveTone({ tone, status });
  const text = label || (status ? String(status).replace(/_/g, " ") : "");
  const sizing =
    size === "lg"
      ? "px-3 py-1.5 text-xs"
      : size === "md"
        ? "px-2.5 py-1 text-[11px]"
        : "px-2 py-0.5 text-[10px]";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${t.ring} ${t.bg} ${t.text} ${sizing} font-semibold uppercase tracking-[0.12em] ${className}`.trim()}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
      {text}
    </span>
  );
}

export default StatusPill;
