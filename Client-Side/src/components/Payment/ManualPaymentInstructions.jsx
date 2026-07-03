import React from "react";
import { motion } from "framer-motion";
import { Clock3, ShieldAlert, Check } from "lucide-react";

const MOTION_EASE = [0.16, 1, 0.3, 1];

const STEPS = [
  "Please complete your bank transfer for the exact payment amount.",
  "Use your Order Number as the payment reference.",
  "After completing the payment, upload your payment receipt below.",
  "A payment verification link has also been sent to your registered email.",
  "Your order will be processed once payment verification is approved.",
];

const PaymentInstructionSteps = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: MOTION_EASE, delay: 0.2 }}
      className="rounded-[24px] border border-ink/10 bg-page p-6 sm:p-8"
      aria-label="Payment instructions"
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-gold-ink">
        <Clock3 className="h-5 w-5" />
        How to complete your payment
      </div>
      
      <div className="mt-6 space-y-4">
        {STEPS.map((step, index) => (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.08 }}
            className="flex items-center gap-4 rounded-2xl border border-ink/5 bg-ink/[0.02] px-5 py-4 transition-colors hover:border-gold-ink/20 hover:bg-ink/[0.04]"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold-ink/25 bg-gold/10 text-xs font-bold text-gold-ink">
              {index + 1}
            </div>
            <p className="se-body text-sm leading-6 text-cream">{step}</p>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
        <p className="se-body text-xs leading-5 text-amber-100/80">
          <strong className="font-semibold text-amber-300">Pay within 24 hours</strong> to confirm your order. If the transfer window expires, your items will be released back to the atelier.
        </p>
      </div>
    </motion.section>
  );
};

export default PaymentInstructionSteps;
