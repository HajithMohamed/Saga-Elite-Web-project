import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop — resets the page scroll to the top on every route change.
 * Works with both the global Lenis instance and the native window scroll.
 * Render this once inside <Routes> (or alongside RouteMetaManager in App.jsx).
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Attempt to use Lenis if it's running
    try {
      const lenisRoot = document.documentElement.__lenis;
      if (lenisRoot && typeof lenisRoot.scrollTo === 'function') {
        lenisRoot.scrollTo(0, { immediate: true });
        return;
      }
    } catch (_) {
      // silent
    }

    // Fallback: native scroll reset
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
