import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Loader2, RefreshCcw, LayoutGrid, Table2 } from "lucide-react";

import { fetchAdminOrders, updateOrderStatus } from "@/store/order-slice";
import { toast } from "@/hooks/use-toast";
import StatusBadge from "@/components/common-components/StatusBadge";
import { AdminPage } from "@/components/admin-components/AdminUI";

const ADMIN_ORDERS_VIEW_KEY = "saga_admin_orders_view";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "pending_payment", label: "Pending Payment" },
  { value: "verification_pending", label: "Verification Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const KANBAN_COLUMNS = [
  {
    id: "pending",
    title: "Pending",
    targetStatus: "pending",
    match: (s) => s === "pending" || s === "pending_payment",
  },
  {
    id: "processing",
    title: "Processing",
    targetStatus: "verification_pending",
    match: (s) =>
      ["verification_pending", "confirmed", "processing", "proof_submitted"].includes(
        s
      ),
  },
  {
    id: "shipped",
    title: "Shipped",
    targetStatus: "shipped",
    match: (s) => s === "shipped",
  },
  {
    id: "delivered",
    title: "Delivered",
    targetStatus: "delivered",
    match: (s) => s === "delivered",
  },
  {
    id: "cancelled",
    title: "Cancelled",
    targetStatus: "cancelled",
    match: (s) => s === "cancelled",
  },
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

const getColumnIdForStatus = (status) => {
  const col = KANBAN_COLUMNS.find((c) => c.match(status));
  return col?.id || "pending";
};

function KanbanOrderCard({ order, disabled }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: order._id,
    disabled,
    data: { order },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="cursor-grab rounded-2xl border border-white/10 bg-black/50 p-4 shadow-sm active:cursor-grabbing"
    >
      <p className="text-[10px] uppercase tracking-wider text-gray-500">
        {formatDate(order.createdAt)}
      </p>
      <p className="mt-1 line-clamp-2 text-sm font-semibold text-white">
        {getCustomerName(order)}
      </p>
      <p className="mt-2 font-mono text-[10px] text-gray-400">
        {String(order._id).slice(-8)}
      </p>
      <p className="mt-2 text-sm text-[#D4AF37]">LKR {formatCurrency(order.totalAmount)}</p>
      <div className="mt-3">
        <StatusBadge status={order.status} />
      </div>
    </div>
  );
}

function KanbanColumn({ column, orders, updatingOrderId }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="flex min-h-[420px] min-w-[260px] flex-1 flex-col rounded-2xl border border-white/10 bg-[#0b0b0b]/80">
      <div className="border-b border-white/10 px-4 py-3">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
          {column.title}
        </h3>
        <p className="text-[10px] text-gray-500">{orders.length} orders</p>
      </div>
      <div
        ref={setNodeRef}
        className={`flex flex-1 flex-col gap-3 p-3 transition-colors ${
          isOver ? "bg-[#D4AF37]/5 ring-1 ring-[#D4AF37]/25" : ""
        }`}
      >
        {orders.map((order) => (
          <KanbanOrderCard
            key={order._id}
            order={order}
            disabled={Boolean(updatingOrderId)}
          />
        ))}
      </div>
    </div>
  );
}

