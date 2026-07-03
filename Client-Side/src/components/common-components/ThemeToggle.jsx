import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/theme-context";

/* Accessible dark/light switch used in the storefront header, admin header
   and account settings. Renders a Sun in dark mode ("switch to light") and
   a Moon in light mode ("switch to dark"). */
export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";
  const label = isLight ? "Switch to dark theme" : "Switch to light theme";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-line/60 bg-ink/5 text-ink transition-colors hover:border-gold-ink hover:text-gold-ink se-focus ${className}`}
    >
      {isLight ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
    </button>
  );
}
