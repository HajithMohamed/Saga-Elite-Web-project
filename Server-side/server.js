const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
const helmet = require("helmet");
const compression = require("compression");
const { configureCors } = require("./Config/cors-config");
const { authLimiter, generalLimiter } = require("./Middlewares/rateLimitinMiddleware");
const { urlversionning } = require("./Middlewares/versioningMiddleware");
const { requestLogger } = require("./Middlewares/customMiddleware");

// Load configuration from the workspace root, falling back to a
// backend‑local file if present.  This lets you keep a single shared
// `.env` at the project root for both frontend and backend.
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("dotenv").config();  // load Server-side/.env if it exists

const globalErrorController = require("./Controllers/errorController");

const app = express();

const authRoutes = require("./Routes/authRoutes");
const googleAuthRoute = require("./Routes/google-routes")
const productRoutes = require("./Routes/product-routes");
const imageRoutes = require("./Routes/image-routes")
const dropRoutes = require("./Routes/drop-routes")
const orderRoutes = require("./Routes/order-routes")
const userRoutes = require("./Routes/userRoutes")



app.use(helmet({ crossOriginOpenerPolicy: false })); // Security headers
app.use(cookieParser());
app.use(configureCors());
app.use(compression()); // Response compression
app.use(express.json({ limit: "10kb" }));

// Rate limiting: stricter for auth, general for others
app.use("/api/v1/auth", authLimiter);
app.use(generalLimiter);

// API versioning middleware is removed to ensure consistent routing

app.use(requestLogger);

// All routes are now consistently prefixed with /api/v1
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/google", googleAuthRoute);
app.use("/api/v1/image", imageRoutes);
app.use("/api/v1/drops", dropRoutes);
app.use("/api/v1/user", userRoutes);

app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/user", userRoutes);

app.use(globalErrorController);


// resolve port: dotenv doesn't expand variables, so PORT may literally be "${BACKEND_PORT}".
// fall back to BACKEND_PORT directly and coerce to a number when possible.
const rawPort = process.env.PORT || process.env.BACKEND_PORT;
const PORT = Number(rawPort) || 5001;

const connectToDB = require("./DataBase/db");

connectToDB();

console.log(PORT);


app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
