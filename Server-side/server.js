const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

require("dotenv").config();

const globalErrorController = require("./Controllers/errorController");

const app = express();

const authRoutes = require("./Routes/authRoutes");

app.use(cookieParser());

app.use(
  cors({
    origin: ["http://localhost:5173"],
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
