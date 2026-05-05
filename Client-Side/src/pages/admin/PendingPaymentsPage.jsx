import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Landmark,
  Loader2,
  RefreshCcw,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";

import { toast } from "@/hooks/use-toast";
import { pageVariants } from "@/components/admin-components/_shared/animations";
import { SkeletonRow } from "@/components/admin-components/_shared/SkeletonCard";
import { fetchPendingManualPayments, verifyManualPayment } from "@/store/manualPaymentSlice";
import { useSocketEvent } from "@/hooks/use-socket-events";

const MotionLink = motion.create(Link);

const statusOptions = [
  { label: "All", value: "all" },
  { label: "Pending", value: "proof_submitted" },
  { label: "Verified", value: "verified" },
  { label: "Rejected", value: "rejected" },
];

const statusMeta = {
  proof_submitted: {
    label: "Pending",
    className: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  },
  pending_payment: {
    label: "Pending",
    className: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  },
  verified: {
    label: "Verified",
    className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  },
  rejected: {
    label: "Rejected",
    className: "border-rose-500/20 bg-rose-500/10 text-rose-300",
  },
};

const formatDateTime = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const resolveOrder = (payment) => payment?.orderId || {};

const resolveCustomerName = (payment) => {
  const order = resolveOrder(payment);
  const user = order.user || payment?.userId || {};

  return (
    user.fullName ||
    user.name ||
    user.userName ||
    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
    user.email ||
    "—"
  );
};

const resolveOrderId = (payment) => {
  const order = resolveOrder(payment);

  return order._id || order.id || payment?.orderId || "—";
};

const resolvePaymentMethod = (payment) => {
  const order = resolveOrder(payment);

  return order.paymentMethod || payment?.paymentMethod || "—";
};

