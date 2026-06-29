import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Heart, ShoppingCart, User } from 'lucide-react';
import { useSelector } from 'react-redux';
import { cn } from '@/lib/utils';
import { useAuthDrawer } from '@/components/auth-components/AuthDrawer';

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { open: openAuthDrawer } = useAuthDrawer();
  
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { totalQuantity } = useSelector((state) => state.cart.cart || {});
  const { items: wishlistItems } = useSelector((state) => state.cart.wishlist || { items: [] });
  
  const cartCount = totalQuantity || 0;
  const wishlistCount = wishlistItems?.length || 0;

  const NAV_ITEMS = [
    { label: 'Home', icon: Home, path: '/shopping/home' },
    { label: 'Search', icon: Search, action: () => navigate('/shopping/product-list') },
    { label: 'Wishlist', icon: Heart, path: '/shopping/wishlist', badge: wishlistCount },
    { label: 'Cart', icon: ShoppingCart, path: '/shopping/cart', badge: cartCount },
    { label: 'Profile', icon: User, action: () => isAuthenticated ? navigate('/account/profile') : openAuthDrawer('login') },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-[#0a0a0a]/90 backdrop-blur-[16px] border-t border-white/10 pb-safe">
      <nav className="flex items-center justify-between px-2 h-[64px]">
        {NAV_ITEMS.map((item, i) => {
          const isActive = item.path ? location.pathname === item.path : false;
          
          const content = (
            <div className="relative flex flex-col items-center justify-center w-[48px] h-[48px]">
              <item.icon 
                className={cn(
                  "w-6 h-6 transition-colors duration-250",
                  isActive ? "text-[#f2ca50]" : "text-[#99907c]"
                )} 
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              <span 
                className={cn(
                  "text-[10px] mt-1 font-medium transition-colors duration-250",
                  isActive ? "text-[#f2ca50]" : "text-[#99907c]"
                )}
              >
                {item.label}
              </span>
              
              {/* Badge */}
              {item.badge > 0 && (
                <span className="absolute top-0 right-1 bg-[#f2ca50] text-[#0a0a0a] text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-[0_0_8px_rgba(242,202,80,0.4)]">
                  {item.badge}
                </span>
              )}
            </div>
          );

          if (item.action) {
            return (
              <button
                key={i}
                onClick={item.action}
                className="flex-1 flex justify-center items-center"
                aria-label={item.label}
              >
                {content}
              </button>
            );
          }

          return (
            <Link 
              key={i} 
              to={item.path} 
              className="flex-1 flex justify-center items-center"
              aria-label={item.label}
            >
              {content}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default MobileBottomNav;
