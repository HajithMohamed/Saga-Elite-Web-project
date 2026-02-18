const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser")

require("dotenv").config();

const globalErrorController = require("./Controllers/errorController");

const app = express();

app.use(cookieParser());

app.use(
    cors({
        origin: ["http://localhost:5173"],
        methods : ["GET","POST","DELETE","PUT"],
        allowedHeaders : [
            "Content-Type",
            "Authorization",
        ],
        credentials: true,
    })
);

app.use(express.json({ limit: "10kb" }));

app.get("/",(req,res)=>{
    res.status(200).json({
        message : "this is the home page"
    })
});

const PORT = process.env.PORT || 5000;

const connectToDB = require("./DataBase/db");

connectToDB();

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});