const multer = require("multer");

const storage = multer.memoryStorage();

const createUploadError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  error.status = "fail";
  return error;
};

const createUpload = ({ allowPdf = false, maxFiles = 10 } = {}) =>
  multer({
    storage,
    fileFilter: (req, file, cb) => {
      const isImage = file.mimetype?.startsWith("image/");
      const isPdf = allowPdf && file.mimetype === "application/pdf";

      if (isImage || isPdf) {
        return cb(null, true);
      }

      const message = allowPdf
        ? "Please upload a JPG, PNG, or PDF file"
        : "Please upload image files only";

      return cb(createUploadError(message), false);
    },
    limits: { fileSize: 5 * 1024 * 1024, files: maxFiles },
  });

module.exports = {
  imageUpload: createUpload(),
  receiptUpload: createUpload({ allowPdf: true, maxFiles: 1 }),
};
