import React from 'react';
import { Outlet } from 'react-router-dom';
import MainHeader from '@/components/common-components/MainHeader';

const PublicLayout = () => (
  <div className="flex flex-col min-h-screen bg-page text-ink">
    <MainHeader />
    <main className="flex-1">
      <Outlet />
    </main>
  </div>
);

export default PublicLayout;
