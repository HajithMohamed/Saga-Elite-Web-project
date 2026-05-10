import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_V1_URL } from "@/lib/api";

const API_BASE = `${API_V1_URL}/super-admin`;

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

export const updateAdminRole = createAsyncThunk(
  "superAdmin/updateAdminRole",
  async ({ adminId, role, subRole }, thunkAPI) => {
    try {
      const res = await axios.patch(
        `${API_BASE}/admins/${adminId}/role`,
        { role, subRole },
        { withCredentials: true }
      );
      return res.data.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to update admin role");
    }
  }
);

export const updateAdminPermissions = createAsyncThunk(
  "superAdmin/updateAdminPermissions",
  async ({ adminId, permissions }, thunkAPI) => {
    try {
      const res = await axios.patch(
        `${API_BASE}/admins/${adminId}/permissions`,
        { permissions },
        { withCredentials: true }
      );
      return res.data.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to update permissions");
    }
  }
);

export const deleteAdmin = createAsyncThunk(
  "superAdmin/deleteAdmin",
  async (adminId, thunkAPI) => {
    try {
      const res = await axios.delete(`${API_BASE}/admins/${adminId}`, {
        withCredentials: true,
      });
      return { adminId, ...(res.data.data || {}) };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to delete admin");
    }
  }
);

export const resetAdminPassword = createAsyncThunk(
  "superAdmin/resetAdminPassword",
  async (adminId, thunkAPI) => {
    try {
      const res = await axios.post(
        `${API_BASE}/admins/${adminId}/reset-password`,
        {},
        { withCredentials: true }
      );
      // Returns { adminId, email, temporaryPassword } — caller surfaces the
      // plaintext in the UI exactly once. Don't persist this in Redux state.
      return res.data.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to reset password");
    }
  }
);

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
    lastCreatedMailSent: null,
    toggleLoading: null,
    toggleError: null,
    editLoading: false,
    editError: null,
    deleteLoading: null,
    deleteError: null,
    resetLoading: null,
    resetError: null,
    activityLogs: [],
    logsLoading: false,
    logsPagination: { page: 1, total: 0, pages: 1, limit: 20 },
  },
  reducers: {
    clearCreateStatus(state) {
      state.createSuccess = false;
      state.createError = null;
      state.lastCreatedMailSent = null;
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
      .addCase(createAdmin.pending, (state) => {
        state.createLoading = true;
        state.createError = null;
        state.createSuccess = false;
        state.lastCreatedMailSent = null;
      })
      .addCase(createAdmin.fulfilled, (state, action) => {
        state.createLoading = false;
        state.createSuccess = true;
        state.admins.unshift(action.payload.admin || action.payload);
        state.lastCreatedMailSent = action.payload.mailSent ?? null;
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

    // updateAdminRole + updateAdminPermissions — both replace the row in-place.
    const handleAdminUpdate = (state, action) => {
      state.editLoading = false;
      const updated = action.payload?.admin || action.payload;
      if (!updated?._id) return;
      const idx = state.admins.findIndex((a) => a._id === updated._id);
      if (idx !== -1) state.admins[idx] = { ...state.admins[idx], ...updated };
    };

    builder
      .addCase(updateAdminRole.pending, (state) => {
        state.editLoading = true;
        state.editError = null;
      })
      .addCase(updateAdminRole.fulfilled, handleAdminUpdate)
      .addCase(updateAdminRole.rejected, (state, action) => {
        state.editLoading = false;
        state.editError = action.payload;
      });

    builder
      .addCase(updateAdminPermissions.pending, (state) => {
        state.editLoading = true;
        state.editError = null;
      })
      .addCase(updateAdminPermissions.fulfilled, handleAdminUpdate)
      .addCase(updateAdminPermissions.rejected, (state, action) => {
        state.editLoading = false;
        state.editError = action.payload;
      });

    // deleteAdmin — splice the row out on success.
    builder
      .addCase(deleteAdmin.pending, (state, action) => {
        state.deleteLoading = action.meta.arg;
        state.deleteError = null;
      })
      .addCase(deleteAdmin.fulfilled, (state, action) => {
        state.deleteLoading = null;
        const id = action.payload?.adminId || action.meta.arg;
        state.admins = state.admins.filter((a) => a._id !== id);
      })
      .addCase(deleteAdmin.rejected, (state, action) => {
        state.deleteLoading = null;
        state.deleteError = action.payload;
      });

    // resetAdminPassword — track loading per-admin id; UI displays the
    // returned plaintext in the modal then drops it.
    builder
      .addCase(resetAdminPassword.pending, (state, action) => {
        state.resetLoading = action.meta.arg;
        state.resetError = null;
      })
      .addCase(resetAdminPassword.fulfilled, (state) => {
        state.resetLoading = null;
      })
      .addCase(resetAdminPassword.rejected, (state, action) => {
        state.resetLoading = null;
        state.resetError = action.payload;
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
