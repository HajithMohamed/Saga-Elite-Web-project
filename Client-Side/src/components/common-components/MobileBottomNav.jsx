import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Search, Grid, Heart, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MobileBottomNav = () => {
  const location = useLocation();
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false); // scrolling down
      } else {
        setIsVisible(true);  // scrolling up
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const navItems = [
    { key: "home", label: "Home", icon: Home, to: "/shopping/home" },
    { key: "search", label: "Search", icon: Search, to: "/shopping/product-list" },
    { key: "categories", label: "Categories", icon: Grid, to: "/shopping/product-list" },
    { key: "wishlist", label: "Wishlist", icon: Heart, to: "/shopping/account/wishlist" },
    { key: "account", label: "Account", icon: User, to: "/shopping/account" },
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="md:hidden fixed bottom-0 left-0 w-full z-40 pb-safe"
          aria-label="Mobile navigation"
        >
          <div className="bg-page/95 backdrop-blur-[16px] border-t border-ink/5 flex items-center justify-around h-[72px] px-2 shadow-[0_-8px_30px_rgba(0,0,0,0.4)]">
            {navItems.map((item) => {
              const isActive = location.pathname.includes(item.to) || (item.key === 'home' && location.pathname === '/shopping/home');
              return (
                <Link
                  key={item.key}
                  to={item.to}
                  aria-label={item.label}
                  className="flex flex-col items-center justify-center w-full h-full gap-1 group relative"
                >
                  <item.icon 
                    className={`w-6 h-6 transition-all duration-250 ${isActive ? 'text-gold-ink' : 'text-muted group-hover:text-ink'}`} 
                    strokeWidth={isActive ? 2 : 1.5}
                  />
                  <span className={`text-[10px] font-sans transition-colors ${isActive ? 'text-gold-ink font-bold' : 'text-muted group-hover:text-ink'}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div 
                      layoutId="bottomNavIndicator"
                      className="absolute -top-[1px] w-8 h-[2px] bg-gold rounded-full shadow-[0_0_10px_#F2CA50]"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
};

export default MobileBottomNav;
