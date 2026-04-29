const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
const helmet = require("helmet");
const compression = require("compression");

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

const app = express();

const authRoutes = require("./Routes/authRoutes");
const googleAuthRoute = require("./Routes/google-routes");
const productRoutes = require("./Routes/product-routes");
const imageRoutes = require("./Routes/image-routes");
const dropRoutes = require("./Routes/drop-routes");
const orderRoutes = require("./Routes/order-routes");
const userRoutes = require("./Routes/userRoutes");
const notificationRoutes = require("./Routes/notification-routes");
const contactRoutes = require("./Routes/contactRoutes");
const reviewRoutes = require("./Routes/reviewRoutes");

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

/* ROUTES */
app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/products", productRoutes);

app.use("/api/v1/google", googleAuthRoute);

app.use("/api/v1/image", imageRoutes);

app.use("/api/v1/drops", dropRoutes);

app.use("/api/v1/orders", orderRoutes);

app.use("/api/v1/user", userRoutes);

app.use(
  "/api/v1/notifications",
  notificationRoutes
);

/* Contact */
app.use(
  "/api/v1/contact",
  contactRoutes
);

/* Reviews */
app.use(
  "/api/v1/reviews",
  reviewRoutes.userRouter
);

app.use(
  "/api/v1/admin/reviews",
  reviewRoutes.adminRouter
);

/* Global error handler */
app.use(globalErrorController);

const rawPort =
  process.env.PORT ||
  process.env.BACKEND_PORT;

const PORT = Number(rawPort) || 5001;

const connectToDB = require("./DataBase/db");

connectToDB();

console.log(PORT);

app.listen(PORT, () => {
  console.log(
    `Server is listening on port ${PORT}`
  );
});