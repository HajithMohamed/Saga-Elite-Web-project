const { Readable } = require("stream");
const cloudinary = require("../Config/cloudinary-config");

const isTransientError = (error) => {
    const transientCodes = ["ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "EPIPE"];
    if (error.code && transientCodes.includes(error.code)) return true;
    if (error.http_code && error.http_code >= 500) return true;
    const msg = (error.message || "").toLowerCase();
    if (msg.includes("econnreset") || msg.includes("etimedout") || msg.includes("socket hang up")) return true;
    return false;
};

const uploadToCloudinary = (buffer, folder, mimetype = "image/jpeg", retries = 3) => {
    return new Promise((resolve, reject) => {
        const attempt = (attemptsLeft) => {
            const isImage = String(mimetype || "").startsWith("image/");
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder,
                    resource_type: isImage ? "image" : "auto",
                    timeout: 60000,
                    transformation: isImage
                        ? [
                            {
                                width: 2000,
                                height: 2000,
                                crop: "limit",
                                quality: "auto:good",
                                fetch_format: "auto",
                            },
                        ]
                        : undefined,
                },
                (error, result) => {
                    if (error) {
                        if (attemptsLeft > 0 && isTransientError(error)) {
                            const delay = 1000 * Math.pow(2, retries - attemptsLeft);
                            setTimeout(() => attempt(attemptsLeft - 1), delay);
                        } else {
                            reject(error);
                        }
                    } else {
                        resolve(result);
                    }
                }
            );

            const readable = Readable.from(buffer);
            readable.pipe(uploadStream);
        };
        attempt(retries);
    });
};

module.exports = uploadToCloudinary;
