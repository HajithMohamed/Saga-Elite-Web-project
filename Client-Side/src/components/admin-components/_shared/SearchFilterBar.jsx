import { Search } from "lucide-react";

/** RULE 9 — search + optional filter children */
export function SearchFilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search…",
  children,
  className = "",
}) {
  return (
    <div
      className={`mb-6 flex flex-wrap items-center gap-3 ${className}`.trim()}
    >
      <div className="relative min-w-[200px] flex-1 sm:min-w-[240px] sm:max-w-md">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
          aria-hidden
        />
        <input
          type="search"
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-2xl border border-ink/10 bg-black/60 py-2.5 pl-10 pr-4 text-sm text-ink outline-none focus:border-gold-ink2"
        />
      </div>
      {children}
    </div>
  );
}

/** Styled select matching search bar */
export function FilterSelect({ value, onChange, options, className = "" }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className={`rounded-2xl border border-ink/10 bg-black/60 px-4 py-2.5 text-sm text-ink outline-none focus:border-gold-ink2 ${className}`.trim()}
    >
      {options?.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
