import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { GripVertical, Loader2, RefreshCcw } from "lucide-react";

import { fetchAdminOrders, updateOrderStatus } from "@/store/order-slice";
import { toast } from "@/hooks/use-toast";
import StatusBadge from "@/components/common-components/StatusBadge";

const VIEW_STORAGE_KEY = "admin-order-management-view";

const BOARD_COLUMNS = [
  {
    key: "pending",
    label: "Pending",
    statuses: ["pending", "pending_payment"],
    canonicalStatus: "pending_payment",
    borderClass: "border-amber-400/25",
    accentClass: "text-amber-300",
  },
  {
    key: "processing",
    label: "Processing",
    statuses: ["verification_pending", "confirmed"],
    canonicalStatus: "confirmed",
    borderClass: "border-sky-400/25",
    accentClass: "text-sky-300",
  },
  {
    key: "shipped",
    label: "Shipped",
    statuses: ["shipped"],
    canonicalStatus: "shipped",
    borderClass: "border-indigo-400/25",
    accentClass: "text-indigo-300",
  },
  {
    key: "delivered",
    label: "Delivered",
    statuses: ["delivered"],
    canonicalStatus: "delivered",
    borderClass: "border-emerald-400/25",
    accentClass: "text-emerald-300",
  },
  {
    key: "cancelled",
    label: "Cancelled",
    statuses: ["cancelled"],
    canonicalStatus: "cancelled",
    borderClass: "border-rose-400/25",
    accentClass: "text-rose-300",
  },
];

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "pending_payment", label: "Pending Payment" },
  { value: "verification_pending", label: "Verification Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_TO_COLUMN = BOARD_COLUMNS.reduce((accumulator, column) => {
  column.statuses.forEach((status) => {
    accumulator[status] = column.key;
  });
  return accumulator;
}, {});

const COLUMN_TO_STATUS = BOARD_COLUMNS.reduce((accumulator, column) => {
  accumulator[column.key] = column.canonicalStatus;
  return accumulator;
}, {});

const sortOrders = (orders = []) =>
  [...orders].sort((left, right) => {
    const leftTime = new Date(left.createdAt || 0).getTime();
    const rightTime = new Date(right.createdAt || 0).getTime();

    return rightTime - leftTime;
  });

const getColumnKey = (status = "") => STATUS_TO_COLUMN[String(status).toLowerCase()] || "pending";

const createEmptyBoard = () =>
  BOARD_COLUMNS.reduce((accumulator, column) => {
    accumulator[column.key] = [];
    return accumulator;
  }, {});

const groupOrdersByBoard = (orders = []) => {
  const grouped = createEmptyBoard();

  orders.forEach((order) => {
    const columnKey = getColumnKey(order.status);
    grouped[columnKey].push(order);
  });

  BOARD_COLUMNS.forEach((column) => {
    grouped[column.key] = sortOrders(grouped[column.key]);
  });

  return grouped;
};

const flattenBoard = (board = {}) =>
  BOARD_COLUMNS.flatMap((column) => board[column.key] || []);

const moveOrderBetweenColumns = (board, orderId, nextStatus) => {
  const nextColumnKey = getColumnKey(nextStatus);
  const nextBoard = createEmptyBoard();
  let movedOrder = null;

  BOARD_COLUMNS.forEach((column) => {
    (board[column.key] || []).forEach((order) => {
      if (String(order._id) === String(orderId)) {
        movedOrder = { ...order, status: nextStatus };
        return;
      }

      nextBoard[column.key].push(order);
    });
  });

  if (!movedOrder) {
    return board;
  }

  nextBoard[nextColumnKey].push(movedOrder);

  BOARD_COLUMNS.forEach((column) => {
    nextBoard[column.key] = sortOrders(nextBoard[column.key]);
  });

  return nextBoard;
};

