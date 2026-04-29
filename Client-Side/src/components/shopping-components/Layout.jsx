import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import MainHeader from '@/components/common-components/MainHeader';
import MainFooter from '@/components/common-components/MainFooter';
import { fetchCartAction, fetchWishlistAction } from '@/store/cart-slice';

const Layout = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated) return;
    dispatch(fetchCartAction());
    dispatch(fetchWishlistAction());
  }, [dispatch, isAuthenticated]);

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <MainHeader />
      <main className="flex-1 flex flex-col w-full">
        <Outlet />
      </main>
      <MainFooter />
    </div>
  );
};

export default Layout;
