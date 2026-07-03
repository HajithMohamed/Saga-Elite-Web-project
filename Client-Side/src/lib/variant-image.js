/**
 * Resolve the storefront thumbnail for a product + selected variant color.
 * Prefers an image whose colorTag matches the variant's color, then the
 * product's primary/first image, then the site logo placeholder.
 *
 * Mirrors the backend snapshot logic in order-controller (orderItems[].productImage).
 */
export const getVariantImage = (product, variantColor, fallback = "/LOGO.png") => {
  if (variantColor && Array.isArray(product?.images)) {
    const colorKey = String(variantColor).trim().toLowerCase();
    const matched = product.images.find(
      (img) => String(img?.colorTag || "").trim().toLowerCase() === colorKey
    );
    if (matched?.url) return matched.url;
  }
  return product?.image || product?.images?.[0]?.url || fallback;
};

export default getVariantImage;