const Orders = () => {
  const dispatch = useDispatch();
  const { adminOrders, isLoading } = useSelector((state) => state.order);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [activeDrag, setActiveDrag] = useState(null);
  const [isNarrow, setIsNarrow] = useState(
    typeof window !== "undefined" ? window.innerWidth < 1024 : false
  );
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window === "undefined") return "kanban";
    return window.localStorage.getItem(ADMIN_ORDERS_VIEW_KEY) === "table"
      ? "table"
      : "kanban";
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } })
  );

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(ADMIN_ORDERS_VIEW_KEY, viewMode);
  }, [viewMode]);

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

  const ordersByColumn = useMemo(() => {
    const map = Object.fromEntries(KANBAN_COLUMNS.map((c) => [c.id, []]));
    orders.forEach((order) => {
      const colId = getColumnIdForStatus(order.status);
      if (map[colId]) map[colId].push(order);
      else map.pending.push(order);
    });
    return map;
  }, [orders]);

  const handleStatusChange = useCallback(
    async (orderId, status) => {
      if (!orderId || !status) {
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
    [dispatch]
  );

  const handleDragStart = (event) => {
    const order = orders.find((o) => o._id === event.active.id);
    setActiveDrag(order || null);
  };

  const handleDragEnd = async (event) => {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over) return;

    const orderId = active.id;
    const columnId = over.id;
    const column = KANBAN_COLUMNS.find((c) => c.id === columnId);
    if (!column) return;

    const order = orders.find((o) => o._id === orderId);
    if (!order) return;

    const fromCol = getColumnIdForStatus(order.status);
    if (fromCol === columnId) return;

    if (column.targetStatus === order.status) return;

    await handleStatusChange(orderId, column.targetStatus);
  };

  const showLoading = isLoading && !hasLoaded;
  const showKanban = !isNarrow && viewMode === "kanban";

  return (
    <AdminPage
      eyebrow="Order Operations"
      title="Orders"
      description="Monitor customer orders and update fulfillment status in board or table mode."
    >
      <div className="container mx-auto px-0 md:px-2">
        <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-widest text-white">Orders</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-400">
              Monitor customer orders, review totals, and update fulfillment status.
              {isNarrow
                ? " On smaller screens, use the table and status dropdown."
                : " Drag cards between columns in board view, or switch to table."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!isNarrow ? (
              <div className="inline-flex rounded-full border border-white/10 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("kanban")}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-widest ${
                    viewMode === "kanban"
                      ? "bg-[#D4AF37] text-black"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" /> Board
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-widest ${
                    viewMode === "table"
                      ? "bg-[#D4AF37] text-black"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Table2 className="h-4 w-4" /> Table
                </button>
              </div>
            ) : null}

            <button
              type="button"
              onClick={loadOrders}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-[#2f7cf6]/50 hover:text-[#2f7cf6]"
            >
              <RefreshCcw className="h-4 w-4" /> Refresh
            </button>
          </div>
        </div>

        {showLoading ? (
          <div className="flex items-center justify-center rounded-[1.75rem] border border-white/10 bg-[#0b0b0b] py-16 text-gray-400">
            <Loader2 className="mr-3 h-5 w-5 animate-spin text-[#2f7cf6]" /> Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-[1.75rem] border border-white/10 bg-[#090909] p-10 text-center text-sm text-gray-400">
            No orders placed yet.
          </div>
        ) : showKanban ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 overflow-x-auto pb-4">
              {KANBAN_COLUMNS.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  orders={ordersByColumn[column.id] || []}
                  updatingOrderId={updatingOrderId}
                />
              ))}
            </div>
            <DragOverlay dropAnimation={null}>
              {activeDrag ? (
                <div className="w-[260px] cursor-grabbing rounded-2xl border border-[#D4AF37]/40 bg-[#111] p-4 shadow-2xl">
                  <p className="text-sm font-semibold text-white">
                    {getCustomerName(activeDrag)}
                  </p>
                  <p className="mt-2 text-xs text-[#D4AF37]">
                    LKR {formatCurrency(activeDrag.totalAmount)}
                  </p>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
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
                      <td className="break-all px-6 py-5 text-white">{order._id}</td>
                      <td className="px-6 py-5 text-gray-300">{getCustomerName(order)}</td>
                      <td className="px-6 py-5 text-gray-300">
                        LKR {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="px-6 py-5 text-gray-300">{formatDate(order.createdAt)}</td>
                      <td className="px-6 py-5 text-gray-300">{order.items?.length || 0}</td>
                      <td className="px-6 py-5 text-gray-300">{order.paymentMethod || "-"}</td>
                      <td className="px-6 py-5">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-5">
                        <select
                          value={order.status}
                          onChange={(event) =>
                            handleStatusChange(order._id, event.target.value)
                          }
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
    </AdminPage>
  );
};

export default Orders;
