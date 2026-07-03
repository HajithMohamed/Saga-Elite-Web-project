import React, { useEffect, useMemo, useState } from "react";
import {
  Phone,
  Mail,
  MessageCircle,
  Clock,
  MapPin,
  Send,
  Loader2,
  Box,
  RefreshCcw,
  Briefcase,
} from "lucide-react";
import axios from "axios";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import usePageMeta from "@/hooks/use-page-meta";
import useShopAbout from "@/hooks/use-shop-about";
import { CONTACT_INFO as CONTACT_INFO_FALLBACK } from "@/config";
import { API_V1_URL as API_BASE } from "@/lib/api";
import { FAQPreview } from "@/components/landing/TrustSections";
import { InstagramSection, Newsletter } from "@/components/landing/CommunitySections";
import { Reveal } from "@/components/ui/editorial";
import LuxuryInput from "@/components/auth-components/LuxuryInput";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HERO_BG = "https://images.unsplash.com/photo-1542037104857-ffbb0b9155fb?w=1920&q=80";

const DEFAULT_HOURS = [
  { day: "Monday – Friday", hours: "10:00 — 21:00" },
  { day: "Saturday", hours: "10:00 — 22:00" },
  { day: "Sunday", hours: "11:00 — 20:00" },
  { day: "Public holidays", hours: "12:00 — 18:00" },
];

const checkIsOpen = (hoursRows) => {
  // Simple check for Sri Lanka time (UTC+5:30)
  const d = new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const nd = new Date(utc + (3600000 * 5.5));
  const day = nd.getDay(); // 0 = Sunday
  const currentHour = nd.getHours();
  
  if (day === 0) return currentHour >= 11 && currentHour < 20;
  if (day === 6) return currentHour >= 10 && currentHour < 22;
  return currentHour >= 10 && currentHour < 21;
};

