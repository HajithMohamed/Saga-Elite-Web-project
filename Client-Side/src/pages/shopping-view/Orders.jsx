import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Package, ArrowRight } from "lucide-react";

import { fetchUserOrders } from "@/store/order-slice";

const formatStatus = (status = "") =>
  status
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatCurrency = (amount = 0) =>
  Number(amount).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const getOrderPreviewImage = (order) =>
  order.items?.find((item) => item.product?.images?.[0]?.url)?.product?.images?.[0]?.url ||
  order.items?.find((item) => item.product?.primaryImage)?.product?.primaryImage ||
  "/LOGO.png";

const Orders = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userOrders, isLoading } = useSelector((state) => state.order);

  useEffect(() => {
    dispatch(fetchUserOrders());
  }, [dispatch]);

  const handleOpenOrder = (orderId) => {
    navigate(`/shopping/order-tracking?orderId=${orderId}`);
  };

  return (
    <div className="min-h-screen bg-[#060606] text-white">
      <div className="container mx-auto max-w-6xl px-4 py-10">
        <nav className="mb-8 flex gap-2 text-xs uppercase text-gray-500">
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
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-white">
              All Your Orders
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-400">
              Open any order below to go directly to its tracking page with the latest database data.
            </p>
          </div>
          <Link
            to="/shopping/account"
            className="inline-flex items-center gap-2 rounded-full bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#D4AF37] hover:text-black"
          >
            Account Summary <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-52 animate-pulse rounded-3xl bg-[#111111]" />
            ))}
          </div>
        ) : userOrders.length === 0 ? (
          <div className="rounded-3xl border border-[#D4AF37]/10 bg-[#090909] p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#D4AF37]/10 text-[#D4AF37]">
              <Package className="h-6 w-6" />
            </div>
            <p className="text-lg font-semibold text-white">No orders yet</p>
            <p className="mt-2 text-sm text-gray-400">
              Once you place an order, it will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {userOrders.map((order) => (
              <button
                key={order._id}
                type="button"
                onClick={() => handleOpenOrder(order._id)}
                className="w-full rounded-3xl border border-[#D4AF37]/10 bg-[#090909] p-6 text-left transition-all hover:border-[#D4AF37]/30 hover:bg-[#0d0d0d]"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                    <div className="h-28 w-24 overflow-hidden rounded-2xl border border-white/5 bg-[#111]">
                      <img
                        src={getOrderPreviewImage(order)}
                        alt={order.items?.[0]?.productName || "Order item"}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-[#D4AF37]/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-[#D4AF37]">
                          {formatStatus(order.status)}
                        </span>
                        <span className="rounded-full bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.25em] text-gray-300">
                          {formatStatus(order.paymentStatus)}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Order ID</p>
                        <p className="mt-1 break-all text-sm text-white">{order._id}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Items Preview</p>
                        <p className="mt-1 text-sm text-white">
                          {order.items?.[0]?.productName || "Order item"}
                          {order.items.length > 1 ? ` + ${order.items.length - 1} more` : ""}
                        </p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Placed On</p>
                          <p className="mt-1 text-sm text-white">
                            {new Date(order.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Items</p>
                          <p className="mt-1 text-sm text-white">{order.items.length}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Total</p>
                          <p className="mt-1 text-sm text-white">LKR {formatCurrency(order.totalAmount)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#D4AF37]">
                    Track Order <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
