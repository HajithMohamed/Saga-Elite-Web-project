import React from "react";
import StarRating from "./StarRating";

const RatingSummary = ({ stats, onFilterChange }) => {
  const averageRating = stats?.averageRating || 0;
  const totalReviews = stats?.totalReviews || 0;
  const distribution = stats?.distribution || {};

  const rows = [5, 4, 3, 2, 1];

  return (
    <div className="grid gap-6 rounded-3xl border border-white/10 bg-[#0b0b0b] p-6 md:grid-cols-[220px_1fr]">
      <div className="space-y-2">
        <p className="text-4xl font-bold text-white">
          {averageRating.toFixed(1)}
        </p>
        <StarRating value={averageRating} readOnly size="lg" />
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">
          {totalReviews} reviews
        </p>
      </div>
      <div className="space-y-3">
        {rows.map((rating) => {
          const row = distribution?.[rating] || { count: 0, percentage: 0 };
          return (
            <button
              key={rating}
              type="button"
              onClick={() => onFilterChange && onFilterChange(rating)}
              className="group flex w-full items-center gap-3"
            >
              <span className="w-12 text-xs font-semibold text-white/70">
                {rating} <span className="text-[#D4AF37]">star</span>
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#D4AF37] transition-all duration-300 group-hover:bg-[#f0c75e]"
                  style={{ width: `${row.percentage}%` }}
                />
              </div>
              <span className="w-10 text-right text-xs text-white/60">
                {row.percentage}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RatingSummary;
