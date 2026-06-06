import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, PackageOpen } from "lucide-react";
import { modalBackdropVariants, slideInPanelVariants } from "@/components/admin-components/_shared/animations";

const GiftOrdersDrawer = ({ isOpen, onClose, gift, orders = [], loading }) => {
  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            variants={modalBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          {/* Drawer Panel */}
          <motion.div
            className="relative flex w-full max-w-md flex-col bg-[#0e0e0e] border-l border-white/10 shadow-2xl h-full overflow-hidden"
            variants={slideInPanelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 bg-black/40 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-white">Collectible details</h2>
                <p className="text-xs text-gray-500 mt-0.5">Order distribution history</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-gray-400 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
              {gift && (
                <div className="p-6 space-y-6">
                  {/* Gift Info Card */}
                  <div className="flex gap-4 rounded-2xl border border-white/10 bg-black/40 p-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-black/60 flex items-center justify-center">
                      {gift.imageUrl ? (
                        <img
                          src={gift.imageUrl}
                          alt={gift.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <PackageOpen className="h-6 w-6 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{gift.name}</h3>
                      <div className="mt-1 flex flex-wrap gap-2 text-[10px] font-mono uppercase tracking-widest text-gray-500">
                        <span className="text-[#D4AF37]">{gift.rarity}</span>
                        <span>•</span>
                        <span>{gift.drop?.name || "Global"} scope</span>
                      </div>
                      <p className="mt-2 text-xs text-gray-400">
                        {gift.description || "No description"}
                      </p>
                    </div>
                  </div>

                  {/* Stats Summary */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-500">Orders attached</p>
                      <p className="mt-1 text-xl font-bold text-white">{gift.orderCount || orders.length || 0}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-500">Probability</p>
                      <p className="mt-1 text-xl font-bold text-white">{gift.probability ?? 100}%</p>
                    </div>
                  </div>

                  {/* Orders List */}
                  <div>
                    <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">
                      Recent Orders
                    </h4>
                    
                    {loading ? (
                      <div className="flex items-center justify-center py-10 text-gray-500">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/10 py-10 text-center text-sm text-gray-500">
                        No orders have received this collectible yet.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {orders.map((order) => (
                          <div
                            key={order._id}
                            className="rounded-xl border border-white/5 bg-white/[0.02] p-4 transition hover:bg-white/[0.04]"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-mono text-xs font-bold text-[#D4AF37]">
                                  #{String(order._id).slice(-6).toUpperCase()}
                                </p>
                                <p className="mt-0.5 text-xs text-gray-400">
                                  {order.user?.email || order.guest?.email || order.guestEmail || "Guest checkout"}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                                  order.gift?.revealed
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : "bg-gray-500/10 text-gray-400"
                                }`}>
                                  {order.gift?.revealed ? "Revealed" : "Hidden"}
                                </span>
                                <p className="mt-1 text-[10px] uppercase text-gray-500">
                                  {order.status}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="border-t border-white/10 bg-black/40 px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-full border border-white/10 bg-black/40 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Close details
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default GiftOrdersDrawer;
