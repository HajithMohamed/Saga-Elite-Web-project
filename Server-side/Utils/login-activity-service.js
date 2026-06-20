const LoginActivity = require("../Models/LoginActivity");
const logger = require("./logger");

// Cheap UA → device label. We don't need full UA parsing; just enough to
// distinguish "Chrome on Mac" from "Safari on iPhone" in the admin viewer.
const sniffDevice = (ua) => {
  if (!ua) return null;
  const lower = String(ua).toLowerCase();
  let os = "Unknown";
  if (lower.includes("iphone")) os = "iPhone";
  else if (lower.includes("ipad")) os = "iPad";
  else if (lower.includes("android")) os = "Android";
  else if (lower.includes("mac os") || lower.includes("macintosh")) os = "Mac";
  else if (lower.includes("windows")) os = "Windows";
  else if (lower.includes("linux")) os = "Linux";

  let browser = "Browser";
  if (lower.includes("edg/")) browser = "Edge";
  else if (lower.includes("chrome/") && !lower.includes("edg/")) browser = "Chrome";
  else if (lower.includes("firefox/")) browser = "Firefox";
  else if (lower.includes("safari/") && !lower.includes("chrome/")) browser = "Safari";

  return `${browser} · ${os}`;
};

// Most reliable client IP available: Express's `req.ip` already respects the
// "trust proxy" setting; if that's off, fall back to the first X-Forwarded-For
// hop, then to socket.remoteAddress.
const resolveIp = (req) => {
  if (!req) return null;
  if (req.ip) return req.ip;
  const fwd = req.headers?.["x-forwarded-for"];
  if (fwd) return String(fwd).split(",")[0].trim();
  return req.socket?.remoteAddress || null;
};

// Fire-and-forget. Never block the auth response on log writes — failures
// are logged but never thrown upstream.
const recordLoginAttempt = ({
  req,
  userId = null,
  emailAttempted = null,
  success,
  failureReason = null,
  provider = "local",
}) => {
  const ua = req?.headers?.["user-agent"] || null;
  const payload = {
    userId,
    emailAttempted: emailAttempted ? String(emailAttempted).toLowerCase() : null,
    success: !!success,
    failureReason,
    provider,
    ip: resolveIp(req),
    userAgent: ua ? String(ua).slice(0, 500) : null,
    deviceHint: sniffDevice(ua),
  };

  // Detached promise — no await. Errors don't propagate.
  LoginActivity.create(payload).catch((err) => {
    logger?.warn?.(
      `[login-activity] failed to record: ${err?.message || err}`
    );
  });
};

module.exports = {
  recordLoginAttempt,
  sniffDevice,
};
