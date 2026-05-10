import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X, AlertTriangle } from "lucide-react";
import {
  modalBackdropVariants,
  modalCardVariants,
} from "@/components/admin-components/_shared/animations";
import {
  FormField,
  LuxuryInput,
  LuxurySelect,
  LuxuryTextarea,
  StatusPill,
} from "@/components/admin-components/_form";

const REFUND_REASONS = [
  { value: "wrong_item", label: "Wrong item" },
  { value: "damaged", label: "Damaged on arrival" },
  { value: "customer_request", label: "Customer request" },
  { value: "other", label: "Other" },
];

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const RefundOrderModal = ({ order, isOpen, submitting, onClose, onSubmit }) => {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("customer_request");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && order) {
      setAmount(String(order.totalAmount ?? ""));
      setReason("customer_request");
      setNote("");
      setError("");
    }
  }, [isOpen, order]);

  // Lock body scroll while modal is open.
  useEffect(() => {
    if (!isOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Refund amount must be a positive number.");
      return;
    }
    if (numericAmount > Number(order?.totalAmount || 0)) {
      setError(
        `Amount cannot exceed order total of LKR ${formatCurrency(order?.totalAmount)}.`
      );
      return;
    }
    onSubmit?.({ amount: numericAmount, reason, note });
  };

  const isPartial =
    Number(amount) > 0 && Number(amount) < Number(order?.totalAmount || 0);

  return (
    <AnimatePresence>
      {isOpen && order ? (
        <motion.div
          key="refund-backdrop"
          variants={modalBackdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
          onClick={() => (submitting ? null : onClose?.())}
        >
          <motion.div
            key="refund-card"
            variants={modalCardVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-white/[0.06] bg-[#0F0F0F] shadow-[0_30px_60px_rgba(0,0,0,0.6)]"
          >
            <header className="flex items-start justify-between gap-4 border-b border-white/[0.05] p-6">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#D4AF37]">
                  Refund · Order Action
                </p>
                <h2 className="mt-2 text-lg font-semibold text-white truncate">
                  Refund order {order.referenceNumber || String(order._id).slice(-8)}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusPill status={order.status} size="sm" />
                  <span className="text-[11px] text-white/50">
                    Total LKR {formatCurrency(order.totalAmount)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => (submitting ? null : onClose?.())}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/60 hover:border-white/20 hover:text-white transition"
                aria-label="Close refund dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <FormField
                label="Refund Amount (LKR)"
                required
                helper={
                  isPartial
                    ? "Partial refund — amount is less than the order total."
                    : `Maximum LKR ${formatCurrency(order.totalAmount)}. Edit for a partial refund.`
                }
              >
                <LuxuryInput
                  type="number"
                  step="0.01"
                  min="0"
                  max={order.totalAmount}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </FormField>

              <FormField
                label="Reason"
                required
                helper="Recorded in the activity log and customer email."
              >
                <LuxurySelect
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                >
                  {REFUND_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </LuxurySelect>
              </FormField>

              <FormField
                label="Internal Note"
                optional
                helper="Visible to admins; included in the customer email."
                hint={`${note.length} / 1000`}
              >
                <LuxuryTextarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder="Context for the customer email and activity log…"
                />
              </FormField>

              {error ? (
                <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/[0.06] px-3 py-2.5 text-xs text-rose-300">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  {error}
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => (submitting ? null : onClose?.())}
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/80 hover:border-white/20 hover:bg-white/[0.08] hover:text-white transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#D4AF37] px-5 py-2 text-xs font-semibold text-[#0A0A0A] shadow-[0_4px_14px_rgba(212,175,55,0.35)] hover:bg-[#E2BD45] hover:shadow-[0_6px_22px_rgba(212,175,55,0.5)] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Processing…
                    </>
                  ) : (
                    "Confirm refund"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default RefundOrderModal;
