import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { API_V1_URL as API_BASE } from "@/lib/api";

const defaultPagination = {
  total: 0,
  page: 1,
  limit: 10,
  results: 0,
  totalPages: 1,
  next: null,
  previous: null,
};

const initialState = {
  users: [],
  stats: null,
  pagination: defaultPagination,
  selectedUser: null,
  isListLoading: false,
  isDetailLoading: false,
  isMutating: false,
  error: null,
};

export const fetchAdminUsers = createAsyncThunk(
  "adminUsers/fetchAll",
  async (params = {}, thunkAPI) => {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        membership,
        sort,
      } = params;

      const query = new URLSearchParams();
      query.set("page", page);
      query.set("limit", limit);
      if (search) query.set("search", search);
      if (status && status !== "all") query.set("status", status);
      if (membership && membership !== "all") query.set("membership", membership);
      if (sort) query.set("sort", sort);

      const response = await axios.get(`${API_BASE}/user/admin/users?${query.toString()}`, {
        withCredentials: true,
      });
      return response.data.data;
    } catch (error) {
      const serverMsg = error?.response?.data?.message;
      const message = serverMsg || error.message || "Failed to load customers";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const fetchAdminUserDetail = createAsyncThunk(
  "adminUsers/fetchDetail",
  async (userId, thunkAPI) => {
    try {
      const response = await axios.get(`${API_BASE}/user/admin/users/${userId}`, {
        withCredentials: true,
      });
      return response.data.data;
    } catch (error) {
      const serverMsg = error?.response?.data?.message;
      const message = serverMsg || error.message || "Failed to load customer detail";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const updateAdminUserStatus = createAsyncThunk(
  "adminUsers/updateStatus",
  async ({ userId, isActive, membership, tags, addAdminNote }, thunkAPI) => {
    try {
      const body = {};
      if (typeof isActive === "boolean") body.isActive = isActive;
      if (typeof membership === "string") body.membership = membership;
      if (Array.isArray(tags)) body.tags = tags;
      if (typeof addAdminNote === "string" && addAdminNote.trim()) {
        body.addAdminNote = addAdminNote.trim();
      }

      const response = await axios.patch(
        `${API_BASE}/user/admin/users/${userId}/status`,
        body,
        { withCredentials: true }
      );
      return response.data.data;
    } catch (error) {
      const serverMsg = error?.response?.data?.message;
      const message = serverMsg || error.message || "Failed to update customer";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const triggerAdminPasswordReset = createAsyncThunk(
  "adminUsers/triggerPasswordReset",
  async (userId, thunkAPI) => {
    try {
      const response = await axios.post(
        `${API_BASE}/user/admin/users/${userId}/reset-password`,
        {},
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      const serverMsg = error?.response?.data?.message;
      const message = serverMsg || error.message || "Failed to send customer password reset";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const deleteAdminUser = createAsyncThunk(
  "adminUsers/delete",
  async (userId, thunkAPI) => {
    try {
      const response = await axios.delete(`${API_BASE}/user/admin/users/${userId}`, {
        withCredentials: true,
      });
      return response.data.data;
    } catch (error) {
      const serverMsg = error?.response?.data?.message;
      const message = serverMsg || error.message || "Failed to delete customer";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const bulkTagUsers = createAsyncThunk(
  "adminUsers/bulkTag",
  async ({ ids, tag, mode }, thunkAPI) => {
    try {
      const response = await axios.patch(
        `${API_BASE}/user/admin/users/bulk/tag`,
        { ids, tag, mode },
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      const serverMsg = error?.response?.data?.message;
      const message = serverMsg || error.message || "Failed to bulk-tag customers";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const syncUserInList = (users, nextUser) =>
  users.map((user) => (user._id === nextUser._id ? nextUser : user));

const adminUserSlice = createSlice({
  name: "adminUsers",
  initialState,
  reducers: {
    clearSelectedAdminUser: (state) => {
      state.selectedUser = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminUsers.pending, (state) => {
        state.isListLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.isListLoading = false;
        state.users = action.payload.users || [];
        state.stats = action.payload.stats || null;
        state.pagination = {
          ...defaultPagination,
          ...(action.payload.pagination || {}),
        };
      })
      .addCase(fetchAdminUsers.rejected, (state, action) => {
        state.isListLoading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchAdminUserDetail.pending, (state) => {
        state.isDetailLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminUserDetail.fulfilled, (state, action) => {
        state.isDetailLoading = false;
        state.selectedUser = action.payload;
        state.users = syncUserInList(state.users, action.payload);
      })
      .addCase(fetchAdminUserDetail.rejected, (state, action) => {
        state.isDetailLoading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(updateAdminUserStatus.pending, (state) => {
        state.isMutating = true;
        state.error = null;
      })
      .addCase(updateAdminUserStatus.fulfilled, (state, action) => {
        state.isMutating = false;
        state.users = syncUserInList(state.users, action.payload);
        if (state.selectedUser?._id === action.payload._id) {
          state.selectedUser = {
            ...state.selectedUser,
            ...action.payload,
          };
        }
      })
      .addCase(updateAdminUserStatus.rejected, (state, action) => {
        state.isMutating = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(deleteAdminUser.pending, (state) => {
        state.isMutating = true;
        state.error = null;
      })
      .addCase(deleteAdminUser.fulfilled, (state, action) => {
        state.isMutating = false;
        state.users = state.users.filter((user) => user._id !== action.payload._id);
        if (state.selectedUser?._id === action.payload._id) {
          state.selectedUser = null;
        }
      })
      .addCase(deleteAdminUser.rejected, (state, action) => {
        state.isMutating = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { clearSelectedAdminUser } = adminUserSlice.actions;

export default adminUserSlice.reducer;
