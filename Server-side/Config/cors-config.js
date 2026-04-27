const cors = require("cors")

const allowedOrigins = new Set(
    [
        process.env.FRONTEND_URL,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
    ].filter(Boolean)
);

const isLocalDevOrigin = (origin) =>
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);

const configureCors = ()=>{
    return cors({
        origin : (origin,callBack)=>{
            if(!origin || allowedOrigins.has(origin) || (process.env.NODE_ENV !== "production" && isLocalDevOrigin(origin))){
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
