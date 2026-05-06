import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Facebook, Instagram, Music2 } from "lucide-react";

const MainFooter = () => {
  const location = useLocation();
  const isAdminView = location.pathname.startsWith("/admin");
  const [email, setEmail] = useState("");

  if (isAdminView) return null;

  const cols = [
    {
      title: "Quick Nav",
      items: [
        { label: "Shop", path: "/shopping/product-list" },
        { label: "Drops", path: "/shopping/product-list?type=drop" },
        { label: "About", path: "/about" },
        { label: "Contact", path: "/contact" },
      ],
    },
    {
      title: "Legal",
      items: [
        { label: "Privacy Policy", path: "/legal/privacy-policy" },
        { label: "Terms & Conditions", path: "/legal/terms-and-conditions" },
        { label: "Returns", path: "/legal/returns" },
      ],
    },
  ];

  return (
    <footer role="contentinfo" className="bg-[#0e0e0e] text-[#e5e2e1] mt-10 border-t border-[#4d4635]">
      <div className="w-full max-w-[1280px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <img src="/LOGO.png" alt="Saga Elite Logo" className="h-10 w-10 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              <h3 className="font-display font-black tracking-[0.2em] text-xl">SAGA ELITE</h3>
            </div>
            <p className="text-sm text-[#99907c] mt-4">Rare Fit. Forever.</p>
            <div className="flex gap-4 mt-6 text-[#99907c]">
              <a href="#" className="hover:text-[#f2ca50] transition-colors"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="hover:text-[#f2ca50] transition-colors"><Facebook className="h-5 w-5" /></a>
              <a href="#" className="hover:text-[#f2ca50] transition-colors"><Music2 className="h-5 w-5" /></a>
            </div>
          </div>

          {cols.map((column) => (
            <div key={column.title}>
              <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f2ca50] mb-4">{column.title}</h4>
              <div className="space-y-3">
                {column.items.map((item) => (
                  <Link key={item.label} to={item.path} className="block text-sm text-[#99907c] hover:text-[#e5e2e1] transition-all">
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f2ca50] mb-4">Stay in the loop</h4>
            <p className="text-sm text-[#99907c] mt-2">New arrivals, exclusive drops & style tips — straight to your inbox.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setEmail("");
              }}
              className="mt-4"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full rounded-none border-b border-[#4d4635] bg-transparent outline-none px-0 py-3 text-sm text-[#e5e2e1] placeholder:text-[#99907c] focus:border-[#f2ca50] transition-colors"
              />
              <button className="w-full mt-4 h-12 bg-[#f2ca50] hover:bg-[#ffe088] text-[#1b1c1c] uppercase text-[11px] tracking-[0.28em] transition-colors font-bold">
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="h-px bg-[#4d4635] my-8" />
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 text-xs text-[#99907c]">
          <p>© 2026 Saga Elite. All rights reserved.</p>
          <div className="flex items-center gap-3">
            {["Visa", "Mastercard", "Bank Transfer"].map((method) => (
              <span key={method} className="px-2 py-1 rounded-sm border border-[#4d4635] text-[10px] uppercase tracking-wider">{method}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default MainFooter;
