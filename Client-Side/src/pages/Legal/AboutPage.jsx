import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Target,
  Eye,
  Star,
  ShieldCheck,
  Award,
  Zap,
  CheckCircle2,
  Package,
  CreditCard,
  RefreshCcw,
  Headphones,
  Sparkles,
} from "lucide-react";
import usePageMeta from "@/hooks/use-page-meta";
import useShopAbout from "@/hooks/use-shop-about";
import { fetchStoreStats } from "@/services/landing-api";
import { WhyChooseSaga, FAQPreview } from "@/components/landing/TrustSections";
import { Newsletter } from "@/components/landing/CommunitySections";
import { Btn, Reveal } from "@/components/ui/editorial";

const DEFAULT_TIMELINE = [
  { year: "2024", milestone: "Saga Elite Founded", description: "The vision to bring premium fashion to Sri Lanka begins." },
  { year: "2025", milestone: "Website Launch", description: "Our official digital atelier goes live with nationwide access." },
  { year: "2025", milestone: "Expanded Categories", description: "Introduced footwear, accessories, and exclusive drops." },
  { year: "2026", milestone: "Reached 10,000 Customers", description: "A milestone in delivering trusted luxury experiences." },
];

const DEFAULT_SERVICES = [
  { icon: Sparkles, title: "Premium Fashion", desc: "Curated styles featuring exceptional craftsmanship and high-quality materials." },
  { icon: Package, title: "Islandwide Delivery", desc: "Fast, reliable shipping directly to your doorstep across all of Sri Lanka." },
  { icon: CreditCard, title: "Secure Payments", desc: "Bank transfers, cards, and trusted local checkout options." },
  { icon: RefreshCcw, title: "Easy Returns", desc: "A frictionless 14-day return and exchange policy for your peace of mind." },
  { icon: Headphones, title: "Customer Support", desc: "Real human assistance via WhatsApp and email whenever you need it." },
  { icon: Star, title: "Exclusive Drops", desc: "Limited-edition releases and members-only collections." },
];

const DEFAULT_CORE_VALUES = [
  { icon: Award, title: "Premium Quality" },
  { icon: CheckCircle2, title: "Customer Satisfaction" },
  { icon: Zap, title: "Fast Islandwide Delivery" },
  { icon: ShieldCheck, title: "Secure Shopping" },
  { icon: Sparkles, title: "Authentic Products" },
  { icon: Headphones, title: "Trusted Service" },
];

const GlassCard = ({ children, className = "" }) => (
  <div className={`rounded-[20px] bg-[#1A1A1A] border border-white/5 backdrop-blur-md ${className}`}>
    {children}
  </div>
);

