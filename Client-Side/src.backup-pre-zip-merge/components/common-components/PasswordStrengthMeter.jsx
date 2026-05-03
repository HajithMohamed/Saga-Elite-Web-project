import React, { useMemo } from "react";
import { getPasswordStrength } from "@/lib/password-strength";

/**
 * Reusable password-strength meter.
 * Renders a label + animated progress bar beneath a password field.
 *
 * @param {{ password: string }} props
 */
const PasswordStrengthMeter = ({ password }) => {
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  if (!password) return null;

  return (
    <div className="space-y-1.5 mt-1">
      <div className="flex justify-between text-[10px] uppercase tracking-widest">
        <span className="text-gray-500">Password Strength</span>
        <span
          className={`font-bold ${
            strength.label === "Strong"
              ? "text-green-400"
              : strength.label === "Good"
              ? "text-blue-400"
              : strength.label === "Fair"
              ? "text-yellow-400"
              : "text-red-400"
          }`}
        >
          {strength.label}
        </span>
      </div>
      <div className="h-1 w-full rounded-full bg-gray-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
          style={{ width: `${strength.percent}%` }}
        />
      </div>
    </div>
  );
};

export default PasswordStrengthMeter;
