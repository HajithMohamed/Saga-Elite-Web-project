const cors = require("cors");

const defaultOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175"
];

const configuredOrigins = [
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URLS
]
    .filter(Boolean)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);

const allowedOrigins = new Set(
    process.env.NODE_ENV === "production"
        ? configuredOrigins
        : [...configuredOrigins, ...defaultOrigins]
);

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
            if (
                !origin ||
                allowedOrigins.has(origin) ||
                (process.env.NODE_ENV !== "production" &&
                    isLocalDevOrigin(origin))
            ) {
                callBack(null, true);
            } else {
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
