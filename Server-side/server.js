const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

// Load configuration from the workspace root, falling back to a
// backend‑local file if present.  This lets you keep a single shared
// `.env` at the project root for both frontend and backend.
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("dotenv").config();  // load Server-side/.env if it exists

const globalErrorController = require("./Controllers/errorController");

const app = express();

const authRoutes = require("./Routes/authRoutes");

app.use(cookieParser());

const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";
app.use(
  cors({
    origin: [allowedOrigin],
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use(express.json({ limit: "10kb" }));

app.get("/", (req, res) => {
  res.status(200).json({
    message: "this is the home page",
  });
});

app.use("/api/auth", authRoutes);

app.use(globalErrorController);

const PORT = process.env.PORT || 5001;

const connectToDB = require("./DataBase/db");

connectToDB();

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
