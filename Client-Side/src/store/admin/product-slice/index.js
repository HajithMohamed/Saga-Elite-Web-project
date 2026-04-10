import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE = `${import.meta.env.VITE_API_URL}/v1`;

const initialState = {
  isLoading: false,
  isSubmitting: false,
  productList: [],
  productMeta: {
    total: 0,
    page: 1,
    limit: 50,
  },
  error: null,
};

export const getAllProducts = createAsyncThunk(
  "/product/getAllProducts",
  async ({ page = 1, limit = 50, isActive = "all" } = {}, thunkAPI) => {
    try {
      const response = await axios.get(`${API_BASE}/products/get-all-products`, {
        params: { page, limit, isActive },
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      const serverMsg = error?.response?.data?.message;
      const message = serverMsg || error.message || "Unable to fetch products";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const createProduct = createAsyncThunk(
  "/product/createProduct",
  async (productData, thunkAPI) => {
    try {
      const response = await axios.post(`${API_BASE}/products/add-product`, productData, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      const serverMsg = error?.response?.data?.message;
      const message = serverMsg || error.message || "Unable to create product";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const updateProduct = createAsyncThunk(
  "/product/updateProduct",
  async ({ slug, productData }, thunkAPI) => {
    try {
      const response = await axios.patch(`${API_BASE}/products/update-product/${slug}`, productData, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      const serverMsg = error?.response?.data?.message;
      const message = serverMsg || error.message || "Unable to update product";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const deleteProduct = createAsyncThunk(
  "/product/deleteProduct",
  async (slug, thunkAPI) => {
    try {
      const response = await axios.delete(`${API_BASE}/products/delete-product/${slug}`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      const serverMsg = error?.response?.data?.message;
      const message = serverMsg || error.message || "Unable to delete product";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const adminProductSlice = createSlice({
  name: "product",
  initialState,
  reducers: {
    resetProductError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.productList = action.payload.data || [];
        state.productMeta = {
          total: action.payload.total || 0,
          page: action.payload.page || 1,
          limit: action.payload.limit || 50,
        };
      })
      .addCase(getAllProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.productList = [];
        state.error = action.payload || action.error.message;
      })
      .addCase(createProduct.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state) => {
        state.isSubmitting = false;
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(updateProduct.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state) => {
        state.isSubmitting = false;
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(deleteProduct.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(deleteProduct.fulfilled, (state) => {
        state.isSubmitting = false;
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { resetProductError } = adminProductSlice.actions;
export default adminProductSlice.reducer;
