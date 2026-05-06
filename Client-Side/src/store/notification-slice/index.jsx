import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { API_V1_URL as API_BASE } from "@/lib/api";

const unwrapAxiosError = (error) => {
  const serverMsg = error?.response?.data?.message;
  return serverMsg || error.message || "Request failed";
};

const extractNotification = (payload) => {
  if (!payload) return null;
  return payload.data?.notification || payload.data || payload.notification || null;
};

export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  async (_, thunkAPI) => {
    try {
      const response = await axios.get(`${API_BASE}/notifications`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(unwrapAxiosError(error));
    }
  },
);

export const markNotificationRead = createAsyncThunk(
  "notifications/markNotificationRead",
  async (notificationId, thunkAPI) => {
    try {
      const response = await axios.patch(
        `${API_BASE}/notifications/${notificationId}/read`,
        {},
        { withCredentials: true },
      );
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(unwrapAxiosError(error));
    }
  },
);

export const sendAdminNotification = createAsyncThunk(
  "notifications/sendAdminNotification",
  async (payload, thunkAPI) => {
    try {
      const response = await axios.post(
        `${API_BASE}/notifications/admin-message`,
        payload,
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        },
      );
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(unwrapAxiosError(error));
    }
  },
);

export const fetchAdminNotifications = createAsyncThunk(
  "notifications/fetchAdminNotifications",
  async (params = {}, thunkAPI) => {
    try {
      const query = new URLSearchParams();

      if (params.page) query.append("page", params.page);
      if (params.limit) query.append("limit", params.limit);
      if (params.search) query.append("search", params.search);
      if (params.type) query.append("type", params.type);
      if (typeof params.isRead !== "undefined") query.append("isRead", params.isRead);
      if (params.userEmail) query.append("userEmail", params.userEmail);

      const response = await axios.get(
        `${API_BASE}/notifications/admin?${query.toString()}`,
        {
          withCredentials: true,
        },
      );
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(unwrapAxiosError(error));
    }
  },
);

export const updateAdminNotification = createAsyncThunk(
  "notifications/updateAdminNotification",
  async ({ notificationId, payload }, thunkAPI) => {
    try {
      const response = await axios.patch(
        `${API_BASE}/notifications/admin/${notificationId}`,
        payload,
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        },
      );
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(unwrapAxiosError(error));
    }
  },
);

export const deleteAdminNotification = createAsyncThunk(
  "notifications/deleteAdminNotification",
  async (notificationId, thunkAPI) => {
    try {
      const response = await axios.delete(
        `${API_BASE}/notifications/admin/${notificationId}`,
        {
          withCredentials: true,
        },
      );
      return { ...response.data, notificationId };
    } catch (error) {
      return thunkAPI.rejectWithValue(unwrapAxiosError(error));
    }
  },
);

const initialState = {
  items: [],
  unreadCount: 0,
  adminItems: [],
  adminPagination: {},
  isLoading: false,
  adminIsLoading: false,
  error: null,
  adminError: null,
};

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    resetNotificationError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.data.notifications || [];
        state.unreadCount = action.payload.data.unreadCount || 0;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const updated = extractNotification(action.payload);
        if (updated?._id) {
          state.items = state.items.map((notification) =>
            notification._id === updated._id ? updated : notification,
          );
        } else {
          const notificationId = action.meta?.arg;
          state.items = state.items.map((notification) =>
            notification._id === notificationId
              ? { ...notification, isRead: true }
              : notification,
          );
        }
        state.unreadCount = state.items.filter((item) => !item.isRead).length;
      })
      .addCase(markNotificationRead.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(sendAdminNotification.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendAdminNotification.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(sendAdminNotification.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchAdminNotifications.pending, (state) => {
        state.adminIsLoading = true;
        state.adminError = null;
      })
      .addCase(fetchAdminNotifications.fulfilled, (state, action) => {
        state.adminIsLoading = false;
        state.adminItems = action.payload.data.notifications || [];
        state.adminPagination = action.payload.data.pagination || {};
      })
      .addCase(fetchAdminNotifications.rejected, (state, action) => {
        state.adminIsLoading = false;
        state.adminError = action.payload;
      })
      .addCase(updateAdminNotification.pending, (state) => {
        state.adminIsLoading = true;
        state.adminError = null;
      })
      .addCase(updateAdminNotification.fulfilled, (state, action) => {
        state.adminIsLoading = false;
        const updated = extractNotification(action.payload);
        if (updated?._id) {
          state.adminItems = state.adminItems.map((notification) =>
            notification._id === updated._id ? updated : notification,
          );
        }
      })
      .addCase(updateAdminNotification.rejected, (state, action) => {
        state.adminIsLoading = false;
        state.adminError = action.payload;
      })
      .addCase(deleteAdminNotification.pending, (state) => {
        state.adminIsLoading = true;
        state.adminError = null;
      })
      .addCase(deleteAdminNotification.fulfilled, (state, action) => {
        state.adminIsLoading = false;
        state.adminItems = state.adminItems.filter(
          (notification) => notification._id !== action.payload.notificationId,
        );
        if (typeof state.adminPagination.totalCount === "number") {
          state.adminPagination.totalCount = Math.max(
            0,
            state.adminPagination.totalCount - 1,
          );
        }
      })
      .addCase(deleteAdminNotification.rejected, (state, action) => {
        state.adminIsLoading = false;
        state.adminError = action.payload;
      });
  },
});

export const { resetNotificationError } = notificationSlice.actions;
export default notificationSlice.reducer;
