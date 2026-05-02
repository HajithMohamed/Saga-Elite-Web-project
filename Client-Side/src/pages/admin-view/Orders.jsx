import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdminOrders, updateOrderStatus } from "@/store/order-slice";
import { toast } from "@/hooks/use-toast";
import StatusBadge from "@/components/common-components/StatusBadge";

const statusOptions = ["pending", "pending_payment", "verification_pending", "confirmed", "shipped", "delivered", "cancelled"];

const Orders = () => {
  const dispatch = useDispatch();
  const { adminOrders, isLoading } = useSelector((state) => state.order);
  const [selectedStatus, setSelectedStatus] = useState({});

  useEffect(() => {
    dispatch(fetchAdminOrders());
  }, [dispatch]);

  const handleStatusChange = (orderId, value) => {
    setSelectedStatus((prev) => ({ ...prev, [orderId]: value }));
  };

  const handleUpdateStatus = async (orderId, currentStatus) => {
    const status = selectedStatus[orderId] || currentStatus;
    try {
      await dispatch(updateOrderStatus({ orderId, status })).unwrap();
      toast({
        title: "Order updated",
        description: `Status changed to ${status}.`,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error || "Unable to update status.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#060606] text-white py-10">
      <div className="container mx-auto px-4 md:px-8">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-widest text-white">Orders</h1>
            <p className="mt-2 text-sm text-gray-400 max-w-2xl">
              View all orders, update status, and confirm receipt-based payments.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-60 animate-pulse rounded-3xl bg-[#111111]" />
            ))}
          </div>
        ) : adminOrders.length === 0 ? (
          <div className="rounded-3xl border border-[#D4AF37]/10 bg-[#090909] p-10 text-center">
            <p className="text-sm text-gray-400">No orders placed yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {adminOrders.map((order) => (
              <div key={order._id} className="overflow-hidden rounded-3xl border border-[#D4AF37]/10 bg-[#090909] p-6">
                <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-[#D4AF37]/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-[#D4AF37]">
                        {order.paymentMethod}
                      </span>
                      <StatusBadge status={order.status} />
                      <StatusBadge status={order.paymentStatus} />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Order ID</p>
                      <p className="break-all text-sm text-white">{order._id}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Customer</p>
                        <p className="text-sm text-white">{order.user?.email || "Unknown"}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Total</p>
                        <p className="text-sm text-white">₹{order.totalAmount.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-[#D4AF37]/10 bg-[#080808] p-4">
                    <div className="mb-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Status</p>
                      <select
                        value={selectedStatus[order._id] || order.status}
                        onChange={(event) => handleStatusChange(order._id, event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-gray-700 bg-[#060606] px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]"
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status} className="bg-[#060606] text-white">
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(order._id, order.status)}
                      className="w-full rounded-full bg-[#D4AF37] px-4 py-3 text-sm font-bold uppercase text-black tracking-[0.2em] transition hover:bg-[#b99329]"
                    >
                      Update
                    </button>
                  </div>
                </div>

                <div className="mt-6 space-y-4 border-t border-[#D4AF37]/10 pt-5">
                  {order.items.map((item) => (
                    <div key={`${order._id}-${item.variantSku}`} className="rounded-3xl bg-[#0f0f0f] p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-white">{item.productName}</p>
                          <p className="text-xs text-gray-400">{item.variantName}</p>
                        </div>
                        <div className="text-sm text-gray-300">
                          {item.quantity} × ₹{item.unitPrice.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
