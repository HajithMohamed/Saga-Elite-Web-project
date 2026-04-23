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
  Shield
} from "lucide-react";

import { useDispatch, useSelector } from "react-redux";
import { logoutUserAction } from "@/store/auth-slice";
import { getAllDrops } from "@/store/admin/drop-slice";
import { toast } from "@/hooks/use-toast";
import NotificationsDropdown from "@/components/common-components/NotificationsDropdown";

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
    hours: String(
      Math.floor((diff / (1000 * 60 * 60)) % 24)
    ).padStart(2, "0"),
    minutes: String(
      Math.floor((diff / 1000 / 60) % 60)
    ).padStart(2, "0"),
    seconds: String(
      Math.floor((diff / 1000) % 60)
    ).padStart(2, "0"),
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
  const { items: wishlistItems } =
    useSelector((state) => state.cart.wishlist || { items: [] });

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

  useEffect(() => {
    if (!isAdminView && drops.length === 0) {
      dispatch(getAllDrops());
    }
  }, [dispatch, isAdminView, drops.length]);

  useEffect(() => {
    if (!isAdminView && drops.length > 0) {
      const upcoming = [...drops]
        .filter((d) => new Date(d.releaseDate) > new Date())
        .sort(
          (a, b) =>
            new Date(a.releaseDate) - new Date(b.releaseDate)
        );

      setNextDrop(upcoming[0] || null);
    }
  }, [drops, isAdminView]);

  useEffect(() => {
    if (!nextDrop?.releaseDate) return;

    const timer = setInterval(() => {
      setCountdown(
        computeCountdown(
          new Date(nextDrop.releaseDate)
        )
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [nextDrop]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target)
      ) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);

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
        description:
          err?.message || "Please try again.",
        variant: "destructive",
      });
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
          <h1 className="text-xl font-extrabold tracking-[0.2em] text-white font-serif">
            SE <span className="text-[#D4AF37]">ADMIN</span>
          </h1>

          <p className="text-[10px] tracking-[0.3em] text-[#D4AF37]/70 mt-1">
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

              <span className="text-[10px] text-[#D4AF37] px-2 py-0.5 rounded-full bg-[#D4AF37]/10 mt-1 uppercase">
                Admin
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-red-900/20 text-red-500 border border-red-900/50"
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
      {nextDrop && (
        <div className="bg-[#D4AF37] text-black text-xs font-bold py-2 px-4 text-center">
          NEXT DROP: {nextDrop.name.toUpperCase()} LIVES IN{" "}
          {countdown.days}d {countdown.hours}h{" "}
          {countdown.minutes}m {countdown.seconds}s
        </div>
      )}

      <header className="sticky top-0 z-40 w-full bg-black text-white border-b border-[#D4AF37]/20">
        <div className="container mx-auto px-4 md:px-6 h-20 flex items-center justify-between">

          <div className="md:hidden">
            <button onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen
                ? <X className="w-6 h-6"/>
                : <Menu className="w-6 h-6"/>}
            </button>
          </div>

          <Link to="/shopping/home" className="flex items-center gap-3">
            <img
              src="/LOGO.png"
              alt="Saga Elite Logo"
              className="h-12 w-12 rounded-md"
            />

            <div className="hidden md:flex flex-col">
              <span className="font-bold text-xl text-[#D4AF37] uppercase">
                Saga Elite
              </span>

              <span className="text-[10px] text-gray-400 uppercase">
                Rare Fit Forever
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex gap-8 uppercase text-sm">
            <Link to="/shopping/home">Home</Link>
            <Link to="/shopping/product-list">Products</Link>
            <Link to="/shopping/product-list?category=drops">
              Drops
            </Link>
          </nav>

          <div className="flex items-center gap-6">
            <NotificationsDropdown />

            <Link to="/shopping/wishlist" className="relative">
              <Heart className="w-6 h-6"/>
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#D4AF37] text-black text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link to="/shopping/cart" className="relative">
              <ShoppingCart className="w-6 h-6"/>
              <span className="absolute -top-2 -right-2 bg-[#D4AF37] text-black text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            </Link>

            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() =>
                  setUserMenuOpen(!userMenuOpen)
                }
              >
                <User className="w-6 h-6"/>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-3 w-52 bg-[#0a0a0a] border border-[#D4AF37]/20 rounded shadow-xl">

                  {user?.role === "admin" && (
                    <Link
                      to="/admin/dashboard"
                      className="flex items-center gap-3 px-4 py-2"
                    >
                      <Shield className="w-4 h-4"/>
                      Admin Panel
                    </Link>
                  )}

                  <Link
                    to="/shopping/account"
                    className="flex items-center gap-3 px-4 py-2"
                  >
                    <Settings className="w-4 h-4"/>
                    My Account
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2"
                  >
                    <LogOut className="w-4 h-4"/>
                    Sign Out
                  </button>

                </div>
              )}
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-[#0a0a0a] px-6 py-4 flex flex-col gap-4">
            <Link to="/shopping/home">Home</Link>
            <Link to="/shopping/product-list">Products</Link>
            <Link to="/shopping/product-list?category=drops">
              Drops
            </Link>

            {user?.role === "admin" && (
              <Link to="/admin/dashboard">
                Admin Panel
              </Link>
            )}
          </div>
        )}
      </header>
    </>
  );
};

export default MainHeader;