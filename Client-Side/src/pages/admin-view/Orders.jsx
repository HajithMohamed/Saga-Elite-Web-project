import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader2, RefreshCcw } from "lucide-react";

import { fetchAdminOrders, updateOrderStatus } from "@/store/order-slice";
import { toast } from "@/hooks/use-toast";
import StatusBadge from "@/components/common-components/StatusBadge";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "pending_payment", label: "Pending Payment" },
  { value: "verification_pending", label: "Verification Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const formatCurrency = (amount = 0) =>
  Number(amount || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getCustomerName = (order) => {
  const user = order.user || {};
  return (
    user.fullName ||
    user.name ||
    user.userName ||
    user.email ||
    order.guestEmail ||
    order.contactName ||
    "Unknown"
  );
};

const Orders = () => {
  const dispatch = useDispatch();
  const { adminOrders, isLoading } = useSelector((state) => state.order);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const loadOrders = useCallback(async () => {
    try {
      await dispatch(fetchAdminOrders()).unwrap();
    } catch (error) {
      toast({
        title: "Unable to load orders",
        description: error || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setHasLoaded(true);
    }
  }, [dispatch]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const orders = useMemo(
    () =>
      [...(adminOrders || [])].sort(
        (left, right) =>
          new Date(right.createdAt || 0).getTime() -
          new Date(left.createdAt || 0).getTime()
      ),
    [adminOrders]
  );

  const handleStatusChange = useCallback(
    async (orderId, status) => {
      if (!orderId || !status || updatingOrderId) {
        return;
      }

      try {
        setUpdatingOrderId(orderId);
        await dispatch(updateOrderStatus({ orderId, status })).unwrap();
        toast({
          title: "Order updated",
          description: `Status changed to ${status.replace(/_/g, " ")}.`,
          variant: "success",
        });
      } catch (error) {
        toast({
          title: "Update failed",
          description: error || "Unable to update status.",
          variant: "destructive",
        });
      } finally {
        setUpdatingOrderId(null);
      }
    },
    [dispatch, updatingOrderId]
  );

  const showLoading = isLoading && !hasLoaded;

  return (
    <div className="min-h-screen bg-[#060606] py-10 text-white">
      <div className="container mx-auto px-4 md:px-8">
        <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-widest text-white">Orders</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-400">
              Monitor customer orders, review totals, and update fulfillment status from one place.
            </p>
          </div>

          <button
            type="button"
            onClick={loadOrders}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-[#2f7cf6]/50 hover:text-[#2f7cf6]"
          >
            <RefreshCcw className="h-4 w-4" /> Refresh
          </button>
        </div>

        {showLoading ? (
          <div className="flex items-center justify-center rounded-[1.75rem] border border-white/10 bg-[#0b0b0b] py-16 text-gray-400">
            <Loader2 className="mr-3 h-5 w-5 animate-spin text-[#2f7cf6]" /> Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-[1.75rem] border border-white/10 bg-[#090909] p-10 text-center text-sm text-gray-400">
            No orders placed yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#090909]">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                <thead className="bg-black/40 text-[10px] uppercase tracking-[0.24em] text-gray-400">
                  <tr>
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Total Amount</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Items</th>
                    <th className="px-6 py-4">Payment</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">
                  {orders.map((order) => (
                    <tr key={order._id} className="align-top hover:bg-white/[0.02]">
                      <td className="px-6 py-5 break-all text-white">{order._id}</td>
                      <td className="px-6 py-5 text-gray-300">{getCustomerName(order)}</td>
                      <td className="px-6 py-5 text-gray-300">LKR {formatCurrency(order.totalAmount)}</td>
                      <td className="px-6 py-5 text-gray-300">{formatDate(order.createdAt)}</td>
                      <td className="px-6 py-5 text-gray-300">{order.items?.length || 0}</td>
                      <td className="px-6 py-5 text-gray-300">{order.paymentMethod || "-"}</td>
                      <td className="px-6 py-5">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-5">
                        <select
                          value={order.status}
                          onChange={(event) => handleStatusChange(order._id, event.target.value)}
                          disabled={Boolean(updatingOrderId)}
                          className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-sm text-white outline-none transition focus:border-[#2f7cf6] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {STATUS_OPTIONS.map((statusOption) => (
                            <option key={statusOption.value} value={statusOption.value}>
                              {statusOption.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