const AboutPage = () => {
  usePageMeta({ title: "About Saga Elite", fullTitle: true });
  const { data: about, loading } = useShopAbout();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStoreStats().then((res) => setStats(res)).catch(() => {});
  }, []);

  // Hero / story imagery is admin-managed (SiteConfig). When no hero image is
  // set we fall back to a branded dark backdrop — never a stock placeholder.
  const heroImage = about?.about_hero_image?.trim() || "";
  const heroTitle = about?.about_hero_title?.trim() || "About Saga Elite";
  const heroSubtitle = about?.about_hero_subtitle?.trim() || "Premium Fashion Designed for Modern Sri Lanka";
  const heroCtaLabel = about?.about_hero_cta_label?.trim() || "Shop Collection";
  const heroCtaUrl = about?.about_hero_cta_url?.trim() || "/shopping/product-list";
  const storyImage = about?.about_story_image?.trim() || "";
  const brandName = about?.shop_brand_name?.trim() || "Saga Elite";

  const timeline = useMemo(() => {
    const rows = Array.isArray(about?.about_timeline) ? about.about_timeline.filter((r) => r?.year && r?.milestone) : [];
    return rows.length > 0 ? rows : DEFAULT_TIMELINE;
  }, [about?.about_timeline]);

  const coreValues = useMemo(() => {
    const rows = Array.isArray(about?.about_values) ? about.about_values.filter((v) => v?.title) : [];
    return rows.length > 0 ? rows.map(v => ({ icon: Award, title: v.title })) : DEFAULT_CORE_VALUES;
  }, [about?.about_values]);

  const statCards = [];
  if (stats?.happyCustomers) statCards.push({ label: "Registered Customers", value: `${Number(stats.happyCustomers).toLocaleString()}+` });
  if (stats?.totalProducts) statCards.push({ label: "Products", value: Number(stats.totalProducts).toLocaleString() });
  if (stats?.totalOrders) statCards.push({ label: "Orders Delivered", value: `${Number(stats.totalOrders).toLocaleString()}+` });
  if (stats?.averageRating) statCards.push({ label: "Average Rating", value: `${Number(stats.averageRating).toFixed(1)}★` });

  if (loading && !about?.about_brand_story) {
    return (
      <div className="bg-[#0e0e0e] min-h-screen flex items-center justify-center">
        <div className="animate-pulse se-body text-[#F2CA50]">Loading our story…</div>
      </div>
    );
  }

  return (
    <div className="bg-[#0e0e0e] text-[#e5e2e1] min-h-screen overflow-x-hidden pt-[64px] md:pt-[72px]">
      
      {/* HERO BANNER */}
      <section className="relative h-[260px] md:h-[320px] lg:h-[420px] overflow-hidden flex items-end justify-center w-full">
        <div className="absolute inset-0 bg-[#0e0e0e]">
          {heroImage ? (
            <img
              src={heroImage}
              alt={heroTitle}
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#161616] via-[#0e0e0e] to-[#000]" />
          )}
          <div className="absolute inset-0 bg-[#0e0e0e]/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e]/50 to-transparent" />
        </div>
        
        <div className="relative z-10 w-full max-w-7xl px-4 md:px-8 pb-12 text-center flex flex-col items-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="se-serif text-[#fafafa] text-4xl md:text-5xl lg:text-[48px] leading-tight mb-4"
          >
            {heroTitle}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="se-body text-[#F2CA50] text-lg md:text-xl max-w-2xl"
          >
            {heroSubtitle}
          </motion.p>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-3 se-body text-[#99907c] max-w-2xl"
          >
            We bring premium clothing, footwear, and accessories together in one trusted online destination.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8"
          >
            <Link to={heroCtaUrl}>
              <button className="h-[56px] px-8 bg-[#F2CA50] text-[#0e0e0e] rounded-[16px] font-sans font-bold uppercase tracking-wider text-[12px] transition-transform duration-250 hover:-translate-y-1">
                {heroCtaLabel}
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* OUR STORY */}
      <section className="py-20 md:py-28 max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
          <Reveal>
            <h2 className="se-serif text-[36px] text-[#fafafa] mb-6">Our Story</h2>
            <div className="se-body text-[#99907c] space-y-6 text-[16px] leading-relaxed">
              <p>
                {about?.about_brand_story || `Saga Elite was born out of a desire to elevate the online shopping experience in Sri Lanka. We noticed a gap in the market for a trusted, premium destination that offered not just clothes, but a complete lifestyle experience.`}
              </p>
              <p>
                {`We believe that premium quality shouldn't be hard to find. By carefully curating every piece in our collection, we ensure that our customers receive only the best in fashion, footwear, and accessories.`}
              </p>
              <p>
                {`Our vision for the future is simple: to become the most trusted and sought-after luxury fashion retailer in Sri Lanka, continuously bringing exclusive drops and exceptional service to our elite community.`}
              </p>
            </div>
          </Reveal>
          {storyImage ? (
            <Reveal delay={0.2}>
              <div className="relative aspect-[3/4] rounded-[20px] overflow-hidden bg-[#1A1A1A]">
                <img
                  src={storyImage}
                  alt={`${brandName} story`}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 border border-white/10 rounded-[20px] pointer-events-none" />
              </div>
            </Reveal>
          ) : null}
        </div>
      </section>

      {/* MISSION & VISION */}
      <section className="py-20 max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid md:grid-cols-2 gap-6">
          <Reveal>
            <GlassCard className="h-[260px] p-8 md:p-10 flex flex-col justify-center border-t-2 border-t-[#F2CA50]/50 hover:border-t-[#F2CA50] transition-colors group">
              <Target className="w-10 h-10 text-[#F2CA50] mb-6 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
              <h3 className="font-sans font-semibold text-[22px] text-[#fafafa] mb-3">Our Mission</h3>
              <p className="se-body text-[#99907c] text-[16px] leading-relaxed">
                {about?.about_mission || "To provide a seamless, premium online shopping experience by offering carefully curated, high-quality fashion to modern Sri Lankans."}
              </p>
            </GlassCard>
          </Reveal>
          <Reveal delay={0.1}>
            <GlassCard className="h-[260px] p-8 md:p-10 flex flex-col justify-center border-t-2 border-t-[#F2CA50]/50 hover:border-t-[#F2CA50] transition-colors group">
              <Eye className="w-10 h-10 text-[#F2CA50] mb-6 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
              <h3 className="font-sans font-semibold text-[22px] text-[#fafafa] mb-3">Our Vision</h3>
              <p className="se-body text-[#99907c] text-[16px] leading-relaxed">
                {about?.about_vision || "To be Sri Lanka's leading digital destination for premium lifestyle products, recognized for exclusivity, trust, and customer satisfaction."}
              </p>
            </GlassCard>
          </Reveal>
        </div>
      </section>

      {/* CORE VALUES */}
      <section className="py-20 md:py-28 max-w-7xl mx-auto px-4 md:px-8 border-y border-white/5 bg-[#0b0b0b]">
        <Reveal className="text-center mb-16">
          <h2 className="se-serif text-[36px] text-[#fafafa] mb-4">Core Values</h2>
          <p className="se-body text-[#99907c] text-[18px] max-w-2xl mx-auto">
            The principles that guide everything we do.
          </p>
        </Reveal>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {coreValues.map((val, i) => {
            const Icon = val.icon;
            return (
              <Reveal key={i} delay={i * 0.1}>
                <div className="h-[220px] rounded-[20px] bg-[#1A1A1A] p-8 flex flex-col items-center justify-center text-center border border-white/5 transition-all duration-300 hover:-translate-y-1 hover:border-[#F2CA50]/30 hover:shadow-[0_10px_30px_rgba(242,202,80,0.05)]">
                  <div className="w-14 h-14 rounded-full bg-[#F2CA50]/10 flex items-center justify-center mb-6">
                    <Icon className="w-7 h-7 text-[#F2CA50]" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-sans font-semibold text-[18px] text-[#fafafa]">{val.title}</h3>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* WHY CHOOSE SAGA ELITE (Reused from TrustSections) */}
      <WhyChooseSaga />

      {/* BUSINESS STATISTICS (Dynamic) */}
      {statCards.length > 0 && (
        <section className="py-20 border-y border-white/5">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <Reveal className="text-center mb-16">
              <h2 className="se-serif text-[36px] text-[#fafafa] mb-4">Saga Elite in Numbers</h2>
              <p className="se-body text-[#99907c] text-[18px]">Trusted by thousands across the island.</p>
            </Reveal>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {statCards.map((stat, i) => (
                <Reveal key={i} delay={i * 0.1}>
                  <div className="text-center p-8 bg-[#1A1A1A] rounded-[20px] border border-white/5 h-full flex flex-col justify-center">
                    <div className="font-serif text-[48px] text-[#F2CA50] mb-2">{stat.value}</div>
                    <div className="se-label text-[12px] text-[#99907c] uppercase tracking-wider">{stat.label}</div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* OUR JOURNEY TIMELINE */}
      <section className="py-20 md:py-28 max-w-7xl mx-auto px-4 md:px-8 bg-[#0e0e0e]">
        <Reveal className="text-center mb-20">
          <h2 className="se-serif text-[36px] text-[#fafafa] mb-4">Our Journey</h2>
          <p className="se-body text-[#99907c] text-[18px]">Milestones that define our growth.</p>
        </Reveal>
        
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-[2px] bg-[#1A1A1A] md:-translate-x-1/2" />
          
          <div className="space-y-12">
            {timeline.map((item, i) => {
              const isEven = i % 2 === 0;
              return (
                <Reveal key={i} delay={i * 0.1}>
                  <div className={`relative flex items-center ${isEven ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
                    
                    {/* Marker */}
                    <div className="absolute left-4 md:left-1/2 w-4 h-4 bg-[#F2CA50] rounded-full -translate-x-[7px] md:-translate-x-[8px] border-4 border-[#0e0e0e] shadow-[0_0_15px_rgba(242,202,80,0.5)] z-10" />
                    
                    {/* Content */}
                    <div className={`w-full md:w-1/2 pl-12 md:pl-0 ${isEven ? 'md:pr-16 text-left md:text-right' : 'md:pl-16 text-left'}`}>
                      <div className="inline-block px-3 py-1 bg-[#F2CA50]/10 border border-[#F2CA50]/20 rounded-full text-[#F2CA50] font-sans font-bold text-[12px] mb-3">
                        {item.year}
                      </div>
                      <h3 className="font-sans font-semibold text-[22px] text-[#fafafa] mb-2">{item.milestone}</h3>
                      {item.description && (
                        <p className="se-body text-[#99907c] text-[16px]">{item.description}</p>
                      )}
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* OUR SERVICES */}
      <section className="py-20 md:py-28 border-t border-white/5 bg-[#0b0b0b]">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <Reveal className="text-center mb-16">
            <h2 className="se-serif text-[36px] text-[#fafafa] mb-4">Our Services</h2>
            <p className="se-body text-[#99907c] text-[18px]">Designed for an effortless shopping experience.</p>
          </Reveal>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DEFAULT_SERVICES.map((srv, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="group bg-[#1A1A1A] p-8 rounded-[20px] border border-white/5 h-full transition-colors hover:bg-white/[0.04]">
                  <srv.icon className="w-8 h-8 text-[#F2CA50] mb-6 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                  <h3 className="font-sans font-semibold text-[20px] text-[#fafafa] mb-3">{srv.title}</h3>
                  <p className="se-body text-[#99907c] text-[15px] leading-relaxed">{srv.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* REUSED SECTIONS */}
      <FAQPreview />
      <Newsletter />
    </div>
  );
};

export default AboutPage;
