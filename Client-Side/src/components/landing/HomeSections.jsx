import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  ArrowRight,
  Star,
  MousePointerClick,
  ShoppingBag,
  CreditCard,
  PackageCheck,
  Mail,
  Sparkles,
  Truck,
  ShieldCheck,
  RefreshCcw,
  Gem,
} from "lucide-react";
import { Reveal, Eyebrow, Btn, Disclosure } from "@/components/ui/editorial";
import ProductCard from "@/components/shopping-components/ProductCard";
import { toast } from "@/hooks/use-toast";
import { API_V1_URL as API_BASE } from "@/lib/api";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Homepage sections — the "retail" layout adapted to Saga Elite's dark/gold
// editorial system. Static marketing copy + a shared live ProductRailGrid that
// reuses the canonical ProductCard. Everything composes inside Home.jsx; the
// page chrome (header/footer/announcement) comes from the layout.
// ─────────────────────────────────────────────────────────────────────────────

const CONTAINER = "mx-auto w-full max-w-7xl px-4 md:px-8";
const FALLBACK_IMG = "/placeholder.jpg";

function SectionHeading({ kicker, title, subtitle, align = "center" }) {
  return (
    <div className={`mb-10 md:mb-14 ${align === "center" ? "mx-auto max-w-2xl text-center" : ""}`}>
      {kicker && <Eyebrow tone="gold" size="sm">{kicker}</Eyebrow>}
      <h2 className="mt-3 se-serif text-3xl text-[#e5e2e1] sm:text-4xl md:text-5xl">{title}</h2>
      {subtitle && <p className="mt-4 se-body text-sm leading-relaxed text-[#99907c] md:text-base">{subtitle}</p>}
    </div>
  );
}

// ── Shared live product grid (Prompt 04) ───────────────────────────────────
export function ProductRailGrid({
  id,
  kicker,
  title,
  subtitle,
  products = [],
  loading = false,
  ctaHref = "/shopping/product-list",
  ctaLabel = "View All",
  layout = "grid", // 'grid' | 'carousel'
  filters = [], // e.g. ["Trending", "New", "Sale", "Popular", "Shoes", "Women", "Men", "Unisex"]
}) {
  return (
    <section id={id} className="mx-auto w-full max-w-[1280px] px-4 md:px-8 py-[64px] md:py-[80px] lg:py-[96px] overflow-hidden">
      
      {/* Header Area */}
      <div className="mb-8 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-[700px]">
          {kicker && <Eyebrow tone="gold" size="sm" className="mb-2">{kicker}</Eyebrow>}
          <h2 className="se-serif text-[28px] md:text-[36px] lg:text-[40px] text-[#e5e2e1] leading-tight">
            {title}
          </h2>
          {subtitle && <p className="mt-2 se-body text-[16px] md:text-[18px] text-[#99907c]">{subtitle}</p>}
        </div>
        
        {/* Desktop View All Button (Right Side) */}
        <div className="hidden md:block">
          <Link
            to={ctaHref}
            className="flex h-[52px] items-center justify-center rounded-[16px] border border-[#f2ca50] bg-transparent px-8 se-body text-sm font-semibold text-[#f2ca50] transition-colors hover:bg-[#f2ca50] hover:text-[#0a0a0a]"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>

      {/* Product Filter Chips */}
      {filters && filters.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-8">
          {filters.map((f) => (
            <Link
              key={f}
              to={`/shopping/product-list?filter=${f.toLowerCase()}`}
              className="flex h-[40px] items-center justify-center rounded-full border border-[#f2ca50] bg-transparent px-6 se-body text-sm text-[#e5e2e1] transition-colors hover:bg-[#f2ca50] hover:text-[#0a0a0a]"
            >
              {f}
            </Link>
          ))}
        </div>
      )}

      {/* Grid or Carousel Content */}
      <div className="relative w-full">
        {loading ? (
          /* Loading State: Skeletons (4 Desktop, 3 Tablet, 2 Mobile) */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-[24px]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "bg-[#131313] rounded-[20px] animate-[pulse_1.5s_ease-in-out_infinite]",
                  "w-[170px] h-[320px] md:w-[260px] md:h-[420px] lg:w-[290px] lg:h-[460px]",
                  // Hide the 3rd and 4th on mobile, 4th on tablet to match the grid structure
                  i === 2 && "hidden md:block",
                  i === 3 && "hidden lg:block"
                )}
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center rounded-[24px] border border-[#4d4635]/40 bg-[#0d0d0d] p-12 text-center">
            <ShoppingBag className="w-12 h-12 text-[#4d4635] mb-4" />
            <p className="se-body text-lg text-[#e5e2e1] mb-2">No products available yet.</p>
            <p className="se-body text-sm text-[#99907c] mb-6">We are currently curating this collection.</p>
            <Link to="/shopping/product-list">
              <button className="h-[52px] px-8 rounded-[16px] bg-[#f2ca50] text-[#0a0a0a] font-semibold text-sm transition-transform hover:-translate-y-1">
                Continue Shopping
              </button>
            </Link>
          </div>
        ) : (
          /* Products */
          <Reveal>
            <div
              className={cn(
                layout === "grid" 
                  ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-[24px]" 
                  : "flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory hide-scrollbar lg:overflow-visible lg:grid lg:grid-cols-4 lg:gap-[24px]"
              )}
            >
              {products.slice(0, 8).map((p, idx) => (
                <div key={p._id || p.id || idx} className={cn(layout === "carousel" && "snap-start shrink-0 lg:shrink")}>
                  <ProductCard product={p} index={idx} />
                </div>
              ))}
            </div>
          </Reveal>
        )}
      </div>

      {/* Mobile View All Button (Below Grid) */}
      {!loading && products.length > 0 && (
        <div className="mt-10 flex justify-center md:hidden">
          <Link
            to={ctaHref}
            className="flex h-[52px] w-full items-center justify-center rounded-[16px] border border-[#f2ca50] bg-transparent px-8 se-body text-sm font-semibold text-[#f2ca50] transition-colors hover:bg-[#f2ca50] hover:text-[#0a0a0a]"
          >
            {ctaLabel}
          </Link>
        </div>
      )}
    </section>
  );
}