const PendingPaymentsPage = () => {
  const dispatch = useDispatch();
  const { pendingPayments, pagination, isAdminLoading, isVerifying } = useSelector(
    (state) => state.manualPayment,
  );

  const location = useLocation();
  const defaultStatusFilter = useMemo(
    () => (location.pathname.includes("/admin/manual-payments") ? "all" : "proof_submitted"),
    [location.pathname],
  );
  const [statusFilter, setStatusFilter] = useState(defaultStatusFilter);
  const [page, setPage] = useState(1);
  const limit = 10;

  const [decisionModal, setDecisionModal] = useState({
    open: false,
    payment: null,
    action: null,
    notes: "",
  });
  const [flashIds, setFlashIds] = useState(() => new Set());

  const requestParams = useMemo(
    () => ({
      page,
      limit,
      ...(statusFilter === "all" ? {} : { status: statusFilter }),
    }),
    [limit, page, statusFilter],
  );

  const loadQueue = useCallback(async () => {
    await dispatch(fetchPendingManualPayments(requestParams));
  }, [dispatch, requestParams]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  useEffect(() => {
    setStatusFilter(defaultStatusFilter);
  }, [defaultStatusFilter]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  useSocketEvent(
    "payment:refresh",
    () => {
      loadQueue();
    },
    [loadQueue],
  );

  useSocketEvent(
    "payment:new_pending",
    (payload) => {
      const id = payload?.paymentId || payload?._id || payload?.id;
      if (id) {
        setFlashIds((prev) => new Set(prev).add(String(id)));
        window.setTimeout(() => {
          setFlashIds((prev) => {
            const next = new Set(prev);
            next.delete(String(id));
            return next;
          });
        }, 2400);
      }
      loadQueue();
    },
    [loadQueue],
  );

  const openDecisionModal = (payment, action) => {
    setDecisionModal({
      open: true,
      payment,
      action,
      notes: "",
    });
  };

  const closeDecisionModal = () => {
    if (isVerifying) {
      return;
    }

    setDecisionModal({
      open: false,
      payment: null,
      action: null,
      notes: "",
    });
  };

  const confirmDecision = async () => {
    if (!decisionModal.payment || !decisionModal.action) {
      return;
    }

    const notes = decisionModal.notes.trim();
    const action = decisionModal.action === "verify" ? "approve" : "reject";

    try {
      await dispatch(
        verifyManualPayment({
          paymentId: decisionModal.payment._id,
          action,
          adminNotes: notes || undefined,
          rejectionReason: decisionModal.action === "reject" ? notes || undefined : undefined,
        }),
      ).unwrap();

      toast({
        title: decisionModal.action === "verify" ? "Payment verified" : "Payment rejected",
        description:
          decisionModal.action === "verify"
            ? "The payment queue has been updated."
            : "The payment has been marked as rejected.",
        variant: "success",
      });

      closeDecisionModal();
      await loadQueue();
    } catch (error) {
      toast({
        title: "Action failed",
        description: error || "Unable to complete this verification.",
        variant: "destructive",
      });
    }
  };

  const currentStatusLabel = (status) => statusMeta[status]?.label || status.replace(/_/g, " ");

  const currentStatusClass = (status) =>
    statusMeta[status]?.className || "border-white/10 bg-white/5 text-gray-300";

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-[#050505] px-6 py-8 text-white lg:px-8"
    >
      <div className="flex w-full flex-col gap-8">
        <section className="rounded-[2rem] border border-[#D4AF37]/15 bg-[linear-gradient(180deg,rgba(212,175,55,0.14),rgba(255,255,255,0.02)_50%,rgba(255,255,255,0.04)_100%)] p-8 shadow-[0_30px_120px_rgba(0,0,0,0.4)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.35em] text-[#D4AF37]">Pending payments</p>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
                Review manual payments and resolve the queue.
              </h1>
              <p className="mt-4 text-sm leading-7 text-gray-400">
                Verify or reject customer transfers directly from the admin panel.
              </p>
            </div>

            <button
              type="button"
              onClick={loadQueue}
              className="inline-flex items-center justify-center gap-3 self-start rounded-full border border-[#D4AF37]/25 bg-black/70 px-5 py-3 text-sm font-semibold text-white transition hover:border-[#D4AF37]"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh queue
            </button>
          </div>
        </section>

        <section className="grid gap-6 rounded-[1.75rem] border border-white/10 bg-[#0b0b0b] p-6 md:grid-cols-2 xl:grid-cols-[1fr_0.75fr]">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.28em] text-gray-500">Status filter</p>
            <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatusFilter(option.value)}
                  className={`relative rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition-colors ${
                    statusFilter === option.value ? "text-black" : "text-gray-400 hover:text-white"
                  }`}
                >
                  {statusFilter === option.value ? (
                    <motion.span
                      layoutId="pending-payment-status-pill"
                      className="absolute inset-0 -z-10 rounded-full bg-[#D4AF37]"
                      transition={{ type: "spring", stiffness: 400, damping: 34 }}
                    />
                  ) : null}
                  <span className="relative z-10">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-gray-400">
            <div className="flex items-center gap-2 text-[#D4AF37]">
              <Landmark className="h-4 w-4" />
              Queue summary
            </div>
            <p className="mt-2 text-white">
              {pagination.totalCount || 0} records in this view.
            </p>
          </div>
        </section>

        {isAdminLoading ? (
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b0b0b]">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-black/40 text-[10px] uppercase tracking-[0.24em] text-gray-400">
                <tr>
                  <th className="px-6 py-4">Reference</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonRow key={i} colSpan={5} />
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-center gap-2 border-t border-white/10 py-4 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin text-[#D4AF37]" />
              <span>Loading pending payments…</span>
            </div>
          </div>
        ) : pendingPayments.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[2rem] border border-white/10 bg-[#0b0b0b] p-10 text-center text-sm text-gray-400">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold text-white">No pending payments</h2>
            <p className="mt-2 max-w-md leading-6 text-gray-400">
              There are no payments waiting for admin verification in the selected filter.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0b0b0b] shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                <thead className="bg-black/40 text-[10px] uppercase tracking-[0.24em] text-gray-400">
                  <tr>
                    <th className="px-6 py-4">Reference Number</th>
                    <th className="px-6 py-4">Customer Name</th>
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Amount (LKR)</th>
                    <th className="px-6 py-4">Payment Method</th>
                    <th className="px-6 py-4">Submitted At</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">
                  {pendingPayments.map((payment) => {
                    const status = payment.status || "proof_submitted";
                    const rowKey = String(payment._id || payment.referenceNumber);
                    const flash = flashIds.has(rowKey);

                    return (
                      <motion.tr
                        key={rowKey}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          boxShadow: flash
                            ? ["inset 5px 0 0 0 #D4AF37", "inset 5px 0 0 0 rgba(212,175,55,0)"]
                            : "inset 0 0 0 0 transparent",
                        }}
                        transition={{
                          layout: { type: "spring", stiffness: 300, damping: 30 },
                          boxShadow: { duration: 1.8, ease: "easeOut" },
                          default: { duration: 0.25 },
                        }}
                        className="align-top hover:bg-white/[0.02]"
                      >
                        <td className="px-6 py-5 font-mono text-xs tracking-[0.2em] text-[#D4AF37]">
                          {payment.referenceNumber || "—"}
                        </td>
                        <td className="px-6 py-5 text-white">{resolveCustomerName(payment)}</td>
                        <td className="px-6 py-5 break-all text-gray-300">{resolveOrderId(payment)}</td>
                        <td className="px-6 py-5 text-gray-300">LKR {formatCurrency(payment.amount)}</td>
                        <td className="px-6 py-5 text-gray-300">{resolvePaymentMethod(payment)}</td>
                        <td className="px-6 py-5 text-gray-300">{formatDateTime(payment.proofSubmittedAt || payment.createdAt)}</td>
                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.24em] ${currentStatusClass(status)}`}
                          >
                            {currentStatusLabel(status)}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-wrap gap-2">
                            <MotionLink
                              to={`/admin/manual-payments/${payment._id}`}
                              whileTap={{ scale: 0.96 }}
                              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white transition hover:border-[#D4AF37]/40"
                            >
                              Details
                            </MotionLink>
                            <motion.button
                              type="button"
                              whileTap={{ scale: 0.96 }}
                              onClick={() => openDecisionModal(payment, "verify")}
                              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-200 transition hover:border-emerald-500/40 hover:bg-emerald-500/20"
                            >
                              Verify <CheckCircle2 className="h-4 w-4" />
                            </motion.button>
                            <motion.button
                              type="button"
                              whileTap={{ scale: 0.96 }}
                              onClick={() => openDecisionModal(payment, "reject")}
                              className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-rose-200 transition hover:border-rose-500/40 hover:bg-rose-500/20"
                            >
                              Reject <XCircle className="h-4 w-4" />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between rounded-[1.5rem] border border-white/10 bg-[#0b0b0b] px-5 py-4 text-sm text-gray-400">
          <span>
            Page {pagination.page || page} of {pagination.totalPages || 0}
          </span>
          <div className="flex items-center gap-3">
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              disabled={page <= 1}
              onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
              className="rounded-full border border-white/10 px-4 py-2 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              disabled={page >= (pagination.totalPages || 1)}
              onClick={() => setPage((currentPage) => currentPage + 1)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next <ArrowRight className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      </div>

      {decisionModal.open && decisionModal.payment ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[1.75rem] border border-white/10 bg-[#0b0b0b] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.6)]">
            <p className="text-xs uppercase tracking-[0.35em] text-[#D4AF37]">
              {decisionModal.action === "verify" ? "Verify payment" : "Reject payment"}
            </p>
            <h2 className="mt-3 text-2xl font-black text-white">
              {decisionModal.payment.referenceNumber || "Manual payment"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              Add optional admin notes before confirming this action.
            </p>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/35 p-4 text-sm text-gray-300">
              <p>
                <span className="text-gray-500">Customer:</span> {resolveCustomerName(decisionModal.payment)}
              </p>
              <p className="mt-2">
                <span className="text-gray-500">Amount:</span> LKR {formatCurrency(decisionModal.payment.amount)}
              </p>
            </div>

            <label className="mt-5 block text-sm text-gray-300">
              Admin notes
              <textarea
                value={decisionModal.notes}
                onChange={(event) => setDecisionModal((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Optional internal note"
                className="mt-2 min-h-[120px] w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]"
              />
            </label>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDecisionModal}
                disabled={isVerifying}
                className="rounded-full border border-white/10 px-5 py-3 text-sm font-bold uppercase tracking-[0.2em] text-white transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDecision}
                disabled={isVerifying}
                className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black uppercase tracking-[0.22em] text-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  decisionModal.action === "verify"
                    ? "bg-emerald-400 hover:bg-emerald-300"
                    : "bg-rose-400 hover:bg-rose-300"
                }`}
              >
                {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {decisionModal.action === "verify" ? "Verify" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
};

export default PendingPaymentsPage;
