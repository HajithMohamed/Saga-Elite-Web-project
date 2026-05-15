import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, LogOut, Menu, Search, ShoppingBag, User, X, Flame, ChevronRight, ArrowRight, TicketPercent } from "lucide-react";
import axios from "axios";
import { logoutUserAction } from "@/store/auth-slice";
import { fetchUpcomingDrop } from "@/services/landing-api";
import { getRemainingTime } from "@/utils/time";
import NotificationsDropdown from "@/components/common-components/NotificationsDropdown";
import { useAuthDrawer } from "@/components/auth-components/AuthDrawer";
import { API_V1_URL as API_BASE } from "@/lib/api";

const buildCategoryUrl = (path = []) => {
  const params = new URLSearchParams();
  if (path[0]?.slug) params.set("category", path[0].slug);
  if (path[1]?.slug) params.set("subCategory", path[1].slug);
  if (path.length > 2) params.set("categoryPath", path.map((category) => category.slug).join("/"));
  return `/shopping/product-list?${params.toString()}`;
};

const MegaMenuPanel = ({ category, onNavigate = () => {} }) => {
  const subcategories = Array.isArray(category.children) ? category.children : [];
  if (!subcategories.length) return null;

  return (
    <div className="absolute left-1/2 -translate-x-1/2 top-full opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 pt-4 w-screen max-w-[900px]">
      <div className="bg-[#0e0e0e]/95 backdrop-blur-xl border border-[#D4AF37]/20 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] relative overflow-hidden rounded-sm">
        {/* Gold accent top border */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
        
        <div className="p-8">
          {/* Category header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#2a2a2a]">
            <Link
              to={buildCategoryUrl([category])}
              onClick={onNavigate}
              className="font-display text-lg text-[#f2ca50] uppercase tracking-[0.2em] hover:text-[#ffe088] transition-colors"
            >
              Shop All {category.name}
            </Link>
            <ArrowRight className="w-4 h-4 text-[#D4AF37]/50" />
          </div>

          {/* Multi-column subcategory grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {subcategories.map((sub) => (
              <div key={sub._id}>
                <Link
                  to={buildCategoryUrl([category, sub])}
                  onClick={onNavigate}
                  className="block font-mono text-[11px] tracking-[0.2em] uppercase text-[#f2ca50] mb-3 hover:text-[#ffe088] transition-colors font-bold"
                >
                  {sub.name}
                </Link>
                {Array.isArray(sub.children) && sub.children.length > 0 && (
                  <ul className="space-y-2">
                    {sub.children.map((child) => (
                      <li key={child._id}>
                        <Link
                          to={buildCategoryUrl([category, sub, child])}
                          onClick={onNavigate}
                          className="text-[12px] text-[#d0c5af] hover:text-[#e5e2e1] transition-colors block leading-relaxed"
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const CategoryMobileList = ({ categories = [], path = [], onNavigate }) => {
  if (!categories.length) return null;

  return (
    <div className="space-y-1">
      {categories.map((category) => {
        const nextPath = [...path, category];
        const hasChildren = Array.isArray(category.children) && category.children.length > 0;

        return (
          <div key={category._id} className="border-l border-[#2a2a2a] pl-4">
            <Link
              to={buildCategoryUrl(nextPath)}
              onClick={onNavigate}
              className="block py-3 text-[#e5e2e1] hover:text-[#f2ca50] transition-colors font-display text-2xl"
            >
              {category.name}
            </Link>
            {hasChildren ? (
              <div className="ml-3 border-l border-[#2a2a2a]/80 pl-4 pb-2">
                <CategoryMobileList categories={category.children} path={nextPath} onNavigate={onNavigate} />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

const AnnouncementBar = ({ items, nextDrop, countdown }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [items]);

  return (
    <div className="bg-[#131313] text-[#e5e2e1] border-b border-[#2a2a2a] text-center text-[11px] uppercase tracking-[0.2em] py-2 relative overflow-hidden">
      {/* Subtle glow pulse effect behind the bar */}
      <div className="absolute inset-0 bg-[#f2ca50]/5 animate-pulse" />
      
      <div className="relative z-10 flex flex-col items-center justify-center">
        {nextDrop && nextDrop.releaseDate && new Date(nextDrop.releaseDate) > new Date() ? (
          <span className="text-[#f2ca50] mb-1 font-mono text-[10px]">
            <Flame className="inline w-3 h-3 text-[#ffb4ab] mb-0.5" /> DROP DROPS IN {countdown.d}D {countdown.h}H {countdown.m}M
          </span>
        ) : nextDrop && nextDrop.releaseDate ? (
          <span className="text-[#ffb4ab] mb-1 font-mono text-[10px] animate-pulse">
            🔴 LIVE NOW — SHOP BEFORE IT CLOSES
          </span>
        ) : null}
        
        <div className="h-[16px] overflow-hidden w-full max-w-lg mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="text-[#d0c5af]"
            >
              {items[currentIndex]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const AnimatedBadge = ({ count }) => {
  if (!count || count <= 0) return null;
  return (
    <span className="absolute -top-2 -right-2 bg-[#ffb4ab] shadow-[0_0_8px_#ffb4ab] text-[#0e0e0e] text-[9px] font-bold font-mono min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center">
      {count > 99 ? "99+" : count}
    </span>
  );
};

const MotionAside = motion.aside;
const EMPTY_COUNTDOWN = { d: 0, h: "00", m: "00" };

const MainHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { open: openAuthDrawer } = useAuthDrawer();
  const homePath = "/shopping/home";
  
  const isAdminView = location.pathname.startsWith("/admin");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [nextDrop, setNextDrop] = useState(null);
  const [countdown, setCountdown] = useState(EMPTY_COUNTDOWN);
  const [menuCategories, setMenuCategories] = useState([]);
  const userMenuRef = useRef(null);

  const { user } = useSelector((state) => state.auth);
  const { totalQuantity } = useSelector((state) => state.cart.cart || {});
  const { items: wishlistItems } = useSelector((state) => state.cart.wishlist || { items: [] });
  const cartCount = totalQuantity || 0;
  const wishlistCount = wishlistItems?.length || 0;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadNextDrop = async () => {
      try {
        const drop = await fetchUpcomingDrop();
        if (!cancelled) setNextDrop(drop);
      } catch {
        if (!cancelled) setNextDrop(null);
      }
    };
    loadNextDrop();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadCategories = async () => {
      try {
        const response = await axios.get(`${API_BASE}/categories/menu`);
        if (!cancelled) {
          setMenuCategories(response.data?.data || []);
        }
      } catch {
        if (!cancelled) {
          setMenuCategories([]);
        }
      }
    };

    loadCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!nextDrop?.releaseDate) return undefined;
    const tick = () => setCountdown(getRemainingTime(nextDrop.releaseDate));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [nextDrop?.releaseDate]);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUserAction()).unwrap();
      navigate("/");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const navItems = [
    { key: "home", label: "Home", to: "/shopping/home" },
    { key: "drops", label: "Drops", to: "/shopping/drops" },
    { key: "about", label: "About", to: "/about" },
  ];

  const activeMenuCategories = menuCategories;

  if (isAdminView) {
    return (
      <header className="h-[72px] flex justify-between items-center px-8 border-b border-[#2a2a2a] bg-[#0a0a0a]">
        <h2 className="se-label text-[#e5e2e1]">Saga Admin Connect</h2>
        <button onClick={handleLogout} className="text-[#d0c5af] hover:text-[#f2ca50] transition-colors">
          <LogOut className="w-4 h-4" />
        </button>
      </header>
    );
  }

  return (
    <>
      <AnnouncementBar
        nextDrop={nextDrop}
        countdown={countdown}
        items={[
          "🎁 MYSTERY GIFT ON EVERY ORDER OVER LKR 10,000",
          "⚡ LIMITED STOCK AVAILABLE ON NEW DROPS",
          "🚀 ISLANDWIDE EXPRESS DELIVERY",
        ]}
      />

      <header
        role="banner"
        className={`sticky top-0 z-50 w-full transition-all duration-500 ${
          scrolled
            ? "bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-[#4d4635]/50 py-3 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
            : "bg-transparent border-b border-transparent py-5"
        }`}
      >
        <div className="max-w-[1600px] w-full mx-auto px-6 lg:px-12 flex items-center justify-between gap-6">
          
          {/* LEFT: Branding */}
          <Link to={homePath} className="flex items-center gap-4 group">
            <img src="/LOGO.png" alt="Saga Elite" className="h-8 w-8 object-contain opacity-90 group-hover:opacity-100 transition-opacity" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <div className="hidden sm:flex flex-col justify-center">
              <span className="font-display font-medium text-[20px] tracking-[0.12em] text-[#e5e2e1] leading-none">
                SAGA ELITE
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#d0c5af] mt-1 opacity-60">
                Rare Fit Forever
              </span>
            </div>
          </Link>

          {/* CENTER: Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.key}
                to={item.to}
                className="relative group se-label text-[11px] text-[#e5e2e1] overflow-hidden px-1"
              >
                <span className="block transition-all duration-300 group-hover:-translate-y-full">
                  {item.label}
                </span>
                <span className="absolute inset-0 transition-all duration-300 translate-y-full group-hover:translate-y-0 text-[#f2ca50]">
                  {item.label}
                </span>
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[#f2ca50] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 shadow-[0_0_10px_#f2ca50]" />
              </Link>
            ))}

            {/* Dynamic categories with mega-menu */}
            {activeMenuCategories.map((category) => (
              <div key={category._id || category.slug} className="relative group">
                <Link
                  to={buildCategoryUrl([category])}
                  className="relative se-label text-[11px] text-[#e5e2e1] overflow-hidden px-1 block"
                >
                  <span className="block transition-all duration-300 group-hover:-translate-y-full">
                    {category.name}
                  </span>
                  <span className="absolute inset-0 transition-all duration-300 translate-y-full group-hover:translate-y-0 text-[#f2ca50]">
                    {category.name}
                  </span>
                  <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[#f2ca50] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 shadow-[0_0_10px_#f2ca50]" />
                </Link>
                <MegaMenuPanel category={category} />
              </div>
            ))}
          </nav>

          {/* RIGHT: Actions */}
          <div className="flex items-center gap-5 sm:gap-6">
            <button aria-label="Search" onClick={() => setSearchOpen((prev) => !prev)} className="text-[#d0c5af] hover:text-[#f2ca50] hover:scale-110 transition-all duration-300">
              <Search className="w-[18px] h-[18px]" />
            </button>
            <Link to="/shopping/wishlist" className="relative text-[#d0c5af] hover:text-[#f2ca50] hover:scale-110 transition-all duration-300 hidden sm:block">
              <Heart className="w-[18px] h-[18px]" />
              <AnimatedBadge count={wishlistCount} />
            </Link>
            {user && <NotificationsDropdown />}
            {user && (
              <Link to="/shopping/rewards" className="hidden sm:block text-[#d0c5af] hover:text-[#f2ca50] hover:scale-110 transition-all duration-300" aria-label="My rewards">
                <TicketPercent className="w-[18px] h-[18px]" />
              </Link>
            )}
            <Link to="/shopping/cart" className="relative text-[#d0c5af] hover:text-[#f2ca50] hover:scale-110 transition-all duration-300">
              <ShoppingBag className="w-[18px] h-[18px]" />
              <AnimatedBadge count={cartCount} />
            </Link>
            <div className="relative" ref={userMenuRef}>
              <button
                aria-label={user ? 'Account menu' : 'Sign in'}
                onClick={() => user ? setUserMenuOpen((v) => !v) : openAuthDrawer('login')}
                className="text-[#d0c5af] hover:text-[#f2ca50] hover:scale-110 transition-all duration-300"
              >
                {user?.profilePicture ? (
                  <img src={user.profilePicture} alt="avatar" className="w-6 h-6 rounded-full object-cover border border-[#D4AF37]/40" />
                ) : (
                  <User className="w-[18px] h-[18px]" />
                )}
              </button>
              <AnimatePresence>
                {userMenuOpen && user && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-[140%] min-w-[200px] border border-[#2a2a2a] bg-[#131313]/95 backdrop-blur-md shadow-2xl p-2 z-50 overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/[0.02] before:to-transparent before:pointer-events-none"
                  >
                    <div className="relative z-10 font-mono text-[11px] uppercase tracking-wider text-[#d0c5af]">
                      <div className="px-4 py-3 border-b border-[#2a2a2a] mb-1">
                        <p className="text-[9px] text-[#d0c5af]/60 tracking-[0.2em]">Signed in as</p>
                        <p className="text-[11px] text-[#e5e2e1] truncate normal-case mt-0.5">{user?.email || "Member"}</p>
                      </div>
                      <Link className="block px-4 py-3 hover:bg-[#1f1f1f] hover:text-[#f2ca50] transition-colors" to="/shopping/account" onClick={() => setUserMenuOpen(false)}>My Account</Link>
                      <Link className="block px-4 py-3 hover:bg-[#1f1f1f] hover:text-[#f2ca50] transition-colors" to="/shopping/orders" onClick={() => setUserMenuOpen(false)}>My Fits</Link>
                      <Link className="block px-4 py-3 hover:bg-[#1f1f1f] hover:text-[#f2ca50] transition-colors" to="/shopping/rewards" onClick={() => setUserMenuOpen(false)}>My Rewards</Link>
                      <Link className="block px-4 py-3 hover:bg-[#1f1f1f] hover:text-[#f2ca50] transition-colors" to="/account/my-reviews" onClick={() => setUserMenuOpen(false)}>My Reviews</Link>
                      <Link className="block px-4 py-3 hover:bg-[#1f1f1f] hover:text-[#f2ca50] transition-colors md:hidden" to="/shopping/wishlist" onClick={() => setUserMenuOpen(false)}>Wishlist</Link>
                      <Link className="block px-4 py-3 hover:bg-[#1f1f1f] hover:text-[#f2ca50] transition-colors" to="/shopping/find-payment" onClick={() => setUserMenuOpen(false)}>Find Payment</Link>
                      <div className="h-[1px] bg-[#2a2a2a] my-1" />
                      <button className="w-full text-left px-4 py-3 hover:bg-[#1f1f1f] text-[#ffb4ab] transition-colors" onClick={handleLogout}>Log Out</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              className="lg:hidden p-1 text-[#e5e2e1]"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Search Bar Dropdown */}
        <AnimatePresence>
          {searchOpen ? (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="absolute top-full left-0 w-full border-b border-[#2a2a2a] bg-[#131313]/95 backdrop-blur-md overflow-hidden">
              <div className="max-w-[800px] mx-auto p-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#d0c5af]" />
                  <input
                    autoFocus
                    type="search"
                    placeholder="SEARCH CATALOG OR DROPS..."
                    className="w-full bg-[#1f1f1f] text-[#e5e2e1] placeholder:text-[#d0c5af]/50 pl-12 pr-6 py-4 outline-none font-mono text-[12px] tracking-widest border border-[#2a2a2a] focus:border-[#f2ca50] transition-colors shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-[#d0c5af]/40">ESC</div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen ? (
          <MotionAside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
            className="fixed inset-0 z-[60] bg-[#0a0a0a] flex flex-col pt-20 px-8 pb-12 lg:hidden"
          >
            <button onClick={() => setMobileOpen(false)} aria-label="Close drawer" className="absolute top-8 right-8 text-[#d0c5af] hover:text-[#e5e2e1]"><X className="w-8 h-8" /></button>
            <div className="flex flex-col gap-6 mt-12 flex-grow">
              {navItems.map((item, i) => (
                <motion.div
                  key={item.key}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                >
                  <Link
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className="font-display text-4xl block text-[#e5e2e1] hover:text-[#d0c5af]"
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}

              {/* Dynamic categories inline */}
              {activeMenuCategories.map((cat, i) => (
                <motion.div
                  key={cat._id}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.25 + i * 0.05 }}
                >
                  <Link
                    to={buildCategoryUrl([cat])}
                    onClick={() => setMobileOpen(false)}
                    className="font-display text-4xl block text-[#e5e2e1] hover:text-[#f2ca50]"
                  >
                    {cat.name}
                  </Link>
                  {Array.isArray(cat.children) && cat.children.length > 0 && (
                    <div className="ml-4 mt-2 space-y-1 border-l border-[#2a2a2a] pl-4">
                      {cat.children.map((sub) => (
                        <Link
                          key={sub._id}
                          to={buildCategoryUrl([cat, sub])}
                          onClick={() => setMobileOpen(false)}
                          className="block text-lg text-[#d0c5af] hover:text-[#f2ca50] transition-colors py-1"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
            
            <div className="mt-8 pt-8 border-t border-[#2a2a2a]">
               <p className="font-mono text-xs uppercase tracking-widest text-[#4d4635] mb-4">Support & Service</p>
               <div className="flex flex-col gap-3 font-mono text-[11px] uppercase tracking-wider text-[#d0c5af]">
                  <Link to="/about">Brand Story</Link>
                  <Link to="/contact">Reach Out</Link>
                  <Link to="/faq">Track Order</Link>
               </div>
            </div>
          </MotionAside>
        ) : null}
      </AnimatePresence>
    </>
  );
};

export default MainHeader;
