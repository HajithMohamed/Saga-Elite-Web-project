import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { Eye, Heart, ShoppingBag, X } from "lucide-react";
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
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group relative flex flex-col gap-3 cursor-pointer bg-transparent",
        className
      )}
    >
      {/* Image Container */}
      <Link
        to={productHref}
        className={cn(
          "relative w-full overflow-hidden bg-[#111] block rounded-2xl border border-white/5 transition-all duration-500 group-hover:border-[#D4AF37]/30 group-hover:shadow-[0_8px_30px_rgb(212,175,55,0.15)]",
          tall ? "aspect-square" : "aspect-[3/4] md:aspect-[4/5]"
        )}
      >
        {/* Skeleton Loader */}
        {!imgLoaded && (
          <div className="absolute inset-0 bg-[#1a1a1a] animate-pulse flex items-center justify-center">
             <div className="w-8 h-8 rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin" />
          </div>
        )}

        {/* Primary / color-swap image */}
        <img
          ref={imgRef}
          key={displayImage}
          src={displayImage}
          alt={product?.name || "Piece"}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          onError={(e) => {
            e.currentTarget.src = "/placeholder.jpg";
            setImgLoaded(true);
          }}
          className={cn(
            "object-cover object-center w-full h-full transition-all duration-700 ease-[0.25,0.46,0.45,0.94] group-hover:scale-105",
            imgLoaded ? "opacity-100" : "opacity-0"
          )}
        />
        {/* Alt image */}
        {secondaryImage && !activeColor ? (
          <img
            src={secondaryImage}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-0 group-hover:opacity-100 transition-opacity duration-700"
          />
        ) : null}

        {/* Stacked Hype Badges (top-left) */}
        {visibleBadges.length > 0 && (
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 max-w-[70%]">
            {visibleBadges.map((b) => (
              <span
                key={b.key}
                className={cn(
                  "px-3 py-1 se-label text-[9px] tracking-[0.28em] border backdrop-blur-sm w-fit",
                  b.tone === "gold" && "bg-[#D4AF37]/90 text-[#0a0a0a] border-[#D4AF37]",
                  b.tone === "goldOutline" && "bg-[#0a0a0a]/90 text-[#f2ca50] border-[#f2ca50]/60",
                  b.tone === "bone" && "bg-[#0a0a0a]/90 text-[#e5e2e1] border-[#4d4635]",
                  b.tone === "alert" && "bg-[#93000a] text-[#ffb4ab] border-[#93000a]",
                  b.tone === "dead" && "bg-[#0a0a0a]/90 text-[#99907c] border-[#4d4635]"
                )}
              >
                {b.label}
              </span>
            ))}
          </div>
        )}

        {/* Drop Ending Soon (top-right, only when drop ends within 24h) */}
        {dropEndingSoon && <DropEndingBadge target={dropEnd} />}

        {/* Quick Add overlay — sits above the slide-up actions */}
        {quickAddOpen && inStockVariants.length > 1 && (
          <div
            ref={overlayRef}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="absolute inset-x-3 bottom-16 z-20 bg-[#0a0a0a]/95 border border-[#4d4635] backdrop-blur-md p-3 rounded-sm shadow-[0_8px_30px_rgb(0,0,0,0.9)]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="se-label text-[9px] tracking-[0.28em] text-[#99907c]">
                SELECT SIZE
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setQuickAddOpen(false);
                }}
                className="text-[#99907c] hover:text-[#e5e2e1] se-focus"
                aria-label="Close size selector"
              >
                <X size={12} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {inStockVariants.map((v) => (
                <button
                  key={v._id}
                  type="button"
                  onClick={(e) => handleQuickAdd(e, v._id)}
                  className="px-2 py-2 border border-[#4d4635] hover:border-[#f2ca50] hover:bg-[#1c1b1b] text-[#e5e2e1] se-mono text-[10px] flex flex-col items-center transition-colors se-focus"
                >
                  <span className="font-semibold tracking-wider">{v.size || "—"}</span>
                  <span className="text-[8px] text-[#99907c] mt-0.5">
                    {v.stock} left
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Hover-revealed size preview strip — purely informational, sits above the action bar */}
        {!quickAddOpen && sizesWithStock.length > 0 && (
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-12 z-[5] flex justify-center flex-wrap gap-1 px-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 delay-75 pointer-events-none"
          >
            {sizesWithStock.map((s) => {
              const isOOS = s.stock === 0;
              const isLow = s.stock > 0 && s.stock <= 3;
              return (
                <span
                  key={s.size}
                  className={cn(
                    "se-mono text-[10px] tracking-wider px-2 py-1 backdrop-blur-sm border",
                    isOOS
                      ? "text-[#574500] line-through bg-[#0a0a0a]/60 border-[#1c1b1b]"
                      : "text-[#e5e2e1] bg-[#0a0a0a]/85 border-[#4d4635]/40"
                  )}
                >
                  {s.size}
                  {isLow && (
                    <span className="ml-1 inline-block w-1 h-1 rounded-full bg-[#f2ca50] align-middle" />
                  )}
                </span>
              );
            })}
          </div>
        )}

        {/* Slide-up quick actions — appear on hover */}
        <div className="absolute inset-x-0 bottom-0 flex translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-10">
          <span
            className="flex-1 bg-[#0a0a0a]/85 backdrop-blur-sm text-[#d0c5af] py-2.5 text-[10px] tracking-[0.22em] uppercase font-mono group-hover:bg-[#131313] group-hover:text-[#e5e2e1] transition-colors flex items-center justify-center gap-1.5"
          >
            <Eye size={12} strokeWidth={1.75} />
            View
          </span>
          <button
            type="button"
            onClick={handleWishlist}
            aria-pressed={inWishlist}
            aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
            className={cn(
              "px-4 py-2.5 backdrop-blur-sm transition-colors flex items-center justify-center border-x border-[#4d4635]/40 se-focus",
              inWishlist
                ? "bg-[#0a0a0a]/90 text-[#f2ca50]"
                : "bg-[#0a0a0a]/85 text-[#d0c5af] hover:text-[#e5e2e1]"
            )}
          >
            <motion.div
              initial={false}
              animate={{ scale: inWishlist ? [1, 1.4, 1] : 1 }}
              transition={{ type: "spring", stiffness: 600, damping: 10, mass: 1 }}
            >
              <Heart
                size={14}
                strokeWidth={1.75}
                className={inWishlist ? "fill-[#f2ca50]" : ""}
              />
            </motion.div>
          </button>
          <button
            type="button"
            onClick={handleQuickAdd}
            aria-label={singleVariant ? "Add to bag" : "Quick add — choose size"}
            className="flex-1 bg-[#f2ca50] text-[#0a0a0a] py-2.5 text-[10px] tracking-[0.22em] uppercase font-mono font-bold group-hover:bg-[#ffe088] transition-colors flex items-center justify-center gap-1.5 se-focus"
          >
            <ShoppingBag size={12} strokeWidth={2} />
            {singleVariant ? "Add" : "Quick Add"}
          </button>
        </div>
      </Link>

      {/* Metadata */}
      <Link to={productHref} className="block transition-all duration-500 p-2 mt-2">
        <div className="flex justify-between items-start gap-3">
          <div className="flex flex-col flex-1">
            <h3 className="text-[#e5e2e1] font-sans text-[13px] font-bold uppercase tracking-widest leading-snug line-clamp-1">
              {product?.name || "Untitled piece"}
            </h3>
            <p className="text-[#99907c] text-[10px] mt-1 uppercase tracking-widest font-medium">
              {product?.category?.name || product?.category || "Collection"}
            </p>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <p className="text-[#f2ca50] font-mono text-sm tracking-wider font-semibold tabular-nums">
              {formatLKR(price)}
            </p>
            {discountPct > 0 && basePrice > 0 && (
              <span className="font-mono text-[10px] text-gray-500 line-through tabular-nums text-right mt-0.5">
                {formatLKR(basePrice)}
              </span>
            )}
            {totalStock > 0 && totalStock <= 5 ? (
              <p className="se-label text-[9px] tracking-[0.28em] text-[#ffb4ab] mt-1">
                Only {totalStock} left
              </p>
            ) : null}
            {totalStock === 0 ? (
              <p className="se-label text-[9px] tracking-[0.28em] text-[#ffb4ab] mt-1">
                Sold out
              </p>
            ) : null}
          </div>
        </div>
      </Link>

      {/* Color swatches — only render when 2+ colors exist. Hover swaps the card image. */}
      {distinctColors.length >= 2 && (
        <div
          className="px-2 -mt-1 mb-1 flex items-center gap-1.5"
          onMouseLeave={() => {
            if (!lockedColor) setActiveColor(null);
          }}
        >
          {distinctColors.slice(0, 5).map((color) => {
            const isActive =
              activeColor && activeColor.toLowerCase() === color.toLowerCase();
            return (
              <span
                key={color}
                onMouseEnter={() => setActiveColor(color)}
                onFocus={() => setActiveColor(color)}
                className="inline-flex"
              >
                <ColorSwatch
                  color={color}
                  size={18}
                  selected={isActive || (lockedColor && lockedColor.toLowerCase() === color.toLowerCase())}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Toggle lock: clicking locks preview color until cleared
                    if (lockedColor && lockedColor.toLowerCase() === color.toLowerCase()) {
                      setLockedColor(null);
                      setActiveColor(null);
                    } else {
                      setLockedColor(color);
                      setActiveColor(color);
                    }
                  }}
                />
              </span>
            );
          })}
          {distinctColors.length > 5 && (
            <span className="se-mono text-[9px] text-[#99907c] ml-1">
              +{distinctColors.length - 5}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default ProductCard;
