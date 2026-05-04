import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  addToCartAction,
  addToWishlistAction,
  removeFromWishlistAction,
} from "@/store/cart-slice";
import useLiveProductUpdates from "@/hooks/use-live-product-updates";
import { applyLiveProductUpdate } from "@/store/live-product-slice";
import { toast } from "@/hooks/use-toast";
import {
  Heart,
  Loader2,
  ArrowLeft,
  ShieldCheck,
  Truck,
  RefreshCcw,
  ArrowRight,
  Check,
} from "lucide-react";
import StarRating from "@/components/Review/StarRating";
import ReviewCard, { ReviewCardSkeleton } from "@/components/Review/ReviewCard";
import VariantSelectors, {
  getColorsForSize,
  getProductSizes,
  getVariantBySelection,
} from "@/components/shopping-components/VariantSelectors";

import { API_V1_URL as API_BASE } from "@/lib/api";
const FALLBACK_DROP_NAME = "Independent Release";

const mergePopularProducts = (mostWished = [], bestSellers = [], currentSlug) => {
  const productMap = new Map();

  [...bestSellers, ...mostWished].forEach((item) => {
    if (!item?._id || item.slug === currentSlug) return;

    const existing = productMap.get(item._id) || {
      ...item,
      popularityScore: 0,
    };

    existing.popularityScore += (item.soldCount || 0) + (item.wishCount || 0);
    productMap.set(item._id, { ...existing, ...item, popularityScore: existing.popularityScore });
  });

  return [...productMap.values()]
    .sort((a, b) => b.popularityScore - a.popularityScore)
    .slice(0, 4);
};

const ProductDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const wishlistItems = useSelector((state) => state.cart.wishlist?.items ?? []);
  const cartItems = useSelector((state) => state.cart.cart?.items ?? []);
  const liveProductUpdates = useSelector((state) => state.liveProduct.byId);

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVariantSku, setSelectedVariantSku] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showBuyNowModal, setShowBuyNowModal] = useState(false);
  const [latestProducts, setLatestProducts] = useState([]);
  const [famousProducts, setFamousProducts] = useState([]);
  const [showcaseError, setShowcaseError] = useState(null);
  const [reviewPreview, setReviewPreview] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [variantErrors, setVariantErrors] = useState({});
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [productTab, setProductTab] = useState("description");
  const [cartAddedPulse, setCartAddedPulse] = useState(false);

  useLiveProductUpdates(
    (payload = {}) => String(product?._id || "") === String(payload.productId || "")
  );

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setShowcaseError(null);

        const [productRes, latestRes, wishedRes, soldRes] = await Promise.allSettled([
          axios.get(`${API_BASE}/products/get-single-product/${slug}`),
          axios.get(`${API_BASE}/products/get-all-products?limit=4&sort=-createdAt`),
          axios.get(`${API_BASE}/products/get-all-products?limit=6&sort=-wishCount`),
          axios.get(`${API_BASE}/products/get-all-products?limit=6&sort=-soldCount`),
        ]);

        if (productRes.status !== "fulfilled") {
          throw productRes.reason;
        }

        const fetchedProduct = productRes.value.data?.product;
        setProduct(fetchedProduct);

        if (
          latestRes.status === "fulfilled" &&
          wishedRes.status === "fulfilled" &&
          soldRes.status === "fulfilled"
        ) {
          const latest = (latestRes.value.data?.data || [])
            .filter((item) => item.slug !== slug)
            .slice(0, 4);

          const popular = mergePopularProducts(
            wishedRes.value.data?.data || [],
            soldRes.value.data?.data || [],
            slug
          );

          setLatestProducts(latest);
          setFamousProducts(popular);
        } else {
          setLatestProducts([]);
          setFamousProducts([]);
          setShowcaseError("Could not load latest and popular products.");
        }
      } catch (err) {
        setError(
          err.response?.data?.message || err.message || "Failed to load product"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  useEffect(() => {
    if (!product?.variants?.length) return;

    const firstAvailableVariant =
      product.variants.find((variant) => variant.stock > 0) || product.variants[0];

    setSelectedVariantSku((currentSku) =>
      currentSku && product.variants.some((variant) => variant.sku === currentSku)
        ? currentSku
        : firstAvailableVariant?.sku || ""
    );
  }, [product]);

  useEffect(() => {
    if (!product?.variants?.length || !selectedVariantSku) return;

    const matchedVariant = product.variants.find(
      (variant) => variant.sku === selectedVariantSku
    );

    if (!matchedVariant) return;

    setSelectedSize(matchedVariant.size || "");
    setSelectedColor(matchedVariant.color || "");
    setQuantity((current) =>
      Math.max(1, Math.min(current, matchedVariant.stock || 1))
    );
  }, [product, selectedVariantSku]);

  useEffect(() => {
    const fetchReviewPreview = async () => {
      if (!product?._id) return;
      try {
        setReviewLoading(true);
        const response = await axios.get(
          `${API_BASE}/reviews/product/${product._id}?sort=recent&page=1&limit=3`
        );
        setReviewPreview(response.data?.reviews || []);
        setReviewStats(response.data?.stats || null);
      } catch (err) {
        setReviewPreview([]);
        setReviewStats(null);
      } finally {
        setReviewLoading(false);
      }
    };

    fetchReviewPreview();
  }, [product?._id]);

  useEffect(() => {
    if (!product?._id) return;

    const liveUpdate = liveProductUpdates[String(product._id)];
    if (!liveUpdate) return;

    setProduct((currentProduct) => applyLiveProductUpdate(currentProduct, liveUpdate));
  }, [liveProductUpdates, product?._id]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <Loader2 className="h-12 w-12 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#060606] flex flex-col items-center justify-center text-white">
        <p className="text-xl text-red-500 mb-6">{error || "Product not found"}</p>
        <Link
          to="/shopping/product-list"
          className="bg-white/10 px-6 py-3 rounded-full hover:bg-white/20"
        >
          Back to Shop
        </Link>
      </div>
    );
  }

  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
  const selectedVariant = hasVariants
    ? product.variants.find((variant) => variant.sku === selectedVariantSku) || null
    : null;
  const basePrice = product.basePrice + (selectedVariant?.priceAdjustment || 0);
  const price = basePrice * (1 - (product.discountPercent || 0) / 100);
  const inWishlist = wishlistItems.some((item) => item.id === product._id);
  const productDropName = product.drop?.name || FALLBACK_DROP_NAME;
  const productSizes = getProductSizes(product);
  const colorsForSelectedSize = getColorsForSize(product, selectedSize);

  const validateVariantSelection = () => {
    if (!hasVariants) {
      setVariantErrors({});
      return true;
    }
    const nextErrors = {};

    if (productSizes.length > 0 && !selectedSize) {
      nextErrors.size = "Please choose a size.";
    }

    if (colorsForSelectedSize.length > 0 && !selectedColor) {
      nextErrors.color = "Please choose a color.";
    }

    setVariantErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSizeChange = (size) => {
    const nextColors = getColorsForSize(product, size);
    const preservedColor = nextColors.includes(selectedColor) ? selectedColor : "";
    const autoSelectedColor =
      preservedColor || (nextColors.length === 1 ? nextColors[0] : "");
    const matchedVariant = autoSelectedColor
      ? getVariantBySelection(product, size, autoSelectedColor)
      : null;

    setSelectedSize(size);
    setSelectedColor(autoSelectedColor);
    setSelectedVariantSku(matchedVariant?.sku || "");
    setVariantErrors((current) => ({ ...current, size: "", color: "" }));
  };

  const handleColorChange = (color) => {
    const matchedVariant = getVariantBySelection(product, selectedSize, color);

    setSelectedColor(color);
    setSelectedVariantSku(matchedVariant?.sku || "");
    setVariantErrors((current) => ({ ...current, color: "" }));
  };

  const handleAddToCart = () => {
    if (!hasVariants) {
      toast({
        title: "Unavailable",
        description:
          "This listing has no variants yet. Please contact us on WhatsApp.",
        variant: "destructive",
      });
      return;
    }
    if (!validateVariantSelection() || !selectedVariant) return;

    dispatch(
      addToCartAction({
        productId: product._id,
        variantId: selectedVariant._id,
        quantity,
      })
    )
      .unwrap()
      .then(() => {
        setCartAddedPulse(true);
        setTimeout(() => setCartAddedPulse(false), 1500);
        toast({
          title: "In the bag",
          description: `${product.name} added.`,
          variant: "success",
        });
      })
      .catch((err) =>
        toast({ title: "Error", description: err, variant: "destructive" })
      );
  };

  const handleBuyNow = () => {
    if (!hasVariants) {
      toast({
        title: "Unavailable",
        description:
          "This listing has no variants yet. Please contact us on WhatsApp.",
        variant: "destructive",
      });
      return;
    }
    if (!validateVariantSelection() || !selectedVariant) return;

    const isInCart = cartItems.some(
      (item) =>
        (item.product?.id || item.product?._id) === product._id &&
        item.variant?.sku === selectedVariant.sku
    );

    if (isInCart) {
      setShowBuyNowModal(true);
      return;
    }

    navigate("/shopping/checkout", {
      state: {
        buyNowItem: { product, variant: selectedVariant, quantity },
      },
    });
  };

  const handleViewCartSummary = () => {
    setShowBuyNowModal(false);
    navigate("/shopping/cart");
  };

  const handleProceedWithItem = () => {
    setShowBuyNowModal(false);
    navigate("/shopping/checkout", {
      state: {
        buyNowItem: { product, variant: selectedVariant, quantity },
      },
    });
  };

  const toggleWishlist = () => {
    if (inWishlist) {
      dispatch(removeFromWishlistAction(product._id));
      toast({ title: "Removed from Wishlist" });
    } else {
      dispatch(addToWishlistAction({ productId: product._id }));
      toast({ title: "Saved to Wishlist", variant: "success" });
    }
  };

  const renderShowcaseCard = (item) => {
    const itemDropName = item.drop?.name || FALLBACK_DROP_NAME;
    const itemPrice = item.basePrice * (1 - (item.discountPercent || 0) / 100);

    return (
      <Link
        key={item._id}
        to={`/shopping/product/${item.slug}`}
        className="group rounded-[2rem] border border-white/5 bg-[#0d0d0d] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/30"
      >
        <div className="relative mb-4 overflow-hidden rounded-[1.5rem] bg-[#111] aspect-[4/5]">
          <img
            src={item.images?.[0]?.url || "/placeholder.jpg"}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-[#D4AF37] backdrop-blur-md">
            {itemDropName}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.25em] text-gray-500">
            {item.category}
          </p>
          <h3 className="text-lg font-semibold text-white transition-colors group-hover:text-[#D4AF37]">
            {item.name}
          </h3>
          <p className="text-sm text-gray-400 line-clamp-2">
            {item.description || "Signature Saga Elite release."}
          </p>
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm font-semibold text-white">
              LKR {itemPrice.toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
              View <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#060606] text-white pt-24 pb-20">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white uppercase tracking-widest mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          <div className="flex flex-col-reverse lg:flex-row gap-4 lg:gap-6 lg:h-[70vh]">
            <div className="flex lg:flex-col gap-4 overflow-x-auto lg:overflow-y-auto no-scrollbar pb-2 lg:pb-0 lg:w-24 shrink-0">
              {product.images?.map((img, i) => (
                <button
                  key={img._id}
                  onClick={() => setActiveImageIndex(i)}
                  className={`relative shrink-0 rounded-xl overflow-hidden border-2 w-20 lg:w-24 aspect-[4/5] ${
                    activeImageIndex === i
                      ? "border-[#D4AF37]"
                      : "border-transparent opacity-50 hover:opacity-100"
                  }`}
                >
                  <img
                    src={img.url}
                    alt={`View ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>

            <div className="relative flex-1 overflow-hidden rounded-[2rem] bg-[#111] aspect-[4/5] lg:aspect-auto">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImageIndex}
                  src={
                    product.images?.[activeImageIndex]?.url || "/placeholder.jpg"
                  }
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.28 }}
                  className="pointer-events-none h-full w-full object-cover"
                  alt={product.name}
                />
              </AnimatePresence>
              <button
                type="button"
                className="absolute inset-0 z-[1] cursor-zoom-in bg-transparent"
                aria-label="Open image preview"
                onClick={() => setLightboxOpen(true)}
              />
              <button
                type="button"
                onClick={toggleWishlist}
                className="absolute top-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-black/40 backdrop-blur-xl transition hover:bg-black/80"
              >
                <Heart
                  className={`w-6 h-6 ${
                    inWishlist ? "fill-[#D4AF37] text-[#D4AF37]" : "text-white"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex flex-col justify-center py-4">
            <p className="text-[#D4AF37] font-bold uppercase tracking-[0.2em] text-sm mb-3">
              {product.category} {product.isLimited && "• Limited Drop"}
            </p>
            <h1 className="font-serif text-4xl font-bold tracking-tight md:text-5xl mb-2">
              {product.name}
            </h1>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <StarRating value={product.averageRating || 0} readOnly size="sm" />
              <span className="text-xs text-gray-400">
                {(product.averageRating || 0).toFixed(1)} avg ·{" "}
                {product.reviewCount || 0} reviews
              </span>
              <Link
                to={`/product/${product._id}/reviews`}
                className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] hover:underline"
              >
                See all
              </Link>
            </div>
            <p className="text-gray-500 uppercase tracking-widest text-xs mb-4">
              Art No. {product.artNo}
            </p>
            <p className="mb-8 text-sm uppercase tracking-[0.25em] text-gray-400">
              Drop: <span className="text-[#D4AF37]">{productDropName}</span>
            </p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="mb-6 flex flex-wrap items-baseline gap-4"
            >
              <span className="text-3xl font-semibold text-[#D4AF37]">
                LKR {price.toLocaleString()}
              </span>
              {product.discountPercent > 0 && (
                <span className="text-xl text-gray-500 line-through">
                  LKR {basePrice.toLocaleString()}
                </span>
              )}
            </motion.div>

            {hasVariants && selectedVariant ? (
              <p className="mb-8 text-sm font-medium">
                {selectedVariant.stock === 0 ? (
                  <span className="text-red-500">Out of Stock</span>
                ) : selectedVariant.stock < 5 ? (
                  <span className="text-amber-500">
                    Only {selectedVariant.stock} left in stock
                  </span>
                ) : (
                  <span className="text-emerald-500">In Stock</span>
                )}
              </p>
            ) : !hasVariants ? (
              <p className="mb-8 text-sm text-gray-400">One size fits all</p>
            ) : null}

            <div className="space-y-6 mb-10">
              <div>
                {hasVariants ? (
                  <>
                    <div className="mb-3 flex justify-between text-sm font-semibold uppercase tracking-widest text-gray-400">
                      <span>Size & Color</span>
                      <span>Stock: {selectedVariant?.stock ?? 0}</span>
                    </div>
                    <VariantSelectors
                      product={{ ...product, sizes: productSizes }}
                      selectedSize={selectedSize}
                      selectedColor={selectedColor}
                      onSizeChange={handleSizeChange}
                      onColorChange={handleColorChange}
                      errors={variantErrors}
                    />
                    {selectedSize && selectedColor ? (
                      <p className="mt-3 text-xs text-gray-500">
                        {selectedVariant?.stock ?? 0} in stock
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="text-sm text-gray-400">One size fits all</p>
                )}

              </div>

              <div>
                <label className="block mb-3 text-sm font-semibold uppercase tracking-widest text-gray-400">
                  Quantity
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-gray-800 rounded-full bg-[#111] w-32 h-12">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="flex-1 text-xl text-gray-400 hover:text-white"
                    >
                      -
                    </button>
                    <span className="font-semibold">{quantity}</span>
                    <button
                      onClick={() =>
                        setQuantity(
                          Math.min(selectedVariant?.stock || 1, quantity + 1)
                        )
                      }
                      className="flex-1 text-xl text-gray-400 hover:text-white"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-10 flex flex-col gap-4 sm:flex-row">
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={handleAddToCart}
                disabled={
                  !hasVariants ||
                  !selectedVariant ||
                  selectedVariant.stock === 0
                }
                className={`flex h-14 flex-1 items-center justify-center gap-2 rounded-full uppercase tracking-widest text-sm font-bold transition-colors disabled:opacity-50 ${
                  cartAddedPulse
                    ? "bg-emerald-600 text-white"
                    : "bg-white/10 hover:bg-white/20"
                }`}
              >
                {cartAddedPulse ? (
                  <>
                    <Check className="h-5 w-5" /> Added
                  </>
                ) : (
                  "Add To Cart"
                )}
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={handleBuyNow}
                disabled={
                  !hasVariants ||
                  !selectedVariant ||
                  selectedVariant.stock === 0
                }
                className="flex h-14 flex-1 items-center justify-center rounded-full bg-[#D4AF37] text-black transition-colors hover:bg-[#F2CA50] uppercase tracking-widest text-sm font-bold disabled:opacity-50"
              >
                Buy Now
              </motion.button>
            </div>

            <div className="mb-10">
              <div className="mb-4 flex flex-wrap gap-2 border-b border-gray-800 pb-2">
                {[
                  { id: "description", label: "Description" },
                  { id: "size", label: "Size Guide" },
                  { id: "reviews", label: "Reviews" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setProductTab(tab.id)}
                    className={`rounded-full px-4 py-2 text-xs uppercase tracking-widest transition-colors ${
                      productTab === tab.id
                        ? "bg-[#D4AF37] text-black"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={productTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                  className="min-h-[120px] text-gray-400 leading-relaxed"
                >
                  {productTab === "description" ? (
                    <p>{product.description || "No description provided."}</p>
                  ) : null}
                  {productTab === "size" ? (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[280px] text-left text-sm text-on-surface dark:text-gray-300">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="py-2 pr-4">Size</th>
                            <th className="py-2 pr-4">Chest (cm)</th>
                            <th className="py-2">Length (cm)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            ["XS", "86–91", "66"],
                            ["S", "91–96", "68"],
                            ["M", "96–101", "70"],
                            ["L", "101–106", "72"],
                            ["XL", "106–111", "74"],
                          ].map(([sz, c, l]) => (
                            <tr key={sz} className="border-b border-gray-800/80">
                              <td className="py-2 pr-4">{sz}</td>
                              <td className="py-2 pr-4">{c}</td>
                              <td className="py-2">{l}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p className="mt-3 text-xs text-gray-500">
                        Generic Sri Lanka sizing — measurements are approximate.
                      </p>
                    </div>
                  ) : null}
                  {productTab === "reviews" ? (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <p className="text-sm">
                          {reviewStats?.averageRating || 0} average ·{" "}
                          {reviewStats?.totalReviews || 0} reviews
                        </p>
                        <Link
                          to={`/product/${product._id}/reviews`}
                          className="text-xs uppercase tracking-widest text-[#D4AF37] hover:underline"
                        >
                          See all reviews
                        </Link>
                      </div>
                      {reviewLoading ? (
                        <div className="space-y-4">
                          {Array.from({ length: 2 }).map((_, index) => (
                            <ReviewCardSkeleton key={index} />
                          ))}
                        </div>
                      ) : reviewPreview.length === 0 ? (
                        <p>No reviews yet. Be the first to review.</p>
                      ) : (
                        <div className="space-y-4">
                          {reviewPreview.map((review) => (
                            <ReviewCard key={review._id} review={review} />
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-gray-800/50">
              <div className="flex flex-col items-center text-center gap-2 text-gray-400">
                <Truck className="w-6 h-6 text-[#D4AF37]" />
                <span className="text-xs uppercase tracking-widest">
                  Fast Delivery
                </span>
              </div>
              <div className="flex flex-col items-center text-center gap-2 text-gray-400">
                <ShieldCheck className="w-6 h-6 text-[#D4AF37]" />
                <span className="text-xs uppercase tracking-widest">
                  Secure Checkout
                </span>
              </div>
              <div className="flex flex-col items-center text-center gap-2 text-gray-400">
                <RefreshCcw className="w-6 h-6 text-[#D4AF37]" />
                <span className="text-xs uppercase tracking-widest">
                  Free Returns
                </span>
              </div>
            </div>
          </div>
        </div>

        <motion.section
          className="mt-24 grid gap-10"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.45 }}
        >
          <div>
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#D4AF37]">
                  New in Store
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight">
                  Latest Products
                </h2>
              </div>
              <Link
                to="/shopping/product-list"
                className="text-sm uppercase tracking-widest text-gray-400 transition-colors hover:text-[#D4AF37]"
              >
                View all
              </Link>
            </div>

            {latestProducts.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {latestProducts.map(renderShowcaseCard)}
              </div>
            ) : (
              <div className="rounded-[2rem] border border-white/5 bg-[#0d0d0d] p-6 text-gray-400">
                {showcaseError || "No latest products to show right now."}
              </div>
            )}
          </div>

          <div>
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#D4AF37]">
                Popular Picks
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">
                Most Wished & Bought
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-gray-400">
                These products are pulled from wishlist and purchase activity,
                with their drop names when available and a fallback for products
                without a drop.
              </p>
            </div>

            {famousProducts.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {famousProducts.map(renderShowcaseCard)}
              </div>
            ) : (
              <div className="rounded-[2rem] border border-white/5 bg-[#0d0d0d] p-6 text-gray-400">
                {showcaseError || "No popular products to show right now."}
              </div>
            )}
          </div>
        </motion.section>

        <AnimatePresence>
          {lightboxOpen ? (
            <motion.div
              role="presentation"
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLightboxOpen(false)}
            >
              <motion.img
                src={
                  product.images?.[activeImageIndex]?.url || "/placeholder.jpg"
                }
                alt={product.name}
                className="max-h-[90vh] max-w-full object-contain"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ duration: 0.25 }}
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

        {showBuyNowModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#111] rounded-xl p-6 border border-gray-800 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Product Already in Cart</h3>
              <p className="text-gray-400 mb-6">
                This product is already in your cart. Do you want to continue
                with your cart items or buy this as a new direct checkout?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleViewCartSummary}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-bold transition-colors"
                >
                  View Cart Summary
                </button>
                <button
                  onClick={handleProceedWithItem}
                  className="flex-1 bg-[#D4AF37] hover:bg-[#F2CA50] text-black py-3 rounded-lg font-bold transition-colors"
                >
                  Buy This Item
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;
