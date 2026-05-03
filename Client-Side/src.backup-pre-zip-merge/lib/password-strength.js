/**
 * Shared password-strength utility used across auth pages and account settings.
 *
 * The regex matches the server-side Mongoose validator in User.js:
 *   min 8 chars, at least one uppercase, one lowercase, one digit, one special (@$!%*?&)
 */

export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const PASSWORD_ERROR_MSG =
  "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character (@$!%*?&).";

/**
 * Returns a strength descriptor object for the given password string.
 *
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
  if (/[@$!%*?&]/.test(pwd)) score++;

  if (score <= 2) return { label: "Weak", percent: 25, color: "bg-red-500" };
  if (score <= 3) return { label: "Fair", percent: 50, color: "bg-yellow-500" };
  if (score === 4) return { label: "Good", percent: 75, color: "bg-blue-400" };
  return { label: "Strong", percent: 100, color: "bg-green-500" };
};
