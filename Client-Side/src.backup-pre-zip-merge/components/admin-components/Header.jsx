import React from 'react'
import { Search, LogOut, Menu, User } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { logoutUserAction } from '@/store/auth-slice'
import { toast } from '@/hooks/use-toast'
import NotificationsDropdown from '@/components/common-components/NotificationsDropdown'

const Header = ({ onMenuToggle }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isLoading } = useSelector((state) => state.auth)

  const handleLogout = async () => {
    try {
      await dispatch(logoutUserAction()).unwrap()
      toast({ title: 'Logged out', description: 'Redirecting to login.', variant: 'success' })
      navigate('/auth/login')
    } catch (err) {
      const msg = typeof err === 'string' ? err : err?.message || 'Logout failed'
      toast({ title: 'Logout failed', description: msg, variant: 'destructive' })
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-gray-800 bg-black/80 px-8 backdrop-blur-md">
      <div className="flex flex-1 items-center gap-6">
        <button
          type="button"
          onClick={onMenuToggle}
          className="text-[#D4AF37] lg:hidden"
          aria-label="Toggle admin sidebar"
        >
          <Menu className="h-6 w-6 cursor-pointer" />
        </button>
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
        <NotificationsDropdown />

        <div className="flex items-center gap-4 border-l border-gray-800 pl-6 ml-2">
          <Link to="/admin/account" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold tracking-wide text-white font-sans uppercase">Admin Profile</span>
              <span className="text-[10px] uppercase font-medium tracking-widest text-[#D4AF37]">System Controller</span>
            </div>
            <div className="h-10 w-10 rounded-full border-2 border-[#D4AF37]/50 bg-gray-900 flex items-center justify-center group cursor-pointer hover:border-[#D4AF37] transition-all overflow-hidden ring-2 ring-[#D4AF37]/5">
              <User className="h-6 w-6 text-gray-400 group-hover:text-white transition-colors" />
            </div>
          </Link>
          <button 
            onClick={handleLogout}
            disabled={isLoading}
            title="Log out from system"
            className={`ml-2 group p-2 transition-colors
              ${isLoading ? 'cursor-not-allowed text-gray-500' : 'text-gray-400 hover:text-red-500'}
            `}
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
