import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrderById } from "@/store/order-slice";
import { useSocketEvent } from "@/hooks/use-socket-events";
import { motion } from "framer-motion";
import {
  Check,
  Package,
  Truck,
  MapPin,
  Clock,
  ExternalLink,
  CreditCard,
  AlertCircle,
  Copy,
  MessageCircle,
  ChevronRight,
  FileText,
  Upload,
} from "lucide-react";
import AppLoader from "@/components/ui/AppLoader";
import { toast } from "@/hooks/use-toast";
import usePageMeta from "@/hooks/use-page-meta";
import ForYouRail from "@/components/landing/ForYouRail";
import { Newsletter } from "@/components/landing/CommunitySections";

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Helpers & Constants                                                       */
/* ──────────────────────────────────────────────────────────────────────────── */

const TRACKING_STEPS = [
  { key: "pending", label: "Order Confirmed", desc: "Your order has been received and is awaiting processing." },
  { key: "inProcess", label: "Preparing Order", desc: "Our team is carefully preparing your exclusive items." },
  { key: "inShipping", label: "Shipped", desc: "Your package has been dispatched and is on its way." },
  { key: "delivered", label: "Delivered", desc: "Your package has been successfully delivered." },
];

const formatCurrency = (amount = 0) =>
  Number(amount).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (value) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};

const formatTime = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });
};

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Component                                                                 */
/* ──────────────────────────────────────────────────────────────────────────── */

