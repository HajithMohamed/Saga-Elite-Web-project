import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowRight, Sparkles, Info } from "lucide-react";
import { API_V1_URL as API_BASE } from "@/lib/api";
import ProductCard from "@/components/shopping-components/ProductCard";
import { Eyebrow } from "@/components/ui/editorial";

/*
 * ForYouRail — personalized product strip on the landing page.
 * Hidden when the user is anonymous OR when the API returns trending fallback
 * (no signal). Honest tooltip explains what data drives the picks.
 */
const ForYouRail = () => {
  const user = useSelector((state) => state.auth?.user);
  const [products, setProducts] = useState([]);
  const [mode, setMode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    axios
      .get(`${API_BASE}/products/recommendations?context=home&limit=8`, {
        withCredentials: true,
      })
      .then((res) => {
        if (cancelled) return;
        setProducts(res.data?.data?.recommendations || []);
        setMode(res.data?.data?.mode || null);
      })
      .catch(() => {
        if (cancelled) return;
        setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Hide when there's no logged-in user, or when we only have trending fallback
  // (the home page already has a separate Trending section, so don't duplicate)
  if (!user || mode === "trending" || products.length === 0) return null;

  return (
    <section className="px-5 md:px-12 max-w-7xl mx-auto py-12 md:py-16">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-8">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-[#f2ca50]" />
          <div>
            <Eyebrow tone="muted" size="xs">For you</Eyebrow>
            <h2 className="se-serif text-[#e5e2e1] text-3xl md:text-4xl mt-1">
              Picked from your trail
            </h2>
          </div>
          <button
            type="button"
            onMouseEnter={() => setShowInfo(true)}
            onMouseLeave={() => setShowInfo(false)}
            onClick={() => setShowInfo((v) => !v)}
            className="relative ml-1 text-[#99907c] hover:text-[#f2ca50]"
            aria-label="What drives these picks"
          >
            <Info className="h-4 w-4" />
            {showInfo ? (
              <span className="absolute left-0 top-6 z-10 w-64 rounded border border-[#4d4635] bg-[#0a0a0a] px-3 py-2 text-xs text-[#d0c5af] shadow-lg">
                Based on what you've viewed, wishlisted, and purchased on this site. We don't read your search history or social activity.
              </span>
            ) : null}
          </button>
        </div>
        <Link
          to="/shopping/for-you"
          className="se-label text-[10px] tracking-[0.18em] text-[#d0c5af] hover:text-[#f2ca50] inline-flex items-center gap-2"
        >
          See all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#4d4635] border-t-[#f2ca50]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-px bg-[#4d4635]/40 border border-[#4d4635]/40">
          {products.map((product, idx) => (
            <ProductCard key={product._id} product={product} index={idx} />
          ))}
        </div>
      )}
    </section>
  );
};

export default ForYouRail;
