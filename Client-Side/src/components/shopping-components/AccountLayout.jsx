import React, { useState } from "react";
import { Outlet, NavLink, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  Heart,
  MapPin,
  User,
  Bell,
  Shield,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X
} from "lucide-react";
import usePageMeta from "@/hooks/use-page-meta";
import { Newsletter } from "@/components/landing/CommunitySections";

const NAV_ITEMS = [
  { path: "/shopping/account", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { path: "/shopping/account/orders", label: "My Orders", icon: Package },
  { path: "/shopping/account/wishlist", label: "Wishlist", icon: Heart },
  { path: "/shopping/account/addresses", label: "Saved Addresses", icon: MapPin },
  { path: "/shopping/account/profile", label: "Profile", icon: User },
  { path: "/shopping/account/notifications", label: "Notifications", icon: Bell },
  { path: "/shopping/account/security", label: "Security", icon: Shield },
  { path: "/shopping/account/settings", label: "Settings", icon: Settings },
];

const AccountLayout = () => {
  usePageMeta({ title: "My Account" });
  const { user } = useSelector((state) => state.auth);
  const firstName = user?.firstName || user?.userName?.split(" ")[0] || "Guest";
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="bg-[#0e0e0e] min-h-screen text-[#e5e2e1] pt-[64px] md:pt-[72px] font-sans overflow-x-hidden">
      
      {/* ── DASHBOARD HERO ── */}
      <section className="relative h-[180px] md:h-[220px] lg:h-[280px] overflow-hidden flex items-end justify-center w-full border-b border-white/5">
        <div className="absolute inset-0">
          <div className="absolute top-[-50%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[100px] opacity-10 bg-[#F2CA50]" />
          <div className="absolute inset-0 bg-[#0e0e0e]/80" />
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] to-transparent" />
        </div>
        
        <div className="relative z-10 w-full max-w-[1440px] px-4 md:px-8 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
             <nav className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#99907c] mb-4">
                <Link to="/" className="hover:text-[#F2CA50] transition-colors">Home</Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-[#fafafa] font-bold">My Account</span>
             </nav>
             <h1 className="se-serif text-3xl md:text-4xl lg:text-5xl text-[#fafafa] mb-2">
                Welcome Back, {firstName}
             </h1>
             <p className="se-body text-[#99907c] text-sm md:text-base max-w-xl">
                Manage your profile, orders, wishlist, and account settings.
             </p>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden flex items-center justify-center gap-2 h-[48px] px-6 bg-[#1A1A1A] border border-white/10 rounded-[12px] text-[11px] font-bold uppercase tracking-wider text-[#fafafa]"
          >
            <Menu className="w-4 h-4" /> Account Menu
          </button>
        </div>
      </section>

      {/* ── MAIN CONTENT GRID ── */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 lg:py-12 flex gap-8 lg:gap-12 relative items-start">
         
         {/* ── DESKTOP SIDEBAR ── */}
         <aside className="hidden lg:block w-[300px] shrink-0 sticky top-28 self-start">
            <div className="bg-[#1A1A1A] rounded-[24px] border border-white/5 p-4 flex flex-col gap-1">
               {NAV_ITEMS.map((item) => (
                  <NavLink
                     key={item.path}
                     to={item.path}
                     end={item.exact}
                     className={({ isActive }) => `
                        flex items-center gap-4 px-4 py-3.5 rounded-[16px] transition-all
                        ${isActive ? 'bg-[#F2CA50]/10 text-[#F2CA50] font-bold' : 'text-[#99907c] hover:bg-white/5 hover:text-[#fafafa] font-semibold'}
                     `}
                  >
                     <item.icon className="w-5 h-5 shrink-0" strokeWidth={2} />
                     <span className="text-[14px]">{item.label}</span>
                  </NavLink>
               ))}
               <div className="my-2 border-t border-white/5 mx-4" />
               <button className="flex items-center gap-4 px-4 py-3.5 rounded-[16px] text-red-400 hover:bg-red-500/10 transition-all font-semibold text-left">
                  <LogOut className="w-5 h-5 shrink-0" strokeWidth={2} />
                  <span className="text-[14px]">Logout</span>
               </button>
            </div>
         </aside>

         {/* ── MOBILE BOTTOM DRAWER ── */}
         <AnimatePresence>
            {mobileMenuOpen && (
               <>
                  <motion.div 
                     initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                     className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden"
                     onClick={() => setMobileMenuOpen(false)}
                  />
                  <motion.div 
                     initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                     className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-[#131313] border-t border-white/10 z-[101] rounded-t-[24px] lg:hidden flex flex-col overflow-hidden"
                  >
                     <div className="flex justify-between items-center p-6 border-b border-white/5 shrink-0">
                        <span className="text-[#fafafa] font-bold tracking-widest uppercase text-[12px]">Account Menu</span>
                        <button onClick={() => setMobileMenuOpen(false)} className="text-[#99907c] hover:text-[#F2CA50]"><X className="w-6 h-6" /></button>
                     </div>
                     <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
                        {NAV_ITEMS.map((item) => (
                           <NavLink
                              key={item.path}
                              to={item.path}
                              end={item.exact}
                              onClick={() => setMobileMenuOpen(false)}
                              className={({ isActive }) => `
                                 flex items-center gap-4 px-4 py-4 rounded-[16px] transition-all
                                 ${isActive ? 'bg-[#F2CA50]/10 text-[#F2CA50] font-bold' : 'text-[#99907c] hover:bg-white/5 hover:text-[#fafafa] font-semibold'}
                              `}
                           >
                              <item.icon className="w-5 h-5 shrink-0" strokeWidth={2} />
                              <span className="text-[15px]">{item.label}</span>
                           </NavLink>
                        ))}
                        <div className="my-2 border-t border-white/5 mx-4" />
                        <button className="flex items-center gap-4 px-4 py-4 rounded-[16px] text-red-400 hover:bg-red-500/10 transition-all font-semibold text-left">
                           <LogOut className="w-5 h-5 shrink-0" strokeWidth={2} />
                           <span className="text-[15px]">Logout</span>
                        </button>
                     </div>
                  </motion.div>
               </>
            )}
         </AnimatePresence>

         {/* ── CONTENT AREA ── */}
         <div className="flex-1 w-full min-w-0">
            <AnimatePresence mode="wait">
               <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
               >
                  <Outlet />
               </motion.div>
            </AnimatePresence>
         </div>
      </div>

      <Newsletter />
    </div>
  );
};

export default AccountLayout;
