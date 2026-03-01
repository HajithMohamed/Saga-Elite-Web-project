import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, User, Menu } from 'lucide-react';

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-black text-white border-b border-[#D4AF37]/20 shadow-sm">
      <div className="container mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
        {/* Left: Mobile Menu */}
        <div className="md:hidden flex items-center">
          <button className="text-[#D4AF37] hover:text-white transition-colors">
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Center/Left: Logo */}
        <Link to="/shopping/home" className="flex items-center gap-3">
          <img 
            src="/Logo.jpeg" 
            alt="Saga Elite Logo" 
            className="h-12 w-12 object-cover rounded-md"
          />
          <span className="hidden md:block font-bold text-xl tracking-widest text-[#D4AF37] uppercase">
            Saga Elite
          </span>
        </Link>

        {/* Center: Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium uppercase tracking-widest">
          <Link to="/shopping/home" className="hover:text-[#D4AF37] transition-colors">Home</Link>
          <Link to="/shopping/product-list?category=drops" className="hover:text-[#D4AF37] transition-colors">Latest Drop</Link>
          <Link to="/shopping/product-list?category=unisex" className="hover:text-[#D4AF37] transition-colors">Unisex</Link>
          <Link to="/shopping/product-list?category=archive" className="hover:text-[#D4AF37] transition-colors text-gray-500">Archive</Link>
        </nav>

        {/* Right: Icons */}
        <div className="flex items-center gap-6">
          <Link to="/shopping/checkout" className="relative text-white hover:text-[#D4AF37] transition-colors">
            <ShoppingCart className="w-6 h-6" />
            <span className="absolute -top-2 -right-2 bg-[#D4AF37] text-black text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
              0
            </span>
          </Link>
          <Link to="/shopping/account" className="text-white hover:text-[#D4AF37] transition-colors">
            <User className="w-6 h-6" />
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;

