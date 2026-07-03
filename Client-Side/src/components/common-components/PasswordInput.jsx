import React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Bare <input type="password"> with an accessible show/hide toggle.
 * Keeps the caller's own `className` for styling (so it matches whatever
 * surface it's dropped into) and just layers the reveal button on top.
 * For the styled auth inputs use LuxuryInput, which has this built in.
 */
const PasswordInput = React.forwardRef(({ className, ...props }, ref) => {
  const [reveal, setReveal] = React.useState(false);

  return (
    <div className="relative">
      <input
        ref={ref}
        type={reveal ? "text" : "password"}
        className={cn(className, "pr-12")}
        {...props}
      />
      <button
        type="button"
        onClick={() => setReveal((v) => !v)}
        aria-label={reveal ? "Hide password" : "Show password"}
        title={reveal ? "Hide password" : "Show password"}
        className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:text-gold-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink/40"
      >
        {reveal ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
      </button>
    </div>
  );
});

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;
