const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
const helmet = require("helmet");
const compression = require("compression");
const http = require("http");
const { Server } = require("socket.io");

const { configureCors } = require("./Config/cors-config");
const {
  authLimiter,
  generalLimiter
} = require("./Middlewares/rateLimitinMiddleware");

const {
  requestLogger
} = require("./Middlewares/customMiddleware");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env")
});
require("dotenv").config();

const globalErrorController = require("./Controllers/errorController");
const {
  setSocketServer,
  registerSocketHandlers,
} = require("./Utils/socket-service");

const app = express();

/* ================== ROUTES ================== */
const authRoutes = require("./Routes/authRoutes");
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

const { startManualPaymentCleanupJob } = require("./Utils/manual-payment-cleanup");
const connectToDB = require("./DataBase/db");

/* ================== MIDDLEWARE ================== */
app.use(
  helmet({
    crossOriginOpenerPolicy: false
  })
);

app.use(cookieParser());
app.use(configureCors());
app.use(compression());

app.use(
  express.json({
    limit: "10kb"
  })
);

app.use("/api/v1/auth", authLimiter);
app.use(generalLimiter);
app.use(requestLogger);

/* ================== API ROUTES ================== */
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/google", googleAuthRoute);
app.use("/api/v1/image", imageRoutes);
app.use("/api/v1/drops", dropRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1", manualPaymentRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/contact", contactRoutes);

app.use("/api/v1/reviews", reviewRoutes.userRouter);
app.use("/api/v1/admin/reviews", reviewRoutes.adminRouter);
app.use("/api/v1/super-admin", superAdminRoutes);

/* ================== GLOBAL ERROR ================== */
app.use(globalErrorController);

/* ================== PORT ================== */
const rawPort =
  process.env.PORT ||
  process.env.BACKEND_PORT;

const PORT = Number(rawPort) || 5001;

/* ================== SERVER + SOCKET.IO ================== */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin:
      process.env.CLIENT_URL ||
      process.env.FRONTEND_URL ||
      "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
  }
});

setSocketServer(io);

/* ================== SOCKET EVENTS ================== */
io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  registerSocketHandlers(socket);

  socket.emit("server:connected", {
    success: true,
    socketId: socket.id,
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });

  // Example event
  socket.on("send_message", (data) => {
    console.log("Message received:", data);

    // broadcast to all users
    io.emit("receive_message", data);
  });
});

/* ================== START SERVER ================== */
const startServer = async () => {
  try {
    await connectToDB();
    startManualPaymentCleanupJob();

    server.listen(PORT, () => {
      console.log(`Server is listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup error:", error);
    process.exit(1);
  }
};

startServer();