import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, LogOut, Settings, X, Heart, Star, CreditCard, Search } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { logoutUserAction } from '@/store/auth-slice';
import { toast } from '@/hooks/use-toast';
import NotificationsDropdown from '@/components/common-components/NotificationsDropdown';
import { useAuthDrawer } from '@/components/auth-components/AuthDrawer';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { open: openAuthDrawer } = useAuthDrawer();
  const { currentPayment } = useSelector((state) => state.manualPayment || {});
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { totalQuantity } = useSelector((state) => state.cart.cart || {});
  const { items: wishlistItems } = useSelector((state) => state.cart.wishlist || { items: [] });
  const cartCount = totalQuantity || 0;
  const wishlistCount = wishlistItems?.length || 0;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const hasPendingPayment =
    currentPayment?.status === 'pending_payment' || currentPayment?.status === 'proof_submitted';

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
      toast({
        title: 'Signed out',
        description: 'See you next time.',
        variant: 'success',
      });
      navigate('/auth/login');
    } catch (err) {
      toast({
        title: 'Logout failed',
        description: err?.message || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <header className={`sticky top-0 z-50 w-full text-white transition-all duration-300 ${scrolled ? 'bg-black/50 backdrop-blur-xl border-b border-[#D4AF37]/15 shadow-xl' : 'bg-transparent border-b border-transparent'}`}>
      <div className="container mx-auto px-4 md:px-6 h-20 flex items-center justify-between">

        {/* Left: Mobile Menu */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-[#D4AF37] hover:text-white transition-colors"
          >
            {menuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Logo */}
        <Link to="/shopping/home" className="flex items-center gap-3">
          <img
            src="/LOGO.png"
            alt="Saga Elite Logo"
            className="h-12 w-12 object-cover rounded-md"
          />
          <span className="hidden md:block font-bold text-xl tracking-widest text-[#D4AF37] uppercase">
            Saga Elite
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium uppercase tracking-widest">
          <Link to="/shopping/home" className="relative group se-label text-[11px] tracking-[0.22em] text-[#d0c5af] hover:text-[#f2ca50] transition-colors duration-200">
            <>Home<span className="absolute -bottom-0.5 left-0 h-px w-0 bg-[#f2ca50] transition-all duration-300 group-hover:w-full [box-shadow:0_0_6px_rgba(242,202,80,0.7)]" /></>
          </Link>
          <Link to="/shopping/product-list?category=Ladies" className="relative group text-sm tracking-[0.22em] uppercase font-bold text-[#d0c5af] hover:text-[#f2ca50] transition-colors duration-200">
    Ladies<span className="absolute -bottom-2 left-0 h-[2px] w-0 bg-[#f2ca50] transition-all duration-300 group-hover:w-full [box-shadow:0_0_8px_rgba(242,202,80,0.8)]" />
  </Link>
  <Link to="/shopping/product-list?category=Gents" className="relative group text-sm tracking-[0.22em] uppercase font-bold text-[#d0c5af] hover:text-[#f2ca50] transition-colors duration-200">
    Gents<span className="absolute -bottom-2 left-0 h-[2px] w-0 bg-[#f2ca50] transition-all duration-300 group-hover:w-full [box-shadow:0_0_8px_rgba(242,202,80,0.8)]" />
  </Link>
  <Link to="/shopping/product-list?category=unisex" className="relative group text-sm tracking-[0.22em] uppercase font-bold text-[#d0c5af] hover:text-[#f2ca50] transition-colors duration-200">
    Unisex<span className="absolute -bottom-2 left-0 h-[2px] w-0 bg-[#f2ca50] transition-all duration-300 group-hover:w-full [box-shadow:0_0_8px_rgba(242,202,80,0.8)]" />
  </Link>
          <Link to="/shopping/product-list?category=archive" className="relative group se-label text-[11px] tracking-[0.22em] text-[#d0c5af] hover:text-[#f2ca50] transition-colors duration-200">
            <>Archive<span className="absolute -bottom-0.5 left-0 h-px w-0 bg-[#f2ca50] transition-all duration-300 group-hover:w-full [box-shadow:0_0_6px_rgba(242,202,80,0.7)]" /></>
          </Link>
          <Link to="/shopping/drops" className="relative group se-label text-[11px] tracking-[0.22em] text-[#d0c5af] hover:text-[#f2ca50] transition-colors duration-200">
            <>Drops<span className="absolute -bottom-0.5 left-0 h-px w-0 bg-[#f2ca50] transition-all duration-300 group-hover:w-full [box-shadow:0_0_6px_rgba(242,202,80,0.7)]" /></>
          </Link>
          <Link to="/about" className="relative group se-label text-[11px] tracking-[0.22em] text-[#d0c5af] hover:text-[#f2ca50] transition-colors duration-200">
            <>About<span className="absolute -bottom-0.5 left-0 h-px w-0 bg-[#f2ca50] transition-all duration-300 group-hover:w-full [box-shadow:0_0_6px_rgba(242,202,80,0.7)]" /></>
          </Link>
        </nav>

        {/* Right: Icons */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('/shopping/product-list')}
            aria-label="Search products"
            className="text-[#d0c5af] hover:text-[#f2ca50] transition-colors"
          >
            <Search className="w-5 h-5" strokeWidth={1.5} />
          </button>
          <NotificationsDropdown />
          <Link
            to="/shopping/wishlist"
            className="relative text-white hover:text-[#D4AF37] transition-colors"
          >
            <Heart className="w-6 h-6" />
            {wishlistCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#D4AF37] text-black text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {wishlistCount}
              </span>
            )}
          </Link>
          <Link
            to="/shopping/cart"
            className="relative text-white hover:text-[#D4AF37] transition-colors"
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="absolute -top-2 -right-2 bg-[#D4AF37] text-black text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
              {cartCount}
            </span>
          </Link>

          {/* User icon — opens drawer if guest, dropdown if authenticated */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => isAuthenticated ? setUserMenuOpen(!userMenuOpen) : openAuthDrawer('login')}
              className="text-white hover:text-[#D4AF37] transition-colors focus:outline-none"
              aria-label={isAuthenticated ? 'Account menu' : 'Sign in'}
            >
              {user?.profilePicture ? (
                <div className="relative">
                  <img
                    src={user.profilePicture}
                    alt="avatar"
                    className="w-8 h-8 rounded-full object-cover border border-[#D4AF37]/40"
                  />
                  {hasPendingPayment && (
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-black" />
                  )}
                </div>
              ) : (
                <div className="relative">
                  <User className="w-6 h-6" />
                  {hasPendingPayment && (
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-black" />
                  )}
                </div>
              )}
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-[#0a0a0a] border border-[#D4AF37]/20 rounded shadow-xl divide-y divide-[#D4AF37]/10">
                <div className="px-4 py-3">
                  <p className="text-xs text-gray-500 uppercase tracking-widest">
                    Signed in as
                  </p>
                  <p className="text-sm text-white font-medium truncate mt-0.5">
                    {user?.email || 'Guest'}
                  </p>
                </div>
                {hasPendingPayment && (
                  <div className="px-4 py-3 bg-amber-500/10 border-l-2 border-amber-500">
                    <p className="text-xs text-amber-500 font-medium mb-1">
                      ⚠️ Pending payment — expires in {hours}h {minutes}m
                    </p>
                    <Link
                      to={`/shopping/manual-payment/${encodeURIComponent(currentPayment?.slug || currentPayment?.referenceNumber || '')}`}
                      onClick={() => setUserMenuOpen(false)}
                      className="text-[10px] uppercase font-bold text-amber-400 hover:text-amber-300 tracking-wider"
                    >
                      → Complete payment
                    </Link>
                  </div>
                )}
                <div className="py-1">
                  <Link
                    to="/shopping/account"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-[#D4AF37] hover:bg-white/5 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    My Account
                  </Link>
                  <Link
                    to="/shopping/orders"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-[#D4AF37] hover:bg-white/5 transition-colors"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    My Orders
                  </Link>
                  <Link
                    to="/account/my-reviews"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-[#D4AF37] hover:bg-white/5 transition-colors"
                  >
                    <Star className="w-4 h-4" />
                    My Reviews
                  </Link>
                  <Link
                    to="/account/payments"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-[#D4AF37] hover:bg-white/5 transition-colors"
                  >
                    <CreditCard className="w-4 h-4" />
                    Payment History
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-red-400 hover:bg-white/5 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '-100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '-100%' }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[100] bg-[#0a0a0a] flex flex-col md:hidden"
          >
            {/* Header row */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#4d4635]/50">
              <Link to="/shopping/home" onClick={() => setMenuOpen(false)} className="flex items-center gap-3">
                <img src="/LOGO.png" alt="Saga Elite" className="h-10 w-10 object-cover" />
                <span className="se-label text-[#f2ca50] text-[13px] tracking-[0.25em]">
                  SAGA ELITE
                </span>
              </Link>
              <button onClick={() => setMenuOpen(false)} className="text-[#d0c5af] hover:text-white transition-colors" aria-label="Close menu">
                <X className="w-6 h-6" strokeWidth={1.5} />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 flex flex-col justify-center px-8 gap-2">
              {[
                { label: 'Home',        to: '/shopping/home' },
                { label: 'Gents',       to: '/shopping/product-list?category=Gents' },
                { label: 'Ladies',      to: '/shopping/product-list?category=Ladies' },
                { label: 'Unisex',      to: '/shopping/product-list?category=Unisex' },
                { label: 'Drops',       to: '/shopping/drops' },
                { label: 'About',       to: '/about' },
              ].map((item, i) => (
                <motion.div
                  key={item.to}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.06, duration: 0.4 }}
                >
                  <Link
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className="block se-serif text-[#e5e2e1] text-4xl leading-[1.1] hover:text-[#f2ca50] transition-colors py-2 border-b border-[#4d4635]/30"
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </nav>

            {/* Bottom bar */}
            <div className="px-8 py-6 border-t border-[#4d4635]/50">
              <p className="se-mono text-[#4d4635] text-[10px] tracking-widest">
                RARE FIT · FOREVER
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;