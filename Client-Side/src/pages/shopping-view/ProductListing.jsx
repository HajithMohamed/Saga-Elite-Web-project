
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Gift, ShoppingBag, SlidersHorizontal } from "lucide-react";
import useLiveProductUpdates from "@/hooks/use-live-product-updates";
import { useSocketEvent } from "@/hooks/use-socket-events";
import { applyLiveProductUpdate } from "@/store/live-product-slice";
import { fetchCartAction } from "@/store/cart-slice";
import { toast } from "@/hooks/use-toast";
import { API_V1_URL as API_BASE } from "@/lib/api";
import {
  Btn,
  Eyebrow,
  Marquee,
  Reveal,
  SortDropdown,
} from "@/components/ui/editorial";
import usePageMeta from "@/hooks/use-page-meta";
import FilterSidebar from "@/components/listing/FilterSidebar";
import LoadMoreSentinel from "@/components/listing/LoadMoreSentinel";

import EditorialProductGrid from "@/components/listing/EditorialProductGrid";
import Pagination from "@/components/common-components/Pagination";
import usePagination from "@/hooks/use-pagination";
import ProductGridSkeleton from "@/components/listing/ProductGridSkeleton";

// category slugs are passed via `?category=<slug>`; backend resolves slug or legacy string

const formatCategoryLabel = (value = "") =>
  String(value)
    .replace(/[-_]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const buildListingUrl = (segments = []) => {
  const query = new URLSearchParams();
  if (segments[0]) query.set("category", segments[0]);
  if (segments[1]) query.set("subCategory", segments[1]);
  if (segments.length > 2) query.set("categoryPath", segments.join("/"));
  return `/shopping/product-list?${query.toString()}`;
};

const SORT_OPTIONS = [
  { value: "new", label: "Newest" },
  { value: "best_selling", label: "Best Selling" },
  { value: "highest_rated", label: "Highest Rated" },
  { value: "price_low", label: "Price Low → High" },
  { value: "price_high", label: "Price High → Low" },
  { value: "most_popular", label: "Most Popular" },
  { value: "discount", label: "Discount %" },
];



const PAGE_SIZE = 12;
const FETCH_LIMIT = 60;
const PRICE_MIN = 0;
const PRICE_MAX = 50000;
const MotionDiv = motion.div;

const ProductListing = () => {
  usePageMeta({ title: "Shop" });
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refineOpen, setRefineOpen] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const liveProductUpdates = useSelector((state) => state.liveProduct.byId);
  const cartCount = useSelector(
    (state) => state.cart?.cart?.totalQuantity || 0
  );

  const categoryParam = (searchParams.get("category") || "").toLowerCase();
  const subCategoryParam = (searchParams.get("subCategory") || "").toLowerCase();
  const categoryPathParam = (searchParams.get("categoryPath") || "").toLowerCase();
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
  const colorsKey = colorsParam.join(",");
  const sizesKey = sizesParam.join(",");

  // /shopping/drops is the dedicated drops page now — redirect old links.
  useEffect(() => {
    if (categoryParam === "drops" || filterParam === "drops") {
      navigate("/shopping/drops", { replace: true });
    }
  }, [categoryParam, filterParam, navigate]);

  const updateParams = (mutator) => {
    const next = new URLSearchParams(searchParams);
    mutator(next);
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
      list.sort((a, b) => unitPrice(a, a.variants?.[0]) - unitPrice(b, b.variants?.[0]));
    } else if (sortParam === "price_high") {
      list.sort((a, b) => unitPrice(b, b.variants?.[0]) - unitPrice(a, a.variants?.[0]));
    } else if (sortParam === "best_selling") {
      list.sort((a, b) => (Number(b.soldCount) || 0) - (Number(a.soldCount) || 0));
    } else if (sortParam === "highest_rated") {
      list.sort((a, b) => (Number(b.averageRating || b.rating) || 0) - (Number(a.averageRating || a.rating) || 0));
    } else if (sortParam === "most_popular") {
      list.sort((a, b) => (Number(b.wishCount) || 0) - (Number(a.wishCount) || 0));
    } else if (sortParam === "discount") {
      list.sort((a, b) => (Number(b.discountPercent) || 0) - (Number(a.discountPercent) || 0));
    } else {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
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

  const {
    page,
    setPage,
    pageCount,
    total: totalProducts,
    pageItems: visibleProducts,
    pageSize: productPageSize,
  } = usePagination(filteredProducts, PAGE_SIZE);

  // Reset to the first page whenever the result set changes.
  useEffect(() => {
    setPage(1);
  }, [
    setPage,
    categoryParam,
    filterParam,
    inStockOnly,
    limitedOnly,
    colorsKey,
    sizesKey,
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

  const fetchListingData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setIsLoading(true);
    setError(null);

    try {
      if (isOffersListing) {
        const response = await axios.get(`${API_BASE}/offers`);
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
              discountPercent: offer.discountPercent ?? product.discountPercent,
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
      } else if (categoryParam) {
        // pass through the slug or legacy string; backend will resolve
        query.set("category", categoryParam);
        if (subCategoryParam) {
          query.set("subCategory", subCategoryParam);
        }
        if (categoryPathParam) {
          query.set("categoryPath", categoryPathParam);
        }
      }

      const response = await axios.get(
        `${API_BASE}/products/get-all-products?${query.toString()}`
      );
      setProducts(response.data?.data || []);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Something went wrong";
      setError(msg);
      if (!silent) {
        toast({
          title: "Could not load pieces",
          description: msg,
          variant: "destructive",
        });
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [categoryParam, categoryPathParam, filterParam, isOffersListing, subCategoryParam]);

  useEffect(() => {
    fetchListingData();
  }, [fetchListingData]);

  // Real-time refetch on product create/delete (Fix #3). Updates are still
  // patched in-place by useLiveProductUpdates above.
  const refetchTimer = useRef(null);
  const debouncedRefetch = useCallback(() => {
    if (refetchTimer.current) clearTimeout(refetchTimer.current);
    refetchTimer.current = setTimeout(() => fetchListingData({ silent: true }), 250);
  }, [fetchListingData]);
  useEffect(() => () => {
    if (refetchTimer.current) clearTimeout(refetchTimer.current);
  }, []);

  useSocketEvent("product:created", debouncedRefetch, [debouncedRefetch]);
  useSocketEvent("product:deleted", debouncedRefetch, [debouncedRefetch]);

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
  const categoryTrail = useMemo(() => {
    if (isOffersListing) return [{ value: "offers", label: "Offers" }];
    if (categoryParam === "archive" || filterParam === "archive") {
      return [{ value: "archive", label: "Archive" }];
    }

    const pathSegments = categoryPathParam
      ? categoryPathParam.split("/").filter(Boolean)
      : [categoryParam, subCategoryParam].filter(Boolean);

    return pathSegments.map((segment) => ({
      value: segment,
      label: formatCategoryLabel(segment),
    }));
  }, [categoryParam, categoryPathParam, filterParam, isOffersListing, subCategoryParam]);

  return (
    <div className="bg-[#0a0a0a] text-[#e5e2e1] se-body min-h-screen pt-20">

      {/* Breadcrumb & Hero Container */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 mb-8">
        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] md:text-[11px] uppercase tracking-widest text-[#99907c] mb-6 mt-4">
          <Link to="/" className="hover:text-[#f2ca50] transition-colors">Home</Link>
          <span className="text-[#4d4635]">{'>'}</span>
          <Link to="/shopping/product-list" className="hover:text-[#f2ca50] transition-colors">Shop</Link>
          {categoryTrail.map((segment, index) => (
            <React.Fragment key={`${segment.value}-${index}`}>
              <span className="text-[#4d4635]">{'>'}</span>
              <Link
                to={buildListingUrl(categoryTrail.slice(0, index + 1).map((item) => item.value))}
                className={index === categoryTrail.length - 1 ? "text-[#f2ca50] font-bold" : "hover:text-[#f2ca50] transition-colors"}
              >
                {segment.label}
              </Link>
            </React.Fragment>
          ))}
        </div>

        {/* Category Hero */}
        <div className="relative w-full h-[220px] md:h-[260px] lg:h-[320px] rounded-[20px] overflow-hidden shadow-2xl mb-12">
          {/* Banner Image */}
          <img 
            src="/LOGO.png" 
            alt="Category Banner" 
            className="absolute inset-0 w-full h-full object-contain opacity-10 blur-sm"
          />
          {/* Dark Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-[#0a0a0a]/30" />
          
          {/* Hero Content */}
          <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 lg:p-12">
            <h1 className="font-sans font-bold text-3xl md:text-4xl lg:text-[48px] text-[#e5e2e1] mb-2 md:mb-4 tracking-tight uppercase">
              {categoryTrail.length ? categoryTrail[categoryTrail.length - 1].label : "All Products"} Collection
            </h1>
            <p className="text-sm md:text-base lg:text-[18px] text-[#d0c5af] max-w-2xl leading-relaxed mb-4">
              Discover premium {categoryTrail.length ? categoryTrail[categoryTrail.length - 1].label.toLowerCase() : "fashion"} curated for every occasion.
            </p>
            <div className="flex items-center gap-3 mt-auto lg:mt-4">
              <span className="se-label text-[10px] md:text-[12px] text-[#f2ca50] font-bold tracking-[0.2em] uppercase bg-[#131313]/80 backdrop-blur-md px-4 py-2 rounded-full border border-[#f2ca50]/30">
                Showing {totalCount} Products
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout container */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 pb-8 lg:pb-16 pt-0">
        <div className="flex flex-col lg:flex-row gap-12 items-start relative">
          
          {/* Main Product Grid (Left Pane) */}
          <div className="flex-1 w-full min-w-0">
            {/* Top Bar inside main pane */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-white/5 pb-6">
              <div className="text-[#99907c] se-label text-[11px] uppercase tracking-widest">
                {totalCount} Products Found
              </div>
              <div className="flex items-center gap-4">
                <SortDropdown
                  options={SORT_OPTIONS}
                  value={sortParam}
                  onChange={(v) => {
                    const p = new URLSearchParams(searchParams);
                    if (v) p.set("sort", v);
                    else p.delete("sort");
                    setSearchParams(p);
                  }}
                />
                {/* Mobile Filter Toggle */}
                <button
                  onClick={() => setRefineOpen(!refineOpen)}
                  className="lg:hidden flex items-center gap-2 se-label tracking-widest text-[10px] uppercase text-[#e5e2e1] bg-[#131313] px-4 py-3 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-[#4d4635]/40"
                >
                  <SlidersHorizontal size={14} />
                  Filters
                  {hasFilterActive && (
                    <span className="ml-1 w-2 h-2 rounded-full bg-[#f2ca50]" />
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Filter Drawer / Inline content could go here, for now relying on right sidebar on desktop */}
            {/* Mobile Filter Drawer */}
            <AnimatePresence>
              {refineOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden"
                    onClick={() => setRefineOpen(false)}
                  />
                  <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ duration: 0.3 }}
                    className="fixed bottom-0 left-0 right-0 h-[90vh] bg-[#0a0a0a] border-t border-[#D4AF37]/20 z-[101] rounded-t-2xl lg:hidden flex flex-col"
                  >
                    <div className="flex justify-between items-center p-4 border-b border-white/5">
                      <span className="text-white font-bold tracking-widest uppercase text-sm">Filters</span>
                      <button onClick={() => setRefineOpen(false)} className="text-[#99907c] hover:text-white uppercase tracking-wider text-[10px]">Close</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
                      <FilterSidebar
                        selectedColors={colorsParam}
                        selectedSizes={sizesParam}
                        priceRange={[priceMinParam, priceMaxParam]}
                        onToggleColor={(c) => {
                          const p = new URLSearchParams(searchParams);
                          let arr = [...colorsParam];
                          if (arr.includes(c)) arr = arr.filter((x) => x !== c);
                          else arr.push(c);
                          if (arr.length) p.set("colors", arr.join(","));
                          else p.delete("colors");
                          setSearchParams(p);
                        }}
                        onToggleSize={(s) => {
                          const p = new URLSearchParams(searchParams);
                          let arr = [...sizesParam];
                          if (arr.includes(s)) arr = arr.filter((x) => x !== s);
                          else arr.push(s);
                          if (arr.length) p.set("sizes", arr.join(","));
                          else p.delete("sizes");
                          setSearchParams(p);
                        }}
                        onChangePrice={(v) => {
                          const p = new URLSearchParams(searchParams);
                          if (v[0] > PRICE_MIN) p.set("min", v[0]); else p.delete("min");
                          if (v[1] < PRICE_MAX) p.set("max", v[1]); else p.delete("max");
                          setSearchParams(p);
                        }}
                        onClearAll={() => clearAllFilters()}
                        priceMin={PRICE_MIN}
                        priceMax={PRICE_MAX}
                      />
                    </div>
                    <div className="p-4 border-t border-white/5 bg-[#0a0a0a] flex gap-3 sticky bottom-0">
                      <button 
                        onClick={() => { clearAllFilters(); setRefineOpen(false); }}
                        className="flex-1 py-4 border border-[#4d4635] text-[#e5e2e1] uppercase tracking-widest text-[11px] font-bold rounded-xl hover:bg-white/5 transition-colors"
                      >
                        Reset
                      </button>
                      <button 
                        onClick={() => setRefineOpen(false)}
                        className="flex-1 py-4 bg-[#f2ca50] text-[#0a0a0a] uppercase tracking-widest text-[11px] font-bold rounded-xl hover:brightness-110 transition-all"
                      >
                        Apply Options
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {isLoading ? (
              <ProductGridSkeleton count={8} featuredEvery={Infinity} />
            ) : filteredProducts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-32 flex flex-col items-center justify-center text-center px-4"
              >
                <div className="w-24 h-24 mb-6 border border-[#4d4635] flex items-center justify-center rounded-sm bg-[#131313]/50">
                  <span className="text-[#4d4635] text-4xl">ø</span>
                </div>
                <h3 className="text-[#e5e2e1] se-display text-2xl uppercase tracking-widest mb-2 font-bold">
                  NO MATCHES FOUND
                </h3>
                <p className="text-[#99907c] max-w-md mx-auto se-body text-sm">
                  Try exploring another collection or reducing your filter criteria.
                </p>
                <button
                  onClick={() => clearAllFilters()}
                  className="mt-8 px-8 py-3 bg-transparent border border-[#d4af37]/40 text-[#f2ca50] se-label text-[11px] uppercase tracking-widest hover:bg-[#d4af37]/10 transition-colors"
                >
                  Clear Filters
                </button>
              </motion.div>
            ) : (
              <div>
                <EditorialProductGrid
                  products={visibleProducts}
                  featuredEvery={filteredProducts.length < 6 ? Infinity : 7}
                  motionKey={[categoryParam, subCategoryParam, categoryPathParam, filterParam, sortParam].join("|")}
                />
                


                <div className="mt-12">
                  <Pagination
                    page={page}
                    pageCount={pageCount}
                    onPageChange={setPage}
                    total={totalProducts}
                    pageSize={productPageSize}
                    label="products"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar (Desktop only) */}
          <div className="hidden lg:block w-[320px] shrink-0 sticky top-24 self-start h-max">
             <FilterSidebar
                selectedColors={colorsParam}
                selectedSizes={sizesParam}
                priceRange={[priceMinParam, priceMaxParam]}
                onToggleColor={(c) => {
                  const p = new URLSearchParams(searchParams);
                  let arr = [...colorsParam];
                  if (arr.includes(c)) arr = arr.filter((x) => x !== c);
                  else arr.push(c);
                  if (arr.length) p.set("colors", arr.join(","));
                  else p.delete("colors");
                  setSearchParams(p);
                }}
                onToggleSize={(s) => {
                  const p = new URLSearchParams(searchParams);
                  let arr = [...sizesParam];
                  if (arr.includes(s)) arr = arr.filter((x) => x !== s);
                  else arr.push(s);
                  if (arr.length) p.set("sizes", arr.join(","));
                  else p.delete("sizes");
                  setSearchParams(p);
                }}
                onChangePrice={(v) => {
                  const p = new URLSearchParams(searchParams);
                  if (v[0] > PRICE_MIN) p.set("min", v[0]); else p.delete("min");
                  if (v[1] < PRICE_MAX) p.set("max", v[1]); else p.delete("max");
                  setSearchParams(p);
                }}
                onClearAll={() => clearAllFilters()}
                priceMin={PRICE_MIN}
                priceMax={PRICE_MAX}
             />
          </div>
        </div>
      </div>
    </div>
  );
}
export default ProductListing;