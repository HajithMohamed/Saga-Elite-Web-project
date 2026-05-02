import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShoppingCart,
  User,
  Menu,
  LogOut,
  Settings,
  X,
  Heart,
  Shield,
  Package,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { logoutUserAction } from "@/store/auth-slice";
import { getAllDrops } from "@/store/admin/drop-slice";
import { toast } from "@/hooks/use-toast";
import NotificationsDropdown from "@/components/common-components/NotificationsDropdown";
import { CONTACT_INFO } from "@/config";

const computeCountdown = (targetDate) => {
  if (!targetDate) {
    return {
      days: "00",
      hours: "00",
      minutes: "00",
      seconds: "00",
    };
  }
  const diff = targetDate - new Date();
  if (diff <= 0) {
    return {
      days: "00",
      hours: "00",
      minutes: "00",
      seconds: "00",
    };
  }
  return {
    days: String(Math.floor(diff / (1000 * 60 * 60 * 24))).padStart(2, "0"),
    hours: String(Math.floor((diff / (1000 * 60 * 60)) % 24)).padStart(2, "0"),
    minutes: String(Math.floor((diff / 1000 / 60) % 60)).padStart(2, "0"),
    seconds: String(Math.floor((diff / 1000) % 60)).padStart(2, "0"),
  };
};

const InstagramGlyph = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
    />
  </svg>
);

