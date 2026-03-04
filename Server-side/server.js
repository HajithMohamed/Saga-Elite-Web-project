const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const {configureCors} = require("./Config/cors-config")

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


app.use(cookieParser());


app.use(configureCors());

app.use(express.json({ limit: "10kb" }));
 
app.get("/", (req, res) => {
  res.status(200).json({
    message: "this is the home page",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/google",googleAuthRoute)
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