const ContactPage = () => {
  usePageMeta({ title: "Contact Us", fullTitle: true });
  const { data: about, loading } = useShopAbout();
  
  const [form, setForm] = useState({ name: "", email: "", phone: "", orderNumber: "", subject: "", message: "" });
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const CONTACT_INFO = useMemo(() => ({
    email: about?.shop_contact_email || CONTACT_INFO_FALLBACK.email,
    phone: about?.shop_contact_phone || CONTACT_INFO_FALLBACK.phone,
    whatsapp: about?.shop_whatsapp_number || CONTACT_INFO_FALLBACK.whatsapp,
    addressLine1: about?.shop_address_line1 || CONTACT_INFO_FALLBACK.addressLine1,
    addressLine2: [about?.shop_address_city, about?.shop_address_country].filter(Boolean).join(", ") || CONTACT_INFO_FALLBACK.addressLine2,
    shopName: about?.shop_name || "Saga Elite",
    hoursRows: Array.isArray(about?.shop_hours) && about.shop_hours.length > 0 ? about.shop_hours.filter((h) => h?.day || h?.hours) : DEFAULT_HOURS,
  }), [about]);

  const isOpen = checkIsOpen(CONTACT_INFO.hoursRows);
  const fullAddress = [CONTACT_INFO.addressLine1, CONTACT_INFO.addressLine2].filter(Boolean).join(", ");
  const whatsappDigits = (CONTACT_INFO.whatsapp || "").replace(/\D/g, "");

  const mapEmbedUrl = useMemo(() => {
    if (!fullAddress) return "https://www.openstreetmap.org/export/embed.html?bbox=79.82%2C6.88%2C79.88%2C6.94&layer=mapnik";
    return `https://www.openstreetmap.org/export/embed.html?bbox=79.5%2C6.5%2C80.8%2C7.2&layer=mapnik&marker=${encodeURIComponent(fullAddress)}`;
  }, [fullAddress]);

  const validate = (data, fields) => {
    const errs = {};
    if (fields.name && !data.name.trim()) errs.name = "Name is required.";
    if (fields.email) {
      if (!data.email.trim()) errs.email = "Email is required.";
      else if (!EMAIL_REGEX.test(data.email.trim())) errs.email = "Invalid email.";
    }
    if (fields.message && data.message.trim().length < 10) errs.message = "Message must be at least 10 characters.";
    return errs;
  };

  useEffect(() => {
    setErrors(validate(form, touched));
  }, [form, touched]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allTouched = { name: true, email: true, message: true };
    setTouched((prev) => ({ ...prev, ...allTouched }));
    const fresh = validate(form, allTouched);
    setErrors(fresh);
    if (Object.keys(fresh).length > 0) return;

    setIsSubmitting(true);
    try {
      await axios.post(`${API_BASE}/contact`, {
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.orderNumber ? `Order #${form.orderNumber} - ${form.subject}` : form.subject.trim() || "General inquiry",
        message: form.message.trim(),
      });
      setIsSuccess(true);
    } catch (err) {
      toast({ title: "Failed to send", description: "Couldn't send your message. Try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const supportCards = [
    { icon: MessageCircle, title: "General Support", desc: "Questions about sizes, fit, or styling?", action: "WhatsApp Us", link: whatsappDigits ? `https://wa.me/${whatsappDigits}` : "#" },
    { icon: Box, title: "Order Support", desc: "Track or modify an existing order.", action: "Email Support", link: `mailto:${CONTACT_INFO.email}?subject=Order%20Inquiry` },
    { icon: RefreshCcw, title: "Returns & Exchanges", desc: "Start a return or exchange process.", action: "View Policy", link: "/legal/returns" },
    { icon: Briefcase, title: "Business Inquiries", desc: "Partnerships and wholesale requests.", action: "Email Us", link: `mailto:${CONTACT_INFO.email}?subject=Business%20Inquiry` },
  ];

  if (loading && !about) {
    return (
      <div className="bg-page min-h-screen flex items-center justify-center">
        <div className="animate-pulse se-body text-gold-ink">Loading contact details…</div>
      </div>
    );
  }

  return (
    <div className="bg-page text-ink-2 min-h-screen overflow-x-hidden pt-[64px] md:pt-[72px]">
      
      {/* HERO BANNER */}
      <section className="relative h-[220px] md:h-[260px] lg:h-[320px] overflow-hidden flex items-center justify-center w-full">
        <div className="absolute inset-0">
          <img src={HERO_BG} alt="Contact Us" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-page/80" />
        </div>
        <div className="relative z-10 text-center px-4">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="se-serif text-ink text-4xl md:text-[48px] mb-4">Contact Us</motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="se-body text-muted text-lg max-w-xl mx-auto">
            We're here to help you with your orders, products, payments, and support.
          </motion.p>
        </div>
      </section>

      {/* QUICK ACTIONS CTA */}
      <div className="bg-gold w-full">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-sans font-bold text-ongold uppercase tracking-wider text-[14px]">Need immediate assistance?</span>
          <div className="flex gap-4">
            <a href={`https://wa.me/${whatsappDigits}`} className="px-6 py-2 bg-page text-gold-ink rounded-full text-xs uppercase tracking-wider font-bold hover:bg-card transition-colors">WhatsApp</a>
            <a href={`tel:${CONTACT_INFO.phone}`} className="px-6 py-2 bg-transparent border border-page text-ongold rounded-full text-xs uppercase tracking-wider font-bold hover:bg-page hover:text-gold-ink transition-colors">Call Now</a>
          </div>
        </div>
      </div>

      {/* SUPPORT CARDS */}
      <section className="py-20 max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {supportCards.map((card, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className="bg-card p-8 rounded-[20px] border border-ink/5 h-full flex flex-col justify-between group hover:border-gold-ink/50 transition-colors">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mb-6">
                    <card.icon className="w-6 h-6 text-gold-ink" />
                  </div>
                  <h3 className="font-sans font-semibold text-[18px] text-ink mb-2">{card.title}</h3>
                  <p className="se-body text-[14px] text-muted mb-6 leading-relaxed">{card.desc}</p>
                </div>
                {card.link.startsWith('mailto') || card.link.startsWith('http') ? (
                  <a href={card.link} target={card.link.startsWith('http') && !card.link.includes('mailto') ? "_blank" : "_self"} rel="noreferrer" className="text-[12px] uppercase tracking-widest text-gold-ink font-bold hover:text-gold-ink">
                    {card.action} &rarr;
                  </a>
                ) : (
                  <a href={card.link} className="text-[12px] uppercase tracking-widest text-gold-ink font-bold hover:text-gold-ink">
                    {card.action} &rarr;
                  </a>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* MAIN LAYOUT: Form + Map/Info */}
      <section className="pb-28 max-w-7xl mx-auto px-4 md:px-8 grid lg:grid-cols-2 gap-12 lg:gap-20">
        
        {/* CONTACT FORM */}
        <Reveal>
          <div className="bg-card p-6 md:p-10 rounded-[24px] border border-ink/5">
            <h2 className="se-serif text-[32px] text-ink mb-2">Send a Message</h2>
            <p className="se-body text-muted mb-8">We usually reply within 24 hours.</p>

            {isSuccess ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-8 h-8 text-success" />
                </div>
                <h3 className="font-sans text-xl font-semibold mb-2">Message Received</h3>
                <p className="se-body text-muted mb-8">Thank you for contacting us. Your reference number has been sent to your email.</p>
                <button onClick={() => { setIsSuccess(false); setForm({ name: "", email: "", phone: "", orderNumber: "", subject: "", message: "" }); setTouched({}); }} className="text-gold-ink uppercase tracking-wider text-xs font-bold hover:underline">
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <LuxuryInput id="name" label="Full Name" placeholder="John Doe" value={form.name} error={touched.name ? errors.name : ""} onChange={(e) => { setForm(p => ({ ...p, name: e.target.value })); setTouched(p => ({ ...p, name: true })); }} />
                  <LuxuryInput id="phone" label="Phone Number" placeholder="+94 77 123 4567" type="tel" value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                
                <LuxuryInput id="email" label="Email Address" placeholder="you@email.com" type="email" value={form.email} error={touched.email ? errors.email : ""} onChange={(e) => { setForm(p => ({ ...p, email: e.target.value })); setTouched(p => ({ ...p, email: true })); }} />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <LuxuryInput id="subject" label="Subject" placeholder="General Inquiry" value={form.subject} onChange={(e) => setForm(p => ({ ...p, subject: e.target.value }))} />
                  <LuxuryInput id="orderNumber" label="Order Number (Optional)" placeholder="#SE-12345" value={form.orderNumber} onChange={(e) => setForm(p => ({ ...p, orderNumber: e.target.value }))} />
                </div>

                <div className="flex flex-col gap-2 relative">
                  <label htmlFor="message" className="se-label text-[10px] uppercase tracking-[0.2em] text-muted ml-1">Message</label>
                  <textarea
                    id="message"
                    value={form.message}
                    onChange={(e) => { setForm(p => ({ ...p, message: e.target.value })); setTouched(p => ({ ...p, message: true })); }}
                    className={`h-[160px] w-full rounded-[16px] border bg-page px-4 py-4 text-[14px] text-ink-2 outline-none transition-all duration-300 resize-none ${
                      touched.message && errors.message ? "border-rose-500/50 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30" : "border-ink/10 focus:border-gold-ink focus:ring-1 focus:ring-gold-ink/30"
                    }`}
                    placeholder="How can we help you?"
                  />
                  {touched.message && errors.message && <span className="absolute -bottom-5 left-1 text-[10px] text-rose-500">{errors.message}</span>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-[56px] mt-4 bg-gold text-ongold rounded-[16px] font-sans font-bold uppercase tracking-wider text-[12px] flex items-center justify-center gap-2 hover:bg-gold-hover transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><Send className="w-4 h-4" /> Send Message</>}
                </button>
              </form>
            )}
          </div>
        </Reveal>

        {/* INFO & MAP */}
        <Reveal delay={0.2} className="flex flex-col gap-8">
          
          {/* Business Hours */}
          <div className="bg-card p-8 rounded-[24px] border border-ink/5 relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full ${isOpen ? 'bg-success' : 'bg-rose-500'}`} />
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-sans font-semibold text-[20px] text-ink">Business Hours</h3>
              <span className={`px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full ${isOpen ? 'bg-success/10 text-success border border-success/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                {isOpen ? 'Open Now' : 'Closed Now'}
              </span>
            </div>
            <div className="space-y-3">
              {CONTACT_INFO.hoursRows.map((row, i) => (
                <div key={i} className="flex justify-between items-center text-[14px]">
                  <span className="text-muted">{row.day}</span>
                  <span className="text-ink-2 font-mono">{row.hours}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Details */}
          <div className="bg-card p-8 rounded-[24px] border border-ink/5">
            <h3 className="font-sans font-semibold text-[20px] text-ink mb-6">Contact Details</h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <MapPin className="w-5 h-5 text-gold-ink mt-0.5" />
                <div>
                  <p className="se-body text-[14px] text-ink-2">{CONTACT_INFO.shopName}</p>
                  <p className="se-body text-[14px] text-muted leading-relaxed">{fullAddress}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Phone className="w-5 h-5 text-gold-ink" />
                <p className="se-body text-[14px] text-ink-2">{CONTACT_INFO.phone}</p>
              </div>
              <div className="flex items-center gap-4">
                <Mail className="w-5 h-5 text-gold-ink" />
                <p className="se-body text-[14px] text-ink-2">{CONTACT_INFO.email}</p>
              </div>
            </div>
          </div>

          {/* Map Embed */}
          <div className="h-[260px] md:h-[320px] rounded-[24px] overflow-hidden border border-ink/5 relative">
            <iframe
              title="Location"
              src={mapEmbedUrl}
              className="w-full h-full grayscale opacity-70"
              style={{ filter: "invert(0.9) hue-rotate(180deg) saturate(0.5) contrast(1.2)" }}
            />
            <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
               <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`} target="_blank" rel="noreferrer" className="w-full py-3 bg-page/80 backdrop-blur-md border border-ink/10 text-ink font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center pointer-events-auto hover:bg-gold hover:text-ongold transition-colors">
                  Get Directions
               </a>
            </div>
          </div>

        </Reveal>
      </section>

      {/* REUSED SECTIONS */}
      <FAQPreview />
      <InstagramSection />
      <Newsletter />
    </div>
  );
};

export default ContactPage;
