import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { Package, Heart, MapPin, CreditCard, ChevronRight, Star } from "lucide-react";
import { fetchUserOrders } from "@/store/order-slice";
import ForYouRail from "@/components/landing/ForYouRail";

const DashboardOverview = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { userOrders } = useSelector((state) => state.order);
  const wishlistItems = useSelector((state) => state.cart.wishlist?.items ?? []);

  useEffect(() => {
    dispatch(fetchUserOrders());
  }, [dispatch]);

  const recentOrders = userOrders.slice(0, 3);
  const pendingPayments = userOrders.filter(o => o.paymentMethod === 'manual_bank_transfer' && (o.paymentStatus === 'pending' || o.paymentStatus === 'failed')).length;

  const summaryCards = [
    { label: "Total Orders", value: userOrders.length, icon: Package, path: "/shopping/account/orders", color: "text-ink" },
    { label: "Wishlist Items", value: wishlistItems.length, icon: Heart, path: "/shopping/account/wishlist", color: "text-gold-ink" },
    { label: "Pending Payments", value: pendingPayments, icon: CreditCard, path: "/shopping/account/orders", color: pendingPayments > 0 ? "text-red-400" : "text-ink" },
    { label: "Saved Addresses", value: "Manage", icon: MapPin, path: "/shopping/account/addresses", color: "text-ink" },
  ];

  return (
    <div className="space-y-12 pb-12">
      {/* ── SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => (
          <Link 
            key={i} 
            to={card.path}
            className="bg-card border border-ink/5 rounded-[20px] p-6 flex flex-col items-start gap-4 hover:-translate-y-1 hover:border-gold-ink/30 transition-all group"
          >
            <div className={`w-12 h-12 rounded-full bg-ink/5 flex items-center justify-center ${card.color} group-hover:bg-gold/10 transition-colors`}>
              <card.icon className="w-6 h-6" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[22px] font-sans font-bold text-ink">{card.value}</p>
              <p className="text-[12px] uppercase tracking-widest text-muted mt-1">{card.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── RECENT ORDERS ── */}
      {recentOrders.length > 0 && (
        <div className="bg-card border border-ink/5 rounded-[24px] overflow-hidden">
          <div className="p-6 md:p-8 border-b border-ink/5 flex items-center justify-between">
             <h2 className="font-sans font-bold text-xl text-ink">Recent Orders</h2>
             <Link to="/shopping/account/orders" className="text-[11px] font-bold uppercase tracking-wider text-gold-ink hover:underline flex items-center gap-1">
                View All <ChevronRight className="w-3 h-3" />
             </Link>
          </div>
          <div className="divide-y divide-ink/5">
            {recentOrders.map((order) => (
               <div key={order._id} className="p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-ink/5 transition-colors">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-full bg-panel border border-ink/10 flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-muted" />
                     </div>
                     <div>
                        <p className="font-mono text-[14px] text-ink mb-1">{order._id}</p>
                        <p className="text-[12px] text-muted">{new Date(order.createdAt).toLocaleDateString()}</p>
                     </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-[300px]">
                     <span className={`px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest ${
                       order.status === 'delivered' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                       order.status === 'cancelled' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                       'bg-gold/10 border-gold-ink/20 text-gold-ink'
                     }`}>
                       {order.status}
                     </span>
                     <Link to={`/shopping/order-tracking?orderId=${order._id}`} className="w-8 h-8 rounded-full bg-ink/5 flex items-center justify-center hover:bg-gold hover:text-ongold transition-colors text-ink">
                        <ChevronRight className="w-4 h-4" />
                     </Link>
                  </div>
               </div>
            ))}
          </div>
        </div>
      )}

      {/* ── RECENTLY VIEWED ── */}
      <div className="-mx-4 md:-mx-8">
        <ForYouRail variant="recently-viewed" />
      </div>
    </div>
  );
};

export default DashboardOverview;
