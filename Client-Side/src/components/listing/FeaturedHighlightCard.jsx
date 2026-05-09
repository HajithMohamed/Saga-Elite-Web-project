import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Flame } from "lucide-react";

const formatLKR = (value = 0) =>
  `LKR ${(Number(value) || 0).toLocaleString("en-LK", {
    maximumFractionDigits: 0,
  })}`;

// Large 12-col cinematic spotlight. Renders a single product as a feature with
// large image, big serif name, "Only N pieces remaining" badge if low-stock.
// Hides itself if `product` is null/undefined.
const FeaturedHighlightCard = ({ product, eyebrow = "Drop Exclusive" }) => {
  if (!product) return null;

  const totalStock = Number(
    product?.totalStock ??
      (product?.variants || []).reduce(
        (sum, v) => sum + Math.max(0, Number(v?.stock || 0)),
        0
      )
  );
  const slug = product?.slug || product?._id;
  const href = slug ? `/shopping/product/${slug}` : "/shopping/product-list";
  const image = product?.images?.[0]?.url || "/LOGO.png";
  const basePrice = product?.basePrice || 0;
  const discountPct = Number(product?.discountPercent || 0);
  const price = basePrice * (1 - discountPct / 100);

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="relative bg-[#050505] py-16 md:py-24 overflow-hidden border-y border-[#1a1a1a]"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[#f2ca50]/8 blur-[140px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-[1440px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Image */}
        <Link
          to={href}
          className="lg:col-span-7 group relative overflow-hidden border border-[#4d4635] hover:border-[#f2ca50] transition-colors aspect-[4/3] block"
          style={{ boxShadow: "0 0 60px rgba(0,0,0,0.5)" }}
        >
          <img
            src={image}
            alt={product?.name || "Featured piece"}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/60 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-[#f2ca50] text-[#0a0a0a] px-3 py-1.5 font-mono text-[9px] tracking-[0.32em] uppercase font-bold">
            <Flame size={12} strokeWidth={2} />
            {eyebrow}
          </div>
        </Link>

        {/* Copy */}
        <div className="lg:col-span-5">
          <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-[#f2ca50] mb-4">
            Featured Piece
          </p>
          <h2 className="font-display text-[36px] md:text-[56px] leading-[0.95] uppercase text-[#FAF7F2] mb-6 tracking-tight">
            {product?.name || "Untitled piece"}
          </h2>
          {product?.description ? (
            <p className="font-sans text-sm md:text-base text-[#d0c5af] leading-relaxed mb-8 max-w-md line-clamp-3">
              {product.description}
            </p>
          ) : null}

          {totalStock > 0 && totalStock <= 12 ? (
            <p className="font-mono text-[11px] tracking-[0.28em] uppercase text-[#ffb4ab] mb-6 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab] animate-pulse" />
              Only {totalStock} {totalStock === 1 ? "piece" : "pieces"} remaining
            </p>
          ) : totalStock === 0 ? (
            <p className="font-mono text-[11px] tracking-[0.28em] uppercase text-[#ffb4ab] mb-6">
              Sold out — archived
            </p>
          ) : null}

          <div className="flex items-center gap-4 mb-8">
            <p className="font-display text-2xl md:text-3xl text-[#f2ca50] tabular-nums">
              {formatLKR(price)}
            </p>
            {discountPct > 0 ? (
              <p className="font-mono text-sm text-[#99907c] line-through tabular-nums">
                {formatLKR(basePrice)}
              </p>
            ) : null}
          </div>

          <Link
            to={href}
            className="inline-flex items-center gap-3 bg-[#f2ca50] hover:bg-[#ffe088] text-[#0a0a0a] px-8 py-4 font-mono text-[11px] tracking-[0.3em] uppercase font-bold transition-colors group"
            style={{ boxShadow: "0 0 24px rgba(242,202,80,0.2)" }}
          >
            Explore Piece
            <ArrowRight
              size={14}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </div>
      </div>
    </motion.section>
  );
};

export default FeaturedHighlightCard;
