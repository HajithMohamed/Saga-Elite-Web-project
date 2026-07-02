import React from "react";
import { Info } from "lucide-react";

/**
 * One-line upload guideline hint shown under upload areas.
 * Styled to match the Drops banner hint (subtle white/40 caption).
 *
 *   <UploadGuidelines dims="1600×2000" aspect="4:5" maxSize="5 MB" />
 *   → "Recommended 1600×2000 (4:5) · JPG / PNG / WEBP · Max 5 MB"
 */
export const UploadGuidelines = ({
  dims,
  aspect,
  maxSize = "5 MB",
  formats = "JPG / PNG / WEBP",
  extra,
  className = "",
}) => {
  const parts = [];
  if (dims) parts.push(`Recommended ${dims}${aspect ? ` (${aspect})` : ""}`);
  else if (aspect) parts.push(`Aspect ${aspect}`);
  parts.push(formats);
  if (maxSize) parts.push(`Max ${maxSize}`);
  if (extra) parts.push(extra);

  return (
    <p
      className={`mt-2 flex items-center gap-1.5 text-[11px] leading-relaxed text-white/40 ${className}`.trim()}
    >
      <Info className="h-3 w-3 shrink-0 text-white/30" aria-hidden />
      {parts.join(" · ")}
    </p>
  );
};

export default UploadGuidelines;
