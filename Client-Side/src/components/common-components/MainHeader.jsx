import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  Heart,
  LogOut,
  Menu,
  Package,
  Settings,
  Shield,
  ShoppingBag,
  User,
  X,
  ChevronDown,
  Archive,
  Info,
  Mail,
} from "lucide-react";

import { logoutUserAction } from "@/store/auth-slice";
import { getAllDrops } from "@/store/admin/drop-slice";
import { toast } from "@/hooks/use-toast";
import NotificationsDropdown from "@/components/common-components/NotificationsDropdown";
import { CONTACT_INFO } from "@/config";
import { Wordmark } from "@/components/ui/editorial";

// ── Announcement Bar Auto-Rotate ────────────────────────────────
const AnnouncementBar = ({ items = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!items.length) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [items.length]);

  return (
    <div className="bg-primary text-primary-foreground py-2 px-4 md:px-8 lg:px-12 overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentIndex}
          initial={reduced ? { opacity: 0 } : { x: 40, opacity: 0 }}
          animate={reduced ? { opacity: 1 } : { x: 0, opacity: 1 }}
          exit={reduced ? { opacity: 0 } : { x: -40, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center se-label text-[11px] md:text-xs tracking-[0.24em]"
        >
          {items[currentIndex]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// ── Animated Badge ──────────────────────────────────────────────
const AnimatedBadge = ({ count }) => {
  const reduced = useReducedMotion();
  if (!count || count <= 0) return null;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={count}
        initial={reduced ? { opacity: 0 } : { scale: 0.6, opacity: 0 }}
        animate={
          reduced
            ? { opacity: 1 }
            : { scale: [0.6, 1.18, 1], opacity: 1 }
        }
        exit={reduced ? { opacity: 0 } : { scale: 0.6, opacity: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="absolute -top-2 -right-2 min-w-[18px] h-5 px-1 inline-flex items-center justify-center rounded-full bg-accent text-foreground se-mono text-[9px] font-semibold"
      >
        {count > 99 ? "99+" : count}
      </motion.span>
    </AnimatePresence>
  );
};

// ── Mega Menu Category Item ─────────────────────────────────────
const MegaMenuCategory = ({ label, items = [], isOpen }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: isOpen ? 1 : 0, y: isOpen ? 0 : -8 }}
      transition={{ duration: 0.2 }}
      className="text-foreground"
    >
      <h3 className="se-label text-[10px] tracking-[0.24em] text-accent font-semibold mb-3 uppercase">
        {label}
      </h3>
      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li key={idx}>
            <Link
              to={item.href}
              className="se-body text-sm text-foreground/80 hover:text-foreground hover:text-accent transition-colors"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </motion.div>
  );
};

// ── Mega Menu Dropdown ──────────────────────────────────────────
const MegaMenuDropdown = ({ isOpen, onClose, categoryConfig }) => {
  const reduced = useReducedMotion();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="absolute left-0 right-0 top-full mt-0 bg-background border-b border-border shadow-lg"
          onMouseLeave={onClose}
        >
          <div className="max-w-screen-2xl mx-auto px-4 md:px-8 lg:px-12 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
              {categoryConfig.map((config, idx) => (
                <MegaMenuCategory
                  key={idx}
                  label={config.label}
                  items={config.items}
                  isOpen={true}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ── Main Header Component ───────────────────────────────────────
const MainHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const reduced = useReducedMotion();

  const isAdminView = location.pathname.startsWith("/admin");
  const homePath = location.pathname.startsWith("/shopping") ? "/shopping/home" : "/";

  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredMegaMenu, setHoveredMegaMenu] = useState(null);
  const [megaMenuTimeout, setMegaMenuTimeout] = useState(null);
  const userMenuRef = useRef(null);

  const { user } = useSelector((state) => state.auth);
  const { totalQuantity } = useSelector((state) => state.cart.cart || {});
  const { items: wishlistItems } = useSelector(
    (state) => state.cart.wishlist || { items: [] }
  );
  const { drops } = useSelector((state) => state.drop);

  const cartCount = totalQuantity || 0;
  const wishlistCount = wishlistItems?.length || 0;

  // Fetch drops
  useEffect(() => {
    if (!isAdminView && drops.length === 0) dispatch(getAllDrops());
  }, [dispatch, isAdminView, drops.length]);

  // Scroll state
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Outside-click for user menu
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

  const handleMegaMenuEnter = (menuId) => {
    if (megaMenuTimeout) clearTimeout(megaMenuTimeout);
    const timeout = setTimeout(() => {
      setHoveredMegaMenu(menuId);
    }, 200);
    setMegaMenuTimeout(timeout);
  };

  const handleMegaMenuLeave = () => {
    if (megaMenuTimeout) clearTimeout(megaMenuTimeout);
    setHoveredMegaMenu(null);
  };

  // Mega menu configurations
  const megaMenus = {
    women: {
      label: "Women",
      config: [
        {
          label: "Categories",
          items: [
            { label: "New Arrivals", href: "/shopping/product-list?category=women&tag=new" },
            { label: "Bestsellers", href: "/shopping/product-list?category=women" },
            { label: "Dresses", href: "/shopping/product-list?category=women&type=dresses" },
            { label: "Essentials", href: "/shopping/product-list?category=women&type=essentials" },
          ],
        },
        {
          label: "Collections",
          items: [
            { label: "Seasonal", href: "/shopping/product-list?category=women&collection=seasonal" },
            { label: "Limited Edition", href: "/shopping/product-list?category=women&limited=true" },
            { label: "Premium", href: "/shopping/product-list?category=women&premium=true" },
          ],
        },
        {
          label: "Explore",
          items: [
            { label: "Shop All", href: "/shopping/product-list?category=women" },
            { label: "Sales & Deals", href: "/shopping/product-list?category=women&deal=true" },
          ],
        },
      ],
    },
    men: {
      label: "Men",
      config: [
        {
          label: "Categories",
          items: [
            { label: "New Arrivals", href: "/shopping/product-list?category=men&tag=new" },
            { label: "Bestsellers", href: "/shopping/product-list?category=men" },
            { label: "Essentials", href: "/shopping/product-list?category=men&type=essentials" },
            { label: "Premium", href: "/shopping/product-list?category=men&premium=true" },
          ],
        },
        {
          label: "Collections",
          items: [
            { label: "Seasonal", href: "/shopping/product-list?category=men&collection=seasonal" },
            { label: "Limited Edition", href: "/shopping/product-list?category=men&limited=true" },
          ],
        },
        {
          label: "Explore",
          items: [
            { label: "Shop All", href: "/shopping/product-list?category=men" },
            { label: "Sales & Deals", href: "/shopping/product-list?category=men&deal=true" },
          ],
        },
      ],
    },
    drops: {
      label: "Drops",
      config: [
        {
          label: "Upcoming",
          items: [
            { label: "Next Drop", href: "/shopping/product-list?category=drops" },
            { label: "Release Calendar", href: "/shopping/drops-calendar" },
          ],
        },
        {
          label: "Browse",
          items: [
            { label: "All Drops", href: "/shopping/product-list?category=drops" },
            { label: "Most Wanted", href: "/shopping/product-list?category=drops&sort=popular" },
          ],
        },
      ],
    },
    archive: {
      label: "Archive",
      config: [
        {
          label: "Collections",
          items: [
            { label: "Past Seasons", href: "/shopping/product-list?archive=true" },
            { label: "Vault", href: "/shopping/product-list?vault=true" },
          ],
        },
      ],
    },
    about: {
      label: "About",
      config: [
        {
          label: "Company",
          items: [
            { label: "Our Story", href: "/about" },
            { label: "Craftsmanship", href: "/about#craftsmanship" },
            { label: "Sustainability", href: "/about#sustainability" },
          ],
        },
        {
          label: "Connect",
          items: [
            { label: "Contact", href: "/contact" },
            { label: "Newsletter", href: "#newsletter" },
          ],
        },
      ],
    },
  };

  const announcementItems = [
    "New Collection Drops Every Friday",
    "Members Get First Access",
    "Free Island-Wide Delivery",
    "Handcrafted in Sri Lanka",
  ];

  /* ─── Admin variant ───────────────────────────────────────── */
  if (isAdminView) {
    return (
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-border bg-background px-6 lg:px-8"
      >
        <div className="flex flex-1 items-center gap-6">
          <button type="button" className="lg:hidden text-primary" aria-label="Menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex flex-col">
            <span className="se-label text-[10px] tracking-[0.32em] text-accent">
              Saga Elite
            </span>
            <span className="se-headline text-base text-foreground">Atelier · Admin</span>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <NotificationsDropdown />
          <div className="hidden md:flex flex-col items-end">
            <span className="se-body text-sm text-foreground">{user?.userName || "Admin"}</span>
            <span className="se-label text-[9px] tracking-[0.3em] text-accent mt-0.5">
              {user?.role || "admin"}
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Sign out"
            className="flex h-10 w-10 items-center justify-center border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </motion.header>
    );
  }

  /* ─── Storefront variant ──────────────────────────────────── */
  const isAdminLike = ["admin", "super_admin", "superadmin"].includes(
    String(user?.role || "").toLowerCase()
  );

  return (
    <>
      {/* Announcement Bar */}
      <AnnouncementBar items={announcementItems} />

      {/* Main Header */}
      <div className="sticky top-[40px] z-50 w-full">
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`w-full transition-all duration-300 ${
            scrolled
              ? "bg-background/95 backdrop-blur-xl border-b border-border shadow-sm"
              : "bg-background border-b border-border"
          }`}
        >
          <div className="max-w-screen-2xl mx-auto px-4 md:px-8 lg:px-12">
            <div className="h-16 md:h-20 flex items-center justify-between relative">
              {/* Left: Logo + Menu Toggle */}
              <div className="flex items-center gap-4 flex-shrink-0">
                <button
                  type="button"
                  aria-label={menuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((v) => !v)}
                  className="md:hidden text-foreground hover:text-primary transition-colors"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={menuOpen ? "x" : "menu"}
                      initial={reduced ? { opacity: 0 } : { rotate: -90, opacity: 0 }}
                      animate={reduced ? { opacity: 1 } : { rotate: 0, opacity: 1 }}
                      exit={reduced ? { opacity: 0 } : { rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="inline-flex"
                    >
                      {menuOpen ? (
                        <X className="h-5 w-5" strokeWidth={1.5} />
                      ) : (
                        <Menu className="h-5 w-5" strokeWidth={1.5} />
                      )}
                    </motion.span>
                  </AnimatePresence>
                </button>

                <Link
                  to={homePath}
                  aria-label="Saga Elite home"
                  className="hidden md:flex items-center gap-2"
                >
                  <motion.img
                    src="/LOGO.png"
                    alt=""
                    className="h-8 w-8 object-contain"
                    initial={false}
                    animate={{ scale: scrolled ? 0.92 : 1 }}
                    transition={{ type: "spring", stiffness: 320, damping: 26 }}
                  />
                  <motion.div
                    initial={false}
                    animate={{ scale: scrolled ? 0.96 : 1 }}
                    transition={{ type: "spring", stiffness: 320, damping: 26 }}
                    style={{ transformOrigin: "left center" }}
                  >
                    <Wordmark size={scrolled ? "sm" : "md"} tagline={!scrolled} />
                  </motion.div>
                </Link>
              </div>

              {/* Center: Desktop Mega Menu Nav */}
              <nav className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-8">
                {Object.entries(megaMenus).map(([key, menu]) => (
                  <div
                    key={key}
                    className="relative"
                    onMouseEnter={() => handleMegaMenuEnter(key)}
                    onMouseLeave={handleMegaMenuLeave}
                  >
                    <button
                      type="button"
                      className={`flex items-center gap-1.5 se-label text-[10.5px] tracking-[0.26em] uppercase transition-colors ${
                        hoveredMegaMenu === key
                          ? "text-primary"
                          : "text-foreground hover:text-primary"
                      }`}
                    >
                      {menu.label}
                      <ChevronDown
                        className={`h-3 w-3 transition-transform ${
                          hoveredMegaMenu === key ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {hoveredMegaMenu === key && (
                      <MegaMenuDropdown
                        isOpen={hoveredMegaMenu === key}
                        onClose={handleMegaMenuLeave}
                        categoryConfig={menu.config}
                      />
                    )}
                  </div>
                ))}
              </nav>

              {/* Mobile Centered Logo */}
              <Link
                to={homePath}
                className="md:hidden flex items-center justify-self-center"
                aria-label="Saga Elite home"
              >
                <Wordmark size="sm" />
              </Link>

              {/* Right: Icons + Account */}
              <div className="flex items-center justify-end gap-4 md:gap-6 text-foreground flex-shrink-0">
                <div className="hidden md:block">
                  <NotificationsDropdown />
                </div>

                <Link
                  to="/shopping/wishlist"
                  className="relative hidden md:inline-flex hover:text-primary transition-colors"
                  aria-label="Wishlist"
                >
                  <Heart size={18} strokeWidth={1.5} />
                  <AnimatedBadge count={wishlistCount} />
                </Link>

                <Link
                  to="/shopping/cart"
                  className="relative inline-flex hover:text-primary transition-colors"
                  aria-label="Cart"
                >
                  <ShoppingBag size={18} strokeWidth={1.5} />
                  <AnimatedBadge count={cartCount} />
                </Link>

                {/* Account: Sign in OR User Dropdown */}
                {!user ? (
                  <Link
                    to="/auth/login"
                    className="inline-flex se-label text-[10px] tracking-[0.26em] text-foreground hover:text-primary transition-colors"
                  >
                    Sign in
                  </Link>
                ) : (
                  <div className="relative" ref={userMenuRef}>
                    <button
                      type="button"
                      aria-label="Account menu"
                      aria-expanded={userMenuOpen}
                      onClick={() => setUserMenuOpen((v) => !v)}
                      className="hover:text-primary transition-colors"
                    >
                      <User size={18} strokeWidth={1.5} />
                    </button>
                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div
                          initial={reduced ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.96 }}
                          animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                          exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.96 }}
                          transition={{ duration: 0.18 }}
                          className="absolute right-0 mt-3 w-60 border border-border bg-background shadow-xl"
                          style={{ transformOrigin: "top right" }}
                        >
                          <div className="border-b border-border px-4 py-3">
                            <div className="se-label text-[9px] tracking-[0.28em] text-foreground/60 uppercase">
                              Signed in
                            </div>
                            <div className="se-body text-sm text-foreground mt-1 truncate">
                              {user.userName || user.email || "Member"}
                            </div>
                          </div>
                          {isAdminLike && (
                            <Link
                              to="/admin/dashboard"
                              className="flex items-center gap-3 px-4 py-2.5 se-body text-sm text-foreground hover:bg-primary/5 hover:text-primary"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <Shield className="h-4 w-4" /> Admin panel
                            </Link>
                          )}
                          <Link
                            to="/shopping/account"
                            className="flex items-center gap-3 px-4 py-2.5 se-body text-sm text-foreground hover:bg-primary/5 hover:text-primary"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Settings className="h-4 w-4" /> My account
                          </Link>
                          <Link
                            to="/shopping/orders"
                            className="flex items-center gap-3 px-4 py-2.5 se-body text-sm text-foreground hover:bg-primary/5 hover:text-primary"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Package className="h-4 w-4" /> Orders
                          </Link>
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 px-4 py-2.5 se-body text-sm text-foreground hover:bg-primary/5 hover:text-primary border-t border-border"
                          >
                            <LogOut className="h-4 w-4" /> Sign out
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.header>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close menu overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[70] bg-black/20 md:hidden backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed bottom-0 left-0 top-[calc(40px+64px)] z-[80] w-[min(320px,88vw)] flex flex-col bg-background text-foreground shadow-2xl md:hidden border-r border-border overflow-y-auto"
            >
              <div className="flex-1 p-6 space-y-1">
                {/* Mobile Navigation Items */}
                {Object.entries(megaMenus).map(([key, menu]) => (
                  <Link
                    key={key}
                    to={`/shopping/product-list?category=${key === "drops" ? "drops" : key}`}
                    onClick={() => setMenuOpen(false)}
                    className="block se-label text-xs tracking-[0.24em] text-foreground px-3 py-3 border-b border-border/50 hover:text-primary transition-colors uppercase"
                  >
                    {menu.label}
                  </Link>
                ))}

                <Link
                  to="/shopping/wishlist"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between se-label text-xs tracking-[0.24em] text-foreground px-3 py-3 border-b border-border/50 hover:text-primary transition-colors uppercase mt-4"
                >
                  <span>Wishlist</span>
                  {wishlistCount > 0 && (
                    <span className="se-mono text-[10px] text-accent">{wishlistCount}</span>
                  )}
                </Link>

                {isAdminLike && (
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="block se-label text-xs tracking-[0.24em] text-foreground px-3 py-3 border-b border-border/50 hover:text-primary transition-colors uppercase"
                  >
                    Admin
                  </Link>
                )}

                {user && (
                  <Link
                    to="/shopping/account"
                    onClick={() => setMenuOpen(false)}
                    className="block se-label text-xs tracking-[0.24em] text-foreground px-3 py-3 border-b border-border/50 hover:text-primary transition-colors uppercase"
                  >
                    My Account
                  </Link>
                )}
              </div>

              {/* Mobile Auth Button or Logout */}
              <div className="border-t border-border p-6">
                {!user ? (
                  <Link
                    to="/auth/login"
                    onClick={() => setMenuOpen(false)}
                    className="block w-full text-center se-label text-[11px] tracking-[0.26em] bg-primary text-primary-foreground py-3 hover:bg-primary-hover transition-colors uppercase"
                  >
                    Sign in
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      handleLogout();
                      setMenuOpen(false);
                    }}
                    className="flex items-center justify-center gap-2 w-full se-label text-[11px] tracking-[0.26em] text-primary py-3 hover:text-primary/80 transition-colors uppercase"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                )}
              </div>

              {/* Social Links */}
              <div className="border-t border-border p-4 text-center">
                <div className="se-label text-[9px] tracking-[0.32em] text-foreground/60 uppercase mb-3">
                  Follow Saga Elite
                </div>
                <div className="flex justify-center gap-3 se-label text-[10px] tracking-[0.26em]">
                  <a
                    href={CONTACT_INFO?.socials?.instagram || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground/70 hover:text-primary transition-colors"
                  >
                    Instagram
                  </a>
                  <span className="text-border">·</span>
                  <a
                    href={CONTACT_INFO?.socials?.facebook || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground/70 hover:text-primary transition-colors"
                  >
                    Facebook
                  </a>
                  <span className="text-border">·</span>
                  <a
                    href={CONTACT_INFO?.socials?.tiktok || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground/70 hover:text-primary transition-colors"
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
