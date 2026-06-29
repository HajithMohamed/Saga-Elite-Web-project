import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  ArrowUp,
  MapPin,
  Mail,
  Phone,
  ShieldCheck,
  Lock,
  BadgeCheck,
  ChevronDown,
  Banknote,
  Landmark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchSiteSettings } from "@/services/landing-api";

// lucide ships no WhatsApp brand glyph
const WhatsAppIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.004c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01zM12.04 20.15h-.003a8.23 8.23 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24a8.2 8.2 0 0 1 5.83 2.42 8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29z" />
  </svg>
);

// ── Built-in fallback link columns (used until an admin configures them) ─────
const DEFAULT_QUICK_LINKS = [
  { label: "Home", url: "/" },
  { label: "New Arrivals", url: "/shopping/product-list?sort=new" },
  { label: "Women", url: "/shopping/product-list?category=women" },
  { label: "Men", url: "/shopping/product-list?category=men" },
  { label: "Unisex", url: "/shopping/product-list?category=unisex" },
  { label: "Exclusive Drops", url: "/drops" },
  { label: "Sale", url: "/shopping/product-list?sale=true" },
];

const DEFAULT_SUPPORT_LINKS = [
  { label: "Contact Us", url: "/contact" },
  { label: "FAQs", url: "/contact" },
  { label: "Shipping", url: "/legal/delivery-policy" },
  { label: "Returns", url: "/legal/refund-policy" },
  { label: "Track Order", url: "/account/orders" },
  { label: "Size Guide", url: "/size-guide" },
];

const DEFAULT_COMPANY_LINKS = [
  { label: "About", url: "/about" },
  { label: "Careers", url: "/careers" },
  { label: "Privacy Policy", url: "/legal/privacy-policy" },
  { label: "Terms & Conditions", url: "/legal/terms-and-conditions" },
  { label: "Cookie Policy", url: "/legal/privacy-policy" },
];

const DEFAULT_BRAND_DESC =
  "Premium fashion marketplace delivering luxury clothing, footwear and accessories across Sri Lanka.";

// Payment methods Saga Elite actually supports.
const DEFAULT_PAYMENTS = [
  { name: "Visa" },
  { name: "Mastercard" },
  { name: "Cash on Delivery" },
  { name: "Bank Transfer" },
];

const SECURITY_BADGES = [
  { icon: Lock, label: "SSL Secure" },
  { icon: ShieldCheck, label: "Encrypted Checkout" },
  { icon: BadgeCheck, label: "Verified Business" },
  { icon: ShieldCheck, label: "Secure Payments" },
];

// Responsive sizing: 32px mobile · 36px tablet · 40px desktop.
const PAY_CHIP = "h-8 md:h-9 lg:h-10";

const VisaMark = () => (
  <svg viewBox="0 0 48 16" className="h-full w-auto" role="img" aria-label="Visa">
    <text x="24" y="13" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontStyle="italic" fontSize="13" fill="#1A1F71">VISA</text>
  </svg>
);

const MastercardMark = () => (
  <svg viewBox="0 0 40 24" className="h-full w-auto" role="img" aria-label="Mastercard">
    <circle cx="16" cy="12" r="9" fill="#EB001B" />
    <circle cx="24" cy="12" r="9" fill="#F79E1B" fillOpacity="0.9" />
  </svg>
);

// One payment-method chip. Admin-uploaded icons win; otherwise we render a
// recognizable inline mark for known brands and a labelled chip for the rest.
function PaymentChip({ method }) {
  const name = method?.name || "";
  const key = name.toLowerCase().replace(/[^a-z]/g, "");

  if (method?.iconUrl) {
    return (
      <div className={cn("flex items-center justify-center rounded-[8px] bg-white px-2", PAY_CHIP)}>
        <img src={method.iconUrl} alt={name} className="h-full w-auto object-contain py-1.5" loading="lazy" />
      </div>
    );
  }
  if (key.includes("visa")) {
    return <div className={cn("flex items-center justify-center rounded-[8px] bg-white px-2", PAY_CHIP)}><VisaMark /></div>;
  }
  if (key.includes("mastercard") || key === "mc") {
    return <div className={cn("flex items-center justify-center rounded-[8px] bg-white px-2", PAY_CHIP)}><MastercardMark /></div>;
  }
  if (key.includes("cash") || key === "cod") {
    return (
      <div className={cn("flex items-center gap-2 rounded-[8px] bg-[#131313] border border-white/5 px-3 text-[12px] text-[#e5e2e1]", PAY_CHIP)}>
        <Banknote className="w-4 h-4 text-[#f2ca50]" /> Cash on Delivery
      </div>
    );
  }
  if (key.includes("bank")) {
    return (
      <div className={cn("flex items-center gap-2 rounded-[8px] bg-[#131313] border border-white/5 px-3 text-[12px] text-[#e5e2e1]", PAY_CHIP)}>
        <Landmark className="w-4 h-4 text-[#f2ca50]" /> Bank Transfer
      </div>
    );
  }
  return (
    <div className={cn("flex items-center justify-center rounded-[8px] bg-[#131313] border border-white/5 px-3 text-[12px] font-semibold text-[#e5e2e1]", PAY_CHIP)}>
      {name}
    </div>
  );
}

