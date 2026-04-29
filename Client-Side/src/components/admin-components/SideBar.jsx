import React, { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  Star,
  LogOut,
  User,
  Package,
  ImagePlus,
  MessageSquare,
  Users,
  Shield,
  CreditCard,
  StarHalf
} from 'lucide-react'

import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logoutUserAction } from '@/store/auth-slice'
import { toast } from '@/hooks/use-toast'
import axios from 'axios'

const SideBar = () => {

  const location = useLocation()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { isLoading, user } =
    useSelector((state) => state.auth)

  const [pendingPaymentCount, setPendingPaymentCount] =
    useState(0)

  const [pendingReviewCount, setPendingReviewCount] =
    useState(0)

  useEffect(() => {

    const fetchCounts = async () => {
      try {

        const [paymentRes, reviewRes] =
          await Promise.all([
            axios.get(
              '/api/v1/admin/manual-payments?status=proof_submitted&countOnly=true',
              { withCredentials: true }
            ),

            axios.get(
              '/api/v1/admin/reviews?status=pending&countOnly=true',
              { withCredentials: true }
            )
          ])

        if (paymentRes.data?.success) {
          setPendingPaymentCount(
            paymentRes.data.data?.count || 0
          )
        }

        if (reviewRes.data?.success) {
          setPendingReviewCount(
            reviewRes.data.data?.count || 0
          )
        }

      } catch (error) {
        console.error(
          'Failed to fetch admin badge counts',
          error
        )
      }
    }

    fetchCounts()

    const interval =
      setInterval(fetchCounts, 60000)

    return () => clearInterval(interval)

  }, [])

  const menuItems = [
    {
      label: 'Dashboard',
      path: '/admin/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />
    },

    {
      label: 'Pending Payments',
      path: '/admin/payments/pending',
      icon: <CreditCard className="h-5 w-5" />,
      badge: pendingPaymentCount
    },

    {
      label: 'Home Images',
      path: '/admin/home-images',
      icon: <ImagePlus className="h-5 w-5" />
    },

    {
      label: 'Products',
      path: '/admin/product',
      icon: <ShoppingBag className="h-5 w-5" />
    },

    {
      label: 'Orders',
      path: '/admin/order',
      icon: <ShoppingCart className="h-5 w-5" />
    },

    {
      label: 'Review Moderation',
      path: '/admin/reviews',
      icon: <StarHalf className="h-5 w-5" />,
      badge: pendingReviewCount
    },

    {
      label: 'Users',
      path: '/admin/users',
      icon: <Users className="h-5 w-5" />
    },

    {
      label: 'Notifications',
      path: '/admin/notifications',
      icon: <MessageSquare className="h-5 w-5" />
    },

    {
      label: 'Features',
      path: '/admin/feature',
      icon: <Star className="h-5 w-5" />
    },

    {
      label: 'Drops',
      path: '/admin/drop',
      icon: <Package className="h-5 w-5" />
    }
  ]

  if (
    user?.role === 'super_admin' ||
    user?.role === 'superadmin'
  ) {
    menuItems.push({
      label: 'Super Admins',
      path: '/admin/super-admin',
      icon: <Shield className="h-5 w-5" />
    })
  }

  const handleLogout = async () => {
    try {

      await dispatch(
        logoutUserAction()
      ).unwrap()

      toast({
        title: 'Logged out',
        description: 'You have been signed out.',
        variant: 'success',
      })

      navigate('/auth/login')

    } catch (err) {

      const msg =
        typeof err === 'string'
          ? err
          : err?.message || 'Logout failed'

      toast({
        title: 'Logout failed',
        description: msg,
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-black border-r border-gray-800 flex flex-col transform transition-transform duration-300 lg:translate-x-0">

      {/* Brand */}
      <div className="p-8 border-b border-gray-800">
        <Link
          to="/admin/dashboard"
          className="block text-center group"
        >
          <h1 className="text-2xl font-serif font-black text-[#D4AF37] tracking-tight group-hover:opacity-80 transition-opacity uppercase">
            Saga <span className="text-white">Elite</span>
          </h1>

          <p className="text-[10px] tracking-[0.2em] font-sans text-gray-400 mt-1 uppercase">
            Rare Fit Forever
          </p>
        </Link>
      </div>

      {/* Menu */}
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

            <div
              className={`transition-transform duration-200 ${
                location.pathname === item.path
                  ? 'scale-110'
                  : 'group-hover:scale-110 group-hover:text-[#D4AF37]'
              }`}
            >
              {item.icon}
            </div>

            <span className="font-bold text-sm tracking-wide uppercase font-sans flex-1">
              {item.label}
            </span>

            {item.badge > 0 && (
              <span className="bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full min-w-5 text-center">
                {item.badge}
              </span>
            )}

            {location.pathname === item.path &&
              !item.badge && (
                <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-black/50" />
            )}

          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-gray-800 space-y-3">

        <Link
          to="/admin/account"
          className={`flex w-full items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 group relative border
            ${
              location.pathname === '/admin/account'
                ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20 border-[#D4AF37]'
                : 'text-gray-400 hover:bg-gray-900 border-transparent hover:border-gray-800'
            }`}
        >
          <div
            className={`transition-transform duration-200 ${
              location.pathname === '/admin/account'
                ? 'scale-110'
                : 'group-hover:scale-110 group-hover:text-[#D4AF37]'
            }`}
          >
            <User className="h-5 w-5" />
          </div>

          <span className="font-bold text-sm tracking-wide uppercase font-sans">
            My Account
          </span>

          {location.pathname === '/admin/account' && (
            <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-black/50" />
          )}

        </Link>

        <button
          onClick={handleLogout}
          disabled={isLoading}
          className={`flex w-full items-center gap-4 px-4 py-3 rounded-lg transition-all border border-transparent ${
            isLoading
              ? 'cursor-not-allowed bg-gray-700 text-gray-400'
              : 'text-gray-500 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20'
          }`}
        >

          <LogOut className="h-5 w-5 group-hover:animate-pulse" />

          <span className="font-bold text-sm tracking-wide uppercase font-sans">
            {isLoading
              ? 'Logging out…'
              : 'Log Out'}
          </span>

        </button>

        <div className="mt-6 flex flex-col items-center gap-1 opacity-50 grayscale hover:grayscale-0 transition-all">
          <span className="text-[10px] font-medium text-gray-500">
            v1.2.0 PRE-RELEASE
          </span>

          <div className="h-px w-8 bg-gray-800" />
        </div>

      </div>
    </div>
  )
}

export default SideBar