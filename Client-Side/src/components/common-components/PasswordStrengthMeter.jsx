import React, { useMemo } from "react";
import { getPasswordStrength } from "@/lib/password-strength";

const STRENGTH_TONE = {
  Weak: "text-danger-ink",
  Fair: "text-gold-ink",
  Good: "text-[#a8c8ec]",
  Strong: "text-success-ink",
};

const STRENGTH_BAR = {
  Weak: "bg-danger-ink",
  Fair: "bg-gold",
  Good: "bg-[#a8c8ec]",
  Strong: "bg-success-ink",
};

const PasswordStrengthMeter = ({ password }) => {
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  if (!password) return null;

  const tone = STRENGTH_TONE[strength.label] || "text-muted";
  const bar = STRENGTH_BAR[strength.label] || "bg-line";

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="se-label text-[9px] tracking-[0.32em] text-goldshadow">
          Password strength
        </span>
        <span className={`se-label text-[10px] tracking-[0.28em] ${tone}`}>
          {strength.label}
        </span>
      </div>
      <div className="h-px w-full bg-line overflow-hidden relative">
        <div
          className={`h-full ${bar} transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]`}
          style={{ width: `${strength.percent}%` }}
        />
      </div>
    </div>
  );
};

export default PasswordStrengthMeter;
