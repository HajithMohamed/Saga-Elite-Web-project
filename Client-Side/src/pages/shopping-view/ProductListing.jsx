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
import { ArrowRight, ArrowUpRight } from "lucide-react";
import useLiveProductUpdates from "@/hooks/use-live-product-updates";
import { applyLiveProductUpdate } from "@/store/live-product-slice";
import { fetchCartAction } from "@/store/cart-slice";
import { toast } from "@/hooks/use-toast";
import { API_V1_URL as API_BASE } from "@/lib/api";
import {
  Btn,
  Countdown,
  Eyebrow,
  FilterPills,
  Hairline,
  Marquee,
  Reveal,
  SortDropdown,
  StatusBadge,
} from "@/components/ui/editorial";
import usePageMeta from "@/hooks/use-page-meta";
import ProductCard from "@/components/shopping-components/ProductCard";

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

const formatLKR = (value = 0) =>
  `LKR ${(Number(value) || 0).toLocaleString("en-LK", {
    maximumFractionDigits: 0,
  })}`;

const ProductListing = () => {
  usePageMeta({ title: "Shop" });
  const [products, setProducts] = useState([]);
  const [drops, setDrops] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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
  const isDropListing = categoryParam === "drops" || filterParam === "drops";

  const activePill =
    categoryParam === "drops" || filterParam === "drops"
      ? "drops"
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
    const next = new URLSearchParams();
    if (key === "archive") next.set("filter", key);
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

  const clearFilters = () =>
    updateParams((p) => {
      p.delete("stock");
      p.delete("limited");
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
      .filter((p) => !limitedOnly || p.isLimited);
  }, [sortedProducts, inStockOnly, limitedOnly]);

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
        if (isDropListing) {
          const response = await axios.get(`${API_BASE}/drops/get-all-drops`);
          if (cancelled) return;
          const allDrops = Array.isArray(response.data?.drops)
            ? response.data.drops
            : [];
          setDrops(allDrops);
          setProducts([]);
          return;
        }

        const query = new URLSearchParams({ limit: "30" });
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
        setDrops([]);
      } catch (err) {
        if (cancelled) return;
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Something went wrong";
        setError(msg);
        toast({
          title: isDropListing ? "Could not load drops" : "Could not load pieces",
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
  }, [categoryParam, filterParam, isDropListing]);

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
  const hasFilterActive = inStockOnly || limitedOnly;
  const cappedAtThirty = sortedProducts.length === 30;

  return (
    <div className="bg-[#0a0a0a] text-[#e5e2e1] se-body min-h-screen">
      {/* STICKY FILTER RAIL */}
      <div className="sticky top-16 z-30 bg-[#0a0a0a]/90 backdrop-blur-md border-y border-[#4d4635]/40">
        <div className="px-5 md:px-12 max-w-7xl mx-auto py-3 md:py-4 flex items-center gap-3 md:gap-6 overflow-x-auto custom-scrollbar">
          {/* Pills */}
          <FilterPills
            items={PILL_KEYS}
            value={activePill}
            onChange={setCategoryFilter}
            layoutId="atelier-pill"
            className="shrink-0"
          />

          <div className="hidden lg:block flex-1" />

          {/* Center count */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <Eyebrow tone="muted" size="xs">
              {hasFilterActive
                ? `${String(articleCount).padStart(3, "0")} / ${String(totalCount).padStart(3, "0")}`
                : `${String(totalCount).padStart(3, "0")}`}{" "}
              articles
            </Eyebrow>
          </div>

          <div className="hidden lg:block flex-1" />

          {/* Toggles + sort */}
          {!isDropListing && (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="px-5 md:px-12 max-w-7xl mx-auto py-12 md:py-16">
        {/* LOADING */}
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

        {/* ERROR */}
        {!isLoading && error && (
          <div className="border border-[#93000a]/40 bg-[#93000a]/10 px-6 py-10 text-center">
            <Eyebrow tone="muted" size="md" className="text-[#ffb4ab]">
              Something went still
            </Eyebrow>
            <p className="mt-3 se-body text-sm text-[#ffb4ab]">{error}</p>
          </div>
        )}

        {/* DROPS SUB-MODE — alternating 7/5 lookbook */}
        {!isLoading && !error && isDropListing && (
          <DropsLookbook drops={drops} />
        )}

        {/* PRODUCT GRID */}
        {!isLoading && !error && !isDropListing && (
          <>
            {/* Empty state */}
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
                        onClick={clearFilters}
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

            {/* Grid */}
            {filteredProducts.length > 0 && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${categoryParam}-${sortParam}-${inStockOnly}-${limitedOnly}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-px bg-[#4d4635]/40 border border-[#4d4635]/40"
                >
                  {filteredProducts.map((product, idx) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      index={idx}
                    />
                  ))}
                </motion.div>
              </AnimatePresence>
            )}

            {/* End-of-chapter CTA */}
            {filteredProducts.length > 0 && cappedAtThirty && (
              <Reveal>
                <div className="mt-16 md:mt-24 border border-[#4d4635] bg-[#0e0e0e]">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-8 md:p-12 items-end">
                    <div className="lg:col-span-8">
                      <Eyebrow tone="gold" size="md">
                        Eighty-four pieces, then a new chapter
                      </Eyebrow>
                      <h2 className="mt-4 se-serif text-[#e5e2e1] leading-[1.0] text-3xl md:text-5xl">
                        Read the archive.
                      </h2>
                      <p className="mt-5 se-body text-[#d0c5af] text-sm md:text-base max-w-xl leading-relaxed">
                        Every chapter that has closed. Held for record — nothing
                        restocks, nothing returns. Members may request a private
                        viewing of any single archived piece.
                      </p>
                    </div>
                    <div className="lg:col-span-4 flex flex-wrap items-center gap-3 lg:justify-end">
                      <Link to="/shopping/product-list?category=archive">
                        <Btn variant="outline" iconRight={ArrowRight}>
                          Browse the archive
                        </Btn>
                      </Link>
                    </div>
                  </div>
                </div>
              </Reveal>
            )}
          </>
        )}
      </main>

      {/* CLOSING MARQUEE — sits above the global footer */}
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

// ─── DROPS LOOKBOOK ──────────────────────────────────────────────────────────
const DropsLookbook = ({ drops }) => {
  if (!drops || drops.length === 0) {
    return (
      <Reveal>
        <div className="border border-[#4d4635] bg-[#0e0e0e] px-8 py-16 md:py-20 text-center max-w-2xl mx-auto">
          <Eyebrow tone="muted" size="xs">Between chapters</Eyebrow>
          <h3 className="mt-4 se-serif text-[#e5e2e1] text-3xl md:text-4xl">
            No drops live just now.
          </h3>
          <p className="mt-5 se-body text-sm md:text-base text-[#d0c5af] leading-relaxed">
            The next chapter opens soon. Members will hear first.
          </p>
          <div className="mt-8">
            <Link to="/auth/register">
              <Btn variant="default" iconRight={ArrowRight}>
                Become a member
              </Btn>
            </Link>
          </div>
        </div>
      </Reveal>
    );
  }

  return (
    <div className="space-y-16 md:space-y-24">
      {drops.map((drop, i) => {
        const release = drop?.releaseDate ? new Date(drop.releaseDate) : null;
        const end = drop?.endDate ? new Date(drop.endDate) : null;
        const now = Date.now();
        const isUpcoming = release && release.getTime() > now;
        const isLive =
          (!release || release.getTime() <= now) &&
          (!end || end.getTime() > now);
        const isExpired = end && end.getTime() < now;

        const target = isUpcoming ? release : end;
        const mirror = i % 2 === 1;

        return (
          <Reveal key={drop._id || drop.slug || i}>
            <article
              className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 ${
                isExpired ? "opacity-80" : ""
              }`}
            >
              {/* IMAGE */}
              <Link
                to={`/shopping/drop/${drop.slug}`}
                className={`lg:col-span-7 group relative overflow-hidden border border-[#4d4635] hover:border-[#99907c] transition-colors ${
                  mirror ? "lg:order-2" : ""
                }`}
                style={{ aspectRatio: "16/10" }}
              >
                <img
                  src={drop?.images?.[0]?.url || "/LOGO.png"}
                  alt={drop?.name || "Drop"}
                  loading={i < 2 ? "eager" : "lazy"}
                  className={`w-full h-full object-cover transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] ${
                    isExpired ? "grayscale" : ""
                  }`}
                  draggable={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/70 via-transparent to-transparent" />
                <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
                  <span className="bg-[#0a0a0a]/85 backdrop-blur-sm border border-[#4d4635] px-3 py-1.5 se-label text-[9px] tracking-[0.32em] text-[#f2ca50]">
                    Chapter · {String(i + 1).padStart(2, "0")}
                  </span>
                  {isExpired && <StatusBadge status="archived" />}
                  {isLive && <StatusBadge status="live" />}
                  {isUpcoming && <StatusBadge status="pending" label="Soon" />}
                </div>
                <div className="absolute bottom-4 right-4">
                  <ArrowUpRight
                    size={20}
                    strokeWidth={1.25}
                    className="text-[#f2ca50] transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                  />
                </div>
              </Link>

              {/* COPY */}
              <div
                className={`lg:col-span-5 flex flex-col justify-end pb-2 lg:pb-6 ${
                  mirror ? "lg:order-1" : ""
                }`}
              >
                <Eyebrow tone="muted" size="xs">
                  {drop?.products?.length ?? 0} pieces
                </Eyebrow>
                <h3 className="mt-3 se-serif text-[#e5e2e1] text-3xl md:text-4xl lg:text-5xl leading-tight">
                  {drop?.name || "Untitled chapter"}
                </h3>
                <Hairline className="mt-5 max-w-[60px]" tone="strong" />
                <p className="mt-5 se-body text-sm md:text-base text-[#d0c5af] leading-relaxed max-w-md line-clamp-3">
                  {drop?.description ||
                    "Open the chapter to read every piece in this release."}
                </p>

                {/* Status / Countdown */}
                <div className="mt-7">
                  {isUpcoming && target && (
                    <Countdown
                      target={target}
                      variant="compact"
                      showSeconds={false}
                      eyebrow="Opens in"
                    />
                  )}
                  {isLive && target && (
                    <Countdown
                      target={target}
                      variant="compact"
                      showSeconds={false}
                      eyebrow="Closes in"
                    />
                  )}
                  {isExpired && (
                    <Eyebrow tone="muted" size="xs">
                      The chapter has passed.
                    </Eyebrow>
                  )}
                </div>

                <div className="mt-7 flex items-center gap-4">
                  <Link to={`/shopping/drop/${drop.slug}`}>
                    <Btn variant="outline" iconRight={ArrowRight}>
                      Open the chapter
                    </Btn>
                  </Link>
                </div>
              </div>
            </article>
          </Reveal>
        );
      })}
    </div>
  );
};

export default ProductListing;
