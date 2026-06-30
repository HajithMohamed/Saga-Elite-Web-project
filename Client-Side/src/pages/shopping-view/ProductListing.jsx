import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, X, ChevronRight } from "lucide-react";
import useLiveProductUpdates from "@/hooks/use-live-product-updates";
import { useSocketEvent } from "@/hooks/use-socket-events";
import { applyLiveProductUpdate } from "@/store/live-product-slice";
import { fetchCartAction } from "@/store/cart-slice";
import { toast } from "@/hooks/use-toast";
import { API_V1_URL as API_BASE } from "@/lib/api";
import { SortDropdown } from "@/components/ui/editorial";
import usePageMeta from "@/hooks/use-page-meta";
import FilterSidebar from "@/components/listing/FilterSidebar";
import EditorialProductGrid from "@/components/listing/EditorialProductGrid";
import Pagination from "@/components/common-components/Pagination";
import usePagination from "@/hooks/use-pagination";
import ProductGridSkeleton from "@/components/listing/ProductGridSkeleton";
import ForYouRail from "@/components/landing/ForYouRail";
import { Newsletter } from "@/components/landing/CommunitySections";

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

const ProductListing = () => {
  usePageMeta({ title: "Shop All Products" });
  
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refineOpen, setRefineOpen] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const liveProductUpdates = useSelector((state) => state.liveProduct.byId);

  const categoryParam = (searchParams.get("category") || "").toLowerCase();
  const subCategoryParam = (searchParams.get("subCategory") || "").toLowerCase();
  const categoryPathParam = (searchParams.get("categoryPath") || "").toLowerCase();
  const filterParam = (searchParams.get("filter") || "").toLowerCase();
  const sortParam = (searchParams.get("sort") || "new").toLowerCase();
  const inStockOnly = searchParams.get("stock") === "in";
  const limitedOnly = searchParams.get("limited") === "1";
  const isOffersListing = categoryParam === "offers" || filterParam === "offers";

  // Refinements
  const colorsParam = useMemo(() => (searchParams.get("colors") || "").split(",").map((c) => c.trim().toLowerCase()).filter(Boolean), [searchParams]);
  const sizesParam = useMemo(() => (searchParams.get("sizes") || "").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean), [searchParams]);
  const priceMinParam = Number(searchParams.get("min") || PRICE_MIN);
  const priceMaxParam = Number(searchParams.get("max") || PRICE_MAX);

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

  const removeFilterChip = (type, value) => {
    updateParams((p) => {
      if (type === "color") {
        const next = colorsParam.filter(c => c !== value);
        if (next.length) p.set("colors", next.join(",")); else p.delete("colors");
      }
      if (type === "size") {
        const next = sizesParam.filter(s => s !== value);
        if (next.length) p.set("sizes", next.join(",")); else p.delete("sizes");
      }
      if (type === "price") {
        p.delete("min");
        p.delete("max");
      }
    });
  };

  const clearAllFilters = () =>
    updateParams((p) => {
      p.delete("stock"); p.delete("limited"); p.delete("colors");
      p.delete("sizes"); p.delete("min"); p.delete("max");
    });

  const unitPrice = (product, variant) => {
    const base = product.basePrice + (variant?.priceAdjustment || 0);
    return base * (1 - (product.discountPercent || 0) / 100);
  };

  const sortedProducts = useMemo(() => {
    const list = [...products];
    if (sortParam === "price_low") list.sort((a, b) => unitPrice(a, a.variants?.[0]) - unitPrice(b, b.variants?.[0]));
    else if (sortParam === "price_high") list.sort((a, b) => unitPrice(b, b.variants?.[0]) - unitPrice(a, a.variants?.[0]));
    else if (sortParam === "best_selling") list.sort((a, b) => (Number(b.soldCount) || 0) - (Number(a.soldCount) || 0));
    else if (sortParam === "highest_rated") list.sort((a, b) => (Number(b.averageRating || b.rating) || 0) - (Number(a.averageRating || a.rating) || 0));
    else if (sortParam === "most_popular") list.sort((a, b) => (Number(b.wishCount) || 0) - (Number(a.wishCount) || 0));
    else if (sortParam === "discount") list.sort((a, b) => (Number(b.discountPercent) || 0) - (Number(a.discountPercent) || 0));
    else list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return list;
  }, [products, sortParam]);

  const filteredProducts = useMemo(() => {
    return sortedProducts
      .filter((p) => !inStockOnly || (p.variants || []).some((v) => Number(v?.stock || 0) > 0))
      .filter((p) => !limitedOnly || p.isLimited)
      .filter((p) => {
        if (!colorsParam.length) return true;
        return (p.variants || []).some((v) => colorsParam.includes(String(v?.color || "").toLowerCase()));
      })
      .filter((p) => {
        if (!sizesParam.length) return true;
        return (p.variants || []).some((v) => sizesParam.includes(String(v?.size || "").toUpperCase()));
      })
      .filter((p) => {
        const price = Number(p.basePrice || 0);
        return price >= priceMinParam && price <= priceMaxParam;
      });
  }, [sortedProducts, inStockOnly, limitedOnly, colorsParam, sizesParam, priceMinParam, priceMaxParam]);

  const { page, setPage, pageCount, total: totalProducts, pageItems: visibleProducts, pageSize: productPageSize } = usePagination(filteredProducts, PAGE_SIZE);

  useEffect(() => { setPage(1); }, [setPage, categoryParam, filterParam, inStockOnly, limitedOnly, colorsParam.join(","), sizesParam.join(","), priceMinParam, priceMaxParam]);

  useLiveProductUpdates((payload = {}) => products.some((product) => String(product._id) === String(payload.productId || "")));

  useEffect(() => { dispatch(fetchCartAction()); }, [dispatch]);

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
      if (categoryParam === "archive" || filterParam === "archive") query.set("status", "archive");
      else if (categoryParam) {
        query.set("category", categoryParam);
        if (subCategoryParam) query.set("subCategory", subCategoryParam);
        if (categoryPathParam) query.set("categoryPath", categoryPathParam);
      }
      const response = await axios.get(`${API_BASE}/products/get-all-products?${query.toString()}`);
      setProducts(response.data?.data || []);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Something went wrong";
      setError(msg);
      if (!silent) toast({ title: "Could not load pieces", description: msg, variant: "destructive" });
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [categoryParam, categoryPathParam, filterParam, isOffersListing, subCategoryParam]);

  useEffect(() => { fetchListingData(); }, [fetchListingData]);

  const refetchTimer = useRef(null);
  const debouncedRefetch = useCallback(() => {
    if (refetchTimer.current) clearTimeout(refetchTimer.current);
    refetchTimer.current = setTimeout(() => fetchListingData({ silent: true }), 250);
  }, [fetchListingData]);
  useEffect(() => () => { if (refetchTimer.current) clearTimeout(refetchTimer.current); }, []);

  useSocketEvent("product:created", debouncedRefetch, [debouncedRefetch]);
  useSocketEvent("product:deleted", debouncedRefetch, [debouncedRefetch]);

  useEffect(() => {
    if (!products.length) return;
    setProducts((current) => {
      let changed = false;
      const next = current.map((product) => {
        const patched = applyLiveProductUpdate(product, liveProductUpdates[String(product._id)]);
        if (patched !== product) changed = true;
        return patched;
      });
      return changed ? next : current;
    });
  }, [liveProductUpdates, products]);

  const totalCount = sortedProducts.length;
  const hasFilterActive = inStockOnly || limitedOnly || colorsParam.length > 0 || sizesParam.length > 0 || priceMinParam > PRICE_MIN || priceMaxParam < PRICE_MAX;

  const categoryTrail = useMemo(() => {
    if (isOffersListing) return [{ value: "offers", label: "Offers" }];
    if (categoryParam === "archive" || filterParam === "archive") return [{ value: "archive", label: "Archive" }];
    const pathSegments = categoryPathParam ? categoryPathParam.split("/").filter(Boolean) : [categoryParam, subCategoryParam].filter(Boolean);
    return pathSegments.map((segment) => ({ value: segment, label: formatCategoryLabel(segment) }));
  }, [categoryParam, categoryPathParam, filterParam, isOffersListing, subCategoryParam]);

  const heroTitle = categoryTrail.length ? categoryTrail[categoryTrail.length - 1].label : "Shop All Products";
  const heroSubtitle = categoryTrail.length ? `Discover our premium ${heroTitle.toLowerCase()} collection.` : "Browse our premium fashion collections for Men, Women and Unisex.";

  return (
    <div className="bg-[#0e0e0e] text-[#e5e2e1] min-h-screen pt-[64px] md:pt-[72px]">

      {/* ── HERO BANNER ── */}
      <section className="relative h-[240px] md:h-[320px] lg:h-[420px] overflow-hidden flex items-end justify-center w-full border-b border-white/5">
        <div className="absolute inset-0">
          <img src="/LOGO.png" alt={heroTitle} className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-[#0e0e0e]/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e]/50 to-transparent" />
        </div>
        <div className="relative z-10 w-full max-w-[1440px] px-4 md:px-8 pb-10">
          <nav className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#99907c] mb-4">
            <Link to="/" className="hover:text-[#F2CA50] transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to="/shopping/product-list" className="hover:text-[#F2CA50] transition-colors">Shop</Link>
            {categoryTrail.map((segment, index) => (
              <React.Fragment key={`${segment.value}-${index}`}>
                <ChevronRight className="w-3 h-3" />
                <Link to={buildListingUrl(categoryTrail.slice(0, index + 1).map((item) => item.value))} className={index === categoryTrail.length - 1 ? "text-[#fafafa] font-bold" : "hover:text-[#F2CA50] transition-colors"}>
                  {segment.label}
                </Link>
              </React.Fragment>
            ))}
          </nav>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="se-serif text-[#fafafa] text-4xl md:text-5xl lg:text-[56px] mb-3">
            {heroTitle}
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="se-body text-[#99907c] text-base md:text-lg max-w-2xl mb-6">
            {heroSubtitle}
          </motion.p>
        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 lg:py-16">
        <div className="flex flex-col lg:flex-row gap-12 items-start relative">
          
          {/* ── LEFT SIDEBAR (Filters) ── */}
          <div className="hidden lg:block w-[280px] shrink-0 sticky top-24 self-start">
             <FilterSidebar
                selectedColors={colorsParam}
                selectedSizes={sizesParam}
                priceRange={[priceMinParam, priceMaxParam]}
                onToggleColor={(c) => updateParams((p) => {
                  let arr = [...colorsParam];
                  if (arr.includes(c)) arr = arr.filter((x) => x !== c); else arr.push(c);
                  if (arr.length) p.set("colors", arr.join(",")); else p.delete("colors");
                })}
                onToggleSize={(s) => updateParams((p) => {
                  let arr = [...sizesParam];
                  if (arr.includes(s)) arr = arr.filter((x) => x !== s); else arr.push(s);
                  if (arr.length) p.set("sizes", arr.join(",")); else p.delete("sizes");
                })}
                onChangePrice={(v) => updateParams((p) => {
                  if (v[0] > PRICE_MIN) p.set("min", v[0]); else p.delete("min");
                  if (v[1] < PRICE_MAX) p.set("max", v[1]); else p.delete("max");
                })}
                onClearAll={clearAllFilters}
                priceMin={PRICE_MIN}
                priceMax={PRICE_MAX}
             />
          </div>

          {/* ── RIGHT PANE (Product Grid) ── */}
          <div className="flex-1 w-full min-w-0">
            {/* Top Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-white/5 pb-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="text-[#99907c] se-label text-[11px] uppercase tracking-widest">
                  Showing {totalProducts} Products
                </div>
                {/* Active Filter Chips */}
                {hasFilterActive && (
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="w-[1px] h-4 bg-white/10 hidden md:block" />
                    {colorsParam.map(c => (
                       <button key={`c-${c}`} onClick={() => removeFilterChip('color', c)} className="flex items-center gap-1.5 px-3 py-1 bg-[#1A1A1A] border border-white/10 rounded-full text-[10px] text-[#fafafa] uppercase tracking-wider hover:border-[#F2CA50]/50 transition-colors">
                         {c} <X className="w-3 h-3 text-[#99907c]" />
                       </button>
                    ))}
                    {sizesParam.map(s => (
                       <button key={`s-${s}`} onClick={() => removeFilterChip('size', s)} className="flex items-center gap-1.5 px-3 py-1 bg-[#1A1A1A] border border-white/10 rounded-full text-[10px] text-[#fafafa] uppercase tracking-wider hover:border-[#F2CA50]/50 transition-colors">
                         Size {s} <X className="w-3 h-3 text-[#99907c]" />
                       </button>
                    ))}
                    {(priceMinParam > PRICE_MIN || priceMaxParam < PRICE_MAX) && (
                       <button onClick={() => removeFilterChip('price')} className="flex items-center gap-1.5 px-3 py-1 bg-[#1A1A1A] border border-white/10 rounded-full text-[10px] text-[#fafafa] uppercase tracking-wider hover:border-[#F2CA50]/50 transition-colors">
                         Rs {priceMinParam} - {priceMaxParam} <X className="w-3 h-3 text-[#99907c]" />
                       </button>
                    )}
                    <button onClick={clearAllFilters} className="text-[10px] text-[#99907c] uppercase tracking-widest hover:text-[#F2CA50] ml-2">Clear All</button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                <SortDropdown
                  options={SORT_OPTIONS}
                  value={sortParam}
                  onChange={(v) => updateParams((p) => { if (v) p.set("sort", v); else p.delete("sort"); })}
                />
              </div>
            </div>

            {/* Mobile Filter Drawer */}
            <AnimatePresence>
              {refineOpen && (
                <>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden" onClick={() => setRefineOpen(false)} />
                  <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ duration: 0.3 }} className="fixed bottom-0 left-0 right-0 h-[90vh] bg-[#0e0e0e] border-t border-white/10 z-[101] rounded-t-[24px] lg:hidden flex flex-col">
                    <div className="flex justify-between items-center p-6 border-b border-white/5">
                      <span className="text-[#fafafa] font-bold tracking-widest uppercase text-sm">Filters</span>
                      <button onClick={() => setRefineOpen(false)} className="text-[#99907c] hover:text-[#F2CA50]"><X className="w-6 h-6" /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
                      <FilterSidebar
                        selectedColors={colorsParam} selectedSizes={sizesParam} priceRange={[priceMinParam, priceMaxParam]}
                        onToggleColor={(c) => updateParams((p) => { let arr = [...colorsParam]; if (arr.includes(c)) arr = arr.filter((x) => x !== c); else arr.push(c); if (arr.length) p.set("colors", arr.join(",")); else p.delete("colors"); })}
                        onToggleSize={(s) => updateParams((p) => { let arr = [...sizesParam]; if (arr.includes(s)) arr = arr.filter((x) => x !== s); else arr.push(s); if (arr.length) p.set("sizes", arr.join(",")); else p.delete("sizes"); })}
                        onChangePrice={(v) => updateParams((p) => { if (v[0] > PRICE_MIN) p.set("min", v[0]); else p.delete("min"); if (v[1] < PRICE_MAX) p.set("max", v[1]); else p.delete("max"); })}
                        onClearAll={clearAllFilters} priceMin={PRICE_MIN} priceMax={PRICE_MAX}
                      />
                    </div>
                    <div className="p-4 border-t border-white/5 bg-[#0e0e0e] flex gap-3 sticky bottom-0">
                      <button onClick={() => { clearAllFilters(); setRefineOpen(false); }} className="flex-1 py-4 border border-[#4d4635] text-[#e5e2e1] uppercase tracking-widest text-[11px] font-bold rounded-[16px]">Reset</button>
                      <button onClick={() => setRefineOpen(false)} className="flex-1 py-4 bg-[#F2CA50] text-[#0e0e0e] uppercase tracking-widest text-[11px] font-bold rounded-[16px]">Apply Options</button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Grid */}
            {isLoading ? (
              <ProductGridSkeleton count={8} featuredEvery={Infinity} />
            ) : filteredProducts.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-32 flex flex-col items-center justify-center text-center px-4">
                <div className="w-24 h-24 mb-6 border border-white/5 flex items-center justify-center rounded-full bg-[#1A1A1A]">
                  <span className="text-[#99907c] font-serif text-4xl">ø</span>
                </div>
                <h3 className="text-[#fafafa] se-serif text-[28px] mb-2">No Matches Found</h3>
                <p className="text-[#99907c] max-w-md mx-auto se-body text-[15px] mb-8">
                  We couldn't find any products matching your current filters.
                </p>
                <button onClick={clearAllFilters} className="h-[52px] px-8 bg-transparent border border-[#F2CA50] text-[#F2CA50] rounded-[16px] font-sans font-bold uppercase tracking-wider text-[12px] hover:bg-[#F2CA50] hover:text-[#0e0e0e] transition-colors">
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
                  <Pagination page={page} pageCount={pageCount} onPageChange={setPage} total={totalProducts} pageSize={productPageSize} label="products" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── STICKY MOBILE FILTER CTA ── */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
         <button
            onClick={() => setRefineOpen(true)}
            className="flex items-center gap-2 h-[48px] px-6 rounded-full bg-[#131313] border border-white/20 text-[#fafafa] shadow-[0_8px_30px_rgb(0,0,0,0.8)] font-sans font-bold uppercase tracking-wider text-[11px]"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#F2CA50]" />
            Filters
            {hasFilterActive && (
              <span className="w-2 h-2 rounded-full bg-[#F2CA50] ml-1" />
            )}
          </button>
      </div>

      {/* ── RECOMMENDATIONS & NEWSLETTER ── */}
      <ForYouRail variant="for-you" />
      <Newsletter />
    </div>
  );
};

export default ProductListing;