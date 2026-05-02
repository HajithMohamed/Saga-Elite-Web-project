import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Star, Lock, Truck, CornerDownLeft, MessageCircle, ArrowRight, Instagram } from "lucide-react";
import { API_V1_URL as API_BASE } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const formatTime = (value) => String(value).padStart(2, "0");

const computeCountdown = (targetDate) => {
  if (!targetDate) return { days: "00", hours: "00", minutes: "00", seconds: "00" };
  const now = new Date();
  const diff = targetDate - now;
  if (diff <= 0) return { days: "00", hours: "00", minutes: "00", seconds: "00" };
  
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return {
    days: formatTime(days), hours: formatTime(hours), minutes: formatTime(minutes), seconds: formatTime(seconds)
  };
};

const Home = () => {
  const [heroImages, setHeroImages] = useState([]);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  
  const [logoImage, setLogoImage] = useState(null);
  const [categoryLogos, setCategoryLogos] = useState({ Boys: null, Girls: null, Unisex: null });
  const [adImage, setAdImage] = useState(null);
  const [activeProducts, setActiveProducts] = useState([]);
  const [archiveProducts, setArchiveProducts] = useState([]);
  const [validDrops, setValidDrops] = useState([]);
  const [nextDrop, setNextDrop] = useState(null);
  const [countdown, setCountdown] = useState({ days: "02", hours: "14", minutes: "56", seconds: "00" });
  const [isHomepageLoading, setIsHomepageLoading] = useState(true);
  const [homepageError, setHomepageError] = useState(null);

  const [featuredReviews, setFeaturedReviews] = useState([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await axios.get(`${API_BASE}/reviews/featured`);
        setFeaturedReviews(Array.isArray(res.data) ? res.data : res.data?.data || []);
      } catch (error) {
        console.error("Featured reviews fetch failed", error);
      } finally {
        setIsReviewsLoading(false);
      }
    };
    fetchReviews();
  }, []);

  useEffect(() => {
    const fetchHomepageData = async () => {
      setIsHomepageLoading(true);
      setHomepageError(null);

      try {
        const [heroRes, logoRes, boysRes, girlsRes, unisexRes, adRes, activeProductsRes, archiveProductsRes, dropsRes] = await Promise.all([
          axios.get(`${API_BASE}/image/get-hero-images`).catch(() => null),
          axios.get(`${API_BASE}/image/get-logo-images`).catch(() => null),
          axios.get(`${API_BASE}/image/get-category-logo-images?label=Boys`).catch(() => null),
          axios.get(`${API_BASE}/image/get-category-logo-images?label=Girls`).catch(() => null),
          axios.get(`${API_BASE}/image/get-category-logo-images?label=Unisex`).catch(() => null),
          axios.get(`${API_BASE}/image/get-ad-images`).catch(() => null),
          axios.get(`${API_BASE}/products/get-all-products?status=active&limit=8`).catch(() => null),
          axios.get(`${API_BASE}/products/get-all-products?status=archive&limit=4`).catch(() => null),
          axios.get(`${API_BASE}/drops/get-all-drops`).catch(() => null),
        ]);

        if (heroRes?.data?.images?.length) setHeroImages(heroRes.data.images);
        if (logoRes?.data?.images?.length) setLogoImage(logoRes.data.images[0]);

        setCategoryLogos({
          Boys: boysRes?.data?.images?.[0] || null,
          Girls: girlsRes?.data?.images?.[0] || null,
          Unisex: unisexRes?.data?.images?.[0] || null,
        });
        if (adRes?.data?.images?.length) setAdImage(adRes.data.images[0]);

        if (activeProductsRes?.data?.data) setActiveProducts(activeProductsRes.data.data);
        if (archiveProductsRes?.data?.data) setArchiveProducts(archiveProductsRes.data.data);

        const drops = Array.isArray(dropsRes?.data?.drops) ? dropsRes.data.drops : [];
        const availableDrops = drops
          .filter((drop) => !drop?.endDate || new Date(drop.endDate) > new Date())
          .sort((a, b) => new Date(a.releaseDate || 0) - new Date(b.releaseDate || 0));

        const upcomingDrop = availableDrops.find(drop => drop?.releaseDate && new Date(drop.releaseDate) > new Date()) || null;
        const liveDrop = availableDrops.find(drop => !drop?.releaseDate || new Date(drop.releaseDate) <= new Date()) || null;
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

  useEffect(() => {
    if (heroImages.length === 0) return;
    const timer = setInterval(() => setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length), 5000);
    return () => clearInterval(timer);
  }, [heroImages.length]);

  useEffect(() => {
    if (!nextDrop?.releaseDate) {
      setCountdown({ days: "00", hours: "00", minutes: "00", seconds: "00" });
      return;
    }
    setCountdown(computeCountdown(new Date(nextDrop.releaseDate)));
    const timer = setInterval(() => setCountdown(computeCountdown(new Date(nextDrop.releaseDate))), 1000);
    return () => clearInterval(timer);
  }, [nextDrop]);

  const hasActiveDrop = Boolean(nextDrop);
  const isDropUpcoming = hasActiveDrop && nextDrop.releaseDate && new Date(nextDrop.releaseDate) > new Date();

  const heroSrc = heroImages.length > 0 ? heroImages[currentHeroIndex]?.url : "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop";

  return (
    <div className="bg-background text-on-surface min-h-screen relative w-full overflow-hidden">
      <main>
        {/* 1. HERO SECTION */}
        <section className="relative min-h-[90vh] w-full flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
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
          </div>
          <div className="relative z-10 text-center px-6 max-w-4xl mt-16">
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="font-serif text-5xl md:text-8xl text-white font-bold mb-6 tracking-tighter"
            >
              Elevate Your Style
            </motion.h1>
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
                <Button size="lg" className="w-full sm:w-auto px-10 py-6 text-sm uppercase tracking-widest bg-[#D4AF37] hover:bg-[#B3902A] text-black font-bold">
                  Shop Now
                </Button>
              </Link>
              <Link to="/shopping/product-list?category=all">
                <Button variant="outline" size="lg" className="w-full sm:w-auto px-10 py-6 text-sm uppercase tracking-widest text-[#D4AF37] border-[#D4AF37] hover:bg-[#D4AF37]/10 bg-transparent">
                  View Collections
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* 2. TRUST BADGES BAR */}
        <section className="py-8 bg-surface-container-lowest border-b border-outline/10">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { icon: Truck, title: "Free Delivery Island-Wide" },
                { icon: CornerDownLeft, title: "14-Day Returns" },
                { icon: Lock, title: "Secure Payments" },
                { icon: MessageCircle, title: "WhatsApp Support" }
              ].map((badge, idx) => (
                <div key={idx} className="flex flex-col items-center justify-center text-on-surface hover:text-[#D4AF37] transition-colors">
                  <badge.icon className="w-6 h-6 mb-3" />
                  <span className="font-sans text-[10px] sm:text-xs uppercase tracking-wider font-semibold">{badge.title}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. FEATURED CATEGORIES GRID */}
        <section className="py-24 px-6 md:px-12 bg-background">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="font-serif text-4xl text-on-surface mb-4">Featured Collections</h2>
              <p className="font-sans text-outline text-sm uppercase tracking-widest">Shop by category</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {["Boys", "Girls", "Unisex"].map((cat, index) => {
                const catLogoUrl = categoryLogos[cat]?.url || "https://images.unsplash.com/photo-1550614000-4b95d4ebf076?w=800&auto=format&fit=crop";
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    key={cat}
                  >
                    <Link to={`/shopping/product-list?category=${cat.toLowerCase()}`} className="group block relative h-[450px] overflow-hidden rounded-lg bg-black">
                      <img 
                        src={catLogoUrl} 
                        alt={cat} 
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-50"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 p-8 w-full flex justify-between items-end">
                        <div>
                          <h3 className="font-serif text-3xl text-white mb-2">{cat}</h3>
                          <span className="font-sans text-xs uppercase tracking-widest text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                            Shop Now <ArrowRight className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 4. NEW ARRIVALS SECTION */}
        <section className="py-24 px-6 md:px-12 bg-surface-container-lowest">
          <div className="container mx-auto max-w-7xl">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="font-serif text-4xl text-on-surface mb-2">New Arrivals</h2>
                <p className="font-sans text-outline text-sm uppercase tracking-widest">Latest additions to the ledger</p>
              </div>
              <Link to="/shopping/product-list" className="hidden md:flex font-sans text-xs uppercase tracking-widest text-primary border-b border-primary pb-1 hover:text-[#D4AF37] hover:border-[#D4AF37] transition-all items-center gap-2">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {isHomepageLoading ? (
                [...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse flex flex-col gap-4">
                    <div className="bg-surface-container-high aspect-[3/4] w-full rounded-md"></div>
                    <div className="h-4 bg-surface-container-high w-3/4 rounded"></div>
                    <div className="h-4 bg-surface-container-high w-1/2 rounded"></div>
                  </div>
                ))
              ) : homepageError ? (
                <div className="col-span-full py-12 text-center text-red-400 border border-red-500/20">{homepageError}</div>
              ) : activeProducts.length > 0 ? (
                activeProducts.map((product) => (
                  <div key={product._id} className="group cursor-pointer">
                    <div className="relative bg-surface-container-low aspect-[3/4] mb-4 overflow-hidden rounded-md">
                      <img
                        src={product.images?.[0]?.url || "/LOGO.png"}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm px-2 py-1 rounded">
                        <span className="font-sans text-[9px] tracking-widest text-primary uppercase">New</span>
                      </div>
                      <div className="absolute bottom-0 left-0 w-full p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <Link to={`/shopping/product/${product._id}`}>
                          <Button className="w-full bg-[#D4AF37] hover:bg-[#B3902A] text-black">Add to Cart</Button>
                        </Link>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-sans font-bold text-sm tracking-wide text-on-surface mb-1 truncate">{product.name}</h4>
                      <p className="font-sans text-outline text-sm mb-2">Rs. {product.salePrice > 0 ? product.salePrice?.toLocaleString() : product.basePrice?.toLocaleString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-outline text-center col-span-full py-12">No products found.</p>
              )}
            </div>
            <div className="mt-12 text-center md:hidden">
              <Link to="/shopping/product-list">
                <Button variant="outline" className="w-full border-primary text-primary">View All New Arrivals</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* 5. PROMOTIONAL BANNER */}
        <section className="py-16 bg-[#D4AF37] text-black relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-repeat bg-[length:24px_24px] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)' }} />
          <div className="container mx-auto px-4 text-center relative z-10">
            {isDropUpcoming ? (
              <div className="flex flex-col items-center">
                <span className="font-sans text-sm font-bold uppercase tracking-widest mb-4">Limited Edition Drop</span>
                <h2 className="font-serif text-4xl md:text-6xl mb-8 font-bold">{nextDrop.name}</h2>
                <div className="flex gap-4 md:gap-10 justify-center mb-10">
                  <div className="flex flex-col items-center justify-center bg-black text-[#D4AF37] rounded-lg w-20 h-24 md:w-28 md:h-32 shadow-2xl">
                    <span className="text-4xl md:text-6xl font-serif font-bold">{countdown.days}</span>
                    <span className="text-[10px] md:text-xs uppercase font-bold tracking-widest mt-1 opacity-80">Days</span>
                  </div>
                  <span className="text-4xl md:text-6xl font-serif font-bold mt-4">:</span>
                  <div className="flex flex-col items-center justify-center bg-black text-[#D4AF37] rounded-lg w-20 h-24 md:w-28 md:h-32 shadow-2xl">
                    <span className="text-4xl md:text-6xl font-serif font-bold">{countdown.hours}</span>
                    <span className="text-[10px] md:text-xs uppercase font-bold tracking-widest mt-1 opacity-80">Hours</span>
                  </div>
                  <span className="text-4xl md:text-6xl font-serif font-bold mt-4">:</span>
                  <div className="flex flex-col items-center justify-center bg-black text-[#D4AF37] rounded-lg w-20 h-24 md:w-28 md:h-32 shadow-2xl">
                    <span className="text-4xl md:text-6xl font-serif font-bold">{countdown.minutes}</span>
                    <span className="text-[10px] md:text-xs uppercase font-bold tracking-widest mt-1 opacity-80">Mins</span>
                  </div>
                </div>
                <Button className="bg-black text-[#D4AF37] hover:bg-zinc-900 shadow-xl uppercase tracking-widest px-10 py-6 font-bold text-sm min-w-[200px]">
                  Remind Me
                </Button>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 py-6">
                <Truck className="w-12 h-12" />
                <h2 className="font-serif text-3xl md:text-4xl font-bold tracking-wide">Free delivery on all orders across Sri Lanka <span className="inline-block md:hidden">🚚</span></h2>
              </div>
            )}
          </div>
        </section>

        {/* 6. SOCIAL PROOF SECTION */}
        <section className="py-24 bg-background px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-12">
              <h2 className="font-serif text-4xl text-on-surface mb-2">Follow Us</h2>
              <a href="https://instagram.com/sagaaelite" target="_blank" rel="noopener noreferrer" className="font-sans hover:text-[#D4AF37] transition-colors inline-flex items-center gap-2 tracking-widest uppercase text-sm font-semibold">
                <Instagram className="w-4 h-4" /> @sagaaelite
              </a>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <a key={i} href="https://instagram.com/sagaaelite" target="_blank" rel="noopener noreferrer" className="group block relative aspect-square overflow-hidden bg-surface-container-high rounded-md">
                  <img 
                    src={`https://images.unsplash.com/photo-${1515886657613 + i * 50000}-0f28a41cf984?w=400&q=80&auto=format&fit=crop`}
                    alt="Instagram post"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-90"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                    <Instagram className="text-white w-8 h-8" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* 7. NEWSLETTER SIGNUP */}
        <section className="py-32 bg-surface-container-low border-t border-outline/10 text-center px-6">
          <div className="container mx-auto max-w-2xl">
            <MessageCircle className="w-10 h-10 mx-auto text-[#D4AF37] mb-6" />
            <h2 className="font-serif text-4xl text-on-surface mb-4">Stay in the Loop</h2>
            <p className="font-sans text-outline mb-10 tracking-wide">
              Get exclusive deals and new arrivals straight to your inbox.
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto" onSubmit={(e) => e.preventDefault()}>
              <Input 
                type="email" 
                placeholder="Enter your email address" 
                className="h-14 bg-background border-outline/20 focus-visible:ring-[#D4AF37] text-center sm:text-left"
                required
              />
              <Button type="submit" className="h-14 px-8 bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-widest font-bold">
                Subscribe
              </Button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
