import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { Eye, Heart, ShoppingBag, X, Tag } from "lucide-react";
import { useProductOffers } from "@/hooks/use-product-offers";
import {
  addToCartAction,
  addToWishlistAction,
  removeFromWishlistAction,
} from "@/store/cart-slice";
import { toast } from "@/hooks/use-toast";
import { useCountdown, ColorSwatch } from "@/components/ui/editorial";
import { cn } from "@/lib/utils";

const formatLKR = (value = 0) =>
  `LKR ${(Number(value) || 0).toLocaleString("en-LK", {
    maximumFractionDigits: 0,
  })}`;

const isNewProduct = (product) => {
  const created = product?.createdAt ? new Date(product.createdAt) : null;
  if (!created || Number.isNaN(created.getTime())) return false;
  return Date.now() - created.getTime() < 7 * 86400000;
};

const stockTone = (product) => {
  const variants = product?.variants || [];
  if (variants.length === 0) return null;
  const total = variants.reduce(
    (sum, v) => sum + Math.max(0, Number(v?.stock || 0)),
    0
  );
  if (total === 0) return { color: "#ffb4ab", label: "Sold out" };
  if (total <= 5) return { color: "#f2ca50", label: `${total} left` };
  return { color: "#a8d8b6", label: "In stock" };
};

const pad2 = (n) => String(n).padStart(2, "0");

function DropEndingBadge({ target }) {
  const c = useCountdown(target);
  if (c.expired) return null;
  return (
    <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-[#93000a] text-[#ffb4ab] px-2.5 py-1 se-label text-[9px] tracking-[0.22em] backdrop-blur-sm animate-pulse">
      <span className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab]" />
      ENDS · {pad2(c.h)}:{pad2(c.m)}:{pad2(c.s)}
    </div>
  );
}

