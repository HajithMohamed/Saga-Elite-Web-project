import React from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  ShoppingBag,
  Clock,
  Upload,
  Search,
  BadgeCheck,
  PackageCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "order_placed", label: "Order Placed", icon: ShoppingBag },
  { id: "pending_payment", label: "Payment Pending", icon: Clock },
  { id: "proof_submitted", label: "Receipt Uploaded", icon: Upload },
  { id: "pending_bank_confirmation", label: "Verification", icon: Search },
  { id: "verified", label: "Payment Approved", icon: BadgeCheck },
  { id: "dispatch", label: "Preparing Shipment", icon: PackageCheck },
];

const STATUS_MAP = {
  pending_payment: 1,
  proof_submitted: 2,
  pending_bank_confirmation: 3,
  verified: 4,
  dispatch: 5,
  rejected: 2, // show as back at upload step
  expired: 1,
};

const PaymentStepper = ({ currentStatus = "pending_payment" }) => {
  const currentIndex = STATUS_MAP[currentStatus] ?? 1;

  return (
    <nav aria-label="Payment progress" className="w-full">
      {/* Desktop Horizontal */}
      <div className="hidden md:block">
        <div className="relative flex items-start justify-between">
          {/* Background line */}
          <div className="absolute left-0 right-0 top-[18px] h-px bg-ink/10" />
          {/* Progress line */}
          <motion.div
            className="absolute left-0 top-[18px] h-px bg-gradient-to-r from-success via-gold to-gold"
            initial={{ width: "0%" }}
            animate={{
              width: `${Math.min((currentIndex / (STEPS.length - 1)) * 100, 100)}%`,
            }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          />

          {STEPS.map((step, index) => {
            const isComplete = index < currentIndex;
            const isActive = index === currentIndex;
            const Icon = step.icon;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  ease: [0.16, 1, 0.3, 1],
                  delay: index * 0.08,
                }}
                className="relative z-10 flex flex-col items-center"
                style={{ width: `${100 / STEPS.length}%` }}
              >
                {/* Step circle */}
                <div
                  className={cn(
                    "relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-500",
                    isComplete
                      ? "border-success bg-success/15"
                      : isActive
                        ? "border-gold-ink bg-gold/15 shadow-[0_0_20px_rgba(242,202,80,0.3)]"
                        : "border-ink/15 bg-card"
                  )}
                >
                  {isComplete ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : isActive ? (
                    <>
                      <Icon className="h-4 w-4 text-gold-ink" />
                      <span className="absolute inset-0 animate-ping rounded-full border border-gold-ink/30" />
                    </>
                  ) : (
                    <Icon className="h-4 w-4 text-goldshadow" />
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "se-label mt-3 text-center text-[8px] tracking-[0.2em] sm:text-[9px]",
                    isComplete
                      ? "text-success"
                      : isActive
                        ? "text-gold-ink"
                        : "text-goldshadow"
                  )}
                >
                  {step.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Mobile Vertical */}
      <div className="block md:hidden">
        <div className="relative pl-5">
          {/* Background line */}
          <div className="absolute bottom-4 left-[11px] top-2 w-px bg-ink/10" />
          {/* Progress line */}
          <motion.div
            className="absolute left-[11px] top-2 w-px bg-gradient-to-b from-success to-gold"
            initial={{ height: 0 }}
            animate={{
              height: `${Math.min((currentIndex / (STEPS.length - 1)) * 100, 100)}%`,
            }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          />

          <div className="space-y-5">
            {STEPS.map((step, index) => {
              const isComplete = index < currentIndex;
              const isActive = index === currentIndex;
              const Icon = step.icon;

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.5,
                    ease: [0.16, 1, 0.3, 1],
                    delay: index * 0.06,
                  }}
                  className="relative flex items-center gap-4"
                >
                  {/* Step dot */}
                  <div
                    className={cn(
                      "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-500",
                      isComplete
                        ? "bg-success shadow-[0_0_10px_rgba(52,199,89,0.4)]"
                        : isActive
                          ? "bg-gold shadow-[0_0_12px_rgba(242,202,80,0.5)]"
                          : "border border-ink/15 bg-card"
                    )}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="h-3 w-3 text-ink" />
                    ) : isActive ? (
                      <>
                        <Icon className="h-3 w-3 text-ongold" />
                        <span className="absolute inset-0 animate-ping rounded-full bg-gold/30" />
                      </>
                    ) : (
                      <Circle className="h-2.5 w-2.5 text-goldshadow" />
                    )}
                  </div>

                  {/* Label */}
                  <span
                    className={cn(
                      "se-label text-[10px] tracking-[0.2em]",
                      isComplete
                        ? "text-success"
                        : isActive
                          ? "text-gold-ink"
                          : "text-goldshadow"
                    )}
                  >
                    {step.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default PaymentStepper;
