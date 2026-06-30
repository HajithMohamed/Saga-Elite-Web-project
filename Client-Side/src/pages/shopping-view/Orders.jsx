import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Package, ChevronRight, Download, Upload, AlertCircle } from "lucide-react";
import { fetchUserOrders } from "@/store/order-slice";
import { fetchMyPendingManualPayments } from "@/store/manualPaymentSlice";
import AppLoader from "@/components/ui/AppLoader";

const FILTER_TABS = [
  { id: "all", label: "All Orders" },
  { id: "pending", label: "Pending" },
  { id: "processing", label: "Processing" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
];

const matchesFilter = (status, filterId) => {
  const s = String(status || "").toLowerCase();
  if (filterId === "all") return true;
  if (filterId === "pending") return s === "pending" || s === "pending_payment";
  if (filterId === "processing") return s === "processing" || s === "verification_pending" || s === "confirmed" || s === "proof_submitted";
  if (filterId === "shipped") return s === "inshipping" || s === "shipped";
  if (filterId === "delivered") return s === "delivered";
  if (filterId === "cancelled") return s === "cancelled";
  return true;
};

const formatCurrency = (amount = 0) =>
  Number(amount).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Orders = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userOrders, isLoading } = useSelector((state) => state.order);
  const pendingPayments = useSelector((state) => state.manualPayment?.pendingForCurrentVisitor ?? []);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    dispatch(fetchUserOrders());
    dispatch(fetchMyPendingManualPayments());
  }, [dispatch]);

  const slugByOrderId = useMemo(() => {
    const map = new Map();
    pendingPayments.forEach((p) => {
      const orderId = p.order?._id || p.orderId;
      if (orderId && p.slug) map.set(String(orderId), p.slug);
    });
    return map;
  }, [pendingPayments]);

  const filteredOrders = useMemo(
    () => userOrders.filter((order) => matchesFilter(order.status, filter)),
    [userOrders, filter]
  );

  if (isLoading && userOrders.length === 0) {
    return <AppLoader message="Retrieving your orders..." />;
  }

  return (
    <div className="space-y-8 pb-12 font-sans">
      
      {/* ── HEADER & FILTERS ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-6">
         <div>
            <h1 className="font-sans text-2xl font-bold text-[#fafafa] mb-1">My Orders</h1>
            <p className="se-body text-[14px] text-[#99907c]">View and track all your recent purchases.</p>
         </div>
         
         <div className="flex flex-wrap gap-2">
            {FILTER_TABS.map((tab) => (
               <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`px-4 py-2 rounded-[12px] text-[11px] font-bold uppercase tracking-wider transition-colors ${
                     filter === tab.id 
                       ? 'bg-[#F2CA50] text-[#0e0e0e]' 
                       : 'bg-[#131313] text-[#99907c] hover:bg-white/5 hover:text-[#fafafa] border border-white/5'
                  }`}
               >
                  {tab.label}
               </button>
            ))}
         </div>
      </div>

      {/* ── ORDERS LIST ── */}
      {filteredOrders.length === 0 ? (
        <div className="bg-[#1A1A1A] border border-white/5 rounded-[24px] p-12 flex flex-col items-center justify-center text-center">
           <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-[#99907c]" />
           </div>
           <h3 className="font-sans font-bold text-lg text-[#fafafa] mb-2">No Orders Found</h3>
           <p className="text-[14px] text-[#99907c] max-w-sm mb-6">You don't have any orders matching the current filter.</p>
           <button 
             onClick={() => navigate('/shopping/product-list')}
             className="h-[48px] px-8 bg-[#F2CA50] text-[#0e0e0e] rounded-[12px] font-sans font-bold uppercase tracking-wider text-[11px] hover:-translate-y-1 transition-transform"
           >
             Start Shopping
           </button>
        </div>
      ) : (
        <div className="space-y-6">
           {filteredOrders.map((order, i) => {
              const requiresManualPayment = order.paymentMethod === 'manual_bank_transfer' && order.paymentStatus === 'pending';
              const paymentSlug = slugByOrderId.get(String(order._id));
              
              const isDelivered = order.status === 'delivered';
              const isCancelled = order.status === 'cancelled';

              return (
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: i * 0.05 }}
                   key={order._id} 
                   className="bg-[#1A1A1A] border border-white/5 rounded-[24px] p-6 lg:p-8"
                 >
                    {/* Order Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/5">
                       <div>
                          <p className="text-[10px] uppercase tracking-widest text-[#99907c] mb-1">Order Number</p>
                          <p className="font-mono text-[16px] text-[#fafafa]">{order._id}</p>
                          <p className="text-[12px] text-[#99907c] mt-1">{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                       </div>
                       
                       <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest ${
                             order.paymentStatus === 'paid' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                             order.paymentStatus === 'failed' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                             'bg-[#F2CA50]/10 border-[#F2CA50]/20 text-[#F2CA50]'
                          }`}>
                             {order.paymentStatus === 'paid' ? 'Paid' : 'Payment Pending'}
                          </span>
                          <span className={`px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest ${
                             isDelivered ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                             isCancelled ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                             'bg-white/5 border-white/10 text-[#fafafa]'
                          }`}>
                             {order.status}
                          </span>
                       </div>
                    </div>

                    {/* Order Items & Actions */}
                    <div className="flex flex-col lg:flex-row justify-between gap-8">
                       
                       <div className="flex-1 space-y-4">
                          {order.items?.slice(0, 3).map((item, idx) => (
                             <div key={idx} className="flex gap-4">
                                <div className="w-16 h-20 bg-[#131313] rounded-[12px] border border-white/5 overflow-hidden shrink-0">
                                   {item.image || item.product?.images?.[0]?.url ? (
                                      <img src={item.image || item.product?.images?.[0]?.url} alt="Product" className="w-full h-full object-cover" />
                                   ) : (
                                      <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-[#99907c]" /></div>
                                   )}
                                </div>
                                <div className="py-1">
                                   <p className="font-sans font-semibold text-[14px] text-[#fafafa] line-clamp-1">{item.title || item.product?.name || "Product Name"}</p>
                                   <p className="text-[12px] text-[#99907c] mt-1">Qty: {item.quantity}</p>
                                </div>
                             </div>
                          ))}
                          {order.items?.length > 3 && (
                             <p className="text-[12px] text-[#99907c] font-bold">+{order.items.length - 3} more items...</p>
                          )}
                       </div>
                       
                       <div className="lg:w-[300px] flex flex-col justify-end gap-3 shrink-0">
                          <div className="flex justify-between items-center mb-4">
                             <span className="text-[13px] text-[#99907c]">Total Amount</span>
                             <span className="font-sans font-bold text-[18px] text-[#fafafa]">Rs {formatCurrency(order.totalAmount)}</span>
                          </div>
                          
                          {requiresManualPayment && paymentSlug && (
                             <button 
                               onClick={() => navigate(`/shopping/manual-payment/${paymentSlug}`, { state: { orderId: order._id } })}
                               className="h-[48px] w-full bg-[#F2CA50] text-[#0e0e0e] rounded-[12px] font-sans font-bold uppercase tracking-wider text-[11px] hover:-translate-y-1 transition-transform flex items-center justify-center gap-2"
                             >
                                <Upload className="w-4 h-4" /> Upload Receipt
                             </button>
                          )}
                          
                          <Link 
                            to={`/shopping/order-tracking?orderId=${order._id}`}
                            className={`h-[48px] w-full border rounded-[12px] font-sans font-bold uppercase tracking-wider text-[11px] transition-colors flex items-center justify-center gap-2 ${
                              requiresManualPayment && paymentSlug 
                                ? 'border-white/10 text-[#fafafa] hover:border-white/30' 
                                : 'bg-white text-[#0e0e0e] hover:bg-[#F2CA50] hover:border-[#F2CA50]'
                            }`}
                          >
                             Track Order <ChevronRight className="w-4 h-4" />
                          </Link>
                       </div>
                    </div>
                 </motion.div>
              )
           })}
        </div>
      )}
    </div>
  );
};

export default Orders;
