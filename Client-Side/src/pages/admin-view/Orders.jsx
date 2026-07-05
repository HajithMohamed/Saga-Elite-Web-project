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
import usePagination from "@/hooks/use-pagination";
import Pagination from "@/components/common-components/Pagination";

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
      className={`cursor-grab rounded-2xl border border-ink/10 bg-black/50 p-4 shadow-sm active:cursor-grabbing ${onSelect ? 'hover:bg-ink/5' : ''}`}
    >
      <p className="text-[10px] uppercase tracking-wider text-gray-500">
        {formatDate(order.createdAt)}
      </p>
      <p className="mt-1 line-clamp-2 text-sm font-semibold text-ink">
        {getCustomerName(order)}
      </p>
      <p className="mt-2 font-mono text-[10px] text-gray-400">
        {String(order._id).slice(-8)}
      </p>
      <p className="mt-2 text-sm text-gold-ink2">LKR {formatCurrency(order.totalAmount)}</p>
      <div className="mt-3">
        <StatusBadge status={order.status} />
      </div>
    </motion.div>
  );
}

function KanbanColumn({ column, orders, updatingOrderId, onSelect }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="flex min-h-[420px] flex-1 min-w-[130px] flex-col rounded-2xl border border-ink/10 bg-page/80">
      <div className="border-b border-ink/10 px-4 py-3">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gold-ink2">
          {column.title}
        </h3>
        <p className="text-[10px] text-gray-500">{orders.length} orders</p>
      </div>
      <div
        ref={setNodeRef}
        className={`flex flex-1 flex-col gap-3 p-3 transition-colors ${
          isOver ? "bg-gold-deep/5 ring-1 ring-gold-ink2/25" : ""
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
  const ordersPg = usePagination(filteredOrders, 15);

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
            <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-gold-ink2">
              Order Operations
            </p>
            <h1 className="text-3xl font-black tracking-tight text-ink">Orders</h1>
            <p className="mt-2 max-w-xl text-sm text-gray-400">
              <span className="text-ink/90">{orders.length}</span> total ·{" "}
              <span className="text-emerald-300/90">{activeOrderCount}</span> active (non-cancelled)
              {isNarrow
                ? " · On smaller screens, use table mode with status pills."
                : " · Drag cards between columns in board view, or switch to table."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!isNarrow ? (
              <div className="inline-flex rounded-full border border-ink/10 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("kanban")}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-widest ${
                    viewMode === "kanban"
                      ? "bg-gold-deep text-black"
                      : "text-gray-400 hover:text-ink"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" /> Board
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-widest ${
                    viewMode === "table"
                      ? "bg-gold-deep text-black"
                      : "text-gray-400 hover:text-ink"
                  }`}
                >
                  <Table2 className="h-4 w-4" /> Table
                </button>
              </div>
            ) : null}

            <button
              type="button"
              onClick={loadOrders}
              className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-ink/5 px-4 py-2 text-sm font-semibold text-ink transition hover:border-gold-ink2/50"
            >
              <RefreshCcw className="h-4 w-4" /> Refresh
            </button>
          </div>
        </div>

        <div className="admin-toolbar">
          <div className="relative min-w-[200px] flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                ordersPg.setPage(1);
              }}
              placeholder="Search order ID or email…"
              className="w-full rounded-2xl border border-ink/10 bg-black/60 py-2.5 pl-10 pr-4 text-sm text-ink outline-none focus:border-gold-ink2"
            />
          </div>
          <select
            value={listStatusFilter}
            onChange={(e) => setListStatusFilter(e.target.value)}
            className="admin-select"
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
            className="admin-select"
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
            className="admin-select"
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
          <div className="rounded-[28px] border border-ink/10 bg-page p-10 text-center text-sm text-gray-400">
            No orders placed yet.
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-[28px] border border-ink/10 bg-page p-10 text-center text-sm text-gray-400">
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
            <div className={`flex-1 overflow-x-auto rounded-[20px] ${!showKanban ? 'border border-ink/10 bg-page' : ''}`}>
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
                        onSelect={setDetailOrder}
                      />
                    ))}
                  </div>
                  <DragOverlay dropAnimation={null}>
                    {activeDrag ? (
                      <div className="w-[260px] cursor-grabbing rounded-2xl border border-gold-ink2/40 bg-panel p-4 shadow-2xl">
                        <p className="text-sm font-semibold text-ink">
                          {getCustomerName(activeDrag)}
                        </p>
                        <p className="mt-2 text-xs text-gold-ink2">
                          LKR {formatCurrency(activeDrag.totalAmount)}
                        </p>
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              ) : (
                <>
                <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-panel text-[9px] uppercase tracking-[0.25em] text-muted se-label">
                    <th className="w-10 px-3 py-2">
                      <input
                        type="checkbox"
                        aria-label="Select all orders"
                        checked={bulk.isAllSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = bulk.isSomeSelected;
                        }}
                        onChange={bulk.toggleAll}
                        className="h-4 w-4 cursor-pointer accent-gold-deep"
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
                  {ordersPg.pageItems.map((order) => {
                    return (
                      <motion.tr
                        key={order._id}
                        variants={itemVariants}
                        onClick={() => setDetailOrder(order)}
                        className={`border-t border-line/40 align-top transition-colors cursor-pointer hover:bg-panel`}
                      >
                        <td className="w-10 px-3 py-3 align-middle" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={bulk.isSelected(order._id)}
                              onChange={() => bulk.toggle(order._id)}
                              className="h-4 w-4 cursor-pointer accent-gold-deep"
                              data-testid="admin-bulk-row-select"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <span className="text-left se-mono text-[10px] text-ink-2 block truncate max-w-[80px]">
                            {String(order._id).slice(-12)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-ink-2 se-body text-xs align-middle">
                          <span className="block truncate max-w-[120px]">
                            {getCustomerName(order)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted se-mono text-[10px] whitespace-nowrap align-middle">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-muted se-label text-[9px] tracking-widest uppercase align-middle">
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
              <Pagination
                page={ordersPg.page}
                pageCount={ordersPg.pageCount}
                onPageChange={ordersPg.setPage}
                total={ordersPg.total}
                pageSize={ordersPg.pageSize}
                label="orders"
                className="px-4 pb-4"
              />
              </>
            )}
          </div>

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
