import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, User, Menu, LogOut, Settings, X, Heart, LayoutDashboard, Shield } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { logoutUserAction } from "@/store/auth-slice";
import { getAllDrops } from "@/store/admin/drop-slice";
import { fetchNotifications } from "@/store/notification-slice";
import { toast } from "@/hooks/use-toast";
import NotificationsDropdown from "@/components/common-components/NotificationsDropdown";

const computeCountdown = (targetDate) => {
  if (!targetDate) return { days: "00", hours: "00", minutes: "00", seconds: "00" };
  const diff = targetDate - new Date();
  if (diff <= 0) return { days: "00", hours: "00", minutes: "00", seconds: "00" };

  return {
    days: String(Math.floor(diff / (1000 * 60 * 60 * 24))).padStart(2, "0"),
    hours: String(Math.floor((diff / (1000 * 60 * 60)) % 24)).padStart(2, "0"),
    minutes: String(Math.floor((diff / 1000 / 60) % 60)).padStart(2, "0"),
    seconds: String(Math.floor((diff / 1000) % 60)).padStart(2, "0"),
  };
};

const MainHeader = () => {
  const location = useLocation();
  const isAdminView = location.pathname.startsWith("/admin");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const { user } = useSelector((state) => state.auth);
  const { totalQuantity } = useSelector((state) => state.cart.cart || {});
  const { items: wishlistItems } = useSelector((state) => state.cart.wishlist || { items: [] });
  const cartCount = totalQuantity || 0;
  const wishlistCount = wishlistItems?.length || 0;
  const { drops } = useSelector((state) => state.drop);
  // notifications handled by NotificationsDropdown, but we might just use NotificationsDropdown component

  const [nextDrop, setNextDrop] = useState(null);
  const [countdown, setCountdown] = useState({ days: "00", hours: "00", minutes: "00", seconds: "00" });

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
    const timer = setInterval(() => {
      setCountdown(computeCountdown(new Date(nextDrop.releaseDate)));
    }, 1000);
    return () => clearInterval(timer);
  }, [nextDrop]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  if (isAdminView) {
    return (
      <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-gray-800 bg-[#0a0a0a] px-8">
        <div className="flex flex-1 items-center gap-6">
          <div className="lg:hidden text-[#D4AF37]">
            <Menu className="h-6 w-6 cursor-pointer" />
          </div>
        </div>
        <div className="flex flex-col items-center absolute left-1/2 -translate-x-1/2">
          <h1 className="text-xl font-extrabold tracking-widest text-white tracking-[0.2em] font-serif">
            SE <span className="text-[#D4AF37]">ADMIN</span>
          </h1>
          <p className="text-[10px] tracking-[0.3em] text-[#D4AF37]/70 font-light mt-1">BACK OFFICE PANEL</p>
        </div>
        <div className="flex items-center gap-6">
          <NotificationsDropdown />
          <div className="relative flex items-center gap-3">
             <div className="flex flex-col items-end">
               <span className="text-sm font-semibold text-white tracking-wider">{user?.userName || "Admin"}</span>
               <span className="text-[10px] text-[#D4AF37] uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#D4AF37]/10 mt-1">Admin</span>
             </div>
             <button
               onClick={handleLogout}
               className="flex h-10 w-10 items-center justify-center rounded-full bg-red-900/20 text-red-500 hover:bg-red-900/40 hover:text-red-400 transition-all border border-red-900/50"
               title="Sign Out"
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
      {/* Top Banner for Customers */}
      {nextDrop && (
        <div className="bg-[#D4AF37] text-black text-xs font-bold tracking-widest py-2 px-4 text-center z-50 relative">
          NEXT DROP: {nextDrop.name.toUpperCase()} LIVES IN {countdown.days}d {countdown.hours}h {countdown.minutes}m {countdown.seconds}s
        </div>
      )}
      <header className="sticky top-0 z-40 w-full bg-black text-white border-b border-[#D4AF37]/20 shadow-sm">
        <div className="container mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          {/* Left: Mobile Menu */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-[#D4AF37] hover:text-white transition-colors"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Logo */}
          <Link to="/shopping/home" className="flex items-center gap-3">
            <img src="/LOGO.png" alt="Saga Elite Logo" className="h-12 w-12 object-cover rounded-md" />
            <div className="hidden md:flex flex-col">
              <span className="font-bold text-xl tracking-widest text-[#D4AF37] uppercase">Saga Elite</span>
              <span className="text-[10px] tracking-[0.2em] text-gray-400 uppercase">Rare Fit Forever</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium uppercase tracking-widest">
            <Link to="/shopping/home" className="hover:text-[#D4AF37] transition-colors">Home</Link>
            <Link to="/shopping/product-list" className="hover:text-[#D4AF37] transition-colors">Products</Link>
            <Link to="/shopping/product-list?category=drops" className="hover:text-[#D4AF37] transition-colors">Drops</Link>
          </nav>

          {/* Right: Icons */}
          <div className="flex items-center gap-6">
            <NotificationsDropdown />
            <Link to="/shopping/wishlist" className="relative text-white hover:text-[#D4AF37] transition-colors">
              <Heart className="w-6 h-6" />
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#D4AF37] text-black text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link to="/shopping/cart" className="relative text-white hover:text-[#D4AF37] transition-colors">
              <ShoppingCart className="w-6 h-6" />
              <span className="absolute -top-2 -right-2 bg-[#D4AF37] text-black text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            </Link>

            {/* User dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="text-white hover:text-[#D4AF37] transition-colors focus:outline-none"
              >
                {user?.profilePicture ? (
                  <img src={user.profilePicture} alt="avatar" className="w-8 h-8 rounded-full object-cover border border-[#D4AF37]/40" />
                ) : (
                  <User className="w-6 h-6" />
                )}
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-3 w-52 bg-[#0a0a0a] border border-[#D4AF37]/20 rounded shadow-xl divide-y divide-[#D4AF37]/10 z-50">
                  <div className="px-4 py-3">
                    <p className="text-xs text-gray-500 uppercase tracking-widest">Signed in as</p>
                    <p className="text-sm text-white font-medium truncate mt-0.5">{user?.email || "Guest"}</p>
                  </div>
                  <div className="py-1">
                    {user?.role === "admin" && (
                      <Link to="/admin/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-[#D4AF37] hover:bg-white/5 transition-colors">
                        <Shield className="w-4 h-4" />
                        Admin Panel
                      </Link>
                    )}
                    <Link to="/shopping/account" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-[#D4AF37] hover:bg-white/5 transition-colors">
                      <Settings className="w-4 h-4" />
                      My Account
                    </Link>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-red-400 hover:bg-white/5 transition-colors">
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile nav drawer */}
        {menuOpen && (
          <div className="md:hidden bg-[#0a0a0a] border-t border-[#D4AF37]/10 px-6 py-4 flex flex-col gap-4 text-sm font-medium uppercase tracking-widest">
            <Link to="/shopping/home" onClick={() => setMenuOpen(false)} className="hover:text-[#D4AF37] transition-colors">Home</Link>
            <Link to="/shopping/product-list" onClick={() => setMenuOpen(false)} className="hover:text-[#D4AF37] transition-colors">Products</Link>
            <Link to="/shopping/product-list?category=drops" onClick={() => setMenuOpen(false)} className="hover:text-[#D4AF37] transition-colors">Drops</Link>
            {user?.role === "admin" && (
                <Link to="/admin/dashboard" onClick={() => setMenuOpen(false)} className="hover:text-[#D4AF37] transition-colors">Admin Panel</Link>
            )}
          </div>
        )}
      </header>
    </>
  );
};

export default MainHeader;