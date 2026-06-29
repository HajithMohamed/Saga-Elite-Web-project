import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Menu, LogOut, Settings, X, Heart, Star, CreditCard, Search, ChevronRight } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { logoutUserAction } from '@/store/auth-slice';
import { toast } from '@/hooks/use-toast';
import NotificationsDropdown from '@/components/common-components/NotificationsDropdown';
import { useAuthDrawer } from '@/components/auth-components/AuthDrawer';
import axios from 'axios';
import { API_V1_URL as API_BASE } from '@/lib/api';

const AnnouncementBar = () => {
  const [index, setIndex] = useState(0);
  const announcements = [
    "🚚 Free Islandwide Delivery on eligible orders",
    "✨ New Collection Available",
    "🔥 Exclusive Limited Drops Every Month"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % announcements.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [announcements.length]);

  return (
    <div className="w-full bg-accent text-primary h-[36px] md:h-[40px] flex items-center justify-center overflow-hidden z-50 relative cursor-default hover:[animation-play-state:paused]">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="font-sans text-[12px] md:text-[14px] font-bold tracking-wide"
        >
          {announcements[index]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const userMenuRef = useRef(null);
  const searchRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { open: openAuthDrawer } = useAuthDrawer();
  const { currentPayment } = useSelector((state) => state.manualPayment || {});
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { totalQuantity } = useSelector((state) => state.cart.cart || {});
  const { items: wishlistItems } = useSelector((state) => state.cart.wishlist || { items: [] });
  
  const cartCount = totalQuantity || 0;
  const wishlistCount = wishlistItems?.length || 0;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchExpanded(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shopping/product-list?keyword=${encodeURIComponent(searchQuery)}`);
      setSearchExpanded(false);
    }
  };

  const hasPendingPayment = currentPayment?.status === 'pending_payment' || currentPayment?.status === 'proof_submitted';

  const computeTimeLeft = () => {
    if (!currentPayment?.expiresAt) return { hours: 0, minutes: 0 };
    const diff = new Date(currentPayment.expiresAt) - new Date();
    if (diff <= 0) return { hours: 0, minutes: 0 };
    return {
      hours: Math.floor(diff / (1000 * 60 * 60)),
      minutes: Math.floor((diff / 1000 / 60) % 60),
    };
  };
  const { hours, minutes } = hasPendingPayment ? computeTimeLeft() : { hours: 0, minutes: 0 };

  const handleLogout = async () => {
    setUserMenuOpen(false);
    try {
      await dispatch(logoutUserAction()).unwrap();
      toast({ title: 'Signed out', description: 'See you next time.', variant: 'success' });
      navigate('/');
    } catch (err) {
      toast({ title: 'Logout failed', description: err?.message || 'Please try again.', variant: 'destructive' });
    }
  };

  const navLinks = [
    { label: 'Home', path: '/shopping/home' },
    { label: 'Women', path: '/shopping/product-list?category=Ladies' },
    { label: 'Men', path: '/shopping/product-list?category=Gents' },
    { label: 'Unisex', path: '/shopping/product-list?category=Unisex' },
    { label: 'New Arrivals', path: '/shopping/product-list?category=new' },
    { label: 'Sale', path: '/shopping/product-list?category=sale' },
  ];

  return (
    <div className="sticky top-0 z-50 w-full flex flex-col">
      <AnnouncementBar />
      <header 
        className={`w-full transition-all duration-300 bg-black/80 backdrop-blur-[16px] border-b border-[rgba(255,255,255,0.08)]
        ${scrolled ? 'h-[64px] md:h-[72px]' : 'h-[72px] md:h-[80px]'}`}
      >
        <div className={`h-full max-w-[1280px] mx-auto flex items-center justify-between px-[16px] md:px-[32px] lg:px-[80px]`}>
          
          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setMenuOpen(!menuOpen)} className="text-secondary-foreground hover:text-foreground transition-colors">
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Logo */}
          <Link to="/shopping/home" className="flex items-center gap-3">
            <img src="/LOGO.png" alt="Saga Elite Logo" className={`object-cover rounded-md transition-all duration-300 ${scrolled ? 'h-10 w-10' : 'h-12 w-12'}`} />
            <span className={`hidden md:block font-display font-bold tracking-widest text-accent uppercase transition-all duration-300 ${scrolled ? 'text-lg' : 'text-xl'}`}>
              Saga Elite
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-[12px] font-sans font-bold uppercase tracking-[0.1em]">
            {navLinks.map((link) => {
              const isActive = location.pathname + location.search === link.path || 
                               (link.path === '/shopping/home' && location.pathname === '/shopping/home');
              return (
                <Link 
                  key={link.label} 
                  to={link.path} 
                  className={`relative group py-2 transition-colors duration-200 ${isActive ? 'text-accent' : 'text-secondary-foreground hover:text-accent'}`}
                >
                  {link.label}
                  <span className={`absolute bottom-0 left-0 h-[2px] bg-accent transition-all duration-200 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                </Link>
              );
            })}
          </nav>

          {/* Right Icons */}
          <div className="flex items-center gap-4 md:gap-6">
            
            {/* Expandable Search */}
            <div className="hidden md:flex relative items-center justify-end" ref={searchRef}>
              <AnimatePresence>
                {searchExpanded && (
                  <motion.form 
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: window.innerWidth >= 1024 ? 420 : 320, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onSubmit={handleSearch}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10"
                  >
                    <input 
                      type="text" 
                      placeholder="Search Saga Elite..." 
                      className="w-full h-10 bg-surface border border-border rounded-full pl-4 pr-12 text-sm text-foreground focus:outline-none focus:border-accent transition-colors"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                    />
                  </motion.form>
                )}
              </AnimatePresence>
              <button 
                onClick={() => setSearchExpanded(!searchExpanded)} 
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors z-20 ${searchExpanded ? 'text-accent' : 'text-secondary-foreground hover:text-foreground'}`}
              >
                <Search className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>

            {/* Mobile Search Icon */}
            <button 
              className="md:hidden w-8 h-8 rounded-full flex items-center justify-center text-secondary-foreground hover:text-foreground"
              onClick={() => navigate('/shopping/product-list')}
            >
              <Search className="w-5 h-5" strokeWidth={2} />
            </button>

            {/* Wishlist */}
            <Link to="/shopping/wishlist" className="relative w-8 h-8 rounded-full bg-surface/50 hover:bg-surface flex items-center justify-center text-foreground hover:text-accent transition-all">
              <Heart className="w-4 h-4" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-primary text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link to="/shopping/cart" className="relative w-8 h-8 rounded-full bg-surface/50 hover:bg-surface flex items-center justify-center text-foreground hover:text-accent transition-all">
              <ShoppingCart className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 bg-accent text-primary text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            </Link>

            {/* User Account */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => isAuthenticated ? setUserMenuOpen(!userMenuOpen) : openAuthDrawer('login')}
                className="relative w-8 h-8 rounded-full bg-surface/50 hover:bg-surface flex items-center justify-center text-foreground hover:text-accent transition-all"
              >
                {user?.profilePicture ? (
                  <img src={user.profilePicture} alt="avatar" className="w-full h-full rounded-full object-cover border border-border" />
                ) : (
                  <User className="w-4 h-4" />
                )}
                {hasPendingPayment && <span className="absolute top-0 right-0 w-2 h-2 bg-amber-500 rounded-full border border-primary" />}
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-4 w-64 bg-surface border border-border rounded-lg shadow-large divide-y divide-border overflow-hidden z-50"
                  >
                    <div className="px-4 py-3">
                      <p className="text-[10px] text-secondary-foreground uppercase tracking-widest font-bold">Signed in as</p>
                      <p className="text-sm text-foreground font-medium truncate mt-1">{user?.email || 'Guest'}</p>
                    </div>
                    <div className="py-2">
                      <Link to="/shopping/account" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-secondary-foreground hover:text-accent hover:bg-card transition-colors">
                        <Settings className="w-4 h-4" /> My Account
                      </Link>
                      <Link to="/shopping/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-secondary-foreground hover:text-accent hover:bg-card transition-colors">
                        <ShoppingCart className="w-4 h-4" /> My Orders
                      </Link>
                      <Link to="/account/my-reviews" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-secondary-foreground hover:text-accent hover:bg-card transition-colors">
                        <Star className="w-4 h-4" /> My Reviews
                      </Link>
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-secondary-foreground hover:text-error hover:bg-card transition-colors">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, x: '-100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '-100%' }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-0 z-[100] bg-background flex flex-col md:hidden"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                <Link to="/shopping/home" onClick={() => setMenuOpen(false)} className="flex items-center gap-3">
                  <img src="/LOGO.png" alt="Saga Elite" className="h-10 w-10 object-cover" />
                  <span className="font-display font-bold text-accent text-[16px] uppercase tracking-widest">SAGA ELITE</span>
                </Link>
                <button onClick={() => setMenuOpen(false)} className="text-secondary-foreground hover:text-foreground">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <nav className="flex-1 flex flex-col justify-center px-8 gap-4">
                {navLinks.map((link, i) => (
                  <motion.div key={link.path} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.06 }}>
                    <Link to={link.path} onClick={() => setMenuOpen(false)} className="block font-display font-bold text-foreground text-4xl hover:text-accent transition-colors py-2 border-b border-border">
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </div>
  );
};

export default Header;