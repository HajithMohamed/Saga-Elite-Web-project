import { createContext, useCallback, useContext, useEffect, useState } from "react";

/* Theme system: default (no class on <html>) is the original Saga Gold DARK
   theme; adding `light` to <html> activates the light palette (index.css).
   Persisted in localStorage under `saga-theme` so it survives refresh,
   logout/login (only authToken is cleared on logout) and browser restarts.
   index.html applies the class before first paint to avoid a flash. */

const STORAGE_KEY = "saga-theme";

const ThemeContext = createContext({ theme: "dark", setTheme: () => {}, toggleTheme: () => {} });

const readStoredTheme = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
};

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readStoredTheme);

  useEffect(() => {
    const root = document.documentElement;
    // `light` drives our CSS-variable palette; `dark` keeps Tailwind's
    // `dark:` variant utilities correct (active only in the dark theme).
    root.classList.toggle("light", theme === "light");
    root.classList.toggle("dark", theme !== "light");
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* storage unavailable (private mode) — theme still applies for the session */
    }
  }, [theme]);

  const setTheme = useCallback((next) => {
    setThemeState(next === "light" ? "light" : "dark");
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  return useContext(ThemeContext);
}