const ProductCard = ({ product, density = "default", index = 0, className, showDealBadge = false, tall = false }) => {
  const dispatch = useDispatch();
  const wishlistItems = useSelector((state) => state.cart.wishlist?.items ?? []);

  const slug = product?.slug;
  const productHref = slug ? `/shopping/product/${slug}` : `/shopping/product-list`;

  const inWishlist = useMemo(
    () => wishlistItems.some((item) => item.id === product?._id),
    [wishlistItems, product?._id]
  );

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product?._id) return;
    if (inWishlist) {
      dispatch(removeFromWishlistAction(product._id));
      toast({ title: "Removed from wishlist" });
    } else {
      dispatch(addToWishlistAction({ productId: product._id }));
      toast({ title: "Added to wishlist", variant: "success" });
    }
  };

  const basePrice = product?.basePrice || 0;
  const discountPct = Number(product?.discountPercent || 0);
  const price = basePrice * (1 - discountPct / 100);

  const variants = product?.variants || [];

  // Distinct colors per product (preserve original casing, case-insensitive dedup).
  const distinctColors = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const v of variants) {
      const c = String(v?.color || "").trim();
      if (!c) continue;
      const key = c.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(c);
    }
    return out;
  }, [variants]);

  // Map color → first matching image url (Image.colorTag).
  const imageByColor = useMemo(() => {
    const map = new Map();
    for (const img of product?.images || []) {
      const tag = String(img?.colorTag || "").trim().toLowerCase();
      if (!tag || map.has(tag)) continue;
      map.set(tag, img.url);
    }
    return map;
  }, [product?.images]);

  const primaryImage = product?.images?.[0]?.url || "/LOGO.png";
  const secondaryImage = product?.images?.[1]?.url || null;
  const [activeColor, setActiveColor] = useState(null);
  const [lockedColor, setLockedColor] = useState(null);
  const previewColor = lockedColor || activeColor;
  const displayImage = previewColor
    ? imageByColor.get(previewColor.toLowerCase()) || primaryImage
    : primaryImage;

  const [imgLoaded, setImgLoaded] = useState(false);
  
  // Create a ref to check if image is already loaded from cache
  const imgRef = useRef(null);
  useEffect(() => {
    setImgLoaded(false);
    if (imgRef.current?.complete) {
      setImgLoaded(true);
    }
  }, [displayImage]);

  // Sizes with aggregated stock (across colors) — for the hover preview strip.
  const sizesWithStock = useMemo(() => {
    const map = new Map();
    for (const v of variants) {
      const k = v?.size;
      if (!k) continue;
      map.set(k, (map.get(k) || 0) + Math.max(0, Number(v?.stock || 0)));
    }
    return [...map.entries()].map(([size, stock]) => ({ size, stock }));
  }, [variants]);

  const stock = stockTone(product);
  const isLimited = Boolean(product?.isLimited);
  const totalStock = Number(
    product?.totalStock ?? variants.reduce((sum, v) => sum + Math.max(0, Number(v?.stock || 0)), 0)
  );
  const isSoldOut = totalStock === 0 || stock?.label === "Sold out";

  const getDropBadge = (product) => {
    if (!product?.dropId && !product?.drop) return null;
    const drop = product.drop || {};
    const ended = drop.endDate && new Date(drop.endDate) < new Date();
    if (!ended) return { label: "Drop Exclusive", color: "gold" };
    return { label: `Drop · ${drop.name || "Archive"}`, color: "muted" };
  };

  const dropBadge = getDropBadge(product);

  // Hype signals — feed the priority-ordered badge stack below.
  const soldCount = Number(product?.soldCount || 0);
  const wishCount = Number(product?.wishCount || 0);
  const isBestseller = soldCount > 100;
  const isMostWished = wishCount > 50;
  const isNew = isNewProduct(product);
  const isRare = Boolean(product?.isRare);

  const { bestOffer } = useProductOffers(product);

  // Stacked badges — up to 2 visible, top-left.
  const badges = [];
  if (isSoldOut) badges.push({ key: "sold", label: "SOLD OUT", tone: "dead" });
  else if (totalStock > 0 && totalStock <= 5)
    badges.push({ key: "low", label: `${totalStock} LEFT`, tone: "alert" });
  if (isLimited) badges.push({ key: "lim", label: "LIMITED", tone: "bone" });
  if (isRare) badges.push({ key: "rare", label: "RARE", tone: "bone" });
  if (dropBadge && !isSoldOut)
    badges.push({
      key: "drop",
      label: dropBadge.label.toUpperCase(),
      tone: dropBadge.color === "gold" ? "gold" : "bone",
    });
  if (isNew && !isSoldOut) badges.push({ key: "new", label: "NEW DROP", tone: "gold" });
  if (isBestseller) badges.push({ key: "best", label: "BESTSELLER", tone: "gold" });
  if (isMostWished) badges.push({ key: "wish", label: "MOST WISHED", tone: "goldOutline" });
  if (showDealBadge && discountPct > 0)
    badges.push({ key: "deal", label: `${discountPct}% OFF`, tone: "bone" });
  if (bestOffer && !isSoldOut && !badges.some((b) => b.key === "deal"))
    badges.push({
      key: "offer",
      label: bestOffer.badgeText || bestOffer.name || "OFFER",
      tone: "gold",
    });
  const visibleBadges = badges.slice(0, 2);

  // Drop ending soon (< 24h, > 0).
  const dropEnd = product?.drop?.endDate ? new Date(product.drop.endDate) : null;
  const dropEndingSoon =
    dropEnd && !Number.isNaN(dropEnd.getTime()) &&
    dropEnd.getTime() - Date.now() > 0 &&
    dropEnd.getTime() - Date.now() < 86_400_000;

  // Quick Add overlay state.
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const overlayRef = useRef(null);
  const inStockVariants = useMemo(
    () => variants.filter((v) => Number(v?.stock || 0) > 0),
    [variants]
  );
  const singleVariant = inStockVariants.length === 1;

  useEffect(() => {
    if (!quickAddOpen) return;
    const onClick = (e) => {
      if (!overlayRef.current?.contains(e.target)) setQuickAddOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setQuickAddOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [quickAddOpen]);

  const handleQuickAdd = (e, variantId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product?._id) return;
    if (isSoldOut) {
      toast({ title: "Sold out", variant: "destructive" });
      return;
    }
    if (inStockVariants.length === 0) {
      toast({ title: "No stock available", variant: "destructive" });
      return;
    }
    const vId = variantId || (singleVariant ? inStockVariants[0]._id : null);
    if (!vId) {
      setQuickAddOpen(true);
      return;
    }
    dispatch(addToCartAction({ productId: product._id, variantId: vId, quantity: 1 }))
      .unwrap()
      .then(() => toast({ title: "Added to bag", variant: "success" }))
      .catch((msg) =>
        toast({ title: msg || "Couldn't add to bag", variant: "destructive" })
      );
    setQuickAddOpen(false);
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col bg-[#0E0E0E] rounded-[20px] overflow-hidden shadow-md transition-all duration-250 ease-out hover:scale-[1.03] hover:shadow-[0_10px_40px_rgba(242,202,80,0.12)] shrink-0",
        "w-[170px] h-[320px] md:w-[260px] md:h-[420px] lg:w-[290px] lg:h-[460px]",
        className
      )}
    >
      {/* 1. Image Area (65% height) */}
      <div className="relative w-full h-[65%] bg-[#131313] overflow-hidden">
        {/* Loading State Skeleton */}
        {!imgLoaded && (
          <div className="absolute inset-0 bg-[#1a1a1a] animate-pulse" />
        )}
        
        <Link to={productHref} className="block w-full h-full">
          <img
            ref={imgRef}
            src={displayImage}
            alt={product?.name || "Product"}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={(e) => {
              e.currentTarget.src = "/placeholder.jpg";
              setImgLoaded(true);
            }}
            className={cn(
              "object-cover object-center w-full h-full transition-transform duration-250 ease-out group-hover:scale-[1.05]",
              imgLoaded ? "opacity-100" : "opacity-0"
            )}
          />
        </Link>

        {/* Discount Badge (Top Left) */}
        {discountPct > 0 && (
          <div className="absolute top-3 left-3 bg-[#f2ca50] text-[#0E0E0E] px-2 py-1 rounded-[12px] se-label text-[10px] tracking-wider font-bold shadow-sm">
            {discountPct}% OFF
          </div>
        )}

        {/* Wishlist Button (Top Right) */}
        <button
          onClick={handleWishlist}
          aria-label="Wishlist"
          className="absolute top-3 right-3 flex items-center justify-center w-10 h-10 rounded-full bg-[#0E0E0E]/50 border border-[#f2ca50] transition-colors duration-300 hover:bg-[#f2ca50] group/wishlist z-10"
        >
          <Heart 
            size={16} 
            className={cn(
              "transition-colors duration-300", 
              inWishlist ? "fill-[#f2ca50] text-[#f2ca50]" : "text-[#f2ca50] group-hover/wishlist:text-[#0E0E0E] group-hover/wishlist:fill-[#0E0E0E]"
            )} 
          />
        </button>

        {/* Quick View Button (Desktop Hover Overlay) */}
        <div className="absolute inset-0 hidden lg:flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-250 pointer-events-none">
          <button 
            className="h-[44px] px-6 border border-[#f2ca50] text-[#f2ca50] bg-transparent rounded-full font-sans text-[13px] font-semibold tracking-wider uppercase backdrop-blur-sm pointer-events-auto hover:bg-[#f2ca50] hover:text-[#0E0E0E] transition-colors duration-250 translate-y-4 group-hover:translate-y-0"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); /* Hook into QuickView Modal if exists */ }}
          >
            Quick View
          </button>
        </div>
      </div>

      {/* 2. Content Area (35% height) */}
      <div className="flex flex-col justify-between h-[35%] p-3 md:p-4 bg-[#0E0E0E]">
        
        {/* Top: Category & Title & Rating */}
        <div className="flex flex-col gap-1">
          <span className="se-label text-[9px] md:text-[10px] text-[#99907c] uppercase tracking-widest">
            {product?.category?.name || product?.category || "Category"}
          </span>
          
          <Link to={productHref} className="block group-hover:text-[#f2ca50] transition-colors">
            <h3 className="font-sans font-semibold text-[#e5e2e1] text-[14px] md:text-[16px] lg:text-[18px] leading-tight line-clamp-2">
              {product?.name || "Premium Product"}
            </h3>
          </Link>
          
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[#f2ca50] text-[12px] md:text-[14px] lg:text-[16px]">★★★★★</span>
            <span className="text-[#99907c] text-[10px] md:text-[12px] lg:text-[14px]">(124)</span>
          </div>
        </div>

        {/* Bottom: Price & CTA */}
        <div className="flex flex-col gap-2 mt-auto">
          <div className="flex items-baseline gap-2">
            <span className="font-sans font-bold text-[#e5e2e1] text-[16px] md:text-[18px] lg:text-[22px]">
              {formatLKR(price)}
            </span>
            {discountPct > 0 && basePrice > 0 && (
              <span className="font-sans text-[12px] md:text-[14px] lg:text-[16px] text-[#99907c] line-through">
                {formatLKR(basePrice)}
              </span>
            )}
          </div>
          
          <button
            onClick={handleQuickAdd}
            className="w-full h-[36px] md:h-[40px] lg:h-[48px] bg-[#f2ca50] text-[#0a0a0a] rounded-[16px] font-sans font-bold text-[12px] md:text-[13px] lg:text-[14px] transition-transform duration-200 hover:-translate-y-[2px] flex items-center justify-center gap-2"
          >
            Add to Bag
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