const linkClass =
  "text-[14px] text-[#99907c] hover:text-[#f2ca50] transition-colors inline-block relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-[#f2ca50] hover:after:w-full after:transition-all after:duration-200";

// Internal routes use <Link>; external (http/https) use <a>.
function FooterLink({ link }) {
  const url = link?.url || "#";
  const isExternal = /^https?:\/\//i.test(url);
  if (isExternal) {
    return (
      <a href={url} target={link.openInNewTab ? "_blank" : undefined} rel="noopener noreferrer" className={linkClass}>
        {link.label}
      </a>
    );
  }
  return (
    <Link to={url} target={link.openInNewTab ? "_blank" : undefined} className={linkClass}>
      {link.label}
    </Link>
  );
}

export default function MainFooter() {
  const location = useLocation();
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [settings, setSettings] = useState(null);

  // The app-wide Mystery Gift FAB also sits bottom-right (h-14). Stack the
  // back-to-top button directly above it so the two never overlap. The gift
  // FAB is lifted to bottom-24 on /shopping mobile (clears the bottom nav),
  // so mirror that and add the gift's height + a gap on top.
  const onShopping = location.pathname.startsWith("/shopping");
  const backToTopPos = onShopping
    ? "bottom-[10.5rem] right-6 md:bottom-24 md:right-6"
    : "bottom-24 right-6 md:bottom-24 md:right-6";

  useEffect(() => {
    fetchSiteSettings().then(setSettings);
  }, []);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 800);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const toggleAccordion = (index) => setActiveAccordion(activeAccordion === index ? null : index);

  // Admin-managed content with graceful fallbacks.
  const brandDesc = settings?.brandDescription || DEFAULT_BRAND_DESC;
  const copyright = (settings?.copyright || "© {year} Saga Elite. All rights reserved.").replace(
    "{year}",
    String(new Date().getFullYear())
  );
  const quickLinks = settings?.quickLinks?.length ? settings.quickLinks : DEFAULT_QUICK_LINKS;
  const supportLinks = settings?.supportLinks?.length ? settings.supportLinks : DEFAULT_SUPPORT_LINKS;
  const companyLinks = settings?.shopLinks?.length ? settings.shopLinks : DEFAULT_COMPANY_LINKS;
  const payments = settings?.paymentMethods?.length ? settings.paymentMethods : DEFAULT_PAYMENTS;

  const socials = [
    settings?.instagramUrl && { Icon: Instagram, url: settings.instagramUrl },
    settings?.facebookUrl && { Icon: Facebook, url: settings.facebookUrl },
    settings?.twitterUrl && { Icon: Twitter, url: settings.twitterUrl },
    settings?.youtubeUrl && { Icon: Youtube, url: settings.youtubeUrl },
  ].filter(Boolean);

  const renderAccordion = (title, links, index) => {
    const isOpen = activeAccordion === index;
    return (
      <div className="md:hidden border-b border-white/10">
        <button
          onClick={() => toggleAccordion(index)}
          className="w-full h-[60px] flex items-center justify-between text-[#e5e2e1] font-sans font-semibold text-[15px]"
        >
          {title}
          <ChevronDown className={cn("w-5 h-5 transition-transform duration-250", isOpen && "rotate-180")} />
        </button>
        <div className={cn("overflow-hidden transition-all duration-250", isOpen ? "max-h-[400px] pb-6" : "max-h-0")}>
          <ul className="flex flex-col gap-4">
            {links.map((link, i) => (
              <li key={i}>
                <FooterLink link={link} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <footer className="bg-[#0E0E0E] border-t border-white/5 relative">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-[64px] md:py-[80px] lg:py-[96px]">

        {/* Desktop Layout: 5 Columns */}
        <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-12 mb-16">

          {/* Column 1: Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-block se-serif text-[24px] text-[#e5e2e1] mb-6">
              {settings?.brandName || "SAGA ELITE"}
            </Link>
            <p className="se-body text-[14px] leading-relaxed text-[#99907c]">{brandDesc}</p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="font-sans font-semibold text-[15px] text-[#e5e2e1] mb-6">Quick Links</h4>
            <ul className="flex flex-col gap-4">
              {quickLinks.map((link, i) => (
                <li key={i}><FooterLink link={link} /></li>
              ))}
            </ul>
          </div>

          {/* Column 3: Customer Support */}
          <div>
            <h4 className="font-sans font-semibold text-[15px] text-[#e5e2e1] mb-6">Customer Support</h4>
            <ul className="flex flex-col gap-4">
              {supportLinks.map((link, i) => (
                <li key={i}><FooterLink link={link} /></li>
              ))}
            </ul>
          </div>

          {/* Column 4: Company */}
          <div>
            <h4 className="font-sans font-semibold text-[15px] text-[#e5e2e1] mb-6">Company</h4>
            <ul className="flex flex-col gap-4">
              {companyLinks.map((link, i) => (
                <li key={i}><FooterLink link={link} /></li>
              ))}
            </ul>
          </div>

          {/* Column 5: Contact (only fields that exist) */}
          <div>
            <h4 className="font-sans font-semibold text-[15px] text-[#e5e2e1] mb-6">Contact</h4>
            <ul className="flex flex-col gap-4 text-[14px] text-[#99907c]">
              {settings?.phone && (
                <li className="flex items-center gap-3"><Phone className="w-4 h-4 text-[#f2ca50]" />{settings.phone}</li>
              )}
              {settings?.whatsapp && (
                <li className="flex items-center gap-3"><WhatsAppIcon className="w-4 h-4 text-[#f2ca50]" />{settings.whatsapp}</li>
              )}
              {settings?.email && (
                <li className="flex items-center gap-3"><Mail className="w-4 h-4 text-[#f2ca50]" />{settings.email}</li>
              )}
              {settings?.address && (
                <li className="flex items-start gap-3"><MapPin className="w-4 h-4 text-[#f2ca50] shrink-0 mt-1" /><span>{settings.address}</span></li>
              )}
            </ul>
            {socials.length > 0 && (
              <div className="flex gap-4 mt-6">
                {socials.map((social, i) => (
                  <a key={i} href={social.url} target="_blank" rel="noopener noreferrer" className="text-[#99907c] hover:text-[#f2ca50] transition-colors">
                    <social.Icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Mobile Layout: Accordions */}
        <div className="md:hidden mb-12">
          <div className="mb-8">
            <Link to="/" className="inline-block se-serif text-[24px] text-[#e5e2e1] mb-4">
              {settings?.brandName || "SAGA ELITE"}
            </Link>
            <p className="se-body text-[14px] leading-relaxed text-[#99907c]">{brandDesc}</p>
          </div>

          {renderAccordion("Quick Links", quickLinks, 1)}
          {renderAccordion("Support", supportLinks, 2)}
          {renderAccordion("Company", companyLinks, 3)}

          <div className="border-b border-white/10 py-6">
            <h4 className="font-sans font-semibold text-[15px] text-[#e5e2e1] mb-4">Contact</h4>
            <ul className="flex flex-col gap-3 text-[14px] text-[#99907c] mb-6">
              {settings?.phone && (
                <li className="flex items-center gap-3"><Phone className="w-4 h-4 text-[#f2ca50]" />{settings.phone}</li>
              )}
              {settings?.email && (
                <li className="flex items-center gap-3"><Mail className="w-4 h-4 text-[#f2ca50]" />{settings.email}</li>
              )}
            </ul>
            {socials.length > 0 && (
              <div className="flex gap-4">
                {socials.map((social, i) => (
                  <a key={i} href={social.url} target="_blank" rel="noopener noreferrer" className="text-[#99907c] hover:text-[#f2ca50] transition-colors">
                    <social.Icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Payment & Security Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 py-8 border-y border-white/10 mb-8">
          <div>
            <div className="text-[12px] text-[#99907c] uppercase tracking-wider mb-4">Payment Methods</div>
            <div className="flex flex-wrap items-center gap-3">
              {payments.map((method, i) => (
                <PaymentChip key={i} method={method} />
              ))}
            </div>
          </div>

          <div>
            <div className="text-[12px] text-[#99907c] uppercase tracking-wider mb-4 lg:text-right">Security &amp; Trust</div>
            <div className="flex flex-wrap gap-4 lg:justify-end">
              {SECURITY_BADGES.map((badge, i) => (
                <div key={i} className="flex items-center gap-2 text-[#99907c]">
                  <badge.icon className="w-4 h-4" />
                  <span className="text-[12px]">{badge.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-[12px] text-[#99907c]">
          <p>{copyright}</p>
          <div className="flex items-center gap-6">
            <Link to="/legal/privacy-policy" className="hover:text-[#f2ca50] transition-colors">Privacy Policy</Link>
            <Link to="/legal/terms-and-conditions" className="hover:text-[#f2ca50] transition-colors">Terms</Link>
            <Link to="/legal/privacy-policy" className="hover:text-[#f2ca50] transition-colors">Cookies</Link>
          </div>
        </div>
      </div>

      {/* Back to Top */}
      <div
        className={cn(
          "fixed z-50 transition-all duration-500",
          backToTopPos,
          showBackToTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
        )}
      >
        <button
          onClick={scrollToTop}
          className="w-12 h-12 rounded-full bg-[#f2ca50] text-[#0a0a0a] flex items-center justify-center hover:scale-105 transition-transform shadow-[0_4px_24px_rgba(242,202,80,0.3)]"
          aria-label="Back to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      </div>
    </footer>
  );
}
