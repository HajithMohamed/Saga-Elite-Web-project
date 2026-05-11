import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrderById } from "@/store/order-slice";
import { Check, Package, ShieldCheck, Truck, Copy, Clock, MessageCircle, ArrowRight, Star, Upload } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { resolveColor } from "@/components/ui/editorial";
import AppLoader from "@/components/ui/AppLoader";
import { toast } from "@/hooks/use-toast";

const OrderSuccess = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  
  const stateOrderId = location.state?.orderId;
  const fallbackOrderId = `TEM-${Math.floor(Math.random() * 100000000)}`;
  const displayOrderId = stateOrderId || fallbackOrderId;
  const totalAmountState = location.state?.amount || location.state?.totalAmount;
  
  const { currentOrder, isLoading } = useSelector((state) => state.order);
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
    items: [],
    guestEmail: location.state?.email || "your email",
    shippingAddress: "",
  };

  const primaryItem = order.items?.[0];
  const primaryProduct = primaryItem?.product;
  const primaryVariant = primaryItem?.variant || primaryItem; // Depending on API response structure

  // Manual bank transfer recovery CTA (Fix #1).
  const manualPaymentSlug = location.state?.slug || currentOrder?.manualPayment?.slug;
  const isManualBankTransfer =
    (currentOrder?.paymentMethod || location.state?.paymentMethod) === "manual_bank_transfer";
  const showUploadReceiptCta = Boolean(isManualBankTransfer && manualPaymentSlug);
  
  const colorName = primaryVariant?.color || primaryItem?.color;
  const themeColor = colorName ? resolveColor(colorName) : "#f2ca50";

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

  const formatLKR = (value = 0) =>
    `LKR ${(Number(value) || 0).toLocaleString("en-LK", {
      maximumFractionDigits: 0,
    })}`;

  const getStatusIndex = (status) => {
    const statuses = ["pending", "inProcess", "inShipping", "delivered"];
    return statuses.indexOf(status) !== -1 ? statuses.indexOf(status) : 0;
  };

  const statusIndex = getStatusIndex(order.orderStatus);

  if (isLoading && !currentOrder) {
    return <AppLoader message="Securing your selection..." />;
  }

  return (
    <main className="min-h-screen bg-[#060606] text-[#e5e2e1] pb-32 md:pb-24 relative overflow-hidden font-sans">
      {/* Cinematic Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div 
          className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full blur-[120px] opacity-20"
          style={{ background: `radial-gradient(circle, var(--accent) 0%, transparent 70%)` }}
        />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      <div className="max-w-[1280px] mx-auto px-6 md:px-8 pt-16 md:pt-24 relative z-10">
        
        {/* SUCCESS HERO */}
        <section className="w-full text-center mb-16">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-8 relative"
          >
            <div className="absolute inset-0 rounded-full border border-[var(--accent)]/30 animate-[spin_4s_linear_infinite]" />
            <div className="absolute inset-2 rounded-full border border-[var(--accent)]/10" />
            <div className="w-16 h-16 bg-[var(--accent)]/10 rounded-full flex items-center justify-center shadow-[0_0_40px_var(--accent-glow)] backdrop-blur-md border border-[var(--accent)]/50">
              <Check className="w-8 h-8 text-[var(--accent)]" />
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="se-serif text-4xl md:text-6xl tracking-tight text-white mb-6">
              Your Exclusive Drop Is Confirmed
            </h1>
            <p className="text-[#99907c] text-lg max-w-2xl mx-auto leading-relaxed">
              Welcome to the elite collection. Every Saga Elite piece is carefully prepared and hand-inspected before dispatch. 
            </p>
          </motion.div>

          {/* Smart Order Number UI */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mt-10 inline-flex flex-col items-center"
          >
            <div className="bg-[#0d0d0d] border border-[#1c1b1b] rounded-2xl p-6 shadow-2xl flex items-center gap-6">
              <div>
                <span className="se-label text-[9px] uppercase tracking-[0.28em] text-[#574500] block mb-2">Order Reference</span>
                <p className="se-mono text-xl md:text-2xl tracking-widest text-white">{order._id}</p>
              </div>
              <div className="w-px h-12 bg-[#1c1b1b]"></div>
              <button 
                onClick={copyToClipboard}
                className="w-12 h-12 rounded-xl bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-[#99907c] hover:text-[var(--accent)] hover:border-[var(--accent)]/50 transition-all group"
              >
                {copied ? <Check className="w-5 h-5 text-[var(--accent)]" /> : <Copy className="w-5 h-5 group-hover:scale-110 transition-transform" />}
              </button>
            </div>
            {order.guestEmail && (
              <p className="text-sm text-[#99907c] mt-4 flex items-center gap-2">
                <Check className="w-4 h-4 text-[var(--accent)]" /> 
                Confirmation sent to <span className="text-white font-medium">{order.guestEmail}</span>
              </p>
            )}
          </motion.div>
        </section>

        {/* MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mt-12">
          
          {/* Left Column: Delivery Journey & Packaging */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Delivery Journey */}
            <section className="bg-[#0d0d0d] border border-[#1c1b1b] p-8 md:p-10 rounded-[2rem] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Truck className="w-32 h-32 text-[var(--accent)]" />
              </div>
              <h2 className="se-serif text-2xl text-white mb-8">Your Delivery Journey</h2>
              
              <div className="relative space-y-8 mt-10">
                <div className="absolute left-[15px] top-4 bottom-4 w-px bg-[#1c1b1b]"></div>
                
                {[
                  { label: "Order Confirmed", desc: "Secured & verified", status: "pending", index: 0 },
                  { label: "Quality Inspection", desc: "Hand-checked by our team", status: "inProcess", index: 1 },
                  { label: "Premium Packaging", desc: "Signature unboxing preparation", status: "inProcess", index: 1 },
                  { label: "Dispatched", desc: "En route to you", status: "inShipping", index: 2 },
                  { label: "Delivered", desc: "Enjoy your Saga Elite piece", status: "delivered", index: 3 }
                ].map((step, idx) => {
                  // Slightly hacky logic to handle the 5 steps UI vs 4 API statuses
                  const isCompleted = statusIndex >= step.index;
                  const isActive = statusIndex === step.index && (idx === 0 || idx === 1 || idx === 3 || idx === 4); // simplistic active state
                  
                  return (
                    <div key={idx} className="flex items-start gap-6 relative z-10">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-4 border-[#0d0d0d] transition-colors duration-500",
                        isCompleted ? "bg-[var(--accent)]" : "bg-[#1a1a1a] border-[#333]"
                      )}>
                        {isCompleted && <Check className="w-3.5 h-3.5 text-[#000]" strokeWidth={3} />}
                      </div>
                      <div className={cn("pt-1", !isCompleted && "opacity-50")}>
                        <h3 className={cn("font-semibold text-base", isCompleted ? "text-white" : "text-[#99907c]")}>{step.label}</h3>
                        <p className="text-sm text-[#574500] mt-1">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Unboxing Experience Preview */}
            <section className="bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-[#1c1b1b] p-8 rounded-[2rem] flex flex-col md:flex-row items-center gap-8">
              <div className="w-full md:w-1/3 aspect-square bg-[#060606] rounded-xl border border-[#222] flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-[var(--accent)]/5 group-hover:bg-[var(--accent)]/10 transition-colors"></div>
                <Package className="w-16 h-16 text-[#333] group-hover:text-[var(--accent)] transition-colors duration-500" strokeWidth={1} />
              </div>
              <div className="w-full md:w-2/3">
                <div className="inline-flex items-center gap-2 bg-[var(--accent)]/10 border border-[var(--accent)]/20 px-3 py-1 rounded-full mb-4">
                  <Star className="w-3 h-3 text-[var(--accent)]" />
                  <span className="se-label text-[9px] uppercase tracking-widest text-[var(--accent)]">Signature Experience</span>
                </div>
                <h3 className="se-serif text-xl text-white mb-2">Delivered In Premium Packaging</h3>
                <p className="text-[#99907c] text-sm leading-relaxed mb-4">
                  Your selection includes authenticity protection, secure wrapping, and our signature Saga Elite matte-black box.
                </p>
              </div>
            </section>
            
          </div>

          {/* Right Column: Product Hero & Order Summary */}
          <aside className="lg:col-span-5 space-y-8">
            
            {/* Product Hero Showcase */}
            {primaryProduct && (
              <div className="bg-[#0d0d0d] border border-[var(--accent)]/20 p-6 md:p-8 rounded-[2rem] relative overflow-hidden group">
                <div className="absolute top-0 right-0 bg-[var(--accent)] text-black se-label text-[9px] tracking-widest px-4 py-2 rounded-bl-xl font-bold z-10">
                  LIMITED RELEASE
                </div>
                
                <div className="aspect-[4/5] bg-[#111] rounded-xl overflow-hidden mb-6 relative">
                  <img 
                    src={primaryProduct.image || primaryProduct.images?.[0] || "/placeholder-image.jpg"} 
                    alt={primaryProduct.title}
                    className="w-full h-full object-cover mix-blend-luminosity group-hover:mix-blend-normal transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-transparent opacity-80"></div>
                </div>

                <div>
                  <h3 className="se-serif text-2xl text-white mb-2">{primaryProduct.title}</h3>
                  <div className="flex flex-wrap gap-3 mt-4">
                    {primaryVariant?.size && (
                      <div className="px-3 py-1.5 bg-[#1a1a1a] border border-[#333] rounded-md text-xs text-white uppercase font-medium">
                        Size: {primaryVariant.size}
                      </div>
                    )}
                    {primaryVariant?.color && (
                      <div className="px-3 py-1.5 bg-[#1a1a1a] border border-[#333] rounded-md text-xs text-white capitalize flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full border border-gray-600" style={{ backgroundColor: themeColor }}></span>
                        {primaryVariant.color}
                      </div>
                    )}
                    {primaryItem?.quantity > 1 && (
                      <div className="px-3 py-1.5 bg-[#1a1a1a] border border-[#333] rounded-md text-xs text-white">
                        Qty: {primaryItem.quantity}
                      </div>
                    )}
                  </div>
                  
                  {order.items?.length > 1 && (
                    <p className="text-[#574500] text-xs mt-4 italic">
                      + {order.items.length - 1} more item(s) in this collection
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Financial Summary */}
            <div className="bg-[#0d0d0d] border border-[#1c1b1b] p-8 rounded-[2rem]">
              <h2 className="se-serif text-xl text-white mb-6">Order Summary</h2>
              
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-[#99907c]">Total Processed</span>
                  <span className="font-medium text-white">{formatLKR(order.totalAmount)}</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-[#1c1b1b]">
                  <span className="text-[#99907c]">Estimated Arrival</span>
                  <span className="font-medium text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[var(--accent)]" /> 3-5 Business Days
                  </span>
                </div>
              </div>
              
              <div className="mt-8 flex items-center gap-3 bg-[var(--accent)]/5 border border-[var(--accent)]/20 px-4 py-3 rounded-xl">
                <ShieldCheck className="text-[var(--accent)] w-5 h-5 shrink-0" />
                <span className="text-[10px] uppercase tracking-widest text-[var(--accent)] font-bold leading-relaxed">
                  Secure Payment Verified
                </span>
              </div>
            </div>

            {showUploadReceiptCta && (
              <Link
                to={`/shopping/manual-payment/${manualPaymentSlug}`}
                className="flex items-center justify-center gap-3 rounded-xl bg-amber-500 px-6 py-4 text-sm font-bold uppercase tracking-widest text-black transition hover:bg-amber-400"
              >
                <Upload className="h-4 w-4" />
                Upload your receipt
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}

            {/* Customer Support & Sharing */}
            <div className="grid grid-cols-2 gap-4">
              <a
                href="https://wa.me/94770704274"
                target="_blank"
                rel="noreferrer"
                className="bg-[#0d0d0d] hover:bg-[#111] border border-[#1c1b1b] p-4 rounded-xl flex flex-col items-center justify-center text-center gap-2 transition-colors group"
              >
                <MessageCircle className="w-6 h-6 text-[#99907c] group-hover:text-green-500 transition-colors" />
                <span className="text-xs text-[#e5e2e1] font-medium">WhatsApp Help</span>
              </a>
              <Link
                to="/shopping/home"
                className="bg-[#0d0d0d] hover:bg-[#111] border border-[#1c1b1b] p-4 rounded-xl flex flex-col items-center justify-center text-center gap-2 transition-colors group"
              >
                <ArrowRight className="w-6 h-6 text-[#99907c] group-hover:text-[var(--accent)] transition-colors" />
                <span className="text-xs text-[#e5e2e1] font-medium">Explore More</span>
              </Link>
            </div>

          </aside>
        </div>

        {/* Recommended Products (Static for now to mimic luxury upsell) */}
        <section className="mt-24 mb-12 border-t border-[#1c1b1b] pt-16">
          <h2 className="se-serif text-3xl text-center text-white mb-12">Complete The Collection</h2>
          <div className="flex justify-center">
             <Link 
              to="/shopping/product-list"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#111] border border-[#333] hover:border-[var(--accent)] text-white text-sm tracking-widest uppercase rounded-full transition-all group"
             >
               View Latest Arrivals
               <ArrowRight className="w-4 h-4 text-[#99907c] group-hover:text-[var(--accent)] transition-colors group-hover:translate-x-1" />
             </Link>
          </div>
        </section>

      </div>

      {/* Mobile Sticky Track Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#060606]/90 backdrop-blur-md border-t border-[#1c1b1b] md:hidden z-50">
        <Link
          to={`/shopping/order-tracking?orderId=${displayOrderId}`}
          className="w-full h-14 bg-[var(--accent)] text-black font-bold uppercase tracking-widest text-xs rounded-xl flex items-center justify-center shadow-[0_0_20px_var(--accent-glow)]"
        >
          Track My Order
        </Link>
      </div>
    </main>
  );
};

export default OrderSuccess;
