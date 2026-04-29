import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Star, StarHalf, Lock, Truck, CornerDownLeft, MessageCircle } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/v1`
  : "http://localhost:5001/api/v1";

const formatTime = (value) => String(value).padStart(2, "0");

const computeCountdown = (targetDate) => {
  if (!targetDate) {
    return { days: "00", hours: "00", minutes: "00", seconds: "00" };
  }

  const now = new Date();
  const diff = targetDate - now;

  if (diff <= 0) {
    return { days: "00", hours: "00", minutes: "00", seconds: "00" };
  }

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

const Home = () => {
  // States handling DB images
  const [heroImages, setHeroImages] = useState([]);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  
  const [logoImage, setLogoImage] = useState(null);
  const [categoryLogos, setCategoryLogos] = useState({ Boys: null, Girls: null, Unisex: null });
  const [adImage, setAdImage] = useState(null);
  const [activeProducts, setActiveProducts] = useState([]);
  const [archiveProducts, setArchiveProducts] = useState([]);
  const [validDrops, setValidDrops] = useState([]);
  const [nextDrop, setNextDrop] = useState(null);
  const [countdown, setCountdown] = useState({
    days: "02", hours: "14", minutes: "56", seconds: "00",
  });
  const [isHomepageLoading, setIsHomepageLoading] = useState(true);
  const [homepageError, setHomepageError] = useState(null);

    const [featuredReviews, setFeaturedReviews] = useState([]);
    const [isReviewsLoading, setIsReviewsLoading] = useState(true);

    // Fetch featured reviews
    useEffect(() => {
      const fetchReviews = async () => {
        try {
          const res = await axios.get(`${API_BASE}/reviews/featured`);
          // assuming res.data contains an array of reviews
          setFeaturedReviews(Array.isArray(res.data) ? res.data : res.data?.data || []);
        } catch (error) {
          console.error("Featured reviews fetch failed", error);
        } finally {
          setIsReviewsLoading(false);
        }
      };
      fetchReviews();
    }, []);

    // Universal fetch
    useEffect(() => {
      const fetchHomepageData = async () => {
        setIsHomepageLoading(true);
        setHomepageError(null);

        try {
          const [heroRes, logoRes, boysRes, girlsRes, unisexRes, adRes, activeProductsRes, archiveProductsRes, dropsRes] = await Promise.all([
            axios.get(`${API_BASE}/image/get-hero-images`).catch((err) => {
              console.error("Hero images fetch failed", err);
              return null;
            }),
            axios.get(`${API_BASE}/image/get-logo-images`).catch((err) => {
              console.error("Logo images fetch failed", err);
              return null;
            }),
            axios.get(`${API_BASE}/image/get-category-logo-images?label=Boys`).catch((err) => {
              console.error("Boys category logo fetch failed", err);
              return null;
            }),
          axios.get(`${API_BASE}/image/get-category-logo-images?label=Girls`).catch((err) => {
            console.error("Girls category logo fetch failed", err);
            return null;
          }),
          axios.get(`${API_BASE}/image/get-category-logo-images?label=Unisex`).catch((err) => {
            console.error("Unisex category logo fetch failed", err);
            return null;
          }),
          axios.get(`${API_BASE}/image/get-ad-images`).catch((err) => {
            console.error("Ad images fetch failed", err);
            return null;
          }),
          axios.get(`${API_BASE}/products/get-all-products?status=active&limit=4`).catch((err) => {
            console.error("Active products fetch failed", err);
            return null;
          }),
          axios.get(`${API_BASE}/products/get-all-products?status=archive&limit=4`).catch((err) => {
            console.error("Archive products fetch failed", err);
            return null;
          }),
          axios.get(`${API_BASE}/drops/get-all-drops`).catch((err) => {
            console.error("Drops fetch failed", err);
            return null;
          }),
        ]);

        if (heroRes?.data?.images?.length) {
          setHeroImages(heroRes.data.images);
        }
        if (logoRes?.data?.images?.length) {
          setLogoImage(logoRes.data.images[0]);
        }

        setCategoryLogos({
          Boys: boysRes?.data?.images?.[0] || null,
          Girls: girlsRes?.data?.images?.[0] || null,
          Unisex: unisexRes?.data?.images?.[0] || null,
        });
        if (adRes?.data?.images?.length) {
          setAdImage(adRes.data.images[0]);
        }

        if (activeProductsRes?.data?.data) {
          setActiveProducts(activeProductsRes.data.data);
        } else if (activeProductsRes?.data) {
          console.warn("Active products endpoint returned data but no list", activeProductsRes.data);
        }

        if (archiveProductsRes?.data?.data) {
          setArchiveProducts(archiveProductsRes.data.data);
        } else if (archiveProductsRes?.data) {
          console.warn("Archive products endpoint returned data but no list", archiveProductsRes.data);
        }

        const drops = Array.isArray(dropsRes?.data?.drops) ? dropsRes.data.drops : [];

        const availableDrops = drops
          .filter((drop) => !drop?.endDate || new Date(drop.endDate) > new Date())
          .sort((a, b) => new Date(a.releaseDate || 0) - new Date(b.releaseDate || 0));

        const upcomingDrop =
          availableDrops.find(
            (drop) => drop?.releaseDate && new Date(drop.releaseDate) > new Date()
          ) || null;

        const liveDrop =
          availableDrops.find(
            (drop) => !drop?.releaseDate || new Date(drop.releaseDate) <= new Date()
          ) || null;

        setValidDrops(availableDrops);
        setNextDrop(upcomingDrop || liveDrop);
      } catch (error) {
        console.error("Failed to load homepage data", error);
        setHomepageError("Unable to load homepage products. Please refresh the page.");
      } finally {
        setIsHomepageLoading(false);
      }
    };

    fetchHomepageData();
  }, []);

  // Automatic hero slider mapping
  useEffect(() => {
    if (heroImages.length === 0) return;
    const timer = setInterval(() => {
      setCurrentHeroIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroImages.length]);

  // Next drop timer handling
  useEffect(() => {
    if (!nextDrop?.releaseDate) {
      setCountdown({ days: "00", hours: "00", minutes: "00", seconds: "00" });
      return;
    }

    setCountdown(computeCountdown(new Date(nextDrop.releaseDate)));

    const timer = setInterval(() => {
      setCountdown(computeCountdown(new Date(nextDrop.releaseDate)));
    }, 1000);
    return () => clearInterval(timer);
  }, [nextDrop]);

  const hasActiveDrop = Boolean(nextDrop);
  const isDropUpcoming =
    hasActiveDrop && nextDrop.releaseDate && new Date(nextDrop.releaseDate) > new Date();

  const heroSrc = heroImages.length > 0 ? heroImages[currentHeroIndex]?.url : "/LOGO.png";
  const logoSrc = logoImage?.url;
  const adSrc = adImage?.url || heroSrc;

  const dropProducts = nextDrop?.products?.filter((product) => product.isActive !== false) || [];
  const displayedProducts = hasActiveDrop ? dropProducts : activeProducts;
  const hasValidDrops = validDrops.length > 0;

  const getProductLabel = (product) => {
    if (product.isLimited) return "Limited 1 of 50";
    return "Limited Release";
  };

  const timerLabel = hasActiveDrop ? nextDrop.name : "Next Ledger Entry";
  const heroTitle = "Rare Fit Forever";
  const heroSubtitle = "The Sovereign Ledger";
  const heroButtonLabel = "Shop Now";
  const shopLink = "/shopping/product-list";
  const gridTitle = hasValidDrops ? "Current Drops" : "Latest Arrivals";

  return (
    <div className="bg-background text-on-surface min-h-screen relative w-full overflow-hidden">
      <div className="grain"></div>

      <main>
        {/* Animated Hero Carousel Section */}
        <section className="relative h-[calc(100vh-80px)] w-full flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <AnimatePresence mode="popLayout">
              <motion.img
                key={heroSrc} // Ensures re-triggering of animation when image changes
                src={heroSrc}
                alt="Hero background"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 0.6, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 2, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />
          </div>
          <div className="relative z-10 text-center px-6 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {logoSrc ? (
                <img src={logoSrc} alt="Saga Elite" className="h-16 mx-auto mb-6" />
              ) : (
                <div className="text-2xl font-serif font-bold tracking-tighter text-[#D4AF37] mb-6">SAGA ELITE</div>
              )}
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="font-sans tracking-[0.4em] uppercase text-primary mb-4 text-sm"
            >
              {heroSubtitle}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="font-serif text-6xl md:text-9xl text-primary font-bold mb-8 tracking-tighter"
            >
              {heroTitle}
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex justify-center"
            >
              <Link
                to={shopLink}
                className="bg-primary-container text-on-primary-container px-12 py-5 font-sans uppercase tracking-widest text-sm font-bold hover:bg-primary transition-all duration-500 shadow-xl shadow-primary/10"
              >
                {heroButtonLabel}
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Scroll entry Animations below */}
        {isDropUpcoming && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="bg-surface-container-lowest py-16 px-8 md:px-12 flex flex-col md:flex-row items-center justify-between gap-8 border-y border-outline-variant/10"
          >
            <div className="flex flex-col">
              <span className="font-sans text-xs tracking-widest text-outline uppercase mb-2">Next Ledger Entry</span>
              <h2 className="font-serif text-3xl text-on-surface">{timerLabel}</h2>
            </div>
            <div className="flex gap-8 items-baseline">
              <div className="flex flex-col items-center">
                <span className="font-serif text-5xl text-primary">{countdown.days}</span>
                <span className="font-sans text-[10px] tracking-widest text-outline uppercase">Days</span>
              </div>
              <span className="font-serif text-4xl text-outline-variant">:</span>
              <div className="flex flex-col items-center">
                <span className="font-serif text-5xl text-primary">{countdown.hours}</span>
                <span className="font-sans text-[10px] tracking-widest text-outline uppercase">Hours</span>
              </div>
              <span className="font-serif text-4xl text-outline-variant">:</span>
              <div className="flex flex-col items-center">
                <span className="font-serif text-5xl text-primary">{countdown.minutes}</span>
                <span className="font-sans text-[10px] tracking-widest text-outline uppercase">Mins</span>
              </div>
            </div>
            <button className="border border-outline/30 px-10 py-4 font-sans uppercase tracking-widest text-xs text-primary hover:bg-primary hover:text-on-primary transition-all duration-500">
              Remind Me
            </button>
          </motion.section>
        )}

        {/* Category Logos Section */}
        <section className="py-24 px-8 md:px-12 bg-[#0b0b0b]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-7xl mx-auto">
            {["Boys", "Girls", "Unisex"].map((cat, index) => {
              const catLogo = categoryLogos[cat];
              return (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  key={cat}
                >
                  <Link
                    to={`/shopping/product-list?category=${cat.toLowerCase()}`}
                    className="group relative flex flex-col items-center justify-center min-h-[350px] border border-white/5 bg-black hover:bg-white/5 transition-all duration-700 overflow-hidden"
                  >
                    {catLogo && (
                      <div className="absolute inset-0 z-0">
                        <motion.img
                          whileHover={{ scale: 1.05 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          src={catLogo.url}
                          alt={`${cat} Collection`}
                          className="h-full w-full object-cover transition-all duration-700"
                        />
                      </div>
                    )}
                    
                    <div className={`absolute inset-0 z-0 bg-black/60 group-hover:bg-black/40 transition-colors duration-700 ${!catLogo ? 'hidden' : ''}`} />
                    
                    <div className="relative z-10 flex flex-col items-center justify-center h-full w-full">
                      {!catLogo && (
                        <div className="text-4xl font-serif text-[#D4AF37] opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 mb-8">
                          {cat[0]}
                        </div>
                      )}
                      <h3 className="font-sans text-xs uppercase tracking-[0.5em] text-white group-hover:text-[#D4AF37] transition-colors duration-500">
                        {cat}
                      </h3>
                      <div className="mt-4 w-0 group-hover:w-12 h-px bg-[#D4AF37] transition-all duration-500" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="py-32 px-8 md:px-12 bg-background"
        >
          <div className="flex justify-between items-end mb-20 gap-6 flex-col md:flex-row">
            <div>
              <h3 className="font-serif text-4xl text-on-surface mb-2">{gridTitle}</h3>
              <p className="font-sans text-outline tracking-wider text-sm">Strictly limited archival releases.</p>
            </div>
            <Link className="font-sans text-xs uppercase tracking-widest text-primary border-b border-primary/30 pb-1 hover:border-primary transition-all" to={shopLink}>
              View All
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {isHomepageLoading ? (
              <div className="col-span-full rounded-3xl border border-white/10 bg-[#111] p-12 text-center text-gray-400">
                Loading current drop products...
              </div>
            ) : homepageError ? (
              <div className="col-span-full rounded-3xl border border-red-500/20 bg-[#1a0a0a] p-12 text-center text-red-300">
                {homepageError}
              </div>
            ) : hasValidDrops ? (
              validDrops.map((drop) => (
                <Link key={drop._id || drop.slug} to={`/shopping/drop/${drop.slug}`} className="group">
                  <div className="relative bg-surface-container-low aspect-[3/4] mb-6 overflow-hidden">
                    <img
                      src={drop.images?.[0]?.url || "/LOGO.png"}
                      alt={drop.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                    />
                    <div className="absolute inset-0 bg-black/20 transition-all duration-500" />
                  </div>
                  <h4 className="font-sans text-xs uppercase tracking-widest text-on-surface mb-1">{drop.name}</h4>
                  <p className="font-serif text-outline text-sm">
                    {drop.releaseDate
                      ? `Releases ${new Date(drop.releaseDate).toLocaleDateString()}`
                      : "Drop available"}
                  </p>
                </Link>
              ))
            ) : displayedProducts.length > 0 ? (
              displayedProducts.map((product) => (
                <div key={product._id} className="group">
                  <div className="relative bg-surface-container-low aspect-[3/4] mb-6 overflow-hidden">
                    <img
                      src={product.images?.[0]?.url || "/LOGO.png"}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                    />
                    <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-md px-3 py-1">
                      <span className="font-sans text-[10px] tracking-widest text-primary uppercase">{getProductLabel(product)}</span>
                    </div>
                  </div>
                  <h4 className="font-sans text-xs uppercase tracking-widest text-on-surface mb-1">{product.name}</h4>                    <Link to={`/product/${product._id}/reviews`} className="flex items-center gap-1 mb-1 hover:opacity-80 transition-opacity">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < (product.averageRating || 0) ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-gray-600'}`} />
                        ))}
                      </div>
                      {product.reviewCount > 0 ? (
                        <span className="text-[10px] text-gray-500">({product.reviewCount} reviews)</span>
                      ) : (
                        <span className="text-[10px] text-gray-500">No reviews yet</span>
                      )}
                    </Link>                  <p className="font-serif text-outline text-sm">${product.basePrice}</p>
                </div>
              ))
            ) : (
              <p className="text-outline border border-outline/10 p-12 text-center col-span-full">
                {hasActiveDrop
                  ? "No products available for this drop yet."
                  : "No products currently available."}
              </p>
            )}
          </div>
        </motion.section>

        {/* Traditional Ethos Section */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-2 bg-surface-container-low"
        >
          <div className="p-16 md:p-32 flex flex-col justify-center">
            <span className="font-sans text-xs tracking-[0.4em] uppercase text-primary mb-6">The Ethos</span>
            <h2 className="font-serif text-5xl md:text-6xl text-on-surface mb-10 leading-tight">The Art of Rare Fit Forever</h2>
            <p className="font-sans text-on-surface-variant leading-relaxed text-lg mb-12 max-w-lg">
              We do not follow seasons; we follow legacies. Each piece in the SAGA ELITE ecosystem is a ledger entry—a permanent record of craftsmanship. Our brutalist approach to textile ensures that longevity is not a feature, but the core identity.
            </p>
            <button className="border-b border-primary text-primary font-sans uppercase tracking-[0.2em] text-xs pb-2 hover:opacity-70 transition-opacity">
              Explore Our Atelier
            </button>
          </div>
          <div className="relative min-h-[500px] overflow-hidden">
            <motion.img
              initial={{ opacity: 0, scale: 1.15 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              src={adSrc}
              alt="Atelier studio"
              className="w-full h-full object-cover"
            />
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="py-32 px-8 md:px-12 bg-background relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-5 pointer-events-none">
            <div className="w-full h-full bg-gradient-to-l from-primary to-transparent" />
          </div>
          <div className="max-w-4xl mx-auto text-center mb-20">
            <h3 className="font-serif text-4xl text-on-surface mb-6 italic">The Sovereignty Rewards</h3>
            <p className="font-sans text-outline tracking-wider leading-relaxed">Membership isn't bought; it's earned through the ledger. Our tiered system rewards the permanent collector.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 max-w-6xl mx-auto">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 flex items-center justify-center text-primary mb-8 border border-outline-variant/30">
                <span className="material-symbols-outlined text-4xl">auto_awesome</span>
              </div>
              <h4 className="font-serif text-xl mb-4">Limited Drops</h4>
              <p className="font-sans text-sm text-on-surface-variant tracking-wide leading-6">First-access priority to all ledger entries before public release.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 flex items-center justify-center text-primary mb-8 border border-outline-variant/30">
                <span className="material-symbols-outlined text-4xl">diamond</span>
              </div>
              <h4 className="font-serif text-xl mb-4">Premium Quality</h4>
              <p className="font-sans text-sm text-on-surface-variant tracking-wide leading-6">Sourced from the finest Italian and Japanese mills, built for generational wear.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 flex items-center justify-center text-primary mb-8 border border-outline-variant/30">
                <span className="material-symbols-outlined text-4xl">card_giftcard</span>
              </div>
              <h4 className="font-serif text-xl mb-4">Surprise Rewards</h4>
              <p className="font-sans text-sm text-on-surface-variant tracking-wide leading-6">Unannounced architectural accessories included in the shipments of loyal collectors.</p>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="py-32 px-8 md:px-12 bg-surface-container-low flex flex-col items-center text-center"
        >
          <h2 className="font-serif text-5xl text-on-surface mb-4">Secure Your Access</h2>
          <p className="font-sans text-outline tracking-[0.2em] uppercase text-xs mb-12">Entry into the Sovereign Ledger is limited.</p>
          <form className="w-full max-w-md flex flex-col gap-6">
            <div className="relative">
              <input
                className="w-full bg-transparent border-0 border-b border-outline-variant/50 py-4 font-sans text-xs tracking-widest text-on-surface placeholder:text-outline-variant focus:ring-0 focus:border-primary transition-all"
                placeholder="ENTER EMAIL ADDRESS"
                type="email"
              />
            </div>
            <button className="bg-primary-container text-on-primary-container py-5 font-sans uppercase tracking-[0.3em] text-xs font-bold hover:bg-primary transition-all duration-500">
              Join the Elite
            </button>
          </form>
        </motion.section>

        {/* Trust Signals Section */}
        <section className="py-16 border-t border-outline/10 bg-surface-container-low">
          <div className="container mx-auto px-4 md:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              <Link to="/legal/privacy-policy" className="flex flex-col items-center text-center group hover:opacity-80 transition-opacity">
                <Lock className="w-8 h-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
                <h4 className="font-sans text-xs uppercase tracking-widest text-on-surface mb-2">Secure Payments</h4>
                <p className="font-serif text-sm text-on-surface-variant">Powered by PayHere</p>
              </Link>
              <Link to="/legal/delivery-policy" className="flex flex-col items-center text-center group hover:opacity-80 transition-opacity">
                <Truck className="w-8 h-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
                <h4 className="font-sans text-xs uppercase tracking-widest text-on-surface mb-2">Island-wide Delivery</h4>
                <p className="font-serif text-sm text-on-surface-variant">2–5 business days</p>
              </Link>
              <Link to="/legal/refund-policy" className="flex flex-col items-center text-center group hover:opacity-80 transition-opacity">
                <CornerDownLeft className="w-8 h-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
                <h4 className="font-sans text-xs uppercase tracking-widest text-on-surface mb-2">Easy Returns</h4>
                <p className="font-serif text-sm text-on-surface-variant">30-day return policy</p>
              </Link>
              <Link to="/contact" className="flex flex-col items-center text-center group hover:opacity-80 transition-opacity">
                <MessageCircle className="w-8 h-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
                <h4 className="font-sans text-xs uppercase tracking-widest text-on-surface mb-2">Customer Support</h4>
                <p className="font-serif text-sm text-on-surface-variant">WhatsApp & Email</p>
              </Link>
            </div>
          </div>
        </section>

        {/* Customer Reviews Section */}
        {(!isReviewsLoading && featuredReviews.length > 0) && (
          <section className="py-24 bg-background border-t border-outline/10">
            <div className="container mx-auto px-4 md:px-8">
              <h2 className="font-serif text-4xl text-on-surface mb-12 text-center">What our customers say</h2>
              <div className="flex overflow-x-auto lg:grid lg:grid-cols-4 gap-6 pb-4 snap-x">
                {featuredReviews.map((review, idx) => (
                  <div key={idx} className="min-w-[280px] lg:min-w-0 bg-surface-container-low p-6 border border-outline/5 snap-center shrink-0">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-gray-600'}`} />
                      ))}
                    </div>
                    <h4 className="font-sans font-bold text-sm text-on-surface mb-2 line-clamp-1">{review.title}</h4>
                    <p className="font-serif text-sm text-on-surface-variant mb-6 h-[60px] line-clamp-3">
                      {review.content?.length > 120 ? `${review.content.substring(0, 120)}...` : review.content}
                    </p>
                    <div className="flex flex-col border-t border-outline/10 pt-4 mt-auto">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-sans text-xs font-bold uppercase tracking-wider">{review.username || review.user?.firstName || 'Anonymous'} {review.user?.lastName?.charAt(0) || ''}.</span>
                        <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest bg-green-500/10 px-2 py-0.5 rounded">Verified</span>
                      </div>
                      <span className="text-[10px] text-gray-500 line-clamp-1">{review.product?.name || 'Saga Elite Archive'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
        {(isReviewsLoading) && (
          <section className="py-24 bg-background border-t border-outline/10">
            <div className="container mx-auto px-4 md:px-8">
              <h2 className="font-serif text-4xl text-on-surface mb-12 text-center text-transparent bg-outline/10 rounded w-64 mx-auto animate-pulse">Loading...</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, idx) => (
                  <div key={idx} className="bg-surface-container-low p-6 border border-outline/5 h-48 animate-pulse" />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default Home;
