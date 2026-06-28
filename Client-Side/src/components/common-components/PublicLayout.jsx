import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import MainHeader from '@/components/common-components/MainHeader';
import MainFooter from '@/components/common-components/MainFooter';
import AnnouncementBar from '@/components/common-components/AnnouncementBar';

const PublicLayout = () => {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen bg-background text-on-surface">
      <AnnouncementBar />
      <MainHeader />
      <main className="flex-1 flex flex-col w-full relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="flex-1 flex flex-col w-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <MainFooter />
    </div>
  );
};

export default PublicLayout;
