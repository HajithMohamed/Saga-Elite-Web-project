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
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, RefreshCcw, LayoutGrid, Table2, Search } from "lucide-react";

import { fetchAdminOrders, updateOrderStatus } from "@/store/order-slice";
import { toast } from "@/hooks/use-toast";
import { AdminPage } from "@/components/admin-components/AdminUI";
import { pageVariants, containerVariants, itemVariants } from "@/components/admin-components/_shared/animations";
import { StatusBadge } from "@/components/admin-components/_shared/StatusBadge";
import { SkeletonGrid } from "@/components/admin-components/_shared/SkeletonCard";
import { PrimaryButton } from "@/components/admin-components/_shared/Buttons";

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
    <motion.div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      whileHover={isDragging ? undefined : { y: -3, borderColor: "rgba(212,175,55,0.35)" }}
      transition={{ duration: 0.2 }}
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
    </motion.div>
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

  const [searchTerm, setSearchTerm] = useState("");
  const [listStatusFilter, setListStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [orderStatusDraft, setOrderStatusDraft] = useState({});
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [successFlashId, setSuccessFlashId] = useState(null);

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

  const filteredOrders = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return orders.filter((order) => {
      const email =
        (order.user && (order.user.email || order.user.userName)) ||
        order.guestEmail ||
        "";
      const searchOk =
        !q ||
        String(order._id).toLowerCase().includes(q) ||
        String(email).toLowerCase().includes(q);
      const statusOk =
        listStatusFilter === "all" || order.status === listStatusFilter;
      const pm = (order.paymentMethod || "").toLowerCase();
      const payOk = paymentFilter === "all" || pm === paymentFilter.toLowerCase();
      return searchOk && statusOk && payOk;
    });
  }, [orders, searchTerm, listStatusFilter, paymentFilter]);

  const paymentMethods = useMemo(() => {
    const set = new Set();
    orders.forEach((o) => {
      if (o.paymentMethod) set.add(String(o.paymentMethod));
    });
    return ["all", ...Array.from(set)];
  }, [orders]);

  const ordersByColumn = useMemo(() => {
    const map = Object.fromEntries(KANBAN_COLUMNS.map((c) => [c.id, []]));
    filteredOrders.forEach((order) => {
      const colId = getColumnIdForStatus(order.status);
      if (map[colId]) map[colId].push(order);
      else map.pending.push(order);
    });
    return map;
  }, [filteredOrders]);

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
        setSuccessFlashId(orderId);
        setTimeout(() => setSuccessFlashId((id) => (id === orderId ? null : id)), 2600);
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
    const order = filteredOrders.find((o) => o._id === event.active.id);
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

    const order = filteredOrders.find((o) => o._id === orderId);
    if (!order) return;

    const fromCol = getColumnIdForStatus(order.status);
    if (fromCol === columnId) return;

    if (column.targetStatus === order.status) return;

    await handleStatusChange(orderId, column.targetStatus);
  };

  const showLoading = isLoading && !hasLoaded;
  const showKanban = !isNarrow && viewMode === "kanban";

  const activeOrderCount = orders.filter((o) => o.status !== "cancelled").length;

  const applyTableStatusUpdate = async (orderId) => {
    const order = filteredOrders.find((o) => o._id === orderId);
    if (!order) return;
    const next = orderStatusDraft[orderId] ?? order.status;
    if (next === order.status) {
      toast({
        title: "No change",
        description: "Select a different status before updating.",
      });
      return;
    }
    await handleStatusChange(orderId, next);
  };

  return (
    <AdminPage
      eyebrow="Order Operations"
      title="Orders"
      description="Monitor customer orders and update fulfillment status in board or table mode."
    >
      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        className="container mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10"
      >
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]">
              Order Operations
            </p>
            <h1 className="text-3xl font-black tracking-tight text-white">Orders</h1>
            <p className="mt-2 max-w-xl text-sm text-gray-400">
              <span className="text-white/90">{orders.length}</span> total ·{" "}
              <span className="text-emerald-300/90">{activeOrderCount}</span> active (non-cancelled)
              {isNarrow
                ? " · On smaller screens, use table mode with status pills."
                : " · Drag cards between columns in board view, or switch to table."}
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
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-[#D4AF37]/50"
            >
              <RefreshCcw className="h-4 w-4" /> Refresh
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search order ID or email…"
              className="w-full rounded-2xl border border-white/10 bg-black/60 py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-[#D4AF37]"
            />
          </div>
          <select
            value={listStatusFilter}
            onChange={(e) => setListStatusFilter(e.target.value)}
            className="rounded-2xl border border-white/10 bg-black/60 px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
          >
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="rounded-2xl border border-white/10 bg-black/60 px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
          >
            {paymentMethods.map((p) => (
              <option key={p} value={p}>
                {p === "all" ? "All payment methods" : p}
              </option>
            ))}
          </select>
        </div>

        {showLoading ? (
          <SkeletonGrid count={3} className="grid gap-4 md:grid-cols-3" />
        ) : orders.length === 0 ? (
          <div className="rounded-[28px] border border-white/10 bg-[#090909] p-10 text-center text-sm text-gray-400">
            No orders placed yet.
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-[28px] border border-white/10 bg-[#090909] p-10 text-center text-sm text-gray-400">
            No orders match your search or filters.
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
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="overflow-x-auto rounded-[20px] border border-white/10 bg-[#090909]"
          >
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-[10px] uppercase tracking-[0.2em] text-gray-500">
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const draft = orderStatusDraft[order._id] ?? order.status;
                  const isBusy = updatingOrderId === order._id;
                  return (
                    <motion.tr
                      key={order._id}
                      variants={itemVariants}
                      className="border-t border-white/10 align-top transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="max-w-[200px] px-5 py-4 align-top">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedOrderId((id) => (id === order._id ? null : order._id))
                          }
                          className="break-all text-left font-mono text-xs text-gray-300 underline-offset-2 hover:text-[#D4AF37]"
                        >
                          {String(order._id).slice(-12)}…
                        </button>
                        <AnimatePresence initial={false}>
                          {expandedOrderId === order._id ? (
                            <motion.div
                              key="items"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.28, ease: "easeOut" }}
                              className="overflow-hidden"
                            >
                              <ul className="mt-2 space-y-1 border-l border-white/10 pl-3 text-xs text-gray-400">
                                {(order.items || []).map((line, idx) => (
                                  <li key={idx}>
                                    {(line.quantity || 1)}×{" "}
                                    {line.name || line.product?.name || "Item"}
                                  </li>
                                ))}
                              </ul>
                            </motion.div>
                          ) : null}
                        </AnimatePresence>
                      </td>
                      <td className="px-5 py-4 text-gray-300">{getCustomerName(order)}</td>
                      <td className="px-5 py-4 text-gray-300">
                        LKR {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="px-5 py-4 text-gray-400">{formatDate(order.createdAt)}</td>
                      <td className="px-5 py-4 text-gray-400">{order.paymentMethod || "—"}</td>
                      <td className="px-5 py-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex flex-col items-end gap-3">
                          <AnimatePresence>
                            {successFlashId === order._id ? (
                              <motion.div
                                key="ok"
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300"
                              >
                                ✓ Status updated
                              </motion.div>
                            ) : null}
                          </AnimatePresence>
                          <div className="flex max-w-[min(100%,320px)] flex-wrap justify-end gap-2">
                            {STATUS_OPTIONS.map((s) => (
                              <motion.button
                                key={s.value}
                                type="button"
                                whileTap={{ scale: 0.95 }}
                                onClick={() =>
                                  setOrderStatusDraft((prev) => ({
                                    ...prev,
                                    [order._id]: s.value,
                                  }))
                                }
                                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                                  draft === s.value
                                    ? "border-[#D4AF37] bg-[#D4AF37] text-black"
                                    : "border-white/10 text-gray-400 hover:border-[#D4AF37]/40"
                                }`}
                              >
                                {s.label}
                              </motion.button>
                            ))}
                          </div>
                          <PrimaryButton
                            type="button"
                            disabled={isBusy || draft === order.status}
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs disabled:opacity-50"
                            onClick={() => applyTableStatusUpdate(order._id)}
                          >
                            {isBusy ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" /> Updating…
                              </>
                            ) : (
                              "Update"
                            )}
                          </PrimaryButton>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </motion.div>
        )}
      </motion.div>
    </AdminPage>
  );
};

export default Orders;
