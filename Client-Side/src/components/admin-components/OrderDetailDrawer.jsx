import React, { useEffect, useMemo } from "react";
// eslint-disable-next-line no-unused-vars -- motion JSX
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  CreditCard,
  Gift,
  MessageSquareText,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  Truck,
  X,
  XCircle,
} from "lucide-react";

const formatCurrency = (value = 0) =>
  Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDateTime = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const cleanPhoneForWhatsApp = (raw) => {
  if (!raw) return "";
  const digits = String(raw).replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return `94${digits.slice(1)}`;
  if (digits.length <= 9) return `94${digits}`;
  return digits;
};

// Order status progression. Each stage either has its own timestamp on the
// order document, or "leaks" via the status enum once we move past it.
// fallbackStatus lists the statuses that imply this stage has been reached
// even when no explicit timestamp exists.
const TIMELINE_STAGES = [
  {
    key: "ordered",
    label: "Ordered",
    icon: ShoppingCart,
    atField: "createdAt",
    fallbackStatus: [],
  },
  {
    key: "payment",
    label: "Payment Submitted",
    icon: CreditCard,
    atField: "proofSubmittedAt",
    fallbackStatus: [
      "verification_pending",
      "proof_submitted",
      "confirmed",
      "shipped",
      "delivered",
      "refund_requested",
      "refunded",
    ],
  },
  {
    key: "verified",
    label: "Payment Verified",
    icon: ShieldCheck,
    atField: "paymentVerifiedAt",
    fallbackStatus: ["confirmed", "shipped", "delivered", "refund_requested", "refunded"],
  },
  {
    key: "confirmed",
    label: "Confirmed & Packed",
    icon: CheckCircle2,
    atField: "confirmedAt",
    fallbackStatus: ["confirmed", "shipped", "delivered", "refund_requested", "refunded"],
  },
  {
    key: "shipped",
    label: "Shipped",
    icon: Truck,
    atField: "shippedAt",
    fallbackStatus: ["shipped", "delivered"],
  },
  {
    key: "delivered",
    label: "Delivered",
    icon: PackageCheck,
    atField: "deliveredAt",
    fallbackStatus: ["delivered"],
  },
  {
    key: "collectible",
    label: "Collectible Revealed",
    icon: Gift,
    atField: "gift.revealedAt",
    fallbackStatus: [],
  },
];

const readPath = (obj, path) =>
  path.split(".").reduce((acc, k) => (acc ? acc[k] : undefined), obj);

const isTerminal = (status) =>
  status === "cancelled" || status === "refunded" || status === "refund_requested";

