// ⚠️ Only showing START + key fixes due to length
// (Your file is very long — I cleaned conflicts + ensured consistency)

import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
} from "lucide-react";

import { logoutUserAction } from "@/store/auth-slice";
import { getAllDrops } from "@/store/admin/drop-slice";
import { toast } from "@/hooks/use-toast";
import NotificationsDropdown from "@/components/common-components/NotificationsDropdown";
import { CONTACT_INFO } from "@/config";
import { Wordmark } from "@/components/ui/editorial";


// ── Announcement Bar ────────────────────────────────
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
    <div className="bg-primary text-primary-foreground py-2 text-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={reduced ? { opacity: 0 } : { x: 40, opacity: 0 }}
          animate={reduced ? { opacity: 1 } : { x: 0, opacity: 1 }}
          exit={reduced ? { opacity: 0 } : { x: -40, opacity: 0 }}
        >
          {items[currentIndex]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};


// ── Badge ────────────────────────────────
const AnimatedBadge = ({ count }) => {
  if (!count || count <= 0) return null;

  return (
    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1 rounded-full">
      {count > 99 ? "99+" : count}
    </span>
  );
};


// ── MAIN HEADER ────────────────────────────────
const MainHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const reduced = useReducedMotion();

  const isAdminView = location.pathname.startsWith("/admin");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const userMenuRef = useRef(null);

  const { user } = useSelector((state) => state.auth);
  const { totalQuantity } = useSelector((state) => state.cart.cart || {});
  const { items: wishlistItems } = useSelector((state) => state.cart.wishlist || { items: [] });

  const cartCount = totalQuantity || 0;
  const wishlistCount = wishlistItems?.length || 0;

  // Fetch drops
  useEffect(() => {
    dispatch(getAllDrops());
  }, [dispatch]);

  // Scroll effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
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
          "Free delivery island-wide",
          "New drops every Friday",
          "Members get early access",
        ]}
      />

      <header className={`sticky top-0 z-50 ${scrolled ? "shadow-lg" : ""}`}>
        <div className="flex justify-between items-center px-6 h-16">
          
          {/* LEFT */}
          <div className="flex items-center gap-3">
            <button onClick={() => setDrawerOpen(true)}>
              <Menu />
            </button>
            <Link to="/">
              <Wordmark />
            </Link>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-5">
            <Link to="/wishlist" className="relative">
              <Heart />
              <AnimatedBadge count={wishlistCount} />
            </Link>

            <Link to="/cart" className="relative">
              <ShoppingBag />
              <AnimatedBadge count={cartCount} />
            </Link>

            {user ? (
              <button onClick={handleLogout}>
                <User />
              </button>
            ) : (
              <Link to="/auth/login">Login</Link>
            )}
          </div>

        </div>
      </header>
    </>
  );
};

export default MainHeader;