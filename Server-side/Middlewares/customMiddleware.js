

const requestLogger = (req,res,next) =>{
    const timestamp  = new Date().toISOString();
    const method = req.method;
    const url = req.url;
    const userAgent = req.get("user-Agent");

    console.log(`[${timestamp}] ${method} ${url} ${userAgent}`);

    next()
    
}

const addTimestamp = (req,res,next)=>{
    req.timeStamp = new Date().toISOString()
    next()
}

module.exports={requestLogger,addTimestamp}