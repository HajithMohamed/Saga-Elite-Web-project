import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, LayoutGrid, Heart, User } from 'lucide-react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';

const AnimatedBadge = ({ count }) => {
  if (!count || count <= 0) return null;
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={count}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: [0.6, 1.2, 1], opacity: 1 }}
        exit={{ scale: 0.6, opacity: 0 }}
        className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 inline-flex items-center justify-center rounded-full bg-[#f2ca50] text-[#1b1c1c] se-mono text-[9px] font-semibold z-10"
      >
        {count > 99 ? '99+' : count}
      </motion.span>
    </AnimatePresence>
  );
};

const MobileBottomNav = () => {
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { items: wishlistItems } = useSelector((state) => state.cart.wishlist || { items: [] });
  const wishlistCount = wishlistItems?.length || 0;

  const tabs = [
    { id: 'home', to: '/shopping/home', icon: Home, label: 'Home' },
    { id: 'search', to: '/shopping/search', icon: Search, label: 'Search' },
    { id: 'categories', to: '/shopping/product-list', icon: LayoutGrid, label: 'Categories' },
    { id: 'wishlist', to: '/shopping/wishlist', icon: Heart, label: 'Wishlist', badge: wishlistCount },
    { id: 'account', to: user ? '/shopping/account' : '/auth/login', icon: User, label: 'Account' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-[#4d4635] pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.to || (tab.id === 'categories' && location.pathname.includes('/product-list'));
          const Icon = tab.icon;
          return (
            <Link
              key={tab.id}
              to={tab.to}
              className={`relative flex flex-col items-center justify-center w-full h-full transition-colors ${
                isActive ? 'text-[#f2ca50]' : 'text-[#d0c5af] hover:text-[#e5e2e1]'
              }`}
            >
              <div className="relative">
                <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                {tab.badge !== undefined && <AnimatedBadge count={tab.badge} />}
              </div>
              <span className="se-label mt-1 text-[9px] tracking-[0.15em]">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
