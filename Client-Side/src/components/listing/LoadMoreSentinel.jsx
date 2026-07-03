import React, { useEffect, useRef } from "react";

// Renders shimmer skeletons + an IntersectionObserver sentinel that calls
// `onLoadMore` when scrolled into view. When `hasMore` is false, hides itself.
// Skeletons match the ProductCard's 3/4 aspect ratio so the layout doesn't jump.
const LoadMoreSentinel = ({ hasMore = false, onLoadMore, count = 6 }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!hasMore || !ref.current) return undefined;
    const node = ref.current;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) onLoadMore?.();
        });
      },
      { rootMargin: "300px" }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [hasMore, onLoadMore]);

  if (!hasMore) return null;

  return (
    <div className="mt-8">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-px bg-line/40 border border-line/40">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="bg-page flex flex-col gap-3 p-4 animate-pulse"
          >
            <div className="aspect-[3/4] w-full bg-panel rounded-[1rem] border border-card" />
            <div className="h-3 bg-panel w-3/4 mt-2" />
            <div className="h-3 bg-panel w-1/3" />
          </div>
        ))}
      </div>
      <div ref={ref} className="h-1" aria-hidden="true" />
      <p className="mt-6 font-mono text-[10px] tracking-[0.28em] uppercase text-goldshadow text-center">
        Loading more rare pieces…
      </p>
    </div>
  );
};

export default LoadMoreSentinel;
