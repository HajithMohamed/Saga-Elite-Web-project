import React from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Package, Users, DollarSign, TrendingUp, Clock } from 'lucide-react'

const AdminDashboard = () => {
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-black/40 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-serif font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#D4AF37]" />
              Recent Orders
            </h2>
            <button className="text-sm text-[#D4AF37] hover:underline">View all</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800 text-sm">
                  <th className="pb-4 font-medium uppercase tracking-wider">Order ID</th>
                  <th className="pb-4 font-medium uppercase tracking-wider">Customer</th>
                  <th className="pb-4 font-medium uppercase tracking-wider">Status</th>
                  <th className="pb-4 font-medium uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {recentOrders.map((order, idx) => (
                  <tr key={idx} className="group hover:bg-white/5 transition-colors">
                    <td className="py-4 font-mono text-sm text-[#D4AF37]">{order.id}</td>
                    <td className="py-4 text-sm">{order.customer}</td>
                    <td className="py-4">
                      <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${
                        order.status === 'Delivered' ? 'bg-green-500/10 text-green-500' :
                        order.status === 'Processing' ? 'bg-yellow-500/10 text-yellow-500' :
                        'bg-blue-500/10 text-blue-500'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 text-sm font-bold">{order.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-black/40 border border-gray-800 rounded-xl p-6 h-fit">
          <h2 className="text-xl font-serif font-semibold mb-6">Quick Actions</h2>
          <div className="space-y-4">
            <Link
              to="/admin/product"
              className="inline-flex w-full items-center justify-center py-3 px-4 bg-[#D4AF37] text-black font-bold uppercase text-xs tracking-widest rounded hover:bg-[#b8962d] transition-colors"
            >
              Add New Product
            </Link>
            <button className="w-full py-3 px-4 bg-transparent border border-gray-700 text-white font-bold uppercase text-xs tracking-widest rounded hover:border-[#D4AF37] transition-colors">
              Create Collection
            </button>
            <button className="w-full py-3 px-4 bg-transparent border border-gray-700 text-white font-bold uppercase text-xs tracking-widest rounded hover:border-[#D4AF37] transition-colors font-sans">
              Export Sales Report
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
