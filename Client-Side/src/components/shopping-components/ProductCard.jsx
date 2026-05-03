import React, { useMemo } from "react";
import { Link } from "react-router-dom";
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
  const wishlistItems = useSelector(
    (state) => state.cart.wishlist?.items ?? []
  );

  const slug = product?.slug;
  const productHref = slug
    ? `/shopping/product/${slug}`
    : `/shopping/product-list`;

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

  const colorPreview = useMemo(() => {
    const colors = (product?.variants || [])
      .map((v) => v?.color)
      .filter(Boolean);
    return [...new Set(colors)].slice(0, 4);
  }, [product?.variants]);

  const stock = stockTone(product);
  const articleNo = String(index + 1).padStart(3, "0");
  const isLimited = Boolean(product?.isLimited);
  const showSaleBadge = discountPct > 0;
  const isNew = isNewProduct(product);

  return (
    <article
      className={cn(
        "group bg-[#0a0a0a] flex flex-col h-full",
        density === "default" ? "p-5 md:p-6" : "p-4",
        className
      )}
    >
      {/* IMAGE */}
      <Link
        to={productHref}
        className="relative block overflow-hidden border border-[#4d4635] hover:border-[#99907c] transition-colors"
        style={{ aspectRatio: "4/5" }}
      >
        <img
          src={product?.images?.[0]?.url || "/LOGO.png"}
          alt={product?.name || "Piece"}
          loading={index < 4 ? "eager" : "lazy"}
          className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
          draggable={false}
        />

        {/* Top-left: category eyebrow */}
        <div className="absolute top-3 left-3">
          <span className="inline-block bg-[#0a0a0a]/85 backdrop-blur-sm border border-[#4d4635] px-2 py-1 se-label text-[9px] tracking-[0.28em] text-[#d0c5af]">
            {product?.category || "Atelier"}
          </span>
        </div>

        {/* Top-right: status badges */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
          {isLimited && <StatusBadge status="live" label="Limited" />}
          {isNew && !isLimited && (
            <StatusBadge status="published" label="New" />
          )}
          {showSaleBadge && (
            <StatusBadge status="rejected" label={`−${discountPct}%`} />
          )}
        </div>

        {/* Bottom-right: wishlist */}
        <button
          type="button"
          onClick={handleWishlist}
          aria-pressed={inWishlist}
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          className={cn(
            "absolute bottom-3 right-3 w-9 h-9 flex items-center justify-center border transition-colors se-focus",
            inWishlist
              ? "bg-[#0a0a0a]/90 border-[#f2ca50] text-[#f2ca50]"
              : "bg-[#0a0a0a]/85 backdrop-blur-sm border-[#4d4635] text-[#d0c5af] hover:border-[#99907c] hover:text-[#e5e2e1]"
          )}
        >
          <Heart
            size={14}
            strokeWidth={1.75}
            className={inWishlist ? "fill-[#f2ca50]" : ""}
          />
        </button>
      </Link>

      {/* META ROW: art-no + drop name */}
      {density === "default" && (
        <div className="mt-4 md:mt-5 flex items-baseline justify-between gap-3">
          <span className="se-mono text-[10px] text-[#574500]">
            N° {articleNo}
          </span>
          <span className="se-label text-[9px] tracking-[0.28em] text-[#99907c] truncate max-w-[60%] text-right">
            {product?.drop?.name || "Independent Release"}
          </span>
        </div>
      )}

      {/* NAME */}
      <Link
        to={productHref}
        className="mt-2 block hover:text-[#f2ca50] transition-colors"
      >
        <h3 className="se-headline text-[#e5e2e1] text-lg md:text-xl truncate">
          {product?.name || "Untitled piece"}
        </h3>
      </Link>

      <Hairline className="mt-3 md:mt-4" />

      {/* PRICE */}
      <div className="mt-3 md:mt-4 flex items-baseline gap-3 flex-wrap">
        <span className="se-mono text-base md:text-lg text-[#e5e2e1] tabular-nums">
          {formatLKR(price)}
        </span>
        {discountPct > 0 && basePrice > 0 && (
          <span className="se-mono text-xs text-[#574500] line-through tabular-nums">
            {formatLKR(basePrice)}
          </span>
        )}
      </div>

      {/* COLOR PREVIEW + STOCK */}
      {density === "default" && (
        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {colorPreview.map((c) => (
              <ColorSwatch
                key={c}
                color={c}
                size={18}
                selected={false}
                disabled={false}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="!cursor-default pointer-events-none"
              />
            ))}
            {(product?.variants || []).length > colorPreview.length && (
              <span className="se-label text-[9px] tracking-[0.28em] text-[#99907c]">
                +{(product?.variants || []).length - colorPreview.length}
              </span>
            )}
          </div>
          {stock && (
            <div className="flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: stock.color }}
              />
              <span
                className="se-label text-[9px] tracking-[0.28em]"
                style={{ color: stock.color }}
              >
                {stock.label}
              </span>
            </div>
          )}
        </div>
      )}

      {/* CTA */}
      <div className="mt-5 md:mt-6">
        <Link to={productHref} className="block">
          <Btn variant="ghost" size="sm" iconRight={ArrowRight} className="w-full">
            Read this piece
          </Btn>
        </Link>
      </div>
    </article>
  );
};

export default ProductCard;
