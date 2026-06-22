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
import { Loader2, RefreshCcw, LayoutGrid, Table2, Search, FileDown, Eye, Clock, Wallet, ShieldAlert, CheckCircle, Truck, PackageCheck, XCircle, Undo2, Banknote } from "lucide-react";
import axios from "axios";
import { API_V1_URL as API_BASE } from "@/lib/api";

import { fetchAdminOrders, updateOrderStatus, refundOrder, bulkUpdateOrderStatus } from "@/store/order-slice";
import { toast } from "@/hooks/use-toast";
import { AdminPage } from "@/components/admin-components/AdminUI";
import { pageVariants, containerVariants, itemVariants } from "@/components/admin-components/_shared/animations";
import { StatusBadge } from "@/components/admin-components/_shared/StatusBadge";
import { SkeletonGrid } from "@/components/admin-components/_shared/SkeletonCard";
import { PrimaryButton } from "@/components/admin-components/_shared/Buttons";
import RefundOrderModal from "@/components/admin-components/RefundOrderModal";
import OrderDetailDrawer from "@/components/admin-components/OrderDetailDrawer";
import BulkActionBar from "@/components/admin-components/_shared/BulkActionBar";
import useBulkSelection from "@/hooks/use-bulk-selection";

const ADMIN_ORDERS_VIEW_KEY = "saga_admin_orders_view";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "pending_payment", label: "Pending Payment" },
  { value: "verification_pending", label: "Verification Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refund_requested", label: "Refund Requested" },
  { value: "refunded", label: "Refunded" },
];

const STATUS_ICONS = {
  pending: Clock,
  pending_payment: Wallet,
  verification_pending: ShieldAlert,
  confirmed: CheckCircle,
  shipped: Truck,
  delivered: PackageCheck,
  cancelled: XCircle,
  refund_requested: Undo2,
  refunded: Banknote,
};

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "expiring", label: "Pending payment expiring soonest" },
];

const cleanPhoneForWhatsApp = (raw) => {
  if (!raw) return "";
  const digits = String(raw).replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return `94${digits.slice(1)}`;
  if (digits.length <= 9) return `94${digits}`;
  return digits;
};

const getOrderPhone = (order) => {
  if (!order) return "";
  return (
    order.contactNumber ||
    order.shippingAddress?.phone ||
    order.shippingAddress?.contactNumber ||
    ""
  );
};

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
    "Guest"
  );
};

const formatPaymentMethod = (method) => {
  if (!method) return "—";
  if (method === "MANUAL_BANK_TRANSFER") return "Bank Transfer";
  return method.replace(/_/g, " ");
};

const getColumnIdForStatus = (status) => {
  const col = KANBAN_COLUMNS.find((c) => c.match(status));
  return col?.id || "pending";
};

