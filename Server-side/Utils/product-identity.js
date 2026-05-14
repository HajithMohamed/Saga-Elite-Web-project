const SAFE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const ART_NO_PREFIX = "SE";
const ART_NO_RANDOM_LENGTH = 6;
const MAX_ART_NO_LENGTH = 50;
const MAX_SKU_LENGTH = 50;

const randomCode = (length) =>
  Array.from(
    { length },
    () => SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)]
  ).join("");

const normalizeCode = (value, maxLength = MAX_SKU_LENGTH) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "-")
    .replace(/[^A-Z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, maxLength);

const normalizeArtNo = (value) => normalizeCode(value, MAX_ART_NO_LENGTH);

const normalizeSku = (value) => normalizeCode(value, MAX_SKU_LENGTH);

const generateProductArtNo = () => {
  const year = String(new Date().getFullYear()).slice(-2);
  return `${ART_NO_PREFIX}-${year}${randomCode(ART_NO_RANDOM_LENGTH)}`;
};

const generateUniqueProductArtNo = async (ProductModel, { excludeId } = {}) => {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const artNo = generateProductArtNo();
    const query = { artNo };
    if (excludeId) query._id = { $ne: excludeId };

    // eslint-disable-next-line no-await-in-loop
    const existing = await ProductModel.exists(query);
    if (!existing) return artNo;
  }

  throw new Error("Unable to generate a unique product Art No");
};

const skuSegment = (value, fallback, maxLength) => {
  const normalized = normalizeSku(value).replace(/-/g, "").slice(0, maxLength);
  return normalized || fallback;
};

const buildVariantSku = (artNo, size, color, index = 0) => {
  const root = normalizeArtNo(artNo) || generateProductArtNo();
  const sizePart = skuSegment(size, "SIZE", 8);
  const colorPart = skuSegment(color, "CLR", 3);
  const suffix = index > 0 ? `-${index + 1}` : "";
  return normalizeSku(`${root}-${sizePart}-${colorPart}${suffix}`);
};

const uniqueSku = (baseSku, index, seen) => {
  let candidate = normalizeSku(baseSku) || `SKU-${index + 1}`;
  let suffix = 2;

  while (seen.has(candidate)) {
    const tail = `-${suffix}`;
    candidate = `${candidate.slice(0, MAX_SKU_LENGTH - tail.length)}${tail}`;
    suffix += 1;
  }

  seen.add(candidate);
  return candidate;
};

const assignVariantSkus = (variants = [], artNo) => {
  const seen = new Set();

  variants.forEach((variant, index) => {
    if (!variant) return;
    const baseSku =
      normalizeSku(variant.sku) ||
      buildVariantSku(artNo, variant.size, variant.color, index);
    variant.sku = uniqueSku(baseSku, index, seen);
  });

  return variants;
};

module.exports = {
  assignVariantSkus,
  buildVariantSku,
  generateProductArtNo,
  generateUniqueProductArtNo,
  normalizeArtNo,
  normalizeSku,
};
