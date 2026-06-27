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
const seedCategoryTaxonomy = require("./scripts/seed-category-taxonomy");

validateRuntimeConfig();const { initAgingStockJob } = require('./Utils/aging-stock-job');
const { initRecommendationsJobs } = require('./Utils/recommendations-job');
const { initSmartAlertsJob } = require('./Utils/smart-alerts-job');
const { initRecommendationsDigest } = require('./Utils/recommendations-digest');
const recommendationsRoutes = require('./Routes/recommendationsRoutes');
const smartAlertsRoutes = require('./Routes/smartAlertsRoutes');


const app = express();

const authRoutes = require("./Routes/authRoutes");
const whatsappWebhookRoutes = require("./Routes/whatsapp-webhook-routes");
const googleAuthRoute = require("./Routes/google-routes");
const facebookAuthRoute = require("./Routes/facebook-routes");
const productRoutes = require("./Routes/product-routes");
const categoryRoutes = require("./Routes/category-routes");
const imageRoutes = require("./Routes/image-routes");
const dropRoutes = require("./Routes/drop-routes");
const orderRoutes = require("./Routes/order-routes");

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
const testimonialRoutes = require("./Routes/testimonial-routes");
const offerRoutes = require("./Routes/offer-routes");
const couponRoutes = require("./Routes/coupon-routes");
const influencerRoutes = require("./Routes/influencer-routes");
const shippingZoneRoutes = require("./Routes/shipping-zone-routes");
const guestRoutes = require("./Routes/guestRoutes");
const guestTrackingMiddleware = require("./Middlewares/guest-tracking-middleware");
const { initGuestPromoJob } = require("./Utils/guest-promo-job");
const customerRoutes = require("./Routes/customerRoutes");
const eventRoutes = require("./Routes/eventRoutes");
const { identifyCustomer } = require("./Middlewares/customer-middleware");
const { initCartAbandonmentJob } = require("./Utils/cart-abandonment-job");
const { seedAboutSiteDefaults } = require("./Utils/seed-site-about-defaults");
const ManualPayment = require("./Models/ManualPayment");
const Customer = require("./Models/Customer");
const { CustomerEvent } = require("./Models/CustomerEvent");

app.use(
  helmet({
    crossOriginOpenerPolicy: false,
  })
);

app.use(cookieParser());
app.use(configureCors());
app.use(guestTrackingMiddleware);
app.use(identifyCustomer);
app.use(compression());
app.use(
  "/Uploads",
  express.static(path.resolve(__dirname, "Uploads"), {
    fallthrough: false,
    maxAge: process.env.NODE_ENV === "production" ? "7d" : 0,
  })
);
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
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/banners", bannerRoutes);
app.use("/api/v1/deals", dealRoutes);
app.use("/api/v1/google", googleAuthRoute);
app.use("/api/v1/facebook", facebookAuthRoute);
app.use("/api/v1/image", imageRoutes);
app.use("/api/v1/drops", dropRoutes);
app.use("/api/v1/orders", orderRoutes);

app.use("/api/v1", manualPaymentRoutes);
app.use("/api/v1/guest", guestRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/contact", contactRoutes);
app.use("/api/v1/reviews", reviewRoutes.userRouter);
app.use("/api/v1/admin/reviews", reviewRoutes.adminRouter);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/super-admin", superAdminRoutes);
app.use("/api/v1/newsletter", newsletterRoutes);
app.use("/api/v1/site-config", siteConfigRoutes);
app.use("/api/v1/testimonials", testimonialRoutes);
app.use("/api/v1/offers", offerRoutes);
app.use("/api/v1/coupons", couponRoutes);
app.use("/api/v1/influencers", influencerRoutes);
app.use("/api/v1/shipping-zones", shippingZoneRoutes);
app.use("/api/v1/admin/recommendations", recommendationsRoutes);
app.use("/api/v1/admin/alerts", smartAlertsRoutes);
app.use("/api/v1/customer", customerRoutes);
app.use("/api/v1/events", eventRoutes);

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

// Run slow maintenance tasks after the server is already accepting traffic.
// This keeps health checks responsive while the seed and reconciliation work
// finishes in the background.
const runDeferredStartupTasks = async () => {
  try {
    await seedCategoryTaxonomy();
  } catch (error) {
    logger.error("Category taxonomy seed failed", {
      error: error?.message || String(error),
    });
  }

  try {
    await seedAboutSiteDefaults();
  } catch (error) {
    logger.error("About site defaults seed failed", {
      error: error?.message || String(error),
    });
  }

  try {
    // Reconcile Mongo's actual indexes with the current schema. Required
    // because changing index options (e.g. sparse → partialFilterExpression)
    // does not drop the old index — Mongoose only adds new ones.
    await ManualPayment.syncIndexes();
  } catch (err) {
    logger.error("ManualPayment.syncIndexes failed", {
      error: err?.message || String(err),
    });
  }

  try {
    // The old email_1 index was created as unique + non-sparse, so multiple
    // documents with email:null cause E11000.  The new schema uses a partial
    // filter index that excludes null emails from the uniqueness constraint.
    // Drop the old index unconditionally, then let syncIndexes recreate it.
    const customerIndexes = await Customer.collection.indexes();
    const hasEmailIndex = customerIndexes.some((idx) => idx.name === "email_1");
    if (hasEmailIndex) {
      await Customer.collection.dropIndex("email_1");
      logger.info("Dropped stale email_1 index on customers");
    }
    // Remove duplicate null-email rows so syncIndexes can build the new
    // partial unique index without conflict.  Keep the first per guestToken.
    const dupNullCustomers = await Customer.aggregate([
      { $match: { email: null, type: "guest" } },
      { $group: { _id: "$guestToken", ids: { $push: "$_id" }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
    ]);
    for (const group of dupNullCustomers) {
      const [keep, ...remove] = group.ids;
      await Customer.deleteMany({ _id: { $in: remove } });
      logger.info("Cleaned duplicate null-email customers", {
        kept: String(keep),
        removed: remove.length,
      });
    }
    await Customer.syncIndexes();
    await CustomerEvent.syncIndexes();
  } catch (err) {
    logger.error("Customer/CustomerEvent.syncIndexes failed", {
      error: err?.message || String(err),
    });
  }

  startManualPaymentCleanupJob();
  startBankInboxWatcher();
  initAgingStockJob();
  initRecommendationsJobs();
  initSmartAlertsJob();
  initRecommendationsDigest();
  initGuestPromoJob();
  initCartAbandonmentJob();
};

const startServer = async () => {
  try {
    await connectToDB();

    server.listen(PORT, () => {
      logger.info("Server is listening", { port: PORT });
      runDeferredStartupTasks().catch((error) => {
        logger.error("Background startup task runner failed", {
          error: error?.message || String(error),
        });
      });
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
  if (process.env.NODE_ENV === "test") {
    return;
  }
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
