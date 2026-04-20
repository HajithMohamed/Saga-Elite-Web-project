import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { LogOut, User as UserIcon, ArrowRight, Gift, ShieldCheck, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { logoutUserAction } from "../../store/auth-slice";
import { useToast } from "../../hooks/use-toast";
import axios from "axios";

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
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { toast } = useToast();

  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const cartInfo = useSelector((state) => state.cart?.cart);
  const totalQuantity = cartInfo?.totalQuantity || 0;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // States handling DB images
  const [heroImages, setHeroImages] = useState([]);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  
  const [logoImage, setLogoImage] = useState(null);
  const [categoryLogos, setCategoryLogos] = useState({ Boys: null, Girls: null, Unisex: null });
  const [adImage, setAdImage] = useState(null);
  const [activeProducts, setActiveProducts] = useState([]);
  const [archiveProducts, setArchiveProducts] = useState([]);
  const [nextDrop, setNextDrop] = useState(null);
  const [countdown, setCountdown] = useState({
    days: "02", hours: "14", minutes: "56", seconds: "00",
  });
  const [isHomepageLoading, setIsHomepageLoading] = useState(true);
  const [homepageError, setHomepageError] = useState(null);

  // Close dropdown logic
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

        if (dropsRes?.data?.drops) {
          const drops = dropsRes.data.drops;
          const upcomingDrops = drops
            .filter((drop) => new Date(drop.releaseDate) > new Date())
            .sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate));
          setNextDrop(upcomingDrops[0] || drops[0] || null);
        }
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
    const timer = setInterval(() => {
      if (nextDrop?.releaseDate) {
        setCountdown(computeCountdown(new Date(nextDrop.releaseDate)));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [nextDrop]);

  const heroSrc = heroImages.length > 0 ? heroImages[currentHeroIndex]?.url : "/LOGO.png";
  const logoSrc = logoImage?.url;
  const adSrc = adImage?.url || heroSrc;

  // Logout Handlers
  const handleLogout = () => {
    dispatch(logoutUserAction())
      .then((res) => {
        if (res?.payload?.success) {
          toast({ title: "Logged out successfully" });
          navigate("/auth/login");
        } else {
          toast({ title: "Logout failed", variant: "destructive" });
        }
      })
      .catch(() => {
        toast({ title: "Error occurred", variant: "destructive" });
      });
  };

  const handleProfileClick = () => {
    if (!isAuthenticated) {
      navigate("/auth/login");
    } else {
      setDropdownOpen(!dropdownOpen);
    }
  };

  const getProductLabel = (product) => {
    if (product.isLimited) return "Limited 1 of 50";
    return "Limited Release";
  };

  const timerLabel = nextDrop?.name || "Collection 004";

  return (
    <div className="bg-background text-on-surface min-h-screen relative">
      <div className="grain"></div>

      <nav className="fixed top-0 w-full z-50 bg-[#131313]/80 backdrop-blur-xl border-b border-[#99907c]/10 px-8 md:px-12 py-6">
        <div className="flex items-center justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-2xl font-serif font-bold tracking-tighter text-[#D4AF37] cursor-pointer"
            onClick={() => navigate("/")}
          >
            SAGA ELITE
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="hidden md:flex items-center gap-10 text-[#e5e2e1]/80"
          >
            <Link className="font-sans tracking-[0.1em] uppercase text-xs text-[#F2CA50] transition-colors duration-500" to="#">Current Drop</Link>
            <Link className="font-sans tracking-[0.1em] uppercase text-xs text-[#e5e2e1]/70 hover:text-[#F2CA50] transition-colors duration-500" to="#">Archive</Link>
            <Link className="font-sans tracking-[0.1em] uppercase text-xs text-[#e5e2e1]/70 hover:text-[#F2CA50] transition-colors duration-500" to="#">The Story</Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-6 text-[#D4AF37]"
          >
            <button className="hover:opacity-80 transition-opacity" onClick={() => navigate("/shopping/wishlist")}>
              <span className="material-symbols-outlined">favorite</span>
            </button>
            <button className="hover:opacity-80 transition-opacity" onClick={() => navigate("/shopping/notifications")}>
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="hover:opacity-80 transition-opacity" onClick={handleProfileClick}>
              <span className="material-symbols-outlined">person</span>
            </button>
            <button className="hover:opacity-80 transition-opacity" onClick={() => navigate("/shopping/cart")}>
              <span className="material-symbols-outlined">shopping_bag</span>
            </button>
          </motion.div>
        </div>

        {dropdownOpen && isAuthenticated && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-8 top-20 w-56 rounded-xl border border-[#D4AF37]/20 bg-[#141414] shadow-2xl"
          >
            <div className="px-4 py-3 text-xs text-[#d0c5af]">{user?.email}</div>
            <button onClick={() => navigate("/shopping/account")} className="w-full text-left px-4 py-3 hover:bg-[#1f1f1f]">My Account</button>
            <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-red-400 hover:bg-[#1f1f1f]">Logout</button>
          </motion.div>
        )}
      </nav>

      <main>
        {/* Animated Hero Carousel Section */}
        <section className="relative h-screen w-full flex items-center justify-center overflow-hidden pt-24">
          <div className="absolute inset-0 z-0">
            <AnimatePresence mode="popLayout">
              <motion.img
                key={currentHeroIndex} // Ensures re-triggering of animation when image changes
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
              The Sovereign Ledger
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="font-serif text-6xl md:text-9xl text-primary font-bold mb-8 tracking-tighter"
            >
              Rare Fit Forever
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex justify-center"
            >
              <Link to="/shopping/product-list" className="bg-primary-container text-on-primary-container px-12 py-5 font-sans uppercase tracking-widest text-sm font-bold hover:bg-primary transition-all duration-500 shadow-xl shadow-primary/10">
                Shop the Drop
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Scroll entry Animations below */}
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
              <h3 className="font-serif text-4xl text-on-surface mb-2">The Current Drop</h3>
              <p className="font-sans text-outline tracking-wider text-sm">Strictly limited archival releases.</p>
            </div>
            <Link className="font-sans text-xs uppercase tracking-widest text-primary border-b border-primary/30 pb-1 hover:border-primary transition-all" to="/shopping/product-list">
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
            ) : activeProducts.length > 0 ? (
              activeProducts.map((product) => (
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
                  <h4 className="font-sans text-xs uppercase tracking-widest text-on-surface mb-1">{product.name}</h4>
                  <p className="font-serif text-outline text-sm">${product.basePrice}</p>
                </div>
              ))
            ) : (
              <p className="text-outline border border-outline/10 p-12 text-center col-span-full">No active drop products currently available.</p>
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

        <footer className="w-full py-20 px-8 md:px-12 bg-[#0E0E0E] flex flex-col items-center gap-12 text-center">
          <div className="text-[#D4AF37] font-serif text-xl tracking-widest uppercase">SAGA ELITE</div>
          <div className="flex flex-wrap justify-center gap-12">
            <Link className="font-sans tracking-widest text-xs uppercase text-[#99907C] hover:text-[#D4AF37] transition-all" to="#">Membership</Link>
            <Link className="font-sans tracking-widest text-xs uppercase text-[#99907C] hover:text-[#D4AF37] transition-all" to="#">Privacy</Link>
            <Link className="font-sans tracking-widest text-xs uppercase text-[#99907C] hover:text-[#D4AF37] transition-all" to="#">Terms</Link>
            <Link className="font-sans tracking-widest text-xs uppercase text-[#99907C] hover:text-[#D4AF37] transition-all" to="#">Contact</Link>
          </div>
          <div className="font-sans tracking-widest text-[10px] uppercase text-[#99907C]/50 mt-8">
            © 2024 SAGA ELITE. ARCHITECTURAL BRUTALISM IN TEXTILE.
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Home;