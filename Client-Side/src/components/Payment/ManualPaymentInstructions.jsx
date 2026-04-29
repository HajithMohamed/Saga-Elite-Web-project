import React from "react";
import { Clock3, Landmark, ShieldAlert, MessageSquareText } from "lucide-react";

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const DetailRow = ({ label, value, isMono = false }) => (
  <div className="grid grid-cols-[120px_1fr] gap-3 border-b border-white/5 py-3 last:border-b-0">
    <span className="text-[11px] uppercase tracking-[0.24em] text-gray-500">{label}</span>
    <span className={`text-sm ${isMono ? "font-mono tracking-[0.18em] text-[#D4AF37]" : "text-white"}`}>
      {value || "—"}
    </span>
  </div>
);

const ManualPaymentInstructions = ({ bankDetails = {}, referenceNumber, amount, expiresAt, status }) => {
  const steps = [
    "Transfer the exact total to the account below.",
    "Include the reference number in your bank transfer note.",
    "Upload the payment proof image or PDF once the transfer is complete.",
  ];

  return (
    <section className="rounded-[30px] border border-[#D4AF37]/15 bg-[linear-gradient(180deg,rgba(212,175,55,0.08),rgba(255,255,255,0.02)_45%,rgba(255,255,255,0.03)_100%)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-8">
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
            Saga Elite will verify the transfer manually after you upload proof. Keep the reference exact so the payment can be matched quickly.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/40 px-4 py-3 text-left sm:min-w-[220px]">
          <p className="text-[10px] uppercase tracking-[0.25em] text-gray-500">Payment Status</p>
          <p className="mt-2 text-sm font-semibold text-white">{status || "pending_payment"}</p>
          <p className="mt-1 text-xs text-gray-500">Expires {formatDateTime(expiresAt)}</p>
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
              <div key={step} className="flex gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 text-xs font-bold text-[#D4AF37]">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <p className="text-sm leading-6 text-gray-300">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-black/35 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#D4AF37]">
            <ShieldAlert className="h-4 w-4" />
            Transfer details
          </div>
          <div className="mt-4 rounded-2xl border border-white/5 bg-black/40 p-4">
            <DetailRow label="Amount" value={amount ? `LKR ${Number(amount).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"} />
            <DetailRow label="Reference" value={referenceNumber} isMono />
            <DetailRow label="Bank" value={bankDetails.bankName} />
            <DetailRow label="Account" value={bankDetails.accountName} />
            <DetailRow label="Number" value={bankDetails.accountNumber} isMono />
            <DetailRow label="Branch" value={bankDetails.branch} />
            <DetailRow label="SWIFT" value={bankDetails.swiftCode} isMono />
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#D4AF37]/15 bg-[#D4AF37]/5 p-4">
            <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" />
            <p className="text-sm leading-6 text-gray-300">
              <span className="font-semibold text-white">Transfer note:</span> {bankDetails.transferNote || "Use the reference exactly as shown."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ManualPaymentInstructions;