const formatCurrency = (amount = 0) =>
  Number(amount || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

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

const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") return true;

    return window.matchMedia("(min-width: 768px)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handleChange = (event) => setIsDesktop(event.matches);

    setIsDesktop(mediaQuery.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  return isDesktop;
};

const OrderCardContent = ({ order, compact = false, dragHandleProps = {}, isDragging = false }) => {
  const itemCount = order.items?.length || 0;

  return (
    <div
      className={`rounded-[1.5rem] border bg-[#0b0b0b] p-4 transition-shadow ${
        isDragging ? "shadow-[0_24px_80px_rgba(0,0,0,0.45)]" : "shadow-none"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Order ID</p>
          <p className="mt-1 break-all text-sm font-semibold text-white">{order._id}</p>
        </div>

        {!compact ? (
          <button
            type="button"
            className="rounded-full border border-white/10 p-2 text-gray-500 transition hover:border-[#2f7cf6]/50 hover:text-[#2f7cf6]"
            {...dragHandleProps}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Customer</p>
          <p className="mt-1 text-sm text-white">{getCustomerName(order)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Total Amount</p>
          <p className="mt-1 text-sm text-white">LKR {formatCurrency(order.totalAmount)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Date</p>
          <p className="mt-1 text-sm text-white">{formatDate(order.createdAt)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Items</p>
          <p className="mt-1 text-sm text-white">{itemCount}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusBadge status={order.status} />
        {order.paymentMethod ? (
          <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-gray-300">
            {order.paymentMethod}
          </span>
        ) : null}
      </div>
    </div>
  );
};

const SortableOrderCard = ({ order, onStatusChange, isLocked }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: order._id,
    disabled: isLocked,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <OrderCardContent order={order} isDragging={isDragging} />
    </div>
  );
};

const BoardColumn = ({ column, orders, isHighlighted, isLocked }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.key,
    disabled: isLocked,
  });

  return (
    <section
      ref={setNodeRef}
      className={`flex min-h-[520px] flex-col rounded-[1.75rem] border bg-[#090909] p-4 transition-colors ${
        isOver || isHighlighted
          ? "border-[#2f7cf6] shadow-[0_0_0_1px_rgba(47,124,246,0.4)]"
          : column.borderClass
      }`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div>
          <h2 className={`text-lg font-bold ${column.accentClass}`}>{column.label}</h2>
          <p className="mt-1 text-xs uppercase tracking-[0.24em] text-gray-500">
            {orders.length} orders
          </p>
        </div>
      </div>

      <div className="mt-4 flex-1 space-y-3">
        {orders.length === 0 ? (
          <div className="flex min-h-[300px] items-center justify-center rounded-[1.25rem] border border-dashed border-white/10 bg-white/[0.02] text-sm text-gray-500">
            Drop orders here
          </div>
        ) : (
          <SortableContext items={orders.map((order) => order._id)} strategy={verticalListSortingStrategy}>
            {orders.map((order) => (
              <SortableOrderCard key={order._id} order={order} isLocked={isLocked} />
            ))}
          </SortableContext>
        )}
      </div>
    </section>
  );
};

const StatusSelect = ({ order, onChange, isDisabled = false }) => (
  <select
    value={order.status}
    onChange={(event) => onChange(order, event.target.value)}
    disabled={isDisabled}
    className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-sm text-white outline-none transition focus:border-[#2f7cf6] disabled:cursor-not-allowed disabled:opacity-60"
  >
    {STATUS_OPTIONS.map((statusOption) => (
      <option key={statusOption.value} value={statusOption.value}>
        {statusOption.label}
      </option>
    ))}
  </select>
);

const Orders = () => {
  const dispatch = useDispatch();
  const { adminOrders, isLoading } = useSelector((state) => state.order);

  const [boardColumns, setBoardColumns] = useState(() => createEmptyBoard());
  const [hasLoaded, setHasLoaded] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window === "undefined") {
      return "kanban";
    }

    return window.localStorage.getItem(VIEW_STORAGE_KEY) || "kanban";
  });
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [hoverColumnId, setHoverColumnId] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const previousBoardRef = useRef(null);

  const isDesktop = useIsDesktop();

  const activeOrder = useMemo(() => {
    if (!activeOrderId) return null;

    return flattenBoard(boardColumns).find((order) => String(order._id) === String(activeOrderId)) || null;
  }, [activeOrderId, boardColumns]);

  const flatOrders = useMemo(() => flattenBoard(boardColumns), [boardColumns]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

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

  useEffect(() => {
    setBoardColumns(groupOrdersByBoard(adminOrders));
  }, [adminOrders]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(VIEW_STORAGE_KEY, viewMode);
    }
  }, [viewMode]);

  const handleStatusChange = useCallback(
    async (order, nextStatus) => {
      if (!order || !nextStatus || String(order.status) === String(nextStatus)) {
        return;
      }

      if (updatingOrderId) {
        return;
      }

      previousBoardRef.current = boardColumns;
      setUpdatingOrderId(order._id);
      setBoardColumns((currentBoard) => moveOrderBetweenColumns(currentBoard, order._id, nextStatus));

      try {
        await dispatch(updateOrderStatus({ orderId: order._id, status: nextStatus })).unwrap();

        toast({
          title: "Order updated",
          description: `Status changed to ${nextStatus.replace(/_/g, " ")}.`,
          variant: "success",
        });
      } catch (error) {
        setBoardColumns(previousBoardRef.current || createEmptyBoard());

        toast({
          title: "Update failed",
          description: error || "Unable to update status.",
          variant: "destructive",
        });
      } finally {
        previousBoardRef.current = null;
        setUpdatingOrderId(null);
      }
    },
    [boardColumns, dispatch, updatingOrderId],
  );

  const getTargetColumnId = (targetId) => {
    if (!targetId) return null;

    const directColumn = BOARD_COLUMNS.find((column) => column.key === targetId);
    if (directColumn) {
      return directColumn.key;
    }

    const targetOrder = flatOrders.find((order) => String(order._id) === String(targetId));
    if (!targetOrder) return null;

    return getColumnKey(targetOrder.status);
  };

  const handleDragStart = ({ active }) => {
    setActiveOrderId(active.id);
  };

  const handleDragOver = ({ over }) => {
    setHoverColumnId(getTargetColumnId(over?.id));
  };

  const handleDragCancel = () => {
    setActiveOrderId(null);
    setHoverColumnId(null);
  };

  const handleDragEnd = ({ active, over }) => {
    const sourceOrder = flatOrders.find((order) => String(order._id) === String(active.id));
    const targetColumnId = getTargetColumnId(over?.id);

    setActiveOrderId(null);
    setHoverColumnId(null);

    if (!sourceOrder || !targetColumnId || updatingOrderId) {
      return;
    }

    const nextStatus = COLUMN_TO_STATUS[targetColumnId];

    if (!nextStatus || getColumnKey(sourceOrder.status) === targetColumnId) {
      return;
    }

    void handleStatusChange(sourceOrder, nextStatus);
  };

  const showLoading = isLoading && !hasLoaded;

  return (
    <div className="min-h-screen bg-[#060606] py-10 text-white">
      <div className="container mx-auto px-4 md:px-8">
        <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-widest text-white">Orders</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-400">
              Drag cards across columns to update status, or switch to list view for a table-based workflow.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isDesktop ? (
              <button
                type="button"
                onClick={() => setViewMode((current) => (current === "kanban" ? "list" : "kanban"))}
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-[#2f7cf6]/50 hover:text-[#2f7cf6]"
              >
                {viewMode === "kanban" ? "List View" : "Kanban View"}
              </button>
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
            <Loader2 className="mr-3 h-5 w-5 animate-spin text-[#2f7cf6]" /> Loading orders…
          </div>
        ) : flatOrders.length === 0 ? (
          <div className="rounded-[1.75rem] border border-white/10 bg-[#090909] p-10 text-center text-sm text-gray-400">
            No orders placed yet.
          </div>
        ) : isDesktop && viewMode === "kanban" ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragCancel={handleDragCancel}
            onDragEnd={handleDragEnd}
          >
            <div className="grid gap-5 xl:grid-cols-5">
              {BOARD_COLUMNS.map((column) => (
                <BoardColumn
                  key={column.key}
                  column={column}
                  orders={boardColumns[column.key] || []}
                  isHighlighted={hoverColumnId === column.key}
                  isLocked={Boolean(updatingOrderId)}
                />
              ))}
            </div>

            <DragOverlay>
              {activeOrder ? <OrderCardContent order={activeOrder} isDragging /> : null}
            </DragOverlay>
          </DndContext>
        ) : isDesktop ? (
          <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#090909]">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                <thead className="bg-black/40 text-[10px] uppercase tracking-[0.24em] text-gray-400">
                  <tr>
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Customer Name</th>
                    <th className="px-6 py-4">Total Amount</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Items Count</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">
                  {flatOrders.map((order) => (
                    <tr key={order._id} className="align-top hover:bg-white/[0.02]">
                      <td className="px-6 py-5 break-all text-white">{order._id}</td>
                      <td className="px-6 py-5 text-gray-300">{getCustomerName(order)}</td>
                      <td className="px-6 py-5 text-gray-300">LKR {formatCurrency(order.totalAmount)}</td>
                      <td className="px-6 py-5 text-gray-300">{formatDate(order.createdAt)}</td>
                      <td className="px-6 py-5 text-gray-300">{order.items?.length || 0}</td>
                      <td className="px-6 py-5">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-5">
                        <StatusSelect
                          order={order}
                          onChange={handleStatusChange}
                          isDisabled={Boolean(updatingOrderId)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-4 md:hidden">
            {flatOrders.map((order) => (
              <div key={order._id} className="rounded-[1.5rem] border border-white/10 bg-[#090909] p-4">
                <OrderCardContent order={order} compact />

                <div className="mt-4 border-t border-white/5 pt-4">
                  <p className="mb-2 text-[10px] uppercase tracking-[0.24em] text-gray-500">Update Status</p>
                  <StatusSelect
                    order={order}
                    onChange={handleStatusChange}
                    isDisabled={Boolean(updatingOrderId)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {isDesktop ? (
          <p className="mt-4 text-xs uppercase tracking-[0.22em] text-gray-500">
            Kanban board is available on desktop screens only.
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default Orders;
