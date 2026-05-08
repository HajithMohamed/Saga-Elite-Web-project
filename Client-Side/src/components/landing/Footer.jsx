import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="relative bg-[#050505] border-t border-[#4d4635]/40 overflow-hidden">

    {/* Subtle moving gradient background */}
    <div className="absolute inset-0 pointer-events-none"
         style={{
           background: "radial-gradient(ellipse at 20% 80%, rgba(212,175,55,0.04) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(212,175,55,0.03) 0%, transparent 50%)"
         }} />

    {/* Top section — 4 columns */}
    <div className="relative z-10 max-w-[1440px] mx-auto px-6 lg:px-12 pt-16 pb-12 grid grid-cols-2 md:grid-cols-4 gap-10">

      {/* Column 1: Brand */}
      <div className="col-span-2 md:col-span-1">
        <div className="flex items-center gap-3 mb-4">
          <img src="/LOGO.png" alt="Saga Elite" className="h-10 w-10 object-contain" />
          <span className="se-label text-[#f2ca50] text-[13px] tracking-[0.3em]">
            SAGA ELITE
          </span>
        </div>
        <p className="se-body text-[#99907c] text-sm leading-relaxed max-w-[220px]">
          Limited-edition streetwear curated for Sri Lanka's bold generation.
          Rare fit, forever.
        </p>
        <p className="mt-6 se-mono text-[#4d4635] text-[10px] tracking-widest">
          © {new Date().getFullYear()} SAGA ELITE. ALL RIGHTS RESERVED.
        </p>
      </div>

      {/* Column 2: Quick Links */}
      <div>
        <p className="se-label text-[#f2ca50] text-[10px] tracking-[0.35em] mb-5">
          NAVIGATE
        </p>
        <ul className="space-y-3">
          {[
            { label: 'Home',           to: '/shopping/home' },
            { label: 'Shop All',       to: '/shopping/product-list' },
            { label: 'Drops',          to: '/shopping/drops' },
            { label: 'Gents',          to: '/shopping/product-list?category=Gents' },
            { label: 'Ladies',         to: '/shopping/product-list?category=Ladies' },
            { label: 'Unisex',         to: '/shopping/product-list?category=Unisex' },
          ].map(item => (
            <li key={item.to}>
              <Link to={item.to}
                    className="se-body text-[#99907c] text-sm hover:text-[#f2ca50] transition-colors duration-200">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Column 3: Support */}
      <div>
        <p className="se-label text-[#f2ca50] text-[10px] tracking-[0.35em] mb-5">
          SUPPORT
        </p>
        <ul className="space-y-3">
          {[
            { label: 'My Orders',      to: '/shopping/orders' },
            { label: 'Track Order',    to: '/shopping/orders' },
            { label: 'Wishlist',       to: '/shopping/wishlist' },
            { label: 'Contact Us',     to: '/contact' },
            { label: 'About Saga',     to: '/about' },
            { label: 'Membership',     to: '/shopping/account' },
          ].map(item => (
            <li key={item.to}>
              <Link to={item.to}
                    className="se-body text-[#99907c] text-sm hover:text-[#f2ca50] transition-colors duration-200">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Column 4: Social */}
      <div>
        <p className="se-label text-[#f2ca50] text-[10px] tracking-[0.35em] mb-5">
          FOLLOW US
        </p>
        <div className="flex flex-col gap-3">
          {[
            { label: 'Instagram', href: '#', icon: 'IG' },
            { label: 'TikTok',    href: '#', icon: 'TK' },
            { label: 'Facebook',  href: '#', icon: 'FB' },
            { label: 'YouTube',   href: '#', icon: 'YT' },
          ].map(s => (
            <a key={s.label} href={s.href}
               target="_blank" rel="noopener noreferrer"
               className="group flex items-center gap-3 se-body text-[#99907c] text-sm hover:text-[#f2ca50] transition-colors duration-200">
              <span className="w-8 h-8 rounded-sm border border-[#4d4635] group-hover:border-[#f2ca50]/50 group-hover:[box-shadow:0_0_10px_rgba(242,202,80,0.20)] flex items-center justify-center se-mono text-[9px] text-[#4d4635] group-hover:text-[#f2ca50] transition-all duration-200">
                {s.icon}
              </span>
              {s.label}
            </a>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-[#4d4635]/40">
          <p className="se-label text-[#4d4635] text-[10px] tracking-[0.3em]">
            ISLANDWIDE DELIVERY · SECURE CHECKOUT · MYSTERY REWARDS
          </p>
        </div>
      </div>
    </div>

    {/* Bottom bar */}
    <div className="relative z-10 border-t border-[#4d4635]/30 px-6 lg:px-12 py-5 flex flex-col md:flex-row items-center justify-between max-w-[1440px] mx-auto gap-3">
      <p className="se-mono text-[#4d4635] text-[9px] tracking-[0.4em]">
        RARE FIT · FOREVER · EST. 2024
      </p>
      <div className="flex items-center gap-6">
        {['Privacy Policy', 'Terms of Service', 'Refund Policy'].map(item => (
          <a key={item} href="#" className="se-label text-[10px] text-[#4d4635] hover:text-[#99907c] tracking-[0.15em] transition-colors duration-200">
            {item}
          </a>
        ))}
      </div>
    </div>
  </footer>
);

export default Footer;
