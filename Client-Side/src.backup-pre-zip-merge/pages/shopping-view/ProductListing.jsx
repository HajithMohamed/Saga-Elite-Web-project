import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams, Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  addToCartAction,
  addToWishlistAction,
  removeFromWishlistAction,
  fetchCartAction,
} from "@/store/cart-slice";
import useLiveProductUpdates from "@/hooks/use-live-product-updates";
import { applyLiveProductUpdate } from "@/store/live-product-slice";
import { toast } from "@/hooks/use-toast";
import { Heart, ShoppingBag, ArrowRight, Package } from "lucide-react";
import { API_V1_URL as API_BASE } from "@/lib/api";
const CATEGORY_LABELS = {
  boys: "Boys",
  girls: "Girls",
  unisex: "Unisex",
};

const ProductListing = () => {
  const [products, setProducts] = useState([]);
  const [drops, setDrops] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedVariants, setSelectedVariants] = useState({});
  const [quantities, setQuantities] = useState({});
  const [pendingBuyNow, setPendingBuyNow] = useState(null);

  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const wishlistItems = useSelector((state) => state.cart.wishlist?.items ?? []);
  const cartItems = useSelector((state) => state.cart.cart?.items ?? []);
  const liveProductUpdates = useSelector((state) => state.liveProduct.byId);
  const categoryParam = (searchParams.get("category") || "").toLowerCase();
  const sortParam = (searchParams.get("sort") || "new").toLowerCase();
  const isDropListing = categoryParam === "drops";

  const setCategoryFilter = (key) => {
    if (key === "all") navigate("/shopping/product-list");
    else navigate(`/shopping/product-list?category=${key}`);
  };

  const setSort = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value === "new") next.delete("sort");
    else next.set("sort", value);
    const qs = next.toString();
    navigate(qs ? `${location.pathname}?${qs}` : location.pathname);
  };

  const pillKeys = [
    { key: "all", label: "All" },
    { key: "boys", label: "Boys" },
    { key: "girls", label: "Girls" },
    { key: "unisex", label: "Unisex" },
    { key: "drops", label: "Drops" },
  ];

  const activePill =
    categoryParam === "drops"
      ? "drops"
      : CATEGORY_LABELS[categoryParam]
        ? categoryParam
        : "all";

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
        (a, b) =>
          new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
    }
    return list;
  }, [products, sortParam]);

  const isNewProduct = (product) => {
    const created = product.createdAt ? new Date(product.createdAt) : null;
    if (!created || Number.isNaN(created.getTime())) return false;
    return Date.now() - created.getTime() < 7 * 86400000;
  };

  useLiveProductUpdates(
    (payload = {}) =>
      products.some((product) => String(product._id) === String(payload.productId || ""))
  );

  useEffect(() => {
    dispatch(fetchCartAction());
  }, [dispatch]);

  useEffect(() => {
    const fetchListingData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (isDropListing) {
          const response = await axios.get(`${API_BASE}/drops/get-all-drops`);
          const activeDrops = Array.isArray(response.data?.drops)
            ? response.data.drops.filter(
                (drop) => !drop?.endDate || new Date(drop.endDate) > new Date()
              )
            : [];

          setDrops(activeDrops);
          setProducts([]);
          return;
        }

        const query = new URLSearchParams({ limit: "30" });

        if (categoryParam === "archive") {
          query.set("status", "archive");
        } else if (CATEGORY_LABELS[categoryParam]) {
          query.set("category", CATEGORY_LABELS[categoryParam]);
        }

        const response = await axios.get(
          `${API_BASE}/products/get-all-products?${query.toString()}`
        );

        setProducts(response.data.data || []);
        setDrops([]);
      } catch (error) {
        setError(error?.response?.data?.message || error.message);

        toast({
          title: isDropListing ? "Could not load drops" : "Could not load products",
          description:
            error?.response?.data?.message || error.message || "Something went wrong",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchListingData();
  }, [categoryParam, isDropListing]);

  useEffect(() => {
    if (!products.length) return;

    setProducts((currentProducts) => {
      let hasChanges = false;

      const nextProducts = currentProducts.map((product) => {
        const patchedProduct = applyLiveProductUpdate(
          product,
          liveProductUpdates[String(product._id)]
        );

        if (patchedProduct !== product) {
          hasChanges = true;
        }

        return patchedProduct;
      });

      return hasChanges ? nextProducts : currentProducts;
    });
  }, [liveProductUpdates, products]);

  const handleVariantChange = (productId, sku) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [productId]: sku,
    }));
  };

  const handleQuantityChange = (productId, value) => {
    const qty = Math.max(1, Number(value) || 1);
    setQuantities((prev) => ({
      ...prev,
      [productId]: qty,
    }));
  };

  const handleAddToCart = (product) => {
    const variantSku =
      selectedVariants[product._id] || product.variants?.[0]?.sku;

    const variant = product.variants.find((v) => v.sku === variantSku);

    if (!variant) {
      toast({
        title: "Variant missing",
        description: "Please select a valid product variant.",
        variant: "destructive",
      });
      return;
    }

    const quantity = quantities[product._id] || 1;

    if (quantity > variant.stock) {
      toast({
        title: "Stock limit reached",
        description: `Only ${variant.stock} items available.`,
        variant: "destructive",
      });
      return;
    }

    dispatch(
      addToCartAction({
        productId: product._id,
        variantId: variant._id,
        quantity,
      })
    )
      .unwrap()
      .then(() => {
        toast({
          title: "Added to cart",
          description: `${product.name} added successfully.`,
          variant: "success",
        });
      })
      .catch((err) => {
        toast({
          title: "Failed to add",
          description: err?.message || err || "Could not add to cart.",
          variant: "destructive",
        });
      });
  };

  const handleBuyNow = (product) => {
    const variantSku = selectedVariants[product._id] || product.variants?.[0]?.sku;
    const variant = product.variants.find((v) => v.sku === variantSku);

    if (!variant || (quantities[product._id] || 1) > variant.stock) {
      toast({
        title: "Stock limit reached or invalid variant",
        variant: "destructive",
      });
      return;
    }

    const quantity = quantities[product._id] || 1;

    const alreadyInCart = cartItems.some(
      (item) =>
        (item.product?.id || item.product?._id) === product._id &&
        item.variant?.sku === variant.sku
    );

    if (alreadyInCart) {
      setPendingBuyNow({ product, variant, quantity });
      return;
    }

    navigate("/shopping/checkout", {
      state: { buyNowItem: { product, variant, quantity } },
    });
  };

  const handleViewCartSummary = () => {
    setPendingBuyNow(null);
    navigate("/shopping/cart");
  };

  const handleProceedWithItem = () => {
    if (!pendingBuyNow) return;
    navigate("/shopping/checkout", {
      state: { buyNowItem: pendingBuyNow },
    });
    setPendingBuyNow(null);
  };

  const toggleWishlist = (product) => {
    const isInWishlist = wishlistItems.some((item) => item.id === product._id);
    if (isInWishlist) {
      dispatch(removeFromWishlistAction(product._id));
      toast({ title: "Removed from Wishlist" });
    } else {
      dispatch(addToWishlistAction({ productId: product._id }));
      toast({ title: "Added to Wishlist", variant: "success" });
    }
  };

  const pageTitle = isDropListing
    ? "Shop the Drops"
    : categoryParam === "archive"
      ? "Archive Products"
      : CATEGORY_LABELS[categoryParam]
        ? `${CATEGORY_LABELS[categoryParam]} Products`
        : "Shop the Drop";

  const pageDescription = isDropListing
    ? "Browse every active drop, then open a specific drop to view the products inside it."
    : "Browse products, choose variants, and add to cart.";

  return (
    <div className="min-h-screen bg-background py-10 text-on-surface">
      <div className="container mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-widest">
              {pageTitle}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {pageDescription}
            </p>
          </div>
        </div>

        {!isDropListing ? (
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {pillKeys.map((pill) => (
                <button
                  key={pill.key}
                  type="button"
                  onClick={() => setCategoryFilter(pill.key)}
                  className={`relative rounded-full px-4 py-2 text-xs uppercase tracking-widest ${
                    activePill === pill.key
                      ? "text-black"
                      : "border border-[#D4AF37]/60 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                  }`}
                >
                  {activePill === pill.key ? (
                    <motion.span
                      layoutId="category-pill"
                      className="absolute inset-0 rounded-full bg-[#D4AF37]"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  ) : null}
                  <span className="relative z-10">{pill.label}</span>
                </button>
              ))}
            </div>
            <select
              value={
                sortParam === "price_low"
                  ? "price_low"
                  : sortParam === "price_high"
                    ? "price_high"
                    : "new"
              }
              onChange={(e) => setSort(e.target.value)}
              className="rounded-lg border border-[#D4AF37]/40 bg-surface-container-low px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            >
              <option value="new">New</option>
              <option value="price_low">Price Low–High</option>
              <option value="price_high">Price High–Low</option>
            </select>
          </div>
        ) : null}

        {/* Loading */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-80 animate-pulse rounded-3xl bg-[#111]"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-500/30 bg-[#111] p-6 text-red-300">
            {error}
          </div>
        ) : isDropListing ? (
          drops.length === 0 ? (
            <div className="rounded-3xl border border-gray-800 bg-[#111] p-10 text-center text-gray-400">
              No active drops found.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {drops.map((drop) => (
                <Link
                  key={drop._id || drop.slug}
                  to={`/shopping/drop/${drop.slug}`}
                  className="group relative overflow-hidden rounded-[2rem] border border-white/5 bg-gradient-to-b from-[#0a0a0a] to-[#040404] p-5 shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-[#D4AF37]/5"
                >
                  <div className="relative h-72 overflow-hidden rounded-2xl bg-[#000]">
                    <img
                      src={drop.images?.[0]?.url || "/placeholder.jpg"}
                      className="h-full w-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                      alt={drop.name}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute left-4 top-4 rounded-full border border-[#D4AF37]/30 bg-black/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4AF37] backdrop-blur-md">
                      Drop
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-xs uppercase tracking-[0.25em] text-gray-300">
                        {drop.releaseDate
                          ? `Release ${new Date(drop.releaseDate).toLocaleDateString()}`
                          : "Available now"}
                      </p>
                      <h2 className="mt-2 text-2xl font-medium tracking-wide text-white">
                        {drop.name}
                      </h2>
                    </div>
                  </div>

                  <div className="pt-6 space-y-4">
                    <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
                      {drop.description || "Open this drop to explore every product in the release."}
                    </p>

                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span>{drop.products?.length ?? 0} products</span>
                      <span className="inline-flex items-center gap-1 font-semibold uppercase tracking-widest text-[#D4AF37]">
                        View Drop <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : products.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center rounded-3xl border border-border bg-surface-container-low p-12 text-center"
          >
            <Package className="mb-4 h-12 w-12 text-[#D4AF37]" />
            <p className="text-muted-foreground">No products found.</p>
            <Link
              to="/shopping/product-list"
              className="mt-6 rounded-full bg-[#D4AF37] px-8 py-3 text-xs font-bold uppercase tracking-widest text-black"
            >
              Browse all products
            </Link>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${categoryParam}-${sortParam}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
            >
            {sortedProducts.map((product, index) => {
              const variantSku =
                selectedVariants[product._id] ||
                product.variants?.[0]?.sku;

              const variant =
                product.variants.find((v) => v.sku === variantSku) ||
                product.variants?.[0];

              const quantity = quantities[product._id] || 1;

              const basePrice =
                product.basePrice +
                (variant?.priceAdjustment || 0);

              const price = unitPrice(product, variant);
              const discountPct = Number(product.discountPercent || 0);

              return (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  whileHover={{ y: -4 }}
                  className="group relative overflow-hidden rounded-[2rem] border border-border bg-surface-container-low p-5 shadow-lg dark:border-white/5 dark:bg-gradient-to-b dark:from-[#0a0a0a] dark:to-[#040404]"
                >
                  <div className="relative h-64 overflow-hidden rounded-2xl bg-black">
                    <img
                      src={
                        product.images?.[0]?.url ||
                        "/placeholder.jpg"
                      }
                      className="h-full w-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                      alt={product.name}
                    />
                    {isNewProduct(product) ? (
                      <span className="absolute left-3 top-3 z-20 rounded bg-[#D4AF37] px-2 py-0.5 text-[10px] font-bold uppercase text-black">
                        New
                      </span>
                    ) : null}
                    {discountPct > 0 ? (
                      <span className="absolute right-3 top-3 z-20 rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                        Sale
                      </span>
                    ) : null}
                    <button
                      onClick={() => toggleWishlist(product)}
                      className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-md transition-colors hover:bg-[#D4AF37]/20"
                    >
                      <Heart
                        className={`h-5 w-5 ${
                          wishlistItems.some((item) => item.id === product._id)
                            ? "fill-[#D4AF37] text-[#D4AF37]"
                            : "text-white"
                        }`}
                      />
                    </button>
                    <Link
                      to={`/shopping/product/${product.slug}`}
                      className="absolute bottom-4 left-4 z-10 flex h-8 items-center gap-1 rounded-full bg-black/60 px-4 text-xs font-semibold uppercase tracking-wider backdrop-blur-md transition-colors hover:bg-[#D4AF37] hover:text-black"
                    >
                      Details <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>

                  <div className="pt-6 space-y-4">
                    <div>
                      <div className="flex justify-between items-start">
                        <p className="text-xs text-[#D4AF37] font-bold uppercase tracking-widest">
                          {product.category}
                        </p>
                        {product.isLimited && (
                          <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37] border border-[#D4AF37]/30 px-2 py-0.5 rounded-full bg-[#D4AF37]/10">
                            Limited Drop
                          </span>
                        )}
                      </div>
                      <h2 className="mt-2 text-xl font-medium tracking-wide">
                        {product.name}
                      </h2>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.25em] text-gray-500">
                        {product.drop?.name || "Independent Release"}
                      </p>
                      <p className="mt-1 text-sm text-gray-400 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Variant */}
                      <select
                        value={variantSku}
                        onChange={(e) =>
                          handleVariantChange(
                            product._id,
                            e.target.value
                          )
                        }
                        className="w-2/3 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-gray-200 outline-none transition-colors focus:border-[#D4AF37]/50 focus:bg-white/10 text-black"
                      >
                        {product.variants.map((v) => (
                          <option key={v.sku} value={v.sku} className="text-black">
                            {v.size} / {v.color} ({v.stock} left)
                          </option>
                        ))}
                      </select>

                      {/* Quantity */}
                      <input
                        type="number"
                        min="1"
                        max={variant?.stock || 1}
                        value={quantity}
                        onChange={(e) =>
                          handleQuantityChange(
                            product._id,
                            e.target.value
                          )
                        }
                        className="w-1/3 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-center text-gray-200 outline-none transition-colors focus:border-[#D4AF37]/50 focus:bg-white/10"
                      />
                    </div>

                    {/* Price & Actions */}
                    <div className="pt-2 flex flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-wide">
                        <span className="text-[#D4AF37]">
                          LKR {price.toLocaleString()}
                        </span>
                        {discountPct > 0 ? (
                          <span className="text-sm text-gray-500 line-through">
                            LKR {basePrice.toLocaleString()}
                          </span>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        className="flex w-full rounded-xl bg-[#D4AF37]/90 py-3 text-sm font-bold uppercase tracking-widest text-black transition-colors hover:bg-[#D4AF37] md:hidden"
                      >
                        Add to Cart
                      </button>

                      <div className="hidden items-center gap-3 md:flex">
                        <button
                          type="button"
                          onClick={() => handleBuyNow(product)}
                          className="flex-1 rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-bold uppercase tracking-widest text-black transition-colors hover:bg-[#F2CA50]"
                        >
                          Buy Now
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddToCart(product)}
                          className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white transition-colors hover:bg-white/20 dark:bg-white/10"
                          title="Add to Cart"
                        >
                          <ShoppingBag className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-3 md:hidden">
                        <button
                          type="button"
                          onClick={() => handleBuyNow(product)}
                          className="flex-1 rounded-xl border border-[#D4AF37]/50 py-3 text-sm font-bold uppercase tracking-widest text-[#D4AF37]"
                        >
                          Buy Now
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {pendingBuyNow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-800 bg-[#111] p-6">
            <h3 className="mb-4 text-xl font-bold">Product Already in Cart</h3>
            <p className="mb-6 text-gray-400">
              This product is already in your cart. Do you want to continue with your cart items or buy this as a new direct checkout?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleViewCartSummary}
                className="flex-1 rounded-lg bg-gray-700 py-3 font-bold text-white transition-colors hover:bg-gray-600"
              >
                View Cart Summary
              </button>
              <button
                onClick={handleProceedWithItem}
                className="flex-1 rounded-lg bg-[#D4AF37] py-3 font-bold text-black transition-colors hover:bg-[#F2CA50]"
              >
                Buy This Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductListing;
