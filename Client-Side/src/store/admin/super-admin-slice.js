import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE = `${import.meta.env.VITE_API_URL || "http://localhost:5001/api"}/v1/super-admin`;

export const fetchAdmins = createAsyncThunk("superAdmin/fetchAdmins", async (_, thunkAPI) => {
  try {
    const res = await axios.get(`${API_BASE}/admins`, { withCredentials: true });
    return res.data.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to fetch admins");
  }
});

export const createAdmin = createAsyncThunk("superAdmin/createAdmin", async (adminData, thunkAPI) => {
  try {
    const res = await axios.post(`${API_BASE}/admins`, adminData, { withCredentials: true });
    return res.data.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to create admin");
  }
});

export const toggleAdminStatus = createAsyncThunk("superAdmin/toggleAdminStatus", async (adminId, thunkAPI) => {
  try {
    const state = thunkAPI.getState();
    const admin = state.superAdmin.admins.find((a) => a._id === adminId);
    if (!admin) throw new Error("Admin not found in state");

    const res = await axios.patch(
      `${API_BASE}/admins/${adminId}/deactivate`,
      { isActive: !admin.isActive },
      { withCredentials: true }
    );
    return res.data.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to update admin status");
  }
});

export const fetchActivityLogs = createAsyncThunk("superAdmin/fetchActivityLogs", async ({ page = 1, limit = 20 } = {}, thunkAPI) => {
  try {
    const res = await axios.get(`${API_BASE}/logs?page=${page}&limit=${limit}`, {
      withCredentials: true,
    });
    return res.data.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to fetch logs");
  }
});

const superAdminSlice = createSlice({
  name: "superAdmin",
  initialState: {
    admins: [],
    adminsLoading: false,
    adminsError: null,
    createLoading: false,
    createError: null,
    createSuccess: false,
    toggleLoading: null,
    toggleError: null,
    activityLogs: [],
    logsLoading: false,
    logsPagination: { page: 1, total: 0, pages: 1, limit: 20 },
  },
  reducers: {
    clearCreateStatus(state) {
      state.createSuccess = false;
      state.createError = null;
    },
  },
  extraReducers: (builder) => {
    // fetchAdmins
    builder
      .addCase(fetchAdmins.pending, (state) => { state.adminsLoading = true; })
      .addCase(fetchAdmins.fulfilled, (state, action) => {
        state.adminsLoading = false;
        state.admins = action.payload.admins || action.payload;
      })
      .addCase(fetchAdmins.rejected, (state, action) => {
        state.adminsLoading = false;
        state.adminsError = action.payload;
      });

    // createAdmin
    builder
      .addCase(createAdmin.pending, (state) => { state.createLoading = true; state.createError = null; state.createSuccess = false; })
      .addCase(createAdmin.fulfilled, (state, action) => {
        state.createLoading = false;
        state.createSuccess = true;
        state.admins.unshift(action.payload.admin || action.payload);
      })
      .addCase(createAdmin.rejected, (state, action) => {
        state.createLoading = false;
        state.createError = action.payload;
      });

    // toggleAdminStatus
    builder
      .addCase(toggleAdminStatus.pending, (state, action) => { state.toggleLoading = action.meta.arg; })
      .addCase(toggleAdminStatus.fulfilled, (state, action) => {
        state.toggleLoading = null;
        const updated = action.payload.admin || action.payload;
        const idx = state.admins.findIndex((a) => a._id === updated._id);
        if (idx !== -1) state.admins[idx] = updated;
      })
      .addCase(toggleAdminStatus.rejected, (state, action) => {
        state.toggleLoading = null;
        state.toggleError = action.payload;
      });

    // fetchActivityLogs
    builder
      .addCase(fetchActivityLogs.pending, (state) => { state.logsLoading = true; })
      .addCase(fetchActivityLogs.fulfilled, (state, action) => {
        state.logsLoading = false;
        state.activityLogs = action.payload.logs || action.payload;
        if (action.payload.pagination) state.logsPagination = action.payload.pagination;
      })
      .addCase(fetchActivityLogs.rejected, (state, action) => { state.logsLoading = false; });
  },
});

export const { clearCreateStatus } = superAdminSlice.actions;
export default superAdminSlice.reducer;