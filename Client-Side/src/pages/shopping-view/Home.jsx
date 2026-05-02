import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from "framer-motion";
import axios from "axios";
import {
  Lock,
  Truck,
  CornerDownLeft,
  MessageCircle,
  ArrowRight,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";
import { API_V1_URL as API_BASE } from "@/lib/api";
import { CONTACT_INFO } from "@/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const formatTime = (value) => String(value).padStart(2, "0");

const computeCountdown = (targetDate) => {
  if (!targetDate)
    return {
      days: "00",
      hours: "00",
      minutes: "00",
      seconds: "00",
    };
  const now = new Date();
  const diff = targetDate - now;
  if (diff <= 0)
    return {
      days: "00",
      hours: "00",
      minutes: "00",
      seconds: "00",
    };

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days: formatTime(days),
    hours: formatTime(hours),
    minutes: formatTime(minutes),
    seconds: formatTime(seconds),
  };
};

const badgeContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const badgeItemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

const productGridVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const productCardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const InstagramIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
    />
  </svg>
);

const FacebookIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
    />
  </svg>
);

const TikTokIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"
    />
  </svg>
);

const CountdownDigit = ({ value, label }) => (
  <div className="flex flex-col items-center justify-center bg-black text-[#D4AF37] rounded-lg w-20 h-24 md:w-28 md:h-32 shadow-2xl">
    <motion.span
      key={value}
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.22 }}
      className="text-4xl md:text-6xl font-serif font-bold"
    >
      {value}
    </motion.span>
    <span className="text-[10px] md:text-xs uppercase font-bold tracking-widest mt-1 opacity-80">
      {label}
    </span>
  </div>
);

