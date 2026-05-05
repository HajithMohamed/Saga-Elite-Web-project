import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
// eslint-disable-next-line no-unused-vars -- `motion.*` JSX is used in this file
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight,
  Heart,
  LogOut,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
  Dot,
} from "lucide-react";

import { logoutUserAction } from "@/store/auth-slice";
import { QuickActions } from "@/components/landing/LandingSections";

const AnnouncementBar = ({ items }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [items]);

  return (
    <div className="bg-primary text-[#FAF7F2] text-center text-xs py-1.5">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {items[currentIndex]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};


const AnimatedBadge = ({ count }) => {
  if (!count || count <= 0) return null;
  return (
    <span className="absolute -top-2 -right-2 bg-sale text-white text-[10px] min-w-[18px] h-[18px] px-1 rounded-full grid place-items-center">
      {count > 99 ? "99+" : count}
    </span>
  );
};

const MainHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isAdminView = location.pathname.startsWith("/admin");

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(null);
  const megaCloseTimer = useRef(null);
  const [scrolled, setScrolled] = useState(false);

  const { user } = useSelector((state) => state.auth);
  const { totalQuantity } = useSelector((state) => state.cart.cart || {});
  const { items: wishlistItems } = useSelector((state) => state.cart.wishlist || { items: [] });

  const cartCount = totalQuantity || 0;
  const wishlistCount = wishlistItems?.length || 0;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUserAction()).unwrap();
      navigate("/auth/login");
    } catch (err) {
      console.error(err);
    }
  };

  const navItems = useMemo(
    () => [
      { key: "women", label: "Women", to: "/shopping/product-list?category=women", children: ["Dresses", "Tops", "Bottoms", "Sarees", "Lingerie", "Accessories"] },
      { key: "men", label: "Men", to: "/shopping/product-list?category=men", children: ["Shirts", "Trousers", "Casual", "Formal", "Accessories"] },
      { key: "kids", label: "Kids", to: "/shopping/product-list?category=kids" },
      { key: "sale", label: "Sale", to: "/shopping/product-list?sale=true", accent: "sale", children: ["Women's Sale", "Men's Sale", "Kids' Sale", "Up to 70% Off"] },
      { key: "newin", label: "New In", to: "/shopping/product-list?sort=newest", accent: "new" },
    ],
    []
  );

  const openMega = (key) => {
    if (megaCloseTimer.current) clearTimeout(megaCloseTimer.current);
    setMegaOpen(key);
  };
  const closeMega = () => {
    megaCloseTimer.current = setTimeout(() => setMegaOpen(null), 200);
  };

  if (isAdminView) {
    return (
      <header className="h-20 flex justify-between items-center px-6 border-b">
        <h2>Admin Panel</h2>
        <button onClick={handleLogout}>
          <LogOut />
        </button>
      </header>
    );
  }

  return (
    <>
      <AnnouncementBar
        items={[
          "Free delivery on orders over LKR 2,000",
          "Easy 14-day returns — no questions asked",
          "New arrivals every Friday — Women's collection updated",
        ]}
      />

      <header role="banner" className="sticky top-0 z-50">
        <div className={`bg-background border-b border-border transition-all duration-300 ${scrolled ? "py-2" : "py-3"}`}>
          <div className="w-full px-6 flex items-center justify-between gap-3">
            <div>
              <Link to="/shopping/home" className="block">
                <p className="font-display text-[22px] tracking-[0.08em] text-primary">SAGA ELITE</p>
                <p className="text-[10px] text-muted">Premium Fashion · Sri Lanka</p>
              </Link>
            </div>

            <nav className="hidden md:flex items-center gap-7 text-[13px]">
              {navItems.map((item) => (
                <div
                  key={item.key}
                  onMouseEnter={() => item.children && openMega(item.key)}
                  onMouseLeave={closeMega}
                  className="relative"
                >
                  <Link
                    to={item.to}
                    className={`pb-1 border-b-2 border-transparent hover:border-[#C9A96E] transition-all ${item.accent === "sale" ? "text-sale" : item.accent === "new" ? "text-new" : "text-[#2C2C2A]"}`}
                  >
                    {item.label} {item.key === "sale" ? <Dot className="inline h-4 w-4 text-sale" /> : null}
                  </Link>
                </div>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-4">
              <button aria-label="Open search" onClick={() => setSearchOpen((prev) => !prev)} className="text-[#2C2C2A] hover:text-primary transition">
                <Search className="h-5 w-5" />
              </button>
              <Link to="/shopping/wishlist" className="relative text-[#2C2C2A] hover:text-primary">
                <Heart className="h-5 w-5" />
                <AnimatedBadge count={wishlistCount} />
              </Link>
              <Link to="/shopping/cart" className="relative text-[#2C2C2A] hover:text-primary">
                <ShoppingBag className="h-5 w-5" />
                <AnimatedBadge count={cartCount} />
              </Link>
              <div className="relative">
                <button aria-label="Account menu" onClick={() => setUserMenuOpen((v) => !v)} className="text-[#2C2C2A] hover:text-primary">
                  <User className="h-5 w-5" />
                </button>
                {userMenuOpen ? (
                  <div className="absolute right-0 mt-3 w-44 rounded-lg border border-border bg-background shadow-lg p-2 z-50 text-sm">
                    {user ? (
                      <>
                        <Link className="block px-3 py-2 hover:bg-surface rounded" to="/shopping/orders">My Orders</Link>
                        <Link className="block px-3 py-2 hover:bg-surface rounded" to="/shopping/wishlist">Wishlist</Link>
                        <button className="w-full text-left px-3 py-2 hover:bg-surface rounded text-sale" onClick={handleLogout}>Sign Out</button>
                      </>
                    ) : (
                      <>
                        <Link className="block px-3 py-2 hover:bg-surface rounded" to="/auth/login">Sign In</Link>
                        <Link className="block px-3 py-2 hover:bg-surface rounded" to="/auth/register">Register</Link>
                      </>
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            <button
              className="md:hidden p-2"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {searchOpen ? (
            <motion.div initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -16, opacity: 0 }} className="border-b border-border bg-background">
              <div className="w-full px-6 py-3">
                <input
                  autoFocus
                  type="search"
                  placeholder="Search products..."
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-[#C9A96E]"
                />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {megaOpen ? (
          <div className="hidden md:block border-t-2 border-primary bg-background shadow-sm" onMouseEnter={() => openMega(megaOpen)} onMouseLeave={closeMega}>
            <div className="w-full px-6 py-5 grid grid-cols-3 gap-6">
              {(navItems.find((n) => n.key === megaOpen)?.children || []).map((entry) => (
                <Link key={entry} to="/shopping/product-list" className="text-sm text-[#2C2C2A] hover:text-primary inline-flex items-center">
                  {entry} <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </header>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.25 }}
            className="fixed inset-y-0 left-0 w-[84%] max-w-[320px] z-[60] bg-background border-r border-border p-5 md:hidden overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <p className="font-display text-xl text-primary">SAGA ELITE</p>
              <button onClick={() => setMobileOpen(false)} aria-label="Close drawer"><X /></button>
            </div>
            <div className="space-y-2">
              {navItems.map((item) => (
                <Link key={item.key} to={item.to} className="block rounded-lg px-3 py-2 hover:bg-surface">
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="mt-8 pt-4 border-t border-border">
              <QuickActions />
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </>
  );
};

export default MainHeader;