/**
 * Password validation — backed by `zod` (already in package.json).
 *
 * Public API:
 *   PASSWORD_RULES                 array of { test, message } predicates
 *   passwordSchema                 zod schema for a valid password
 *   validatePassword(pwd)          returns { valid, errors: string[] }
 *   firstPasswordError(pwd)        returns the first failure message or ""
 *   getPasswordStrength(pwd)       returns { label, percent, color }
 *
 * Back-compat exports:
 *   PASSWORD_REGEX                 same composite regex (kept so older
 *                                  consumers don't break)
 *   PASSWORD_ERROR_MSG             generic message string
 *
 * Rules — must satisfy ALL of:
 *   1. At least 8 characters
 *   2. At least one lowercase letter (a–z)
 *   3. At least one uppercase letter (A–Z)
 *   4. At least one digit (0–9)
 *   5. At least one symbol (any non-alphanumeric character)
 *
 * Any character may appear in the password — including dots, hyphens,
 * underscores, plus signs, commas, etc. Only Unicode whitespace anywhere
 * is rejected.
 */

import { z } from "zod";

export const PASSWORD_RULES = [
  {
    key: "length",
    test: (pwd) => typeof pwd === "string" && pwd.length >= 8,
    message: "Use at least 8 characters.",
  },
  {
    key: "lowercase",
    test: (pwd) => /[a-z]/.test(pwd),
    message: "Add a lowercase letter (a–z).",
  },
  {
    key: "uppercase",
    test: (pwd) => /[A-Z]/.test(pwd),
    message: "Add an uppercase letter (A–Z).",
  },
  {
    key: "digit",
    test: (pwd) => /\d/.test(pwd),
    message: "Add a number (0–9).",
  },
  {
    key: "symbol",
    test: (pwd) => /[^A-Za-z0-9]/.test(pwd),
    message: "Add a symbol (e.g. . , ! @ # $ % & * - _ +).",
  },
  {
    key: "no-spaces",
    test: (pwd) => !/\s/.test(pwd),
    message: "Remove any spaces.",
  },
];

export const passwordSchema = z
  .string()
  .superRefine((value, ctx) => {
    for (const rule of PASSWORD_RULES) {
      if (!rule.test(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: rule.message,
          path: [rule.key],
        });
      }
    }
  });

/**
 * Run zod validation, return a flat error list.
 * @param {string} pwd
 * @returns {{ valid: boolean, errors: string[] }}
 */
export const validatePassword = (pwd) => {
  const result = passwordSchema.safeParse(pwd);
  if (result.success) return { valid: true, errors: [] };
  const errors = result.error.issues.map((i) => i.message);
  return { valid: false, errors };
};

/**
 * Return only the first failure message, suitable for `<FieldError>`.
 * Returns "" when valid or empty.
 */
export const firstPasswordError = (pwd) => {
  if (!pwd) return "";
  const { errors } = validatePassword(pwd);
  return errors[0] || "";
};

/* ────────────────────────────────────────────────────────────────────────── */
/*  Back-compat: keep PASSWORD_REGEX + PASSWORD_ERROR_MSG so older imports    */
/*  continue to work. The regex matches the rules above.                      */
/* ────────────────────────────────────────────────────────────────────────── */

export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])(?!.*\s).{8,}$/;

export const PASSWORD_ERROR_MSG =
  "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a symbol.";

/* ────────────────────────────────────────────────────────────────────────── */
/*  Strength meter                                                            */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Returns a strength descriptor for the given password string.
 * @param {string} pwd
 * @returns {{ label: string, percent: number, color: string }}
 */
export const getPasswordStrength = (pwd) => {
  if (!pwd) return { label: "", percent: 0, color: "bg-gray-700" };

  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (pwd.length >= 12) score++;
  if (pwd.length >= 16) score++;

  if (score <= 2) return { label: "Weak", percent: 25, color: "bg-red-500" };
  if (score <= 3) return { label: "Fair", percent: 50, color: "bg-yellow-500" };
  if (score === 4) return { label: "Good", percent: 75, color: "bg-blue-400" };
  if (score === 5) return { label: "Strong", percent: 90, color: "bg-green-500" };
  return { label: "Excellent", percent: 100, color: "bg-green-500" };
};