const Home = () => {
  const [heroImages, setHeroImages] = useState([]);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  const [categoryLogos, setCategoryLogos] = useState({
    Boys: null,
    Girls: null,
    Unisex: null,
  });
  const [adImage, setAdImage] = useState(null);
  const [activeProducts, setActiveProducts] = useState([]);
  const [nextDrop, setNextDrop] = useState(null);
  const [countdown, setCountdown] = useState({
    days: "02",
    hours: "14",
    minutes: "56",
    seconds: "00",
  });
  const [isHomepageLoading, setIsHomepageLoading] = useState(true);
  const [homepageError, setHomepageError] = useState(null);

  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroParallaxY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);

  useEffect(() => {
    const fetchHomepageData = async () => {
      setIsHomepageLoading(true);
      setHomepageError(null);

      try {
        const [
          heroRes,
          boysRes,
          girlsRes,
          unisexRes,
          adRes,
          activeProductsRes,
          dropsRes,
        ] = await Promise.all([
          axios.get(`${API_BASE}/image/get-hero-images`).catch(() => null),
          axios
            .get(`${API_BASE}/image/get-category-logo-images?label=Boys`)
            .catch(() => null),
          axios
            .get(`${API_BASE}/image/get-category-logo-images?label=Girls`)
            .catch(() => null),
          axios
            .get(`${API_BASE}/image/get-category-logo-images?label=Unisex`)
            .catch(() => null),
          axios.get(`${API_BASE}/image/get-ad-images`).catch(() => null),
          axios
            .get(`${API_BASE}/products/get-all-products?status=active&limit=8`)
            .catch(() => null),
          axios.get(`${API_BASE}/drops/get-all-drops`).catch(() => null),
        ]);

        if (heroRes?.data?.images?.length) setHeroImages(heroRes.data.images);

        setCategoryLogos({
          Boys: boysRes?.data?.images?.[0] || null,
          Girls: girlsRes?.data?.images?.[0] || null,
          Unisex: unisexRes?.data?.images?.[0] || null,
        });
        if (adRes?.data?.images?.length) setAdImage(adRes.data.images[0]);

        if (activeProductsRes?.data?.data)
          setActiveProducts(activeProductsRes.data.data);

        const drops = Array.isArray(dropsRes?.data?.drops)
          ? dropsRes.data.drops
          : [];
        const availableDrops = drops
          .filter(
            (drop) => !drop?.endDate || new Date(drop.endDate) > new Date()
          )
          .sort(
            (a, b) =>
              new Date(a.releaseDate || 0) - new Date(b.releaseDate || 0)
          );

        const upcomingDrop =
          availableDrops.find(
            (drop) => drop?.releaseDate && new Date(drop.releaseDate) > new Date()
          ) || null;
        const liveDrop =
          availableDrops.find(
            (drop) =>
              !drop?.releaseDate || new Date(drop.releaseDate) <= new Date()
          ) || null;
        setNextDrop(upcomingDrop || liveDrop);
      } catch (error) {
        console.error("Failed to load homepage data", error);
        setHomepageError(
          "Unable to load homepage products. Please refresh the page."
        );
      } finally {
        setIsHomepageLoading(false);
      }
    };

    fetchHomepageData();
  }, []);

  useEffect(() => {
    if (heroImages.length === 0) return;
    const timer = setInterval(
      () => setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length),
      5000
    );
    return () => clearInterval(timer);
  }, [heroImages.length]);

  useEffect(() => {
    if (!nextDrop?.releaseDate) {
      setCountdown({
        days: "00",
        hours: "00",
        minutes: "00",
        seconds: "00",
      });
      return;
    }
    setCountdown(computeCountdown(new Date(nextDrop.releaseDate)));
    const timer = setInterval(
      () => setCountdown(computeCountdown(new Date(nextDrop.releaseDate))),
      1000
    );
    return () => clearInterval(timer);
  }, [nextDrop]);

  const hasActiveDrop = Boolean(nextDrop);
  const isDropUpcoming =
    hasActiveDrop &&
    nextDrop.releaseDate &&
    new Date(nextDrop.releaseDate) > new Date();

  const heroSrc =
    heroImages.length > 0 ? heroImages[currentHeroIndex]?.url : null;

  const marqueeText =
    "NEW DROP COMING SOON · RARE FIT FOREVER · PREMIUM QUALITY · ";

  const scrollToNext = () => {
    const el = document.getElementById("trust-badges");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = fd.get("email");
    console.log("Newsletter signup:", email);
    setNewsletterSuccess(true);
    e.currentTarget.reset();
    setTimeout(() => setNewsletterSuccess(false), 5000);
  };

  return (
    <div className="bg-background text-on-surface min-h-screen relative w-full overflow-hidden">
      <main>
        {/* 1. HERO */}
        <section
          ref={heroRef}
          className={`relative min-h-[90vh] w-full flex flex-col items-center justify-center overflow-hidden ${
            !heroSrc ? "bg-black" : ""
          }`}
        >
          {heroSrc ? (
            <>
              <motion.div
                style={{ y: heroParallaxY }}
                className="absolute inset-0 z-0 will-change-transform"
              >
                <AnimatePresence mode="wait">
                  <motion.img
                    key={heroSrc}
                    src={heroSrc}
                    alt="Elevate Your Style"
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5 }}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </AnimatePresence>
                <div className="absolute inset-0 bg-black/60 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
              </motion.div>
              <div className="absolute bottom-28 left-1/2 z-20 flex -translate-x-1/2 gap-2">
                {heroImages.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Slide ${i + 1}`}
                    onClick={() => setCurrentHeroIndex(i)}
                    className={`h-2 rounded-full transition-all ${
                      i === currentHeroIndex
                        ? "w-8 bg-[#D4AF37]"
                        : "w-2 bg-white/40 hover:bg-white/70"
                    }`}
                  />
                ))}
              </div>
              <p className="absolute bottom-20 left-1/2 z-20 -translate-x-1/2 text-[10px] uppercase tracking-[0.35em] text-[#D4AF37]/90">
                {currentHeroIndex + 1} / {heroImages.length}
              </p>
            </>
          ) : (
            <div className="absolute inset-0 z-0 bg-black" />
          )}

          <div className="relative z-10 text-center px-6 max-w-4xl mt-16">
            {!heroSrc ? (
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-serif text-5xl md:text-8xl text-white font-bold tracking-tight"
              >
                Saga Elite
              </motion.h1>
            ) : (
              <>
                <motion.h1
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="font-serif text-5xl md:text-8xl text-white font-bold mb-4 tracking-tighter"
                >
                  Elevate Your Style
                </motion.h1>
                <div className="mb-6 overflow-hidden">
                  <div className="homepage-marquee-track flex w-max whitespace-nowrap">
                    <span className="px-4 text-[10px] uppercase tracking-[0.35em] text-[#D4AF37]">
                      {marqueeText.repeat(4)}
                    </span>
                    <span className="px-4 text-[10px] uppercase tracking-[0.35em] text-[#D4AF37]">
                      {marqueeText.repeat(4)}
                    </span>
                  </div>
                </div>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="font-sans text-lg md:text-xl text-gray-200 mb-10 tracking-wide"
                >
                  Premium fashion, delivered across Sri Lanka
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                  <Link to="/shopping/product-list">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto px-10 py-6 text-sm uppercase tracking-widest bg-[#D4AF37] hover:bg-[#B3902A] text-black font-bold"
                    >
                      Shop Now
                    </Button>
                  </Link>
                  <Link to="/shopping/product-list?category=all">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto px-10 py-6 text-sm uppercase tracking-widest text-[#D4AF37] border-[#D4AF37] hover:bg-[#D4AF37]/10 bg-transparent"
                    >
                      View Collections
                    </Button>
                  </Link>
                </motion.div>
              </>
            )}
          </div>

          {heroSrc ? (
            <button
              type="button"
              onClick={scrollToNext}
              className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 flex flex-col items-center gap-1 text-white/80 hover:text-[#D4AF37] transition-colors"
              aria-label="Scroll down"
            >
              <span className="text-[10px] uppercase tracking-[0.3em]">
                Scroll
              </span>
              <ChevronDown className="h-6 w-6 animate-bounce-scroll-hint" />
            </button>
          ) : null}
        </section>

        {/* TRUST BADGES */}
        <section
          id="trust-badges"
          className="py-8 bg-surface-container-lowest border-y border-[#D4AF37]/40"
        >
          <div className="container mx-auto px-4 max-w-7xl">
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
              variants={badgeContainerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
            >
              {[
                { icon: Truck, title: "Free Delivery Island-Wide" },
                { icon: CornerDownLeft, title: "14-Day Returns" },
                { icon: Lock, title: "Secure Payments" },
                { icon: MessageCircle, title: "WhatsApp Support" },
              ].map((badge, idx) => (
                <motion.div
                  key={idx}
                  variants={badgeItemVariants}
                  className="flex flex-col items-center justify-center text-on-surface hover:text-[#D4AF37] transition-colors"
                >
                  <badge.icon className="w-6 h-6 mb-3" />
                  <span className="font-sans text-[10px] sm:text-xs uppercase tracking-wider font-semibold">
                    {badge.title}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CATEGORIES */}
        <section className="py-24 px-6 md:px-12 bg-background">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="font-serif text-4xl text-on-surface mb-4">
                Featured Collections
              </h2>
              <p className="font-sans text-outline text-sm uppercase tracking-widest">
                Shop by category
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {["Boys", "Girls", "Unisex"].map((cat, index) => {
                const logo = categoryLogos[cat];
                const hasLogo = Boolean(logo?.url);
                return (
                  <motion.div
                    key={cat}
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.55, delay: index * 0.08 }}
                  >
                    <Link
                      to={`/shopping/product-list?category=${cat.toLowerCase()}`}
                      className="group relative block h-[450px] overflow-hidden rounded-lg bg-surface-container-low ring-1 ring-transparent transition-[box-shadow,ring-color] duration-300 hover:ring-2 hover:ring-[#D4AF37]"
                    >
                      {hasLogo ? (
                        <img
                          src={logo.url}
                          alt={cat}
                          className="absolute inset-0 h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-105 group-hover:opacity-70"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-surface-container-high">
                          <span className="font-serif text-3xl text-on-surface/80">
                            {cat}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                      <div className="absolute bottom-0 left-0 w-full translate-y-0 p-8 transition-transform duration-300 group-hover:-translate-y-1">
                        <h3 className="font-serif text-3xl text-white mb-2">
                          {cat}
                        </h3>
                        <span className="inline-flex translate-y-8 items-center gap-2 font-sans text-xs uppercase tracking-widest text-[#D4AF37] opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                          Shop <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ADMIN AD BANNER */}
        {adImage?.url ? (
          <section className="relative w-full overflow-hidden border-y border-[#D4AF37]/20">
            <Link to="/shopping/product-list" className="block">
              <img
                src={adImage.url}
                alt="Limited promotion"
                className="h-auto w-full max-h-[420px] object-cover md:max-h-[520px]"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/35 transition hover:bg-black/25">
                <span className="rounded-full border border-[#D4AF37]/50 bg-black/50 px-8 py-3 font-sans text-sm uppercase tracking-[0.25em] text-[#D4AF37] backdrop-blur-sm">
                  Limited Edition · Shop Now →
                </span>
              </div>
            </Link>
          </section>
        ) : null}

        {/* NEW ARRIVALS */}
        <section className="py-24 px-6 md:px-12 bg-surface-container-lowest">
          <div className="container mx-auto max-w-7xl">
            <div className="mb-12 flex items-end justify-between">
              <div>
                <h2 className="font-serif text-4xl text-on-surface mb-2">
                  New Arrivals
                </h2>
                <p className="font-sans text-outline text-sm uppercase tracking-widest">
                  Latest additions to the ledger
                </p>
              </div>
              <Link
                to="/shopping/product-list"
                className="hidden items-center gap-2 border-b border-primary pb-1 font-sans text-xs uppercase tracking-widest text-primary transition-all hover:border-[#D4AF37] hover:text-[#D4AF37] md:flex"
              >
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {isHomepageLoading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex flex-col gap-4 animate-pulse">
                    <div className="aspect-[3/4] w-full rounded-md bg-surface-container-high" />
                    <div className="h-4 w-3/4 rounded bg-surface-container-high" />
                    <div className="h-4 w-1/2 rounded bg-surface-container-high" />
                  </div>
                ))}
              </div>
            ) : homepageError ? (
              <div className="col-span-full border border-red-500/20 py-12 text-center text-red-400">
                {homepageError}
              </div>
            ) : activeProducts.length > 0 ? (
              <motion.div
                className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4"
                variants={productGridVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.05 }}
              >
                {activeProducts.map((product) => {
                  const slug = product.slug || product.productSlug;
                  const discount = Number(product.discountPercent || 0);
                  const salePrice =
                    product.salePrice > 0 ? product.salePrice : null;
                  const basePrice = product.basePrice;
                  return (
                    <motion.div
                      key={product._id}
                      variants={productCardVariants}
                      className="group cursor-pointer"
                    >
                      <div className="relative mb-4 aspect-[3/4] overflow-hidden rounded-md bg-surface-container-low">
                        <img
                          src={product.images?.[0]?.url || "/LOGO.png"}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute left-3 top-3 rounded bg-background/80 px-2 py-1 backdrop-blur-sm">
                          <span className="font-sans text-[9px] uppercase tracking-widest text-primary">
                            New
                          </span>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                          {slug ? (
                            <Link to={`/shopping/product/${slug}`}>
                              <Button className="bg-[#D4AF37] text-black hover:bg-[#B3902A]">
                                Quick View
                              </Button>
                            </Link>
                          ) : null}
                        </div>
                      </div>
                      <div>
                        <h4 className="mb-1 truncate font-sans text-sm font-bold tracking-wide text-on-surface">
                          {product.name}
                        </h4>
                        <div className="flex flex-wrap items-baseline gap-2 font-sans text-sm">
                          {discount > 0 && basePrice != null ? (
                            <span className="text-gray-500 line-through">
                              LKR {Number(basePrice).toLocaleString()}
                            </span>
                          ) : null}
                          <span
                            className={
                              discount > 0 || salePrice
                                ? "font-semibold text-[#D4AF37]"
                                : "text-outline"
                            }
                          >
                            LKR{" "}
                            {(
                              salePrice ||
                              basePrice ||
                              0
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <p className="col-span-full py-12 text-center text-outline">
                No products found.
              </p>
            )}
            <div className="mt-12 text-center md:hidden">
              <Link to="/shopping/product-list">
                <Button
                  variant="outline"
                  className="w-full border-primary text-primary"
                >
                  View All New Arrivals
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* PROMO / COUNTDOWN */}
        <section className="relative overflow-hidden bg-[#D4AF37] py-16 text-black">
          <div
            className="pointer-events-none absolute inset-0 bg-repeat opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle, #000 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="container relative z-10 mx-auto px-4 text-center">
            {isDropUpcoming ? (
              <div className="flex flex-col items-center">
                <span className="mb-4 font-sans text-sm font-bold uppercase tracking-widest">
                  Limited Edition Drop
                </span>
                <h2 className="mb-8 font-serif text-4xl font-bold md:text-6xl">
                  {nextDrop.name}
                </h2>
                <div className="mb-10 flex flex-wrap justify-center gap-4 md:gap-10">
                  <CountdownDigit value={countdown.days} label="Days" />
                  <span className="mt-4 font-serif text-4xl font-bold md:text-6xl">
                    :
                  </span>
                  <CountdownDigit value={countdown.hours} label="Hours" />
                  <span className="mt-4 font-serif text-4xl font-bold md:text-6xl">
                    :
                  </span>
                  <CountdownDigit value={countdown.minutes} label="Mins" />
                  <span className="mt-4 font-serif text-4xl font-bold md:text-6xl">
                    :
                  </span>
                  <CountdownDigit value={countdown.seconds} label="Secs" />
                </div>
                <Button className="min-w-[200px] bg-black px-10 py-6 text-sm font-bold uppercase tracking-widest text-[#D4AF37] shadow-xl hover:bg-zinc-900">
                  Remind Me
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-6 py-6 md:flex-row">
                <Truck className="h-12 w-12" />
                <h2 className="font-serif text-3xl font-bold tracking-wide md:text-4xl">
                  Free delivery on all orders across Sri Lanka{" "}
                  <span className="inline-block md:hidden">🚚</span>
                </h2>
              </div>
            )}
          </div>
        </section>

        {/* SOCIAL CTA */}
        <section className="bg-background px-4 py-24">
          <div className="container mx-auto max-w-7xl text-center">
            <h2 className="mb-3 font-serif text-4xl text-on-surface">
              Join the community
            </h2>
            <p className="mx-auto mb-10 max-w-xl font-sans text-sm uppercase tracking-[0.2em] text-[#D4AF37]">
              Follow @sagaaelite for daily style inspo
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <motion.a
                href={CONTACT_INFO.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.08 }}
                className="flex h-16 w-16 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-surface-container-low text-on-surface transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37]"
                aria-label="Instagram"
              >
                <InstagramIcon className="h-8 w-8" />
              </motion.a>
              <motion.a
                href={CONTACT_INFO.socials.facebook}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.08 }}
                className="flex h-16 w-16 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-surface-container-low text-on-surface transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37]"
                aria-label="Facebook"
              >
                <FacebookIcon className="h-8 w-8" />
              </motion.a>
              <motion.a
                href={CONTACT_INFO.socials.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.08 }}
                className="flex h-16 w-16 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-surface-container-low text-on-surface transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37]"
                aria-label="TikTok"
              >
                <TikTokIcon className="h-8 w-8" />
              </motion.a>
            </div>
          </div>
        </section>

        {/* NEWSLETTER */}
        <section className="border-t border-outline/10 bg-surface-container-low py-32 text-center px-6">
          <div className="container mx-auto max-w-2xl">
            <MessageCircle className="mx-auto mb-6 h-10 w-10 text-[#D4AF37]" />
            <h2 className="mb-4 font-serif text-4xl text-on-surface">
              Stay in the Loop
            </h2>
            <p className="mb-10 font-sans tracking-wide text-outline">
              Get exclusive deals and new arrivals straight to your inbox.
            </p>
            <form
              className="mx-auto flex max-w-lg flex-col gap-4 sm:flex-row"
              onSubmit={handleNewsletterSubmit}
            >
              <Input
                name="email"
                type="email"
                placeholder="Enter your email address"
                className="h-14 border-outline/20 bg-background text-center focus-visible:ring-[#D4AF37] sm:text-left"
                required
              />
              <Button
                type="submit"
                className="h-14 bg-primary px-8 font-bold uppercase tracking-widest text-primary-foreground hover:bg-primary/90"
              >
                Subscribe
              </Button>
            </form>
            <AnimatePresence>
              {newsletterSuccess ? (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mt-6 flex items-center justify-center gap-2 text-sm text-emerald-500"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  You&apos;re on the list — watch your inbox.
                </motion.p>
              ) : null}
            </AnimatePresence>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