const OrderTracking = () => {
  usePageMeta({ title: "Track Your Order" });

  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentOrder, isLoading, orderError } = useSelector((state) => state.order);

  const [copiedTracking, setCopiedTracking] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const orderId = location.state?.orderId || searchParams.get("orderId");

  useEffect(() => {
    if (orderId) {
      dispatch(fetchOrderById(orderId));
    }
  }, [dispatch, orderId]);

  useSocketEvent("order:refresh", (payload) => {
    if (orderId && (!payload?.orderId || String(payload.orderId) === String(orderId))) {
      dispatch(fetchOrderById(orderId));
    }
  }, [dispatch, orderId]);

  useSocketEvent("order:refresh:public", (payload) => {
    if (orderId && String(payload?.orderId || "") === String(orderId)) {
      dispatch(fetchOrderById(orderId));
    }
  }, [dispatch, orderId]);

  /* ── EMPTY STATES ── */
  if (!orderId) {
    return (
      <div className="min-h-screen bg-page pt-[80px] flex items-center justify-center px-4 font-sans">
        <div className="max-w-md w-full bg-card rounded-[24px] border border-ink/5 p-8 text-center">
          <div className="w-20 h-20 mx-auto bg-panel rounded-full flex items-center justify-center border border-ink/5 mb-6">
            <Package className="w-8 h-8 text-gold-ink" />
          </div>
          <h1 className="se-serif text-3xl text-ink mb-3">Track Your Order</h1>
          <p className="se-body text-muted text-[15px] mb-8">
            Please select an order from your account history or enter your tracking details to view the status.
          </p>
          <div className="space-y-3">
            <Link to="/shopping/orders" className="flex items-center justify-center h-[56px] w-full bg-gold text-ongold rounded-[16px] font-sans font-bold uppercase tracking-wider text-[12px] hover:-translate-y-1 transition-transform">
              Go to Order History
            </Link>
            <Link to="/shopping/product-list" className="flex items-center justify-center h-[56px] w-full bg-panel border border-ink/10 text-ink rounded-[16px] font-sans font-bold uppercase tracking-wider text-[12px] hover:border-gold-ink transition-colors">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading && !currentOrder) {
    return <AppLoader message="Retrieving tracking data..." />;
  }

  if (orderError || !currentOrder) {
    return (
      <div className="min-h-screen bg-page pt-[80px] flex items-center justify-center px-4 font-sans">
        <div className="max-w-md w-full bg-card rounded-[24px] border border-red-500/20 p-8 text-center">
          <div className="w-20 h-20 mx-auto bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 mb-6">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="se-serif text-3xl text-ink mb-3">Tracking Unavailable</h1>
          <p className="se-body text-muted text-[15px] mb-8">
            {orderError || "We couldn't find an order matching that ID. Please check and try again."}
          </p>
          <Link to="/shopping/orders" className="flex items-center justify-center h-[56px] w-full bg-gold text-ongold rounded-[16px] font-sans font-bold uppercase tracking-wider text-[12px]">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  /* ── DATA PREP ── */
  const {
    _id,
    items = [],
    shippingAddress,
    contactNumber,
    status,
    paymentMethod,
    paymentStatus,
    manualPayment,
    totalAmount,
    createdAt,
    trackingNumber,
    courierName,
    trackingUrl,
    estimatedDelivery,
  } = currentOrder;

  const isCancelled = status === "cancelled";
  
  // Determine timeline progress
  const currentStepIndex = TRACKING_STEPS.findIndex((step) => step.key === status);
  // If status is cancelled, all are failed. If status is unknown, assume pending.
  const progressIndex = isCancelled ? -1 : currentStepIndex >= 0 ? currentStepIndex : 0;
  const progressPercentage = isCancelled ? 0 : Math.min(100, Math.max(0, (progressIndex / (TRACKING_STEPS.length - 1)) * 100));

  const copyTracking = () => {
    if (!trackingNumber) return;
    navigator.clipboard.writeText(trackingNumber);
    setCopiedTracking(true);
    toast({ title: "Tracking number copied" });
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  const copyAddress = () => {
    if (!shippingAddress) return;
    const addr = `${shippingAddress.address}, ${shippingAddress.city}, ${shippingAddress.pincode}`;
    navigator.clipboard.writeText(addr);
    setCopiedAddress(true);
    toast({ title: "Address copied" });
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const isManualBankTransfer = paymentMethod === "manual_bank_transfer";
  const manualPaymentRejected = isManualBankTransfer && paymentStatus === "failed";
  const manualPaymentSlug = manualPayment?.slug;

  return (
    <main className="min-h-screen bg-page text-ink-2 pt-[64px] md:pt-[72px] relative overflow-x-hidden font-sans">
      
      {/* ── HERO SECTION ── */}
      <section className="bg-panel border-b border-ink/5 py-12 md:py-16">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8">
          <nav className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted mb-6">
            <Link to="/" className="hover:text-gold-ink transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to="/shopping/orders" className="hover:text-gold-ink transition-colors">Orders</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-ink font-bold">Tracking</span>
          </nav>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="se-serif text-3xl md:text-4xl text-ink mb-2">Track Your Order</h1>
              <p className="se-body text-muted text-sm md:text-base">Stay updated on your order's journey from our warehouse to your door.</p>
            </div>
            <div className="text-left md:text-right">
              <p className="se-label text-[10px] uppercase tracking-widest text-muted mb-1">Order Reference</p>
              <p className="font-mono text-xl tracking-wider text-gold-ink">{_id}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-8 md:py-12 grid lg:grid-cols-[1fr_400px] gap-8 lg:gap-12 items-start">
        
        {/* ── LEFT COLUMN ── */}
        <div className="space-y-8">
          
          {/* Order Progress Card */}
          <div className="bg-card rounded-[24px] border border-ink/5 p-6 md:p-8">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                   <h2 className="font-sans font-bold text-lg text-ink mb-1">
                     {isCancelled ? 'Order Cancelled' : status === 'delivered' ? 'Delivered Successfully' : 'Arriving Soon'}
                   </h2>
                   {estimatedDelivery && !isCancelled && (
                     <p className="se-body text-muted text-[14px]">
                       Estimated Delivery: <span className="text-ink font-medium">{formatDate(estimatedDelivery)}</span>
                     </p>
                   )}
                </div>
                {trackingNumber && (
                   <div className="flex items-center gap-3 bg-panel px-4 py-2.5 rounded-[12px] border border-ink/10 shrink-0">
                      <div>
                         <p className="text-[10px] uppercase tracking-widest text-muted mb-0.5">Tracking Number</p>
                         <p className="font-mono text-ink text-sm">{trackingNumber}</p>
                      </div>
                      <button onClick={copyTracking} className="ml-2 text-muted hover:text-gold-ink transition-colors">
                        {copiedTracking ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                   </div>
                )}
             </div>

             {/* Progress Bar */}
             {!isCancelled && (
               <div className="mb-4">
                 <div className="h-2 w-full bg-panel rounded-full overflow-hidden border border-ink/5">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-gold/50 to-gold rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                 </div>
                 <div className="flex justify-between mt-3 text-[11px] font-bold uppercase tracking-widest">
                    <span className="text-gold-ink">Confirmed</span>
                    <span className={progressPercentage >= 100 ? "text-gold-ink" : "text-muted"}>Delivered</span>
                 </div>
               </div>
             )}
          </div>

          {/* Vertical Timeline */}
          <div className="bg-card rounded-[24px] border border-ink/5 p-6 md:p-8">
             <h3 className="font-sans font-bold text-lg text-ink mb-8">Tracking History</h3>
             
             {isCancelled ? (
                <div className="flex items-start gap-4">
                   <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                   </div>
                   <div>
                      <h4 className="font-sans font-semibold text-[15px] text-red-400">Order Cancelled</h4>
                      <p className="se-body text-muted text-[14px] mt-1">This order has been cancelled and will not be fulfilled.</p>
                   </div>
                </div>
             ) : (
               <div className="relative pl-5 border-l-2 border-ink/10 space-y-8 ml-3">
                 {TRACKING_STEPS.map((step, index) => {
                   const isCompleted = progressIndex >= index;
                   const isCurrent = progressIndex === index;
                   
                   // Dynamic coloring
                   const dotColor = isCurrent ? 'bg-gold border-gold-ink' : isCompleted ? 'bg-emerald-400 border-emerald-400' : 'bg-panel border-ink/20';
                   const textColor = isCurrent ? 'text-gold-ink' : isCompleted ? 'text-ink' : 'text-muted';
                   
                   return (
                     <motion.div 
                       key={step.key}
                       initial={{ opacity: 0, y: 20 }}
                       whileInView={{ opacity: 1, y: 0 }}
                       viewport={{ once: true, margin: "-50px" }}
                       transition={{ duration: 0.5, delay: index * 0.1 }}
                       className="relative"
                     >
                       <div className={`absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full border-[3px] ${dotColor} ${isCurrent ? 'shadow-[0_0_15px_#F2CA50]' : ''}`} />
                       
                       <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 md:gap-4">
                         <div>
                            <h4 className={`font-sans font-bold text-[15px] tracking-wide mb-1 ${textColor}`}>
                               {step.label}
                            </h4>
                            <p className="se-body text-muted text-[13px]">{step.desc}</p>
                         </div>
                         
                         {/* Mock timestamps for completed steps since backend doesn't store timeline history yet */}
                         {isCompleted && (
                           <div className="text-left md:text-right shrink-0 mt-1 md:mt-0">
                             <p className="text-[12px] text-ink">{formatDate(createdAt)}</p>
                             <p className="text-[10px] text-muted">{index === 0 ? formatTime(createdAt) : ''}</p>
                           </div>
                         )}
                       </div>
                     </motion.div>
                   );
                 })}
               </div>
             )}
          </div>

          {/* Delivery & Payment Info Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Delivery Info */}
            <div className="bg-card rounded-[24px] border border-ink/5 p-6 md:p-8 flex flex-col h-full">
               <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-ink/5 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-muted" />
                  </div>
                  <h3 className="font-sans font-bold text-[16px] text-ink">Delivery Info</h3>
               </div>
               
               {shippingAddress ? (
                 <div className="flex-1 space-y-4">
                   <div>
                     <p className="text-[10px] uppercase tracking-widest text-muted mb-1">Address</p>
                     <p className="se-body text-ink text-[13px] leading-relaxed">
                        {shippingAddress.fullName}<br />
                        {shippingAddress.address}<br />
                        {shippingAddress.city}, {shippingAddress.pincode}<br />
                        Phone: {shippingAddress.phone}
                     </p>
                   </div>
                   
                   {courierName && (
                     <div>
                       <p className="text-[10px] uppercase tracking-widest text-muted mb-1">Courier</p>
                       <p className="text-ink text-[13px] font-medium">{courierName}</p>
                     </div>
                   )}
                 </div>
               ) : (
                 <p className="text-[13px] text-muted flex-1">Address details unavailable.</p>
               )}

               {trackingUrl ? (
                 <a href={trackingUrl} target="_blank" rel="noreferrer" className="mt-6 flex items-center justify-center gap-2 w-full h-[48px] bg-transparent border border-ink/10 rounded-[12px] text-[11px] font-bold uppercase tracking-wider hover:border-gold-ink hover:text-gold-ink transition-colors">
                   Track via Courier <ExternalLink className="w-3.5 h-3.5" />
                 </a>
               ) : (
                 <button onClick={copyAddress} className="mt-6 flex items-center justify-center gap-2 w-full h-[48px] bg-panel rounded-[12px] text-[11px] font-bold uppercase tracking-wider text-muted hover:text-ink transition-colors">
                   Copy Address <Copy className="w-3.5 h-3.5" />
                 </button>
               )}
            </div>

            {/* Payment Info */}
            <div className="bg-card rounded-[24px] border border-ink/5 p-6 md:p-8 flex flex-col h-full">
               <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-ink/5 flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5 text-muted" />
                  </div>
                  <h3 className="font-sans font-bold text-[16px] text-ink">Payment Info</h3>
               </div>
               
               <div className="flex-1 space-y-4">
                 <div>
                   <p className="text-[10px] uppercase tracking-widest text-muted mb-1">Method</p>
                   <p className="text-ink text-[13px] font-medium">
                     {paymentMethod === 'manual_bank_transfer' ? 'Manual Bank Transfer' : paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                   </p>
                 </div>
                 
                 <div>
                   <p className="text-[10px] uppercase tracking-widest text-muted mb-2">Status</p>
                   <div className="inline-flex">
                      {paymentStatus === 'paid' || paymentStatus === 'success' ? (
                        <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest rounded-full">Paid</span>
                      ) : paymentStatus === 'failed' ? (
                        <span className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-widest rounded-full">Failed</span>
                      ) : (
                        <span className="px-3 py-1 bg-gold/10 border border-gold-ink/20 text-gold-ink text-[10px] font-bold uppercase tracking-widest rounded-full">Pending</span>
                      )}
                   </div>
                 </div>
               </div>

               {manualPaymentRejected && manualPaymentSlug && (
                 <button 
                   onClick={() => navigate(`/shopping/manual-payment/${manualPaymentSlug}`, { state: { orderId: _id } })}
                   className="mt-6 flex items-center justify-center gap-2 w-full h-[48px] bg-red-500/10 border border-red-500/30 rounded-[12px] text-[11px] font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/20 transition-colors"
                 >
                   Re-upload Receipt <Upload className="w-3.5 h-3.5" />
                 </button>
               )}
               {paymentStatus === 'paid' && (
                 <button className="mt-6 flex items-center justify-center gap-2 w-full h-[48px] bg-panel rounded-[12px] text-[11px] font-bold uppercase tracking-wider text-muted hover:text-ink transition-colors">
                   Download Invoice <FileText className="w-3.5 h-3.5" />
                 </button>
               )}
            </div>

          </div>
        </div>

        {/* ── RIGHT COLUMN (Order Summary & Support) ── */}
        <div className="space-y-6">
           
           {/* Order Items */}
           <div className="bg-card rounded-[24px] border border-ink/5 p-6 md:p-8">
              <h3 className="font-sans font-bold text-[16px] text-ink mb-6">Items Ordered</h3>
              
              <div className="space-y-4 mb-6">
                 {items?.map((item, i) => (
                    <div key={i} className="flex gap-4">
                       <div className="w-16 h-20 bg-panel rounded-[12px] border border-ink/5 overflow-hidden shrink-0">
                          {item.productImage || item.image || item.product?.images?.[0]?.url ? (
                             <img src={item.productImage || item.image || item.product?.images?.[0]?.url} alt={item.title || item.productName || item.product?.name} className="w-full h-full object-cover" />
                          ) : (
                             <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-muted" /></div>
                          )}
                       </div>
                       <div className="flex-1 py-1">
                          <p className="font-sans font-semibold text-[13px] text-ink line-clamp-1">{item.title || item.productName || item.product?.name}</p>
                          <p className="text-[11px] text-muted mt-1">
                             {item.color && `Color: ${item.color} | `}{item.size && `Size: ${item.size}`}
                          </p>
                          <div className="flex justify-between items-center mt-2">
                             <span className="text-[11px] text-muted">Qty: {item.quantity}</span>
                             <span className="font-sans font-bold text-[13px] text-ink">Rs {formatCurrency(item.price)}</span>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>

              <div className="flex justify-between font-bold text-lg text-ink pt-4 border-t border-ink/5">
                 <span>Total Paid</span>
                 <span>Rs {formatCurrency(totalAmount)}</span>
              </div>
           </div>

           {/* Support Block */}
           <div className="bg-gradient-to-br from-panel to-page rounded-[24px] border border-ink/5 p-6 md:p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-ink/5 mx-auto flex items-center justify-center mb-4">
                 <MessageCircle className="w-6 h-6 text-ink" />
              </div>
              <h4 className="font-sans font-bold text-[16px] text-ink mb-2">Need Help?</h4>
              <p className="text-[13px] text-muted mb-6">If you have any questions about this order, our support team is available 24/7.</p>
              
              <div className="space-y-3">
                 <a href="mailto:support@sagaelite.com" className="flex items-center justify-center gap-2 h-[48px] w-full border border-ink/10 rounded-[12px] text-[11px] font-bold uppercase tracking-wider hover:border-ink/30 transition-colors">
                    <Mail className="w-4 h-4" /> Email Support
                 </a>
                 <Link to="/legal/contact" className="flex items-center justify-center gap-2 h-[48px] w-full border border-gold-ink/30 text-gold-ink rounded-[12px] text-[11px] font-bold uppercase tracking-wider hover:bg-gold/10 transition-colors">
                    <Phone className="w-4 h-4" /> Contact Us
                 </Link>
              </div>
           </div>

        </div>
      </div>

      {/* ── RECOMMENDATIONS ── */}
      <ForYouRail variant="for-you" />
      
      {/* ── NEWSLETTER ── */}
      <Newsletter />
    </main>
  );
};

export default OrderTracking;
