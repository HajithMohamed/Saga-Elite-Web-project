import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Facebook, Instagram, Music2 } from "lucide-react";

const MainFooter = () => {
  const location = useLocation();
  const isAdminView = location.pathname.startsWith("/admin");
  const [email, setEmail] = useState("");

  if (isAdminView) return null;

  return (
    <footer role="contentinfo" className="bg-[#0e0e0e] text-[#e5e2e1] mt-10 border-t border-[#4d4635]/60">
      <div className="w-full px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <img src="/LOGO.png" alt="Saga Elite Logo" className="h-10 w-10 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <h3 className="font-display font-black tracking-[0.2em] text-xl text-[#e5e2e1]">SAGA ELITE</h3>
            </div>
            <p className="text-sm text-[#d0c5af] mt-4">Rare Fit. Forever.</p>
            <div className="flex gap-4 mt-6 text-[#d0c5af]">
              <a href="#" className="hover:text-[#f2ca50] transition-colors"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="hover:text-[#f2ca50] transition-colors"><Facebook className="h-5 w-5" /></a>
              <a href="#" className="hover:text-[#f2ca50] transition-colors"><Music2 className="h-5 w-5" /></a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f2ca50] mb-4">Shop</h4>
            <div className="space-y-3">
              <Link to="/shopping/product-list?category=ladies" className="block text-sm text-[#d0c5af] hover:text-[#e5e2e1] transition-all">Ladies</Link>
              <Link to="/shopping/product-list?category=gents" className="block text-sm text-[#d0c5af] hover:text-[#e5e2e1] transition-all">Gents</Link>
              <Link to="/shopping/product-list?category=unisex" className="block text-sm text-[#d0c5af] hover:text-[#e5e2e1] transition-all">Unisex</Link>
              <Link to="/shopping/product-list?filter=drops" className="block text-sm text-[#d0c5af] hover:text-[#e5e2e1] transition-all">Drops</Link>
              <Link to="/shopping/product-list?filter=archive" className="block text-sm text-[#d0c5af] hover:text-[#e5e2e1] transition-all">Archive</Link>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f2ca50] mb-4">Help</h4>
            <div className="space-y-3">
              <Link to="/contact" className="block text-sm text-[#d0c5af] hover:text-[#e5e2e1] transition-all">Contact</Link>
              <Link to="/about" className="block text-sm text-[#d0c5af] hover:text-[#e5e2e1] transition-all">About</Link>
              <Link to="/legal/delivery-policy" className="block text-sm text-[#d0c5af] hover:text-[#e5e2e1] transition-all">Delivery Policy</Link>
              <Link to="/legal/refund-policy" className="block text-sm text-[#d0c5af] hover:text-[#e5e2e1] transition-all">Refund Policy</Link>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f2ca50] mb-4">Legal</h4>
            <div className="space-y-3">
              <Link to="/legal/privacy-policy" className="block text-sm text-[#d0c5af] hover:text-[#e5e2e1] transition-all">Privacy Policy</Link>
              <Link to="/legal/terms-and-conditions" className="block text-sm text-[#d0c5af] hover:text-[#e5e2e1] transition-all">Terms & Conditions</Link>
            </div>
          </div>
        </div>

        <div className="h-px bg-[#4d4635]/60 my-8" />
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
          <div className="mb-3 sm:mb-0 text-[#d0c5af]">
            Free delivery island-wide  ·  24h payment window  ·  Verified purchase reviews
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded-sm border border-[#4d4635] text-[#e5e2e1] text-[10px] uppercase tracking-wider">Visa</span>
              <span className="px-2 py-1 rounded-sm border border-[#4d4635] text-[#e5e2e1] text-[10px] uppercase tracking-wider">Mastercard</span>
              <span className="px-2 py-1 rounded-sm border border-[#4d4635] text-[#e5e2e1] text-[10px] uppercase tracking-wider">Bank Transfer</span>
            </div>
            <p className="text-[#d0c5af]">© 2026 Saga Elite. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default MainFooter;
