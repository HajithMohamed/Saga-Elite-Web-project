import React, { useEffect, useRef, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronRight, 
  ChevronDown, 
  CheckCircle2, 
  MessageCircle, 
  Mail, 
  PhoneCall, 
  Clock, 
  FileText 
} from "lucide-react";
import useShopAbout from "@/hooks/use-shop-about";
import { CONTACT_INFO as CONTACT_INFO_FALLBACK } from "@/config";
import { FAQPreview } from "@/components/landing/TrustSections";
import { Newsletter } from "@/components/landing/CommunitySections";

const RELATED_POLICIES = [
  { label: "Privacy Policy", to: "/legal/privacy-policy" },
  { label: "Terms & Conditions", to: "/legal/terms-and-conditions" },
  { label: "Refund Policy", to: "/legal/refund-policy" },
  { label: "Delivery Policy", to: "/legal/delivery-policy" },
];

const slugifyHeading = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");

const LegalLayout = ({ title, subtitle, lastUpdated, summary, processSteps, children }) => {
  const contentRef = useRef(null);
  const [tocItems, setTocItems] = useState([]);
  const [activeId, setActiveId] = useState("");
  const [isTocOpen, setIsTocOpen] = useState(false);

  const { data: about } = useShopAbout();
  const contactInfo = useMemo(() => ({
    email: about?.shop_contact_email || CONTACT_INFO_FALLBACK.email,
    phone: about?.shop_contact_phone || CONTACT_INFO_FALLBACK.phone,
    whatsapp: about?.shop_whatsapp_number || CONTACT_INFO_FALLBACK.whatsapp,
  }), [about]);

  const whatsappDigits = (contactInfo.whatsapp || "").replace(/\D/g, "");

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    // We look for h2 tags rendered by the dangerouslySetInnerHTML in PolicyBody
    const headings = Array.from(container.querySelectorAll("h2"));
    const items = headings
      .map((heading) => {
        const text = heading.textContent?.trim() || "";
        if (!heading.id) {
          heading.id = slugifyHeading(text);
        }
        return text ? { id: heading.id, text } : null;
      })
      .filter(Boolean);

    setTocItems(items);
    if (items.length) {
      setActiveId((current) => current || items[0].id);
    }

    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -65% 0px", threshold: 0.1 }
    );

    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [children]);

  return (
    <div className="w-full min-h-screen bg-[#0e0e0e] text-[#e5e2e1] overflow-x-hidden pt-[64px] md:pt-[72px]">
      
      {/* HERO BANNER */}
      <section className="relative h-[180px] md:h-[220px] lg:h-[260px] overflow-hidden flex items-end justify-center w-full border-b border-white/5">
        <div className="absolute inset-0 bg-[#0e0e0e]">
          {/* Subtle noise/pattern overlay could go here */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#F2CA50]/5 via-[#0e0e0e] to-[#0e0e0e]" />
        </div>
        
        <div className="relative z-10 w-full max-w-[960px] mx-auto px-4 md:px-8 pb-8 flex flex-col">
          <nav className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#99907c] mb-4" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-[#F2CA50] transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#fafafa] font-bold">{title}</span>
          </nav>
          
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="se-serif text-3xl md:text-4xl lg:text-[48px] text-[#fafafa] mb-2">{title}</h1>
            {subtitle && <p className="se-body text-[#99907c] text-sm md:text-base max-w-2xl">{subtitle}</p>}
            
            {lastUpdated && (
              <div className="flex items-center gap-2 mt-4 text-[11px] uppercase tracking-wider text-[#99907c] font-bold">
                <Clock className="w-3 h-3 text-[#F2CA50]" />
                Last updated: {new Date(lastUpdated).toLocaleDateString()}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      <div className="max-w-[960px] mx-auto px-4 md:px-8 py-12 md:py-16">
        
        {/* MOBILE/TABLET TOC */}
        {tocItems.length > 0 && (
          <div className="lg:hidden mb-8">
            <button 
              onClick={() => setIsTocOpen(!isTocOpen)}
              className="w-full flex items-center justify-between p-4 bg-[#1A1A1A] rounded-[16px] border border-white/5"
            >
              <span className="font-sans font-semibold text-[14px] uppercase tracking-wider text-[#F2CA50]">Table of Contents</span>
              <ChevronDown className={`w-5 h-5 text-[#99907c] transition-transform duration-250 ${isTocOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {isTocOpen && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: "auto", opacity: 1 }} 
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <ul className="py-4 space-y-3 px-2 border-l border-white/10 ml-4 mt-2">
                    {tocItems.map((item) => (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          onClick={() => setIsTocOpen(false)}
                          className={`block text-[14px] transition-colors ${activeId === item.id ? "text-[#F2CA50] font-bold" : "text-[#99907c] hover:text-[#fafafa]"}`}
                        >
                          {item.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">
          
          {/* DESKTOP TOC (STICKY) */}
          {tocItems.length > 0 && (
            <aside className="hidden lg:block w-[240px] shrink-0 sticky top-[100px]">
              <div className="bg-[#1A1A1A] rounded-[20px] border border-white/5 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <FileText className="w-4 h-4 text-[#F2CA50]" />
                  <span className="font-sans font-bold text-[12px] uppercase tracking-wider text-[#fafafa]">Contents</span>
                </div>
                <ul className="space-y-4">
                  {tocItems.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className={`block text-[14px] leading-tight transition-all duration-250 border-l-[3px] pl-4 ${
                          activeId === item.id
                            ? "border-[#F2CA50] text-[#fafafa] font-semibold"
                            : "border-transparent text-[#99907c] hover:text-[#fafafa] hover:border-white/20"
                        }`}
                      >
                        {item.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          )}

          {/* POLICY CONTENT */}
          <div className="flex-1 min-w-0">
            
            {/* QUICK SUMMARY CARD */}
            {summary && summary.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-12 bg-[#F2CA50]/5 border border-[#F2CA50]/20 rounded-[20px] p-6 md:p-8">
                <h3 className="font-sans font-bold text-[14px] uppercase tracking-wider text-[#F2CA50] mb-4">Quick Summary</h3>
                <ul className="grid sm:grid-cols-2 gap-4">
                  {summary.map((point, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#F2CA50] shrink-0 mt-0.5" strokeWidth={2} />
                      <span className="se-body text-[15px] text-[#e5e2e1]">{point}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* PROCESS STEPS (If applicable) */}
            {processSteps && processSteps.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
                <h3 className="se-serif text-[24px] text-[#fafafa] mb-6">How It Works</h3>
                <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-0 justify-between w-full relative">
                  <div className="hidden md:block absolute top-6 left-6 right-6 h-[2px] bg-[#1a1a1a] z-0" />
                  {processSteps.map((step, i) => (
                    <div key={i} className="relative z-10 flex flex-col items-center text-center max-w-[120px]">
                      <div className="w-12 h-12 rounded-full bg-[#1A1A1A] border-2 border-[#F2CA50] text-[#F2CA50] flex items-center justify-center font-sans font-bold text-[16px] mb-3 shadow-[0_0_15px_rgba(242,202,80,0.2)]">
                        {i + 1}
                      </div>
                      <span className="se-body text-[14px] font-semibold text-[#fafafa]">{step}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* THE LEGAL TEXT (Rendered via PolicyBody) */}
            <article ref={contentRef} className="pb-16 border-b border-white/5">
              {children}
            </article>

            {/* NEED HELP CTA */}
            <div className="py-16">
              <div className="bg-[#1A1A1A] rounded-[24px] border border-white/5 p-8 md:p-10 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-[#F2CA50]/10 flex items-center justify-center mb-6">
                  <MessageCircle className="w-8 h-8 text-[#F2CA50]" />
                </div>
                <h3 className="se-serif text-[28px] text-[#fafafa] mb-2">Need More Help?</h3>
                <p className="se-body text-[#99907c] text-[16px] mb-8 max-w-md">
                  Our customer support team is always available to answer any questions you might have about our policies.
                </p>
                <div className="flex flex-wrap justify-center gap-4 w-full">
                  <a href={`https://wa.me/${whatsappDigits}`} className="h-[52px] px-8 bg-[#F2CA50] text-[#0e0e0e] rounded-[16px] font-sans font-bold uppercase tracking-wider text-[12px] flex items-center justify-center gap-2 hover:-translate-y-1 transition-transform">
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </a>
                  <a href={`mailto:${contactInfo.email}`} className="h-[52px] px-8 bg-transparent border border-white/10 text-[#fafafa] rounded-[16px] font-sans font-bold uppercase tracking-wider text-[12px] flex items-center justify-center gap-2 hover:border-[#F2CA50] hover:text-[#F2CA50] transition-colors">
                    <Mail className="w-4 h-4" /> Email Us
                  </a>
                  <a href={`tel:${contactInfo.phone}`} className="h-[52px] px-8 bg-transparent border border-white/10 text-[#fafafa] rounded-[16px] font-sans font-bold uppercase tracking-wider text-[12px] flex items-center justify-center gap-2 hover:border-[#F2CA50] hover:text-[#F2CA50] transition-colors">
                    <PhoneCall className="w-4 h-4" /> Call Us
                  </a>
                </div>
              </div>
            </div>

            {/* RELATED POLICIES */}
            <div className="pb-16">
              <h3 className="font-sans font-bold text-[14px] uppercase tracking-wider text-[#fafafa] mb-6">Related Information</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {RELATED_POLICIES.filter(p => p.label !== title).map((policy, i) => (
                  <Link key={i} to={policy.to} className="group p-4 bg-[#1A1A1A] rounded-[16px] border border-white/5 flex items-center justify-between hover:border-[#F2CA50]/50 transition-colors">
                    <span className="font-sans font-semibold text-[15px] text-[#e5e2e1] group-hover:text-[#F2CA50] transition-colors">{policy.label}</span>
                    <ChevronRight className="w-5 h-5 text-[#99907c] group-hover:translate-x-1 transition-transform" />
                  </Link>
                ))}
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* REUSED GLOBAL SECTIONS */}
      <FAQPreview />
      <Newsletter />
    </div>
  );
};

export default LegalLayout;
