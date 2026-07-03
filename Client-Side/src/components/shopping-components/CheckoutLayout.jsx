import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCartAction, fetchWishlistAction } from '@/store/cart-slice';

// Minimal layout for the secure checkout / payment flow. Intentionally renders
// NONE of the storefront chrome (site header, announcement bar, footer, mobile
// bottom nav) — each payment page brings its own "Secure Checkout" header, and
// stripping the surrounding navigation keeps the flow focused (a standard
// conversion-friendly checkout pattern). Auth gating still happens at the route
// level via CheckAuth, exactly as it does for the storefront pages, so guest
// checkout continues to work.
const CheckoutLayout = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Mirror ShoppinLayout's cart/wishlist hydration so any payment page that
  // reads cart state (e.g. Checkout) has it available even when entered directly.
  useEffect(() => {
    if (!isAuthenticated) return;
    dispatch(fetchCartAction());
    dispatch(fetchWishlistAction());
  }, [dispatch, isAuthenticated]);

  return (
    <div className="flex min-h-screen flex-col bg-page text-ink-2">
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="flex flex-1 flex-col"
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default CheckoutLayout;
