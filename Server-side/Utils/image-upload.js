const cloudinary = require("../Config/cloudinary-config")

const uploadToCloudinary = (buffer,folder)=>{
    return new Promise((resolve,reject)=>{
        const stream = cloudinary.uploader.upload_stream(
            {folder},
            (error, result)=>{
                if(error) reject(error)
                else resolve(result)
            }
        )
        stream.end(buffer)
    })
}

module.exports = uploadToCloudinary