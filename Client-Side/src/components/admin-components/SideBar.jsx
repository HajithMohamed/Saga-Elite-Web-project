import React from 'react'
import { LayoutDashboard, ShoppingBag, ShoppingCart, Star, LogOut, X } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

const SideBar = () => {
  const location = useLocation()
  
  const menuItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: 'Products', path: '/admin/product', icon: <ShoppingBag className="h-5 w-5" /> },
    { label: 'Orders', path: '/admin/order', icon: <ShoppingCart className="h-5 w-5" /> },
    { label: 'Features', path: '/admin/feature', icon: <Star className="h-5 w-5" /> },
  ]

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-black border-r border-gray-800 flex flex-col transform transition-transform duration-300 lg:translate-x-0">
      {/* Brand Section */}
      <div className="p-8 border-b border-gray-800">
        <Link to="/admin/dashboard" className="block text-center group">
          <h1 className="text-2xl font-serif font-black text-[#D4AF37] tracking-tight group-hover:opacity-80 transition-opacity uppercase">
            Saga <span className="text-white">Elite</span>
          </h1>
          <p className="text-[10px] tracking-[0.2em] font-sans text-gray-400 mt-1 uppercase">
            Rare Fit Forever
          </p>
        </Link>
      </div>

      {/* Main Menu */}
      <nav className="flex-1 px-4 py-8 space-y-4">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 group relative
              ${location.pathname === item.path 
                ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20 border border-[#D4AF37]' 
                : 'text-gray-400 hover:bg-gray-900 border border-transparent hover:border-gray-800'
              }`}
          >
            <div className={`transition-transform duration-200 ${location.pathname === item.path ? 'scale-110' : 'group-hover:scale-110 group-hover:text-[#D4AF37]'}`}>
              {item.icon}
            </div>
            <span className="font-bold text-sm tracking-wide uppercase font-sans">
              {item.label}
            </span>
            {location.pathname === item.path && (
              <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-black/50" />
            )}
          </Link>
        ))}
      </nav>

      {/* Logout / Footer Section */}
      <div className="p-6 border-t border-gray-800">
        <button className="flex w-full items-center gap-4 px-4 py-3 rounded-lg text-gray-500 hover:bg-red-500/10 hover:text-red-500 transition-all border border-transparent hover:border-red-500/20 group">
          <LogOut className="h-5 w-5 group-hover:animate-pulse" />
          <span className="font-bold text-sm tracking-wide uppercase font-sans">
            Log Out
          </span>
        </button>
        <div className="mt-6 flex flex-col items-center gap-1 opacity-50 grayscale hover:grayscale-0 transition-all">
          <span className="text-[10px] font-medium text-gray-500">v1.2.0 PRE-RELEASE</span>
          <div className="h-px w-8 bg-gray-800" />
        </div>
      </div>
    </div>
  )
}

export default SideBar
