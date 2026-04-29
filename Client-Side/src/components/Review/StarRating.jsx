import React, { useMemo, useState } from "react";
import { Star } from "lucide-react";

const sizeMap = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-6 w-6",
};

const StarRating = ({
  value = 0,
  onChange,
  readOnly = true,
  size = "md",
  showValue = false,
  className = "",
}) => {
  const [hoverValue, setHoverValue] = useState(null);
  const starClass = sizeMap[size] || sizeMap.md;

  const displayValue = useMemo(() => {
    if (readOnly) return value || 0;
    if (hoverValue !== null) return hoverValue;
    return value || 0;
  }, [readOnly, value, hoverValue]);

  const renderStar = (index) => {
    const starValue = index + 1;
    const fillPercent = Math.max(
      0,
      Math.min(1, displayValue - index)
    ) * 100;

    const isInteractive = !readOnly && typeof onChange === "function";

    return (
      <button
        key={starValue}
        type="button"
        onClick={() => isInteractive && onChange(starValue)}
        onMouseEnter={() => isInteractive && setHoverValue(starValue)}
        onMouseLeave={() => isInteractive && setHoverValue(null)}
        aria-label={`Rate ${starValue} star${starValue > 1 ? "s" : ""}`}
        className={`relative ${starClass} ${isInteractive ? "cursor-pointer" : "cursor-default"}`}
        disabled={!isInteractive}
      >
        <Star className={`${starClass} text-white/30`} />
        <span
          className="absolute left-0 top-0 overflow-hidden"
          style={{ width: `${fillPercent}%` }}
        >
          <Star className={`${starClass} text-[#D4AF37]`} fill="currentColor" />
        </span>
      </button>
    );
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, index) => renderStar(index))}
      </div>
      {showValue && (
        <span className="text-xs font-semibold text-white/70">
          {Number(displayValue || 0).toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;
