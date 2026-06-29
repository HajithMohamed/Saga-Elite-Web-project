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

// ── Shared live product grid ────────────────────────────────────────────────
export function ProductRailGrid({
  id,
  kicker,
  title,
  subtitle,
  products = [],
  loading = false,
  ctaHref = "/shopping/product-list",
  ctaLabel = "View all",
}) {
  return (
    <section id={id} className={`${CONTAINER} py-16 md:py-24`}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 md:mb-10">
        <div>
          {kicker && <Eyebrow tone="gold" size="sm">{kicker}</Eyebrow>}
          <h2 className="mt-2 se-serif text-3xl text-[#e5e2e1] sm:text-4xl">{title}</h2>
          {subtitle && <p className="mt-2 max-w-xl se-body text-sm text-[#99907c]">{subtitle}</p>}
        </div>
        <Link
          to={ctaHref}
          className="hidden items-center gap-2 se-label text-[11px] tracking-[0.18em] text-[#d0c5af] transition-colors hover:text-[#f2ca50] sm:inline-flex"
        >
          {ctaLabel} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] animate-pulse rounded-2xl border border-white/5 bg-[#1a1a1a] md:aspect-[4/5]"
            />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-[#4d4635]/40 bg-[#0d0d0d] p-8 text-center">
          <p className="se-body text-sm text-[#99907c]">New pieces are landing soon — check back shortly.</p>
        </div>
      ) : (
        <Reveal>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {products.slice(0, 8).map((p, idx) => (
              <ProductCard key={p._id || p.id || idx} product={p} index={idx} />
            ))}
          </div>
        </Reveal>
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

// ── Featured collections (static copy, live category images) ─────────────────
export function FeaturedCollections({ categoryImages = {} }) {
  const cols = [
    {
      title: "For Her",
      desc: "Dresses, tops and statement pieces curated for unforgettable moments.",
      img: categoryImages?.ladies?.main || FALLBACK_IMG,
      href: "/shopping/product-list?category=ladies",
    },
    {
      title: "For Him",
      desc: "Sharp tailoring, refined shirts and quiet-luxury staples.",
      img: categoryImages?.gents?.main || FALLBACK_IMG,
      href: "/shopping/product-list?category=gents",
    },
    {
      title: "The Drops",
      desc: "Limited capsule releases. Once a chapter closes, it's gone for good.",
      img: categoryImages?.unisex?.main || FALLBACK_IMG,
      href: "/shopping/drops",
    },
  ];
  return (
    <section className={`${CONTAINER} py-16 md:py-24`}>
      <SectionHeading kicker="Featured Collections" title="Edits made for moments" />
      <div className="grid gap-5 md:grid-cols-3 md:gap-6">
        {cols.map((c, i) => (
          <Reveal key={c.title} delay={i * 0.06}>
            <Link
              to={c.href}
              className="group relative block aspect-[4/5] overflow-hidden rounded-2xl border border-white/5 bg-[#131313]"
            >
              <img
                src={c.img}
                alt={c.title}
                loading="lazy"
                onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-[#e5e2e1]">
                <h3 className="se-serif text-2xl">{c.title}</h3>
                <p className="mt-2 max-w-xs se-body text-sm text-[#d0c5af]">{c.desc}</p>
                <span className="mt-4 inline-flex items-center gap-2 se-label text-[10px] tracking-[0.2em] text-[#f2ca50]">
                  Shop the edit <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ── Promo banner (static, links to offers) ───────────────────────────────────
export function PromoBanner() {
  return (
    <section className={`${CONTAINER} py-12 md:py-20`}>
      <div className="relative overflow-hidden rounded-3xl border border-[#f2ca50]/20 bg-[#0a0a0a]">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#f2ca50]/10 blur-3xl" />
        <div className="absolute inset-0 bg-grain opacity-30 mix-blend-overlay" />
        <div className="relative grid gap-6 p-8 md:p-16">
          <div className="max-w-xl">
            <Eyebrow tone="gold" size="sm">Limited Time</Eyebrow>
            <h2 className="mt-3 se-serif text-4xl text-[#e5e2e1] md:text-5xl">
              The Season Edit, <span className="text-[#f2ca50]">on offer</span>
            </h2>
            <p className="mt-4 max-w-md se-body text-sm text-[#d0c5af]">
              A curated selection of our most-loved pieces at exclusive member pricing — only while stocks last.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/offers"><Btn variant="default" iconRight={ArrowRight}>Shop the offers</Btn></Link>
              <Link to="/shopping/drops"><Btn variant="outline">See the drops</Btn></Link>
            </div>
          </div>
        </div>
      </div>
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
