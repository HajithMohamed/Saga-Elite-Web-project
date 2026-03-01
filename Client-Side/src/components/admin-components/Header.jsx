import React from 'react'
import { Bell, Search, LogOut, Menu, User } from 'lucide-react'

const Header = () => {
  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-gray-800 bg-black/80 px-8 backdrop-blur-md">
      <div className="flex flex-1 items-center gap-6">
        <div className="lg:hidden text-[#D4AF37]">
          <Menu className="h-6 w-6 cursor-pointer" />
        </div>
        <div className="relative group max-w-md w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-hover:text-[#D4AF37] transition-colors" />
          <input 
            type="text" 
            placeholder="Search analysis, orders, products..."
            className="h-10 w-full rounded-full border border-gray-800 bg-gray-900 pl-10 pr-4 text-xs font-medium text-white placeholder-gray-500 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/20 outline-none transition-all"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <button className="relative group p-2 text-gray-400 hover:text-white transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-black" />
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-[10px] text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-gray-700">
            3 notifications
          </div>
        </button>

        <div className="flex items-center gap-4 border-l border-gray-800 pl-6 ml-2">
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold tracking-wide text-white font-sans uppercase">Admin Profile</span>
            <span className="text-[10px] uppercase font-medium tracking-widest text-[#D4AF37]">System Controller</span>
          </div>
          <div className="h-10 w-10 rounded-full border-2 border-[#D4AF37]/50 bg-gray-900 flex items-center justify-center group cursor-pointer hover:border-[#D4AF37] transition-all overflow-hidden ring-2 ring-[#D4AF37]/5">
            <User className="h-6 w-6 text-gray-400 group-hover:text-white transition-colors" />
          </div>
          <button 
            className="ml-2 group p-2 text-gray-400 hover:text-red-500 transition-colors"
            title="Log out from system"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
