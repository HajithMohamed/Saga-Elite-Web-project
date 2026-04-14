import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE = `${import.meta.env.VITE_API_URL}/v1`;

const unwrapAxiosError = (error) => {
  const serverMsg = error?.response?.data?.message;
  return serverMsg || error.message || "Request failed";
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

const initialState = {
  items: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
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
        const updated = action.payload.data;
        state.items = state.items.map((notification) =>
          notification._id === updated._id ? updated : notification,
        );
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
      });
  },
});

export const { resetNotificationError } = notificationSlice.actions;
export default notificationSlice.reducer;
