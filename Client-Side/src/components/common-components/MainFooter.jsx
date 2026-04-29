import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { getAllDrops } from "@/store/admin/drop-slice";

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

const MainFooter = () => {
  const location = useLocation();
  const isAdminView = location.pathname.startsWith("/admin");
  const dispatch = useDispatch();
  const { drops } = useSelector((state) => state.drop);

  const [nextDrop, setNextDrop] = useState(null);
  const [countdown, setCountdown] = useState(null);

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

  if (isAdminView) return null;

  return (
    <footer className="bg-[#111] text-gray-400 py-12 border-t border-[#D4AF37]/20 mt-auto">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Column */}
          <div className="flex flex-col gap-4">
            <Link to="/shopping/home" className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="font-bold text-xl tracking-widest text-[#D4AF37] uppercase">Saga Elite</span>
                <span className="text-[10px] tracking-[0.2em] text-gray-500 uppercase">Rare Fit Forever</span>
              </div>
            </Link>
            <p className="text-sm font-light mt-2 max-w-xs text-white/50 leading-relaxed">
              Sri Lanka's limited-edition streetwear brand. New drops, rare fits — never restocked.
            </p>
            {countdown && nextDrop && (
              <div className="mt-4 px-4 py-2 border border-[#D4AF37]/30 rounded bg-[#D4AF37]/5 text-[#D4AF37] text-xs tracking-widest uppercase inline-block text-center shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                Next Drop: {countdown.days}d {countdown.hours}h {countdown.minutes}m
              </div>
            )}
            {!countdown && (
               <div className="mt-4 px-4 py-2 border border-[#D4AF37]/30 rounded bg-[#D4AF37]/5 text-[#D4AF37] text-[10px] tracking-widest font-semibold uppercase inline-block text-center">
                 Next drop loading...
               </div>
            )}
          </div>

          {/* Shop Column */}
          <div className="flex flex-col gap-3">
            <h3 className="font-bold text-sm tracking-[0.2em] text-white uppercase mb-2">Shop</h3>
            <Link to="/shopping/product-list" className="text-sm hover:text-[#D4AF37] transition-all">All products</Link>
            <Link to="/shopping/product-list?category=drops" className="text-sm hover:text-[#D4AF37] transition-all">Current drop</Link>
            <Link to="/shopping/product-list?category=archive" className="text-sm hover:text-[#D4AF37] transition-all">Drop archive</Link>
            <Link to="/shopping/product-list?category=unisex" className="text-sm hover:text-[#D4AF37] transition-all">Unisex</Link>
            <Link to="/shopping/product-list?category=boys" className="text-sm hover:text-[#D4AF37] transition-all">Boys</Link>
            <Link to="/shopping/product-list?category=girls" className="text-sm hover:text-[#D4AF37] transition-all">Girls</Link>
          </div>

          {/* Account Column */}
          <div className="flex flex-col gap-3">
            <h3 className="font-bold text-sm tracking-[0.2em] text-white uppercase mb-2">Account</h3>
            <Link to="/shopping/orders" className="text-sm hover:text-[#D4AF37] transition-all">My orders</Link>
            <Link to="/shopping/orders" className="text-sm hover:text-[#D4AF37] transition-all">Order tracking</Link>
            <Link to="/shopping/wishlist" className="text-sm hover:text-[#D4AF37] transition-all">Wishlist</Link>
            <Link to="/shopping/notifications" className="text-sm hover:text-[#D4AF37] transition-all">Notifications</Link>
            <Link to="/shopping/account" className="text-sm hover:text-[#D4AF37] transition-all">My account</Link>
          </div>

          {/* Info Column */}
          <div className="flex flex-col gap-3">
            <h3 className="font-bold text-sm tracking-[0.2em] text-white uppercase mb-2">Info</h3>
            <Link to="#" className="text-sm hover:text-[#D4AF37] transition-all">How drops work</Link>
            <Link to="#" className="text-sm hover:text-[#D4AF37] transition-all">Payment guide</Link>
            <Link to="#" className="text-sm hover:text-[#D4AF37] transition-all">Shipping policy</Link>
            <Link to="#" className="text-sm hover:text-[#D4AF37] transition-all">Returns & exchanges</Link>
            <Link to="#" className="text-sm hover:text-[#D4AF37] transition-all">Contact us</Link>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-6 border-t border-[#D4AF37]/10 text-xs">
          <div className="flex flex-col md:flex-row items-center gap-4 mb-4 md:mb-0 text-gray-500">
            <p>&copy; {new Date().getFullYear()} Saga Elite. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link to="#" className="hover:text-white transition-all">Privacy policy</Link>
              <Link to="#" className="hover:text-white transition-all">Terms of use</Link>
            </div>
          </div>
          
          <div className="flex gap-2">
            {["Manual transfer", "PayHere", "GPay", "LankaPay"].map((method) => (
              <span key={method} className="px-3 py-1 border border-gray-700 bg-gray-900 rounded-[4px] text-[10px] tracking-wider uppercase text-gray-400">
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default MainFooter;
