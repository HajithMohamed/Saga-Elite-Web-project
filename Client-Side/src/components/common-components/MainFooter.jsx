import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowRight, Building2 } from "lucide-react";
import { getAllDrops } from "@/store/admin/drop-slice";
import { CONTACT_INFO } from "@/config";
import { Eyebrow, Hairline, Wordmark } from "@/components/ui/editorial";

const computeCountdown = (target) => {
  if (!target) return null;
  const diff = target - new Date();
  if (diff <= 0) return null;
  return {
    d: String(Math.floor(diff / 86400000)).padStart(2, "0"),
    h: String(Math.floor((diff / 3600000) % 24)).padStart(2, "0"),
    m: String(Math.floor((diff / 60000) % 60)).padStart(2, "0"),
    s: String(Math.floor((diff / 1000) % 60)).padStart(2, "0"),
  };
};

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
    <path
      fill="currentColor"
      d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
    />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
    <path
      fill="currentColor"
      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
    />
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
    <path
      fill="currentColor"
      d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"
    />
  </svg>
);

const VisaBadge = () => (
  <svg width="40" height="24" viewBox="0 0 40 24" aria-label="Visa">
    <rect width="40" height="24" rx="2" fill="#1a1a1a" stroke="#4d4635" />
    <text x="20" y="16" fill="#e5e2e1" fontSize="10" fontWeight="700" textAnchor="middle" fontFamily="Geist, sans-serif">
      VISA
    </text>
  </svg>
);

const MastercardBadge = () => (
  <svg width="40" height="24" viewBox="0 0 40 24" aria-label="Mastercard">
    <rect width="40" height="24" rx="2" fill="#1a1a1a" stroke="#4d4635" />
    <circle cx="14" cy="12" r="6.5" fill="#EB001B" />
    <circle cx="26" cy="12" r="6.5" fill="#F79E1B" />
    <ellipse cx="20" cy="12" rx="2.5" ry="6.5" fill="#FF5F00" />
  </svg>
);

