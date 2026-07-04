import React, { useEffect, useMemo, useState } from "react";
import {
  motion,
  AnimatePresence,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import axios from "axios";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  addToCartAction,
  addToWishlistAction,
  removeFromWishlistAction,
} from "@/store/cart-slice";
import useLiveProductUpdates from "@/hooks/use-live-product-updates";
import { useSocketEvent } from "@/hooks/use-socket-events";
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
  ChevronDown,
  Check,
  Waves, 
  RotateCw, 
  Palette, 
  DropletOff, 
  Wind, 
  Sun, 
  Thermometer, 
  Ban, 
  CloudSun, 
  Sparkles,
  Tag,
} from "lucide-react";
import { useProductOffers } from "@/hooks/use-product-offers";

// Size guides are stored as plain text; rows written as "S | 91-96 | 68"
// become a real table, everything else stays as prose paragraphs.
const parseSizeGuide = (text) => {
  const lines = String(text || "").split(/\r?\n/);
  const blocks = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const isTableRow = line.includes("|") && line.split("|").length >= 2;

    if (isTableRow) {
      const cells = line.split("|").map((cell) => cell.trim());
      const last = blocks[blocks.length - 1];
      if (last?.type === "table") last.rows.push(cells);
      else blocks.push({ type: "table", rows: [cells] });
    } else if (line) {
      const last = blocks[blocks.length - 1];
      if (last?.type === "text") last.lines.push(line);
      else blocks.push({ type: "text", lines: [line] });
    }
  }

  return blocks;
};

