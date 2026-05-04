import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { API_V1_URL as API_BASE, ORDERS_API_URL as ORDER_API_BASE } from "@/lib/api";

const loadCartFromStorage = () => {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem("saga_cart");
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
};

const saveCartToStorage = (cart) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("saga_cart", JSON.stringify(cart));
};

const initialState = {
  isLoading: false,
  cart: loadCartFromStorage(),
  userOrders: [],
  adminOrders: [],
  currentOrder: null,
  orderError: null,
  dashboardStats: null,
};

export const createOrder = createAsyncThunk(
  "/order/createOrder",
  async (orderData, thunkAPI) => {
    try {
      const response = await axios.post(`${API_BASE}/orders/create-order`, orderData, {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      const serverMsg = error?.response?.data?.message;
      const message = serverMsg || error.message || "Order creation failed";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const fetchUserOrders = createAsyncThunk(
  "/order/fetchUserOrders",
  async (_, thunkAPI) => {
    try {
      const response = await axios.get(`${API_BASE}/orders/user-orders`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      const serverMsg = error?.response?.data?.message;
      const message = serverMsg || error.message || "Failed to fetch user orders";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const fetchAdminOrders = createAsyncThunk(
  "/order/fetchAdminOrders",
  async (_, thunkAPI) => {
    try {
      const response = await axios.get(`${API_BASE}/orders/get-all-orders`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      const serverMsg = error?.response?.data?.message;
      const message = serverMsg || error.message || "Failed to fetch admin orders";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const fetchOrderById = createAsyncThunk(
  "/order/fetchOrderById",
  async (orderId, thunkAPI) => {
    try {
      const response = await axios.get(`${API_BASE}/orders/get-order/${orderId}`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      const serverMsg = error?.response?.data?.message;
      const message = serverMsg || error.message || "Failed to fetch order details";
      return thunkAPI.rejectWithValue(message);
    }
  }
);


export const fetchDashboardStats = createAsyncThunk(
  "order/fetchDashboardStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE}/orders/dashboard-stats`, { withCredentials: true });
      return response.data.data;
    } catch (error) {
      if (error.response && error.response.data.message) {
        return rejectWithValue(error.response.data.message);
      } else {
        return rejectWithValue(error.message);
      }
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  "/order/updateOrderStatus",
  async ({ orderId, status }, thunkAPI) => {
    try {
      const response = await axios.put(
        `${ORDER_API_BASE}/${orderId}/status`,
        { status },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      return response.data;
    } catch (error) {
      const serverMsg = error?.response?.data?.message;
      const message = serverMsg || error.message || "Failed to update order status";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const item = action.payload;
      const existingIndex = state.cart.findIndex(
        (cartItem) =>
          cartItem.productId === item.productId && cartItem.variantSku === item.variantSku,
      );

      if (existingIndex !== -1) {
        state.cart[existingIndex].quantity += item.quantity;
      } else {
        state.cart.push(item);
      }

      saveCartToStorage(state.cart);
    },
    removeFromCart: (state, action) => {
      state.cart = state.cart.filter((item) => item.cartId !== action.payload);
      saveCartToStorage(state.cart);
    },
    updateCartItemQuantity: (state, action) => {
      const { cartId, quantity } = action.payload;
      const cartItem = state.cart.find((item) => item.cartId === cartId);
      if (cartItem) {
        cartItem.quantity = quantity;
      }
      state.cart = state.cart.filter((item) => item.quantity > 0);
      saveCartToStorage(state.cart);
    },
    clearCart: (state) => {
      state.cart = [];
      saveCartToStorage(state.cart);
    },
    resetOrderError: (state) => {
      state.orderError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.pending, (state) => {
        state.isLoading = true;
        state.orderError = null;
      })
      .addCase(createOrder.fulfilled, (state) => {
        state.isLoading = false;
        state.cart = [];
        saveCartToStorage(state.cart);
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.orderError = action.payload || action.error.message;
      })
      .addCase(fetchUserOrders.pending, (state) => {
        state.isLoading = true;
        state.orderError = null;
      })
      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userOrders = action.payload.data;
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.orderError = action.payload || action.error.message;
      })
      .addCase(fetchAdminOrders.pending, (state) => {
        state.isLoading = true;
        state.orderError = null;
      })
      .addCase(fetchAdminOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.adminOrders = action.payload.data;
      })
      .addCase(fetchAdminOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.orderError = action.payload || action.error.message;
      })
      .addCase(updateOrderStatus.pending, (state) => {
        state.isLoading = true;
        state.orderError = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedOrder = action.payload.data;
        state.adminOrders = state.adminOrders.map((order) =>
          order._id === updatedOrder._id ? updatedOrder : order,
        );
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.orderError = action.payload || action.error.message;
      })
      .addCase(fetchOrderById.pending, (state) => {
        state.isLoading = true;
        state.orderError = null;
        state.currentOrder = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentOrder = action.payload.data;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.isLoading = false;
        state.orderError = action.payload || action.error.message;
      })
      .addCase(fetchDashboardStats.pending, (state) => {
        state.isLoading = true;
        state.orderError = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboardStats = action.payload;
        state.orderError = null;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.isLoading = false;
        state.orderError = action.payload || action.error.message;
      });
  },
});

export const { addToCart, removeFromCart, updateCartItemQuantity, clearCart, resetOrderError } = orderSlice.actions;
export default orderSlice.reducer;
