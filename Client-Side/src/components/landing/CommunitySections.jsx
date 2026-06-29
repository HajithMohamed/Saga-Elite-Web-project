import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  Mail,
  Check,
  ShoppingBag,
  Star,
  Users,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal, Eyebrow, Btn } from "@/components/ui/editorial";

const SECTION_CONTAINER = "mx-auto w-full max-w-[1280px] px-4 md:px-8 py-[64px] md:py-[80px] lg:py-[96px]";

// ─────────────────────────────────────────────────────────────────────────────
// 1. Community Gallery
// ─────────────────────────────────────────────────────────────────────────────
const GALLERY_IMAGES = [
  { id: 1, url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=600", user: "@samantha_styles", product: "Silk Slip Dress" },
  { id: 2, url: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=600", user: "@kavindu_x", product: "Oversized Hoodie" },
  { id: 3, url: "https://images.unsplash.com/photo-1492447166138-50c3889fccb1?auto=format&fit=crop&q=80&w=600", user: "@amanda.wear", product: "Cargo Pants" },
  { id: 4, url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=600", user: "@colombo_fits", product: "Classic Trench" },
  { id: 5, url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=600", user: "@styleby_neth", product: "Linen Blazer" },
  { id: 6, url: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&q=80&w=600", user: "@ruwan.d", product: "Leather Jacket" },
  { id: 7, url: "https://images.unsplash.com/photo-1485518882345-15568b007407?auto=format&fit=crop&q=80&w=600", user: "@tanya_looks", product: "Pleated Skirt" },
  { id: 8, url: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&q=80&w=600", user: "@urban_lk", product: "Denim Essentials" },
];

export function CommunityGallery() {
  const [activeId, setActiveId] = useState(null);

  return (
    <section className={cn(SECTION_CONTAINER, "bg-[#050505] border-y border-[#1a1a1a]")}>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
        <div>
          <h2 className="se-serif text-[32px] md:text-[40px] text-[#e5e2e1] mb-4">
            Join the Saga Elite Community
          </h2>
          <p className="se-body text-base md:text-[18px] text-[#99907c] max-w-xl">
            See how our customers style their favorite Saga Elite collections across Sri Lanka.
          </p>
        </div>
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 border border-[#f2ca50] text-[#f2ca50] hover:bg-[#f2ca50] hover:text-[#0a0a0a] px-6 py-3 rounded-[14px] font-sans font-semibold text-[14px] transition-colors shrink-0"
        >
          <Instagram className="w-4 h-4" />
          Follow Us
        </a>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-[24px]">
        {GALLERY_IMAGES.map((img, i) => {
          const isActive = activeId === img.id;
          return (
            <Reveal key={img.id} delay={i * 0.05}>
              <div 
                className="group relative w-full aspect-square rounded-[20px] overflow-hidden bg-[#131313] cursor-pointer"
                onMouseEnter={() => setActiveId(img.id)}
                onMouseLeave={() => setActiveId(null)}
                onClick={() => setActiveId(isActive ? null : img.id)} // For mobile tap
              >
                <img
                  src={img.url}
                  alt={`Styled by ${img.user}`}
                  loading="lazy"
                  className={cn(
                    "w-full h-full object-cover transition-transform duration-500 ease-out",
                    isActive ? "scale-[1.05]" : "scale-100"
                  )}
                />
                
                {/* Dark Overlay */}
                <div 
                  className={cn(
                    "absolute inset-0 bg-[#0a0a0a]/40 flex flex-col justify-end p-4 md:p-6 transition-opacity duration-250 ease-out",
                    isActive ? "opacity-100" : "opacity-0"
                  )}
                >
                  <p className="font-sans font-semibold text-[14px] md:text-[16px] text-[#e5e2e1]">
                    {img.user}
                  </p>
                  <p className="se-body text-[12px] md:text-[14px] text-[#d0c5af] mb-4">
                    Wearing: {img.product}
                  </p>
                  
                  <button className="h-[44px] w-full bg-[#f2ca50] text-[#0a0a0a] rounded-[14px] font-sans font-bold text-[13px] flex items-center justify-center gap-2 transition-transform hover:-translate-y-[2px]">
                    <ShoppingBag className="w-4 h-4" />
                    Shop This Look
                  </button>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Newsletter Section
// ─────────────────────────────────────────────────────────────────────────────
const NEWSLETTER_BENEFITS = [
  "Exclusive Drops",
  "Early Sale Access",
  "Member Rewards",
  "Style Inspiration"
];

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success

  const onSubmit = (e) => {
    e.preventDefault();
    setStatus("loading");
    // Simulate API call
    setTimeout(() => {
      setStatus("success");
      setEmail("");
    }, 1000);
  };

  return (
    <section className={SECTION_CONTAINER}>
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#f2ca50]/20 p-8 md:p-12 lg:p-16 min-h-[260px] md:min-h-[300px] lg:min-h-[340px] flex flex-col lg:flex-row lg:items-center gap-10 lg:gap-16">
        {/* Glow Accent */}
        <div className="absolute -left-32 -bottom-32 w-96 h-96 bg-[#f2ca50]/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex-1">
          <h2 className="se-serif text-[28px] md:text-[36px] lg:text-[40px] text-[#e5e2e1] mb-4 leading-tight">
            Stay Ahead of Every Drop
          </h2>
          <p className="se-body text-[16px] md:text-[18px] text-[#99907c] mb-6 max-w-md">
            Be the first to know about exclusive collections, premium offers, and limited-edition releases.
          </p>
          <div className="flex flex-wrap gap-4">
            {NEWSLETTER_BENEFITS.map((b, i) => (
              <div key={i} className="flex items-center gap-2 text-[#d0c5af]">
                <Check className="w-4 h-4 text-[#f2ca50]" />
                <span className="se-body text-[14px]">{b}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 w-full lg:w-[480px]">
          {status === "success" ? (
            <div className="h-[56px] w-full rounded-[16px] border border-[#f2ca50] bg-[#f2ca50]/10 flex items-center justify-center gap-3 text-[#f2ca50] font-sans font-semibold transition-all">
              <Check className="w-5 h-5" />
              You're on the list.
            </div>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#99907c]" />
                <input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-[56px] bg-[#131313] border border-white/10 rounded-[16px] pl-12 pr-4 text-[#e5e2e1] se-body text-[16px] placeholder:text-[#99907c] focus:outline-none focus:border-[#f2ca50] transition-colors"
                />
              </div>
              <button 
                type="submit" 
                disabled={status === "loading"}
                className="h-[56px] min-w-[180px] bg-[#f2ca50] text-[#0a0a0a] rounded-[16px] font-sans font-bold text-[15px] transition-transform duration-250 hover:-translate-y-[2px] disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {status === "loading" ? "Joining..." : "Subscribe"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Instagram & Social Proof
// ─────────────────────────────────────────────────────────────────────────────
const SOCIAL_LINKS = [
  { icon: Instagram, name: "Instagram", desc: "Daily style inspiration" },
  { icon: Facebook, name: "Facebook", desc: "Community updates" },
  { icon: Youtube, name: "YouTube", desc: "Behind the scenes" },
  { icon: Twitter, name: "X", desc: "Brand news & drops" },
];

const SOCIAL_STATS = [
  { value: "25K+", label: "Followers" },
  { value: "12K+", label: "Happy Customers" },
  { value: "4.9★", label: "Average Rating" },
  { value: "100%", label: "Secure Checkout" },
];

export function InstagramSection() {
  return (
    <section className={SECTION_CONTAINER}>
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
        {/* Left: Social Media */}
        <div>
          <h2 className="se-serif text-[32px] md:text-[40px] text-[#e5e2e1] mb-4">
            Follow Saga Elite
          </h2>
          <p className="se-body text-[16px] md:text-[18px] text-[#99907c] mb-10 max-w-md">
            Discover daily fashion inspiration, exclusive drops, behind-the-scenes content, and customer stories.
          </p>

          <div className="flex overflow-x-auto lg:grid lg:grid-cols-2 gap-4 pb-4 hide-scrollbar snap-x">
            {SOCIAL_LINKS.map((link, i) => (
              <a 
                key={i} 
                href="#"
                className="group flex items-center gap-4 p-4 rounded-[16px] bg-[#131313] border border-white/5 transition-all duration-250 hover:border-[#f2ca50]/50 shrink-0 w-[240px] lg:w-auto snap-start"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#1A1A1A] text-[#e5e2e1] transition-all duration-250 group-hover:bg-[#f2ca50] group-hover:text-[#0a0a0a] group-hover:rotate-[8deg]">
                  <link.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-sans font-semibold text-[15px] text-[#e5e2e1] group-hover:text-[#f2ca50] transition-colors">{link.name}</h4>
                  <p className="text-[12px] text-[#99907c]">{link.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Right: Statistics */}
        <div className="grid grid-cols-2 gap-4 md:gap-6">
          {SOCIAL_STATS.map((stat, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className="flex flex-col items-center justify-center text-center p-8 bg-[#131313] rounded-[20px] border border-white/5 h-[160px] md:h-[200px]">
                <div className="font-serif text-[32px] md:text-[48px] text-[#f2ca50] mb-2">{stat.value}</div>
                <div className="se-label text-[12px] md:text-[14px] text-[#99907c] uppercase tracking-wider">{stat.label}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