const Timeline = ({ order }) => {
  const status = order?.status || "pending";

  return (
    <ol className="relative ml-3 space-y-5 border-l border-white/10 pl-6">
      {TIMELINE_STAGES.map((stage) => {
        const Icon = stage.icon;
        const at = readPath(order || {}, stage.atField);
        const reached = !!at || stage.fallbackStatus.includes(status);
        const isCurrent =
          stage.fallbackStatus.length > 0 &&
          (stage.fallbackStatus[0] === status ||
            (stage.key === "ordered" &&
              (status === "pending" || status === "pending_payment")));
        const dotTone = reached
          ? isCurrent
            ? "border-[#f2ca50] bg-[#f2ca50] text-black shadow-[0_0_18px_rgba(242,202,80,0.4)]"
            : "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
          : "border-white/10 bg-black/40 text-gray-600";

        return (
          <li key={stage.key} className="relative">
            <span
              className={`absolute -left-[34px] top-0 flex h-7 w-7 items-center justify-center rounded-full border ${dotTone}`}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <p
              className={`text-sm font-semibold ${
                reached ? "text-white" : "text-gray-500"
              }`}
            >
              {stage.label}
            </p>
            {at ? (
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">
                {formatDateTime(at)}
              </p>
            ) : reached ? (
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400/60">
                reached
              </p>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
};

const QuickAction = ({ icon: Icon, label, onClick, tone = "default", disabled }) => {
  const toneClasses =
    tone === "success"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:border-emerald-500/50 hover:bg-emerald-500/20"
      : tone === "danger"
        ? "border-rose-500/30 bg-rose-500/10 text-rose-200 hover:border-rose-500/50 hover:bg-rose-500/20"
        : tone === "accent"
          ? "border-[#f2ca50]/40 bg-[#f2ca50]/10 text-[#f2ca50] hover:bg-[#f2ca50]/20"
          : "border-white/10 bg-white/[0.04] text-gray-300 hover:border-white/20 hover:text-white";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em] transition disabled:cursor-not-allowed disabled:opacity-50 ${toneClasses}`}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
};

const OrderDetailDrawer = ({
  order,
  open,
  onClose,
  onMarkStatus,
  onRefund,
  onDownloadInvoice,
  isBusy = false,
}) => {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const phone = useMemo(() => {
    if (!order) return "";
    return (
      order.contactNumber ||
      order.shippingAddress?.phone ||
      order.shippingAddress?.contactNumber ||
      ""
    );
  }, [order]);
  const waPhone = cleanPhoneForWhatsApp(phone);

  const customerName = useMemo(() => {
    if (!order) return "—";
    const u = order.user || {};
    return (
      u.fullName ||
      u.userName ||
      u.name ||
      `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
      u.email ||
      order.guestEmail ||
      "Guest"
    );
  }, [order]);

  const status = order?.status || "pending";
  const canConfirm = ["pending", "pending_payment", "verification_pending", "proof_submitted"].includes(status);
  const canShip = status === "confirmed";
  const canDeliver = status === "shipped";
  const canRefund = ["delivered", "refund_requested"].includes(status);
  const showCancelled = isTerminal(status);

  return (
    <AnimatePresence>
      {open && order ? (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm"
          />
          <motion.aside
            key="drawer"
            role="dialog"
            aria-modal="true"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 36 }}
            className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-[640px] flex-col border-l border-[#4d4635]/60 bg-[#0a0a0a] text-white shadow-[-30px_0_80px_rgba(0,0,0,0.6)]"
          >
            <header className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#f2ca50]">
                  Order story
                </p>
                <h2 className="mt-1 truncate text-xl font-bold text-white">{customerName}</h2>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500">
                  {String(order._id).slice(-12)}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/10 bg-black/60 p-2 text-gray-300 transition hover:border-[#f2ca50]/40 hover:text-[#f2ca50]"
                aria-label="Close drawer"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <section className="space-y-5 px-6 py-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/5 bg-black/35 p-3">
                    <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-gray-500">
                      Total
                    </p>
                    <p className="mt-1 text-lg font-bold tabular-nums text-white">
                      LKR {formatCurrency(order.totalAmount)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-black/35 p-3">
                    <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-gray-500">
                      Items
                    </p>
                    <p className="mt-1 text-lg font-bold tabular-nums text-white">
                      {(order.items || []).reduce((sum, i) => sum + (i.quantity || 1), 0)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-black/35 p-3">
                    <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-gray-500">
                      Payment
                    </p>
                    <p className="mt-1 truncate text-sm text-white">{order.paymentMethod || "—"}</p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-black/35 p-3">
                    <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-gray-500">
                      Placed
                    </p>
                    <p className="mt-1 text-sm text-white">
                      {formatDateTime(order.createdAt) || "—"}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-gray-400">
                    Customer
                  </p>
                  <p className="mt-2 text-sm text-white">{customerName}</p>
                  <p className="mt-1 break-all text-xs text-gray-400">
                    {order.user?.email || order.guestEmail || "—"}
                  </p>
                  {phone ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 font-mono text-[10px] tracking-[0.18em] text-gray-300">
                        {phone}
                      </span>
                      {waPhone ? (
                        <a
                          href={`https://wa.me/${waPhone}?text=${encodeURIComponent(`Hi, regarding your Saga Elite order ${String(order._id).slice(-8)}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-300 transition hover:bg-emerald-500/20"
                        >
                          <MessageSquareText className="h-3 w-3" /> WhatsApp
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                  {order.shippingAddress?.address ? (
                    <p className="mt-3 text-xs leading-5 text-gray-400">
                      {order.shippingAddress.address}
                      {order.shippingAddress.city ? `, ${order.shippingAddress.city}` : ""}
                      {order.shippingAddress.zipCode ? ` ${order.shippingAddress.zipCode}` : ""}
                    </p>
                  ) : null}
                </div>
              </section>

              <section className="border-t border-white/10 px-6 py-6">
                <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.28em] text-gray-400">
                  Customer story timeline
                </p>
                {showCancelled ? (
                  <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
                    Order is in a terminal state ({status.replace(/_/g, " ")}). Timeline frozen below.
                  </div>
                ) : null}
                <Timeline order={order} />
              </section>

              {order.items && order.items.length > 0 ? (
                <section className="border-t border-white/10 px-6 py-6">
                  <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.28em] text-gray-400">
                    Items ({order.items.length})
                  </p>
                  <ul className="space-y-2">
                    {order.items.map((line, idx) => (
                      <li
                        key={idx}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/30 px-3 py-2 text-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-white">
                            {line.name || line.product?.name || "Item"}
                          </p>
                          {line.size || line.color ? (
                            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
                              {[line.size, line.color].filter(Boolean).join(" · ")}
                            </p>
                          ) : null}
                        </div>
                        <span className="shrink-0 font-mono text-xs tabular-nums text-gray-300">
                          ×{line.quantity || 1}
                        </span>
                        <span className="shrink-0 font-mono text-xs tabular-nums text-white">
                          LKR {formatCurrency(line.totalPrice || line.unitPrice * (line.quantity || 1))}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>

            <footer className="border-t border-white/10 bg-[#0a0a0a] px-6 py-4">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.28em] text-gray-500">
                Quick actions
              </p>
              <div className="grid grid-cols-2 gap-2">
                {canConfirm ? (
                  <QuickAction
                    icon={CheckCircle2}
                    label="Confirm"
                    tone="success"
                    onClick={() => onMarkStatus?.("confirmed")}
                    disabled={isBusy}
                  />
                ) : null}
                {canShip ? (
                  <QuickAction
                    icon={Truck}
                    label="Mark shipped"
                    tone="accent"
                    onClick={() => onMarkStatus?.("shipped")}
                    disabled={isBusy}
                  />
                ) : null}
                {canDeliver ? (
                  <QuickAction
                    icon={PackageCheck}
                    label="Mark delivered"
                    tone="success"
                    onClick={() => onMarkStatus?.("delivered")}
                    disabled={isBusy}
                  />
                ) : null}
                {canRefund ? (
                  <QuickAction
                    icon={RotateCcw}
                    label="Issue refund"
                    tone="danger"
                    onClick={() => onRefund?.()}
                    disabled={isBusy}
                  />
                ) : null}
                {!showCancelled ? (
                  <QuickAction
                    icon={XCircle}
                    label="Cancel"
                    tone="danger"
                    onClick={() => onMarkStatus?.("cancelled")}
                    disabled={isBusy}
                  />
                ) : null}
                {onDownloadInvoice ? (
                  <QuickAction
                    icon={MessageSquareText}
                    label="Invoice PDF"
                    onClick={() => onDownloadInvoice()}
                    disabled={isBusy}
                  />
                ) : null}
              </div>
            </footer>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
};

export default OrderDetailDrawer;
