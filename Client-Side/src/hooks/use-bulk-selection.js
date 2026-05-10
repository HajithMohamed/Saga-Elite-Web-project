import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * useBulkSelection — track a Set of selected item IDs.
 *
 * Resets selection automatically when the items array reference changes
 * (e.g., a filter or refetch swaps the list out), so callers don't end up
 * acting on stale IDs that are no longer visible.
 *
 *   const items = useFilteredProducts(...);
 *   const {
 *     selectedIds, isSelected, toggle, toggleAll, clear,
 *     isAllSelected, isSomeSelected, count,
 *   } = useBulkSelection(items, (item) => item._id);
 */
const useBulkSelection = (items, getId = (item) => item?._id) => {
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  // Wipe stale selection when the underlying list changes identity. This is
  // intentionally reference-equality (filter/refetch creates a new array);
  // a fresh fetch with same data shouldn't blow away the user's choice, so
  // upstream should memoize the items array if that matters.
  useEffect(() => {
    setSelectedIds(new Set());
  }, [items]);

  const visibleIds = useMemo(
    () => (Array.isArray(items) ? items.map(getId).filter(Boolean) : []),
    [items, getId]
  );

  const toggle = useCallback((id) => {
    if (id == null) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      const allSelected = visibleIds.length > 0 && visibleIds.every((id) => prev.has(id));
      if (allSelected) {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.delete(id));
        return next;
      }
      const next = new Set(prev);
      visibleIds.forEach((id) => next.add(id));
      return next;
    });
  }, [visibleIds]);

  const clear = useCallback(() => setSelectedIds(new Set()), []);

  const isSelected = useCallback((id) => selectedIds.has(id), [selectedIds]);

  const isAllSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const isSomeSelected = !isAllSelected && visibleIds.some((id) => selectedIds.has(id));

  return {
    selectedIds: useMemo(() => Array.from(selectedIds), [selectedIds]),
    selectedSet: selectedIds,
    isSelected,
    toggle,
    toggleAll,
    clear,
    isAllSelected,
    isSomeSelected,
    count: selectedIds.size,
  };
};

export default useBulkSelection;
