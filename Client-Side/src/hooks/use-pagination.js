import { useMemo, useState } from "react";

/**
 * Client-side pagination over an already-fetched array.
 *
 * The current page is clamped during render (no effects) so the page index
 * stays valid when the source list shrinks — e.g. after a search/filter — which
 * also keeps us clear of the project's `set-state-in-effect` lint rule.
 *
 * @param {Array} items     the full list to paginate
 * @param {number} pageSize rows per page (default 10)
 * @returns {{ page, setPage, pageCount, total, pageItems, pageSize }}
 */
export default function usePagination(items, pageSize = 10) {
  const [page, setPage] = useState(1);

  const total = Array.isArray(items) ? items.length : 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);

  const pageItems = useMemo(() => {
    if (!Array.isArray(items)) return [];
    const start = (current - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, current, pageSize]);

  return { page: current, setPage, pageCount, total, pageItems, pageSize };
}