const MainFooter = () => {
  const location = useLocation();
  const isAdminView = location.pathname.startsWith("/admin");
  const dispatch = useDispatch();
  const { drops } = useSelector((state) => state.drop);
  const [nextDrop, setNextDrop] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!isAdminView && drops.length === 0) dispatch(getAllDrops());
  }, [dispatch, isAdminView, drops.length]);

  useEffect(() => {
    if (isAdminView || drops.length === 0) return;
    const upcoming = [...drops]
      .filter((d) => d?.releaseDate && new Date(d.releaseDate) > new Date())
      .sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate));
    setNextDrop(upcoming[0] || null);
  }, [drops, isAdminView]);

  useEffect(() => {
    if (!nextDrop?.releaseDate) {
      setCountdown(null);
      return;
    }
    const target = new Date(nextDrop.releaseDate);
    const tick = () => setCountdown(computeCountdown(target));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextDrop]);

  if (isAdminView) return null;

  const cols = [
    {
      title: "Atelier",
      items: [
        { label: "All products", to: "/shopping/product-list" },
        { label: "New arrivals", to: "/shopping/product-list?sort=newest" },
        { label: "Drops calendar", to: "/shopping/product-list?category=drops" },
        { label: "Sale archive", to: "/shopping/product-list?sale=true" },
      ],
    },
    {
      title: "Customer",
      items: [
        { label: "My account", to: "/shopping/account" },
        { label: "Orders", to: "/shopping/orders" },
        { label: "Manual transfer", to: "/shopping/manual-payment" },
        { label: "Wishlist", to: "/shopping/wishlist" },
      ],
    },
    {
      title: "House",
      items: [
        { label: "About", to: "/about" },
        { label: "Contact", to: "/contact" },
        { label: "My reviews", to: "/account/my-reviews" },
        {
          label: "WhatsApp atelier",
          href: `https://wa.me/${(CONTACT_INFO?.whatsapp || "").replace(/\D/g, "")}`,
          external: true,
        },
      ],
    },
    {
      title: "Legal",
      items: [
        { label: "Privacy", to: "/legal/privacy-policy" },
        { label: "Terms", to: "/legal/terms-and-conditions" },
        { label: "Refunds", to: "/legal/refund-policy" },
        { label: "Delivery", to: "/legal/delivery-policy" },
      ],
    },
  ];

  return (
    <footer className="bg-[#0e0e0e] border-t border-[#4d4635]/60">
      <div className="px-5 md:px-12 py-12 md:py-20">
        {/* Top Section: Community & Newsletter */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-16">
          <Eyebrow tone="gold" size="md">Join the Community</Eyebrow>
          <h3 className="mt-4 se-serif text-3xl md:text-4xl text-[#e5e2e1]">Receive the journal, read it slowly.</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              console.log("Footer newsletter:", email);
              setEmail("");
            }}
            className="mt-8 flex items-end gap-3 border-b border-[#4d4635] focus-within:border-[#f2ca50] pb-3 w-full max-w-sm transition-colors mx-auto"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.name@email.com"
              className="bg-transparent flex-1 se-body text-sm text-[#e5e2e1] placeholder:text-[#574500] outline-none py-1"
            />
            <button
              type="submit"
              className="se-label text-[10px] tracking-[0.28em] text-[#f2ca50] hover:text-[#ffe088] flex items-center gap-1"
            >
              Subscribe <ArrowRight size={12} strokeWidth={1.5} />
            </button>
          </form>
        </div>

        {/* Bottom Section: Footer Link Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 py-16 border-t border-[#4d4635]/50">
          {/* Brand Column */}
          <div className="md:col-span-4 flex flex-col items-start gap-4">
            <Link to="/shopping/home">
              <Wordmark size="lg" tagline />
            </Link>
            <p className="text-[#d0c5af]/80 text-sm mt-2 leading-relaxed max-w-sm">
              Sri Lanka's premium streetwear brand. An atelier of limited-edition streetwear, made in Sri Lanka, sent to ninety-three countries.
            </p>
            <div className="flex flex-wrap items-center gap-5 mt-4">
              <a href={CONTACT_INFO?.socials?.instagram || "#"} target="_blank" rel="noopener noreferrer" className="text-[#d0c5af] hover:text-[#f2ca50] transition-colors"><InstagramIcon /></a>
              <a href={CONTACT_INFO?.socials?.facebook || "#"} target="_blank" rel="noopener noreferrer" className="text-[#d0c5af] hover:text-[#f2ca50] transition-colors"><FacebookIcon /></a>
              <a href={CONTACT_INFO?.socials?.tiktok || "#"} target="_blank" rel="noopener noreferrer" className="text-[#d0c5af] hover:text-[#f2ca50] transition-colors"><TikTokIcon /></a>
            </div>
            {/* Next drop teaser moved here if desired, or can be kept off if it's already on the page */}
            {nextDrop && countdown ? (
              <div className="mt-8 border border-[#4d4635] px-5 py-4 w-full">
                <Eyebrow tone="muted" size="xs">Next drop</Eyebrow>
                <div className="mt-2 se-headline text-[#e5e2e1] text-lg truncate">
                  {nextDrop.name || "Untitled chapter"}
                </div>
                <div className="mt-3 flex items-baseline gap-3 se-mono text-[#f2ca50] text-sm tabular-nums">
                  <span>{countdown.d}d</span>
                  <span className="text-[#4d4635]">·</span>
                  <span>{countdown.h}h</span>
                  <span className="text-[#4d4635]">·</span>
                  <span>{countdown.m}m</span>
                  <span className="text-[#4d4635]">·</span>
                  <span>{countdown.s}s</span>
                </div>
              </div>
            ) : null}
          </div>

          {/* Links Columns */}
          {cols.map((c) => (
            <div key={c.title} className="md:col-span-2 flex flex-col gap-3">
              <h4 className="se-label text-[#e5e2e1] mb-2">{c.title}</h4>
              {c.items.map((it) => (
                <div key={it.label}>
                  {it.external ? (
                    <a
                      href={it.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="se-body text-sm text-[#d0c5af] hover:text-[#e5e2e1] transition-colors"
                    >
                      {it.label}
                    </a>
                  ) : (
                    <Link
                      to={it.to}
                      className="se-body text-sm text-[#d0c5af] hover:text-[#e5e2e1] transition-colors"
                    >
                      {it.label}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        <Hairline className="mt-8" tone="soft" />

        {/* Bottom credits */}
        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="se-label text-[9px] tracking-[0.32em] text-[#574500]">
            © Saga Elite Pvt Ltd · Colombo · MMXXVI
          </div>
          <div className="flex flex-wrap items-center gap-3">
             <Eyebrow tone="muted" size="xs">Accepts</Eyebrow>
             <VisaBadge />
             <MastercardBadge />
             <span className="inline-flex items-center gap-1.5 border border-[#4d4635] px-2 h-6 se-label text-[9px] tracking-[0.18em] text-[#d0c5af]">
               <Building2 className="h-3 w-3" />
               Bank
             </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 se-label text-[9px] tracking-[0.3em] text-[#99907c]">
            <Link to="/legal/privacy-policy" className="hover:text-[#f2ca50] transition-colors">Privacy</Link>
            <span className="text-[#4d4635]">·</span>
            <Link to="/legal/terms-and-conditions" className="hover:text-[#f2ca50] transition-colors">Terms</Link>
            <span className="text-[#4d4635]">·</span>
            <Link to="/legal/refund-policy" className="hover:text-[#f2ca50] transition-colors">Refunds</Link>
            <span className="text-[#4d4635]">·</span>
            <Link to="/legal/delivery-policy" className="hover:text-[#f2ca50] transition-colors">Delivery</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default MainFooter;
