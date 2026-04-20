import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Check } from "lucide-react";

const OrderSuccess = () => {
  const location = useLocation();
  const orderId = location.state?.orderId || `TEM-${Math.floor(Math.random() * 100000000)}`;
  const totalAmount = location.state?.totalAmount || "0.00";

  return (
    <main className="min-h-screen bg-[#060606] text-white flex flex-col items-center pt-12 pb-24 px-6 md:px-12 max-w-7xl mx-auto">
      {/* Hero Section: Celebratory & Minimal */}
      <section className="w-full text-center mb-16 mt-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-[#D4AF37]/10 border border-[#D4AF37] rounded-full mb-8 text-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.2)]">
          <Check className="w-10 h-10" />
        </div>
        <h1 className="font-bold text-4xl md:text-5xl tracking-tighter text-white mb-4">
          The transaction is complete.
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
          Thank you for your order. We are preparing your selection with the same premium quality expected.
        </p>
        <div className="mt-8 bg-[#111] p-6 rounded-2xl border border-gray-800 inline-block">
          <span className="uppercase tracking-widest text-xs text-gray-500 font-semibold block mb-2">Order Reference</span>
          <p className="font-bold text-2xl tracking-widest text-[#D4AF37]">#{orderId}</p>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 w-full mt-8">
        {/* Left Column: Shipping & Details */}
        <div className="lg:col-span-7 space-y-12">
          {/* Shipping Timeline */}
          <div className="bg-[#0a0a0a] border border-[#222] p-8 rounded-3xl">
            <h2 className="font-bold text-xl mb-8 tracking-tight text-[#D4AF37]">Delivery Timeline</h2>
            <div className="relative space-y-8">
              {/* Vertical Line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-[1px] bg-gray-800"></div>

              {/* Step 1 */}
              <div className="flex items-start gap-6 relative">
                <div className="w-[23px] h-[23px] rounded-full bg-[#D4AF37] flex items-center justify-center z-10 border-4 border-[#0a0a0a]">
                  <div className="w-1.5 h-1.5 rounded-full bg-black"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-white">Order Confirmed</h3>
                  <p className="text-xs text-gray-500 mt-1">Verification pending</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-6 relative">
                <div className="w-[23px] h-[23px] rounded-full bg-transparent border-2 border-gray-700 flex items-center justify-center z-10 box-content outline outline-4 outline-[#0a0a0a]">
                  <div className="w-1.5 h-1.5 rounded-full bg-transparent"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-400">Preparation & Hand-Crafting</h3>
                  <p className="text-xs text-gray-600 mt-1">Expected within 1-2 days</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-6 relative">
                 <div className="w-[23px] h-[23px] rounded-full bg-transparent border-2 border-gray-700 flex items-center justify-center z-10 box-content outline outline-4 outline-[#0a0a0a]">
                  <div className="w-1.5 h-1.5 rounded-full bg-transparent"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-400">Dispatch</h3>
                  <p className="text-xs text-gray-600 mt-1">Pending shipping allocation</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
            <Link
              to="/shopping/order-tracking"
              state={{ orderId }}
              className="w-full sm:w-auto px-10 py-4 bg-[#D4AF37] hover:bg-yellow-500 text-black font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)] flex items-center justify-center"
            >
              Track Order
            </Link>
            <Link
              to="/shopping/product-list"
              className="w-full sm:w-auto px-10 py-4 text-[#D4AF37] font-bold rounded-xl text-center transition-all hover:bg-[#D4AF37]/10 border border-transparent hover:border-[#D4AF37]/30"
            >
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Right Column: Order Info */}
        <aside className="lg:col-span-5">
          <div className="bg-[#0a0a0a] border border-[#222] p-8 rounded-3xl sticky top-8">
            <h2 className="font-bold text-xl mb-6 tracking-tight text-white">Financial Breakdown</h2>
            
            <div className="space-y-4 pt-4 border-t border-gray-800">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Subtotal</span>
                <span className="font-medium text-white">LKR {totalAmount}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Shipping</span>
                <span className="font-medium text-[#D4AF37]">Calculated Later</span>
              </div>
              <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-800">
                <span className="font-bold text-lg text-white">Total Processed</span>
                <span className="font-extrabold text-2xl tracking-tighter text-[#D4AF37]">LKR {totalAmount}</span>
              </div>
            </div>
            
            <div className="mt-8 flex items-center gap-3 bg-[#111] border border-[#D4AF37]/20 px-4 py-3 rounded-xl w-fit">
              <Check className="text-[#D4AF37] w-4 h-4" />
              <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">Encrypted Transition Verified</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
};

export default OrderSuccess;