const cloudinary = require("../Config/cloudinary-config")

const uploadToCloudinary = (buffer, folder, mimetype = "image/jpeg", retries = 3) => {
    return new Promise((resolve, reject) => {
        const attempt = (attemptsLeft) => {
            const dataUri = `data:${mimetype};base64,${buffer.toString("base64")}`;
            cloudinary.uploader.upload(dataUri, { folder }, (error, result) => {
                if (error) {
                    const isTransient =
                        error.code === "ECONNRESET" ||
                        error.code === "ETIMEDOUT" ||
                        (error.http_code && error.http_code >= 500);
                    if (attemptsLeft > 0 && isTransient) {
                        setTimeout(() => attempt(attemptsLeft - 1), 1000);
                    } else {
                        reject(error);
                    }
                } else {
                    resolve(result);
                }
            });
        };
        attempt(retries);
    });
};

module.exports = uploadToCloudinary