import React from "react";
import { ImageIcon } from "lucide-react";
import { StatusPill } from "./StatusPill";

/**
 * Generic live preview card for the right rail.
 * Designed for fashion drops/products — shows hero image, title, status,
 * and an optional countdown / metadata strip.
 *
 * Props:
 *  - image: image URL (or undefined for placeholder).
 *  - title: bold preview title.
 *  - eyebrow: small label above title.
 *  - status: "draft" | "scheduled" | "published" | "archived" | etc.
 *  - statusLabel: optional override for the status pill text.
 *  - meta: array of {label, value} rows below the image.
 */
export function LivePreviewCard({
  image,
  title,
  eyebrow,
  status,
  statusLabel,
  meta = [],
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink/[0.06] bg-panel">
      <div className="relative aspect-[4/5] w-full bg-gradient-to-br from-ink/[0.04] to-black/40">
        {image ? (
          <img
            src={image}
            alt={title || "preview"}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-ink/20">
            <ImageIcon className="h-10 w-10" />
            <p className="text-[10px] uppercase tracking-[0.2em]">No hero image</p>
          </div>
        )}
        {status ? (
          <div className="absolute left-3 top-3">
            <StatusPill status={status} label={statusLabel} size="sm" />
          </div>
        ) : null}
      </div>
      <div className="space-y-2 p-4">
        {eyebrow ? (
          <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gold-ink2">
            {eyebrow}
          </p>
        ) : null}
        <h4 className="text-base font-semibold text-ink truncate">
          {title || "Untitled"}
        </h4>
        {meta.length > 0 ? (
          <dl className="mt-3 space-y-1.5 border-t border-ink/[0.05] pt-3">
            {meta.map((row, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 text-[11px]"
              >
                <dt className="text-ink/40 uppercase tracking-wider">
                  {row.label}
                </dt>
                <dd className="text-ink/80 tabular-nums truncate text-right">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </div>
  );
}

export default LivePreviewCard;
