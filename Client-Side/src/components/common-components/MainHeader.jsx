import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Heart,
  LogOut,
  Menu,
  Package,
  Settings,
  Shield,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import { logoutUserAction } from "@/store/auth-slice";
import { getAllDrops } from "@/store/admin/drop-slice";
import { toast } from "@/hooks/use-toast";
import NotificationsDropdown from "@/components/common-components/NotificationsDropdown";
import { CONTACT_INFO } from "@/config";
import { Wordmark, Btn } from "@/components/ui/editorial";

const computeCountdown = (target) => {
  if (!target) return { d: "00", h: "00", m: "00" };
  const diff = target - new Date();
  if (diff <= 0) return { d: "00", h: "00", m: "00" };
  return {
    d: String(Math.floor(diff / 86400000)).padStart(2, "0"),
    h: String(Math.floor((diff / 3600000) % 24)).padStart(2, "0"),
    m: String(Math.floor((diff / 60000) % 60)).padStart(2, "0"),
  };
};

const MainHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isAdminView = location.pathname.startsWith("/admin");
  const homePath = location.pathname.startsWith("/shopping") ? "/shopping/home" : "/";

  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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
  const [countdown, setCountdown] = useState({ d: "00", h: "00", m: "00" });

  useEffect(() => {
    if (!isAdminView && drops.length === 0) dispatch(getAllDrops());
  }, [dispatch, isAdminView, drops.length]);

  useEffect(() => {
    if (isAdminView || drops.length === 0) return;
    const upcoming = [...drops]
      .filter((d) => d?.releaseDate && new Date(d.releaseDate) > new Date())
      .sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate));
    setNextDrop(upcoming[0] || null);
  }, [drops, isAdminView]);

  useEffect(() => {
    if (!nextDrop?.releaseDate) return;
    const target = new Date(nextDrop.releaseDate);
    const tick = () => setCountdown(computeCountdown(target));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
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
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    try {
      await dispatch(logoutUserAction()).unwrap();
      toast({ title: "Signed out", description: "See you next time.", variant: "success" });
      navigate("/auth/login");
    } catch (err) {
      toast({
        title: "Logout failed",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const navActiveId = useMemo(() => {
    const p = location.pathname;
    const cat = new URLSearchParams(location.search).get("category") || "";
    if (p === "/" || p === "/shopping/home") return "home";
    if (p.startsWith("/shopping/product-list") && cat.toLowerCase() === "drops") return "drops";
    if (p.startsWith("/shopping/product-list")) return "products";
    if (p === "/about") return "about";
    if (p === "/contact") return "contact";
    return null;
  }, [location.pathname, location.search]);

  const desktopNav = [
    { id: "drops", to: "/shopping/product-list?category=drops", label: "Drops" },
    { id: "products", to: "/shopping/product-list", label: "Atelier" },
    { id: "lookbook", to: "/shopping/product-list?sort=newest", label: "Lookbook" },
    { id: "about", to: "/about", label: "Journal" },
    { id: "contact", to: "/contact", label: "Contact" },
  ];

  const marqueeItems = nextDrop
    ? [
        `${(nextDrop.name || "Next chapter").toUpperCase()} drops in ${countdown.d}d ${countdown.h}h ${countdown.m}m`,
        "Members enter first",
        "Free island-wide delivery",
        "Rare fit, forever",
      ]
    : ["Free island-wide delivery", "New chapter every fortnight", "Members enter first", "Rare fit, forever"];

  /* ─── Admin variant ──────────────────────────── */
  if (isAdminView) {
    return (
      <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-white/10 bg-[#0a0a0a] px-6 lg:px-8">
        <div className="flex flex-1 items-center gap-6">
          <button type="button" className="lg:hidden text-[#f2ca50]" aria-label="Menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex flex-col">
            <span className="se-label text-[10px] tracking-[0.32em] text-[#f2ca50]">
              Saga Elite
            </span>
            <span className="se-headline text-base text-white">Atelier · Admin</span>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <NotificationsDropdown />
          <div className="hidden md:flex flex-col items-end">
            <span className="se-body text-sm text-white">{user?.userName || "Admin"}</span>
            <span className="se-label text-[9px] tracking-[0.3em] text-[#f2ca50] mt-0.5">
              {user?.role || "admin"}
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Sign out"
            className="flex h-10 w-10 items-center justify-center border border-[#93000a]/50 text-[#ffb4ab] hover:bg-[#93000a]/15 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>
    );
  }

  /* ─── Storefront variant ─────────────────────── */
  return (
    <>
      <div className="sticky top-0 z-50 w-full">
        {/* Header marquee */}
        <div className="relative overflow-hidden bg-[#0e0e0e] border-b border-[#4d4635]/60 py-2">
          <div className="flex whitespace-nowrap header-marquee-track">
            {[...marqueeItems, ...marqueeItems, ...marqueeItems].map((item, i) => (
              <span
                key={i}
                className="se-label text-[9px] tracking-[0.32em] text-[#d0c5af] px-6 inline-flex items-center gap-6"
              >
                {item}
                <span className="text-[#574500]">◆</span>
              </span>
            ))}
          </div>
        </div>

        <header
          className={`w-full transition-all duration-300 ${
            scrolled
              ? "bg-[#131313]/95 backdrop-blur-md border-b border-[#4d4635]/40"
              : "bg-[#131313]/80 backdrop-blur-sm border-b border-transparent"
          }`}
        >
          <div className="px-4 md:px-8 lg:px-12 h-16 md:h-20 flex items-center justify-between gap-3 md:grid md:grid-cols-3">
            {/* Left ── nav (desktop) / hamburger (mobile) */}
            <nav className="md:flex items-center gap-6 lg:gap-8 hidden">
              {desktopNav.map((item) => (
                <Link
                  key={item.id}
                  to={item.to}
                  className={`relative se-label text-[10px] tracking-[0.28em] transition-colors ${
                    navActiveId === item.id
                      ? "text-[#f2ca50]"
                      : "text-[#d0c5af] hover:text-[#e5e2e1]"
                  }`}
                >
                  {item.label}
                  {navActiveId === item.id && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute -bottom-1.5 left-0 right-0 h-px bg-[#f2ca50]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              ))}
            </nav>

            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
              className="md:hidden text-[#e5e2e1]"
            >
              <Menu className="h-5 w-5" strokeWidth={1.5} />
            </button>

            {/* Center ── wordmark */}
            <Link to={homePath} className="flex justify-center md:justify-self-center" aria-label="Saga Elite home">
              <Wordmark size="md" tagline />
            </Link>

            {/* Right ── utility */}
            <div className="flex items-center justify-end gap-4 md:gap-5 text-[#d0c5af]">
              <div className="hidden md:block">
                <NotificationsDropdown />
              </div>
              <Link
                to="/shopping/wishlist"
                className="relative hidden md:inline-flex hover:text-[#e5e2e1] transition-colors"
                aria-label="Wishlist"
              >
                <Heart size={16} strokeWidth={1.5} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 se-mono text-[9px] bg-[#f2ca50] text-[#1b1c1c] rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              <Link
                to="/shopping/cart"
                className="relative inline-flex hover:text-[#e5e2e1] transition-colors"
                aria-label="Cart"
              >
                <ShoppingBag size={16} strokeWidth={1.5} />
                <span className="absolute -top-1.5 -right-2 se-mono text-[9px] bg-[#f2ca50] text-[#1b1c1c] rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                  {cartCount}
                </span>
              </Link>

              {!user ? (
                <Link
                  to="/auth/login"
                  className="hidden md:inline-flex se-label text-[10px] tracking-[0.28em] text-[#e5e2e1] hover:text-[#f2ca50]"
                >
                  Sign in
                </Link>
              ) : null}

              <Link
                to="/shopping/account"
                className="md:hidden inline-flex hover:text-[#e5e2e1] transition-colors"
                aria-label="Account"
              >
                <User size={16} strokeWidth={1.5} />
              </Link>

              {user ? (
                <div className="relative hidden md:block" ref={userMenuRef}>
                  <button
                    type="button"
                    aria-label="Account menu"
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="hover:text-[#e5e2e1] transition-colors"
                  >
                    <User size={16} strokeWidth={1.5} />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-3 w-56 border border-[#4d4635] bg-[#0b0b0b]">
                      <div className="border-b border-[#4d4635]/60 px-4 py-3">
                        <div className="se-label text-[9px] tracking-[0.28em] text-[#99907c]">
                          Signed in
                        </div>
                        <div className="se-body text-sm text-[#e5e2e1] mt-1 truncate">
                          {user.userName || user.email || "Atelier member"}
                        </div>
                      </div>
                      {String(user.role || "").toLowerCase() === "admin" || String(user.role || "").toLowerCase() === "super_admin" ? (
                        <Link
                          to="/admin/dashboard"
                          className="flex items-center gap-3 px-4 py-2.5 se-body text-sm text-[#d0c5af] hover:bg-white/5 hover:text-[#f2ca50]"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Shield className="h-4 w-4" /> Admin panel
                        </Link>
                      ) : null}
                      <Link
                        to="/shopping/account"
                        className="flex items-center gap-3 px-4 py-2.5 se-body text-sm text-[#d0c5af] hover:bg-white/5 hover:text-[#f2ca50]"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4" /> My account
                      </Link>
                      <Link
                        to="/shopping/orders"
                        className="flex items-center gap-3 px-4 py-2.5 se-body text-sm text-[#d0c5af] hover:bg-white/5 hover:text-[#f2ca50]"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Package className="h-4 w-4" /> Orders
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-4 py-2.5 se-body text-sm text-[#d0c5af] hover:bg-white/5 hover:text-[#ffb4ab] border-t border-[#4d4635]/60"
                      >
                        <LogOut className="h-4 w-4" /> Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/auth/register" className="hidden md:inline-flex">
                  <Btn size="sm" variant="default">Become a member</Btn>
                </Link>
              )}
            </div>
          </div>
        </header>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
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
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed bottom-0 left-0 top-0 z-[80] flex w-[min(320px,88vw)] flex-col bg-[#0a0a0a] text-[#e5e2e1] shadow-2xl md:hidden border-r border-[#4d4635]"
            >
              <div className="flex items-center justify-between border-b border-[#4d4635]/60 p-5">
                <Link
                  to={homePath}
                  className="flex items-center gap-3"
                  onClick={() => setMenuOpen(false)}
                >
                  <Wordmark size="sm" tagline />
                </Link>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                  className="p-1 text-[#f2ca50]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex flex-1 flex-col overflow-y-auto p-3">
                {desktopNav.map((item) => (
                  <Link
                    key={item.id}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className="se-label text-xs tracking-[0.24em] text-[#d0c5af] px-3 py-4 border-b border-[#4d4635]/40 hover:text-[#f2ca50]"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  to="/shopping/wishlist"
                  onClick={() => setMenuOpen(false)}
                  className="se-label text-xs tracking-[0.24em] text-[#d0c5af] px-3 py-4 border-b border-[#4d4635]/40 hover:text-[#f2ca50]"
                >
                  Wishlist {wishlistCount > 0 && <span className="se-mono text-[10px] text-[#f2ca50] ml-2">{wishlistCount}</span>}
                </Link>
                {String(user?.role || "").toLowerCase() === "admin" ||
                String(user?.role || "").toLowerCase() === "super_admin" ? (
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="se-label text-xs tracking-[0.24em] text-[#d0c5af] px-3 py-4 border-b border-[#4d4635]/40 hover:text-[#f2ca50]"
                  >
                    Admin
                  </Link>
                ) : null}
                {!user ? (
                  <div className="flex flex-col gap-3 mt-6 px-3">
                    <Link to="/auth/login" onClick={() => setMenuOpen(false)}>
                      <Btn variant="outline" className="w-full">Sign in</Btn>
                    </Link>
                    <Link to="/auth/register" onClick={() => setMenuOpen(false)}>
                      <Btn variant="default" className="w-full">Become a member</Btn>
                    </Link>
                  </div>
                ) : null}
              </nav>

              <div className="border-t border-[#4d4635]/60 p-5">
                <div className="se-label text-[9px] tracking-[0.32em] text-[#574500]">
                  Follow the atelier
                </div>
                <div className="mt-3 flex gap-4 se-label text-[10px] tracking-[0.28em]">
                  <a
                    href={CONTACT_INFO?.socials?.instagram || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#d0c5af] hover:text-[#f2ca50]"
                  >
                    Instagram
                  </a>
                  <span className="text-[#4d4635]">·</span>
                  <a
                    href={CONTACT_INFO?.socials?.facebook || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#d0c5af] hover:text-[#f2ca50]"
                  >
                    Facebook
                  </a>
                  <span className="text-[#4d4635]">·</span>
                  <a
                    href={CONTACT_INFO?.socials?.tiktok || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#d0c5af] hover:text-[#f2ca50]"
                  >
                    TikTok
                  </a>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MainHeader;
