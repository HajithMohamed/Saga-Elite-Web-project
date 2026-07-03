import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Landmark,
  Copy,
  Check,
  Building2,
  User,
  Hash,
  Globe,
  GitBranch,
  CreditCard,
  Banknote,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const MOTION_EASE = [0.16, 1, 0.3, 1];

const CopyableRow = ({ icon: Icon, label, value, mono = false }) => {
  const [copied, setCopied] = useState(false);

  if (!value) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      toast({
        title: "Copied",
        description: `${label} copied to clipboard.`,
        variant: "success",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="group flex items-center justify-between gap-3 border-b border-white/5 py-3.5 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/5 bg-white/[0.02]">
          <Icon className="h-3.5 w-3.5 text-[#99907c]" />
        </div>
        <div className="min-w-0">
          <p className="se-label text-[8px] tracking-[0.25em] text-[#574500]">
            {label}
          </p>
          <p
            className={`mt-0.5 truncate text-sm ${
              mono
                ? "font-mono tracking-[0.12em] text-[#F2CA50]"
                : "text-[#e5e2e1]"
            }`}
          >
            {value}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleCopy}
        className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] text-[#99907c] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#F2CA50]/30 hover:text-[#F2CA50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2CA50]"
        aria-label={`Copy ${label}`}
      >
        {copied ? (
          <Check className="h-4 w-4 text-[#34C759]" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
    </div>
  );
};

const BankDetailsCard = ({
  bankDetails = {},
  referenceNumber,
  amount,
  currency = "LKR",
}) => {
  const formattedAmount = amount
    ? `${currency} ${Number(amount).toLocaleString("en-LK", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : null;

  const rows = [
    { icon: Landmark, label: "Bank Name", value: bankDetails.bankName },
    { icon: User, label: "Account Name", value: bankDetails.accountName },
    {
      icon: Hash,
      label: "Account Number",
      value: bankDetails.accountNumber,
      mono: true,
    },
    { icon: Building2, label: "Branch Name", value: bankDetails.branch },
    {
      icon: GitBranch,
      label: "Branch Code",
      value: bankDetails.branchCode,
      mono: true,
    },
    {
      icon: Globe,
      label: "SWIFT Code",
      value: bankDetails.swiftCode,
      mono: true,
    },
    {
      icon: CreditCard,
      label: "Payment Reference",
      value: referenceNumber,
      mono: true,
    },
    {
      icon: Banknote,
      label: "Amount to Transfer",
      value: formattedAmount,
      mono: true,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: MOTION_EASE, delay: 0.2 }}
      className="w-full overflow-hidden rounded-[24px] border border-[#F2CA50]/15 bg-[#0d0d0d] shadow-[0_24px_80px_rgba(0,0,0,0.35)] lg:max-w-[420px]"
      aria-label="Bank transfer details"
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/5 px-6 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#F2CA50]/20 bg-[#F2CA50]/10">
          <Landmark className="h-5 w-5 text-[#F2CA50]" />
        </div>
        <div>
          <h3 className="se-serif text-lg text-[#e5e2e1]">Bank Details</h3>
          <p className="se-label text-[8px] tracking-[0.25em] text-[#574500]">
            Transfer to this account
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="px-6 py-2">
        {rows.map(
          (row) =>
            row.value && (
              <CopyableRow
                key={row.label}
                icon={row.icon}
                label={row.label}
                value={row.value}
                mono={row.mono}
              />
            )
        )}
      </div>

      {/* Note */}
      <div className="border-t border-white/5 px-6 py-4">
        <p className="se-body text-xs leading-5 text-[#99907c]">
          <span className="font-semibold text-[#d0c5af]">Important:</span>{" "}
          Transfer the exact amount shown above and include the Payment Reference
          in your transfer description/memo.
        </p>
      </div>
    </motion.div>
  );
};

export default BankDetailsCard;
