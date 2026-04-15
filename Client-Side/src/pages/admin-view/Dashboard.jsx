import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Package, Users, DollarSign, TrendingUp, Clock, Heart, Award, MessageSquare } from 'lucide-react'
import axios from 'axios'
import { useToast } from "@/hooks/use-toast"

const API_BASE = `${import.meta.env.VITE_API_URL}/v1`

const AdminDashboard = () => {
  const { toast } = useToast()
  
  const [bestSellers, setBestSellers] = useState([])
  const [mostWished, setMostWished] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/products/analytics`, {
          withCredentials: true
        });
        setBestSellers(data.analytics.bestSellers || []);
        setMostWished(data.analytics.mostWished || []);
      } catch (error) {
        toast({
          title: "Error fetching analytics",
          description: error.response?.data?.message || error.message,
          variant: "destructive"
        });
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchAnalytics();
  }, [toast])

  const stats = [
    { label: 'Total Sales', value: '$12,345', icon: <DollarSign className="h-6 w-6 text-[#D4AF37]" />, trend: '+12%' },
    { label: 'Active Orders', value: '45', icon: <ShoppingCart className="h-6 w-6 text-blue-400" />, trend: '5 pending' },
    { label: 'Total Products', value: '1,234', icon: <Package className="h-6 w-6 text-green-400" />, trend: '24 new' },
    { label: 'Total Customers', value: '890', icon: <Users className="h-6 w-6 text-purple-400" />, trend: '+3% this week' },
  ]

  const recentOrders = [
    { id: '#ORD-1234', customer: 'John Doe', status: 'Processing', amount: '$299.00' },
    { id: '#ORD-1235', customer: 'Jane Smith', status: 'Shipped', amount: '$150.00' },
    { id: '#ORD-1236', customer: 'Robert Johnson', status: 'Delivered', amount: '$450.00' },
  ]

  return (
    <div className="p-6 space-y-8 bg-[#080808] min-h-screen text-white">
      <div className="flex justify-between items-center bg-black/50 p-6 rounded-lg border border-gray-800 backdrop-blur-sm">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#D4AF37]">Dashboard Overview</h1>
          <p className="text-gray-400 mt-1">Welcome back, Admin. Here&apos;s what&apos;s happening with Saga Elite today.</p>
        </div>
        <div className="bg-[#D4AF37]/10 px-4 py-2 rounded border border-[#D4AF37]/20 flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#D4AF37]" />
          <span className="text-sm font-medium text-[#D4AF37]">March 1, 2026</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-black/40 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-serif font-semibold text-white">Admin Shortcuts</h2>
              <p className="text-sm text-gray-400">Quick access to management pages.</p>
            </div>
            <Link
              to="/admin/notifications"
              className="text-xs uppercase tracking-[0.22em] text-[#D4AF37] hover:text-white transition"
            >
              Manage notifications
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/admin/notifications"
              className="group rounded-3xl border border-gray-800 bg-[#0b0b0b] p-5 transition hover:border-[#D4AF37] hover:bg-[#111111]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#111111] text-[#D4AF37] transition group-hover:bg-[#D4AF37] group-hover:text-black">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-400">Notification Management</p>
                <h3 className="mt-2 text-lg font-semibold text-white">Send announcements</h3>
                <p className="mt-3 text-sm text-gray-500">Create admin messages and broadcast them to active users.</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-black/40 border border-gray-800 p-6 rounded-xl hover:border-[#D4AF37]/50 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-gray-900 rounded-lg group-hover:bg-[#D4AF37]/10 transition-colors">
                {stat.icon}
              </div>
              <span className="text-xs font-medium text-green-400 bg-green-400/10 px-2 py-1 rounded">
                {stat.trend}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-bold mt-1 group-hover:text-[#D4AF37] transition-colors">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Most Checked Out / Best Sellers */}
        <div className="bg-black/40 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-serif font-semibold flex items-center gap-2">
              <Award className="h-5 w-5 text-[#D4AF37]" />
              Top Checkouts (Best Sellers)
            </h2>
          </div>
          <div className="overflow-x-auto">
            {isLoading ? (
              <p className="text-gray-500">Loading metrics...</p>
            ) : bestSellers.length === 0 ? (
              <p className="text-gray-500">No sales data recorded yet.</p>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-800 text-sm">
                    <th className="pb-4 font-medium uppercase tracking-wider">Product Name</th>
                    <th className="pb-4 font-medium uppercase tracking-wider">Art No</th>
                    <th className="pb-4 font-medium uppercase tracking-wider">Sold</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {bestSellers.map((item, idx) => (
                    <tr key={item._id || idx} className="group hover:bg-white/5 transition-colors">
                      <td className="py-4 text-sm font-medium">{item.name}</td>
                      <td className="py-4 text-sm text-gray-400">{item.artNo}</td>
                      <td className="py-4 text-sm font-bold text-[#D4AF37]">{item.soldCount} Units</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Most Wished */}
        <div className="bg-black/40 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-serif font-semibold flex items-center gap-2">
              <Heart className="h-5 w-5 text-[#e53e3e]" />
              Most Wished Products
            </h2>
          </div>
          <div className="overflow-x-auto">
            {isLoading ? (
               <p className="text-gray-500">Loading metrics...</p>
            ) : mostWished.length === 0 ? (
              <p className="text-gray-500">No wishlist data recorded yet.</p>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-800 text-sm">
                    <th className="pb-4 font-medium uppercase tracking-wider">Product Name</th>
                    <th className="pb-4 font-medium uppercase tracking-wider">Art No</th>
                    <th className="pb-4 font-medium uppercase tracking-wider">Wishes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {mostWished.map((item, idx) => (
                    <tr key={item._id || idx} className="group hover:bg-white/5 transition-colors">
                      <td className="py-4 text-sm font-medium">{item.name}</td>
                      <td className="py-4 text-sm text-gray-400">{item.artNo}</td>
                      <td className="py-4 text-sm font-bold text-[#e53e3e]">{item.wishCount} Users</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