const MainHeader = () => {
  const location = useLocation();
  const isAdminView = location.pathname.startsWith("/admin");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredNav, setHoveredNav] = useState(null);
  const userMenuRef = useRef(null);

  const { user } = useSelector((state) => state.auth);
  const { totalQuantity } = useSelector((state) => state.cart.cart || {});
  const { items: wishlistItems } = useSelector(
    (state) => state.cart.wishlist || { items: [] }
  );
  const { drops } = useSelector((state) => state.drop);

  const cartCount = totalQuantity || 0;
  const wishlistCount = wishlistItems?.length || 0;

  const [nextDrop, setNextDrop] = useState(null);
  const [countdown, setCountdown] = useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });

  const homePath = location.pathname.startsWith("/shopping")
    ? "/shopping/home"
    : "/";

  useEffect(() => {
    if (!isAdminView && drops.length === 0) {
      dispatch(getAllDrops());
    }
  }, [dispatch, isAdminView, drops.length]);

  useEffect(() => {
    if (!isAdminView && drops.length > 0) {
      const upcoming = [...drops]
        .filter((d) => new Date(d.releaseDate) > new Date())
        .sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate));
      setNextDrop(upcoming[0] || null);
    }
  }, [drops, isAdminView]);

  useEffect(() => {
    if (!nextDrop?.releaseDate) return;
    const tick = () =>
      setCountdown(computeCountdown(new Date(nextDrop.releaseDate)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [nextDrop]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
    if (menuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    try {
      await dispatch(logoutUserAction()).unwrap();
      toast({
        title: "Signed out",
        description: "See you next time.",
        variant: "success",
      });
      navigate("/auth/login");
    } catch (err) {
      toast({
        title: "Logout failed",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const dropMarqueeChunk = nextDrop
    ? `⚡ ${String(nextDrop.name || "DROP").toUpperCase()} DROPS IN ${countdown.days}d ${countdown.hours}h ${countdown.minutes}m · `
    : "";

  const fallbackMarquee =
    "FREE DELIVERY ISLAND-WIDE · NEW ARRIVALS EVERY WEEK · ";

  const marqueeBody = nextDrop ? dropMarqueeChunk.repeat(8) : fallbackMarquee.repeat(6);

  const navActiveId = (() => {
    const p = location.pathname;
    const cat = new URLSearchParams(location.search).get("category") || "";
    if (p === "/" || p === "/shopping/home") return "home";
    if (p.startsWith("/shopping/product-list") && cat.toLowerCase() === "drops")
      return "drops";
    if (p.startsWith("/shopping/product-list")) return "products";
    if (p === "/about") return "about";
    if (p === "/contact") return "contact";
    return null;
  })();

  const desktopNav = [
    { id: "home", to: homePath, label: "Home" },
    { id: "products", to: "/shopping/product-list", label: "Products" },
    {
      id: "drops",
      to: "/shopping/product-list?category=drops",
      label: "Drops",
    },
    { id: "about", to: "/about", label: "About" },
    { id: "contact", to: "/contact", label: "Contact" },
  ];

  const underlineNavId = hoveredNav || navActiveId;

  if (isAdminView) {
    return (
      <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-gray-800 bg-[#0a0a0a] px-8">
        <div className="flex flex-1 items-center gap-6">
          <div className="lg:hidden text-[#D4AF37]">
            <Menu className="h-6 w-6 cursor-pointer" />
          </div>
        </div>
        <div className="absolute left-1/2 flex -translate-x-1/2 flex-col items-center">
          <h1 className="font-serif text-xl font-extrabold tracking-[0.2em] text-white">
            SE <span className="text-[#D4AF37]">ADMIN</span>
          </h1>
          <p className="mt-1 text-[10px] tracking-[0.3em] text-[#D4AF37]/70">
            BACK OFFICE PANEL
          </p>
        </div>
        <div className="flex items-center gap-6">
          <NotificationsDropdown />
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold text-white">
                {user?.userName || "Admin"}
              </span>
              <span className="mt-1 rounded-full bg-[#D4AF37]/10 px-2 py-0.5 text-[10px] uppercase text-[#D4AF37]">
                Admin
              </span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-red-900/50 bg-red-900/20 text-red-500"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <div className="sticky top-0 z-50 w-full">
        <div className="h-8 w-full overflow-hidden bg-black text-[11px] font-bold uppercase tracking-wider text-[#D4AF37]">
          <div className="header-marquee-track flex w-max whitespace-nowrap leading-8">
            <span className="px-6">{marqueeBody}</span>
            <span className="px-6">{marqueeBody}</span>
          </div>
        </div>

        <header
          className={`w-full transition-all duration-300 ${
            scrolled
              ? "border-b border-[#D4AF37]/20 bg-white/95 text-gray-900 backdrop-blur-md dark:bg-black/95 dark:text-white"
              : "border-b border-transparent bg-transparent text-gray-900 dark:text-white"
          }`}
        >
        <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
          <div className="flex items-center md:hidden">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
              className="text-[#D4AF37]"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>

          <Link to={homePath} className="flex items-center gap-3">
            <img
              src="/LOGO.png"
              alt="Saga Elite"
              className="h-10 w-10 rounded-md object-cover"
            />
            <div className="hidden flex-col md:flex">
              <span className="font-serif text-lg font-bold uppercase tracking-wide text-[#D4AF37]">
                Saga Elite
              </span>
              <span className="text-[9px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                Rare Fit Forever
              </span>
            </div>
          </Link>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 md:flex md:items-center md:gap-8">
            {desktopNav.map((item) => (
              <Link
                key={item.id}
                to={item.to}
                onMouseEnter={() => setHoveredNav(item.id)}
                onMouseLeave={() => setHoveredNav(null)}
                className={`relative py-2 text-[11px] uppercase tracking-[0.2em] transition-colors ${
                  navActiveId === item.id
                    ? "text-[#D4AF37]"
                    : "text-current hover:text-[#D4AF37]"
                }`}
              >
                {item.label}
                {underlineNavId === item.id ? (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#D4AF37]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                ) : null}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4 md:gap-6">
            <div className="hidden md:block">
              <NotificationsDropdown />
            </div>

            <a
              href={CONTACT_INFO.socials.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden text-current transition-colors hover:text-[#D4AF37] md:inline-flex"
              aria-label="Instagram"
            >
              <InstagramGlyph className="h-5 w-5" />
            </a>

            <div className="hidden md:block">
              <Link to="/shopping/wishlist" className="relative inline-flex">
                <Heart className="h-6 w-6" />
                {wishlistCount > 0 ? (
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#D4AF37] text-[10px] font-bold text-black">
                    {wishlistCount}
                  </span>
                ) : null}
              </Link>
            </div>

            <Link to="/shopping/cart" className="relative inline-flex">
              <ShoppingCart className="h-6 w-6" />
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#D4AF37] text-[10px] font-bold text-black">
                {cartCount}
              </span>
            </Link>

            <Link
              to="/shopping/account"
              className="inline-flex md:hidden"
              aria-label="Account"
            >
              <User className="h-6 w-6" />
            </Link>

            <div className="relative hidden md:block" ref={userMenuRef}>
              <button
                type="button"
                aria-label="Account menu"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <User className="h-6 w-6" />
              </button>
              {userMenuOpen ? (
                <div className="absolute right-0 mt-3 w-52 rounded border border-[#D4AF37]/20 bg-[#0a0a0a] shadow-xl dark:bg-[#0a0a0a]">
                  {user?.role === "admin" ? (
                    <Link
                      to="/admin/dashboard"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-[#D4AF37]"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Shield className="h-4 w-4" />
                      Admin Panel
                    </Link>
                  ) : null}
                  <Link
                    to="/shopping/account"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-[#D4AF37]"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4" />
                    My Account
                  </Link>
                  <Link
                    to="/shopping/orders"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-[#D4AF37]"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Package className="h-4 w-4" />
                    Order History
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-red-400"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
        </header>
      </div>

      <AnimatePresence>
        {menuOpen ? (
          <>
            <motion.button
              type="button"
              aria-label="Close menu overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] bg-black/60 md:hidden"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed bottom-0 left-0 top-0 z-[80] flex w-[min(300px,88vw)] flex-col bg-[#0a0a0a] text-white shadow-2xl md:hidden"
            >
              <div className="flex items-center justify-between border-b border-white/10 p-4">
                <Link
                  to={homePath}
                  className="flex items-center gap-2"
                  onClick={() => setMenuOpen(false)}
                >
                  <img src="/LOGO.png" alt="" className="h-9 w-9 rounded" />
                  <span className="font-serif font-bold text-[#D4AF37]">
                    SAGA ELITE
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="p-2 text-[#D4AF37]"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4 text-lg">
                {desktopNav.map((item) => (
                  <Link
                    key={item.id}
                    to={item.to}
                    className="rounded-lg px-3 py-3 hover:bg-white/5"
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                {user?.role === "admin" ? (
                  <Link
                    to="/admin/dashboard"
                    className="rounded-lg px-3 py-3 hover:bg-white/5"
                    onClick={() => setMenuOpen(false)}
                  >
                    Admin
                  </Link>
                ) : null}
                <Link
                  to="/shopping/wishlist"
                  className="rounded-lg px-3 py-3 hover:bg-white/5"
                  onClick={() => setMenuOpen(false)}
                >
                  Wishlist
                </Link>
                <Link
                  to="/shopping/account"
                  className="rounded-lg px-3 py-3 hover:bg-white/5"
                  onClick={() => setMenuOpen(false)}
                >
                  Account
                </Link>
              </nav>
              <div className="border-t border-white/10 p-4">
                <p className="mb-3 text-[10px] uppercase tracking-widest text-gray-500">
                  Follow us
                </p>
                <div className="flex gap-4">
                  <a
                    href={CONTACT_INFO.socials.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#D4AF37]"
                  >
                    <InstagramGlyph className="h-6 w-6" />
                  </a>
                  <a
                    href={CONTACT_INFO.socials.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#D4AF37]"
                  >
                    FB
                  </a>
                  <a
                    href={CONTACT_INFO.socials.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#D4AF37]"
                  >
                    TT
                  </a>
                </div>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
};

export default MainHeader;
