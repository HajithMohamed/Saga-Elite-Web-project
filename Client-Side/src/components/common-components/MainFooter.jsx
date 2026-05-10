import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Facebook, Instagram, Youtube, ArrowRight, CheckCircle2, ChevronDown, Lock, CreditCard, ShieldCheck, Mail, MapPin, Twitter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import useShopAbout from "@/hooks/use-shop-about";

const MainFooter = () => {
  const location = useLocation();
  const isAdminView = location.pathname.startsWith("/admin");

  // Pull editable shop content from siteConfig — falls back to literal copy
  // when keys are unset, so the page never breaks during partial migrations.
  const { data: about } = useShopAbout();
  const tagline =
    about?.shop_tagline ||
    "Limited edition fashion inspired by street culture, exclusivity, and modern youth identity.";
  const brandName = about?.shop_brand_name || "Saga Elite";
  const whatsappDigits = (about?.shop_whatsapp_number || "").replace(/[^0-9]/g, "");
  const whatsappHref = whatsappDigits ? `https://wa.me/${whatsappDigits}` : null;
  const socialLinks = [
    { Icon: Instagram, href: about?.shop_social_instagram, label: "Instagram" },
    { Icon: Facebook, href: about?.shop_social_facebook, label: "Facebook" },
    { Icon: Youtube, href: about?.shop_social_youtube, label: "YouTube" },
    { Icon: Twitter, href: about?.shop_social_twitter, label: "Twitter" },
  ].filter((s) => s.href);
  
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState(null);

  const { isAuthenticated, user } = useSelector((state) => state.auth || { isAuthenticated: false, user: null });

  if (isAdminView) return null;

  const handleSubscribe = (e) => {
    e.preventDefault();
    if(email) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 5000); // Reset after 5s
      setEmail("");
    }
  };

  const toggleAccordion = (index) => {
    setActiveAccordion(activeAccordion === index ? null : index);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.1, delayChildren: 0.2 } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  const glowVariants = {
    hover: { 
      textShadow: "0px 0px 8px rgb(212, 175, 55)",
      color: "#D4AF37",
      x: 5,
      transition: { duration: 0.3 }
    }
  };

  return (
    <footer role="contentinfo" className="relative bg-[#050505] text-[#e5e2e1] mt-10 overflow-hidden font-sans">
      
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none z-0"></div>
      <div className="absolute top-0 left-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent z-0"></div>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none z-0"></div>

      <div className="relative z-10 w-full max-w-screen-2xl mx-auto px-6 lg:px-12 py-16">
        
        {/* 🔥 1️⃣ VIP CTA SECTION & 2️⃣ NEWSLETTER */}
        <motion.div 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="mb-20 pb-16 border-b border-[#D4AF37]/20 flex flex-col lg:flex-row items-center justify-between gap-12"
        >
          {/* VIP CTA */}
          <motion.div variants={itemVariants} className="text-center lg:text-left max-w-xl">
            <h2 className="text-3xl md:text-5xl font-black tracking-widest text-white mb-4 uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              JOIN THE ELITE
            </h2>
            <p className="text-[#a0a0a0] md:text-lg mb-8 leading-relaxed">
              Unlock early access, rare drops, mystery rewards, and exclusive releases.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link to={isAuthenticated ? "/shopping/account" : "/auth/login"}>
                <motion.button 
                  whileHover={{ scale: 1.05, boxShadow: "0px 0px 20px rgba(212, 175, 55, 0.4)" }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-3 bg-gradient-to-r from-[#D4AF37] to-[#B8942E] text-black font-bold uppercase tracking-wider rounded-sm transition-all relative overflow-hidden group"
                >
                  <span className="relative z-10">{isAuthenticated ? "ENTER ELITE PORTAL" : "🔥 JOIN THE ELITE"}</span>
                  <div className="absolute inset-0 h-full w-0 bg-white/20 group-hover:w-full transition-all duration-300 ease-out z-0"></div>
                </motion.button>
              </Link>
              <Link to="/shopping/drops">
                <motion.button 
                  whileHover={{ color: "#ffffff", borderColor: "#ffffff" }}
                  className="px-8 py-3 bg-transparent border border-[#555] text-[#ccc] font-bold uppercase tracking-wider rounded-sm transition-colors hover:bg-white/5"
                >
                  ⚡ EXPLORE DROPS
                </motion.button>
              </Link>
            </div>
          </motion.div>

          {/* Early Access / Newsletter */}
          <motion.div variants={itemVariants} className="w-full lg:w-auto max-w-md bg-white/[0.03] backdrop-blur-md border border-white/10 p-6 xl:p-8 rounded-xl shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">
              {subscribed ? "WELCOME TO THE LIST" : "EARLY ACCESS"}
            </h3>
            <p className="text-sm text-[#888] mb-6">
              {subscribed ? "You will be notified before the next drop goes live." : "Be the first to know about limited collections."}
            </p>
            
            <AnimatePresence mode="wait">
              {subscribed ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-3 text-[#D4AF37] bg-[#D4AF37]/10 py-3 px-4 rounded-md border border-[#D4AF37]/30"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium text-sm tracking-widest uppercase">✔ YOU'RE ON THE ELITE LIST</span>
                </motion.div>
              ) : (
                <motion.form 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onSubmit={handleSubscribe} 
                  className="flex flex-col gap-3"
                >
                  <div className="relative">
                    <input 
                      type="email" 
                      required
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-black/50 border border-[#333] text-white px-4 py-3 rounded-md focus:outline-none focus:border-[#D4AF37] transition-all placeholder:text-[#555]"
                    />
                  </div>
                  <motion.button 
                    whileHover={{ backgroundColor: "#222" }}
                    whileTap={{ scale: 0.98 }}
                    type="submit" 
                    className="w-full bg-white text-black font-bold uppercase tracking-widest py-3 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    UNLOCK ACCESS <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* 🔥 3️⃣ MAIN FOOTER GRID */}
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={containerVariants}
          className="grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-12 mb-16"
        >
          {/* COLUMN 1 — BRAND IDENTITY */}
          <motion.div variants={itemVariants} className="lg:col-span-4 flex flex-col">
            <Link to="/shopping/home" className="flex items-center gap-3 group w-fit">
              <div className="relative">
                <img src="/LOGO.png" alt="Saga Elite Logo" className="h-14 w-14 object-contain group-hover:scale-110 transition-transform duration-300" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                <div className="absolute inset-0 bg-[#D4AF37] blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-full"></div>
              </div>
              <div className="flex flex-col">
                <h3 className="font-black tracking-[0.25em] text-2xl text-white uppercase mt-1">{brandName.toUpperCase()}</h3>
                <span className="text-[10px] text-[#D4AF37] tracking-[0.3em] uppercase opacity-80 group-hover:opacity-100 transition-opacity">Rare Fit Forever</span>
              </div>
            </Link>
            <p className="text-sm text-[#777] mt-6 max-w-sm leading-relaxed">
              {tagline}
            </p>
            <div className="mt-8 flex flex-col gap-2 text-xs text-[#555] font-mono tracking-wider">
              <p>🔥 12K+ ELITE MEMBERS</p>
              <p>🚀 150+ LIMITED PIECES SOLD</p>
              <p>🎁 MYSTERY REWARDS ACTIVE</p>
            </div>
          </motion.div>

          {/* Desktop Grid Columns (Hidden on mobile) */}
          <div className="hidden md:grid md:grid-cols-4 lg:col-span-8 gap-8">
            
            {/* COLUMN 2 — SHOP */}
            <motion.div variants={itemVariants}>
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white mb-6">Shop</h4>
              <ul className="space-y-4">
                {['Gents', 'Ladies', 'Unisex', 'New Drops', 'Limited Editions', 'Archive'].map((item) => (
                  <li key={item}>
                    <Link to={`/shopping/product-list`} className="text-sm text-[#888] font-medium transition-colors flex items-center group">
                      <motion.span variants={glowVariants} whileHover="hover" className="relative group-hover:pl-2 transition-all block">
                        {item}
                        <span className="absolute left-0 -bottom-1 w-0 h-px bg-[#D4AF37] group-hover:w-full transition-all duration-300"></span>
                      </motion.span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* COLUMN 3 — SUPPORT */}
            <motion.div variants={itemVariants}>
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white mb-6">Support</h4>
              <ul className="space-y-4">
                {['Contact Us', 'Delivery Information', 'Returns & Refunds', 'Payment Methods', 'FAQs'].map((item) => (
                  <li key={item}>
                    <Link to="/contact" className="text-sm text-[#888] font-medium transition-colors flex items-center group">
                      <motion.span variants={glowVariants} whileHover="hover" className="relative block">
                        {item}
                      </motion.span>
                    </Link>
                  </li>
                ))}
                <li>
                  <Link to="/shopping/find-payment" className="text-sm text-[#D4AF37] font-medium transition-colors flex items-center group">
                    <motion.span variants={glowVariants} whileHover="hover" className="relative block">
                      Find your payment
                    </motion.span>
                  </Link>
                </li>
                {whatsappHref ? (
                  <li className="pt-4">
                    <a href={whatsappHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-[#25D366]/10 text-[#25D366] px-3 py-2 border border-[#25D366]/20 rounded-md text-xs font-bold uppercase tracking-wide hover:bg-[#25D366]/20 transition-colors">
                      <CheckCircle2 className="w-4 h-4" /> WhatsApp Support
                    </a>
                  </li>
                ) : null}
              </ul>
            </motion.div>

            {/* COLUMN 4 — COMPANY */}
            <motion.div variants={itemVariants}>
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white mb-6">Company</h4>
              <ul className="space-y-4">
                {['About Saga Elite', 'Community', 'Collaborations', 'Terms & Conditions', 'Privacy Policy'].map((item, i) => (
                  <li key={item}>
                    <Link to={i > 2 ? "/legal/terms-and-conditions" : "/about"} className="text-sm text-[#888] font-medium transition-colors flex items-center group">
                      <motion.span variants={glowVariants} whileHover="hover" className="relative block">
                        {item}
                      </motion.span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* COLUMN 5 — ELITE ACCOUNT */}
            <motion.div variants={itemVariants} className="bg-white/[0.02] p-5 rounded-lg border border-white/5 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-20 h-20 bg-[#D4AF37]/10 blur-2xl rounded-full"></div>
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37] mb-6 flex items-center gap-2">
                <Lock className="w-3 h-3" /> Elite Hub
              </h4>
              
              {isAuthenticated ? (
                <div className="space-y-4">
                  <div className="mb-4 pb-4 border-b border-white/10">
                    <p className="text-xs text-[#888] uppercase tracking-wider mb-1">Elite Level</p>
                    <p className="text-sm text-white font-bold tracking-widest">{user?.role === 'admin' || user?.role === 'super_admin' ? 'ADMIN' : 'VIP MEMBER'}</p>
                    {/* Dummy progress bar for visual premium feel */}
                    <div className="w-full h-1 bg-[#222] mt-2 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#D4AF37] to-[#f2ca50] w-3/4"></div>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {['My Account', 'Orders', 'Wishlist', 'Rewards'].map((item) => (
                      <li key={item}>
                        <Link to="/shopping/account" className="text-sm text-[#aaa] hover:text-white transition-colors block">
                          {item}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="space-y-4">
                  <ul className="space-y-2 mb-4 text-xs text-[#888] font-medium">
                    <li>🔥 Early Drop Access</li>
                    <li>🎁 Mystery Rewards</li>
                    <li>⭐ Save Wishlist</li>
                  </ul>
                  <div className="flex flex-col gap-2">
                    <Link to="/auth/login" className="text-center w-full bg-white text-black py-2 text-xs font-bold uppercase tracking-wider rounded hover:bg-gray-200 transition-colors">
                      Login
                    </Link>
                    <Link to="/auth/register" className="text-center w-full bg-transparent border border-white/20 text-white py-2 text-xs font-bold uppercase tracking-wider rounded hover:bg-white/10 transition-colors">
                      Join Elite
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Mobile Accordion Alternative (Visible only on small screens) */}
          <div className="md:hidden flex flex-col space-y-2 w-full">
            {[
              { title: 'Shop', links: ['Gents', 'Ladies', 'Unisex', 'New Drops', 'Archive'] },
              { title: 'Support', links: ['Contact Us', 'Delivery Info', 'Returns', 'FAQs'] },
              { title: 'Company', links: ['About Us', 'Terms & Conditions', 'Privacy Policy'] },
            ].map((section, idx) => (
              <div key={section.title} className="border-b border-[#222] overflow-hidden">
                <button 
                  onClick={() => toggleAccordion(idx)}
                  className="flex items-center justify-between w-full py-4 text-sm font-bold uppercase tracking-widest text-[#ccc]"
                >
                  {section.title}
                  <motion.div animate={{ rotate: activeAccordion === idx ? 180 : 0 }} transition={{ duration: 0.3 }}>
                    <ChevronDown className="w-4 h-4 text-[#D4AF37]" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {activeAccordion === idx && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <ul className="pb-4 space-y-3 px-2">
                        {section.links.map(link => (
                          <li key={link}>
                            <Link to="#" className="text-sm text-[#777] hover:text-[#D4AF37] transition-colors">{link}</Link>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

        </motion.div>

        {/* 🔥 5️⃣ COMMUNITY & SOCIAL STRIP */}
        <div className="flex flex-col md:flex-row items-center justify-between py-8 border-y border-[#222] mb-8 gap-6">
          <div className="flex items-center gap-6">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#555] hidden sm:block">Connect</span>
            <div className="flex items-center gap-4">
              {socialLinks.length > 0 ? (
                socialLinks.map(({ Icon, href, label }) => (
                  <motion.a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    whileHover={{ scale: 1.1, color: "#D4AF37" }}
                    whileTap={{ scale: 0.9 }}
                    className="w-10 h-10 rounded-full border border-[#333] flex items-center justify-center text-[#888] hover:border-[#D4AF37] transition-all relative overflow-hidden group"
                  >
                    <Icon className="w-4 h-4 relative z-10" />
                    <div className="absolute inset-0 bg-[#D4AF37]/10 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300"></div>
                  </motion.a>
                ))
              ) : (
                <span className="text-[10px] text-[#444] uppercase tracking-widest">Socials coming soon</span>
              )}
            </div>
          </div>

          {/* 🔥 6️⃣ PAYMENT & TRUST BAR */}
          <div className="flex items-center gap-4 text-xs font-medium text-[#666] tracking-wider uppercase flex-wrap justify-center">
            <div className="flex items-center gap-1.5" title="SSL Encrypted">
              <ShieldCheck className="w-4 h-4 text-[#444]" /> Secure SSL
            </div>
            <span className="text-[#333] hidden sm:inline">|</span>
            <div className="flex items-center gap-1.5" title="Islandwide Delivery">
              <MapPin className="w-4 h-4 text-[#444]" /> Islandwide Delivery
            </div>
            <span className="text-[#333] hidden sm:inline">|</span>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#444]" />
              <div className="flex gap-2 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300">
                {/* Visa SVG */}
                <svg viewBox="0 0 38 24" width="38" height="24" xmlns="http://www.w3.org/2000/svg" className="bg-white rounded p-1">
                  <path fill="#1434CB" d="M16.5 6.3h-2.4l-1.5 9.4h2.4l1.5-9.4zM24.7 6.4c-.4-.1-1.1-.3-2-.3-2.2 0-3.7 1.2-3.7 2.9 0 1.2 1.1 1.9 1.9 2.3.8.4 1.1.7 1.1 1.1 0 .6-.8.9-1.5.9-1 0-1.5-.2-2-.4l-.3-.1-.3 2.1c.5.2 1.4.5 2.4.5 2.4 0 3.9-1.2 3.9-3 0-1-.7-1.8-1.9-2.3-.7-.4-1.2-.6-1.2-1 0-.4.5-.8 1.4-.8.8 0 1.4.2 1.8.4l.2.1.3-2.1zM31 6.3h-1.9c-.6 0-1 .2-1.3.8L23.3 15.7h2.5l.5-1.4h3l.3 1.4h2.2L31 6.3zm-2.4 6l.6-1.7c0-.1.1-.3.1-.4 0 .1.1.2.2.3l.4 1.8h-1.3zM12.9 6.3L10 12.8l-.3-1.6c-.5-2.2-2.1-4.4-4-5l2.6 9.5h2.5l4-9.4h-2zM4 6.3H.1l-.1.4c2.5.6 4.2 1.8 5 3.3L3.8 6.3z" />
                </svg>
                {/* MasterCard SVG */}
                <svg viewBox="0 0 38 24" width="38" height="24" xmlns="http://www.w3.org/2000/svg" className="bg-white rounded p-1">
                  <path fill="#EB001B" d="M12.3 5.4h1.7v13.2h-1.7V5.4z" />
                  <circle fill="#EB001B" cx="15.8" cy="12" r="6.6" />
                  <circle fill="#F79E1B" cx="22.2" cy="12" r="6.6" />
                  <path fill="#FF5F00" d="M19 18c2-1.3 3.3-3.5 3.3-6s-1.3-4.7-3.3-6c-2 1.3-3.3 3.5-3.3 6s1.3 4.7 3.3 6z" />
                </svg>
                {/* PayHere / Generic SVG placeholder for PayHere */}
                <div className="bg-white rounded px-2 py-0.5 flex items-center justify-center border border-white/20">
                  <span className="text-[#0e0e0e] text-[9px] font-bold">PAYHERE</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM COPYRIGHT BAR */}
        <div className="flex flex-col-reverse md:flex-row items-center justify-between text-[11px] text-[#555] uppercase tracking-widest font-mono">
          <p>© 2026 SAGA ELITE — RARE FIT FOREVER.</p>
          
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <div className="flex items-center gap-2 bg-[#D4AF37]/10 px-3 py-1 rounded text-[#D4AF37] border border-[#D4AF37]/20">
              <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full"></motion.div>
              DROP 08 LIVE
            </div>
          </div>
        </div>
        
      </div>
    </footer>
  );
};

export default MainFooter;
