import React from "react";

/**
 * Top-tab navigator for long forms (Linear / Stripe style).
 *
 *   ┌────────────────────────────────────────────────────────┐
 *   │  Basic Info  │  Media  │  Pricing  │  Variants  │ SEO  │
 *   └────────────────────────────────────────────────────────┘
 *
 * Props:
 *  - tabs: [{ id, label, count?, icon? }]
 *  - active: id of the active tab
 *  - onChange: (id) => void
 */
export function FormTabs({ tabs, active, onChange, className = "" }) {
  return (
    <nav
      className={`sticky top-20 z-20 -mx-6 mb-6 border-b border-white/[0.06] bg-[#0A0A0A]/95 px-6 backdrop-blur-xl lg:-mx-10 lg:px-10 ${className}`.trim()}
    >
      <div className="flex gap-1 overflow-x-auto py-1 scrollbar-hide">
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange?.(tab.id)}
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition ${
                isActive
                  ? "bg-[#D4AF37]/[0.12] text-[#D4AF37] border border-[#D4AF37]/30"
                  : "border border-transparent text-white/50 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
              {tab.label}
              {typeof tab.count === "number" ? (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                    isActive
                      ? "bg-[#D4AF37]/20 text-[#D4AF37]"
                      : "bg-white/[0.06] text-white/50"
                  }`}
                >
                  {tab.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default FormTabs;
