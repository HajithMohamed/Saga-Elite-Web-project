const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();
dotenv.config({ path: path.join(__dirname, "../../.env") });

const Product = require("../Models/Product");
const Review = require("../Models/Review");
const User = require("../Models/User");
const Order = require("../Models/Order");

const REVIEW_TEMPLATES = [
  { rating: 5, title: "Worth every rupee", content: "Fit is exact and the fabric feels premium straight out of the box. The color stayed true after the first wash." },
  { rating: 5, title: "Instant favourite", content: "Stitching is sharp and the cut sits perfectly on a 5'10\" frame. Already eyeing a second piece in another colour." },
  { rating: 4, title: "Great piece overall", content: "Quality is on point, packaging was thoughtful. Lost half a star because the size ran very slightly small for me." },
  { rating: 5, title: "Streetwear done right", content: "Heavy GSM, clean print, no loose threads. Looks even better in person than on the site." },
  { rating: 4, title: "Solid drop", content: "Nice fit and material. Delivery was quick. Would love a wider size range in the next drop." },
  { rating: 5, title: "Premium feel", content: "Comfortable on long wears, doesn't lose shape after washes. Easily one of the better fits in my closet now." },
  { rating: 3, title: "Decent but pricey", content: "Build quality is fine, just expected slightly heavier fabric for the price. Still a clean piece." },
  { rating: 5, title: "Limited and worth it", content: "Snagged it from the drop and zero regrets. Crisp finishing and the tag/packaging match the price point." },
  { rating: 4, title: "Will buy again", content: "Fit is true to the size chart. Color is a touch deeper than the photos but I actually prefer it that way." },
  { rating: 5, title: "10/10 finishing", content: "Even on the inside the stitching is clean. You can tell it's not your average tee." },
];

const REVIEWERS_PER_PRODUCT_DEFAULT = 6;

const parseArgs = () => {
  const args = process.argv.slice(2);
  const slugs = [];
  let count = REVIEWERS_PER_PRODUCT_DEFAULT;
  args.forEach((arg) => {
    if (arg.startsWith("--slug=")) slugs.push(arg.slice("--slug=".length).trim());
    else if (arg.startsWith("--count=")) {
      const next = parseInt(arg.slice("--count=".length), 10);
      if (!Number.isNaN(next) && next > 0) count = Math.min(next, REVIEW_TEMPLATES.length);
    }
  });
  return { slugs, count };
};

const ghostEmail = (index) => `dummy-reviewer-${index}@sagaelite.local`;

const ghostNames = [
  "Iresha Perera",
  "Ravindu Silva",
  "Sahan Fernando",
  "Tashini Jayawardena",
  "Dilshan Karunaratne",
  "Hashini Wickramasinghe",
  "Nadeesha Rathnayake",
  "Yasiru Bandara",
  "Charith Gunasekara",
  "Senuri Perera",
];

const ensureGhostUser = async (index) => {
  const email = ghostEmail(index);
  const existing = await User.findOne({ email });
  if (existing) return existing;
  return User.create({
    email,
    name: ghostNames[index % ghostNames.length],
    provider: "local",
    role: "customer",
    isVerified: true,
    isActive: true,
    password: "GhostSeed123!",
  });
};

const ensureGhostOrder = async (userId, product) => {
  const existing = await Order.findOne({
    user: userId,
    "items.product": product._id,
    status: "delivered",
  });
  if (existing) return existing;

  const variant = product.variants?.[0] || {};
  const unitPrice = Number(product.basePrice || product.price || variant.price || 1000);

  return Order.create({
    user: userId,
    items: [
      {
        product: product._id,
        productName: product.name,
        productArtNo: product.artNo || `SEED-${product._id.toString().slice(-6)}`,
        productSlug: product.slug,
        variantSku: variant.sku || `SEED-SKU-${product._id.toString().slice(-6)}`,
        size: variant.size || "M",
        color: variant.color || "default",
        quantity: 1,
        unitPrice,
        totalPrice: unitPrice,
      },
    ],
    totalAmount: unitPrice,
    shippingAddress: "Seed address — Colombo, Sri Lanka",
    contactNumber: "+94770000000",
    paymentMethod: "manual",
    paymentStatus: "paid",
    status: "delivered",
  });
};

const seedReviewsForProduct = async (product, count) => {
  const desired = Math.min(count, REVIEW_TEMPLATES.length);

  const existingGhost = await Review.countDocuments({
    productId: product._id,
    userId: { $in: await User.find({ email: /^dummy-reviewer-/ }).distinct("_id") },
  });

  if (existingGhost >= desired) {
    console.log(`  · ${product.slug}: already has ${existingGhost} ghost reviews — skipping.`);
    return 0;
  }

  let created = 0;
  for (let i = 0; i < desired; i += 1) {
    const reviewer = await ensureGhostUser(i);

    const duplicate = await Review.findOne({
      productId: product._id,
      userId: reviewer._id,
    });
    if (duplicate) continue;

    const order = await ensureGhostOrder(reviewer._id, product);
    const template = REVIEW_TEMPLATES[i % REVIEW_TEMPLATES.length];

    await Review.create({
      productId: product._id,
      userId: reviewer._id,
      orderId: order._id,
      rating: template.rating,
      title: template.title,
      content: template.content,
      images: [],
      verifiedPurchase: true,
      sentiment: template.rating >= 4 ? "positive" : template.rating === 3 ? "neutral" : "negative",
      status: "approved",
      approvedAt: new Date(),
    });
    created += 1;
  }

  console.log(`  · ${product.slug}: seeded ${created} reviews.`);
  return created;
};

const seedDummyReviews = async () => {
  const { slugs, count } = parseArgs();
  const dbUri =
    process.env.MONGO_DB_URI ||
    process.env.MONGO_URI ||
    process.env.DATABASE_URI ||
    process.env.DATABASE;

  if (!dbUri) {
    console.error("Missing MONGO_DB_URI in environment.");
    process.exit(1);
  }

  await mongoose.connect(dbUri);
  console.log("Database connected.");

  let products;
  if (slugs.length) {
    products = await Product.find({ slug: { $in: slugs } });
    const found = new Set(products.map((p) => p.slug));
    slugs.forEach((s) => {
      if (!found.has(s)) console.warn(`  ! No product matched slug "${s}".`);
    });
  } else {
    const productsWithoutReviews = await Product.aggregate([
      { $match: { isActive: { $ne: false } } },
      {
        $lookup: {
          from: "reviews",
          let: { pid: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$productId", "$$pid"] },
                status: "approved",
              },
            },
            { $limit: 1 },
          ],
          as: "approvedReviews",
        },
      },
      { $match: { approvedReviews: { $size: 0 } } },
      { $limit: 25 },
      { $project: { _id: 1, slug: 1, name: 1, artNo: 1, basePrice: 1, price: 1, variants: 1 } },
    ]);
    products = productsWithoutReviews;
  }

  if (!products.length) {
    console.log("No target products found. Pass --slug=<product-slug> or seed at least one product first.");
    await mongoose.disconnect();
    return;
  }

  console.log(`Seeding reviews for ${products.length} product(s) (count=${count})…`);

  let totalCreated = 0;
  let touchedProducts = 0;
  for (const product of products) {
    const created = await seedReviewsForProduct(product, count);
    if (created > 0) touchedProducts += 1;
    totalCreated += created;
  }

  console.log(`\nseeded ${totalCreated} reviews across ${touchedProducts} products.`);
  await mongoose.disconnect();
};

seedDummyReviews().catch(async (error) => {
  console.error("Dummy review seeding failed:", error.message);
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  process.exit(1);
});
