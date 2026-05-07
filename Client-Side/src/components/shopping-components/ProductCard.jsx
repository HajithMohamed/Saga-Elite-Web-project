import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { ArrowRight, Eye, Heart, ShoppingBag } from "lucide-react";
import {
  addToWishlistAction,
  removeFromWishlistAction,
} from "@/store/cart-slice";
import { toast } from "@/hooks/use-toast";
import {
  Btn,
  ColorSwatch,
  Eyebrow,
  Hairline,
  StatusBadge,
} from "@/components/ui/editorial";
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

const ProductCard = ({ product, density = "default", index = 0, className, showDealBadge = false }) => {
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

  // Hype badges — pick the strongest signal. Order is meaningful:
  // sold-out > low-stock > drop-exclusive > bestseller > most-wished > limited.
  const soldCount = Number(product?.soldCount || 0);
  const wishCount = Number(product?.wishCount || 0);
  const isBestseller = soldCount > 100;
  const isMostWished = wishCount > 50;

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
      <Link to={productHref} className="relative aspect-[3/4] w-full overflow-hidden bg-[#131313] block rounded-[1rem] border border-[#1c1b1b] transition-all duration-500 group-hover:border-[#333] group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.8)]">
        {/* Primary image */}
        <img
          src={product?.images?.[0]?.url || "/LOGO.png"}
          alt={product?.name || "Piece"}
          loading="lazy"
          width={220} height={293}
          className="object-cover w-full h-full transition-all duration-[600ms] group-hover:brightness-90 group-hover:scale-[1.02]"
        />
        {/* Alt image — fades in on hover when a second image exists */}
        {product?.images?.[1]?.url ? (
          <img
            src={product.images[1].url}
            alt=""
            aria-hidden="true"
            loading="lazy"
            width={220}
            height={293}
            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          />
        ) : null}

        {/* Hype Badges */}
        {showDealBadge && discountPct > 0 ? (
          <div className="absolute top-3 left-3 bg-[#0a0a0a] border border-[#4d4635] px-2 py-1 se-label text-[9px] tracking-[0.2em] text-[#d0c5af] backdrop-blur-sm">
            DROP ARCHIVE · {discountPct}% OFF
          </div>
        ) : isSoldOut ? (
          <div className="absolute top-3 left-3 bg-[#0a0a0a]/90 text-[#e5e2e1] px-3 py-1 se-label text-[9px] tracking-[0.28em] border border-[#4d4635] backdrop-blur-sm">
            Archived
          </div>
        ) : totalStock > 0 && totalStock <= 5 ? (
          <div className="absolute top-3 left-3 bg-[#93000a] text-[#ffb4ab] px-3 py-1 se-label text-[9px] tracking-[0.28em] backdrop-blur-sm">
            {totalStock} Pieces Left
          </div>
        ) : dropBadge ? (
          <div className={cn(
            "absolute top-3 left-3 px-3 py-1 se-label text-[9px] tracking-[0.28em] border backdrop-blur-sm",
            dropBadge.color === "gold"
              ? "bg-[#D4AF37]/90 text-[#0a0a0a] border-[#D4AF37]"
              : "bg-[#0a0a0a]/90 text-[#99907c] border-[#4d4635]"
          )}>
            {dropBadge.label}
          </div>
        ) : isBestseller ? (
          <div className="absolute top-3 left-3 bg-[#f2ca50] text-[#0a0a0a] px-3 py-1 se-label text-[9px] tracking-[0.28em] border border-[#f2ca50] backdrop-blur-sm">
            Bestseller
          </div>
        ) : isMostWished ? (
          <div className="absolute top-3 left-3 bg-[#0a0a0a]/90 text-[#f2ca50] px-3 py-1 se-label text-[9px] tracking-[0.28em] border border-[#f2ca50]/60 backdrop-blur-sm">
            Most Wished
          </div>
        ) : isLimited ? (
          <div className="absolute top-3 left-3 bg-[#0a0a0a]/90 text-[#e5e2e1] px-3 py-1 se-label text-[9px] tracking-[0.28em] border border-[#4d4635] backdrop-blur-sm">
            Limited Edition
          </div>
        ) : null}

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
          <span
            className="flex-1 bg-[#f2ca50] text-[#0a0a0a] py-2.5 text-[10px] tracking-[0.22em] uppercase font-mono font-bold group-hover:bg-[#ffe088] transition-colors flex items-center justify-center gap-1.5"
          >
            <ShoppingBag size={12} strokeWidth={2} />
            Add
          </span>
        </div>
      </Link>

      {/* Metadata */}
      <Link to={productHref} className="block transition-colors p-2 rounded-sm mt-1">
        <div className="flex justify-between items-start">
          <h3 className="text-[#e5e2e1] se-body max-w-[70%] leading-tight font-medium line-clamp-2">
            {product?.name || "Untitled piece"}
          </h3>
          <div className="flex flex-col items-end shrink-0 pl-2">
            <p className="text-[#D4AF37] se-instrument text-right tabular-nums font-semibold">
              {formatLKR(price)}
            </p>
            {discountPct > 0 && basePrice > 0 && (
              <span className="se-instrument text-[10px] text-gray-500 line-through tabular-nums text-right mt-0.5">
                {formatLKR(basePrice)}
              </span>
            )}
            {totalStock > 0 && totalStock <= 5 ? (
              <p className="se-label text-[9px] tracking-[0.28em] text-[#f2ca50] mt-1">
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
    </motion.div>
  );
};

export default ProductCard;
