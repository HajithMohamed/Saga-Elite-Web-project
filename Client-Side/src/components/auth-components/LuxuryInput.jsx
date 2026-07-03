import React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

const LuxuryInput = React.forwardRef(({ label, error, className, type = "text", ...props }, ref) => {
  const isPassword = type === "password";
  const [reveal, setReveal] = React.useState(false);
  const inputType = isPassword && reveal ? "text" : type;

  return (
    <div className="relative w-full">
      {label && (
        <label className="se-label mb-2 block text-[10px] tracking-[0.25em] uppercase text-muted">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          type={inputType}
          className={cn(
            "w-full h-[56px] rounded-[16px] border border-ink/10 bg-page px-5 py-3 text-sm text-ink-2 outline-none transition-all duration-200 placeholder:text-goldshadow",
            "focus:border-gold-ink focus:ring-1 focus:ring-gold-ink/30 focus:shadow-[0_0_15px_rgba(242,202,80,0.15)]",
            isPassword && "pr-12",
            error && "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/30 bg-rose-500/5",
            className
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? "Hide password" : "Show password"}
            title={reveal ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:text-gold-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink/40"
          >
            {reveal ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
          </button>
        )}
      </div>
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