function KanbanOrderCard({ order, disabled, onSelect }) {
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
      onClick={() => onSelect && onSelect(order)}
      whileHover={isDragging ? undefined : { y: -3, borderColor: "rgba(212,175,55,0.35)" }}
      transition={{ duration: 0.2 }}
      className={`cursor-grab rounded-2xl border border-white/10 bg-black/50 p-4 shadow-sm active:cursor-grabbing ${onSelect ? 'hover:bg-white/5' : ''}`}
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

function KanbanColumn({ column, orders, updatingOrderId, onSelect }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="flex min-h-[420px] flex-1 min-w-[130px] flex-col rounded-2xl border border-white/10 bg-[#0b0b0b]/80">
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
            onSelect={onSelect}
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
    if (typeof window === "undefined") return "table";
    return window.localStorage.getItem(ADMIN_ORDERS_VIEW_KEY) === "kanban"
      ? "kanban"
      : "table";
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [listStatusFilter, setListStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [sortMode, setSortMode] = useState("newest");
  const [orderStatusDraft, setOrderStatusDraft] = useState({});
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [successFlashId, setSuccessFlashId] = useState(null);
  const [refundOrderTarget, setRefundOrderTarget] = useState(null);
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [invoiceDownloadingId, setInvoiceDownloadingId] = useState(null);
  const [detailOrder, setDetailOrder] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [bulkPending, setBulkPending] = useState(false);

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
    const base = orders.filter((order) => {
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

    if (sortMode === "oldest") {
      return [...base].sort(
        (a, b) =>
          new Date(a.createdAt || 0).getTime() -
          new Date(b.createdAt || 0).getTime()
      );
    }
    if (sortMode === "expiring") {
      const now = Date.now();
      const withExpiry = base.filter(
        (o) => o.expiresAt && new Date(o.expiresAt).getTime() > now
      );
      const withoutExpiry = base.filter(
        (o) => !o.expiresAt || new Date(o.expiresAt).getTime() <= now
      );
      withExpiry.sort(
        (a, b) =>
          new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()
      );
      return [...withExpiry, ...withoutExpiry];
    }
    return base;
  }, [orders, searchTerm, listStatusFilter, paymentFilter, sortMode]);

  const paymentMethods = useMemo(() => {
    const set = new Set();
    orders.forEach((o) => {
      if (o.paymentMethod) set.add(String(o.paymentMethod));
    });
    return ["all", ...Array.from(set)];
  }, [orders]);

  const bulk = useBulkSelection(filteredOrders);

  const runBulkStatus = useCallback(
    async (status) => {
      const ids = bulk.selectedIds;
      if (ids.length === 0) return;
      let cancellationReason;
      if (status === "cancelled") {
        cancellationReason = window.prompt(
          `Cancellation reason for ${ids.length} order${ids.length === 1 ? "" : "s"}?`,
          "Customer-requested cancellation"
        );
        if (!cancellationReason) return;
      }
      setBulkPending(true);
      try {
        const result = await dispatch(
          bulkUpdateOrderStatus({ ids, status, cancellationReason })
        ).unwrap();
        const ok = result.succeeded?.length || 0;
        const fail = result.failed?.length || 0;
        if (fail === 0) {
          toast({
            title: `Updated ${ok} order${ok === 1 ? "" : "s"} → ${status}`,
            variant: "success",
          });
        } else {
          const reasons = (result.failed || [])
            .slice(0, 3)
            .map((f) => `• ${f.reason}`)
            .join("\n");
          toast({
            title: `Updated ${ok} of ${ok + fail}. ${fail} skipped.`,
            description: reasons,
            variant: "destructive",
          });
        }
        bulk.clear();
        dispatch(fetchAdminOrders());
      } catch (err) {
        toast({
          title: "Bulk update failed",
          description: typeof err === "string" ? err : "Try again.",
          variant: "destructive",
        });
      } finally {
        setBulkPending(false);
      }
    },
    [bulk, dispatch]
  );

  const ordersByColumn = useMemo(() => {
    const map = Object.fromEntries(KANBAN_COLUMNS.map((c) => [c.id, []]));
    filteredOrders.forEach((order) => {
      const colId = getColumnIdForStatus(order.status);
      if (map[colId]) map[colId].push(order);
      else map.pending.push(order);
    });
    return map;
  }, [filteredOrders]);

  useEffect(() => {
    if (filteredOrders.length > 0 && !selectedOrder && viewMode === "table") {
      setSelectedOrder(filteredOrders[0]);
    }
  }, [filteredOrders, selectedOrder, viewMode]);

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

  const handleDownloadInvoice = useCallback(
    async (order) => {
      if (!order?._id) return;
      try {
        setInvoiceDownloadingId(order._id);
        const res = await axios.get(
          `${API_BASE}/admin/orders/${order._id}/invoice`,
          { withCredentials: true, responseType: "blob" }
        );
        const blob = new Blob([res.data], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const ref = order.referenceNumber || String(order._id).slice(-12);
        a.download = `saga-elite-invoice-${ref}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        toast({
          title: "Could not download invoice",
          description:
            err?.response?.data?.message ||
            err?.message ||
            "Unexpected error.",
          variant: "destructive",
        });
      } finally {
        setInvoiceDownloadingId(null);
      }
    },
    []
  );

  const handleRefundSubmit = useCallback(
    async ({ amount, reason, note }) => {
      if (!refundOrderTarget?._id) return;
      try {
        setRefundSubmitting(true);
        await dispatch(
          refundOrder({
            orderId: refundOrderTarget._id,
            amount: Number(amount),
            reason,
            note,
          })
        ).unwrap();
        toast({
          title: "Refund issued",
          description: `LKR ${formatCurrency(amount)} refunded.`,
          variant: "success",
        });
        setRefundOrderTarget(null);
        await loadOrders();
      } catch (error) {
        toast({
          title: "Refund failed",
          description: error || "Unable to issue refund.",
          variant: "destructive",
        });
      } finally {
        setRefundSubmitting(false);
      }
    },
    [dispatch, loadOrders, refundOrderTarget]
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
    <AdminPage>
      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        className="w-full"
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
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value)}
            className="rounded-2xl border border-white/10 bg-black/60 px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
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
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col xl:flex-row gap-6"
          >
            {/* Left side (Table OR Kanban) */}
            <div className={`flex-1 overflow-x-auto rounded-[20px] ${!showKanban ? 'border border-white/10 bg-[#090909]' : ''}`}>
              {showKanban ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCorners}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                    {KANBAN_COLUMNS.map((column) => (
                      <KanbanColumn
                        key={column.id}
                        column={column}
                        orders={ordersByColumn[column.id] || []}
                        updatingOrderId={updatingOrderId}
                        onSelect={setSelectedOrder}
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
                <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#4d4635] bg-[#111] text-[9px] uppercase tracking-[0.25em] text-[#99907c] se-label">
                    <th className="w-10 px-3 py-2">
                      <input
                        type="checkbox"
                        aria-label="Select all orders"
                        checked={bulk.isAllSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = bulk.isSomeSelected;
                        }}
                        onChange={bulk.toggleAll}
                        className="h-4 w-4 cursor-pointer accent-[#D4AF37]"
                        data-testid="admin-bulk-select-all"
                      />
                    </th>
                    <th className="px-4 py-2">Order</th>
                    <th className="px-4 py-2">Customer</th>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Payment</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => {
                    const isSelected = selectedOrder?._id === order._id;
                    return (
                      <motion.tr
                        key={order._id}
                        variants={itemVariants}
                        onClick={() => setSelectedOrder(order)}
                        className={`border-t border-[#4d4635]/40 align-top transition-colors cursor-pointer ${
                          isSelected ? "bg-[#D4AF37]/[0.15] border-l-2 border-[#D4AF37]" : "hover:bg-[#131313]"
                        }`}
                      >
                        <td className="w-10 px-3 py-3 align-middle" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={bulk.isSelected(order._id)}
                              onChange={() => bulk.toggle(order._id)}
                              className="h-4 w-4 cursor-pointer accent-[#D4AF37]"
                              data-testid="admin-bulk-row-select"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <span className="text-left se-mono text-[10px] text-[#e5e2e1] block truncate max-w-[80px]">
                            {String(order._id).slice(-12)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#e5e2e1] se-body text-xs align-middle">
                          <span className="block truncate max-w-[120px]">
                            {getCustomerName(order)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#99907c] se-mono text-[10px] whitespace-nowrap align-middle">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-[#99907c] se-label text-[9px] tracking-widest uppercase align-middle">
                          <span className="block truncate max-w-[100px]">
                            {formatPaymentMethod(order.paymentMethod)}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <StatusBadge status={order.status} />
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

            {/* Right side Details Panel */}
            {!showKanban && selectedOrder && (
              <div className="w-full xl:w-[260px] shrink-0">
                <div className="rounded-[20px] border border-white/10 bg-[#090909] p-4 sticky top-6 text-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-tight uppercase se-mono">
                        {String(selectedOrder._id).slice(-12)}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(selectedOrder.createdAt)}</p>
                    </div>
                    <button onClick={() => setSelectedOrder(null)} className="text-white/40 hover:text-white shrink-0 ml-2">&times;</button>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center border-b border-white/[0.05] pb-2">
                      <span className="text-white/40">Status</span>
                      <StatusBadge status={selectedOrder.status} />
                    </div>
                    <div className="flex justify-between items-center border-b border-white/[0.05] pb-2">
                      <span className="text-white/40">Payment</span>
                      <span className="text-[#D4AF37] font-medium uppercase tracking-wider text-[10px]">{formatPaymentMethod(selectedOrder.paymentMethod)}</span>
                    </div>
                    <div className="flex justify-between items-start border-b border-white/[0.05] pb-2">
                      <span className="text-white/40 pt-0.5">Customer</span>
                      <span className="text-white text-right break-words max-w-[160px]">{getCustomerName(selectedOrder)}</span>
                    </div>
                    {(() => {
                      const phone = getOrderPhone(selectedOrder);
                      if (!phone) return null;
                      return (
                        <div className="flex justify-between items-center border-b border-white/[0.05] pb-2">
                          <span className="text-white/40">Contact</span>
                          <span className="text-white text-xs">{phone}</span>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Items List */}
                  <div className="mb-6">
                    <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Order Items ({selectedOrder.items?.length || 0})</h4>
                    <ul className="space-y-3 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                      {(selectedOrder.items || []).map((line, idx) => (
                        <li key={idx} className="flex justify-between text-xs items-center">
                          <div className="flex flex-col">
                            <span className="text-white max-w-[180px] truncate" title={line.name || line.product?.name || "Item"}>{line.name || line.product?.name || "Item"}</span>
                            <span className="text-white/40 mt-0.5">Qty: {line.quantity || 1}</span>
                          </div>
                          <span className="text-[#D4AF37]">LKR {formatCurrency((line.price || 0) * (line.quantity || 1))}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Pricing breakdown */}
                  <div className="border-t border-white/[0.05] pt-4 space-y-2 text-xs">
                    <div className="flex justify-between text-white/60">
                      <span>Subtotal</span>
                      <span>LKR {formatCurrency(selectedOrder.totalAmount - (selectedOrder.shippingFee || 0) + (selectedOrder.discountAmount || 0))}</span>
                    </div>
                    {selectedOrder.discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span>Discount</span>
                        <span>- LKR {formatCurrency(selectedOrder.discountAmount)}</span>
                      </div>
                    )}
                    {selectedOrder.shippingFee > 0 && (
                      <div className="flex justify-between text-white/60">
                        <span>Shipping</span>
                        <span>LKR {formatCurrency(selectedOrder.shippingFee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[#D4AF37] font-bold text-sm pt-2 border-t border-white/[0.05] mt-2">
                      <span>Total</span>
                      <span>LKR {formatCurrency(selectedOrder.totalAmount)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-8 space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {STATUS_OPTIONS.map((s) => {
                        const Icon = STATUS_ICONS[s.value] || Clock;
                        const isCurrent = selectedOrder.status === s.value;
                        const isBusy = updatingOrderId === selectedOrder._id;
                        
                        return (
                          <button
                            key={s.value}
                            type="button"
                            disabled={isBusy || isCurrent}
                            onClick={() => handleStatusChange(selectedOrder._id, s.value)}
                            title={`Change status to ${s.label}`}
                            className={`p-2 rounded-sm border transition flex items-center justify-center
                              ${isCurrent 
                                ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37] cursor-default opacity-100" 
                                : "border-[#4d4635] bg-transparent text-[#99907c] hover:border-[#f2ca50] hover:text-[#f2ca50] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              }
                            `}
                          >
                            <Icon className="h-4 w-4" strokeWidth={1.5} />
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setDetailOrder(selectedOrder)}
                        className="flex-1 inline-flex justify-center items-center gap-2 rounded-sm border border-[#4d4635] bg-transparent px-3 py-2 text-[10px] tracking-[0.22em] uppercase text-[#d0c5af] transition hover:border-[#f2ca50] hover:text-[#f2ca50]"
                      >
                        <Eye className="h-3.5 w-3.5" /> Full Details
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadInvoice(selectedOrder)}
                        disabled={invoiceDownloadingId === selectedOrder._id}
                        className="flex-1 inline-flex justify-center items-center gap-2 rounded-sm border border-[#4d4635] bg-transparent px-3 py-2 text-[10px] tracking-[0.22em] uppercase text-[#d0c5af] transition hover:border-[#f2ca50] hover:text-[#f2ca50] disabled:opacity-50"
                      >
                        {invoiceDownloadingId === selectedOrder._id ? (
                          <><Loader2 className="h-3.5 w-3.5 animate-spin" /> PDF…</>
                        ) : (
                          <><FileDown className="h-3.5 w-3.5" /> Invoice</>
                        )}
                      </button>
                    </div>

                    {(selectedOrder.status === "delivered" || selectedOrder.status === "refund_requested") && (
                      <button
                        type="button"
                        onClick={() => setRefundOrderTarget(selectedOrder)}
                        className="w-full inline-flex justify-center items-center gap-2 rounded-sm border border-[#ffb4ab]/40 bg-[#ffb4ab]/10 px-3 py-2.5 text-[10px] tracking-[0.22em] uppercase text-[#ffb4ab] hover:bg-[#ffb4ab]/20"
                      >
                        Issue Refund
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
      <RefundOrderModal
        order={refundOrderTarget}
        isOpen={Boolean(refundOrderTarget)}
        submitting={refundSubmitting}
        onClose={() => (refundSubmitting ? null : setRefundOrderTarget(null))}
        onSubmit={handleRefundSubmit}
      />
      <OrderDetailDrawer
        order={detailOrder}
        open={Boolean(detailOrder)}
        onClose={() => setDetailOrder(null)}
        isBusy={updatingOrderId === detailOrder?._id}
        onMarkStatus={async (newStatus) => {
          if (!detailOrder?._id) return;
          try {
            await dispatch(
              updateOrderStatus({ orderId: detailOrder._id, status: newStatus })
            ).unwrap();
            toast({
              title: `Order marked ${newStatus.replace(/_/g, " ")}`,
              variant: "success",
            });
            // Reflect locally so the drawer's badges & timeline update without a re-fetch.
            setDetailOrder((current) =>
              current ? { ...current, status: newStatus } : current
            );
            loadOrders();
          } catch (error) {
            toast({
              title: "Status update failed",
              description: error || "Try again.",
              variant: "destructive",
            });
          }
        }}
        onRefund={() => {
          setRefundOrderTarget(detailOrder);
          setDetailOrder(null);
        }}
        onDownloadInvoice={() => detailOrder && handleDownloadInvoice(detailOrder)}
      />
      <BulkActionBar
        count={bulk.count}
        onClear={bulk.clear}
        pending={bulkPending}
        label="orders selected"
        actions={[
          { label: "Mark Confirmed", onClick: () => runBulkStatus("confirmed") },
          { label: "Mark Shipped", onClick: () => runBulkStatus("shipped") },
          { label: "Mark Delivered", onClick: () => runBulkStatus("delivered") },
          {
            label: "Cancel",
            variant: "destructive",
            confirm: {
              title: "Cancel selected orders?",
              body: "Stock will be restored and customers will be notified individually only via the regular update flow (no per-customer email is sent for bulk cancellations). You'll be prompted for a cancellation reason next.",
              confirmLabel: "Cancel orders",
            },
            onClick: () => runBulkStatus("cancelled"),
          },
        ]}
      />
    </AdminPage>
  );
};

export default Orders;
