import React, { useMemo } from "react";
import { getPasswordStrength } from "@/lib/password-strength";

const STRENGTH_TONE = {
  Weak: "text-[#ffb4ab]",
  Fair: "text-[#f2ca50]",
  Good: "text-[#a8c8ec]",
  Strong: "text-[#a8d8b6]",
};

const STRENGTH_BAR = {
  Weak: "bg-[#ffb4ab]",
  Fair: "bg-[#f2ca50]",
  Good: "bg-[#a8c8ec]",
  Strong: "bg-[#a8d8b6]",
};

const PasswordStrengthMeter = ({ password }) => {
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  if (!password) return null;

  const tone = STRENGTH_TONE[strength.label] || "text-[#99907c]";
  const bar = STRENGTH_BAR[strength.label] || "bg-[#4d4635]";

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="se-label text-[9px] tracking-[0.32em] text-[#574500]">
          Password strength
        </span>
        <span className={`se-label text-[10px] tracking-[0.28em] ${tone}`}>
          {strength.label}
        </span>
      </div>
      <div className="h-px w-full bg-[#4d4635] overflow-hidden relative">
        <div
          className={`h-full ${bar} transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]`}
          style={{ width: `${strength.percent}%` }}
        />
      </div>
    </div>
  );
};

export default PasswordStrengthMeter;
