const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const { imageSize } = require("image-size");

const UPLOADS_ROOT = path.resolve(__dirname, "../Uploads");
const PUBLIC_UPLOAD_ROOT = "/Uploads";
const LOCAL_PUBLIC_ID_PREFIX = "local/";

const EXTENSION_BY_MIME = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

const sanitizeSegment = (value) => {
  const segment = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

  return segment || null;
};

const normalizeFolderSegments = (folder) => {
  const segments = String(folder || "")
    .split(/[\\/]+/)
    .map(sanitizeSegment)
    .filter(Boolean);

  return segments.length ? segments : ["misc"];
};

const getExtension = (mimetype) => EXTENSION_BY_MIME[mimetype] || "jpg";

const getImageDimensions = (buffer) => {
  try {
    const dimensions = imageSize(buffer);
    return {
      width: dimensions?.width,
      height: dimensions?.height,
      format: dimensions?.type,
    };
  } catch (_error) {
    return {};
  }
};

const storeLocalImage = async ({ buffer, folder, mimetype = "image/jpeg" }) => {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error("Local image storage requires a file buffer");
  }

  const folderSegments = normalizeFolderSegments(folder);
  const extension = getExtension(mimetype);
  const fileName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${extension}`;
  const targetDirectory = path.join(UPLOADS_ROOT, ...folderSegments);
  const targetPath = path.join(targetDirectory, fileName);

  await fs.mkdir(targetDirectory, { recursive: true });
  await fs.writeFile(targetPath, buffer);

  const relativePath = path.posix.join(...folderSegments, fileName);
  const dimensions = getImageDimensions(buffer);

  return {
    secure_url: path.posix.join(PUBLIC_UPLOAD_ROOT, relativePath),
    public_id: `${LOCAL_PUBLIC_ID_PREFIX}${relativePath}`,
    width: dimensions.width,
    height: dimensions.height,
    format: dimensions.format || extension,
    bytes: buffer.length,
    storage: "local",
  };
};

const isLocalImagePublicId = (publicId) =>
  String(publicId || "").startsWith(LOCAL_PUBLIC_ID_PREFIX);

const resolveLocalPublicId = (publicId) => {
  if (!isLocalImagePublicId(publicId)) return null;

  const relativePublicId = String(publicId).slice(LOCAL_PUBLIC_ID_PREFIX.length);
  const pathSegments = relativePublicId.split(/[\\/]+/).filter(Boolean);
  const targetPath = path.resolve(UPLOADS_ROOT, ...pathSegments);
  const rootWithSeparator = `${UPLOADS_ROOT}${path.sep}`;

  if (targetPath !== UPLOADS_ROOT && !targetPath.startsWith(rootWithSeparator)) {
    throw new Error("Invalid local image path");
  }

  return targetPath;
};

const deleteLocalImage = async (publicId) => {
  const targetPath = resolveLocalPublicId(publicId);
  if (!targetPath) return false;

  try {
    await fs.unlink(targetPath);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
};

module.exports = {
  deleteLocalImage,
  isLocalImagePublicId,
  storeLocalImage,
  UPLOADS_ROOT,
};
