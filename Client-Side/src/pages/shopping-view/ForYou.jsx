import React, { useEffect, useState } from "react";
import axios from "axios";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Sparkles, Info } from "lucide-react";
import { API_V1_URL as API_BASE } from "@/lib/api";
import ProductCard from "@/components/shopping-components/ProductCard";
import { Eyebrow } from "@/components/ui/editorial";
import usePageMeta from "@/hooks/use-page-meta";

const ForYou = () => {
  usePageMeta({ title: "For You" });
  const user = useSelector((state) => state.auth?.user);
  const isLoadingAuth = useSelector((state) => state.auth?.isLoading);

  const [products, setProducts] = useState([]);
  const [mode, setMode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    axios
      .get(`${API_BASE}/products/recommendations?context=foryou&limit=24`, {
        withCredentials: true,
      })
      .then((res) => {
        if (cancelled) return;
        setProducts(res.data?.data?.recommendations || []);
        setMode(res.data?.data?.mode || null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.response?.data?.message || err?.message || "Could not load picks");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!isLoadingAuth && !user) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <div className="bg-[#0a0a0a] text-[#e5e2e1] se-body min-h-screen">
      <main className="px-5 md:px-12 max-w-7xl mx-auto py-16 md:py-24">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-[#f2ca50]" />
            <div>
              <Eyebrow tone="muted" size="xs">For you</Eyebrow>
              <h1 className="se-serif text-[#e5e2e1] text-4xl md:text-5xl mt-2">
                Picked from your trail
              </h1>
              <p className="mt-3 max-w-xl text-sm text-[#99907c]">
                {mode === "personalized"
                  ? "Tailored from what you've viewed, wishlisted, and bought on Saga Elite."
                  : "Trending picks across the catalogue. Browse a few items and we'll personalise this further."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowInfo((v) => !v)}
            className="relative inline-flex items-center gap-2 text-xs text-[#99907c] hover:text-[#f2ca50]"
          >
            <Info className="h-4 w-4" />
            Why these?
            {showInfo ? (
              <span className="absolute right-0 top-7 z-10 w-72 rounded border border-[#4d4635] bg-[#0a0a0a] px-3 py-2 text-xs text-[#d0c5af] shadow-lg">
                Recommendations come only from your on-site activity (views, wishlist, cart, purchases). We don't read your search history or social media activity — that data isn't accessible to us, and we wouldn't use it if it were.
              </span>
            ) : null}
          </button>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#4d4635] border-t-[#f2ca50]" />
          </div>
        ) : error ? (
          <div className="border border-[#93000a]/40 bg-[#93000a]/10 px-6 py-10 text-center">
            <p className="se-body text-sm text-[#ffb4ab]">{error}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="border border-[#4d4635] bg-[#0e0e0e] px-8 py-16 text-center">
            <Eyebrow tone="muted" size="xs">Nothing here yet</Eyebrow>
            <h3 className="mt-4 se-serif text-[#e5e2e1] text-3xl">
              Browse a few pieces and come back.
            </h3>
            <p className="mt-3 max-w-md mx-auto text-sm text-[#d0c5af]">
              We need a little signal before this becomes useful.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-px bg-[#4d4635]/40 border border-[#4d4635]/40">
            {products.map((product, idx) => (
              <ProductCard key={product._id} product={product} index={idx} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ForYou;
