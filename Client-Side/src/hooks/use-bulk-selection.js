import { useCallback, useEffect, useMemo, useState } from "react";

const defaultGetId = (item) => item?._id;

const normalizeId = (id) => (id == null ? null : String(id));

/**
 * useBulkSelection — track a Set of selected item IDs.
 *
 * Resets selection when the visible item set changes, while avoiding loops
 * caused by derived arrays that are recreated on every render.
 *
 *   const items = useFilteredProducts(...);
 *   const {
 *     selectedIds, isSelected, toggle, toggleAll, clear,
 *     isAllSelected, isSomeSelected, count,
 *   } = useBulkSelection(items, (item) => item._id);
 */
const useBulkSelection = (items, getId = defaultGetId) => {
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const visibleIds = useMemo(
    () =>
      Array.isArray(items)
        ? items.map((item) => normalizeId(getId(item))).filter(Boolean)
        : [],
    [items, getId]
  );

  const visibleIdSignature = useMemo(
    () => [...new Set(visibleIds)].sort().join("|"),
    [visibleIds]
  );

  useEffect(() => {
    setSelectedIds(new Set());
  }, [visibleIdSignature]);

  const toggle = useCallback((id) => {
    const normalizedId = normalizeId(id);
    if (!normalizedId) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(normalizedId)) next.delete(normalizedId);
      else next.add(normalizedId);
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

  const isSelected = useCallback(
    (id) => {
      const normalizedId = normalizeId(id);
      return normalizedId ? selectedIds.has(normalizedId) : false;
    },
    [selectedIds]
  );

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
