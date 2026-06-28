import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Compact, dark-theme pagination control shared across the admin panel and the
 * public storefront. Purely presentational — pair it with `usePagination`
 * (client-side) or a server-driven page/pageCount.
 *
 * Renders nothing when there is only a single page.
 */
const buildPages = (page, pageCount) => {
  // Always show first/last; a small window around the current page; gaps as "…".
  const window = new Set([1, pageCount, page, page - 1, page + 1]);
  const pages = [...window].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  for (const p of pages) {
    if (prev && p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  }
  return out;
};

const Pagination = ({
  page,
  pageCount,
  onPageChange,
  total,
  pageSize,
  label = "items",
  className = "",
}) => {
  const pages = useMemo(() => buildPages(page, pageCount), [page, pageCount]);

  if (!pageCount || pageCount <= 1) return null;

  const go = (p) => {
    const next = Math.min(Math.max(1, p), pageCount);
    if (next !== page) onPageChange(next);
  };

  const from = (page - 1) * (pageSize || 0) + 1;
  const to = Math.min(page * (pageSize || 0), total || 0);

  const btnBase =
    "inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40";
  const btnIdle =
    "border-white/10 text-[#99907c] hover:border-[#D4AF37]/40 hover:text-[#D4AF37]";
  const btnActive =
    "border-[#D4AF37]/50 bg-[#D4AF37]/10 text-[#D4AF37]";

  return (
    <div
      className={`flex flex-col items-center justify-between gap-3 px-1 pt-4 sm:flex-row ${className}`.trim()}
    >
      {Number.isFinite(total) && pageSize ? (
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
          Showing {from}–{to} of {total} {label}
        </p>
      ) : (
        <span />
      )}

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label="Previous page"
          onClick={() => go(page - 1)}
          disabled={page <= 1}
          className={`${btnBase} ${btnIdle}`}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((p, i) =>
          p === "…" ? (
            <span
              key={`gap-${i}`}
              className="px-1 text-xs text-gray-600"
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              aria-label={`Page ${p}`}
              aria-current={p === page ? "page" : undefined}
              onClick={() => go(p)}
              className={`${btnBase} ${p === page ? btnActive : btnIdle}`}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          aria-label="Next page"
          onClick={() => go(page + 1)}
          disabled={page >= pageCount}
          className={`${btnBase} ${btnIdle}`}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
