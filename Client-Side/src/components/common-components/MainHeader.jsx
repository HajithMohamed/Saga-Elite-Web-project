import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Heart, LogOut, Menu, Package, Settings, Shield, ShoppingBag, User, X, ChevronRight } from "lucide-react";

import { logoutUserAction } from "@/store/auth-slice";
import { getAllDrops } from "@/store/admin/drop-slice";
import { toast } from "@/hooks/use-toast";
import NotificationsDropdown from "@/components/common-components/NotificationsDropdown";
import { CONTACT_INFO } from "@/config";
import { Wordmark } from "@/components/ui/editorial";

// ── Announcement Bar ────────────────────────────────────────────
const AnnouncementBar = ({ messages }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [messages]);

  if (!messages || messages.length === 0) return null;

  return (
    <div className="bg-[#6B1A2A] text-white overflow-hidden h-8 flex items-center justify-center relative z-50">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="se-label text-[10px] tracking-[0.2em] text-center w-full absolute"
        >
          {messages[index]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// ── count helper ────────────────────────────────────────────────
const AnimatedBadge = ({ count }) => {
  const reduced = useReducedMotion();
  if (!count || count <= 0) return null;
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={count}
        initial={reduced ? { opacity: 0 } : { scale: 0.6, opacity: 0 }}
        animate={reduced ? { opacity: 1 } : { scale: [0.6, 1.18, 1], opacity: 1 }}
        exit={reduced ? { opacity: 0 } : { scale: 0.6, opacity: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 inline-flex items-center justify-center rounded-full bg-[#f2ca50] text-[#1b1c1c] se-mono text-[9px] font-semibold"
      >
        {count > 99 ? "99+" : count}
      </motion.span>
    </AnimatePresence>
  );
};

// ── Navigation Categories ─────────────────────────────────────────
const CATEGORIES = [
  {
    id: "women",
    label: "Women",
    subItems: [
      { label: "New Arrivals", to: "/shopping/product-list?category=women&sort=newest" },
      { label: "Dresses", to: "/shopping/product-list?category=women-dresses" },
      { label: "Tops", to: "/shopping/product-list?category=women-tops" },
      { label: "Bottoms", to: "/shopping/product-list?category=women-bottoms" },
      { label: "Outerwear", to: "/shopping/product-list?category=women-outerwear" }
    ]
  },
  {
    id: "men",
    label: "Men",
    subItems: [
      { label: "New Arrivals", to: "/shopping/product-list?category=men&sort=newest" },
      { label: "T-Shirts", to: "/shopping/product-list?category=men-tshirts" },
      { label: "Shirts", to: "/shopping/product-list?category=men-shirts" },
      { label: "Bottoms", to: "/shopping/product-list?category=men-bottoms" },
      { label: "Outerwear", to: "/shopping/product-list?category=men-outerwear" }
    ]
  },
  {
    id: "accessories",
    label: "Accessories",
    subItems: [
      { label: "Bags", to: "/shopping/product-list?category=bags" },
      { label: "Jewelry", to: "/shopping/product-list?category=jewelry" },
      { label: "Sunglasses", to: "/shopping/product-list?category=sunglasses" }
    ]
  },
  { id: "drops", label: "Drops", to: "/shopping/product-list?category=drops" },
];

const MainHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const reduced = useReducedMotion();

  const isAdminView = location.pathname.startsWith("/admin");
  const homePath = location.pathname.startsWith("/shopping") ? "/shopping/home" : "/";

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredNav, setHoveredNav] = useState(null);
  const userMenuRef = useRef(null);
  const navRef = useRef(null);

  const { user } = useSelector((state) => state.auth);
  const { totalQuantity } = useSelector((state) => state.cart.cart || {});
  const { items: wishlistItems } = useSelector((state) => state.cart.wishlist || { items: [] });
  const { drops } = useSelector((state) => state.drop);

  const cartCount = totalQuantity || 0;
  const wishlistCount = wishlistItems?.length || 0;

  const [nextDrop, setNextDrop] = useState(null);

  // Scroll state
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Outside-click for user menu & mega menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lock body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    try {
      await dispatch(logoutUserAction()).unwrap();
      toast({ title: "Signed out", description: "See you next time.", variant: "success" });
      navigate("/auth/login");
    } catch (err) {
      toast({ title: "Logout failed", description: err?.message || "Please try again.", variant: "destructive" });
    }
  };

  const marqueeItems = [
    "Free island-wide delivery over LKR 15,000",
    "Members enter first",
    "Crafted in Sri Lanka",
    "Limited editions, every chapter",
  ];

  const headerReveal = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.3 } }
    : { initial: { opacity: 0, y: -8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } };

  const isAdminLike = ["admin", "super_admin", "superadmin"].includes(String(user?.role || "").toLowerCase());

  if (isAdminView) {
    return (
      <motion.header {...headerReveal} className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-white/10 bg-[#0a0a0a] px-6 lg:px-8">
        <div className="flex flex-1 items-center gap-6">
          <button type="button" className="lg:hidden text-[#f2ca50]" aria-label="Menu" onClick={() => setDrawerOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex flex-col">
            <span className="se-label text-[10px] tracking-[0.32em] text-[#f2ca50]">Saga Elite</span>
            <span className="se-headline text-base text-white">Atelier · Admin</span>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <NotificationsDropdown />
          <div className="hidden md:flex flex-col items-end">
            <span className="se-body text-sm text-white">{user?.userName || "Admin"}</span>
            <span className="se-label text-[9px] tracking-[0.3em] text-[#f2ca50] mt-0.5">{user?.role || "admin"}</span>
          </div>
          <button type="button" onClick={handleLogout} className="flex h-10 w-10 items-center justify-center border border-[#93000a]/50 text-[#ffb4ab] hover:bg-[#93000a]/15 transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </motion.header>
    );
  }

  return (
    <>
      <div className="fixed top-0 z-50 w-full" onMouseLeave={() => setHoveredNav(null)}>
        <AnnouncementBar messages={marqueeItems} />
        <motion.header
          {...headerReveal}
          className={`w-full transition-all duration-300 ${
            scrolled ? "bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-[#4d4635]" : "bg-[#0a0a0a] border-b border-transparent"
          }`}
        >
          <div className="px-4 md:px-8 lg:px-12 h-16 md:h-20 flex items-center justify-between relative">
            {/* Left ── logo + drawer toggle */}
            <div className="flex items-center gap-4 flex-shrink-0 md:w-64">
              <button className="md:hidden text-white" onClick={() => setDrawerOpen(true)}>
                <Menu size={24} />
              </button>
              <Link to={homePath} className="hidden md:flex items-center gap-3" aria-label="Saga Elite home">
                <Wordmark size={scrolled ? "sm" : "md"} tagline={!scrolled} />
              </Link>
            </div>

            {/* Center ── desktop nav with Mega Menu */}
            <nav className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center justify-center gap-8 h-full" ref={navRef}>
              {CATEGORIES.map((item) => (
                <div key={item.id} className="relative h-full flex items-center" onMouseEnter={() => setHoveredNav(item.id)}>
                  {item.to ? (
                    <Link to={item.to} className={`se-label text-[11px] tracking-[0.2em] transition-colors ${hoveredNav === item.id ? "text-[#f2ca50]" : "text-[#d0c5af] hover:text-[#e5e2e1]"}`}>
                      {item.label}
                    </Link>
                  ) : (
                    <span className={`cursor-pointer se-label text-[11px] tracking-[0.2em] transition-colors ${hoveredNav === item.id ? "text-[#f2ca50]" : "text-[#d0c5af] hover:text-[#e5e2e1]"}`}>
                      {item.label}
                    </span>
                  )}
                  {hoveredNav === item.id && (
                    <motion.span layoutId="nav-underline" className="absolute bottom-4 left-0 right-0 h-px bg-[#f2ca50]" transition={{ type: "spring", stiffness: 380, damping: 30 }} />
                  )}
                </div>
              ))}
            </nav>

            {/* Mobile centered wordmark */}
            <Link to={homePath} className="md:hidden flex items-center justify-self-center absolute left-1/2 -translate-x-1/2">
              <Wordmark size="sm" />
            </Link>

            {/* Right ── utility */}
            <div className="flex items-center justify-end gap-4 md:gap-5 text-[#d0c5af] flex-shrink-0 md:w-64">
              <div className="hidden md:block">
                <NotificationsDropdown />
              </div>
              <Link to="/shopping/wishlist" className="relative hidden md:inline-flex hover:text-[#e5e2e1] transition-colors">
                <Heart size={20} strokeWidth={1.5} />
                <AnimatedBadge count={wishlistCount} />
              </Link>
              <Link to="/shopping/cart" className="relative inline-flex hover:text-[#e5e2e1] transition-colors">
                <ShoppingBag size={20} strokeWidth={1.5} />
                <AnimatedBadge count={cartCount} />
              </Link>
              {!user ? (
                <Link to="/auth/login" className="inline-flex se-label text-[10px] tracking-[0.26em] text-[#e5e2e1] hover:text-[#f2ca50] transition-colors">
                  Sign in
                </Link>
              ) : (
                <div className="relative hidden md:block" ref={userMenuRef}>
                  <button type="button" onClick={() => setUserMenuOpen((v) => !v)} className="hover:text-[#e5e2e1] transition-colors">
                    <User size={20} strokeWidth={1.5} />
                  </button>
                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-3 w-60 border border-[#4d4635] bg-[#0b0b0b] shadow-xl"
                      >
                        <div className="border-b border-[#4d4635]/60 px-4 py-3">
                          <div className="se-label text-[9px] tracking-[0.28em] text-[#99907c]">Signed in</div>
                          <div className="se-body text-sm text-[#e5e2e1] mt-1 truncate">{user.userName || user.email || "Member"}</div>
                        </div>
                        {isAdminLike && (
                          <Link to="/admin/dashboard" className="flex items-center gap-3 px-4 py-2.5 se-body text-sm text-[#d0c5af] hover:bg-white/5 hover:text-[#f2ca50]" onClick={() => setUserMenuOpen(false)}>
                            <Shield className="h-4 w-4" /> Admin panel
                          </Link>
                        )}
                        <Link to="/shopping/account" className="flex items-center gap-3 px-4 py-2.5 se-body text-sm text-[#d0c5af] hover:bg-white/5 hover:text-[#f2ca50]" onClick={() => setUserMenuOpen(false)}>
                          <Settings className="h-4 w-4" /> My account
                        </Link>
                        <Link to="/shopping/orders" className="flex items-center gap-3 px-4 py-2.5 se-body text-sm text-[#d0c5af] hover:bg-white/5 hover:text-[#f2ca50]" onClick={() => setUserMenuOpen(false)}>
                          <Package className="h-4 w-4" /> Orders
                        </Link>
                        <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-2.5 se-body text-sm text-[#d0c5af] hover:bg-white/5 hover:text-[#ffb4ab] border-t border-[#4d4635]/60">
                          <LogOut className="h-4 w-4" /> Sign out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </motion.header>

        {/* Mega Menu Dropdown */}
        <AnimatePresence>
          {hoveredNav && CATEGORIES.find(c => c.id === hoveredNav)?.subItems && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="absolute left-0 w-full bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-[#4d4635] shadow-2xl overflow-hidden"
              onMouseEnter={() => setHoveredNav(hoveredNav)}
              onMouseLeave={() => setHoveredNav(null)}
            >
              <div className="max-w-6xl mx-auto px-8 py-10 grid grid-cols-4 gap-8">
                <div className="col-span-1">
                  <h3 className="se-serif text-2xl text-[#f2ca50] mb-4">{CATEGORIES.find(c => c.id === hoveredNav)?.label}</h3>
                  <p className="se-body text-sm text-[#d0c5af] mb-6">Discover the latest in {CATEGORIES.find(c => c.id === hoveredNav)?.label?.toLowerCase()} collection, meticulously crafted for modern elegance.</p>
                  <Link to={`/shopping/product-list?category=${hoveredNav}`} className="se-label text-[10px] tracking-[0.2em] text-[#e5e2e1] border-b border-[#f2ca50] pb-1 hover:text-[#f2ca50] transition-colors" onClick={() => setHoveredNav(null)}>
                    Shop All {CATEGORIES.find(c => c.id === hoveredNav)?.label}
                  </Link>
                </div>
                <div className="col-span-2 flex gap-12 pl-12 border-l border-[#4d4635]/50">
                  <div className="flex flex-col gap-4">
                    <span className="se-label text-[10px] tracking-[0.2em] text-[#574500]">CATEGORIES</span>
                    {CATEGORIES.find(c => c.id === hoveredNav)?.subItems?.map(sub => (
                      <Link key={sub.label} to={sub.to} className="se-body text-base text-[#d0c5af] hover:text-[#e5e2e1] transition-colors" onClick={() => setHoveredNav(null)}>
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="col-span-1 bg-[#131313] aspect-[4/5] flex items-center justify-center border border-[#4d4635]/30 group cursor-pointer overflow-hidden">
                  <img src={`https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop`} alt="Featured" className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700" />
                  <div className="absolute flex flex-col items-center">
                    <span className="se-label text-[10px] tracking-[0.2em] text-white">FEATURED</span>
                    <span className="se-serif text-xl text-white mt-2">New Arrivals</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 bottom-0 w-[85vw] max-w-sm bg-[#0a0a0a] z-50 border-r border-[#4d4635] flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-[#4d4635]/50">
                <Wordmark size="sm" />
                <button onClick={() => setDrawerOpen(false)} className="text-[#d0c5af]">
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                {CATEGORIES.map(cat => (
                  <div key={cat.id} className="border-b border-[#4d4635]/30 pb-4">
                    {cat.to ? (
                      <Link to={cat.to} className="se-serif text-2xl text-[#e5e2e1]" onClick={() => setDrawerOpen(false)}>
                        {cat.label}
                      </Link>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <span className="se-serif text-2xl text-[#e5e2e1]">{cat.label}</span>
                        <div className="flex flex-col gap-3 pl-4 border-l border-[#4d4635]/50">
                          {cat.subItems?.map(sub => (
                            <Link key={sub.label} to={sub.to} className="se-body text-base text-[#d0c5af] flex items-center gap-2" onClick={() => setDrawerOpen(false)}>
                              <ChevronRight size={14} className="text-[#574500]" /> {sub.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="p-6 border-t border-[#4d4635]/50 flex flex-col gap-4">
                {user ? (
                  <>
                    <Link to="/shopping/account" className="flex items-center gap-3 text-[#d0c5af] se-body" onClick={() => setDrawerOpen(false)}>
                      <Settings size={18} /> My Account
                    </Link>
                    <button onClick={handleLogout} className="flex items-center gap-3 text-[#ffb4ab] se-body text-left">
                      <LogOut size={18} /> Sign Out
                    </button>
                  </>
                ) : (
                  <Link to="/auth/login" className="flex items-center gap-3 text-[#f2ca50] se-body" onClick={() => setDrawerOpen(false)}>
                    <User size={18} /> Sign In / Register
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MainHeader;
