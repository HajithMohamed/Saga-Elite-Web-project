import React from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Loader2,
  Circle,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MOTION_EASE = [0.16, 1, 0.3, 1];

const EVENT_ICONS = {
  completed: { icon: CheckCircle2, color: "text-[#34C759]", bg: "bg-[#34C759]/15", ring: "ring-[#34C759]/30" },
  active: { icon: Loader2, color: "text-[#F2CA50]", bg: "bg-[#F2CA50]/15", ring: "ring-[#F2CA50]/30", spin: true },
  pending: { icon: Circle, color: "text-[#574500]", bg: "bg-white/[0.03]", ring: "ring-white/10" },
  rejected: { icon: XCircle, color: "text-[#FF453A]", bg: "bg-[#FF453A]/15", ring: "ring-[#FF453A]/30" },
  expired: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/15", ring: "ring-amber-500/30" },
};

const DEFAULT_EVENTS = [
  { key: "order_placed", label: "Order Placed", status: "completed" },
  { key: "awaiting_payment", label: "Awaiting Payment", status: "completed" },
  { key: "receipt_uploaded", label: "Receipt Uploaded", status: "active" },
  { key: "under_verification", label: "Under Verification", status: "pending" },
  { key: "approved", label: "Approved", status: "pending" },
];

const buildTimelineEvents = (paymentStatus, payment) => {
  const statusOrder = [
    "pending_payment",
    "proof_submitted",
    "pending_bank_confirmation",
    "verified",
  ];
  const currentIndex = statusOrder.indexOf(paymentStatus);

  const events = [
    {
      key: "order_placed",
      label: "Order Placed",
      status: currentIndex >= 0 ? "completed" : "pending",
      date: payment?.orderId?.orderDate || payment?.createdAt,
    },
    {
      key: "awaiting_payment",
      label: "Awaiting Payment",
      status: currentIndex >= 0 ? "completed" : "pending",
      date: payment?.createdAt,
    },
    {
      key: "receipt_uploaded",
      label: "Receipt Uploaded",
      status:
        currentIndex >= 1
          ? "completed"
          : currentIndex === 0
            ? "active"
            : "pending",
      date: payment?.proofSubmittedAt,
    },
    {
      key: "under_verification",
      label: "Under Verification",
      status:
        currentIndex >= 3
          ? "completed"
          : currentIndex >= 2
            ? "active"
            : "pending",
      date: payment?.verificationStartedAt,
      note: payment?.adminNotes,
    },
    {
      key: "approved",
      label: paymentStatus === "rejected" ? "Rejected" : "Approved",
      status:
        paymentStatus === "verified"
          ? "completed"
          : paymentStatus === "rejected"
            ? "rejected"
            : "pending",
      date: payment?.verifiedAt || payment?.rejectedAt,
      note: payment?.rejectionReason,
    },
  ];

  // Handle expired status
  if (paymentStatus === "expired") {
    return events.map((e) => ({
      ...e,
      status: e.key === "awaiting_payment" ? "expired" : e.status === "active" ? "expired" : e.status,
    }));
  }

  return events;
};

const formatEventDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const VerificationTimeline = ({
  paymentStatus = "pending_payment",
  payment = null,
}) => {
  const events = payment
    ? buildTimelineEvents(paymentStatus, payment)
    : DEFAULT_EVENTS;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: MOTION_EASE, delay: 0.3 }}
      className="rounded-[24px] border border-white/10 bg-[#0d0d0d] p-6 sm:p-8"
      aria-label="Verification timeline"
    >
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
          <FileText className="h-5 w-5 text-[#d0c5af]" />
        </div>
        <div>
          <h3 className="se-serif text-lg text-[#e5e2e1]">
            Verification Timeline
          </h3>
          <p className="se-label text-[8px] tracking-[0.25em] text-[#574500]">
            Track your payment progress
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative pl-5">
        {/* Vertical line */}
        <div className="absolute bottom-4 left-[11px] top-2 w-px bg-white/10" />

        <div className="space-y-1">
          {events.map((event, index) => {
            const config = EVENT_ICONS[event.status] || EVENT_ICONS.pending;
            const Icon = config.icon;
            const dateStr = formatEventDate(event.date);

            return (
              <motion.div
                key={event.key}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.5,
                  ease: MOTION_EASE,
                  delay: 0.35 + index * 0.08,
                }}
                className="relative flex gap-4 py-3"
              >
                {/* Icon */}
                <div
                  className={cn(
                    "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-2",
                    config.bg,
                    config.ring
                  )}
                >
                  <Icon
                    className={cn(
                      "h-3.5 w-3.5",
                      config.color,
                      config.spin && "animate-spin"
                    )}
                  />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      event.status === "completed"
                        ? "text-[#d0c5af]"
                        : event.status === "active"
                          ? "text-[#F2CA50]"
                          : event.status === "rejected"
                            ? "text-[#FF453A]"
                            : "text-[#574500]"
                    )}
                  >
                    {event.label}
                  </p>
                  {dateStr && (
                    <p className="mt-0.5 text-xs text-[#574500]">{dateStr}</p>
                  )}
                  {event.note && (
                    <p className="mt-1 rounded-lg bg-white/[0.02] px-3 py-2 text-xs leading-5 text-[#99907c]">
                      {event.note}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
};

export default VerificationTimeline;
