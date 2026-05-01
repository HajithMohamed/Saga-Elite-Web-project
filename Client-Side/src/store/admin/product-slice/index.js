import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/v1`
  : "http://localhost:5001/api/v1";

const initialState = {
  productList: [],
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    results: 0,
    next: null,
    previous: null,
  },
  isLoading: false,
  isSubmitting: false,
  error: null,
};

const normalizeRealtimeProductPayload = (payload = {}) => {
  const productId = payload.productId || payload._id || payload.id;

  if (!productId) {
    return null;
  }

  const changes = payload.changes || {};

  return {
    productId: String(productId),
    changes: {
      ...(changes.basePrice != null || payload.basePrice != null || payload.price != null
        ? {
            basePrice:
              changes.basePrice ??
              payload.basePrice ??
              payload.price,
          }
        : {}),
      ...(changes.discountPercent != null ||
      payload.discountPercent != null ||
      payload.discount != null
        ? {
            discountPercent:
              changes.discountPercent ??
              payload.discountPercent ??
              payload.discount,
          }
        : {}),
      ...(changes.variants || payload.variants
        ? {
            variants: changes.variants || payload.variants,
          }
        : {}),
      ...(changes.drop !== undefined || payload.drop !== undefined
        ? {
            drop:
              changes.drop !== undefined ? changes.drop : payload.drop,
          }
        : {}),
      ...(payload.slug ? { slug: payload.slug } : {}),
    },
  };
};

export const getAllProducts = createAsyncThunk(
  "product/getAllProducts",
  async (params = {}, { rejectWithValue }) => {
    try {
      const {
        page = 1,
        limit = 10,
        isActive,
        search,
        sort,
        brand,
        category,
        drop,
        minPrice,
        maxPrice,
        size,
        color,
      } = params;

      const query = new URLSearchParams();
      query.set("page", page);
      query.set("limit", limit);
      if (isActive !== undefined && isActive !== "all") query.set("isActive", isActive);
      if (search) query.set("search", search);
      if (sort) query.set("sort", sort);
      if (brand) query.set("brand", brand);
      if (category) query.set("category", category);
      if (drop) query.set("drop", drop);
      if (minPrice) query.set("minPrice", minPrice);
      if (maxPrice) query.set("maxPrice", maxPrice);
      if (size) query.set("size", size);
      if (color) query.set("color", color);

      const response = await axios.get(
        `${API_BASE}/products/get-all-products?${query.toString()}`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getSingleProduct = createAsyncThunk(
  "product/getSingleProduct",
  async (slug, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_BASE}/products/get-single-product/${slug}`,
        { withCredentials: true }
      );
      return response.data.product;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createProduct = createAsyncThunk(
  "product/createProduct",
  async (productData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_BASE}/products/add-product`,
        productData,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateProduct = createAsyncThunk(
  "product/updateProduct",
  async ({ slug, productData }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${API_BASE}/products/update-product/${slug}`,
        productData,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteProduct = createAsyncThunk(
  "product/deleteProduct",
  async (slug, { rejectWithValue }) => {
    try {
      const response = await axios.delete(
        `${API_BASE}/products/delete-product/${slug}`,
        { withCredentials: true }
      );
      return response.data.deletedProductSlug || slug;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const productSlice = createSlice({
  name: "product",
  initialState,
  reducers: {
    updateProductInStore: (state, action) => {
      const normalizedPayload = normalizeRealtimeProductPayload(action.payload);
      if (!normalizedPayload) {
        return;
      }

      const { productId, changes } = normalizedPayload;
      const idx = state.productList.findIndex((p) => String(p._id) === productId);
      if (idx !== -1) {
        state.productList[idx] = { ...state.productList[idx], ...changes };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // GET ALL
      .addCase(getAllProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.productList = action.payload.data ?? [];
        state.pagination = {
          total: action.payload.total ?? 0,
          page: action.payload.page ?? 1,
          limit: action.payload.limit ?? 10,
          results: action.payload.results ?? 0,
          next: action.payload.next ?? null,
          previous: action.payload.previous ?? null,
        };
      })
      .addCase(getAllProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // CREATE
      .addCase(createProduct.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.isSubmitting = false;
        if (action.payload.product) {
          state.productList.unshift(action.payload.product);
          state.pagination.total += 1;
        }
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload;
      })
      // UPDATE
      .addCase(updateProduct.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.isSubmitting = false;
        if (action.payload.product) {
          const index = state.productList.findIndex(
            (p) => p.slug === action.payload.product.slug
          );
          if (index !== -1) {
            state.productList[index] = action.payload.product;
          }
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload;
      })
      // DELETE
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.productList = state.productList.filter(
          (p) => p.slug !== action.payload
        );
        state.pagination.total -= 1;
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { updateProductInStore } = productSlice.actions;

export default productSlice.reducer;
