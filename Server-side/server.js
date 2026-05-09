const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
const helmet = require("helmet");
const compression = require("compression");
const http = require("http");
const { Server } = require("socket.io");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});
require("dotenv").config();

const logger = require("./Utils/logger");
const { configureCors } = require("./Config/cors-config");
const { validateRuntimeConfig } = require("./Config/runtime-config");
const {
  authLimiter,
  generalLimiter,
} = require("./Middlewares/rateLimitinMiddleware");
const { requestLogger } = require("./Middlewares/customMiddleware");
const maintenanceMode = require("./Middlewares/maintenance-mode");
const globalErrorController = require("./Controllers/errorController");
const {
  setSocketServer,
  registerSocketHandlers,
} = require("./Utils/socket-service");
const { startManualPaymentCleanupJob } = require("./Utils/manual-payment-cleanup");
const { startBankInboxWatcher } = require("./Utils/bank-email-watcher");
const connectToDB = require("./DataBase/db");

validateRuntimeConfig();const { initAgingStockJob } = require('./Utils/aging-stock-job');
const { initReviewInsightsJob } = require('./Utils/review-insights-job');


const app = express();

const authRoutes = require("./Routes/authRoutes");
const whatsappWebhookRoutes = require("./Routes/whatsapp-webhook-routes");
const googleAuthRoute = require("./Routes/google-routes");
const facebookAuthRoute = require("./Routes/facebook-routes");
const productRoutes = require("./Routes/product-routes");
const imageRoutes = require("./Routes/image-routes");
const dropRoutes = require("./Routes/drop-routes");
const orderRoutes = require("./Routes/order-routes");
const giftRoutes = require("./Routes/gift-routes");
const bannerRoutes = require("./Routes/banner-routes");
const dealRoutes = require("./Routes/deal-routes");
const manualPaymentRoutes = require("./Routes/manualPaymentRoutes");
const userRoutes = require("./Routes/userRoutes");
const notificationRoutes = require("./Routes/notification-routes");
const contactRoutes = require("./Routes/contactRoutes");
const reviewRoutes = require("./Routes/reviewRoutes");
const superAdminRoutes = require("./Routes/super-admin-routes");
const adminRoutes = require("./Routes/admin-routes");
const newsletterRoutes = require("./Routes/newsletterRoutes");
const siteConfigRoutes = require("./Routes/siteConfigRoutes");
const offerRoutes = require("./Routes/offer-routes");
const couponRoutes = require("./Routes/coupon-routes");
const influencerRoutes = require("./Routes/influencer-routes");
const shippingZoneRoutes = require("./Routes/shipping-zone-routes");
const { seedAboutSiteDefaults } = require("./Utils/seed-site-about-defaults");

app.use(
  helmet({
    crossOriginOpenerPolicy: false,
  })
);

app.use(cookieParser());
app.use(configureCors());
app.use(compression());
app.use(
  express.json({
    limit: "10kb",
  })
);

app.use("/api/v1/auth", authLimiter);
app.use(generalLimiter);
app.use(requestLogger);
app.use(maintenanceMode);

// Allow popup-based OAuth flows to close child windows without being
// blocked by strict Cross-Origin-Opener-Policy during local development
// or when using external OAuth providers (e.g., Google). This header
// permits popups while still keeping sensible COOP behavior.
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

// Healthcheck — used by docker-compose healthcheck and orchestrators
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

/* ================== API ROUTES ================== */
app.use("/api/webhooks/whatsapp", whatsappWebhookRoutes);
app.use("/api/webhooks/bank-sms", require("./Routes/bank-sms-webhook-routes"));

