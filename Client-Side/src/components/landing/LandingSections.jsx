import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  Lock,
  MessageCircle,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { formatLkr } from "@/utils/currency";
import { getRemainingTime } from "@/utils/time";

const sectionContainer = "max-w-[1280px] mx-auto px-6";

export const HeroCarousel = ({ slides = [] }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length, paused]);

  return (
    <section className="relative h-[280px] md:h-[420px] overflow-hidden">
      <div
        className="h-full w-full flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {slides.map((slide) => (
          <button
            type="button"
            key={slide.id}
            data-href={slide.ctaLink}
            onClick={() => navigate(slide.ctaLink)}
            className="relative min-w-full h-full text-left"
            aria-label={`Open ${slide.headline}`}
          >
            {slide.imageUrl ? (
              <img src={slide.imageUrl} alt={slide.headline} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full" style={{ background: slide.fallback }} />
            )}
            <div className="absolute inset-0 bg-[#2C2C2A]/35" />
            <div className={`${sectionContainer} absolute left-0 right-0 bottom-8`}>
              <p className="font-sans text-[11px] tracking-[0.2em] uppercase text-[#C9A96E]">{slide.label}</p>
              <h2 className="font-display text-[24px] md:text-[38px] text-[#FAF7F2]">{slide.headline}</h2>
              <p className="font-sans text-base text-[#FAF7F2]/80">{slide.subheadline}</p>
              <span className="inline-flex mt-4 rounded-lg bg-primary px-6 py-3 text-[#FAF7F2] hover:bg-primary-hover transition-all duration-200">
                {slide.ctaText} <ArrowRight className="ml-2 h-4 w-4" />
              </span>
            </div>
          </button>
        ))}
      </div>

      <button
        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white hover:bg-primary transition-all"
        onClick={() => setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length)}
        aria-label="Previous slide"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      <button
        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white hover:bg-primary transition-all"
        onClick={() => setActiveIndex((prev) => (prev + 1) % slides.length)}
        aria-label="Next slide"
      >
        <ArrowRight className="h-4 w-4" />
      </button>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => setActiveIndex(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`h-2.5 w-2.5 rounded-full ${activeIndex === index ? "bg-[#FAF7F2]" : "bg-[#FAF7F2]/40"}`}
          />
        ))}
      </div>
    </section>
  );
};

export const TrustBar = () => {
  const items = [
    { icon: Truck, text: "Free delivery over LKR 2,000" },
    { icon: ArrowLeft, text: "Easy 14-day returns" },
    { icon: Lock, text: "Secure checkout" },
    { icon: MessageCircle, text: "WhatsApp support" },
  ];
  return (
    <section className="bg-[#131313] border-y border-[#4d4635]/40 py-3 overflow-x-auto">
      <div className={`${sectionContainer} min-w-[760px] md:min-w-0 flex justify-around gap-4`}>
        {items.map((item) => (
          <div key={item.text} className="flex items-center gap-2 whitespace-nowrap text-[#d0c5af] text-xs font-sans">
            <item.icon className="h-4 w-4" />
            {item.text}
          </div>
        ))}
      </div>
    </section>
  );
};

