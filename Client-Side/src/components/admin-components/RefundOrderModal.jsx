import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import {
  modalBackdropVariants,
  modalCardVariants,
} from "@/components/admin-components/_shared/animations";
import {
  PrimaryButton,
  SecondaryButton,
} from "@/components/admin-components/_shared/Buttons";

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

  return (
    <AnimatePresence>
      {isOpen && order ? (
        <motion.div
          key="refund-backdrop"
          variants={modalBackdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4"
          onClick={() => (submitting ? null : onClose?.())}
        >
          <motion.div
            key="refund-card"
            variants={modalCardVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-lg rounded-[20px] border border-[#4d4635]/60 bg-[#0a0a0a] p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-[#ffb4ab]">
                  Issue refund
                </p>
                <h2 className="mt-2 text-xl font-bold text-[#e5e2e1]">
                  Refund order {order.referenceNumber || String(order._id).slice(-8)}
                </h2>
                <p className="mt-1 text-xs text-[#99907c]">
                  Order total LKR {formatCurrency(order.totalAmount)} · status{" "}
                  {String(order.status).replace(/_/g, " ")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => (submitting ? null : onClose?.())}
                className="text-[#99907c] hover:text-[#e5e2e1]"
                aria-label="Close refund dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <label className="block">
                <span className="block text-[10px] uppercase tracking-[0.22em] text-[#99907c]">
                  Refund amount (LKR)
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={order.totalAmount}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-2 w-full rounded-md border border-[#4d4635] bg-[#131313] px-3 py-2 text-sm text-[#e5e2e1] focus:border-[#f2ca50] focus:outline-none"
                  required
                />
                <span className="mt-1 block text-[10px] text-[#574500]">
                  Maximum LKR {formatCurrency(order.totalAmount)}. Edit for a
                  partial refund.
                </span>
              </label>

              <label className="block">
                <span className="block text-[10px] uppercase tracking-[0.22em] text-[#99907c]">
                  Reason
                </span>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-2 w-full rounded-md border border-[#4d4635] bg-[#131313] px-3 py-2 text-sm text-[#e5e2e1] focus:border-[#f2ca50] focus:outline-none"
                >
                  {REFUND_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="block text-[10px] uppercase tracking-[0.22em] text-[#99907c]">
                  Internal note (optional)
                </span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder="Context for the customer email and activity log…"
                  className="mt-2 w-full resize-none rounded-md border border-[#4d4635] bg-[#131313] px-3 py-2 text-sm text-[#e5e2e1] focus:border-[#f2ca50] focus:outline-none"
                />
              </label>

              {error ? (
                <p className="rounded-md border border-[#ffb4ab]/40 bg-[#ffb4ab]/10 px-3 py-2 text-xs text-[#ffb4ab]">
                  {error}
                </p>
              ) : null}

              <div className="flex items-center justify-end gap-3 pt-2">
                <SecondaryButton
                  type="button"
                  onClick={() => (submitting ? null : onClose?.())}
                  disabled={submitting}
                >
                  Cancel
                </SecondaryButton>
                <PrimaryButton
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Processing…
                    </>
                  ) : (
                    "Confirm refund"
                  )}
                </PrimaryButton>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default RefundOrderModal;