const SizeGuideContent = ({ text }) => {
  const blocks = useMemo(() => parseSizeGuide(text), [text]);

  return (
    <div className="space-y-4 text-cream">
      {blocks.map((block, blockIndex) =>
        block.type === "table" ? (
          <div key={blockIndex} className="overflow-x-auto rounded-xl border border-line/40">
            <table className="w-full min-w-[320px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-gold/10">
                  {block.rows[0].map((cell, i) => (
                    <th key={i} className="px-4 py-3 font-bold uppercase tracking-wider text-[11px] text-gold-ink border-b border-line/40">
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.slice(1).map((row, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex % 2 === 1 ? "bg-ink/[0.02]" : ""}>
                    {row.map((cell, i) => (
                      <td key={i} className={`px-4 py-2.5 border-b border-line/20 ${i === 0 ? "font-bold text-ink" : ""}`}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div key={blockIndex} className="space-y-1">
            {block.lines.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        )
      )}
    </div>
  );
};

const CARE_INSTRUCTION_OPTIONS = [
  { id: 'wash-cold', label: 'Machine wash cold (30°C)', icon: Waves },
  { id: 'wash-inside-out', label: 'Turn garment inside out before washing', icon: RotateCw },
  { id: 'similar-colors', label: 'Wash with similar colors', icon: Palette },
  { id: 'no-bleach', label: 'Do not use bleach', icon: DropletOff },
  { id: 'no-tumble-dry', label: 'Do not tumble dry on high heat', icon: Wind },
  { id: 'hang-dry', label: 'Hang dry for best fabric longevity', icon: Sun },
  { id: 'iron-low', label: 'Iron on low to medium heat if needed', icon: Thermometer },
  { id: 'no-iron-print', label: 'Do not iron directly on printed labels or graphics', icon: Ban },
  { id: 'no-sunlight', label: 'Avoid prolonged direct sunlight when drying', icon: CloudSun },
  { id: 'dry-clean', label: 'Dry clean recommended', icon: Sparkles }
];
import StarRating from "@/components/Review/StarRating";
import ReviewCard, { ReviewCardSkeleton } from "@/components/Review/ReviewCard";
import VariantSelectors, {
  getColorsForSize,
  getProductSizes,
  getVariantBySelection,
} from "@/components/shopping-components/VariantSelectors";
import { ColorSwatch, Eyebrow } from "@/components/ui/editorial";
import ProductCard from "@/components/shopping-components/ProductCard";
import CompleteTheLook from "@/components/shopping-components/CompleteTheLook";

import { API_V1_URL as API_BASE } from "@/lib/api";
const FALLBACK_DROP_NAME = "Independent Release";

import usePageMeta from "@/hooks/use-page-meta";
import useRecentlyViewed from "@/hooks/use-recently-viewed";
import useTracker from "@/hooks/useTracker";

const formatLKR = (value = 0) =>
  `LKR ${(Number(value) || 0).toLocaleString("en-LK", {
    maximumFractionDigits: 0,
  })}`;

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

const formatCategoryLabel = (value = "") =>
  String(value)
    .replace(/[-_]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const buildCategoryTrail = (product = {}) => {
  if (product.categoryPath) {
    return String(product.categoryPath)
      .split("/")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((value) => ({ value, label: formatCategoryLabel(value) }));
  }

  return [product.category, product.subCategory]
    .filter(Boolean)
    .map((value) => ({ value, label: formatCategoryLabel(value) }));
};

const ProductDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const wishlistItems = useSelector((state) => state.cart.wishlist?.items ?? []);
  const cartItems = useSelector((state) => state.cart.cart?.items ?? []);
  const liveProductUpdates = useSelector((state) => state.liveProduct.byId);
  const authUser = useSelector((state) => state.auth.user);

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

  const { push: pushRecentlyViewed } = useRecentlyViewed();
  const { trackView } = useTracker();

  const hasVariants = Array.isArray(product?.variants) && product.variants.length > 0;
  const selectedVariant = hasVariants
    ? product.variants.find((variant) => variant.sku === selectedVariantSku) || null
    : null;

  useEffect(() => {
    if (product?._id && product?.slug) {
      pushRecentlyViewed(product);
      trackView(product._id, selectedVariant?._id);
    }
  }, [product?._id, product?.slug, selectedVariant?._id, pushRecentlyViewed, trackView]);

  useLiveProductUpdates(
    (payload = {}) => String(product?._id || "") === String(payload.productId || "")
  );

  // If THIS product is deleted by an admin, redirect to the listing (Fix #3).
  useSocketEvent(
    "product:deleted",
    (payload = {}) => {
      const matches =
        String(payload.slug || "") === String(slug) ||
        String(payload.productId || "") === String(product?._id || "");
      if (!matches) return;
      toast({
        title: "Product no longer available",
        description: "This piece has been removed from the catalogue.",
      });
      navigate("/shopping/product-list");
    },
    [slug, product?._id, navigate]
  );

  usePageMeta({ title: product?.name || "Product" });

  const heroPointerX = useMotionValue(0.5);
  const heroPointerY = useMotionValue(0.5);
  const heroImageX = useSpring(useTransform(heroPointerX, [0, 1], [10, -10]), {
    stiffness: 90,
    damping: 18,
    mass: 0.4,
  });
  const heroImageY = useSpring(useTransform(heroPointerY, [0, 1], [10, -10]), {
    stiffness: 90,
    damping: 18,
    mass: 0.4,
  });
  const heroGlowX = useTransform(heroPointerX, [0, 1], ["30%", "70%"]);
  const heroGlowY = useTransform(heroPointerY, [0, 1], ["30%", "70%"]);
  
  const heroGlowBackground = useMotionTemplate`radial-gradient(circle at ${heroGlowX} ${heroGlowY}, rgba(242, 202, 80, 0.25), transparent 65%)`;

  const handleHeroPointerMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    heroPointerX.set((event.clientX - rect.left) / rect.width);
    heroPointerY.set((event.clientY - rect.top) / rect.height);
  };

  const handleHeroPointerLeave = () => {
    heroPointerX.set(0.5);
    heroPointerY.set(0.5);
  };

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

    const availableVariants = product.variants.filter((variant) => variant.stock > 0);
    const firstVariant = availableVariants.length > 0 ? availableVariants[0] : product.variants[0];

    setSelectedColor((current) => current || firstVariant?.color || "");
    setSelectedSize((current) => current || firstVariant?.size || "");
    setSelectedVariantSku((currentSku) =>
      currentSku && product.variants.some((variant) => variant.sku === currentSku)
        ? currentSku
        : firstVariant?.sku || ""
    );
  }, [product]);

  useEffect(() => {
    if (!product?.variants?.length || !selectedVariantSku) return;

    const matchedVariant = product.variants.find(
      (variant) => variant.sku === selectedVariantSku
    );

    if (!matchedVariant) return;

    setSelectedSize((current) => matchedVariant.size || current || "");
    setSelectedColor((current) => matchedVariant.color || current || "");
    setQuantity((current) =>
      Math.max(1, Math.min(current, matchedVariant.stock || 1))
    );
  }, [product, selectedVariantSku]);

  const uniqueColors = useMemo(() => {
    if (!product?.variants) return [];
    const seen = new Set();
    const colors = [];
    for (const v of product.variants) {
      if (v?.color) {
        const normalized = v.color.trim().toLowerCase();
        if (!seen.has(normalized)) {
          seen.add(normalized);
          colors.push(v.color.trim());
        }
      }
    }
    return colors;
  }, [product?.variants]);

  const productWithFilteredVariants = useMemo(() => {
    if (!product || !selectedColor) return product;
    return {
      ...product,
      variants: product.variants.filter(v => v.color === selectedColor)
    };
  }, [product, selectedColor]);

  const fetchReviewPreview = React.useCallback(async () => {
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
  }, [product?._id]);

  useEffect(() => {
    fetchReviewPreview();
  }, [fetchReviewPreview]);

  // Real-time review aggregate refresh (Fix #5).
  useSocketEvent(
    "review:refresh",
    (payload = {}) => {
      if (String(payload.productId || "") !== String(product?._id || "")) return;
      fetchReviewPreview();
    },
    [fetchReviewPreview, product?._id]
  );

  // Dwell-time beacon: send seconds-on-page when leaving or hiding the tab.
  // Skip dwells <3s (just bouncing). Uses sendBeacon so it fires on tab close.
  useEffect(() => {
    if (!product?._id) return;
    const productId = product._id;
    const startedAt = Date.now();
    let sent = false;

    const sendDwell = () => {
      if (sent) return;
      const seconds = Math.round((Date.now() - startedAt) / 1000);
      if (seconds < 3) return;
      sent = true;
      try {
        const url = `${API_BASE}/products/${productId}/dwell`;
        const blob = new Blob([JSON.stringify({ seconds })], { type: "application/json" });
        if (navigator.sendBeacon) {
          navigator.sendBeacon(url, blob);
        } else {
          // Fallback for browsers without sendBeacon
          fetch(url, {
            method: "POST",
            credentials: "include",
            keepalive: true,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ seconds }),
          }).catch(() => {});
        }
      } catch {
        // never throw from a beacon
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") sendDwell();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      sendDwell();
    };
  }, [product?._id]);

  useEffect(() => {
    if (!product?._id) return;

    const liveUpdate = liveProductUpdates[String(product._id)];
    if (!liveUpdate) return;

    setProduct((currentProduct) => applyLiveProductUpdate(currentProduct, liveUpdate));
  }, [liveProductUpdates, product?._id]);

  // Color-based gallery filtering. Keep this hook before early returns so the
  // product page always renders hooks in the same order while data loads.
  const activeGalleryImages = useMemo(() => {
    const allImages = product?.images || [];
    if (!selectedColor || allImages.length === 0) return allImages;

    const colorKey = selectedColor.toLowerCase();
    const tagged = allImages.filter(
      (img) => String(img.colorTag || "").trim().toLowerCase() === colorKey
    );
    const fallback = allImages.filter(
      (img) => !img.colorTag || String(img.colorTag).trim() === ""
    );

    if (tagged.length > 0) return [...tagged, ...fallback];
    return allImages;
  }, [product?.images, selectedColor]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-page">
        <Loader2 className="h-12 w-12 animate-spin text-gold-ink2" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-page flex flex-col items-center justify-center text-ink">
        <p className="text-xl text-red-500 mb-6">{error || "Product not found"}</p>
        <Link
          to="/shopping/product-list"
          className="bg-ink/10 px-6 py-3 rounded-full hover:bg-ink/20"
        >
          Back to Shop
        </Link>
      </div>
    );
  }

  const basePrice = product.basePrice + (selectedVariant?.priceAdjustment || 0);
  const price = basePrice * (1 - (product.discountPercent || 0) / 100);
  const inWishlist = wishlistItems.some((item) => item.id === product._id);
  const productDropName = product.drop?.name || FALLBACK_DROP_NAME;
  const productSizes = getProductSizes(product);
  const colorsForSelectedSize = getColorsForSize(product, selectedSize);
  const productCategoryTrail = buildCategoryTrail(product);

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
    const matchedVariant = getVariantBySelection(product, size, selectedColor);

    setSelectedSize(size);
    setSelectedVariantSku(matchedVariant?.sku || "");
    setVariantErrors((current) => ({ ...current, size: "", color: "" }));
  };

  const handleColorChange = (color) => {
    const variantsForNewColor = product.variants.filter((v) => v.color === color);
    const isSizeAvailable = variantsForNewColor.some((v) => v.size === selectedSize && v.stock > 0);
    
    const newSize = isSizeAvailable ? selectedSize : ""; 
    const matchedVariant = newSize ? getVariantBySelection(product, newSize, color) : null;

    setSelectedColor(color);
    if (!isSizeAvailable) setSelectedSize("");
    setSelectedVariantSku(matchedVariant?.sku || "");
    setVariantErrors((current) => ({ ...current, color: "" }));
    // Reset gallery to first image of the new color
    setActiveImageIndex(0);
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
    if (!validateVariantSelection() || !selectedVariant) {
      toast({
        title: "Selection Required",
        description: "Please select a size and colour before adding to bag.",
        variant: "destructive",
      });
      return;
    }

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
    if (!validateVariantSelection() || !selectedVariant) {
      toast({
        title: "Selection Required",
        description: "Please select a size and colour before proceeding.",
        variant: "destructive",
      });
      return;
    }

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
    return <ProductCard key={item._id || item.id} product={item} />;
  };

  return (
    <div className="min-h-screen bg-page text-ink pt-24 pb-36 md:pb-28 lg:pb-12">
      {/* 1. Breadcrumb below header */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 mb-6">
        <div className="flex flex-wrap items-center gap-2 text-[10px] md:text-[11px] uppercase tracking-widest text-muted">
          <Link to="/" className="hover:text-gold-ink transition-colors">Home</Link>
          <span className="text-line">{'>'}</span>
          {productCategoryTrail.length > 0 ? (
            productCategoryTrail.map((segment, index) => (
              <React.Fragment key={`${segment.value}-${index}`}>
                <Link
                  to={index === 0 
                    ? `/shopping/product-list?category=${encodeURIComponent(String(product.category || segment.value).toLowerCase())}` 
                    : `/shopping/product-list?category=${encodeURIComponent(String(product.category || "").toLowerCase())}&subCategory=${encodeURIComponent(String(product.subCategory || segment.value).toLowerCase())}`
                  }
                  className="hover:text-gold-ink transition-colors"
                >
                  {segment.label}
                </Link>
                <span className="text-line">{'>'}</span>
              </React.Fragment>
            ))
          ) : (
            <>
              <Link to={`/shopping/product-list?category=${product.category || "category"}`} className="hover:text-gold-ink transition-colors">
                {product.category || "Category"}
              </Link>
              <span className="text-line">{'>'}</span>
            </>
          )}
          <span className="text-gold-ink font-bold">{product.name}</span>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 md:px-8">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14 items-start relative">
          {/* LEFT 55%: Image Gallery */}
          <div className="w-full lg:w-[55%] relative flex flex-col gap-4">
            <div
              className="relative w-full h-[60vh] md:h-[70vh] lg:h-[680px] bg-panel overflow-hidden group rounded-2xl border border-card"
              onMouseMove={handleHeroPointerMove}
              onMouseLeave={handleHeroPointerLeave}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeGalleryImages[activeImageIndex]?.url}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  src={activeGalleryImages[activeImageIndex]?.url}
                  alt={product.name}
                  className="w-full h-full object-contain cursor-zoom-in transition-transform duration-500 hover:scale-[1.05]"
                  onClick={() => setLightboxOpen(true)}
                />
              </AnimatePresence>
              {/* Badges */}
              {product.isLimited && (
                <div className="absolute left-6 top-6 z-30 rounded-full border border-gold-ink/40 bg-black/55 px-3 py-1 backdrop-blur-xl shadow-[0_0_28px_rgba(242,202,80,0.18)]">
                  <span className="se-label text-[9px] tracking-[0.32em] text-gold-ink">Limited Drop</span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {activeGalleryImages.length > 1 && (
              <div className="flex overflow-x-auto gap-3 pb-2 hide-scrollbar snap-x">
                {activeGalleryImages.map((img, i) => (
                  <button
                    key={img._id || i}
                    onClick={() => setActiveImageIndex(i)}
                    className={`relative w-20 h-24 shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-300 snap-start ${
                      i === activeImageIndex ? "border-gold-ink shadow-[0_0_15px_rgba(242,202,80,0.2)]" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img.url} className="w-full h-full object-cover bg-panel" alt={`Thumbnail ${i}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT 45%: Product Information */}
          <div className="w-full lg:w-[45%] flex flex-col relative lg:sticky lg:top-24">
            <h1 className="font-sans font-bold text-[32px] md:text-[40px] text-ink-2 leading-[1.1] mb-2 tracking-tight">
              {product.name}
            </h1>
            
            <div className="flex items-center gap-4 mb-4">
              <p className="se-label text-[10px] tracking-[0.28em] text-muted uppercase">
                {product.brand?.name || "Saga Elite"}
              </p>
              {reviewStats && reviewStats.totalReviews > 0 ? (
                <div className="flex items-center gap-1.5 text-sm">
                  <StarRating rating={reviewStats.averageRating || 0} size={14} />
                  <span className="text-cream ml-1">{reviewStats.averageRating?.toFixed(1)}</span>
                  <Link to="#reviews" onClick={(e) => { e.preventDefault(); document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-muted hover:text-gold-ink transition-colors underline underline-offset-2 ml-1">
                    ({reviewStats.totalReviews} Reviews)
                  </Link>
                </div>
              ) : (
                <span className="text-sm text-muted">No Reviews Yet</span>
              )}
            </div>

            <div className="mb-4 flex flex-wrap items-baseline gap-4">
              <span className="font-sans font-bold text-[32px] text-gold-ink">
                {formatLKR(price * quantity)}
              </span>
              {product.discountPercent > 0 && (
                <span className="font-sans text-[18px] text-goldshadow line-through">
                  {formatLKR(basePrice * quantity)}
                </span>
              )}
            </div>

            <OfferPdpBanner product={product} />
            
            {/* Stock Status Badge */}
            <div className="mb-6 flex items-center">
              {(hasVariants && selectedVariant && selectedVariant.stock === 0) || (!hasVariants && product.stock === 0) ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full border border-red-900 bg-red-950/30 text-red-400 text-xs font-bold uppercase tracking-widest">
                  Out of Stock
                </span>
              ) : hasVariants && selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 5 ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full border border-danger-deep bg-danger-deep/20 text-danger-ink text-xs font-bold uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-danger-ink animate-pulse mr-2" />
                  Only {selectedVariant.stock} Left
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full border border-gold-ink/30 bg-gold/10 text-gold-ink text-xs font-bold uppercase tracking-widest">
                  In Stock
                </span>
              )}
            </div>

            {/* Colors */}
            {uniqueColors.length > 0 && (
              <div className="mb-6">
                <div className="flex items-baseline justify-between mb-3">
                  <span className="text-sm uppercase tracking-widest text-muted font-bold">Colour</span>
                  {selectedColor && (
                    <span className="text-sm text-ink-2">{selectedColor}</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {uniqueColors.map((color) => {
                    const isSelected = color === selectedColor;
                    const hasStock = product.variants.some((v) => v.color === color && v.stock > 0);
                    return (
                      <motion.div key={color} whileHover={{ scale: 1.1 }}>
                        <ColorSwatch
                          color={color}
                          label={color}
                          size={40}
                          selected={isSelected}
                          disabled={!hasStock && !isSelected}
                          onClick={() => handleColorChange(color)}
                        />
                      </motion.div>
                    );
                  })}
                </div>
                {variantErrors.color && <p className="mt-2 text-xs text-danger-ink">{variantErrors.color}</p>}
              </div>
            )}

            {/* Sizes */}
            <div className="mb-6 border-t border-line/40 pt-6">
              <div className="flex items-baseline justify-between mb-3">
                <span className="text-sm uppercase tracking-widest text-muted font-bold">Size</span>
                <button 
                  onClick={() => document.getElementById('specifications')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-xs text-cream hover:text-gold-ink underline underline-offset-4"
                >
                  View Size Guide
                </button>
              </div>
              {hasVariants ? (
                <VariantSelectors
                  product={{ ...productWithFilteredVariants, sizes: productSizes }}
                  selectedSize={selectedSize}
                  selectedColor={selectedColor}
                  onSizeChange={handleSizeChange}
                  onColorChange={handleColorChange}
                  errors={variantErrors}
                  hideColors
                />
              ) : (
                <p className="se-body text-sm text-cream">One size fits all</p>
              )}
            </div>

            {/* Quantity */}
            <div className="border-t border-line/40 pt-6 mb-8">
              <span className="block mb-3 text-sm uppercase tracking-widest text-muted font-bold">Quantity</span>
              <div className="flex items-center border border-line bg-page w-36 h-12 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex-1 text-xl text-cream hover:text-gold-ink hover:bg-card h-full flex items-center justify-center transition-colors"
                >
                  -
                </button>
                <span className="font-sans text-lg text-ink-2 w-12 text-center font-bold">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(selectedVariant?.stock || 1, quantity + 1))}
                  className="flex-1 text-xl text-cream hover:text-gold-ink hover:bg-card h-full flex items-center justify-center transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 mb-6">
              <div className="flex gap-3">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddToCart}
                  disabled={hasVariants && selectedVariant && selectedVariant.stock === 0}
                  className={`flex h-[56px] flex-1 items-center justify-center rounded-2xl border text-sm font-bold tracking-[0.18em] uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    cartAddedPulse ? "border-gold-ink text-gold-ink bg-gold/10" : "border-line text-ink-2 hover:bg-panel hover:border-muted"
                  }`}
                >
                  {cartAddedPulse ? (
                    <><Check className="h-5 w-5 mr-2" /> Added to Bag</>
                  ) : (!selectedVariant && hasVariants) ? (
                    "Select Size / Colour"
                  ) : selectedVariant?.stock === 0 ? (
                    "Sold Out"
                  ) : (
                    "Add to Bag"
                  )}
                </motion.button>
                <button
                  type="button"
                  onClick={toggleWishlist}
                  className="flex h-[56px] w-[56px] items-center justify-center rounded-2xl border border-line hover:border-gold-ink transition-colors"
                >
                  <Heart className={`w-5 h-5 ${inWishlist ? "fill-gold text-gold-ink" : "text-cream"}`} />
                </button>
              </div>
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={handleBuyNow}
                disabled={hasVariants && selectedVariant && selectedVariant.stock === 0}
                className="bg-gold shadow-[0_4px_14px_rgba(242,202,80,0.25)] flex h-[56px] w-full items-center justify-center rounded-2xl text-ongold font-bold text-sm tracking-[0.18em] uppercase transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Buy Now
              </motion.button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y border-line/30">
              <div className="flex flex-col items-center text-center gap-2">
                <ShieldCheck className="w-5 h-5 text-gold-ink" />
                <span className="text-[10px] uppercase tracking-widest text-muted">Secure Checkout</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <Truck className="w-5 h-5 text-gold-ink" />
                <span className="text-[10px] uppercase tracking-widest text-muted">Islandwide Delivery</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <RefreshCcw className="w-5 h-5 text-gold-ink" />
                <span className="text-[10px] uppercase tracking-widest text-muted">Easy Returns</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <Sparkles className="w-5 h-5 text-gold-ink" />
                <span className="text-[10px] uppercase tracking-widest text-muted">Authentic</span>
              </div>
            </div>

            {/* Delivery Estimate */}
            <div className="py-4 border-b border-line/30 flex items-center gap-4">
              <Truck className="w-6 h-6 text-cream" />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-ink-2">Delivery Estimates</span>
                <span className="text-xs text-muted">Colombo: 1–2 Days | Outside Colombo: 2–5 Days</span>
              </div>
            </div>
            
          </div>
        </div>

        {/* ACCORDIONS & SECTIONS BELOW */}
        <div className="mt-20 border-t border-line/40 pt-16 max-w-4xl mx-auto lg:mx-0">
          <h2 className="text-[32px] font-sans font-bold mb-8">Product Information</h2>
          
          <div className="space-y-4">
            <details className="group border-b border-line/40 pb-4" open>
              <summary className="flex justify-between items-center cursor-pointer list-none py-2 text-ink-2 font-sans font-bold text-lg uppercase tracking-wider hover:text-gold-ink transition-colors">
                Description
                <span className="transition group-open:rotate-180">
                  <ChevronDown size={20} className="text-muted" />
                </span>
              </summary>
              <div className="pt-4 pb-2 text-cream text-base leading-relaxed whitespace-pre-wrap">
                {product.description || product.story || "No description provided."}
                {(product.fabric || product.gsm) && (
                  <div className="pt-4 mt-4 border-t border-line/20 flex flex-col gap-2">
                    {product.fabric && <p><strong className="text-ink">Material:</strong> {product.fabric}</p>}
                    {product.gsm && <p><strong className="text-ink">Weight:</strong> {product.gsm} GSM</p>}
                  </div>
                )}
              </div>
            </details>

            <details className="group border-b border-line/40 pb-4" id="specifications">
              <summary className="flex justify-between items-center cursor-pointer list-none py-2 text-ink-2 font-sans font-bold text-lg uppercase tracking-wider hover:text-gold-ink transition-colors">
                Specifications & Size Guide
                <span className="transition group-open:rotate-180">
                  <ChevronDown size={20} className="text-muted" />
                </span>
              </summary>
              <div className="pt-4 pb-2 text-cream text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {(typeof product.brand === "string" ? product.brand : product.brand?.name) && <div className="flex flex-col"><span className="text-muted uppercase tracking-widest text-[10px]">Brand</span><span className="text-ink">{typeof product.brand === "string" ? product.brand : product.brand?.name}</span></div>}
                  {product.category && <div className="flex flex-col"><span className="text-muted uppercase tracking-widest text-[10px]">Category</span><span className="text-ink">{product.category}</span></div>}
                  {product.gender && <div className="flex flex-col"><span className="text-muted uppercase tracking-widest text-[10px]">Gender</span><span className="text-ink">{product.gender}</span></div>}
                  {product.fitType && <div className="flex flex-col"><span className="text-muted uppercase tracking-widest text-[10px]">Fit</span><span className="text-ink">{product.fitType}</span></div>}
                </div>
                
                {product.sizeGuide ? (
                  <SizeGuideContent text={product.sizeGuide} />
                ) : (
                  <p className="italic text-muted">Size guide not available for this product.</p>
                )}
              </div>
            </details>
            
            <details className="group border-b border-line/40 pb-4">
              <summary className="flex justify-between items-center cursor-pointer list-none py-2 text-ink-2 font-sans font-bold text-lg uppercase tracking-wider hover:text-gold-ink transition-colors">
                Shipping & Returns
                <span className="transition group-open:rotate-180">
                  <ChevronDown size={20} className="text-muted" />
                </span>
              </summary>
              <div className="pt-4 pb-2 text-cream text-sm leading-relaxed">
                <p className="mb-3"><strong className="text-ink">Shipping Policy:</strong> Delivery within Colombo takes 1-2 working days. Outstation delivery takes 2-5 working days. Orders placed before 12 PM are processed the same day.</p>
                <p className="mb-3"><strong className="text-ink">Return Policy:</strong> We offer a 7-day easy return policy for unworn items with original tags attached. Final sale and intimates are non-returnable.</p>
                <p><strong className="text-ink">Exchange Policy:</strong> Exchanges are subject to size/color availability. Contact support to initiate an exchange.</p>
              </div>
            </details>
          </div>
        </div>

        {/* CUSTOMER REVIEWS */}
        <div id="reviews-section" className="mt-20 pt-16 border-t border-line/40">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <h2 className="text-[32px] font-sans font-bold tracking-tight text-ink-2">Customer Reviews</h2>
              <div className="flex items-center gap-3 mt-2">
                <StarRating rating={reviewStats?.averageRating || 0} size={20} />
                <span className="text-lg text-gold-ink font-bold">{reviewStats?.averageRating?.toFixed(1) || '0.0'}</span>
                <span className="text-muted">based on {reviewStats?.totalReviews || 0} reviews</span>
              </div>
            </div>
            {authUser ? (
              <Link to={`/product/${product._id}/reviews`} className="inline-flex items-center justify-center rounded-2xl bg-gold px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-ongold hover:brightness-110 transition-all">
                Write a Review
              </Link>
            ) : (
              <Link to="/auth/login" className="inline-flex items-center justify-center rounded-2xl border border-gold-ink/40 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-gold-ink hover:bg-gold/10 transition-all">
                Sign in to review
              </Link>
            )}
          </div>

          <div className="space-y-6 max-w-4xl">
            {reviewLoading ? (
              Array.from({ length: 2 }).map((_, index) => <ReviewCardSkeleton key={index} />)
            ) : reviewPreview.length === 0 ? (
              <div className="bg-panel rounded-2xl p-8 text-center border border-card">
                <p className="text-cream">No reviews yet. Be the first to share your thoughts!</p>
              </div>
            ) : (
              reviewPreview.map((review) => <ReviewCard key={review._id} review={review} />)
            )}
            {reviewPreview.length > 0 && (
              <Link to={`/product/${product._id}/reviews`} className="block w-full text-center py-4 text-gold-ink uppercase tracking-widest text-xs font-bold hover:underline">
                Read All Reviews
              </Link>
            )}
          </div>
        </div>

        {/* COMPLETE THE LOOK — complementary, cross-category pairings */}
        <CompleteTheLook productId={product._id} limit={8} />

        {/* RELATED PRODUCTS */}
        <section className="mt-24">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-[32px] font-sans font-bold tracking-tight text-ink-2">You May Also Like</h2>
            </div>
            <Link to="/shopping/product-list" className="text-sm uppercase tracking-widest text-muted hover:text-gold-ink transition-colors">
              View all
            </Link>
          </div>
          {famousProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {famousProducts.map(renderShowcaseCard)}
            </div>
          ) : latestProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {latestProducts.map(renderShowcaseCard)}
            </div>
          ) : (
            <div className="rounded-2xl border border-ink/5 bg-panel p-8 text-center text-muted">
              No related products to show right now.
            </div>
          )}
        </section>

        <AnimatePresence>
          {lightboxOpen ? (
            <motion.div
              role="presentation"
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLightboxOpen(false)}
            >
              <button className="absolute top-6 right-6 text-ink hover:text-gold-ink z-[110] font-bold tracking-widest uppercase text-xs">Close</button>
              <motion.img
                src={activeGalleryImages[activeImageIndex]?.url || "/placeholder.jpg"}
                alt={product.name}
                className="max-h-[90vh] max-w-full object-contain cursor-zoom-out"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ duration: 0.25 }}
                onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

        {showBuyNowModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[110] p-4 backdrop-blur-sm">
            <div className="bg-panel rounded-2xl p-8 border border-line max-w-md w-full shadow-2xl">
              <h3 className="text-xl font-sans font-bold mb-4 text-ink-2">Product Already in Cart</h3>
              <p className="text-muted mb-8 text-sm leading-relaxed">
                This product is already in your cart. Do you want to continue with your cart items or buy this as a new direct checkout?
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleProceedWithItem}
                  className="w-full bg-gold text-ongold py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors hover:brightness-110"
                >
                  Buy This Item
                </button>
                <button
                  onClick={handleViewCartSummary}
                  className="w-full bg-transparent border border-line text-ink-2 py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors hover:bg-ink/5"
                >
                  View Cart Summary
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MOBILE STICKY PURCHASE BAR */}
      <div className="fixed inset-x-0 bottom-0 z-[60] h-[72px] border-t border-gold-ink bg-page px-4 flex items-center lg:hidden shadow-[0_-10px_30px_rgba(0,0,0,0.8)] pb-[env(safe-area-inset-bottom)]">
        <div className="flex-1 flex flex-col justify-center">
          <span className="font-sans font-bold text-lg text-gold-ink leading-tight">
            {formatLKR(price * quantity)}
          </span>
          {hasVariants && selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 5 ? (
            <span className="text-[10px] uppercase tracking-widest text-danger-ink leading-none mt-1 font-bold">
              Only {selectedVariant.stock} left
            </span>
          ) : (selectedSize || selectedColor) ? (
            <span className="text-[10px] uppercase tracking-widest text-muted leading-none mt-1">
              {[selectedSize, selectedColor].filter(Boolean).join(" · ")}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={hasVariants && selectedVariant && selectedVariant.stock === 0}
          className="h-12 px-6 bg-gold rounded-xl text-black font-bold uppercase tracking-widest text-[11px] disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
        >
          {(!selectedVariant && hasVariants) ? "Select Options" : selectedVariant?.stock === 0 ? "Sold Out" : "Add to Bag"}
        </button>
      </div>
    </div>
  );
};

function OfferPdpBanner({ product }) {
  const { bestOffer } = useProductOffers(product);
  if (!bestOffer) return null;

  const now = Date.now();
  const endsAt = bestOffer.endsAt ? new Date(bestOffer.endsAt) : null;
  const timeLeft = endsAt ? endsAt.getTime() - now : null;
  const isExpiring = timeLeft && timeLeft > 0 && timeLeft < 86400000;

  const discountLabel = bestOffer.type === "fixed_amount"
    ? `LKR ${Number(bestOffer.discountAmount).toLocaleString()} OFF`
    : `${bestOffer.discountPercent}% OFF`;

  return (
    <div className="mb-4 rounded-lg border border-gold-ink2/30 bg-gold-deep/[0.06] p-3">
      <div className="flex items-start gap-2">
        <Tag className="h-4 w-4 shrink-0 text-gold-ink2 mt-0.5" />
        <div className="min-w-0">
          <p className="se-label text-[11px] tracking-[0.15em] text-gold-ink2 uppercase">
            {bestOffer.badgeText || "Active Offer"}
          </p>
          <p className="text-sm text-ink-2 mt-0.5">
            {discountLabel} — {bestOffer.description || bestOffer.name}
          </p>
          {isExpiring && (
            <p className="se-label text-[10px] text-rose-400 mt-1 animate-pulse">
              Ends in {Math.ceil(timeLeft / 3600000)}h {Math.ceil((timeLeft % 3600000) / 60000)}m
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;
