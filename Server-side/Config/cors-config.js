const cors = require("cors");

const defaultOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175"
];

const configuredOrigins = [process.env.FRONTEND_URL, process.env.FRONTEND_URLS]
    .filter(Boolean)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);

const allowedOrigins = [...new Set([...configuredOrigins, ...defaultOrigins])];

const configureCors = ()=>{
    return cors({
        origin : (origin,callBack)=>{
            if(!origin || allowedOrigins.includes(origin)){
                callBack(null, true)
            }else{
                callBack(new Error("Not allowed cors"))
            }
        },
        methods : ["POST","GET","PUT","DELETE","PATCH","OPTIONS"],
        allowedHeaders : [
            'Content-Type',
            'Authorization',
            'Accept-Version'
        ],
        exposedHeaders : [
            'X-Total-Count',
            'Content-Range'
        ],
        credentials : true,
        preflightContinue : false,
        maxAge : 600,
        optionsSuccessStatus : 204
    })
}

module.exports = {configureCors}