const ProductCard = ({ product, badge = "new" }) => {
  const [activeImage, setActiveImage] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);
  const [hovered, setHovered] = useState(false);
  const inViewRef = useRef(null);
  const [inView, setInView] = useState(false);

  const variantImages = useMemo(() => {
    const variantImageList = product.variants.flatMap((v) => v.images || []);
    const imageList = product.images.map((img) => img.url).filter(Boolean);
    return (variantImageList.length ? variantImageList : imageList).slice(0, 5);
  }, [product.images, product.variants]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.25 }
    );
    if (inViewRef.current) observer.observe(inViewRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || hovered || variantImages.length <= 1) return;
    const timer = setInterval(() => {
      setActiveImage((prev) => (prev + 1) % variantImages.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [inView, hovered, variantImages.length]);

  return (
    <article className="w-[220px] rounded-[12px] border border-[#4d4635]/50 bg-[#131313] shrink-0 overflow-hidden">
      <div
        ref={inViewRef}
        className="relative h-[280px] bg-[#1f1f1f] overflow-hidden"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {variantImages[activeImage] ? (
          <img src={variantImages[activeImage]} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
        ) : null}

        <span className={`absolute top-3 left-3 text-[11px] px-3 py-1 rounded-full ${badge === "deal" ? "bg-[#ffb4ab] text-[#0e0e0e]" : "bg-[#d4af37] text-[#0e0e0e]"}`}>
          {badge === "deal" ? `SALE -${product.discountPercent || 0}%` : "New"}
        </span>
        <button
          type="button"
          aria-label="Toggle wishlist"
          onClick={() => setWishlisted((prev) => !prev)}
          className="absolute top-3 right-3 rounded-full bg-[#0e0e0e]/80 p-1.5"
        >
          <Heart className={`h-4 w-4 ${wishlisted ? "fill-[#ffb4ab] text-[#ffb4ab]" : "text-[#e5e2e1]"}`} />
        </button>

        <button className={`absolute left-0 right-0 bottom-0 h-9 bg-[#f2ca50] text-[#0e0e0e] text-sm transition-all duration-300 ${hovered ? "translate-y-0" : "translate-y-full"}`}>
          Quick Add
        </button>
        {hovered ? (
          <div className="absolute bottom-11 left-1/2 -translate-x-1/2 flex gap-1">
            {variantImages.map((_, index) => (
              <button
                key={`${product.id}-dot-${index}`}
                className={`h-2.5 w-2.5 rounded-full border ${activeImage === index ? "bg-primary border-primary" : "bg-white border-[#C9A96E]"}`}
                onClick={() => setActiveImage(index)}
                aria-label={`Select image ${index + 1}`}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="p-3">
        <h4 className="text-sm font-medium text-[#e5e2e1] truncate">{product.name}</h4>
        <p className="text-xs text-[#d0c5af]">{product.category}</p>
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <span className="text-[#f2ca50] font-medium text-sm">{formatLkr(product.salePrice)}</span>
          <span className="text-[#d0c5af] line-through text-xs">{formatLkr(product.originalPrice)}</span>
          {product.discountPercent > 0 ? (
            <span className="rounded-full bg-[#ffb4ab]/20 px-2 py-0.5 text-[11px] text-[#ffb4ab]">-{product.discountPercent}%</span>
          ) : null}
        </div>
        {product.dealEndsAt ? <DealTimerInline dealEndsAt={product.dealEndsAt} /> : null}
      </div>
    </article>
  );
};

const DealTimerInline = ({ dealEndsAt }) => {
  const [value, setValue] = useState(() => getRemainingTime(dealEndsAt));
  useEffect(() => {
    const timer = setInterval(() => setValue(getRemainingTime(dealEndsAt)), 1000);
    return () => clearInterval(timer);
  }, [dealEndsAt]);
  const hours = Math.floor(value.totalMs / 3600000);
  const minutes = Math.floor((value.totalMs % 3600000) / 60000);
  return <p className="mt-1 text-[11px] text-deal">Ends in {hours}h {minutes}m</p>;
};

export const ProductSlider = ({ title, subtitle, products = [], deal = false }) => {
  const scrollerRef = useRef(null);
  const scrollBy = (distance) => scrollerRef.current?.scrollBy({ left: distance, behavior: "smooth" });

  return (
    <section className={`${sectionContainer} py-10`}>
      <div className="flex justify-between items-end mb-4">
        <div>
          <h3 className="font-display text-[28px] text-[#e5e2e1]">{title}</h3>
          <p className="text-[13px] text-[#d0c5af]">{subtitle}</p>
        </div>
        <Link className="text-[#f2ca50] text-sm" to="/shopping/product-list">View All →</Link>
      </div>
      <div className="relative">
        <button className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 rounded-full border border-[#4d4635] bg-[#0e0e0e] text-[#e5e2e1] p-2" onClick={() => scrollBy(-300)} aria-label="Scroll left">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div ref={scrollerRef} className="flex gap-4 overflow-x-auto snap-x scroll-smooth pb-2">
          {products.map((product) => <ProductCard key={product.id} product={product} badge={deal ? "deal" : "new"} />)}
        </div>
        <button className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 rounded-full border border-[#4d4635] bg-[#0e0e0e] text-[#e5e2e1] p-2" onClick={() => scrollBy(300)} aria-label="Scroll right">
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
};

export const CategoryGrid = ({ title, subtitle, categories = [] }) => (
  <section className={`${sectionContainer} py-8`}>
    <h3 className="font-display text-[26px] text-[#e5e2e1]">{title}</h3>
    <p className="text-[13px] text-[#d0c5af] mb-4">{subtitle}</p>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {categories.map((category) => (
        <Link key={category.name} to={category.link} className="group relative rounded-[12px] overflow-hidden bg-surface aspect-[3/4]">
          {category.image ? (
            <img src={category.image} alt={category.name} className="h-full w-full object-cover group-hover:scale-105 transition-all duration-300" loading="lazy" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#0e0e0e] via-[#1f1f1f] to-[#393939]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-3 left-3">
            <p className="font-display text-[#FAF7F2] text-lg">{category.name}</p>
            <p className="text-[#FAF7F2] text-sm opacity-0 group-hover:opacity-100 transition">Shop Now →</p>
          </div>
        </Link>
      ))}
    </div>
  </section>
);

export const TrendingGrid = ({ products = [] }) => (
  <section className={`${sectionContainer} py-10`}>
    <h3 className="font-display text-[26px] text-[#e5e2e1]">Trending Now</h3>
    <p className="text-sm text-[#d0c5af]">Based on what Sri Lanka is buying</p>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
      {products.map((product, index) => (
        <div key={product.id} className="relative">
          <span className="absolute top-2 left-2 z-10 h-6 w-6 rounded-full bg-[#C9A96E] text-[#2C2C2A] text-xs grid place-items-center">
            {index + 1}
          </span>
          <ProductCard product={product} badge="new" />
        </div>
      ))}
    </div>
  </section>
);

export const BrandStoryStrip = () => (
  <section className="bg-[#0b0b0b] py-12 mt-6 border-y border-[#4d4635]/40">
    <div className={`${sectionContainer} grid md:grid-cols-3 gap-6 text-[#FAF7F2]`}>
      <div>
        <h3 className="font-display text-[28px]">Made in Sri Lanka</h3>
        <p className="text-[#FAF7F2]/70 text-sm">Designed for modern Sri Lankan style with premium craftsmanship.</p>
      </div>
      <div className="font-display text-3xl space-y-2">
        <p>500+ Styles</p>
        <p>50,000+ Happy Customers</p>
        <p>15+ Stores</p>
      </div>
      <div className="flex items-center md:justify-end">
        <Link to="/contact" className="border border-[#d4af37] px-5 py-3 text-[#d4af37] hover:bg-[#d4af37] hover:text-[#0e0e0e] rounded-lg transition-all">
          Visit Our Stores
        </Link>
      </div>
    </div>
  </section>
);

export const SocialProofStrip = ({ images = [] }) => (
  <section className={`${sectionContainer} py-10`}>
    <h4 className="text-sm text-[#d0c5af]">As seen on Instagram</h4>
    <div className="mt-4 flex gap-3 overflow-x-auto">
      {(images.length ? images : Array.from({ length: 6 }).map(() => "")).slice(0, 6).map((image, index) => (
        <div key={index} className="group relative h-[120px] w-[120px] rounded-lg bg-surface shrink-0 overflow-hidden">
          {image ? (
            <img src={image} alt={`Saga Elite social preview ${index + 1}`} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#0e0e0e] via-[#131313] to-[#2a2a2a]" />
          )}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/60 text-white text-xs grid place-items-center transition">
            @sagaelite
          </div>
        </div>
      ))}
    </div>
    <p className="mt-3 text-[#f2ca50] text-sm">Follow us @sagaelite →</p>
  </section>
);

export const FlashDealHeaderTimer = ({ endsAt }) => {
  const [timer, setTimer] = useState(() => getRemainingTime(endsAt));
  useEffect(() => {
    const interval = setInterval(() => setTimer(getRemainingTime(endsAt)), 1000);
    return () => clearInterval(interval);
  }, [endsAt]);
  return <span className="bg-[#f2ca50] text-[#0e0e0e] px-3 py-1 rounded text-sm font-mono">{timer.hh}:{timer.mm}:{timer.ss}</span>;
};

export const QuickActions = () => (
  <div className="flex items-center gap-2">
    <Link to="/shopping/wishlist" className="p-2 border rounded-full"><Heart className="h-4 w-4" /></Link>
    <Link to="/shopping/cart" className="p-2 border rounded-full"><ShoppingCart className="h-4 w-4" /></Link>
  </div>
);

