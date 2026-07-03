/**
 * Repair Image documents whose url points at the local-disk fallback
 * ("/Uploads/...") by re-uploading the file to Cloudinary and updating the
 * document in place.
 *
 * Background: in non-production NODE_ENV the image controller falls back to
 * Server-side/Uploads/ when Cloudinary is slow. If that happens against a
 * shared/production database, the stored relative URL 404s on the storefront
 * and the file only exists on the machine that ran the upload.
 *
 * Run from repo root (on the machine that holds the files):
 *   node Server-side/scripts/repair-local-image-urls.js          # repair
 *   node Server-side/scripts/repair-local-image-urls.js --dry    # report only
 */
require("dotenv").config();
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const fs = require("fs");
const mongoose = require("mongoose");

// Use the app's own connector — it appends the /sagaelite db name when the
// URI doesn't carry one (a bare mongoose.connect would land in "test").
const connectToDB = require("../DataBase/db");
const Image = require("../Models/Image");
const uploadToCloudinary = require("../Utils/image-upload");

const DRY_RUN = process.argv.includes("--dry");

const MIME_BY_EXT = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

async function main() {
  await connectToDB();
  console.log(`Connected to db: ${mongoose.connection.db.databaseName}`);

  const broken = await Image.find({
    url: /^\/Uploads\//i,
    isDeleted: false,
  });

  console.log(`Found ${broken.length} image doc(s) with local-disk URLs.`);

  let repaired = 0;
  let missing = 0;

  for (const doc of broken) {
    // "/Uploads/saga-elite/product/<file>" → Server-side/Uploads/saga-elite/product/<file>
    const relative = doc.url.replace(/^\//, "");
    const localPath = path.resolve(__dirname, "..", relative);
    const folder = path.posix.dirname(relative).replace(/^Uploads\//i, "");
    const ext = path.extname(localPath).toLowerCase();

    if (!fs.existsSync(localPath)) {
      missing += 1;
      console.warn(`MISSING file for ${doc._id} (${doc.colorTag || "untagged"}): ${doc.url}`);
      continue;
    }

    console.log(
      `${DRY_RUN ? "[dry] would repair" : "Repairing"} ${doc._id} colorTag=${doc.colorTag || ""} → ${folder}`
    );
    if (DRY_RUN) continue;

    const buffer = fs.readFileSync(localPath);
    const result = await uploadToCloudinary(
      buffer,
      folder,
      MIME_BY_EXT[ext] || "image/jpeg"
    );

    doc.url = result.secure_url;
    doc.publicId = result.public_id;
    doc.metadata = {
      ...(doc.metadata || {}),
      width: result.width,
      height: result.height,
      format: result.format,
      sizeInBytes: result.bytes,
    };
    await doc.save({ validateModifiedOnly: true });
    repaired += 1;
    console.log(`  → ${result.secure_url}`);
  }

  console.log(`Done. Repaired: ${repaired}, missing files: ${missing}.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
