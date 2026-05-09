import { useEffect } from "react";
import Lenis from "lenis";

// Initialize Lenis smooth scroll once for the whole app.
// Re-running on hot reload destroys the previous instance to avoid leaks.
let _lenis = null;

export function useLenis({ enabled = true } = {}) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return undefined;

    if (_lenis) {
      _lenis.destroy();
      _lenis = null;
    }

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false,
    });
    _lenis = lenis;

    let rafId;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      if (_lenis === lenis) _lenis = null;
    };
  }, [enabled]);
}
