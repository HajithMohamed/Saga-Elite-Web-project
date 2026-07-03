import React from "react";
import { Link } from "react-router-dom";
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
import { Reveal, Eyebrow, Btn } from "@/components/ui/editorial";
import ProductCard from "@/components/shopping-components/ProductCard";
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
      <h2 className="mt-3 se-serif text-3xl text-ink-2 sm:text-4xl md:text-5xl">{title}</h2>
      {subtitle && <p className="mt-4 se-body text-sm leading-relaxed text-muted md:text-base">{subtitle}</p>}
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
          <h2 className="se-serif text-[28px] md:text-[36px] lg:text-[40px] text-ink-2 leading-tight">
            {title}
          </h2>
          {subtitle && <p className="mt-2 se-body text-[16px] md:text-[18px] text-muted">{subtitle}</p>}
        </div>
        
        {/* Desktop View All Button (Right Side) */}
        <div className="hidden md:block">
          <Link
            to={ctaHref}
            className="flex h-[52px] items-center justify-center rounded-[16px] border border-gold-ink bg-transparent px-8 se-body text-sm font-semibold text-gold-ink transition-colors hover:bg-gold hover:text-ongold"
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
              className="flex h-[40px] items-center justify-center rounded-full border border-gold-ink bg-transparent px-6 se-body text-sm text-ink-2 transition-colors hover:bg-gold hover:text-ongold"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-[24px]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "bg-panel rounded-[20px] animate-[pulse_1.5s_ease-in-out_infinite]",
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
          <div className="flex flex-col items-center justify-center rounded-[24px] border border-line/40 bg-page p-12 text-center">
            <ShoppingBag className="w-12 h-12 text-line mb-4" />
            <p className="se-body text-lg text-ink-2 mb-2">No products available yet.</p>
            <p className="se-body text-sm text-muted mb-6">We are currently curating this collection.</p>
            <Link to="/shopping/product-list">
              <button className="h-[52px] px-8 rounded-[16px] bg-gold text-ongold font-semibold text-sm transition-transform hover:-translate-y-1">
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
                  ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-[24px]" 
                  : "flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory hide-scrollbar lg:overflow-visible lg:grid lg:grid-cols-4 lg:gap-[24px]"
              )}
            >
              {products.slice(0, 8).map((p, idx) => (
                <div 
                  key={p._id || p.id || idx} 
                  className={cn(
                    layout === "carousel" 
                      ? "w-[85vw] sm:w-[260px] snap-start shrink-0 lg:w-auto lg:shrink" 
                      : "w-full"
                  )}
                >
                  <ProductCard product={p} index={idx} className={layout === "carousel" ? "w-full" : ""} />
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
            className="flex h-[52px] w-full items-center justify-center rounded-[16px] border border-gold-ink bg-transparent px-8 se-body text-sm font-semibold text-gold-ink transition-colors hover:bg-gold hover:text-ongold"
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
    <section className="border-y border-ink/5 bg-page py-16 md:py-24">
      <div className={CONTAINER}>
        <SectionHeading
          kicker="New to Saga Elite?"
          title="How shopping works"
          subtitle="Four simple steps from browsing to unboxing — we walk you through every one."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.06}>
              <div className="relative h-full rounded-2xl border border-line/40 bg-panel p-7">
                <div className="absolute -top-4 left-7 grid h-9 w-9 place-items-center rounded-full bg-page se-mono text-sm text-gold-ink">
                  {i + 1}
                </div>
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-gold to-gold-deep text-ongold">
                  <s.icon className="h-7 w-7" />
                </div>
                <h3 className="mt-5 se-headline text-xl text-ink-2">{s.title}</h3>
                <p className="mt-2 se-body text-sm leading-relaxed text-muted">{s.desc}</p>
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
            <div className="flex h-full gap-4 rounded-2xl border border-line/40 p-6 transition-colors hover:border-gold-ink/50">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-page text-gold-ink">
                <it.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="se-headline text-base text-ink-2">{it.title}</h3>
                <p className="mt-1 se-body text-sm text-muted">{it.desc}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ── SHOP BY CATEGORY (DB-driven) ─────────────────────────────────────────────
// Tiles come from the real Category collection (see fetchHomeCategories). Equal
// heights via a fixed aspect ratio, `min-w-0` truncation so names never push the
// arrow out of bounds, and no horizontal scroll at any breakpoint. Hidden when
// there are no categories to show; skeletons while the parent is still loading.
export function ShopByCategory({ categories = [], loading = false }) {
  if (loading) {
    return (
      <section id="categories" className="mx-auto w-full max-w-[1280px] px-4 md:px-8 py-[64px] md:py-[80px] lg:py-[96px]">
        <div className="mb-10 h-9 w-64 rounded-lg bg-panel animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] rounded-[20px] bg-panel animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (!categories || categories.length === 0) return null;

  return (
    // The hero's "Browse Categories" button scrolls to this anchor.
    <section id="categories" className="mx-auto w-full max-w-[1280px] px-4 md:px-8 py-[64px] md:py-[80px] lg:py-[96px]">
      <div className="mb-10 md:mb-14">
        <h2 className="se-serif text-[28px] md:text-[36px] lg:text-[40px] text-ink-2">Shop by Category</h2>

        {/* Quick-link chips (same real categories) */}
        <div className="mt-6 flex flex-wrap gap-3">
          {categories.map((c) => (
            <Link
              key={`chip-${c.slug || c.name}`}
              to={c.href}
              className="flex h-[40px] items-center justify-center rounded-full border border-gold-ink bg-transparent px-6 se-body text-sm text-ink-2 transition-colors hover:bg-gold hover:text-ongold"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Grid: Mobile 1-col, Tablet/Desktop 3-col. Fixed aspect ratio → equal heights, no overflow. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
        {categories.map((c, i) => (
          <Reveal key={c.slug || c.name} delay={i * 0.05}>
            <Link
              to={c.href}
              className="group relative flex flex-col overflow-hidden rounded-[20px] bg-panel
                         aspect-[4/5] cursor-pointer
                         transition-transform duration-250 hover:scale-[1.03] hover:shadow-[0_0_15px_rgba(242,202,80,0.15)]"
            >
              {/* Image Area */}
              <div className="relative flex-1 w-full overflow-hidden rounded-t-[20px]">
                <img
                  src={c.img || FALLBACK_IMG}
                  alt={c.name}
                  loading="lazy"
                  onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
                  className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-250 group-hover:scale-[1.05]"
                />
              </div>

              {/* Content Area */}
              <div className="flex shrink-0 items-center justify-between bg-panel p-4 md:p-6">
                <h3 className="se-headline min-w-0 flex-1 truncate pr-2 text-[14px] sm:text-[16px] md:text-[18px] text-ink-2">{c.name}</h3>
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full border border-ink/10 text-gold-ink transition-colors group-hover:border-gold-ink group-hover:bg-gold/10">
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </div>
              </div>

              {/* Hover Glow Border */}
              <div className="pointer-events-none absolute inset-0 rounded-[20px] border border-transparent transition-colors duration-250 group-hover:border-gold-ink/50" />
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
        <div className="group relative overflow-hidden rounded-[24px] border border-gold-ink/20 bg-page flex flex-col md:flex-row h-[400px] sm:h-[450px] md:h-[320px] lg:h-[420px]">
          
          {/* Mobile: Image Top / Content Bottom. Desktop: Split Layout (Left Content 45%, Right Image 55%) */}
          
          {/* Content (Bottom on Mobile, Left on Desktop) */}
          <div className="order-2 md:order-1 flex w-full md:w-[45%] flex-col justify-center p-8 lg:p-14 z-10 bg-page relative overflow-hidden">
            <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-gold/10 blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <h2 className="se-serif text-[32px] md:text-[36px] lg:text-[48px] leading-tight text-ink-2 mb-4">
                Summer Sale
              </h2>
              <p className="se-body text-base md:text-[18px] text-cream mb-8">
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
            <div className="hidden md:block absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-page to-transparent" />
            {/* Mobile Fade Gradient */}
            <div className="md:hidden absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-page to-transparent" />
          </div>

        </div>
      </Reveal>
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
        <div className="rounded-3xl border border-line/40 bg-page p-8 md:p-14">
          <div className="grid gap-8 md:grid-cols-2 md:items-center md:gap-16">
            <div>
              <Eyebrow tone="gold" size="sm">About Saga Elite</Eyebrow>
              <h2 className="mt-3 se-serif text-3xl text-ink-2 md:text-4xl">
                A curated luxury<br />online destination.
              </h2>
              <p className="mt-5 se-body text-sm leading-relaxed text-muted">
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
                  <div className="se-serif text-3xl text-gold-ink">{s.k}</div>
                  <div className="mt-1 se-body text-xs text-muted">{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

// ── Newsletter signup (live subscribe) ───────────────────────────────────────

