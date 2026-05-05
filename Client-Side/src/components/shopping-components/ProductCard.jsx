import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { ArrowRight, Heart } from "lucide-react";
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

const ProductCard = ({ product, density = "default", index = 0, className }) => {
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

  const stock = stockTone(product);
  const isLimited = Boolean(product?.isLimited);
  const isSoldOut = stock?.label === "Sold out";
  
  // Need to extract the left pieces properly from variants
  const variants = product?.variants || [];
  const piecesLeft = variants.reduce((sum, v) => sum + Math.max(0, Number(v?.stock || 0)), 0);

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
      <Link to={productHref} className="relative aspect-[4/5] overflow-hidden bg-[#131313] block">
        <img
          src={product?.images?.[0]?.url || "/LOGO.png"}
          alt={product?.name || "Piece"}
          loading={index < 4 ? "eager" : "lazy"}
          className="object-cover w-full h-full transition-all duration-[600ms] group-hover:brightness-90 group-hover:scale-[1.02]"
        />

        {/* Hype Badges */}
        {isSoldOut ? (
          <div className="absolute top-3 left-3 bg-[#0a0a0a]/90 text-[#e5e2e1] px-3 py-1 se-label text-[9px] tracking-[0.28em] border border-[#4d4635] backdrop-blur-sm">
            Archived
          </div>
        ) : piecesLeft > 0 && piecesLeft < 5 ? (
          <div className="absolute top-3 left-3 bg-[#93000a] text-[#ffb4ab] px-3 py-1 se-label text-[9px] tracking-[0.28em] backdrop-blur-sm">
            {piecesLeft} Pieces Left
          </div>
        ) : isLimited ? (
          <div className="absolute top-3 left-3 bg-[#0a0a0a]/90 text-[#e5e2e1] px-3 py-1 se-label text-[9px] tracking-[0.28em] border border-[#4d4635] backdrop-blur-sm">
            Limited Drop
          </div>
        ) : null}

        {/* Bottom-right: wishlist */}
        <motion.button
          type="button"
          onClick={handleWishlist}
          whileTap={{ scale: 0.7 }}
          transition={{ type: "spring", stiffness: 500, damping: 12, mass: 1.5 }}
          aria-pressed={inWishlist}
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          className={cn(
            "absolute bottom-3 right-3 w-9 h-9 flex items-center justify-center border transition-colors se-focus z-10",
            inWishlist
              ? "bg-[#0a0a0a]/90 border-[#f2ca50] text-[#f2ca50]"
              : "bg-[#0a0a0a]/85 backdrop-blur-sm border-[#4d4635] text-[#d0c5af] hover:border-[#99907c] hover:text-[#e5e2e1]"
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
        </motion.button>
      </Link>

      {/* Metadata */}
      <Link to={productHref} className="block transition-colors group-hover:bg-[#131313] p-1 rounded-sm -mx-1">
        <div className="flex justify-between items-start">
          <h3 className="text-[#e5e2e1] se-body max-w-[70%] leading-tight truncate">
            {product?.name || "Untitled piece"}
          </h3>
          <div className="flex flex-col items-end">
            <p className="text-[#d0c5af] se-instrument text-right tabular-nums">
              {formatLKR(price)}
            </p>
            {discountPct > 0 && basePrice > 0 && (
              <span className="se-instrument text-[10px] text-[#574500] line-through tabular-nums text-right">
                {formatLKR(basePrice)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
