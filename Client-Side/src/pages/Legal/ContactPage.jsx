import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  AnimatePresence,
  motion,
} from "framer-motion";
import {
  Phone,
  Mail,
  MessageCircle,
  Clock,
  MapPin,
  Send,
  Sparkles,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import usePageMeta from "@/hooks/use-page-meta";
import { CONTACT_INFO as CONTACT_INFO_FALLBACK } from "@/config";
import useShopAbout from "@/hooks/use-shop-about";
import { API_V1_URL as API_BASE } from "@/lib/api";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
};

const DEFAULT_FAQS = [
  {
    question: "Do you ship across Sri Lanka?",
    answer:
      "Yes — we offer islandwide delivery within 1–3 business days. Free shipping on orders over LKR 15,000.",
  },
  {
    question: "What is your return policy?",
    answer:
      "Unworn items with original tags can be returned within 14 days for store credit or exchange.",
  },
  {
    question: "Do you ship internationally?",
    answer:
      "We ship globally via DHL Express. Duties and taxes are calculated at checkout.",
  },
  {
    question: "How do I find my size?",
    answer:
      "Each product page includes a tailored size guide. Our concierge team is happy to help via WhatsApp.",
  },
  {
    question: "Do you offer custom or made-to-order pieces?",
    answer:
      "Yes — our atelier accepts limited bespoke commissions each season. Reach out for details.",
  },
];