// Dev-only test routes. The router self-blocks production via NODE_ENV
// checks in every handler, but we also gate the mount itself so we don't
// even register the routes in prod.
if (String(process.env.NODE_ENV || "").toLowerCase() !== "production") {
  app.use("/api/v1/dev", require("./Routes/dev-routes"));
}

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/banners", bannerRoutes);
app.use("/api/v1/deals", dealRoutes);
app.use("/api/v1/google", googleAuthRoute);
app.use("/api/v1/facebook", facebookAuthRoute);
app.use("/api/v1/image", imageRoutes);
app.use("/api/v1/drops", dropRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/gifts", giftRoutes);
app.use("/api/v1", manualPaymentRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/contact", contactRoutes);
app.use("/api/v1/reviews", reviewRoutes.userRouter);
app.use("/api/v1/admin/reviews", reviewRoutes.adminRouter);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/super-admin", superAdminRoutes);
app.use("/api/v1/newsletter", newsletterRoutes);
app.use("/api/v1/site-config", siteConfigRoutes);
app.use("/api/v1/offers", offerRoutes);
app.use("/api/v1/coupons", couponRoutes);
app.use("/api/v1/influencers", influencerRoutes);
app.use("/api/v1/shipping-zones", shippingZoneRoutes);

app.use(globalErrorController);

const rawPort = process.env.PORT || process.env.BACKEND_PORT;
const PORT = Number(rawPort) || 5001;

const parseOriginList = (value) =>
  String(value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

const socketOrigins = new Set();

if (process.env.CLIENT_URL) {
  socketOrigins.add(process.env.CLIENT_URL.trim());
}

if (process.env.FRONTEND_URL) {
  socketOrigins.add(process.env.FRONTEND_URL.trim());
}

parseOriginList(process.env.FRONTEND_URLS).forEach((origin) => {
  socketOrigins.add(origin);
});

if (process.env.NODE_ENV !== "production") {
  ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"].forEach(
    (origin) => {
      socketOrigins.add(origin);
    }
  );
}

const socketOrigin = socketOrigins.size ? Array.from(socketOrigins) : undefined;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: socketOrigin,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  },
});

app.set("io", io);
setSocketServer(io);

io.on("connection", (socket) => {
  logger.info("Socket client connected", { socketId: socket.id });

  registerSocketHandlers(socket);

  socket.emit("server:connected", {
    success: true,
    socketId: socket.id,
  });

  socket.on("disconnect", () => {
    logger.info("Socket client disconnected", { socketId: socket.id });
  });

  socket.on("send_message", (data) => {
    logger.debug("Socket message received", {
      socketId: socket.id,
      data,
    });
    io.emit("receive_message", data);
  });
});

const startServer = async () => {
  try {
    await connectToDB();
    await seedAboutSiteDefaults();
    startManualPaymentCleanupJob();
    startBankInboxWatcher();

    server.listen(PORT, () => {
      initAgingStockJob();
      initReviewInsightsJob();
      logger.info("Server is listening", { port: PORT });
    });
  } catch (error) {
    logger.error("Server startup error", { error });
    process.exit(1);
  }
};

// ── process-level safety nets ────────────────────────────────────
process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception — shutting down", {
    message: err.message,
    stack: err.stack,
  });
  // Crash hard so the orchestrator restarts the process clean.
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection — shutting down", {
    reason: reason instanceof Error ? reason.stack : String(reason),
  });
  server.close(() => process.exit(1));
});

// ── graceful shutdown (SIGTERM from Docker/K8s, SIGINT from Ctrl+C) ─
let shuttingDown = false;
const gracefulShutdown = (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info("Shutdown signal received — closing connections", { signal });

  // Stop accepting new connections; drain in-flight requests.
  server.close((err) => {
    if (err) {
      logger.error("Error closing HTTP server", { error: err.message });
      process.exit(1);
    }
    io.close(() => {
      logger.info("Sockets closed; bye.");
      process.exit(0);
    });
  });

  // Hard-kill safety net if drain stalls (10s).
  setTimeout(() => {
    logger.error("Forced shutdown after 10s timeout");
    process.exit(1);
  }, 10_000).unref();
};

["SIGTERM", "SIGINT"].forEach((sig) => process.on(sig, () => gracefulShutdown(sig)));

startServer();