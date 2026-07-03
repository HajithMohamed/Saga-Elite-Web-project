import React, { useEffect, useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrderById } from "@/store/order-slice";
import { Check, Package, ShieldCheck, Truck, Copy, Clock, MessageCircle, ArrowRight, Upload, Phone, Mail, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { resolveColor } from "@/components/ui/editorial";
import AppLoader from "@/components/ui/AppLoader";
import { toast } from "@/hooks/use-toast";
import usePageMeta from "@/hooks/use-page-meta";
import ForYouRail from "@/components/landing/ForYouRail";
import { Newsletter } from "@/components/landing/CommunitySections";

const OrderSuccess = () => {
  usePageMeta({ title: "Order Confirmed" });
  
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const stateOrderId = location.state?.orderId;
  const fallbackOrderId = `TEM-${Math.floor(Math.random() * 100000000)}`;
  const displayOrderId = stateOrderId || fallbackOrderId;
  const totalAmountState = location.state?.amount || location.state?.totalAmount;
  
  const { currentOrder, isLoading } = useSelector((state) => state.order);
  const { user } = useSelector((state) => state.auth);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (stateOrderId) {
      dispatch(fetchOrderById(stateOrderId));
    }
  }, [dispatch, stateOrderId]);

  // Use currentOrder if available, otherwise fallback to location.state data
  const order = currentOrder || {
    _id: displayOrderId,
    totalAmount: totalAmountState || "0.00",
    orderStatus: "pending",
    paymentStatus: "pending",
    items: [],
    guestEmail: location.state?.email || "your email",
    shippingAddress: null,
    createdAt: new Date().toISOString(),
  };

  const primaryItem = order.items?.[0];
  const primaryProduct = primaryItem?.product;
  const primaryVariant = primaryItem?.variant || primaryItem;

  const manualPaymentSlug = location.state?.slug || currentOrder?.manualPayment?.slug;
  const isManualBankTransfer = (currentOrder?.paymentMethod || location.state?.paymentMethod) === "manual_bank_transfer";
  const showUploadReceiptCta = Boolean(isManualBankTransfer && manualPaymentSlug && order.paymentStatus === 'pending');
  
  const colorName = primaryVariant?.color || primaryItem?.color;
  const themeColor = colorName ? resolveColor(colorName) : "#F2CA50";

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", themeColor);
    document.documentElement.style.setProperty("--accent-glow", `${themeColor}40`);
    return () => {
      document.documentElement.style.removeProperty("--accent");
      document.documentElement.style.removeProperty("--accent-glow");
    };
  }, [themeColor]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(order._id);
    setCopied(true);
    toast({ title: "Order ID copied", variant: "success" });
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCurrency = (amount = 0) =>
    Number(amount).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (isLoading && !currentOrder) {
    return <AppLoader message="Securing your selection..." />;
  }

  const firstName = user?.firstName || order.shippingAddress?.fullName?.split(" ")[0] || "";
  const subtotal = order.items?.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0) || order.totalAmount;
  const shipping = order.shippingFee || 0;
  const discount = order.discountAmount || 0;
  
  const paymentStatusColor = order.paymentStatus === 'paid' || order.paymentStatus === 'success' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                           : order.paymentStatus === 'failed' ? 'text-red-400 bg-red-500/10 border-red-500/20' 
                           : 'text-[#F2CA50] bg-[#F2CA50]/10 border-[#F2CA50]/20';

  const orderStatusColor = order.orderStatus === 'delivered' ? 'text-emerald-400'
                         : order.orderStatus === 'cancelled' ? 'text-red-400'
                         : 'text-[#F2CA50]';

  return (
    <main className="min-h-screen bg-[#0e0e0e] text-[#e5e2e1] pt-[64px] md:pt-[72px] relative overflow-x-hidden font-sans">
      
      {/* ── HERO SECTION ── */}
      <section className="relative h-[220px] md:h-[260px] lg:h-[320px] overflow-hidden flex items-center justify-center w-full border-b border-white/5">
        <div className="absolute inset-0">
          <div className="absolute top-[-50%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full blur-[120px] opacity-10 bg-[#F2CA50]" />
          <div className="absolute inset-0 bg-[#0e0e0e]/80" />
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] to-transparent" />
        </div>
        
        <div className="relative z-10 w-full max-w-3xl px-4 text-center flex flex-col items-center">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.7, type: "spring", bounce: 0.5 }}
            className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#1A1A1A] border border-[#F2CA50]/30 flex items-center justify-center shadow-[0_0_40px_rgba(242,202,80,0.15)] mb-6 relative"
          >
             <div className="absolute inset-0 rounded-full border border-[#F2CA50]/20 animate-ping opacity-20" style={{ animationDuration: '3s' }} />
             <Check className="w-10 h-10 md:w-12 md:h-12 text-[#F2CA50]" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="se-serif text-3xl md:text-5xl text-[#fafafa] mb-3"
          >
            Thank You{firstName ? `, ${firstName}` : ''}!
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="se-body text-[#99907c] text-base md:text-lg max-w-xl mx-auto"
          >
            Your order has been placed successfully. We are now preparing it for dispatch.
          </motion.p>
        </div>
      </section>

      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-12 md:py-16 grid lg:grid-cols-[1fr_400px] gap-8 lg:gap-12">
        
        {/* ── LEFT COLUMN ── */}
        <div className="space-y-8">
          
          {/* Order Header Info */}
          <div className="flex flex-wrap items-center justify-between gap-6 bg-[#1A1A1A] rounded-[24px] border border-white/5 p-6 md:p-8">
             <div>
                <p className="se-label text-[10px] uppercase tracking-widest text-[#99907c] mb-2">Order Reference</p>
                <div className="flex items-center gap-4">
                   <h2 className="se-serif text-2xl md:text-[28px] text-[#fafafa] tracking-wider">{order._id}</h2>
                   <button onClick={copyToClipboard} className="text-[#99907c] hover:text-[#F2CA50] transition-colors">
                     {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                   </button>
                </div>
                <p className="se-body text-[13px] text-[#99907c] mt-2">
                  Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
             </div>
             
             <div className="flex flex-col gap-3 items-end text-right">
                <div className={`px-4 py-2 rounded-full border text-[11px] uppercase tracking-widest font-bold ${paymentStatusColor}`}>
                   {order.paymentStatus === 'paid' ? 'Payment Successful' : order.paymentStatus === 'failed' ? 'Payment Failed' : 'Payment Pending'}
                </div>
                <div className="text-[12px] text-[#99907c] flex items-center gap-2">
                   <Truck className="w-4 h-4" /> Est. Delivery: 2–5 Business Days
                </div>
             </div>
          </div>

          {/* Success Card */}
          <div className="bg-[#1A1A1A] rounded-[24px] border border-white/5 p-6 md:p-8">
             <h3 className="font-sans font-bold text-lg text-[#fafafa] mb-6">Order Status</h3>
             <div className="space-y-4">
                {[
                  { label: "Order Confirmed", active: true, icon: ShieldCheck },
                  { label: order.paymentStatus === 'paid' ? "Payment Received" : "Payment Pending", active: true, icon: FileText },
                  { label: "Email Confirmation Sent", active: Boolean(order.guestEmail || user?.email), icon: Mail },
                  { label: "Delivery Preparation Started", active: order.orderStatus !== 'pending', icon: Package },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-4">
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step.active ? 'bg-[#F2CA50]/10 text-[#F2CA50]' : 'bg-white/5 text-white/20'}`}>
                        {step.active ? <Check className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
                     </div>
                     <span className={`font-sans text-[14px] ${step.active ? 'text-[#e5e2e1]' : 'text-[#99907c]'}`}>
                        {step.label}
                     </span>
                  </div>
                ))}
             </div>
             {order.guestEmail && (
                <p className="text-[13px] text-[#99907c] mt-6 pt-6 border-t border-white/5">
                   We've sent a confirmation email to <span className="text-[#fafafa] font-medium">{order.guestEmail}</span>.
                </p>
             )}
          </div>

          {/* Manual Payment CTA */}
          {showUploadReceiptCta && (
             <div className="bg-[#F2CA50]/10 border border-[#F2CA50]/30 rounded-[24px] p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                <div className="w-16 h-16 rounded-full bg-[#F2CA50]/20 flex items-center justify-center shrink-0">
                   <Upload className="w-8 h-8 text-[#F2CA50]" />
                </div>
                <div className="flex-1">
                   <h3 className="font-sans font-bold text-lg text-[#F2CA50] mb-2">Manual Verification Required</h3>
                   <p className="se-body text-[14px] text-[#e5e2e1]/80 mb-4 md:mb-0">
                      Your order is on hold until we receive your payment receipt. Please transfer the funds and upload the receipt to proceed.
                   </p>
                </div>
                <button 
                  onClick={() => navigate(`/shopping/manual-payment/${manualPaymentSlug}`, { state: { orderId: order._id } })}
                  className="h-[52px] px-8 bg-[#F2CA50] text-[#0e0e0e] rounded-[16px] font-sans font-bold uppercase tracking-wider text-[12px] hover:-translate-y-1 transition-transform shrink-0 w-full md:w-auto"
                >
                  Upload Receipt
                </button>
             </div>
          )}

          {/* Primary Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
             <button 
               onClick={() => navigate(`/shopping/order-tracking?orderId=${order._id}`)}
               className="h-[56px] flex-1 bg-[#fafafa] text-[#0e0e0e] rounded-[16px] font-sans font-bold uppercase tracking-wider text-[12px] hover:bg-[#F2CA50] transition-colors flex items-center justify-center gap-2"
             >
               Track My Order <ArrowRight className="w-4 h-4" />
             </button>
             <button 
               onClick={() => navigate('/shopping/product-list')}
               className="h-[56px] flex-1 border border-white/10 bg-[#1A1A1A] text-[#fafafa] rounded-[16px] font-sans font-bold uppercase tracking-wider text-[12px] hover:border-[#F2CA50] hover:text-[#F2CA50] transition-colors"
             >
               Continue Shopping
             </button>
             {user && (
               <button 
                 onClick={() => navigate('/shopping/orders')}
                 className="h-[56px] flex-1 border border-white/10 bg-[#1A1A1A] text-[#fafafa] rounded-[16px] font-sans font-bold uppercase tracking-wider text-[12px] hover:border-white/30 transition-colors"
               >
                 View My Orders
               </button>
             )}
          </div>
        </div>

        {/* ── RIGHT COLUMN (Order Summary) ── */}
        <div className="space-y-8">
           <div className="bg-[#1A1A1A] rounded-[24px] border border-white/5 p-6 md:p-8 sticky top-28">
              <h3 className="font-sans font-bold text-lg text-[#fafafa] mb-6">Order Summary</h3>
              
              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                 {order.items?.map((item, i) => (
                    <div key={i} className="flex gap-4">
                       <div className="w-16 h-20 bg-[#131313] rounded-[12px] border border-white/5 overflow-hidden shrink-0">
                          {item.productImage || item.image || item.product?.images?.[0]?.url ? (
                             <img src={item.productImage || item.image || item.product?.images?.[0]?.url} alt={item.title || item.productName || item.product?.name} className="w-full h-full object-cover" />
                          ) : (
                             <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-[#99907c]" /></div>
                          )}
                       </div>
                       <div className="flex-1 py-1">
                          <p className="font-sans font-semibold text-[13px] text-[#fafafa] line-clamp-1">{item.title || item.product?.name}</p>
                          <p className="text-[11px] text-[#99907c] mt-1">
                             {item.color && `Color: ${item.color} | `}{item.size && `Size: ${item.size}`}
                          </p>
                          <div className="flex justify-between items-center mt-2">
                             <span className="text-[11px] text-[#99907c]">Qty: {item.quantity}</span>
                             <span className="font-sans font-bold text-[13px] text-[#fafafa]">Rs {formatCurrency(item.price)}</span>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>

              <div className="space-y-3 pt-6 border-t border-white/5 text-[14px]">
                 <div className="flex justify-between text-[#99907c]">
                    <span>Subtotal</span>
                    <span>Rs {formatCurrency(subtotal)}</span>
                 </div>
                 <div className="flex justify-between text-[#99907c]">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? 'Free' : `Rs ${formatCurrency(shipping)}`}</span>
                 </div>
                 {discount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                       <span>Discount</span>
                       <span>- Rs {formatCurrency(discount)}</span>
                    </div>
                 )}
                 <div className="flex justify-between font-bold text-lg text-[#fafafa] pt-4 border-t border-white/5 mt-4">
                    <span>Total</span>
                    <span>Rs {formatCurrency(order.totalAmount)}</span>
                 </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5">
                 <p className="se-label text-[10px] uppercase tracking-widest text-[#99907c] mb-2">Payment Method</p>
                 <p className="font-sans text-[14px] text-[#fafafa]">
                    {order.paymentMethod === 'manual_bank_transfer' ? 'Manual Bank Transfer' : 
                     order.paymentMethod === 'cod' ? 'Cash on Delivery' : 
                     'Online Payment'}
                 </p>
              </div>
           </div>

           {/* Support Block */}
           <div className="bg-[#131313] rounded-[24px] border border-white/5 p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center shrink-0">
                 <MessageCircle className="w-5 h-5 text-[#F2CA50]" />
              </div>
              <div>
                 <h4 className="font-sans font-semibold text-[14px] text-[#fafafa] mb-1">Need Help?</h4>
                 <p className="text-[12px] text-[#99907c] mb-3">If you have any questions about your order, our elite support team is ready to assist.</p>
                 <Link to="/legal/contact" className="text-[11px] font-bold uppercase tracking-wider text-[#F2CA50] hover:underline">
                    Contact Support
                 </Link>
              </div>
           </div>
        </div>
      </div>

      {/* ── RECOMMENDATIONS ── */}
      <ForYouRail variant="recently-viewed" />
      
      {/* ── NEWSLETTER ── */}
      <Newsletter />
    </main>
  );
};

export default OrderSuccess;
