import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Landmark,
  Loader2,
  RefreshCcw,
  ShieldAlert,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";

import { toast } from "@/hooks/use-toast";
import { pageVariants } from "@/components/admin-components/_shared/animations";
import { SkeletonRow } from "@/components/admin-components/_shared/SkeletonCard";
import {
  fetchPendingManualPayments,
  fetchManualPaymentMethodSummary,
  verifyManualPayment,
} from "@/store/manualPaymentSlice";
import { useSocketEvent } from "@/hooks/use-socket-events";

const MotionLink = motion.create(Link);

const statusOptions = [
  { label: "All", value: "all" },
  { label: "Awaiting receipt", value: "pending_payment" },
  { label: "Pending review", value: "proof_submitted" },
  { label: "Awaiting bank", value: "pending_bank_confirmation" },
  { label: "Verified", value: "verified" },
  { label: "Rejected", value: "rejected" },
  { label: "Expired", value: "expired" },
];

const statusMeta = {
  proof_submitted: {
    label: "Pending review",
    className: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  },
  pending_payment: {
    label: "Awaiting receipt",
    className: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  },
  pending_bank_confirmation: {
    label: "Awaiting bank",
    className: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  },
  verified: {
    label: "Verified",
    className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  },
  rejected: {
    label: "Rejected",
    className: "border-rose-500/20 bg-rose-500/10 text-rose-300",
  },
  expired: {
    label: "Expired",
    className: "border-zinc-500/20 bg-zinc-500/10 text-zinc-300",
  },
};

