import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Truck,
  ShieldCheck,
  Gem,
  Headphones,
  Search,
  Check,
  CreditCard,
  PackageCheck,
  Star,
  ChevronDown,
  ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal, Eyebrow } from "@/components/ui/editorial";
import { fetchTopReviews, fetchStoreStats } from "@/services/landing-api";

const SECTION_CONTAINER = "mx-auto w-full max-w-[1280px] px-4 md:px-8 py-[64px] md:py-[80px] lg:py-[96px]";

// ─────────────────────────────────────────────────────────────────────────────
// 1. Why Choose Saga Elite
// ─────────────────────────────────────────────────────────────────────────────
const TRUST_CARDS = [
  {
    icon: Truck,
    title: "Islandwide Delivery",
    desc: "Fast and reliable delivery across Sri Lanka.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    desc: "Your payment information is encrypted and protected.",
  },
  {
    icon: Gem,
    title: "Premium Quality",
    desc: "Carefully selected fashion with premium craftsmanship.",
  },
  {
    icon: Headphones,
    title: "Responsive Support",
    desc: "Our team is ready to help whenever you need assistance.",
  },
];

export function WhyChooseSaga() {
  return (
    <section className={SECTION_CONTAINER}>
      <div className="text-center mb-12 md:mb-16">
        <h2 className="se-serif text-[32px] md:text-[40px] text-[#e5e2e1] mb-4">
          Why Choose Saga Elite
        </h2>
        <p className="se-body text-base md:text-[18px] text-[#99907c] max-w-2xl mx-auto">
          Premium fashion, trusted service, and a seamless shopping experience designed for everyone.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-[24px]">
        {TRUST_CARDS.map((card, i) => (
          <Reveal key={i} delay={i * 0.1}>
            <div className="group flex flex-col items-start rounded-[20px] bg-[#1A1A1A] p-6 md:p-8 border border-white/10 transition-all duration-250 hover:border-[#f2ca50] hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(242,202,80,0.1)] w-full h-[220px]">
              {/* Fixed icon box → equal visual weight across all four cards */}
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#f2ca50]/10">
                <card.icon className="h-7 w-7 text-[#f2ca50] transition-transform group-hover:scale-110" strokeWidth={1.5} />
              </div>
              <h3 className="font-sans font-semibold text-[18px] md:text-[20px] text-[#e5e2e1] mb-2">
                {card.title}
              </h3>
              <p className="se-body text-[14px] md:text-[16px] text-[#99907c] leading-relaxed">
                {card.desc}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. How Shopping Works
// ─────────────────────────────────────────────────────────────────────────────
const SHOPPING_STEPS = [
  {
    icon: Search,
    title: "Browse Products",
    desc: "Explore thousands of fashion products across every category.",
  },
  {
    icon: ShoppingBag,
    title: "Choose Size & Add",
    desc: "Select your preferred size and add the item to your shopping cart.",
  },
  {
    icon: CreditCard,
    title: "Secure Checkout",
    desc: "Provide your delivery details and complete payment securely.",
  },
  {
    icon: PackageCheck,
    title: "Receive Your Order",
    desc: "Relax while we deliver your fashion directly to your doorstep.",
  },
];

export function HowShoppingWorks() {
  return (
    <section className={cn(SECTION_CONTAINER, "bg-[#0b0b0b] border-y border-white/5")}>
      <div className="text-center mb-12 md:mb-16">
        <h2 className="se-serif text-[32px] md:text-[40px] text-[#e5e2e1] mb-4">
          How Shopping Works
        </h2>
        <p className="se-body text-base md:text-[18px] text-[#99907c] max-w-2xl mx-auto">
          Shopping online has never been easier. Follow these four simple steps.
        </p>
      </div>

      {/* Desktop/Tablet Grid + Mobile Timeline */}
      <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-[24px]">
        {/* Mobile Vertical Line */}
        <div className="absolute left-[39px] top-0 bottom-0 w-[2px] bg-white/10 sm:hidden z-0" />

        {SHOPPING_STEPS.map((step, i) => (
          <Reveal key={i} delay={i * 0.15}>
            <div className="relative z-10 flex flex-row sm:flex-col items-center sm:items-start gap-6 sm:gap-6 w-full lg:w-[260px] h-auto lg:h-[280px] bg-[#131313] sm:bg-transparent rounded-[20px] p-6 sm:p-0 border sm:border-none border-white/5">
              
              {/* Connector (Desktop Only) */}
              {i < SHOPPING_STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-[28px] left-[72px] right-[-48px] h-[2px] bg-gradient-to-r from-[#f2ca50]/50 to-transparent z-[-1]" />
              )}

              <div className="relative shrink-0 flex items-center justify-center w-14 h-14 rounded-full bg-[#1A1A1A] border border-[#f2ca50]/30 shadow-[0_0_20px_rgba(242,202,80,0.1)] text-[#f2ca50]">
                <step.icon className="w-6 h-6" />
                <div className="absolute -top-2 -right-2 flex items-center justify-center w-6 h-6 rounded-full bg-[#f2ca50] text-[#0a0a0a] font-bold text-[12px]">
                  {i + 1}
                </div>
              </div>
              
              <div className="flex flex-col sm:mt-2">
                <h3 className="font-sans font-semibold text-[18px] text-[#e5e2e1] mb-2">
                  {step.title}
                </h3>
                <p className="se-body text-[14px] md:text-[15px] text-[#99907c] leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Customer Testimonials & Trust Indicators
// ─────────────────────────────────────────────────────────────────────────────
export function CustomerTestimonials() {
  const [reviews, setReviews] = React.useState([]);
  const [stats, setStats] = React.useState(null);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    Promise.all([fetchTopReviews(6), fetchStoreStats()]).then(([r, s]) => {
      if (!active) return;
      setReviews(Array.isArray(r) ? r : []);
      setStats(s);
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

  // Trust indicators are built ONLY from real, present metrics — any absent
  // metric simply doesn't render a card (no fabricated numbers, no padding).
  const trustIndicators = [];
  if (stats?.happyCustomers)
    trustIndicators.push({ label: "Happy Customers", value: `${Number(stats.happyCustomers).toLocaleString()}+` });
  if (stats?.totalOrders)
    trustIndicators.push({ label: "Orders Delivered", value: `${Number(stats.totalOrders).toLocaleString()}+` });
  if (stats?.totalProducts)
    trustIndicators.push({ label: "Products", value: Number(stats.totalProducts).toLocaleString() });
  if (stats?.averageRating)
    trustIndicators.push({ label: "Average Rating", value: `${Number(stats.averageRating).toFixed(1)}/5` });

  // Still loading → reserve space with a light skeleton to avoid layout shift.
  if (!loaded) {
    return (
      <section className={SECTION_CONTAINER}>
        <div className="mx-auto mb-12 h-10 w-72 rounded-lg bg-[#131313] animate-pulse" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[240px] rounded-[20px] bg-[#131313] animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  // Nothing real to show → hide the section entirely.
  if (reviews.length === 0 && trustIndicators.length === 0) return null;

  return (
    <section className={SECTION_CONTAINER}>
      {reviews.length > 0 && (
        <>
          <div className="text-center mb-12 md:mb-16">
            <h2 className="se-serif text-[32px] md:text-[40px] text-[#e5e2e1] mb-4">
              What Our Customers Say
            </h2>
            <p className="se-body text-base md:text-[18px] text-[#99907c] max-w-2xl mx-auto">
              Real reviews from verified Saga Elite customers.
            </p>
          </div>

          {/* Testimonials Grid/Carousel */}
          <div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory hide-scrollbar md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible md:pb-0">
            {reviews.map((t, i) => (
              <Reveal key={t._id || i} delay={i * 0.1}>
                <div className="flex flex-col justify-between rounded-[20px] bg-[#131313] border border-[#f2ca50]/20 p-8 w-[85vw] sm:w-[320px] md:w-auto md:max-w-[340px] lg:max-w-[390px] h-full min-h-[240px] lg:min-h-[260px] snap-center shrink-0">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex gap-1 text-[#f2ca50]">
                        {Array.from({ length: 5 }).map((_, s) => (
                          <Star key={s} className={cn("w-4 h-4", s < Math.round(t.rating) ? "fill-current" : "text-white/20")} />
                        ))}
                      </div>
                      {t.verifiedPurchase && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#f2ca50]/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#f2ca50]">
                          <Check className="w-3 h-3" /> Verified
                        </span>
                      )}
                    </div>
                    <p className="se-body text-[16px] leading-relaxed text-[#e5e2e1] line-clamp-4 italic">
                      &ldquo;{t.content}&rdquo;
                    </p>
                  </div>
                  <div className="flex items-center gap-4 mt-6">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden bg-[#1a1a1a] flex items-center justify-center border-2 border-[#f2ca50]/30 shrink-0">
                      {t.customer?.avatar ? (
                        <img
                          src={t.customer.avatar}
                          alt={t.customer.name}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="se-serif text-[#f2ca50] text-xl">
                          {(t.customer?.name || "A").charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-sans font-semibold text-[16px] md:text-[18px] text-[#e5e2e1] truncate">
                        {t.customer?.name || "Verified Buyer"}
                      </h4>
                      <p className="text-[12px] md:text-[14px] text-[#99907c] truncate">
                        {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "Recently"}
                        {t.product ? ` · ${t.product}` : ""}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </>
      )}

      {/* Trust Indicators (real metrics only) */}
      {trustIndicators.length > 0 && (
        <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6", reviews.length > 0 && "mt-12 md:mt-16 border-t border-white/5 pt-12 md:pt-16")}>
          {trustIndicators.map((stat, i) => (
            <div key={i} className="text-center p-4 bg-[#0a0a0a] rounded-[16px] border border-white/5">
              <div className="font-serif text-[24px] md:text-[32px] text-[#f2ca50] mb-1">{stat.value}</div>
              <div className="se-label text-[11px] md:text-[12px] text-[#99907c] uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. FAQ Preview
// ─────────────────────────────────────────────────────────────────────────────
const FAQS = [
  { q: "How long does delivery take?", a: "Standard delivery typically takes 2-4 business days within Colombo, and 3-6 business days for the rest of Sri Lanka." },
  { q: "How can I track my order?", a: "Once your order is shipped, you will receive an SMS and email with a tracking link to follow your package in real-time." },
  { q: "Can I return products?", a: "Yes, we offer a 14-day return policy for unused items in their original packaging. Please check our Returns page for full details." },
  { q: "Which payment methods are accepted?", a: "We accept all major Credit/Debit Cards, Koko, Mintpay, and Cash on Delivery (COD) for eligible areas." },
  { q: "How do I contact support?", a: "You can reach out to our team via email at support@sagaelite.com or via WhatsApp from 9 AM to 6 PM daily." },
];

export function FAQPreview() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (i) => setOpenIndex(openIndex === i ? null : i);

  return (
    <section className={cn(SECTION_CONTAINER, "bg-[#0b0b0b]")}>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10 md:mb-12">
          <h2 className="se-serif text-[32px] md:text-[40px] text-[#e5e2e1] mb-4">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="bg-[#131313] rounded-[16px] border border-white/5 overflow-hidden transition-all duration-250"
              >
                <button
                  onClick={() => toggle(i)}
                  className="w-full flex items-center justify-between px-6 min-h-[60px] text-left focus:outline-none focus:ring-2 focus:ring-[#f2ca50] focus:ring-inset"
                  aria-expanded={isOpen}
                >
                  <span className="font-sans font-medium text-[16px] text-[#e5e2e1] pr-4">{faq.q}</span>
                  <ChevronDown className={cn("w-5 h-5 text-[#f2ca50] transition-transform duration-250 shrink-0", isOpen && "rotate-180")} />
                </button>
                <div
                  className={cn(
                    "grid transition-[grid-template-rows] duration-250 ease-out",
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-6 se-body text-[15px] text-[#99907c] leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Link to="/contact">
            <button className="h-[48px] px-8 rounded-full border border-[#f2ca50] text-[#f2ca50] font-sans font-semibold text-[14px] transition-colors hover:bg-[#f2ca50] hover:text-[#0a0a0a]">
              View All FAQs
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Trust Badges Strip
// ─────────────────────────────────────────────────────────────────────────────
const BADGES = [
  "Secure Checkout",
  "Islandwide Delivery",
  "Premium Quality",
  "Easy Returns",
  "Customer Support"
];

export function TrustBadgesStrip() {
  return (
    <div className="w-full bg-[#f2ca50] py-4 overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8">
        <div className="flex items-center gap-6 md:gap-12 overflow-x-auto hide-scrollbar whitespace-nowrap md:justify-center">
          {BADGES.map((badge, i) => (
            <div key={i} className="flex items-center gap-2 text-[#0a0a0a] shrink-0">
              <Check className="w-4 h-4 md:w-5 md:h-5" strokeWidth={3} />
              <span className="font-sans font-bold text-[12px] md:text-[14px] uppercase tracking-wider">{badge}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
