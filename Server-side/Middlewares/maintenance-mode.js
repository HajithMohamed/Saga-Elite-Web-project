const SiteConfig = require("../Models/SiteConfig");

const CACHE_TTL_MS = 30 * 1000; // 30s

const BYPASS_PREFIXES = [
  "/health",
  "/api/v1/auth",
  "/api/v1/admin",
  "/api/v1/super-admin",
  "/api/v1/site-config",
  "/api/webhooks",
];

let cache = {
  fetchedAt: 0,
  value: { enabled: false, message: "", eta: null },
};

const refreshCache = async () => {
  try {
    const doc = await SiteConfig.findOne({ key: "maintenance" }).lean();
    cache = {
      fetchedAt: Date.now(),
      value: doc?.value || { enabled: false, message: "", eta: null },
    };
  } catch {
    // If the lookup fails, leave cache as-is — never let maintenance mode
    // accidentally lock the site because of a transient DB blip.
    cache.fetchedAt = Date.now();
  }
};

const isBypassed = (path) =>
  BYPASS_PREFIXES.some((prefix) => path.startsWith(prefix));

const maintenanceMode = async (req, res, next) => {
  if (req.method === "OPTIONS") return next();
  if (isBypassed(req.path)) return next();

  if (Date.now() - cache.fetchedAt > CACHE_TTL_MS) {
    await refreshCache();
  }

  if (cache.value?.enabled) {
    return res.status(503).json({
      success: false,
      maintenance: true,
      message:
        cache.value.message ||
        "Saga Elite is offline for a brief moment. We'll be right back.",
      eta: cache.value.eta || null,
    });
  }

  return next();
};

// Allow callers (e.g. the SeoSettings save handler) to invalidate the cache
// immediately when they flip the flag.
maintenanceMode.invalidate = () => {
  cache.fetchedAt = 0;
};

module.exports = maintenanceMode;
