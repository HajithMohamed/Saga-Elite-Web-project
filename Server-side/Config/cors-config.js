const cors = require("cors")
const allowedOrigins = [process.env.FRONTEND_URL || "http://localhost:5173", "http://127.0.0.1:5173"];

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