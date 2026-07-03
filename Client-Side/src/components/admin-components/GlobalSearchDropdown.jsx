import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Package,
  ShoppingBag,
  User as UserIcon,
  Sparkles,
  Tag,
  Loader2,
} from "lucide-react";
import { runAdminSearch, clearAdminSearch } from "@/store/adminSearchSlice";

const DEBOUNCE_MS = 250;

const BUCKET_META = {
  products: { label: "Products", Icon: Package },
  orders: { label: "Orders", Icon: ShoppingBag },
  customers: { label: "Customers", Icon: UserIcon },
  drops: { label: "Drops", Icon: Sparkles },
  coupons: { label: "Coupons", Icon: Tag },
};

const flattenResults = (results) => {
  const flat = [];
  for (const bucket of Object.keys(BUCKET_META)) {
    const items = results?.[bucket] || [];
    if (items.length === 0) continue;
    flat.push({ kind: "header", bucket });
    for (const item of items) flat.push({ kind: "item", bucket, item });
  }
  return flat;
};

const GlobalSearchDropdown = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const { results, loading, error } = useSelector((s) => s.adminSearch);

  const flat = useMemo(() => flattenResults(results), [results]);
  const itemEntries = useMemo(
    () => flat.filter((e) => e.kind === "item"),
    [flat]
  );
  const totalItems = itemEntries.length;
  const showDropdown = open && value.trim().length >= 2;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      dispatch(clearAdminSearch());
      return;
    }
    debounceRef.current = setTimeout(() => {
      dispatch(runAdminSearch(value));
    }, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [value, dispatch]);

  useEffect(() => {
    setHighlightIndex(totalItems > 0 ? 0 : -1);
  }, [totalItems, value]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const closeAndReset = useCallback(() => {
    setOpen(false);
    setValue("");
    dispatch(clearAdminSearch());
    inputRef.current?.blur();
  }, [dispatch]);

  const handleSelect = useCallback(
    (item) => {
      navigate(item.href);
      closeAndReset();
    },
    [navigate, closeAndReset]
  );

  const handleKeyDown = (e) => {
    if (!showDropdown || totalItems === 0) {
      if (e.key === "Escape") closeAndReset();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => (i + 1) % totalItems);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => (i - 1 + totalItems) % totalItems);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = itemEntries[highlightIndex];
      if (target) handleSelect(target.item);
    } else if (e.key === "Escape") {
      closeAndReset();
    }
  };

  let runningItemIdx = -1;

  return (
    <div ref={containerRef} className="relative max-w-md w-full">
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-gold-ink2 transition-colors" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search products, orders, customers, drops…"
          aria-label="Global admin search"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-controls="admin-search-results"
          data-testid="admin-global-search-input"
          className="h-10 w-full rounded-full border border-gray-800 bg-gray-900 pl-10 pr-10 text-xs font-medium text-ink placeholder-gray-500 focus:border-gold-ink2 focus:ring-1 focus:ring-gold-ink2/20 outline-none transition-all"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gold-ink2" />
        )}
      </div>

      {showDropdown && (
        <div
          id="admin-search-results"
          role="listbox"
          data-testid="admin-global-search-results"
          className="absolute left-0 right-0 mt-2 max-h-[420px] overflow-y-auto rounded-xl border border-gray-800 bg-black/95 shadow-2xl backdrop-blur-md z-50"
        >
          {error && (
            <div className="px-4 py-3 text-xs text-red-400">{error}</div>
          )}

          {!error && !loading && totalItems === 0 && (
            <div className="px-4 py-6 text-center text-xs text-gray-500">
              No matches for "{value}"
            </div>
          )}

          {flat.map((entry, idx) => {
            if (entry.kind === "header") {
              const meta = BUCKET_META[entry.bucket];
              const Icon = meta.Icon;
              return (
                <div
                  key={`h-${entry.bucket}-${idx}`}
                  className="flex items-center gap-2 border-b border-gray-800 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gold-ink2"
                >
                  <Icon className="h-3 w-3" />
                  {meta.label}
                </div>
              );
            }

            runningItemIdx += 1;
            const isActive = runningItemIdx === highlightIndex;
            const item = entry.item;
            return (
              <button
                key={`i-${entry.bucket}-${item._id}`}
                type="button"
                role="option"
                aria-selected={isActive}
                onMouseEnter={() => setHighlightIndex(runningItemIdx)}
                onClick={() => handleSelect(item)}
                data-testid={`admin-search-result-${entry.bucket}`}
                className={`flex w-full flex-col items-start gap-0.5 border-b border-gray-900 px-4 py-2 text-left transition-colors ${
                  isActive ? "bg-gold-deep/10" : "hover:bg-gray-900/50"
                }`}
              >
                <span className="text-xs font-semibold text-ink">
                  {item.label}
                </span>
                {item.sublabel && (
                  <span className="text-[11px] text-gray-400">
                    {item.sublabel}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GlobalSearchDropdown;
