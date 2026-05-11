import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Package, ArrowRight, Star } from "lucide-react";

import { fetchUserOrders } from "@/store/order-slice";
import { fetchMyPendingManualPayments } from "@/store/manualPaymentSlice";
import StatusBadge from "@/components/common-components/StatusBadge";
import { Upload } from "lucide-react";

const formatCurrency = (amount = 0) =>
  Number(amount).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const getOrderPreviewImage = (order) =>
  order.items?.find((item) => item.product?.images?.[0]?.url)?.product
    ?.images?.[0]?.url ||
  order.items?.find((item) => item.product?.primaryImage)?.product
    ?.primaryImage ||
  "/LOGO.png";

const FILTER_TABS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "processing", label: "Processing" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
];

const matchesFilter = (status, filterId) => {
  const s = String(status || "").toLowerCase();
  if (filterId === "all") return true;
  if (filterId === "pending") {
    return s === "pending" || s === "pending_payment";
  }
  if (filterId === "processing") {
    return (
      s === "processing" ||
      s === "verification_pending" ||
      s === "confirmed" ||
      s === "proof_submitted"
    );
  }
  if (filterId === "shipped") return s === "shipped";
  if (filterId === "delivered") return s === "delivered";
  if (filterId === "cancelled") return s === "cancelled";
  return true;
};

const Orders = () => {
  const dispatch = useDispatch();
  const { userOrders, isLoading } = useSelector((state) => state.order);
  const pendingPayments = useSelector(
    (state) => state.manualPayment?.pendingForCurrentVisitor ?? []
  );
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    dispatch(fetchUserOrders());
    dispatch(fetchMyPendingManualPayments());
  }, [dispatch]);

  // Map orderId → manual payment slug for the "Upload receipt" CTA.
  const slugByOrderId = useMemo(() => {
    const map = new Map();
    pendingPayments.forEach((p) => {
      const orderId = p.order?._id || p.orderId;
      if (orderId && p.slug) map.set(String(orderId), p.slug);
    });
    return map;
  }, [pendingPayments]);

  const filteredOrders = useMemo(
    () =>
      userOrders.filter((order) => matchesFilter(order.status, filter)),
    [userOrders, filter]
  );

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <div className="container mx-auto max-w-7xl px-4 py-10 md:px-6">
        <nav className="mb-8 flex gap-2 text-xs uppercase text-muted-foreground">
          <Link to="/shopping/home">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/shopping/account">Account</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[#D4AF37]">Orders</span>
        </nav>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#D4AF37]">
              Order History
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">
              All Your Orders
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Filter by status or open tracking for live updates.
            </p>
          </div>
          <Link
            to="/shopping/account"
            className="inline-flex items-center gap-2 rounded-full bg-muted px-5 py-3 text-sm font-semibold transition-colors hover:bg-[#D4AF37] hover:text-black dark:bg-white/5 dark:text-white"
          >
            Account Summary <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`relative rounded-full px-4 py-2 text-[11px] uppercase tracking-widest transition-colors ${
                filter === tab.id
                  ? "text-black"
                  : "border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10"
              }`}
            >
              {filter === tab.id ? (
                <motion.span
                  layoutId="orders-status-pill"
                  className="absolute inset-0 rounded-full bg-[#D4AF37]"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              ) : null}
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-52 animate-pulse rounded-3xl bg-muted dark:bg-[#111111]"
              />
            ))}
          </div>
        ) : userOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-[#D4AF37]/10 bg-surface-container-low p-10 text-center dark:bg-[#090909]"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#D4AF37]/10 text-[#D4AF37]">
              <Package className="h-6 w-6" />
            </div>
            <p className="text-lg font-semibold">No orders yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Once you place an order, it will appear here.
            </p>
          </motion.div>
        ) : filteredOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-3xl border border-border p-10 text-center text-muted-foreground"
          >
            No orders in this category.
          </motion.div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order, index) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.4) }}
                whileHover={{
                  y: -2,
                  boxShadow: "0 12px 40px rgba(212, 175, 55, 0.12)",
                }}
                className="rounded-3xl border border-[#D4AF37]/10 bg-surface-container-low p-6 dark:bg-[#090909]"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                    <div className="h-28 w-24 shrink-0 overflow-hidden rounded-2xl border border-white/5 bg-muted dark:bg-[#111]">
                      <img
                        src={getOrderPreviewImage(order)}
                        alt={order.items?.[0]?.productName || "Order item"}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <StatusBadge status={order.status} />
                        <StatusBadge status={order.paymentStatus} />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          Order ID
                        </p>
                        <p className="mt-1 break-all text-sm">{order._id}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          Items
                        </p>
                        <p className="mt-1 text-sm">
                          {order.items?.[0]?.productName || "Order item"}
                          {order.items.length > 1
                            ? ` + ${order.items.length - 1} more`
                            : ""}
                        </p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                            Placed On
                          </p>
                          <p className="mt-1 text-sm">
                            {new Date(order.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                            Items count
                          </p>
                          <p className="mt-1 text-sm">{order.items.length}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                            Total
                          </p>
                          <p className="mt-1 text-sm">
                            LKR {formatCurrency(order.totalAmount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                    <Link
                      to={`/shopping/order-tracking?orderId=${order._id}`}
                      className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#D4AF37] hover:underline"
                    >
                      Track Order <ArrowRight className="h-4 w-4" />
                    </Link>

                    {(["pending_payment", "proof_submitted"].includes(
                      String(order.status).toLowerCase()
                    ) &&
                      slugByOrderId.get(String(order._id))) && (
                      <Link
                        to={`/shopping/manual-payment/${slugByOrderId.get(String(order._id))}`}
                        className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-xs font-bold uppercase tracking-widest text-black transition hover:bg-amber-400"
                      >
                        <Upload className="h-3.5 w-3.5" /> Upload receipt
                      </Link>
                    )}
                  </div>
                </div>

                {String(order.status).toLowerCase() === "delivered" &&
                order.items?.length ? (
                  <div className="mt-5 border-t border-[#D4AF37]/10 pt-4">
                    <p className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-[#D4AF37]">
                      <Star className="h-3 w-3" /> Loved your purchase?
                      Share a review
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(
                        new Map(
                          order.items
                            .filter((item) => item.product?._id || item.product)
                            .map((item) => {
                              const id = String(
                                item.product?._id || item.product
                              );
                              return [
                                id,
                                {
                                  id,
                                  name:
                                    item.product?.name ||
                                    item.productName ||
                                    "Item",
                                },
                              ];
                            })
                        ).values()
                      ).map((item) => (
                        <Link
                          key={item.id}
                          to={`/product/${item.id}/reviews`}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/5 px-3 py-1.5 text-xs text-[#D4AF37] transition-colors hover:bg-[#D4AF37] hover:text-black"
                        >
                          <Star className="h-3 w-3" />
                          Review {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
