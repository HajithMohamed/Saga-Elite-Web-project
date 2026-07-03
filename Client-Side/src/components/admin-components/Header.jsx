import React from 'react'
import { LogOut, Menu, User } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { logoutUserAction } from '@/store/auth-slice'
import { toast } from '@/hooks/use-toast'
import NotificationsDropdown from '@/components/common-components/NotificationsDropdown'
import GlobalSearchDropdown from '@/components/admin-components/GlobalSearchDropdown'
import ThemeToggle from '@/components/common-components/ThemeToggle'

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
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-line bg-page/80 px-4 md:px-6 backdrop-blur-md">
      <div className="flex flex-1 items-center gap-6">
        <button
          type="button"
          onClick={onMenuToggle}
          className="text-gold-ink2 lg:hidden"
          aria-label="Toggle admin sidebar"
        >
          <Menu className="h-6 w-6 cursor-pointer" />
        </button>
        <div className="w-full max-w-sm">
          <GlobalSearchDropdown />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <NotificationsDropdown />

        <div className="flex items-center gap-3 border-l border-line pl-4 ml-1">
          <Link to="/admin/account" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold tracking-wide text-ink font-sans uppercase">Admin Profile</span>
              <span className="text-[10px] uppercase font-medium tracking-widest text-gold-ink2">System Controller</span>
            </div>
            <div className="h-10 w-10 rounded-full border-2 border-gold-ink2/50 bg-gray-900 flex items-center justify-center group cursor-pointer hover:border-gold-ink2 transition-all overflow-hidden ring-2 ring-gold-ink2/5">
              <User className="h-6 w-6 text-gray-400 group-hover:text-ink transition-colors" />
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
