const cors = require("cors");
const logger = require("../Utils/logger");

const defaultOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175"
];

// Normalise an origin so trivial formatting differences (a trailing slash, a
// stray uppercase letter) don't silently break the allow-list. The browser
// always sends a bare, lowercase origin with no path or trailing slash, but a
// hand-typed FRONTEND_URL env value often has one — that mismatch is the most
// common cause of "No 'Access-Control-Allow-Origin' header" in production.
const normalizeOrigin = (value) =>
    String(value || "")
        .trim()
        .replace(/\/+$/, "")
        .toLowerCase();

const configuredOrigins = [
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URLS,
    process.env.CLIENT_URL
]
    .filter(Boolean)
    .flatMap((value) => value.split(","))
    .map(normalizeOrigin)
    .filter(Boolean);

const allowedOrigins = new Set(
    process.env.NODE_ENV === "production"
        ? configuredOrigins
        : [...configuredOrigins, ...defaultOrigins.map(normalizeOrigin)]
);

// Warn loudly at boot when production has no configured origins — every
// cross-origin browser request will fail CORS until FRONTEND_URL is set.
if (process.env.NODE_ENV === "production" && allowedOrigins.size === 0) {
    logger.error(
        "CORS: no allowed origins configured in production. Set FRONTEND_URL / FRONTEND_URLS (comma-separated) on the server, then redeploy."
    );
}

const isLocalDevOrigin = (origin) => {
    const match = /^https?:\/\/(localhost|127\.0\.0\.1)(?::(\d{1,5}))?$/i.exec(origin);
    if (!match) return false;
    if (!match[2]) return true;
    const port = Number(match[2]);
    return port >= 1 && port <= 65535;
};

const configureCors = () => {
    return cors({
        origin: (origin, callBack) => {
            const normalized = normalizeOrigin(origin);
            if (
                !origin ||
                allowedOrigins.has(normalized) ||
                (process.env.NODE_ENV !== "production" &&
                    isLocalDevOrigin(origin))
            ) {
                callBack(null, true);
            } else {
                // Surface the exact rejected origin + the current allow-list in
                // the server logs (stdout → Railway dashboard in production) so
                // this is diagnosable instead of a silent browser-side failure.
                logger.warn("CORS rejected origin", {
                    origin,
                    allowedOrigins: [...allowedOrigins],
                });
                callBack(new Error("Not allowed by CORS"));
            }
        },

        methods: ["POST", "GET", "PUT", "DELETE", "PATCH", "OPTIONS"],

        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "Accept-Version"
        ],

        exposedHeaders: [
            "X-Total-Count",
            "Content-Range"
        ],

        credentials: true,
        preflightContinue: false,
        maxAge: 600,
        optionsSuccessStatus: 204
    });
};

module.exports = { configureCors };
