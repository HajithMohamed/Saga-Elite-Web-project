import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { getAllDrops } from "@/store/admin/drop-slice";
import { CONTACT_INFO } from "@/config";

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
        
        {/* Brand & Countdown - Preserved for backward compatibility */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#D4AF37]/10 pb-8 mb-8 gap-4">
          <Link to="/shopping/home" className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-widest text-[#D4AF37] uppercase">Saga Elite</span>
              <span className="text-[10px] tracking-[0.2em] text-gray-500 uppercase">Rare Fit Forever</span>
            </div>
          </Link>
          <div className="flex flex-col md:items-end text-sm font-light text-white/50">
            <span className="mb-2">Sri Lanka's limited-edition streetwear brand.</span>
            {countdown && nextDrop ? (
              <div className="px-4 py-2 border border-[#D4AF37]/30 rounded bg-[#D4AF37]/5 text-[#D4AF37] text-xs tracking-widest uppercase inline-block text-center shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                Next Drop: {countdown.days}d {countdown.hours}h {countdown.minutes}m
              </div>
            ) : (
               <div className="px-4 py-2 border border-[#D4AF37]/30 rounded bg-[#D4AF37]/5 text-[#D4AF37] text-[10px] tracking-widest font-semibold uppercase inline-block text-center">
                 Next drop loading...
               </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Shop Column */}
          <div className="flex flex-col gap-3">
            <h3 className="font-bold text-sm tracking-[0.2em] text-white uppercase mb-2">Shop</h3>
            <Link to="/shopping/product-list" className="text-sm hover:text-[#D4AF37] transition-all">All Products</Link>
            <Link to="/shopping/product-list?sort=newest" className="text-sm hover:text-[#D4AF37] transition-all">New Arrivals</Link>
            <Link to="/shopping/product-list?sale=true" className="text-sm hover:text-[#D4AF37] transition-all">Sale Items</Link>
          </div>

          {/* Account Column */}
          <div className="flex flex-col gap-3">
            <h3 className="font-bold text-sm tracking-[0.2em] text-white uppercase mb-2">Account</h3>
            <Link to="/shopping/orders" className="text-sm hover:text-[#D4AF37] transition-all">My Orders</Link>
            <Link to="/account/my-reviews" className="text-sm hover:text-[#D4AF37] transition-all">My Reviews</Link>
            <Link to="/shopping/account" className="text-sm hover:text-[#D4AF37] transition-all">My Profile</Link>
          </div>

          {/* Support Column */}
          <div className="flex flex-col gap-3">
            <h3 className="font-bold text-sm tracking-[0.2em] text-white uppercase mb-2">Support</h3>
            <Link to="/contact" className="text-sm hover:text-[#D4AF37] transition-all">Contact Us</Link>
            <Link to="/about" className="text-sm hover:text-[#D4AF37] transition-all">About Us</Link>
            <a href={`https://wa.me/${CONTACT_INFO.whatsapp.replace(/\+/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-sm hover:text-[#D4AF37] transition-all">WhatsApp Us</a>
            <a href={CONTACT_INFO.socials.instagram} target="_blank" rel="noopener noreferrer" className="text-sm hover:text-[#D4AF37] transition-all">Instagram</a>
            <a href={CONTACT_INFO.socials.facebook} target="_blank" rel="noopener noreferrer" className="text-sm hover:text-[#D4AF37] transition-all">Facebook</a>
            <a href={CONTACT_INFO.socials.tiktok} target="_blank" rel="noopener noreferrer" className="text-sm hover:text-[#D4AF37] transition-all">TikTok</a>
          </div>

          {/* Legal Column */}
          <div className="flex flex-col gap-3">
            <h3 className="font-bold text-sm tracking-[0.2em] text-white uppercase mb-2">Legal</h3>
            <Link to="/legal/privacy-policy" className="text-sm hover:text-[#D4AF37] transition-all">Privacy Policy</Link>
            <Link to="/legal/terms-and-conditions" className="text-sm hover:text-[#D4AF37] transition-all">Terms & Conditions</Link>
            <Link to="/legal/refund-policy" className="text-sm hover:text-[#D4AF37] transition-all">Refund Policy</Link>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="flex flex-col pt-6 border-t border-[#D4AF37]/10 text-xs gap-4">
          <div className="flex items-center gap-3 text-gray-400">
            <span className="uppercase tracking-widest text-[10px] font-bold">We accept:</span>
            <div className="flex gap-2">
              {["Visa", "Mastercard", "AMEX", "eZ Cash", "Genie", "Bank Transfer"].map((method) => (
                <span key={method} className="px-2 py-1 border border-gray-700 bg-gray-900 rounded-[4px] text-[10px] tracking-wider uppercase text-gray-500">
                  {method}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-gray-500 text-[10px]">
            <p>&copy; {new Date().getFullYear()} Saga Elite. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link to="/legal/privacy-policy" className="hover:text-white transition-all">Privacy Policy</Link>
              <span>&middot;</span>
              <Link to="/legal/terms-and-conditions" className="hover:text-white transition-all">Terms & Conditions</Link>
              <span>&middot;</span>
              <Link to="/legal/refund-policy" className="hover:text-white transition-all">Refund Policy</Link>
              <span>&middot;</span>
              <Link to="/legal/delivery-policy" className="hover:text-white transition-all">Delivery Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default MainFooter;
