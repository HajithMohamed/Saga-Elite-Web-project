import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Calendar, Hash, Banknote } from "lucide-react";

const MOTION_EASE = [0.16, 1, 0.3, 1];

const InfoPill = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-ink/[0.03] px-4 py-3 backdrop-blur-sm">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gold-ink/20 bg-gold/10">
      <Icon className="h-4 w-4 text-gold-ink" />
    </div>
    <div className="min-w-0">
      <p className="se-label text-[9px] tracking-[0.25em] text-muted">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-ink-2">{value || "—"}</p>
    </div>
  </div>
);

const PaymentVerificationHero = ({
  orderNumber,
  paymentAmount,
  orderDate,
  currency = "LKR",
}) => {
  const formattedAmount = paymentAmount
    ? `${currency} ${Number(paymentAmount).toLocaleString("en-LK", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : "—";

  const formattedDate = orderDate
    ? new Date(orderDate).toLocaleDateString("en-LK", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

  return (
    <section
      className="relative overflow-hidden rounded-[24px] border border-gold-ink/10 bg-page"
      aria-label="Payment Verification"
    >
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,rgba(242,202,80,0.08)_0%,transparent_60%)]" />
      {/* Gold top line */}
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      <div className="relative z-10 flex min-h-[160px] flex-col justify-center px-6 py-8 sm:min-h-[180px] sm:px-10 lg:min-h-[220px] lg:px-14 lg:py-10">
        {/* Secure badge */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: MOTION_EASE }}
          className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-gold-ink/20 bg-gold/5 px-3 py-1.5"
        >
          <ShieldCheck className="h-3.5 w-3.5 text-gold-ink" />
          <span className="se-label text-[9px] tracking-[0.25em] text-gold-ink">
            Secure Payment Verification
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: MOTION_EASE, delay: 0.1 }}
          className="se-serif text-[28px] leading-tight text-ink-2 sm:text-[34px] lg:text-[40px]"
        >
          Manual Payment Verification
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: MOTION_EASE, delay: 0.15 }}
          className="se-body mt-2 max-w-xl text-sm leading-6 text-muted sm:text-base"
        >
          Complete your bank transfer and upload your payment receipt for verification.
        </motion.p>

        {/* Info pills */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: MOTION_EASE, delay: 0.25 }}
          className="mt-6 flex flex-wrap gap-3"
        >
          <InfoPill icon={Hash} label="Order Number" value={orderNumber} />
          <InfoPill icon={Banknote} label="Payment Amount" value={formattedAmount} />
          <InfoPill icon={Calendar} label="Order Date" value={formattedDate} />
        </motion.div>
      </div>
    </section>
  );
};

export default PaymentVerificationHero;
