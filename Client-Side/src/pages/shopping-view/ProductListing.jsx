import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, SlidersHorizontal } from "lucide-react";
import useLiveProductUpdates from "@/hooks/use-live-product-updates";
import { applyLiveProductUpdate } from "@/store/live-product-slice";
import { fetchCartAction } from "@/store/cart-slice";
import { toast } from "@/hooks/use-toast";
import { API_V1_URL as API_BASE } from "@/lib/api";
import {
  Btn,
  Eyebrow,
  FilterPills,
  Marquee,
  Reveal,
  SortDropdown,
} from "@/components/ui/editorial";
import usePageMeta from "@/hooks/use-page-meta";
import ProductCard from "@/components/shopping-components/ProductCard";
import CollectionHero from "@/components/listing/CollectionHero";
import CollectionIntro from "@/components/listing/CollectionIntro";
import RefineRow from "@/components/listing/RefineRow";
import LoadMoreSentinel from "@/components/listing/LoadMoreSentinel";
import CommunityStylingStrip from "@/components/listing/CommunityStylingStrip";
import FeaturedHighlightCard from "@/components/listing/FeaturedHighlightCard";
import { getCollectionHero } from "@/components/listing/collectionConfig";

const CATEGORY_LABELS = {
  ladies: "Ladies",
  gents: "Gents",
  unisex: "Unisex",
};

const SORT_OPTIONS = [
  { value: "new", label: "Newest" },
  { value: "price_low", label: "Price · ascending" },
  { value: "price_high", label: "Price · descending" },
];

const PILL_KEYS = [
  { value: "all", label: "All" },
  { value: "ladies", label: "Ladies" },
  { value: "gents", label: "Gents" },
  { value: "unisex", label: "Unisex" },
  { value: "drops", label: "Drops" },
  { value: "offers", label: "Offers" },
  { value: "archive", label: "Archive" },
];

const COLLECTION_INTROS = {
  all: "Every chapter, every piece. From this season's drop to the archived edits — one scroll, no compromise.",
  ladies:
    "Minimal silhouettes, oversized fits, and hand-finished pieces inspired by modern street culture.",
  gents:
    "Cut sharp, layered loose. Pieces engineered for the man who notices the seams before the label.",
  unisex:
    "No gender, no rules. Built to layer, share, and outlast a season — together.",
  offers:
    "Selected pieces at members-only prices. Brief windows; the clock is louder than the discount.",
  archive:
    "Every chapter that has closed. Held for record — nothing restocks, nothing returns.",
};

const PAGE_SIZE = 12;
const FETCH_LIMIT = 60;
const PRICE_MIN = 0;
const PRICE_MAX = 50000;

