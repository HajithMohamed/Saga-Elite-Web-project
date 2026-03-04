const cors = require("cors")
const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";

const configureCors = ()=>{
    return cors({
        origin : (origin,callBack)=>{
            if(!origin || origin === allowedOrigin){
                callBack(null, true)
            }else{
                callBack(new Error("Not allowed cors"))
            }
        },
        methods : ["POST","GET","PUT","DELETE"],
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