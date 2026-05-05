import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Facebook, Instagram, Music2, PinIcon } from "lucide-react";

const MainFooter = () => {
  const location = useLocation();
  const isAdminView = location.pathname.startsWith("/admin");
  const [email, setEmail] = useState("");

  if (isAdminView) return null;

  const cols = [
    {
      title: "Women",
      items: [
        "New Arrivals", "Dresses", "Tops", "Bottoms", "Sarees", "Lingerie", "Accessories", "Sale",
      ],
    },
    {
      title: "Men",
      items: [
        "New Arrivals", "Shirts", "Trousers", "Casual", "Formal", "Accessories", "Sale",
      ],
    },
    {
      title: "Help",
      items: [
        "Track My Order", "Returns & Exchanges", "Size Guide", "FAQ", "Contact Us", "Store Locator",
      ],
    },
  ];

  return (
    <footer role="contentinfo" className="bg-[#2C2C2A] text-[#FAF7F2] mt-10">
      <div className="w-full px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          <div>
            <h3 className="font-display text-xl">SAGA ELITE</h3>
            <p className="text-sm text-muted mt-2">Premium fashion for every Sri Lankan.</p>
            <div className="flex gap-3 mt-4 text-muted">
              <Instagram className="h-5 w-5 hover:text-[#C9A96E]" />
              <Facebook className="h-5 w-5 hover:text-[#C9A96E]" />
              <Music2 className="h-5 w-5 hover:text-[#C9A96E]" />
              <PinIcon className="h-5 w-5 hover:text-[#C9A96E]" />
            </div>
          </div>

          {cols.map((column) => (
            <div key={column.title}>
              <h4 className="text-xs uppercase tracking-[0.2em] text-[#C9A96E] mb-3">{column.title}</h4>
              <div className="space-y-2">
                {column.items.map((item) => (
                  <Link key={`${column.title}-${item}`} to="/shopping/product-list" className="block text-sm text-muted hover:text-[#FAF7F2] transition-all">
                    {item}
                  </Link>
                ))}
              </div>
            </div>
          ))}

          <div>
            <h4 className="font-display text-base">Stay in the loop</h4>
            <p className="text-sm text-muted mt-2">New arrivals, exclusive deals & style tips — straight to your inbox.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setEmail("");
              }}
              className="mt-3"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-[#5F5E5A] bg-[#444441] px-3 py-2 text-sm text-[#FAF7F2] placeholder:text-muted"
              />
              <button className="w-full mt-2 rounded-lg bg-primary hover:bg-primary-hover text-white py-2">Subscribe</button>
            </form>
          </div>
        </div>

        <div className="h-px bg-[#444441] my-8" />
        <div className="flex flex-wrap justify-between gap-4 text-xs text-muted">
          <p>© 2025 Saga Elite (Pvt) Ltd. All rights reserved.</p>
          <div className="flex items-center gap-2">
            {["Visa", "Mastercard", "Amex", "Cash on Delivery"].map((method) => (
              <span key={method} className="px-2 py-1 rounded bg-[#444441] text-[#B4B2A9]">{method}</span>
            ))}
          </div>
          <div className="flex gap-4">
            <Link to="/legal/privacy-policy" className="hover:text-[#FAF7F2]">Privacy Policy</Link>
            <Link to="/legal/terms-and-conditions" className="hover:text-[#FAF7F2]">Terms</Link>
            <Link to="/legal/privacy-policy" className="hover:text-[#FAF7F2]">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default MainFooter;