const DEFAULT_HOURS = [
  ["Monday – Friday", "10:00 — 21:00"],
  ["Saturday", "10:00 — 22:00"],
  ["Sunday", "11:00 — 20:00"],
  ["Public holidays", "12:00 — 18:00"],
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ContactPage = () => {
  usePageMeta({
    title: "Contact",
    description:
      "Contact Saga Elite — questions about orders, returns, delivery, and support.",
  });

  const { data: about } = useShopAbout();
  const CONTACT_INFO = useMemo(
    () => ({
      email: about?.shop_contact_email || CONTACT_INFO_FALLBACK.email,
      phone: about?.shop_contact_phone || CONTACT_INFO_FALLBACK.phone,
      whatsapp: about?.shop_whatsapp_number || CONTACT_INFO_FALLBACK.whatsapp,
      addressLine1: about?.shop_address_line1 || CONTACT_INFO_FALLBACK.addressLine1,
      addressLine2:
        [about?.shop_address_city, about?.shop_address_country]
          .filter(Boolean)
          .join(", ") || CONTACT_INFO_FALLBACK.addressLine2,
      shopName: about?.shop_name || "Saga Elite",
      hoursRows:
        Array.isArray(about?.shop_hours) && about.shop_hours.length > 0
          ? about.shop_hours.filter((h) => h?.day || h?.hours)
          : null,
    }),
    [about]
  );

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const whatsappDigits = useMemo(
    () => (CONTACT_INFO.whatsapp || "").replace(/\D/g, ""),
    [CONTACT_INFO.whatsapp]
  );

  const fullAddress = useMemo(
    () => [CONTACT_INFO.addressLine1, CONTACT_INFO.addressLine2].filter(Boolean).join(", "),
    [CONTACT_INFO.addressLine1, CONTACT_INFO.addressLine2]
  );

  const hoursRows = useMemo(() => {
    if (CONTACT_INFO.hoursRows?.length) {
      return CONTACT_INFO.hoursRows.map((row) => [row.day, row.hours]);
    }
    return DEFAULT_HOURS;
  }, [CONTACT_INFO.hoursRows]);

  const faqItems = useMemo(() => {
    const fromConfig = (Array.isArray(about?.faq_items) ? about.faq_items : []).filter(
      (item) => item?.question?.trim() && item?.answer?.trim()
    );
    return fromConfig.length > 0 ? fromConfig : DEFAULT_FAQS;
  }, [about?.faq_items]);

  const quickCards = useMemo(
    () => [
      {
        icon: Phone,
        label: "Call us",
        value: CONTACT_INFO.phone,
        sub: "Mon–Sat · business hours",
        href: CONTACT_INFO.phone ? `tel:${CONTACT_INFO.phone}` : undefined,
      },
      {
        icon: Mail,
        label: "Email",
        value: CONTACT_INFO.email,
        sub: "Replies within 24h",
        href: CONTACT_INFO.email ? `mailto:${CONTACT_INFO.email}` : undefined,
      },
      {
        icon: MessageCircle,
        label: "WhatsApp",
        value: CONTACT_INFO.whatsapp || CONTACT_INFO.phone,
        sub: "Instant support",
        href: whatsappDigits
          ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent("Hi Saga Elite")}`
          : undefined,
      },
      {
        icon: Clock,
        label: "Store hours",
        value: hoursRows[0]?.[1] || "See below",
        sub: hoursRows[0]?.[0] || "Visit us in store",
      },
    ],
    [CONTACT_INFO, hoursRows, whatsappDigits]
  );

  const directionsUrl = useMemo(
    () =>
      fullAddress
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
        : "#",
    [fullAddress]
  );

  const mapEmbedUrl = useMemo(() => {
    if (!fullAddress) {
      return "https://www.openstreetmap.org/export/embed.html?bbox=79.82%2C6.88%2C79.88%2C6.94&layer=mapnik";
    }
    return `https://www.openstreetmap.org/export/embed.html?bbox=79.5%2C6.5%2C80.8%2C7.2&layer=mapnik&marker=${encodeURIComponent(fullAddress)}`;
  }, [fullAddress]);

  useEffect(() => {
    setOpenFaq(null);
  }, [faqItems.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast({
        title: "Please fill in your name, email and message.",
        variant: "destructive",
      });
      return;
    }
    if (!EMAIL_REGEX.test(form.email.trim())) {
      toast({
        title: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    if (form.message.trim().length < 10) {
      toast({
        title: "Please add a little more detail to your message.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`${API_BASE}/contact`, {
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim() || "General inquiry",
        message: form.message.trim(),
      });
      toast({
        title: "Message sent — our concierge will be in touch shortly.",
        variant: "success",
      });
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err) {
      toast({
        title:
          err?.response?.data?.message ||
          err?.message ||
          "Couldn't send your message. Try again or reach us on WhatsApp.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Hero */}
      <section className="relative pt-16 md:pt-24 pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial-gold pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full blur-3xl bg-gold/5 pointer-events-none" />
        <div className="relative mx-auto max-w-4xl px-4 md:px-6 text-center">
          <motion.div {...fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-8">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span className="text-xs tracking-[0.3em] uppercase text-gold-light">
              Concierge · Sri Lanka
            </span>
          </motion.div>
          <motion.h1
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.1 }}
            className="font-display text-6xl md:text-8xl font-light leading-[0.95] mb-6"
          >
            Contact <span className="gold-text italic">SAGA</span>
          </motion.h1>
          <motion.p
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.2 }}
            className="text-lg md:text-xl text-[#d0c5af] max-w-2xl mx-auto leading-relaxed"
          >
            Reach our atelier directly. Whether it&apos;s sizing advice, a styling consultation, or a
            bespoke request — our team is here to elevate every detail of your wardrobe journey.
          </motion.p>
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.35 }}
            className="mt-10 flex justify-center"
          >
            <div className="w-32 gold-divider" />
          </motion.div>
        </div>
      </section>

      {/* Quick contact cards */}
      <section className="container mx-auto max-w-7xl px-4 md:px-6 -mt-10 relative z-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {quickCards.map((c, i) => {
            const CardIcon = c.icon;
            const inner = (
              <>
                <div className="absolute inset-0 bg-gradient-gold opacity-0 group-hover:opacity-[0.06] transition-opacity" />
                <div className="w-12 h-12 rounded-xl bg-gradient-gold/10 gold-border flex items-center justify-center mb-5 group-hover:shadow-gold transition-shadow">
                  <CardIcon className="w-5 h-5 text-gold" />
                </div>
                <p className="text-xs tracking-[0.25em] uppercase text-[#d0c5af] mb-2">
                  {c.label}
                </p>
                <p className="font-display text-xl text-foreground mb-1">{c.value}</p>
                <p className="text-xs text-[#d0c5af]">{c.sub}</p>
              </>
            );

            return (
              <motion.div
                key={c.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                whileHover={{ y: -6 }}
                className="group glass rounded-2xl p-6 relative overflow-hidden"
              >
                {c.href ? (
                  <a
                    href={c.href}
                    target={c.label === "WhatsApp" ? "_blank" : undefined}
                    rel={c.label === "WhatsApp" ? "noopener noreferrer" : undefined}
                    className="block"
                  >
                    {inner}
                  </a>
                ) : (
                  inner
                )}
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Contact form */}
      <section id="contact" className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-radial-gold opacity-50 pointer-events-none" />
        <div className="container mx-auto max-w-7xl px-4 md:px-6 relative">
          <motion.div {...fadeUp} className="text-center mb-12">
            <p className="text-xs tracking-[0.4em] uppercase text-gold mb-4">Get in touch</p>
            <h2 className="font-display text-4xl md:text-6xl font-light">
              Write to <span className="gold-text italic">us</span>
            </h2>
          </motion.div>

          <motion.div {...fadeUp} className="relative max-w-2xl mx-auto">
            <div className="absolute -inset-1 bg-gradient-gold opacity-20 blur-2xl rounded-3xl" />
            <div className="relative glass rounded-3xl p-8 md:p-12 shadow-elegant">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-2 rounded-full bg-background gold-border">
                <span className="text-xs tracking-[0.3em] uppercase text-gold">Concierge form</span>
              </div>

              <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-5 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs tracking-widest uppercase text-gold/90">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="bg-[#1a1810] border-[#4d4635] h-12 focus-visible:ring-gold text-[#e5e2e1] placeholder:text-[#99907c]"
                    placeholder="Your full name"
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs tracking-widest uppercase text-gold/90">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="bg-[#1a1810] border-[#4d4635] h-12 focus-visible:ring-gold text-[#e5e2e1] placeholder:text-[#99907c]"
                    placeholder="you@email.com"
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs tracking-widest uppercase text-gold/90">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="bg-[#1a1810] border-[#4d4635] h-12 focus-visible:ring-gold text-[#e5e2e1] placeholder:text-[#99907c]"
                    placeholder="+94 …"
                    autoComplete="tel"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-xs tracking-widest uppercase text-gold/90">
                    Subject
                  </Label>
                  <Input
                    id="subject"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="bg-[#1a1810] border-[#4d4635] h-12 focus-visible:ring-gold text-[#e5e2e1] placeholder:text-[#99907c]"
                    placeholder="Styling, order, bespoke…"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="message" className="text-xs tracking-widest uppercase text-gold/90">
                    Message
                  </Label>
                  <Textarea
                    id="message"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={5}
                    maxLength={500}
                    className="bg-[#1a1810] border-[#4d4635] focus-visible:ring-gold resize-none text-[#e5e2e1] placeholder:text-[#99907c]"
                    placeholder="Tell us how we can help…"
                  />
                </div>
                <div className="md:col-span-2 flex justify-center mt-2">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="group bg-gradient-gold text-background hover:shadow-gold transition-all h-12 px-10 tracking-widest uppercase text-xs font-semibold"
                  >
                    {isSubmitting ? "Sending…" : "Send message"}
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Map + business hours */}
      <section className="py-24">
        <div className="container mx-auto max-w-7xl px-4 md:px-6 grid lg:grid-cols-5 gap-8">
          <motion.div
            {...fadeUp}
            className="lg:col-span-3 glass rounded-3xl p-2 relative overflow-hidden h-[480px]"
          >
            <div className="absolute top-6 left-6 z-10 glass rounded-2xl p-5 max-w-xs">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-gold" />
                <span className="text-xs tracking-[0.3em] uppercase text-gold">Flagship</span>
              </div>
              <p className="font-display text-2xl mb-1">{CONTACT_INFO.shopName}</p>
              <p className="text-sm text-[#d0c5af]">
                {CONTACT_INFO.addressLine1}
                {CONTACT_INFO.addressLine2 ? (
                  <>
                    <br />
                    {CONTACT_INFO.addressLine2}
                  </>
                ) : null}
              </p>
            </div>
            <iframe
              title={`${CONTACT_INFO.shopName} location`}
              src={mapEmbedUrl}
              className="w-full h-full rounded-[1.4rem] grayscale contrast-125 opacity-80"
              style={{
                filter: "invert(0.92) hue-rotate(180deg) saturate(0.3) contrast(1.1)",
              }}
            />
          </motion.div>

          <motion.div
            {...fadeUp}
            className="lg:col-span-2 glass rounded-3xl p-8 flex flex-col justify-between"
          >
            <div>
              <p className="text-xs tracking-[0.4em] uppercase text-gold mb-3">Visit us</p>
              <h3 className="font-display text-4xl mb-6">Atelier hours</h3>
              <div className="space-y-4">
                {hoursRows.map(([day, time]) => (
                  <div
                    key={day}
                    className="flex items-center justify-between pb-3 border-b border-border/40"
                  >
                    <span className="text-sm text-[#99907c]">{day}</span>
                    <span className="font-display text-lg text-gold">{time}</span>
                  </div>
                ))}
              </div>
            </div>
            <Button
              asChild
              variant="outline"
              className="gold-border text-gold hover:bg-gold hover:text-background mt-8 tracking-widest uppercase text-xs"
            >
              <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
                Get directions
              </a>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24">
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          <motion.div {...fadeUp} className="text-center mb-12">
            <p className="text-xs tracking-[0.4em] uppercase text-gold mb-4">Questions</p>
            <h2 className="font-display text-4xl md:text-5xl font-light">
              Frequently <span className="italic gold-text">asked</span>
            </h2>
          </motion.div>
          <motion.div {...fadeUp} className="space-y-3">
            {faqItems.map((item, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={item.question || i} className="glass rounded-2xl px-6">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left font-display text-xl group"
                    aria-expanded={isOpen}
                  >
                    <span className="text-[#e5e2e1] uppercase tracking-wide group-hover:text-gold transition-colors">{item.question}</span>
                    <ChevronDown
                      className={`w-5 h-5 shrink-0 text-gold transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen ? (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <p className="text-[#d0c5af] leading-relaxed pb-5 whitespace-pre-line text-sm md:text-base">
                          {item.answer}
                        </p>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              );
            })}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
