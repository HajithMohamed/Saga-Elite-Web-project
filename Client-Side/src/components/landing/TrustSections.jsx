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
              <card.icon className="w-12 h-12 text-[#f2ca50] mb-6 transition-transform group-hover:scale-110" strokeWidth={1.5} />
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
const TESTIMONIALS = [
  {
    name: "Aisha M.",
    location: "Colombo",
    quote: "Amazing quality, fast delivery, and exactly what I expected. I'll definitely order again!",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150",
  },
  {
    name: "Daniel R.",
    location: "Kandy",
    quote: "Quality you can feel. The boots are now my everyday go-to — quick delivery and beautiful packaging.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150&h=150",
  },
  {
    name: "Priya S.",
    location: "Galle",
    quote: "It feels like having a personal stylist guiding me to pieces that actually suit my life. 10/10 service.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150",
  },
];

export function CustomerTestimonials() {
  return (
    <section className={SECTION_CONTAINER}>
      <div className="text-center mb-12 md:mb-16">
        <h2 className="se-serif text-[32px] md:text-[40px] text-[#e5e2e1] mb-4">
          What Our Customers Say
        </h2>
        <p className="se-body text-base md:text-[18px] text-[#99907c] max-w-2xl mx-auto">
          Thousands of customers trust Saga Elite for premium fashion.
        </p>
      </div>

      {/* Testimonials Grid/Carousel */}
      <div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory hide-scrollbar md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible md:pb-0">
        {TESTIMONIALS.map((t, i) => (
          <Reveal key={i} delay={i * 0.1}>
            <div className="flex flex-col justify-between rounded-[20px] bg-[#131313] border border-[#f2ca50]/20 p-8 w-[85vw] sm:w-[320px] md:w-auto md:max-w-[340px] lg:max-w-[390px] h-full min-h-[240px] lg:min-h-[260px] snap-center shrink-0">
              <div>
                <div className="flex gap-1 text-[#f2ca50] mb-4">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="se-body text-[16px] leading-relaxed text-[#e5e2e1] line-clamp-4 italic">
                  "{t.quote}"
                </p>
              </div>
              <div className="flex items-center gap-4 mt-6">
                <img src={t.avatar} alt={t.name} className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover border-2 border-[#1a1a1a]" loading="lazy" />
                <div>
                  <h4 className="font-sans font-semibold text-[16px] md:text-[18px] text-[#e5e2e1]">{t.name}</h4>
                  <p className="text-[12px] md:text-[14px] text-[#99907c]">{t.location}</p>
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Trust Indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-12 md:mt-16 border-t border-white/5 pt-12 md:pt-16">
        {[
          { label: "Average Rating", value: "4.9/5" },
          { label: "Orders Delivered", value: "25,000+" },
          { label: "Happy Customers", value: "12,000+" },
          { label: "Delivery", value: "Islandwide" },
        ].map((stat, i) => (
          <div key={i} className="text-center p-4 bg-[#0a0a0a] rounded-[16px] border border-white/5">
            <div className="font-serif text-[24px] md:text-[32px] text-[#f2ca50] mb-1">{stat.value}</div>
            <div className="se-label text-[11px] md:text-[12px] text-[#99907c] uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>
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
