import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  byId: {},
};

const getNormalizedNumber = (primaryValue, fallbackValue) => {
  if (primaryValue != null) {
    return Number(primaryValue);
  }

  if (fallbackValue != null) {
    return Number(fallbackValue);
  }

  return undefined;
};

export const normalizeLiveProductUpdate = (payload = {}) => {
  const productId = payload.productId || payload._id || payload.id;

  if (!productId) {
    return null;
  }

  return {
    productId: String(productId),
    basePrice: getNormalizedNumber(payload.basePrice, payload.price),
    discountPercent: getNormalizedNumber(payload.discountPercent, payload.discount),
    variants: Array.isArray(payload.variants) ? payload.variants : undefined,
    drop: payload.drop,
    slug: payload.slug,
    updatedAt: Date.now(),
  };
};

export const applyLiveProductUpdate = (product, payload) => {
  const normalizedUpdate = normalizeLiveProductUpdate(payload);

  if (!product || !normalizedUpdate) {
    return product;
  }

  const productId = String(product._id || product.id || "");
  if (productId !== normalizedUpdate.productId) {
    return product;
  }

  const nextBasePrice =
    normalizedUpdate.basePrice != null
      ? normalizedUpdate.basePrice
      : product.basePrice;
  const nextDiscountPercent =
    normalizedUpdate.discountPercent != null
      ? normalizedUpdate.discountPercent
      : product.discountPercent;
  const nextVariants = normalizedUpdate.variants || product.variants;
  const nextDrop =
    normalizedUpdate.drop !== undefined ? normalizedUpdate.drop : product.drop;

  const hasChanges =
    nextBasePrice !== product.basePrice ||
    nextDiscountPercent !== product.discountPercent ||
    nextVariants !== product.variants ||
    nextDrop !== product.drop;

  if (!hasChanges) {
    return product;
  }

  return {
    ...product,
    basePrice: nextBasePrice,
    discountPercent: nextDiscountPercent,
    variants: nextVariants,
    drop: nextDrop,
  };
};

const liveProductSlice = createSlice({
  name: "liveProduct",
  initialState,
  reducers: {
    receiveLiveProductUpdate: (state, action) => {
      const normalizedUpdate = normalizeLiveProductUpdate(action.payload);

      if (!normalizedUpdate) {
        return;
      }

      state.byId[normalizedUpdate.productId] = normalizedUpdate;
    },
  },
});

export const { receiveLiveProductUpdate } = liveProductSlice.actions;

export default liveProductSlice.reducer;
