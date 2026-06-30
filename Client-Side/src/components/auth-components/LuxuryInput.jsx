import React from "react";
import { cn } from "@/lib/utils";

const LuxuryInput = React.forwardRef(({ label, error, className, ...props }, ref) => {
  return (
    <div className="relative w-full">
      {label && (
        <label className="se-label mb-2 block text-[10px] tracking-[0.25em] uppercase text-[#99907c]">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={cn(
          "w-full h-[56px] rounded-[16px] border border-white/10 bg-[#0a0a0a] px-5 py-3 text-sm text-[#e5e2e1] outline-none transition-all duration-200 placeholder:text-[#574500]",
          "focus:border-[#F2CA50] focus:ring-1 focus:ring-[#F2CA50]/30 focus:shadow-[0_0_15px_rgba(242,202,80,0.15)]",
          error && "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/30 bg-rose-500/5",
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-2 text-xs text-rose-400 font-medium animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
});

LuxuryInput.displayName = "LuxuryInput";

export default LuxuryInput;
