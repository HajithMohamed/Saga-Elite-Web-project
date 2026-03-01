import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';

const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <Header />
      <main className="flex-1 flex flex-col w-full">
        <Outlet />
      </main>
      
      {/* Footer Dummy */}
      <footer className="w-full bg-neutral-950 border-t border-[#D4AF37]/20 py-8 mt-auto">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <p className="text-sm text-gray-500 tracking-wider">
            © {new Date().getFullYear()} SAGA ELITE. RARE FIT FOREVER.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
