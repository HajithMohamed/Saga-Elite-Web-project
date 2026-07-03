import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

const initialState = {
  cart: {
    items: [],
    totalPrice: 0,
    totalQuantity: 0,
    isLoading: false,
    error: null,
  },
  wishlist: {
    items: [],
    isLoading: false,
    error: null,
  },
};

const unwrapAxiosError = (error) => {
  const serverMsg = error?.response?.data?.message;
  return serverMsg || error.message || "Request failed";
};

export const fetchCartAction = createAsyncThunk(
  "cart/fetchCart",
  async (_, thunkAPI) => {
    try {
      const response = await axiosInstance.get(`/user/cart`);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(unwrapAxiosError(error));
    }
  }
);

export const addToCartAction = createAsyncThunk(
  "cart/addToCart",
  async ({ productId, variantId, quantity }, thunkAPI) => {
    try {
      const response = await axiosInstance.post(`/user/cart`, {
        productId,
        variantId,
        quantity,
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(unwrapAxiosError(error));
    }
  }
);

export const updateCartItemAction = createAsyncThunk(
  "cart/updateCartItem",
  async ({ itemId, quantity, variantId }, thunkAPI) => {
    try {
      const payload = {};

      if (quantity !== null && quantity !== undefined) {
        payload.quantity = quantity;
      }

      if (variantId) {
        payload.variantId = variantId;
      }

      const response = await axiosInstance.patch(
        `/user/cart/${itemId}`,
        payload
      );
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(unwrapAxiosError(error));
    }
  }
);

export const removeFromCartAction = createAsyncThunk(
  "cart/removeFromCart",
  async (itemId, thunkAPI) => {
    try {
      const response = await axiosInstance.delete(`/user/cart/${itemId}`);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(unwrapAxiosError(error));
    }
  }
);

export const fetchWishlistAction = createAsyncThunk(
  "cart/fetchWishlist",
  async (_, thunkAPI) => {
    try {
      const response = await axiosInstance.get(`/user/wishlist`);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(unwrapAxiosError(error));
    }
  }
);

export const addToWishlistAction = createAsyncThunk(
  "cart/addToWishlist",
  async ({ productId }, thunkAPI) => {
    try {
      const response = await axiosInstance.post(`/user/wishlist`, {
        productId,
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(unwrapAxiosError(error));
    }
  }
);

export const removeFromWishlistAction = createAsyncThunk(
  "cart/removeFromWishlist",
  async (productId, thunkAPI) => {
    try {
      const response = await axiosInstance.delete(
        `/user/wishlist/${productId}`
      );
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(unwrapAxiosError(error));
    }
  }
);

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCartAction.pending, (state) => {
        state.cart.isLoading = true;
        state.cart.error = null;
      })
      .addCase(fetchCartAction.fulfilled, (state, action) => {
        state.cart.isLoading = false;
        state.cart.items = action.payload.data.cart || [];
        state.cart.totalQuantity = action.payload.data.totalQuantity || 0;
        state.cart.totalPrice = action.payload.data.totalPrice || 0;
      })
      .addCase(fetchCartAction.rejected, (state, action) => {
        state.cart.isLoading = false;
        state.cart.error = action.payload;
      })
      .addCase(addToCartAction.pending, (state) => {
        state.cart.isLoading = true;
        state.cart.error = null;
      })
      .addCase(addToCartAction.fulfilled, (state, action) => {
        state.cart.isLoading = false;
        state.cart.items = action.payload.data.cart || [];
        state.cart.totalQuantity = action.payload.data.cart.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        state.cart.totalPrice = action.payload.data.cart.reduce(
          (sum, item) => sum + (item.subTotal || 0),
          0
        );
      })
      .addCase(addToCartAction.rejected, (state, action) => {
        state.cart.isLoading = false;
        state.cart.error = action.payload;
      })
      .addCase(updateCartItemAction.pending, (state) => {
        state.cart.isLoading = true;
        state.cart.error = null;
      })
      .addCase(updateCartItemAction.fulfilled, (state, action) => {
        state.cart.isLoading = false;
        state.cart.items = action.payload.data.cart || [];
        state.cart.totalQuantity = action.payload.data.cart.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        state.cart.totalPrice = action.payload.data.cart.reduce(
          (sum, item) => sum + (item.subTotal || 0),
          0
        );
      })
      .addCase(updateCartItemAction.rejected, (state, action) => {
        state.cart.isLoading = false;
        state.cart.error = action.payload;
      })
      .addCase(removeFromCartAction.pending, (state) => {
        state.cart.isLoading = true;
        state.cart.error = null;
      })
      .addCase(removeFromCartAction.fulfilled, (state, action) => {
        state.cart.isLoading = false;
        state.cart.items = action.payload.data.cart || [];
        state.cart.totalQuantity = action.payload.data.cart.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        state.cart.totalPrice = action.payload.data.cart.reduce(
          (sum, item) => sum + (item.subTotal || 0),
          0
        );
      })
      .addCase(removeFromCartAction.rejected, (state, action) => {
        state.cart.isLoading = false;
        state.cart.error = action.payload;
      })
      .addCase(fetchWishlistAction.pending, (state) => {
        state.wishlist.isLoading = true;
        state.wishlist.error = null;
      })
      .addCase(fetchWishlistAction.fulfilled, (state, action) => {
        state.wishlist.isLoading = false;
        state.wishlist.items = action.payload.data.wishlist || [];
      })
      .addCase(fetchWishlistAction.rejected, (state, action) => {
        state.wishlist.isLoading = false;
        state.wishlist.error = action.payload;
      })
      .addCase(addToWishlistAction.pending, (state) => {
        state.wishlist.isLoading = true;
        state.wishlist.error = null;
      })
      .addCase(addToWishlistAction.fulfilled, (state, action) => {
        state.wishlist.isLoading = false;
        state.wishlist.items = action.payload.data.wishlist || state.wishlist.items;
      })
      .addCase(addToWishlistAction.rejected, (state, action) => {
        state.wishlist.isLoading = false;
        state.wishlist.error = action.payload;
      })
      .addCase(removeFromWishlistAction.pending, (state) => {
        state.wishlist.isLoading = true;
        state.wishlist.error = null;
      })
      .addCase(removeFromWishlistAction.fulfilled, (state, action) => {
        state.wishlist.isLoading = false;
        state.wishlist.items = action.payload.data.wishlist || [];
      })
      .addCase(removeFromWishlistAction.rejected, (state, action) => {
        state.wishlist.isLoading = false;
        state.wishlist.error = action.payload;
      });
  },
});

export default cartSlice.reducer;