const PAYMENT_METHOD_LABELS = {
  manual_bank_transfer: "Bank Transfer",
  manual: "Manual (legacy)",
  cash: "Cash",
  payhere: "PayHere",
  gpay: "Google Pay",
  card: "Card",
  lankapay: "LankaPay",
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
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
  const { pendingPayments, pagination, isAdminLoading, isVerifying, methodSummary } =
    useSelector((state) => state.manualPayment);

  const location = useLocation();
  const defaultStatusFilter = useMemo(
    () =>
      location.pathname.includes("/admin/manual-payments")
        ? "all"
        : "proof_submitted",
    [location.pathname]
  );

  const [statusFilter, setStatusFilter] = useState(defaultStatusFilter);
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("all");
  const [guestOnly, setGuestOnly] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 10;

  const [decisionModal, setDecisionModal] = useState({
    open: false,
    payment: null,
    action: null,
    notes: "",
  });

  const [flashIds, setFlashIds] = useState(() => new Set());
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkProcessing, setBulkProcessing] = useState(null);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0, failed: 0 });

  const requestParams = useMemo(
    () => ({
      page,
      limit,
      status: statusFilter,
      guestOnly,
      paymentType: paymentTypeFilter,
    }),
    [limit, page, statusFilter, guestOnly, paymentTypeFilter]
  );

  const loadQueue = useCallback(async () => {
    await dispatch(fetchPendingManualPayments(requestParams));
    await dispatch(fetchManualPaymentMethodSummary({ guestOnly }));
  }, [dispatch, requestParams, guestOnly]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, guestOnly, paymentTypeFilter]);

  useEffect(() => {
    setStatusFilter(defaultStatusFilter);
  }, [defaultStatusFilter]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  useSocketEvent("payment:refresh", loadQueue, [loadQueue]);

  useSocketEvent(
    "payment:new_pending",
    (payload) => {
      const id = payload?.paymentId || payload?._id || payload?.id;
      if (id) {
        setFlashIds((prev) => new Set(prev).add(String(id)));
        setTimeout(() => {
          setFlashIds((prev) => {
            const next = new Set(prev);
            next.delete(String(id));
            return next;
          });
        }, 2400);
      }
      loadQueue();
    },
    [loadQueue]
  );

  const openDecisionModal = (payment, action) => {
    setDecisionModal({ open: true, payment, action, notes: "" });
  };

  const closeDecisionModal = () => {
    if (isVerifying) return;
    setDecisionModal({ open: false, payment: null, action: null, notes: "" });
  };

  const confirmDecision = async () => {
    if (!decisionModal.payment || !decisionModal.action) return;

    const notes = decisionModal.notes.trim();
    const action =
      decisionModal.action === "verify" ? "approve" : "reject";

    try {
      await dispatch(
        verifyManualPayment({
          paymentId: decisionModal.payment._id,
          action,
          adminNotes: notes || undefined,
          rejectionReason:
            decisionModal.action === "reject"
              ? notes || undefined
              : undefined,
        })
      ).unwrap();

      toast({
        title:
          decisionModal.action === "verify"
            ? "Payment verified"
            : "Payment rejected",
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

  // Reset selection when filter or page changes — selected IDs may not even be visible anymore.
  useEffect(() => {
    setSelectedIds(new Set());
  }, [statusFilter, page]);

  const toggleSelect = (id) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!pendingPayments) return;
    const visibleIds = pendingPayments.map((p) => String(p._id));
    setSelectedIds((current) => {
      const allSelected = visibleIds.every((id) => current.has(id));
      if (allSelected) return new Set();
      return new Set(visibleIds);
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  // Sequential queue — backend rate-limits cumulative writes, so chain awaits.
  // Counts successes/failures and surfaces a single summary toast at the end.
  const runBulk = async (action) => {
    if (selectedIds.size === 0 || !pendingPayments) return;
    if (action === "reject") {
      const ok = window.confirm(
        `Reject ${selectedIds.size} selected payment${selectedIds.size === 1 ? "" : "s"}? This notifies each customer.`
      );
      if (!ok) return;
    }

    const ids = Array.from(selectedIds);
    setBulkProcessing(action);
    setBulkProgress({ done: 0, total: ids.length, failed: 0 });

    let done = 0;
    let failed = 0;
    for (const id of ids) {
      try {
        await dispatch(
          verifyManualPayment({
            paymentId: id,
            action: action === "verify" ? "approve" : "reject",
            adminNotes: action === "verify" ? "Bulk verified" : undefined,
            rejectionReason: action === "reject" ? "Bulk rejected" : undefined,
          })
        ).unwrap();
      } catch {
        failed += 1;
      }
      done += 1;
      setBulkProgress({ done, total: ids.length, failed });
    }

    setBulkProcessing(null);
    clearSelection();

    toast({
      title:
        failed === 0
          ? `${ids.length} payment${ids.length === 1 ? "" : "s"} ${action === "verify" ? "verified" : "rejected"}`
          : `${ids.length - failed}/${ids.length} ${action === "verify" ? "verified" : "rejected"}`,
      description: failed > 0 ? `${failed} failed — check the queue.` : undefined,
      variant: failed === 0 ? "success" : "destructive",
    });

    await loadQueue();
  };

  const currentStatusLabel = (status) =>
    statusMeta[status]?.label || status.replace(/_/g, " ");

  const currentStatusClass = (status) =>
    statusMeta[status]?.className ||
    "border-ink/10 bg-ink/5 text-gray-300";

  const visibleIds = (pendingPayments || []).map((p) => String(p._id));
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someVisibleSelected =
    visibleIds.some((id) => selectedIds.has(id)) && !allVisibleSelected;

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-page px-6 py-8 text-ink lg:px-8"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="rounded-[2rem] border border-gold-ink2/15 bg-[linear-gradient(180deg,rgba(212,175,55,0.14),rgba(255,255,255,0.02)_50%,rgba(255,255,255,0.04)_100%)] p-8 shadow-[0_30px_120px_rgba(0,0,0,0.4)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.35em] text-gold-ink2">Payments</p>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-ink sm:text-5xl">
                Review bank transfers and card payments in one queue.
              </h1>
              <p className="mt-4 text-sm leading-7 text-gray-400">
                Switch tabs to filter by method. Card payments are running on the demo gateway until PayHere is live.
              </p>
            </div>

            <button
              type="button"
              onClick={loadQueue}
              className="inline-flex items-center justify-center gap-3 self-start rounded-full border border-gold-ink2/25 bg-black/70 px-5 py-3 text-sm font-semibold text-ink transition hover:border-gold-ink2"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh queue
            </button>
          </div>
        </section>

        {/* Payment-type tabs — All / Manual / Card */}
        <section className="flex flex-wrap gap-2 rounded-full border border-ink/10 bg-page p-1.5">
          {[
            { value: "all", label: "All" },
            { value: "manual_bank_transfer", label: "Manual" },
            { value: "card", label: "Card" },
          ].map((tab) => {
            const active = paymentTypeFilter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setPaymentTypeFilter(tab.value)}
                className={`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-[0.22em] transition ${
                  active
                    ? "bg-gold-deep text-black"
                    : "text-gray-300 hover:bg-ink/5 hover:text-ink"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </section>

        {/* Method summary tiles (Fix #2) */}
        {methodSummary?.byMethod?.length > 0 && (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-gold-ink2/30 bg-page p-5">
              <p className="text-[10px] uppercase tracking-[0.28em] text-gold-ink2">Total</p>
              <p className="mt-2 text-3xl font-bold text-ink">
                {methodSummary.totals?.count || 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                LKR {formatCurrency(methodSummary.totals?.totalAmount || 0)}
              </p>
            </div>
            {methodSummary.byMethod.map((row) => (
              <div
                key={row.method}
                className="rounded-2xl border border-ink/10 bg-page p-5"
              >
                <p className="text-[10px] uppercase tracking-[0.28em] text-gray-400">
                  {PAYMENT_METHOD_LABELS[row.method] || row.method}
                </p>
                <p className="mt-2 text-3xl font-bold text-ink">{row.count}</p>
                <p className="text-xs text-gray-400 mt-1">
                  LKR {formatCurrency(row.totalAmount || 0)}
                </p>
              </div>
            ))}
          </section>
        )}

        <section className="grid gap-4 rounded-[1.75rem] border border-ink/10 bg-page p-6 md:grid-cols-2 xl:grid-cols-[1fr_0.75fr]">
          <div className="space-y-3">
            <label className="space-y-2 text-sm text-gray-300 block">
              Status filter
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="admin-select w-full"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={guestOnly}
                onChange={(e) => setGuestOnly(e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded border-ink/30 bg-black/60 accent-gold-deep"
              />
              Guest payments only
            </label>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-black/40 p-4 text-sm text-gray-400">
            <div className="flex items-center gap-2 text-gold-ink2">
              <Landmark className="h-4 w-4" />
              Queue summary
            </div>
            <p className="mt-2 text-ink">
              {pagination?.totalCount || 0} records in this view.
            </p>
          </div>
        </section>

        {selectedIds.size > 0 ? (
          <motion.section
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky top-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-gold-ink2/30 bg-page px-5 py-4 shadow-[0_18px_60px_rgba(0,0,0,0.45)]"
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-gold-ink2">
                {selectedIds.size} selected
              </span>
              {bulkProcessing ? (
                <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-gray-300">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {bulkProgress.done}/{bulkProgress.total}
                  {bulkProgress.failed > 0 ? ` · ${bulkProgress.failed} failed` : ""}
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => runBulk("verify")}
                disabled={!!bulkProcessing}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-200 transition hover:border-emerald-500/50 hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Bulk verify
              </button>
              <button
                type="button"
                onClick={() => runBulk("reject")}
                disabled={!!bulkProcessing}
                className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/15 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-rose-200 transition hover:border-rose-500/50 hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="h-3.5 w-3.5" /> Bulk reject
              </button>
              <button
                type="button"
                onClick={clearSelection}
                disabled={!!bulkProcessing}
                className="inline-flex items-center gap-2 rounded-full border border-ink/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-gray-300 transition hover:border-ink/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            </div>
          </motion.section>
        ) : null}

        {isAdminLoading ? (
          <div className="flex items-center justify-center rounded-[2rem] border border-ink/10 bg-page py-16 text-gray-400">
            <Loader2 className="mr-3 h-5 w-5 animate-spin text-gold-ink2" /> Loading pending payments...
          </div>
        ) : !pendingPayments || pendingPayments.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[2rem] border border-ink/10 bg-page p-10 text-center text-sm text-gray-400">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-gold-ink2/20 bg-gold-deep/10 text-gold-ink2">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold text-ink">No pending payments</h2>
            <p className="mt-2 max-w-md leading-6 text-gray-400">
              There are no payments waiting for admin verification in the selected filter.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[1.75rem] border border-ink/10 bg-page shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-ink/10 text-left text-sm">
                <thead className="bg-black/40 text-[10px] uppercase tracking-[0.24em] text-gray-400">
                  <tr>
                    <th className="w-10 px-4 py-4">
                      <input
                        type="checkbox"
                        aria-label="Select all visible payments"
                        checked={allVisibleSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someVisibleSelected;
                        }}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 cursor-pointer rounded border-ink/30 bg-black/60 accent-gold-deep"
                      />
                    </th>
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

                <tbody className="divide-y divide-ink/5">
                  {pendingPayments.map((payment) => {
                    const status = payment.status || "proof_submitted";
                    const id = String(payment._id);
                    const isSelected = selectedIds.has(id);

                    return (
                      <tr
                        key={payment._id || payment.referenceNumber}
                        className={`align-top transition ${
                          isSelected ? "bg-gold-deep/[0.05]" : "hover:bg-ink/[0.02]"
                        }`}
                      >
                        <td className="px-4 py-5">
                          <input
                            type="checkbox"
                            aria-label={`Select ${payment.referenceNumber || "payment"}`}
                            checked={isSelected}
                            onChange={() => toggleSelect(id)}
                            className="h-4 w-4 cursor-pointer rounded border-ink/30 bg-black/60 accent-gold-deep"
                          />
                        </td>
                        <td className="px-6 py-5 font-mono text-xs tracking-[0.2em] text-gold-ink2">
                          {payment.referenceNumber || "—"}
                        </td>
                        <td className="px-6 py-5 text-ink">{resolveCustomerName(payment)}</td>
                        <td className="px-6 py-5 break-all text-gray-300">{resolveOrderId(payment)}</td>
                        <td className="px-6 py-5 text-gray-300">LKR {formatCurrency(payment.amount)}</td>
                        <td className="px-6 py-5 text-gray-300">
                          <div className="flex flex-wrap items-center gap-2">
                            <span>
                              {payment.paymentType === "card"
                                ? "Card"
                                : PAYMENT_METHOD_LABELS[resolvePaymentMethod(payment)] ||
                                  resolvePaymentMethod(payment)}
                            </span>
                            {payment.paymentType === "card" && payment.cardDetails?.simulated ? (
                              <span className="rounded-full border border-gold-ink2/30 bg-gold-deep/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.22em] text-gold-ink2">
                                Sample
                              </span>
                            ) : null}
                          </div>
                        </td>
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
                            <button
                              type="button"
                              onClick={() => openDecisionModal(payment, "verify")}
                              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-200 transition hover:border-emerald-500/40 hover:bg-emerald-500/20"
                            >
                              Verify <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openDecisionModal(payment, "reject")}
                              className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-rose-200 transition hover:border-rose-500/40 hover:bg-rose-500/20"
                            >
                              Reject <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between rounded-[1.5rem] border border-ink/10 bg-page px-5 py-4 text-sm text-gray-400">
          <span>
            Page {pagination?.page || page} of {pagination?.totalPages || 0}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
              className="rounded-full border border-ink/10 px-4 py-2 font-semibold text-ink transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= (pagination?.totalPages || 1)}
              onClick={() => setPage((currentPage) => currentPage + 1)}
              className="rounded-full border border-ink/10 px-4 py-2 font-semibold text-ink transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {decisionModal.open && decisionModal.payment ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[1.75rem] border border-ink/10 bg-page p-6 shadow-[0_30px_120px_rgba(0,0,0,0.6)]">
            <p className="text-xs uppercase tracking-[0.35em] text-gold-ink2">
              {decisionModal.action === "verify" ? "Verify payment" : "Reject payment"}
            </p>
            <h2 className="mt-3 text-2xl font-black text-ink">
              {decisionModal.payment.referenceNumber || "Manual payment"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              Add optional admin notes before confirming this action.
            </p>

            <div className="mt-5 rounded-2xl border border-ink/10 bg-black/35 p-4 text-sm text-gray-300">
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
                className="mt-2 min-h-[120px] w-full rounded-2xl border border-ink/10 bg-black/70 px-4 py-3 text-sm text-ink outline-none focus:border-gold-ink2"
              />
            </label>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDecisionModal}
                disabled={isVerifying}
                className="rounded-full border border-ink/10 px-5 py-3 text-sm font-bold uppercase tracking-[0.2em] text-ink transition disabled:cursor-not-allowed disabled:opacity-50"
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