// ── How it works (static) ────────────────────────────────────────────────────
export function HowItWorks() {
  const steps = [
    { icon: MousePointerClick, title: "Browse the edit", desc: "Explore curated pieces by category — no clutter, no guessing." },
    { icon: ShoppingBag, title: "Add to your bag", desc: "Pick your size and colour, tap add. Adjust anytime." },
    { icon: CreditCard, title: "Secure checkout", desc: "Pay safely by card or bank transfer. Guest checkout welcome." },
    { icon: PackageCheck, title: "Delivered to you", desc: "Track your order to your door with islandwide delivery." },
  ];
  return (
    <section className="border-y border-white/5 bg-[#0b0b0b] py-16 md:py-24">
      <div className={CONTAINER}>
        <SectionHeading
          kicker="New to Saga Elite?"
          title="How shopping works"
          subtitle="Four simple steps from browsing to unboxing — we walk you through every one."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.06}>
              <div className="relative h-full rounded-2xl border border-[#4d4635]/40 bg-[#131313] p-7">
                <div className="absolute -top-4 left-7 grid h-9 w-9 place-items-center rounded-full bg-[#0a0a0a] se-mono text-sm text-[#f2ca50]">
                  {i + 1}
                </div>
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#f2ca50] to-[#d4af37] text-[#0a0a0a]">
                  <s.icon className="h-7 w-7" />
                </div>
                <h3 className="mt-5 se-headline text-xl text-[#e5e2e1]">{s.title}</h3>
                <p className="mt-2 se-body text-sm leading-relaxed text-[#99907c]">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Why Saga Elite (static, secondary to WhyChooseSaga) ──────────────────────
// Kept available for reuse; Home composes the richer WhyChooseSaga instead.
export function WhyUsCompact() {
  const items = [
    { icon: Gem, title: "Premium Quality", desc: "Every piece reviewed against our luxury standards before listing." },
    { icon: Truck, title: "Islandwide Delivery", desc: "Fast, tracked delivery to your doorstep." },
    { icon: RefreshCcw, title: "Easy Returns", desc: "Changed your mind? Simple returns, no fuss." },
    { icon: ShieldCheck, title: "Secure Payments", desc: "Bank-grade encryption on every checkout." },
  ];
  return (
    <section className={`${CONTAINER} py-16 md:py-24`}>
      <SectionHeading kicker="Why Saga Elite" title="Built for confident shopping" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it, i) => (
          <Reveal key={it.title} delay={i * 0.06}>
            <div className="flex h-full gap-4 rounded-2xl border border-[#4d4635]/40 p-6 transition-colors hover:border-[#f2ca50]/50">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#0a0a0a] text-[#f2ca50]">
                <it.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="se-headline text-base text-[#e5e2e1]">{it.title}</h3>
                <p className="mt-1 se-body text-sm text-[#99907c]">{it.desc}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ── CATEGORY FILTER QUICK LINKS & SHOP BY CATEGORY (Prompt 03) ───────────────
export function ShopByCategory({ categoryImages = {} }) {
  const categories = [
    { name: "Women", desc: "Elegant styles for every occasion.", img: categoryImages?.ladies?.main || FALLBACK_IMG, href: "/shopping/product-list?category=ladies" },
    { name: "Men", desc: "Sharp tailoring & luxury staples.", img: categoryImages?.gents?.main || FALLBACK_IMG, href: "/shopping/product-list?category=gents" },
    { name: "Unisex", desc: "Staples for everyone.", img: categoryImages?.unisex?.main || FALLBACK_IMG, href: "/shopping/product-list?category=unisex" },
    { name: "Shoes", desc: "Luxury footwear for modern lifestyles.", img: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80", href: "/shopping/product-list?category=shoes" },
    { name: "Bags", desc: "Statement pieces & everyday luxury.", img: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80", href: "/shopping/product-list?category=bags" },
    { name: "Accessories", desc: "Complete your signature look.", img: "https://images.unsplash.com/photo-1509319117193-57bab727e09d?q=80", href: "/shopping/product-list?category=accessories" },
  ];

  const quickLinks = ["Women", "Men", "Unisex", "Shoes", "Accessories", "Bags"];

  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 md:px-8 py-[64px] md:py-[80px] lg:py-[96px]">
      <div className="mb-10 md:mb-14">
        <h2 className="se-serif text-[28px] md:text-[36px] lg:text-[40px] text-[#e5e2e1]">Shop by Category</h2>
        
        {/* Quick Links */}
        <div className="mt-6 flex flex-wrap gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link}
              to={`/shopping/product-list?category=${link.toLowerCase()}`}
              className="flex h-[40px] items-center justify-center rounded-full border border-[#f2ca50] bg-transparent px-6 se-body text-sm text-[#e5e2e1] transition-colors hover:bg-[#f2ca50] hover:text-[#0a0a0a]"
            >
              {link}
            </Link>
          ))}
        </div>
      </div>

      {/* Grid: Desktop 3x2, Tablet 3x2, Mobile 2x3 */}
      <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
        {categories.map((c, i) => (
          <Reveal key={c.name} delay={i * 0.05}>
            <Link
              to={c.href}
              className="group relative block overflow-hidden rounded-[20px] bg-[#131313] 
                         h-[220px] md:h-[340px] lg:h-[460px] cursor-pointer 
                         transition-transform duration-250 hover:scale-[1.03] hover:shadow-[0_0_15px_rgba(242,202,80,0.15)]"
            >
              {/* Image Area (Top 80%) */}
              <div className="absolute inset-x-0 top-0 h-[80%] overflow-hidden rounded-t-[20px]">
                <img
                  src={c.img}
                  alt={c.name}
                  loading="lazy"
                  onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
                  className="h-full w-full object-cover object-center transition-transform duration-250 group-hover:scale-[1.05]"
                />
              </div>
              
              {/* Content Area (Bottom 20%) */}
              <div className="absolute inset-x-0 bottom-0 flex h-[20%] items-center justify-between bg-[#131313] px-4 md:px-6">
                <div>
                  <h3 className="se-headline text-[16px] md:text-[18px] text-[#e5e2e1]">{c.name}</h3>
                  <p className="hidden se-body text-[12px] md:text-[14px] text-[#99907c] sm:block">{c.desc}</p>
                </div>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 text-[#f2ca50] transition-colors group-hover:border-[#f2ca50] group-hover:bg-[#f2ca50]/10">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>

              {/* Hover Glow Border */}
              <div className="pointer-events-none absolute inset-0 rounded-[20px] border border-transparent transition-colors duration-250 group-hover:border-[#f2ca50]/50" />
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ── FEATURED COLLECTIONS (Prompt 03) ─────────────────────────────────────────
export function FeaturedCollections() {
  const collections = [
    {
      title: "Summer Collection",
      desc: "Luxury essentials for the warm season.",
      img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80",
      href: "/shopping/product-list",
    },
    {
      title: "New Season",
      desc: "Fresh arrivals straight from the atelier.",
      img: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80",
      href: "/shopping/product-list",
    },
    {
      title: "Editor's Picks",
      desc: "Curated styles selected by our fashion editors.",
      img: "https://images.unsplash.com/photo-1485230895905-31d044820f51?q=80",
      href: "/shopping/product-list",
    },
  ];

  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 md:px-8 py-[64px] md:py-[80px] lg:py-[96px] overflow-hidden">
      <div className="mb-10 md:mb-14">
        <h2 className="se-serif text-[28px] md:text-[36px] lg:text-[40px] text-[#e5e2e1]">Featured Collections</h2>
      </div>

      {/* Horizontal Scroll on Mobile, Grid on Desktop */}
      <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-3 hide-scrollbar">
        {collections.map((c, i) => (
          <Reveal key={c.title} delay={i * 0.08} className="min-w-[85vw] snap-center sm:min-w-[320px] md:min-w-0">
            <Link
              to={c.href}
              className="group relative block w-full overflow-hidden rounded-[24px] bg-[#131313] 
                         h-[380px] md:h-[420px] lg:h-[500px] cursor-pointer 
                         transition-transform duration-250 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(242,202,80,0.1)]"
            >
              <img
                src={c.img}
                alt={c.title}
                loading="lazy"
                onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-250 group-hover:scale-[1.04]"
              />
              {/* Dark Gradient Overlay (Bottom 60%) */}
              <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
              
              <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end p-6 md:p-8">
                <h3 className="se-serif text-2xl md:text-3xl text-[#e5e2e1]">{c.title}</h3>
                <p className="mt-2 max-w-[90%] se-body text-sm text-[#d0c5af]">{c.desc}</p>
                <div className="mt-6 flex items-center gap-2">
                  <span className="se-label text-[11px] tracking-[0.18em] text-[#f2ca50] relative after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 after:bg-[#f2ca50] after:transition-all after:duration-250 group-hover:after:w-full">
                    Explore Collection
                  </span>
                  <ArrowRight className="h-4 w-4 text-[#f2ca50] transition-transform duration-250 group-hover:translate-x-1" />
                </div>
              </div>

              {/* Hover Glow Border */}
              <div className="pointer-events-none absolute inset-0 rounded-[24px] border border-transparent transition-colors duration-250 group-hover:border-[#f2ca50]/50" />
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ── PROMOTIONAL BANNER (Prompt 03) ───────────────────────────────────────────
export function PromoBanner() {
  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 md:px-8 py-[64px] md:py-[80px] lg:py-[96px]">
      <Reveal duration={0.5}>
        <div className="group relative overflow-hidden rounded-[24px] border border-[#f2ca50]/20 bg-[#0a0a0a] flex flex-col md:flex-row h-[400px] sm:h-[450px] md:h-[320px] lg:h-[420px]">
          
          {/* Mobile: Image Top / Content Bottom. Desktop: Split Layout (Left Content 45%, Right Image 55%) */}
          
          {/* Content (Bottom on Mobile, Left on Desktop) */}
          <div className="order-2 md:order-1 flex w-full md:w-[45%] flex-col justify-center p-8 lg:p-14 z-10 bg-[#0a0a0a] relative overflow-hidden">
            <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#f2ca50]/10 blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <h2 className="se-serif text-[32px] md:text-[36px] lg:text-[48px] leading-tight text-[#e5e2e1] mb-4">
                Summer Sale
              </h2>
              <p className="se-body text-base md:text-[18px] text-[#d0c5af] mb-8">
                A curated selection of our most-loved pieces at exclusive member pricing — only while stocks last.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/offers" className="inline-block transition-transform duration-250 hover:-translate-y-[2px]">
                  <Btn variant="default">Shop Offer</Btn>
                </Link>
                <Link to="/about" className="inline-block transition-transform duration-250 hover:-translate-y-[2px]">
                  <Btn variant="outline">Learn More</Btn>
                </Link>
              </div>
            </div>
          </div>

          {/* Image (Top on Mobile, Right on Desktop) */}
          <div className="order-1 md:order-2 relative w-full md:w-[55%] h-full overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1549439602-43ebca2327af?q=80"
              alt="Promotional Campaign"
              className="absolute inset-0 h-[110%] w-full object-cover transition-transform duration-700 group-hover:-translate-y-[5%]"
              style={{ objectPosition: "center 20%" }}
            />
            {/* Desktop Fade Gradient */}
            <div className="hidden md:block absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#0a0a0a] to-transparent" />
            {/* Mobile Fade Gradient */}
            <div className="md:hidden absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
          </div>

        </div>
      </Reveal>
    </section>
  );
}

// ── Testimonials (static) ────────────────────────────────────────────────────
export function Testimonials() {
  const items = [
    { name: "Aisha M.", role: "First-time shopper", quote: "I was nervous to shop online but Saga Elite made it effortless. Every step was explained and my dress arrived perfectly." },
    { name: "Daniel R.", role: "Verified buyer", quote: "Quality you can feel. The boots are now my everyday go-to — quick delivery and beautiful packaging." },
    { name: "Priya S.", role: "Verified buyer", quote: "It feels like having a personal stylist guiding me to pieces that actually suit my life." },
  ];
  return (
    <section className="border-y border-white/5 bg-[#0b0b0b] py-16 md:py-24">
      <div className={CONTAINER}>
        <SectionHeading kicker="Loved by our community" title="What our shoppers say" />
        <div className="grid gap-5 md:grid-cols-3 md:gap-6">
          {items.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.06}>
              <figure className="h-full rounded-2xl border border-[#4d4635]/40 bg-[#131313] p-7">
                <div className="flex gap-1 text-[#f2ca50]">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <blockquote className="mt-4 se-serif text-lg leading-snug text-[#e5e2e1]">“{t.quote}”</blockquote>
                <figcaption className="mt-6 text-sm">
                  <div className="font-medium text-[#e5e2e1]">{t.name}</div>
                  <div className="text-[#99907c]">{t.role}</div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── About teaser (static, links to /about) ───────────────────────────────────
export function AboutTeaser() {
  const stats = [
    { k: "10k+", v: "Happy customers" },
    { k: "500+", v: "Curated pieces" },
    { k: "4.9★", v: "Average rating" },
  ];
  return (
    <section className={`${CONTAINER} py-16 md:py-24`}>
      <Reveal>
        <div className="rounded-3xl border border-[#4d4635]/40 bg-[#0d0d0d] p-8 md:p-14">
          <div className="grid gap-8 md:grid-cols-2 md:items-center md:gap-16">
            <div>
              <Eyebrow tone="gold" size="sm">About Saga Elite</Eyebrow>
              <h2 className="mt-3 se-serif text-3xl text-[#e5e2e1] md:text-4xl">
                A curated luxury<br />online destination.
              </h2>
              <p className="mt-5 se-body text-sm leading-relaxed text-[#99907c]">
                Saga Elite is a Sri Lankan fashion house built on one belief — that luxury should feel
                welcoming. We curate every collection in-house, bringing you elevated clothing,
                footwear and accessories for women, men and unisex wardrobes.
              </p>
              <Link to="/about" className="mt-7 inline-flex">
                <Btn variant="outline" iconRight={ArrowRight}>Our story</Btn>
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-6">
              {stats.map((s) => (
                <div key={s.v}>
                  <div className="se-serif text-3xl text-[#f2ca50]">{s.k}</div>
                  <div className="mt-1 se-body text-xs text-[#99907c]">{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

// ── FAQ (static, Disclosure accordion) ───────────────────────────────────────
export function HomeFAQ() {
  const faqs = [
    { q: "How do I place my first order?", a: "Browse a category, open any product, choose your size and colour, then tap 'Add to Bag'. Open the bag icon at the top right and follow the simple checkout. You'll get an email confirmation right away." },
    { q: "What payment methods do you accept?", a: "We accept major cards and direct bank transfer (with quick receipt verification). All payments are processed over a secure, encrypted connection." },
    { q: "How long does delivery take?", a: "Most islandwide orders arrive within 2–4 business days. You'll receive a tracking link by email and WhatsApp as soon as your order ships." },
    { q: "Can I return or exchange an item?", a: "Yes — you have 14 days from delivery to request a return or exchange on unworn items in their original packaging." },
    { q: "Are the products authentic?", a: "Every piece is hand-selected and quality-checked by our team before it's listed. We stand behind the craft of everything we sell." },
    { q: "How do I contact support?", a: "Our concierge is available by WhatsApp, email and phone. We usually reply within minutes during opening hours." },
  ];
  return (
    <section className={`${CONTAINER} py-16 md:py-24`}>
      <SectionHeading
        kicker="Help Centre"
        title="Frequently asked questions"
        subtitle="Everything you need to know before your first order — and after."
      />
      <div className="mx-auto max-w-3xl">
        {faqs.map((f, i) => (
          <Disclosure key={i} title={f.q}>
            {f.a}
          </Disclosure>
        ))}
      </div>
    </section>
  );
}

// ── Newsletter signup (live subscribe) ───────────────────────────────────────
export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast({ title: "Enter a valid email", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API_BASE}/newsletter/subscribe`, { email: trimmed });
      toast({ title: "Welcome to Saga Elite", description: "You're on the list — watch your inbox.", variant: "success" });
      setEmail("");
    } catch (err) {
      toast({
        title: "Could not subscribe",
        description: err?.response?.data?.message || "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={`${CONTAINER} pb-20`}>
      <div className="relative overflow-hidden rounded-3xl border border-[#f2ca50]/30 bg-[#0a0a0a] p-8 md:p-14">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#f2ca50]/15 blur-3xl" />
        <div className="relative grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-[#f2ca50]" />
              <Eyebrow tone="gold" size="sm">The Saga Insider</Eyebrow>
            </span>
            <h2 className="mt-3 se-serif text-3xl text-[#e5e2e1] md:text-4xl">
              Join the list for early access &amp; private sales.
            </h2>
            <p className="mt-3 se-body text-sm text-[#99907c]">
              New arrivals, member offers and style notes — straight to your inbox.
            </p>
          </div>
          <form className="flex w-full flex-col gap-3 sm:flex-row" onSubmit={onSubmit}>
            <label htmlFor="home-newsletter-email" className="sr-only">Email address</label>
            <div className="relative flex-1">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#574500]" />
              <input
                id="home-newsletter-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="h-12 w-full rounded-full border border-[#4d4635] bg-[#131313] pl-11 pr-4 se-body text-sm text-[#e5e2e1] placeholder:text-[#574500] outline-none transition-colors focus:border-[#f2ca50]"
              />
            </div>
            <Btn type="submit" variant="default" size="lg" className="rounded-full" disabled={submitting}>
              {submitting ? "Joining…" : "Subscribe"}
            </Btn>
          </form>
        </div>
      </div>
    </section>
  );
}
