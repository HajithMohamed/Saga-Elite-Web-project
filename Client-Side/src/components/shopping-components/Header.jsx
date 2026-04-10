import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, LogOut, Settings, X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUserAction } from '@/store/auth-slice';
import { toast } from '@/hooks/use-toast';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
<<<<<<< HEAD
  const { items: cartItems } = useSelector((state) => state.cart.cart || {});
  const cartCount = cartItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
=======
  const { cart } = useSelector((state) => state.order);
  const cartCount = cart?.reduce((total, item) => total + item.quantity, 0) || 0;
>>>>>>> 8fdbd2946fdad1c686ebf23637121492c0fefd87

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    <header className="sticky top-0 z-50 w-full bg-black text-white border-b border-[#D4AF37]/20 shadow-sm">
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
          <Link
            to="/shopping/home"
            className="hover:text-[#D4AF37] transition-colors"
          >
            Home
          </Link>
          <Link
            to="/shopping/product-list?category=drops"
            className="hover:text-[#D4AF37] transition-colors"
          >
            Latest Drop
          </Link>
          <Link
            to="/shopping/product-list?category=unisex"
            className="hover:text-[#D4AF37] transition-colors"
          >
            Unisex
          </Link>
          <Link
            to="/shopping/product-list?category=archive"
            className="hover:text-[#D4AF37] transition-colors text-gray-500"
          >
            Archive
          </Link>
        </nav>

        {/* Right: Icons */}
        <div className="flex items-center gap-6">
          <Link
            to="/shopping/checkout"
            className="relative text-white hover:text-[#D4AF37] transition-colors"
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="absolute -top-2 -right-2 bg-[#D4AF37] text-black text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
              {cartCount}
            </span>
          </Link>

          {/* User dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="text-white hover:text-[#D4AF37] transition-colors focus:outline-none"
            >
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt="avatar"
                  className="w-8 h-8 rounded-full object-cover border border-[#D4AF37]/40"
                />
              ) : (
                <User className="w-6 h-6" />
              )}
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-3 w-52 bg-[#0a0a0a] border border-[#D4AF37]/20 rounded shadow-xl divide-y divide-[#D4AF37]/10">
                <div className="px-4 py-3">
                  <p className="text-xs text-gray-500 uppercase tracking-widest">
                    Signed in as
                  </p>
                  <p className="text-sm text-white font-medium truncate mt-0.5">
                    {user?.email || 'Guest'}
                  </p>
                </div>
                <div className="py-1">
                  <Link
                    to="/shopping/account"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-[#D4AF37] hover:bg-white/5 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    My Account
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
      {menuOpen && (
        <div className="md:hidden bg-[#0a0a0a] border-t border-[#D4AF37]/10 px-6 py-4 flex flex-col gap-4 text-sm font-medium uppercase tracking-widest">
          <Link
            to="/shopping/home"
            onClick={() => setMenuOpen(false)}
            className="hover:text-[#D4AF37] transition-colors"
          >
            Home
          </Link>
          <Link
            to="/shopping/product-list?category=drops"
            onClick={() => setMenuOpen(false)}
            className="hover:text-[#D4AF37] transition-colors"
          >
            Latest Drop
          </Link>
          <Link
            to="/shopping/product-list?category=unisex"
            onClick={() => setMenuOpen(false)}
            className="hover:text-[#D4AF37] transition-colors"
          >
            Unisex
          </Link>
          <Link
            to="/shopping/product-list?category=archive"
            onClick={() => setMenuOpen(false)}
            className="hover:text-[#D4AF37] transition-colors text-gray-500"
          >
            Archive
          </Link>
        </div>
      )}
    </header>
  );
};

export default Header;