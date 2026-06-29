import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowRight, Sparkles, History, Flame, Info } from "lucide-react";
import { API_V1_URL as API_BASE } from "@/lib/api";
import ProductCard from "@/components/shopping-components/ProductCard";
import { Eyebrow } from "@/components/ui/editorial";
import { cn } from "@/lib/utils";

/*
 * Personalized rail on the landing page. Three variants:
 *   - "for-you"          → /products/recommendations?context=home (mixed personalized+explore)
 *   - "recently-viewed"  → /products/recommendations?context=recently-viewed
 *   - "trending-style"   → /products/recommendations?context=trending-style
 *
 * Each rail self-hides for anon users or when the API returns nothing meaningful.
 * Default export keeps the old name for backwards compatibility.
 */

const VARIANT_CONFIG = {
  "for-you": {
    eyebrow: "For you",
    title: "Picked from your trail",
    icon: Sparkles,
    apiContext: "home",
    seeAllLabel: "See all",
    seeAllTo: "/shopping/for-you",
    // Hide when only trending fallback comes back — the page already has a
    // separate Trending section so we don't double it up here.
    hideWhenMode: ["trending"],
    infoText:
      "Based on what you've viewed, wishlisted, searched, and purchased on this site. No external data.",
  },
  "recently-viewed": {
    eyebrow: "Recently viewed",
    title: "Pick up where you left off",
    icon: History,
    apiContext: "recently-viewed",
    seeAllLabel: null,
    seeAllTo: null,
    hideWhenMode: [],
    infoText: null,
  },
  "trending-style": {
    eyebrow: "Trending in your style",
    title: "What others like you are buying",
    icon: Flame,
    apiContext: "trending-style",
    seeAllLabel: null,
    seeAllTo: null,
    hideWhenMode: [],
    infoText: null,
  },
};

const PersonalizedRail = ({ variant = "for-you" }) => {
  const config = VARIANT_CONFIG[variant] || VARIANT_CONFIG["for-you"];
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
      .get(`${API_BASE}/products/recommendations?context=${config.apiContext}&limit=8`, {
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
  }, [user, config.apiContext]);

  if (products.length === 0 && !loading) return null;
  if (config.hideWhenMode.includes(mode)) return null;

  const Icon = config.icon;
  // Prompt 04 overrides for the main variant
  const displayTitle = variant === "for-you" 
    ? (user ? "Recommended For You" : "Editor's Picks") 
    : config.title;
  const displayDesc = variant === "for-you"
    ? (user ? "Products selected based on your browsing." : "Curated styles selected by our fashion editors.")
    : null;

  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 md:px-8 py-[64px] md:py-[80px] lg:py-[96px] overflow-hidden">
      {/* Header Area */}
      <div className="mb-8 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-[#f2ca50]" />
          <div>
            <Eyebrow tone="muted" size="xs">{config.eyebrow}</Eyebrow>
            <h2 className="se-serif text-[28px] md:text-[36px] lg:text-[40px] text-[#e5e2e1] leading-tight">
              {displayTitle}
            </h2>
            {displayDesc && <p className="mt-2 se-body text-[16px] md:text-[18px] text-[#99907c]">{displayDesc}</p>}
          </div>
          {config.infoText ? (
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
                  {config.infoText}
                </span>
              ) : null}
            </button>
          ) : null}
        </div>
        {config.seeAllTo ? (
          <Link
            to={config.seeAllTo}
            className="se-label text-[10px] tracking-[0.18em] text-[#d0c5af] hover:text-[#f2ca50] inline-flex items-center gap-2"
          >
            {config.seeAllLabel} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-[24px]">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "bg-[#131313] rounded-[20px] animate-[pulse_1.5s_ease-in-out_infinite]",
                "w-[170px] h-[320px] md:w-[260px] md:h-[420px] lg:w-[290px] lg:h-[460px]",
                i === 2 && "hidden md:block",
                i === 3 && "hidden lg:block"
              )}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-[24px]">
          {products.slice(0, 8).map((product, idx) => (
            <ProductCard key={product._id} product={product} index={idx} />
          ))}
        </div>
      )}
      
      {/* Mobile View All Button */}
      {!loading && products.length > 0 && config.seeAllTo && (
        <div className="mt-10 flex justify-center md:hidden">
          <Link
            to={config.seeAllTo}
            className="flex h-[52px] w-full items-center justify-center rounded-[16px] border border-[#f2ca50] bg-transparent px-8 se-body text-sm font-semibold text-[#f2ca50] transition-colors hover:bg-[#f2ca50] hover:text-[#0a0a0a]"
          >
            {config.seeAllLabel}
          </Link>
        </div>
      )}
    </section>
  );
};

export default PersonalizedRail;
