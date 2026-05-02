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
const globalErrorController = require("./Controllers/errorController");
const {
  setSocketServer,
  registerSocketHandlers,
} = require("./Utils/socket-service");
const { startManualPaymentCleanupJob } = require("./Utils/manual-payment-cleanup");
const connectToDB = require("./DataBase/db");

validateRuntimeConfig();

const app = express();

const authRoutes = require("./Routes/authRoutes");
const whatsappWebhookRoutes = require("./Routes/whatsapp-webhook-routes");
const googleAuthRoute = require("./Routes/google-routes");
const productRoutes = require("./Routes/product-routes");
const imageRoutes = require("./Routes/image-routes");
const dropRoutes = require("./Routes/drop-routes");
const orderRoutes = require("./Routes/order-routes");
const manualPaymentRoutes = require("./Routes/manualPaymentRoutes");
const userRoutes = require("./Routes/userRoutes");
const notificationRoutes = require("./Routes/notification-routes");
const contactRoutes = require("./Routes/contactRoutes");
const reviewRoutes = require("./Routes/reviewRoutes");
const superAdminRoutes = require("./Routes/super-admin-routes");

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

/* ================== API ROUTES ================== */
app.use("/api/webhooks/whatsapp", whatsappWebhookRoutes);

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/google", googleAuthRoute);
app.use("/api/v1/image", imageRoutes);
app.use("/api/v1/drops", dropRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1", manualPaymentRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/contact", contactRoutes);
app.use("/api/v1/reviews", reviewRoutes.userRouter);
app.use("/api/v1/admin/reviews", reviewRoutes.adminRouter);
app.use("/api/v1/super-admin", superAdminRoutes);

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
    startManualPaymentCleanupJob();

    server.listen(PORT, () => {
      logger.info("Server is listening", { port: PORT });
    });
  } catch (error) {
    logger.error("Server startup error", { error });
    process.exit(1);
  }
};

startServer();