import React from "react";
import { motion } from "framer-motion";
import {
  Clock3,
  Copy,
  Landmark,
  MessageSquareText,
  ShieldAlert,
} from "lucide-react";

const formatDateTime = (value) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const toWhatsAppDigits = (raw) => {
  if (!raw) return "";
  return String(raw).replace(/\D/g, "");
};

const DetailRow = ({ label, value, isMono = false }) => (
  <div className="grid grid-cols-[120px_1fr] gap-3 border-b border-white/5 py-3 last:border-b-0">
    <span className="text-[11px] uppercase tracking-[0.24em] text-gray-500">
      {label}
    </span>
    <span
      className={`text-sm ${
        isMono ? "font-mono tracking-[0.18em] text-[#D4AF37]" : "text-white"
      }`}
    >
      {value || "-"}
    </span>
  </div>
);

const ManualPaymentInstructions = ({
  bankDetails = {},
  referenceNumber,
  amount,
  expiresAt,
  status,
  onCopyReference,
}) => {
  const hasReference = Boolean(referenceNumber);
  const steps = [
    "Transfer the exact total to the account below.",
    "Include the reference number in your bank transfer note / description.",
    "Send the proof after the transfer is complete (upload on this page or via WhatsApp).",
  ];

  const handleCopyReference = async () => {
    if (!referenceNumber) return;

    try {
      await navigator.clipboard.writeText(referenceNumber);
      onCopyReference?.();
    } catch (error) {
      onCopyReference?.(error);
    }
  };

  const waDigits = toWhatsAppDigits(
    bankDetails.supportWhatsapp || "+94770704274"
  );
  const waMessage = hasReference
    ? `Hi Saga Elite — I have made a bank transfer. My payment reference is: ${referenceNumber}. Please confirm.`
    : "Hi Saga Elite — I need help with my bank transfer reference.";
  const waHref =
    waDigits.length >= 8
      ? `https://wa.me/${waDigits}?text=${encodeURIComponent(waMessage)}`
      : null;

  return (
    <section className="rounded-[30px] border border-[#D4AF37]/15 bg-[linear-gradient(180deg,rgba(212,175,55,0.08),rgba(255,255,255,0.02)_45%,rgba(255,255,255,0.03)_100%)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-8 dark:text-white">
      {!hasReference ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex gap-3 rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
        >
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
          <p>
            <span className="font-semibold text-amber-200">
              Reference not loaded yet.
            </span>{" "}
            Wait a moment while we prepare your payment, or open this page from
            your order confirmation. If you placed an order, check{" "}
            <strong className="text-white">Orders</strong> and use the payment
            link again.
          </p>
        </motion.div>
      ) : null}

      <div className="mb-8 rounded-[26px] border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-6 shadow-[0_18px_60px_rgba(212,175,55,0.12)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#f4d57a]">
              Your payment reference
            </p>
            <p className="mt-3 break-all font-mono text-2xl font-bold tracking-[0.12em] text-white sm:text-3xl">
              {hasReference ? referenceNumber : "—"}
            </p>
            <p className="mt-3 text-sm leading-6 text-gray-200">
              Include this reference exactly in your bank transfer
              description/memo so we can match your payment.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopyReference}
            disabled={!hasReference}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-[#D4AF37]/35 bg-black/30 px-5 text-sm font-semibold text-white transition hover:border-[#D4AF37] hover:text-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Copy className="h-4 w-4" />
            Copy reference
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-[#D4AF37]">
            <Landmark className="h-3.5 w-3.5" />
            Bank transfer instructions
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Complete the transfer with your unique reference.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-400">
            Saga Elite will verify the transfer manually after you upload proof.
            Keep the reference exact so the payment can be matched quickly.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/40 px-4 py-3 text-left sm:min-w-[220px]">
          <p className="text-[10px] uppercase tracking-[0.25em] text-gray-500">
            Payment Status
          </p>
          <p className="mt-2 text-sm font-semibold text-white">
            {status || "pending_payment"}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Expires {formatDateTime(expiresAt)}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[24px] border border-white/10 bg-black/35 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#D4AF37]">
            <Clock3 className="h-4 w-4" />
            What happens next
          </div>
          <div className="mt-4 space-y-3">
            {steps.map((step, index) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
                className="flex gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 text-xs font-bold text-[#D4AF37]">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <p className="text-sm leading-6 text-gray-300">{step}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-black/35 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#D4AF37]">
            <ShieldAlert className="h-4 w-4" />
            Transfer details
          </div>
          <div className="mt-4 rounded-2xl border border-white/5 bg-black/40 p-4">
            <DetailRow
              label="Amount"
              value={
                amount
                  ? `LKR ${Number(amount).toLocaleString("en-LK", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : "-"
              }
            />
            <DetailRow label="Reference" value={referenceNumber} isMono />
            <DetailRow
              label="Bank"
              value={bankDetails.bankName || "Sampath Bank"}
            />
            <DetailRow label="Branch" value={bankDetails.branch || "Hatton"} />
            <DetailRow
              label="Account"
              value={bankDetails.accountName || "N.Gayathree"}
            />
            <DetailRow
              label="Number"
              value={bankDetails.accountNumber || "108052612262"}
              isMono
            />
            <DetailRow
              label="WhatsApp"
              value={bankDetails.supportWhatsapp || "+94 77 070 4274"}
              isMono
            />
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#D4AF37]/15 bg-[#D4AF37]/5 p-4">
            <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" />
            <p className="text-sm leading-6 text-gray-300">
              <span className="font-semibold text-white">Transfer note:</span>{" "}
              {bankDetails.transferNote ||
                "Use the reference exactly as shown."}
            </p>
          </div>

          {waHref ? (
            <motion.a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-600/20 py-3 text-sm font-bold text-emerald-100 transition hover:bg-emerald-600/30"
            >
              <MessageSquareText className="h-4 w-4" />
              Message on WhatsApp
            </motion.a>
          ) : null}

          <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100">
            <span className="font-semibold text-amber-200">
              Pay within 24 hours to confirm your order.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ManualPaymentInstructions;
