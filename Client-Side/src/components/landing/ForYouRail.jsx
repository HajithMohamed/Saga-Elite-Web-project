import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowRight, Sparkles, History, Flame, Info } from "lucide-react";
import { API_V1_URL as API_BASE } from "@/lib/api";
import ProductCard from "@/components/shopping-components/ProductCard";
import { Eyebrow } from "@/components/ui/editorial";

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

  if (!user || products.length === 0) return null;
  if (config.hideWhenMode.includes(mode)) return null;

  const Icon = config.icon;

  return (
    <section className="px-5 md:px-12 max-w-7xl mx-auto py-12 md:py-16">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-8">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-[#f2ca50]" />
          <div>
            <Eyebrow tone="muted" size="xs">{config.eyebrow}</Eyebrow>
            <h2 className="se-serif text-[#e5e2e1] text-3xl md:text-4xl mt-1">
              {config.title}
            </h2>
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
        <div className="flex h-48 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#4d4635] border-t-[#f2ca50]" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {products.map((product, idx) => (
            <ProductCard key={product._id} product={product} index={idx} />
          ))}
        </div>
      )}
    </section>
  );
};

export default PersonalizedRail;
