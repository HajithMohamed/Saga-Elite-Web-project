import React, { useState } from "react";
import { Copy, Clock3, CheckCircle2, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const PaymentReference = ({ referenceNumber, expiresAt, onCopy }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!referenceNumber) return;

    try {
      await navigator.clipboard.writeText(referenceNumber);
      setCopied(true);
      toast({
        title: "Copied",
        description: "Payment reference copied to clipboard.",
        variant: "success",
      });
      setTimeout(() => setCopied(false), 2000);
      onCopy?.();
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
      onCopy?.(error);
    }
  };

  return (
    <div className="rounded-[24px] border border-white/10 bg-[#0d0d0d] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="se-label text-[10px] tracking-[0.28em] text-gray-500">Payment Reference</p>
          <div className="mt-3 flex items-center gap-3">
            <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-3 font-mono text-lg tracking-[0.22em] text-[#D4AF37]">
              {referenceNumber || "Generating..."}
            </div>
            {referenceNumber ? (
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex h-[44px] items-center gap-2 rounded-[16px] border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-[#99907c] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
              >
                {copied ? <Check className="h-4 w-4 text-[#34C759]" /> : <Copy className="h-4 w-4" />}
                Copy
              </button>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-right">
          <div className="flex items-center justify-end gap-2 text-[10px] uppercase tracking-[0.25em] text-gray-500">
            <Clock3 className="h-3.5 w-3.5" />
            Expires
          </div>
          <p className="mt-1 text-xs text-gray-300">
            {expiresAt ? new Date(expiresAt).toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" }) : "—"}
          </p>
        </div>
      </div>

      {referenceNumber ? (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Reference ready
        </div>
      ) : null}
    </div>
  );
};

export default PaymentReference;