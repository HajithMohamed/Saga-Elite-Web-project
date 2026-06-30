import React from "react";
import { motion } from "framer-motion";
import { Receipt, CheckCircle2, Clock, XCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const MOTION_EASE = [0.16, 1, 0.3, 1];

const STATUS_STYLES = {
  pending_payment: { color: "text-[#F2CA50]", bg: "bg-[#F2CA50]/10", border: "border-[#F2CA50]/30", icon: Clock, label: "Pending" },
  proof_submitted: { color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/30", icon: Clock, label: "Under Review" },
  pending_bank_confirmation: { color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/30", icon: Clock, label: "Bank Verification" },
  verified: { color: "text-[#34C759]", bg: "bg-[#34C759]/10", border: "border-[#34C759]/30", icon: CheckCircle2, label: "Approved" },
  rejected: { color: "text-[#FF453A]", bg: "bg-[#FF453A]/10", border: "border-[#FF453A]/30", icon: XCircle, label: "Rejected" },
  expired: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", icon: AlertTriangle, label: "Expired" },
};

const SummaryRow = ({ label, value, highlight = false }) => {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/5 py-3 last:border-0">
      <span className="se-label text-[9px] tracking-[0.22em] text-[#574500]">{label}</span>
      <span className={cn("text-sm", highlight ? "font-semibold text-[#F2CA50]" : "text-[#e5e2e1]")}>
        {value}
      </span>
    </div>
  );
};

const PaymentSummaryCard = ({
  orderNumber,
  orderDate,
  customerName,
  paymentAmount,
  currency = "LKR",
  paymentMethod = "Manual Bank Transfer",
  orderStatus,
  paymentStatus = "pending_payment",
}) => {
  const formattedAmount = paymentAmount
    ? `${currency} ${Number(paymentAmount).toLocaleString("en-LK", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : null;

  const formattedDate = orderDate
    ? new Date(orderDate).toLocaleDateString("en-LK", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  const statusConfig = STATUS_STYLES[paymentStatus] || STATUS_STYLES.pending_payment;
  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: MOTION_EASE, delay: 0.15 }}
      className="w-full overflow-hidden rounded-[24px] border border-white/10 bg-[#0d0d0d] shadow-[0_24px_80px_rgba(0,0,0,0.35)] lg:max-w-[420px]"
      aria-label="Payment summary"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-white/5 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
            <Receipt className="h-5 w-5 text-[#d0c5af]" />
          </div>
          <h3 className="se-serif text-lg text-[#e5e2e1]">Payment Summary</h3>
        </div>

        {/* Status badge */}
        <div
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1",
            statusConfig.bg,
            statusConfig.border
          )}
        >
          <StatusIcon className={cn("h-3 w-3", statusConfig.color)} />
          <span className={cn("se-label text-[8px] tracking-[0.2em]", statusConfig.color)}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="px-6 py-2">
        <SummaryRow label="Order Number" value={orderNumber} />
        <SummaryRow label="Order Date" value={formattedDate} />
        <SummaryRow label="Customer" value={customerName} />
        <SummaryRow label="Payment Amount" value={formattedAmount} highlight />
        <SummaryRow label="Currency" value={currency} />
        <SummaryRow label="Payment Method" value={paymentMethod} />
        <SummaryRow label="Order Status" value={orderStatus} />
      </div>
    </motion.div>
  );
};

export default PaymentSummaryCard;
