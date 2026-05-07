let cron = null;
try {
  cron = require("node-cron");
} catch (_error) {
  console.warn("[aging-stock-job] node-cron is not installed; scheduler disabled.");
}

const Product = require("../Models/Product");
const Offer = require("../Models/Offer");
const sendEmail = require("./send-mail");

const AGING_DAYS = 90;
const MIN_HEALTHY_MARGIN_PERCENT = 15;
const OFFER_DURATION_DAYS = 7;

const computeSuggestedDiscount = (product) => {
  const cost = Number(product?.costPrice || 0);
  const base = Number(product?.basePrice || 0);
  if (base <= 0) return { discount: 0, fallback: true };
  if (cost <= 0) return { discount: 15, fallback: true };
  const floor = 1 - MIN_HEALTHY_MARGIN_PERCENT / 100;
  const max = Math.floor(100 * (1 - cost / (base * floor)));
  return { discount: Math.max(5, Math.min(50, max)), fallback: false };
};

const marginAfterDiscount = (basePrice, costPrice, discountPercent) => {
  if (!costPrice || costPrice <= 0 || !basePrice || basePrice <= 0) return null;
  const sale = basePrice * (1 - discountPercent / 100);
  if (sale <= 0) return -100;
  return Math.round(((sale - costPrice) / sale) * 100);
};

const buildSummaryEmail = ({ created, skippedAlreadyCovered, frontendUrl }) => {
  const adminLink = frontendUrl ? `${frontendUrl}/admin/offers` : "your admin panel";
  const rows = created
    .map(
      (c) =>
        `<tr>
          <td style="padding:6px 10px;border:1px solid #2a2a2a;">${c.productName}</td>
          <td style="padding:6px 10px;border:1px solid #2a2a2a;text-align:center;">${c.daysUnsold}</td>
          <td style="padding:6px 10px;border:1px solid #2a2a2a;text-align:center;">${c.discount}%</td>
          <td style="padding:6px 10px;border:1px solid #2a2a2a;text-align:center;">${
            c.marginAfter === null ? "—" : `${c.marginAfter}%`
          }</td>
        </tr>`
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;color:#222;max-width:680px;margin:0 auto;">
      <h2 style="color:#0a0a0a;margin-bottom:6px;">Aging Stock Offers Created</h2>
      <p style="color:#555;margin-top:0;">
        ${created.length} system-generated offer${created.length === 1 ? "" : "s"} were created
        for products unsold for ${AGING_DAYS}+ days.
        Each offer is valid for ${OFFER_DURATION_DAYS} days. Review or modify them in
        <a href="${adminLink}" style="color:#b8941d;">${adminLink}</a>.
      </p>
      ${
        skippedAlreadyCovered > 0
          ? `<p style="color:#888;font-size:13px;">
              ${skippedAlreadyCovered} aging product${skippedAlreadyCovered === 1 ? " was" : "s were"}
              already covered by another active offer and skipped.
            </p>`
          : ""
      }
      <table style="border-collapse:collapse;width:100%;font-size:13px;">
        <thead>
          <tr style="background:#f2ca50;color:#0a0a0a;">
            <th style="padding:8px 10px;border:1px solid #2a2a2a;text-align:left;">Product</th>
            <th style="padding:8px 10px;border:1px solid #2a2a2a;">Days Idle</th>
            <th style="padding:8px 10px;border:1px solid #2a2a2a;">Suggested Discount</th>
            <th style="padding:8px 10px;border:1px solid #2a2a2a;">Margin After</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="color:#888;font-size:12px;margin-top:18px;">
        Margin floor: ${MIN_HEALTHY_MARGIN_PERCENT}%. Products without costPrice get a conservative
        15% discount. Offers cap at 50%.
      </p>
    </div>
  `;
};

const checkAgingStock = async () => {
  console.log("[aging-stock-job] Running aging stock detection...");
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - AGING_DAYS);

  const agingProducts = await Product.find({
    isActive: true,
    $or: [
      { lastSoldAt: { $lte: cutoff } },
      { lastSoldAt: null, createdAt: { $lte: cutoff } },
    ],
  }).select("name basePrice costPrice variants totalStock lastSoldAt createdAt");

  if (agingProducts.length === 0) {
    console.log("[aging-stock-job] No aging products found.");
    return { created: [], skippedAlreadyCovered: 0 };
  }

  const productsWithStock = agingProducts.filter((p) => {
    if (typeof p.totalStock === "number" && p.totalStock > 0) return true;
    if (!Array.isArray(p.variants)) return false;
    return p.variants.some((v) => (v?.stock || 0) > 0);
  });

  if (productsWithStock.length === 0) {
    console.log("[aging-stock-job] No aging products with stock.");
    return { created: [], skippedAlreadyCovered: 0 };
  }

  const now = new Date();
  const candidateIds = productsWithStock.map((p) => p._id);
  const coveredIds = new Set();

  const overlappingOffers = await Offer.find({
    isActive: true,
    products: { $in: candidateIds },
    $and: [
      { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
    ],
  }).select("products");

  overlappingOffers.forEach((offer) => {
    (offer.products || []).forEach((id) => coveredIds.add(String(id)));
  });

  const created = [];
  let skippedAlreadyCovered = 0;

  for (const product of productsWithStock) {
    if (coveredIds.has(String(product._id))) {
      skippedAlreadyCovered += 1;
      continue;
    }

    const { discount } = computeSuggestedDiscount(product);
    if (discount < 5) continue;

    const referenceDate = product.lastSoldAt || product.createdAt;
    const daysUnsold = referenceDate
      ? Math.floor((Date.now() - new Date(referenceDate).getTime()) / (1000 * 60 * 60 * 24))
      : AGING_DAYS;
    const marginAfter = marginAfterDiscount(product.basePrice, product.costPrice, discount);

    try {
      await Offer.create({
        name: `Clearance — ${product.name}`,
        description: `Aging stock clearance · idle ${daysUnsold} days`,
        type: "aging_stock",
        discountPercent: discount,
        products: [product._id],
        startsAt: now,
        endsAt: new Date(Date.now() + OFFER_DURATION_DAYS * 24 * 60 * 60 * 1000),
        showOnHomepage: true,
        isActive: true,
        isSystemGenerated: true,
        estimatedMarginAfterDiscount: marginAfter,
        badgeText: "CLEARANCE",
      });
      created.push({
        productName: product.name,
        daysUnsold,
        discount,
        marginAfter,
      });
    } catch (err) {
      console.error(
        `[aging-stock-job] Failed to create offer for ${product.name}:`,
        err.message
      );
    }
  }

  console.log(
    `[aging-stock-job] Created ${created.length} offer(s). Skipped ${skippedAlreadyCovered} already-covered product(s).`
  );

  if (created.length > 0) {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL;
    if (adminEmail) {
      try {
        await sendEmail({
          email: adminEmail,
          subject: `[Saga Elite] ${created.length} aging stock offer${
            created.length === 1 ? "" : "s"
          } created`,
          html: buildSummaryEmail({
            created,
            skippedAlreadyCovered,
            frontendUrl: process.env.FRONTEND_URL,
          }),
        });
      } catch (err) {
        console.error("[aging-stock-job] Failed to send admin summary email:", err.message);
      }
    } else {
      console.warn(
        "[aging-stock-job] ADMIN_EMAIL/EMAIL not configured; skipping summary email."
      );
    }
  }

  return { created, skippedAlreadyCovered };
};

const initAgingStockJob = () => {
  if (!cron) return;
  cron.schedule("0 0 * * *", checkAgingStock);
};

module.exports = { initAgingStockJob, checkAgingStock };
