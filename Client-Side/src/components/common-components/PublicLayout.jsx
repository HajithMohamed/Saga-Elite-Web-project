import React from 'react';
import { Outlet } from 'react-router-dom';
import MainHeader from '@/components/common-components/MainHeader';
import MainFooter from '@/components/common-components/MainFooter';

const PublicLayout = () => {
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

export default PublicLayout;