const ProductListing = () => {
  usePageMeta({ title: "Shop" });
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refineOpen, setRefineOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const liveProductUpdates = useSelector((state) => state.liveProduct.byId);

  const categoryParam = (searchParams.get("category") || "").toLowerCase();
  const filterParam = (searchParams.get("filter") || "").toLowerCase();
  const sortParam = (searchParams.get("sort") || "new").toLowerCase();
  const inStockOnly = searchParams.get("stock") === "in";
  const limitedOnly = searchParams.get("limited") === "1";
  const isOffersListing =
    categoryParam === "offers" || filterParam === "offers";

  // Refine row params (URL-driven, multi-select)
  const colorsParam = useMemo(
    () =>
      (searchParams.get("colors") || "")
        .split(",")
        .map((c) => c.trim().toLowerCase())
        .filter(Boolean),
    [searchParams]
  );
  const sizesParam = useMemo(
    () =>
      (searchParams.get("sizes") || "")
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean),
    [searchParams]
  );
  const priceMinParam = Number(searchParams.get("min") || PRICE_MIN);
  const priceMaxParam = Number(searchParams.get("max") || PRICE_MAX);

  // /shopping/drops is the dedicated drops page now — redirect old links.
  useEffect(() => {
    if (categoryParam === "drops" || filterParam === "drops") {
      navigate("/shopping/drops", { replace: true });
    }
  }, [categoryParam, filterParam, navigate]);

  const activePill = isOffersListing
    ? "offers"
    : categoryParam === "archive" || filterParam === "archive"
      ? "archive"
      : CATEGORY_LABELS[categoryParam]
        ? categoryParam
        : "all";

  const updateParams = (mutator) => {
    const next = new URLSearchParams(searchParams);
    mutator(next);
    const qs = next.toString();
    navigate(qs ? `${location.pathname}?${qs}` : location.pathname);
  };

  const setCategoryFilter = (key) => {
    if (key === "drops") {
      navigate("/shopping/drops");
      return;
    }
    const next = new URLSearchParams();
    if (key === "archive" || key === "offers") next.set("filter", key);
    else if (key !== "all") next.set("category", key);
    if (sortParam !== "new") next.set("sort", sortParam);
    if (inStockOnly) next.set("stock", "in");
    if (limitedOnly) next.set("limited", "1");
    const qs = next.toString();
    navigate(qs ? `${location.pathname}?${qs}` : location.pathname);
  };

  const setSort = (value) =>
    updateParams((p) => {
      if (value === "new") p.delete("sort");
      else p.set("sort", value);
    });

  const toggleInStock = () =>
    updateParams((p) => {
      if (inStockOnly) p.delete("stock");
      else p.set("stock", "in");
    });

  const toggleLimited = () =>
    updateParams((p) => {
      if (limitedOnly) p.delete("limited");
      else p.set("limited", "1");
    });

  const toggleColor = (color) =>
    updateParams((p) => {
      const current = (p.get("colors") || "")
        .split(",")
        .filter(Boolean);
      const has = current.includes(color);
      const next = has
        ? current.filter((c) => c !== color)
        : [...current, color];
      if (next.length) p.set("colors", next.join(","));
      else p.delete("colors");
    });

  const toggleSize = (size) =>
    updateParams((p) => {
      const current = (p.get("sizes") || "")
        .split(",")
        .filter(Boolean);
      const has = current.includes(size);
      const next = has
        ? current.filter((s) => s !== size)
        : [...current, size];
      if (next.length) p.set("sizes", next.join(","));
      else p.delete("sizes");
    });

  const setPriceRange = ([lo, hi]) =>
    updateParams((p) => {
      if (lo > PRICE_MIN) p.set("min", String(lo));
      else p.delete("min");
      if (hi < PRICE_MAX) p.set("max", String(hi));
      else p.delete("max");
    });

  const clearRefinements = () =>
    updateParams((p) => {
      p.delete("colors");
      p.delete("sizes");
      p.delete("min");
      p.delete("max");
    });

  const clearAllFilters = () =>
    updateParams((p) => {
      p.delete("stock");
      p.delete("limited");
      p.delete("colors");
      p.delete("sizes");
      p.delete("min");
      p.delete("max");
    });

  const unitPrice = (product, variant) => {
    const base = product.basePrice + (variant?.priceAdjustment || 0);
    return base * (1 - (product.discountPercent || 0) / 100);
  };

  const sortedProducts = useMemo(() => {
    const list = [...products];
    if (sortParam === "price_low") {
      list.sort(
        (a, b) =>
          unitPrice(a, a.variants?.[0]) - unitPrice(b, b.variants?.[0])
      );
    } else if (sortParam === "price_high") {
      list.sort(
        (a, b) =>
          unitPrice(b, b.variants?.[0]) - unitPrice(a, a.variants?.[0])
      );
    } else {
      list.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
    }
    return list;
  }, [products, sortParam]);

  const filteredProducts = useMemo(() => {
    return sortedProducts
      .filter(
        (p) =>
          !inStockOnly ||
          (p.variants || []).some((v) => Number(v?.stock || 0) > 0)
      )
      .filter((p) => !limitedOnly || p.isLimited)
      .filter((p) => {
        if (!colorsParam.length) return true;
        return (p.variants || []).some((v) =>
          colorsParam.includes(String(v?.color || "").toLowerCase())
        );
      })
      .filter((p) => {
        if (!sizesParam.length) return true;
        return (p.variants || []).some((v) =>
          sizesParam.includes(String(v?.size || "").toUpperCase())
        );
      })
      .filter((p) => {
        const price = Number(p.basePrice || 0);
        return price >= priceMinParam && price <= priceMaxParam;
      });
  }, [
    sortedProducts,
    inStockOnly,
    limitedOnly,
    colorsParam,
    sizesParam,
    priceMinParam,
    priceMaxParam,
  ]);

  const visibleProducts = useMemo(
    () => filteredProducts.slice(0, visibleCount),
    [filteredProducts, visibleCount]
  );
  const hasMore = visibleCount < filteredProducts.length;

  // Reset visible window whenever the result set changes.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [
    categoryParam,
    filterParam,
    inStockOnly,
    limitedOnly,
    colorsParam.join(","),
    sizesParam.join(","),
    priceMinParam,
    priceMaxParam,
  ]);

  // Pick a featured product — prefer a limited piece with low remaining stock.
  const featuredProduct = useMemo(() => {
    if (filteredProducts.length < 4) return null;
    const limited = filteredProducts.find((p) => {
      const total =
        Number(p?.totalStock) ||
        (p?.variants || []).reduce(
          (sum, v) => sum + Math.max(0, Number(v?.stock || 0)),
          0
        );
      return p?.isLimited && total > 0 && total <= 12;
    });
    return limited || filteredProducts[0];
  }, [filteredProducts]);

  useLiveProductUpdates((payload = {}) =>
    products.some(
      (product) => String(product._id) === String(payload.productId || "")
    )
  );

  useEffect(() => {
    dispatch(fetchCartAction());
  }, [dispatch]);

  useEffect(() => {
    let cancelled = false;
    const fetchListingData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (isOffersListing) {
          const response = await axios.get(`${API_BASE}/offers`);
          if (cancelled) return;
          const offers = response.data?.data?.offers || [];
          const seen = new Set();
          const offerProducts = [];
          for (const offer of offers) {
            for (const product of offer.products || []) {
              const key = String(product?._id || product?.id || "");
              if (!key || seen.has(key)) continue;
              seen.add(key);
              offerProducts.push({
                ...product,
                discountPercent:
                  offer.discountPercent ?? product.discountPercent,
                offerEndsAt: offer.endsAt,
                offerBadge: offer.badgeText,
              });
            }
          }
          setProducts(offerProducts);
          return;
        }

        const query = new URLSearchParams({ limit: String(FETCH_LIMIT) });
        if (categoryParam === "archive" || filterParam === "archive") {
          query.set("status", "archive");
        } else if (CATEGORY_LABELS[categoryParam]) {
          query.set("category", CATEGORY_LABELS[categoryParam]);
        }

        const response = await axios.get(
          `${API_BASE}/products/get-all-products?${query.toString()}`
        );
        if (cancelled) return;
        setProducts(response.data?.data || []);
      } catch (err) {
        if (cancelled) return;
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Something went wrong";
        setError(msg);
        toast({
          title: "Could not load pieces",
          description: msg,
          variant: "destructive",
        });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchListingData();
    return () => {
      cancelled = true;
    };
  }, [categoryParam, filterParam, isOffersListing]);

  useEffect(() => {
    if (!products.length) return;
    setProducts((current) => {
      let changed = false;
      const next = current.map((product) => {
        const patched = applyLiveProductUpdate(
          product,
          liveProductUpdates[String(product._id)]
        );
        if (patched !== product) changed = true;
        return patched;
      });
      return changed ? next : current;
    });
  }, [liveProductUpdates, products]);

  const articleCount = filteredProducts.length;
  const totalCount = sortedProducts.length;
  const refineActive =
    colorsParam.length > 0 ||
    sizesParam.length > 0 ||
    priceMinParam > PRICE_MIN ||
    priceMaxParam < PRICE_MAX;
  const hasFilterActive = inStockOnly || limitedOnly || refineActive;

  return (
    <div className="bg-[#0a0a0a] text-[#e5e2e1] se-body min-h-screen">
      {/* CINEMATIC HERO */}
      <CollectionHero variant={activePill} />

      {/* COLLECTION INTRO */}
      <CollectionIntro
        eyebrow={getCollectionHero(activePill).eyebrow}
        body={COLLECTION_INTROS[activePill]}
      />

      {/* STICKY FILTER RAIL */}
      <div className="sticky top-16 z-30 bg-[#0a0a0a]/90 backdrop-blur-md border-y border-[#4d4635]/40">
        <div className="px-5 md:px-12 max-w-7xl mx-auto py-3 md:py-4 flex items-center gap-3 md:gap-6 overflow-x-auto custom-scrollbar">
          <FilterPills
            items={PILL_KEYS}
            value={activePill}
            onChange={setCategoryFilter}
            layoutId="atelier-pill"
            className="shrink-0"
          />

          <div className="hidden lg:block flex-1" />

          <div className="hidden md:flex items-center gap-2 shrink-0">
            <Eyebrow tone="muted" size="xs">
              {hasFilterActive
                ? `${String(articleCount).padStart(3, "0")} / ${String(totalCount).padStart(3, "0")}`
                : `${String(totalCount).padStart(3, "0")}`}{" "}
              articles
            </Eyebrow>
          </div>

          <div className="hidden lg:block flex-1" />

          {!isOffersListing && (
            <button
              type="button"
              onClick={() => setRefineOpen((o) => !o)}
              aria-pressed={refineOpen}
              className={`shrink-0 h-10 px-4 border se-label text-[10px] tracking-[0.18em] transition-colors se-focus flex items-center gap-2 ${
                refineOpen || refineActive
                  ? "bg-[#1c1b1b] border-[#f2ca50] text-[#f2ca50]"
                  : "bg-transparent border-[#4d4635] text-[#d0c5af] hover:border-[#99907c] hover:text-[#e5e2e1]"
              }`}
            >
              <SlidersHorizontal size={12} strokeWidth={1.75} />
              Refine
              {refineActive ? (
                <span className="ml-1 w-1.5 h-1.5 rounded-full bg-[#f2ca50]" />
              ) : null}
            </button>
          )}

          <button
            type="button"
            onClick={toggleInStock}
            aria-pressed={inStockOnly}
            className={`shrink-0 h-10 px-4 border se-label text-[10px] tracking-[0.18em] transition-colors se-focus ${
              inStockOnly
                ? "bg-[#1c1b1b] border-[#f2ca50] text-[#f2ca50]"
                : "bg-transparent border-[#4d4635] text-[#d0c5af] hover:border-[#99907c] hover:text-[#e5e2e1]"
            }`}
          >
            In stock
          </button>
          <button
            type="button"
            onClick={toggleLimited}
            aria-pressed={limitedOnly}
            className={`shrink-0 h-10 px-4 border se-label text-[10px] tracking-[0.18em] transition-colors se-focus ${
              limitedOnly
                ? "bg-[#1c1b1b] border-[#f2ca50] text-[#f2ca50]"
                : "bg-transparent border-[#4d4635] text-[#d0c5af] hover:border-[#99907c] hover:text-[#e5e2e1]"
            }`}
          >
            Limited
          </button>
          <SortDropdown
            options={SORT_OPTIONS}
            value={sortParam}
            onChange={setSort}
            label="Sort"
            className="shrink-0"
          />
        </div>

        {!isOffersListing && (
          <RefineRow
            open={refineOpen}
            selectedColors={colorsParam}
            selectedSizes={sizesParam}
            priceRange={[priceMinParam, priceMaxParam]}
            priceMin={PRICE_MIN}
            priceMax={PRICE_MAX}
            onToggleColor={toggleColor}
            onToggleSize={toggleSize}
            onChangePrice={setPriceRange}
            onClearAll={clearRefinements}
          />
        )}
      </div>

      {/* MAIN CONTENT */}
      <main className="px-5 md:px-12 max-w-7xl mx-auto py-12 md:py-16">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-32">
            <motion.div
              className="w-8 h-8 border-[3px] border-[#4d4635] border-t-[#f2ca50] rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, ease: "linear", repeat: Infinity }}
            />
            <span className="se-label mt-6 text-[#d0c5af] tracking-[0.2em] text-[10px]">
              LOADING ATELIER
            </span>
          </div>
        )}

        {!isLoading && error && (
          <div className="border border-[#93000a]/40 bg-[#93000a]/10 px-6 py-10 text-center">
            <Eyebrow tone="muted" size="md" className="text-[#ffb4ab]">
              Something went still
            </Eyebrow>
            <p className="mt-3 se-body text-sm text-[#ffb4ab]">{error}</p>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {filteredProducts.length === 0 && (
              <Reveal>
                <div className="border border-[#4d4635] bg-[#0e0e0e] px-8 py-16 md:py-20 text-center max-w-2xl mx-auto">
                  <Eyebrow tone="muted" size="xs">Nothing here yet</Eyebrow>
                  <h3 className="mt-4 se-serif text-[#e5e2e1] text-3xl md:text-4xl">
                    {hasFilterActive
                      ? "No pieces match these filters."
                      : "The chapter has yet to open."}
                  </h3>
                  <p className="mt-5 se-body text-sm md:text-base text-[#d0c5af] leading-relaxed">
                    {hasFilterActive
                      ? "Loosen the filters to see more pieces."
                      : "Read the journal for word of the next chapter."}
                  </p>
                  <div className="mt-8 flex flex-wrap justify-center gap-3">
                    {hasFilterActive ? (
                      <button
                        type="button"
                        onClick={clearAllFilters}
                        className="inline-flex"
                      >
                        <Btn variant="default" iconRight={ArrowRight}>
                          Clear filters
                        </Btn>
                      </button>
                    ) : (
                      <Link to="/about">
                        <Btn variant="outline" iconRight={ArrowRight}>
                          Read the journal
                        </Btn>
                      </Link>
                    )}
                  </div>
                </div>
              </Reveal>
            )}

            {filteredProducts.length > 0 && (
              <>
                {/* Featured highlight (skipped for tiny collections) */}
                {featuredProduct ? (
                  <FeaturedHighlightCard
                    product={featuredProduct}
                    eyebrow={
                      isOffersListing ? "Members Offer" : "Drop Exclusive"
                    }
                  />
                ) : null}

                {/* Premium product grid */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${categoryParam}-${filterParam}-${sortParam}-${inStockOnly}-${limitedOnly}-${colorsParam.join(",")}-${sizesParam.join(",")}-${priceMinParam}-${priceMaxParam}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-px bg-[#4d4635]/40 border border-[#4d4635]/40"
                  >
                    {visibleProducts.map((product, idx) => (
                      <ProductCard
                        key={product._id}
                        product={product}
                        index={idx}
                      />
                    ))}
                  </motion.div>
                </AnimatePresence>

                {/* Infinite-scroll sentinel — appends 12 at a time */}
                <LoadMoreSentinel
                  hasMore={hasMore}
                  onLoadMore={() =>
                    setVisibleCount((c) =>
                      Math.min(c + PAGE_SIZE, filteredProducts.length)
                    )
                  }
                  count={Math.min(
                    PAGE_SIZE,
                    Math.max(0, filteredProducts.length - visibleCount)
                  )}
                />
              </>
            )}
          </>
        )}
      </main>

      {/* COMMUNITY STYLING STRIP */}
      <CommunityStylingStrip />

      {/* CLOSING MARQUEE */}
      <Marquee
        tone="gold"
        items={[
          "Sent to ninety-three countries",
          "Made in Sri Lanka",
          "Hand-finished",
          "No restock",
          "Members enter first",
          "Rare fit, forever",
        ]}
      />
    </div>
  );
};

export default ProductListing;
