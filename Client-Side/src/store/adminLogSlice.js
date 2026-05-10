import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { API_V1_URL as API_BASE } from "@/lib/api";

const DEFAULT_FILTERS = Object.freeze({
  from: "",
  to: "",
  category: "",
  method: "",
  adminId: "",
  q: "",
});

const initialState = {
  logs: [],
  pagination: { total: 0, page: 1, pages: 1, limit: 50 },
  filters: { ...DEFAULT_FILTERS },
  loading: false,
  error: null,
};

const unwrapError = (error, fallback) =>
  error?.response?.data?.message || error.message || fallback;

const compactParams = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== "" && v != null));

export const fetchActivityFeed = createAsyncThunk(
  "adminLog/fetch",
  async ({ filters = {}, page = 1, limit = 50 } = {}, thunkAPI) => {
    try {
      const response = await axios.get(`${API_BASE}/admin/activity`, {
        withCredentials: true,
        params: compactParams({ ...filters, page, limit }),
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(unwrapError(error, "Failed to load activity"));
    }
  }
);

const adminLogSlice = createSlice({
  name: "adminLog",
  initialState,
  reducers: {
    setFilter: (state, action) => {
      const { key, value } = action.payload || {};
      if (!key) return;
      state.filters[key] = value;
    },
    clearFilters: (state) => {
      state.filters = { ...DEFAULT_FILTERS };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivityFeed.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActivityFeed.fulfilled, (state, action) => {
        state.loading = false;
        state.logs = action.payload?.data?.logs || [];
        state.pagination = action.payload?.pagination || initialState.pagination;
      })
      .addCase(fetchActivityFeed.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message || "Failed to load activity";
      });
  },
});

export const { setFilter, clearFilters } = adminLogSlice.actions;
export default adminLogSlice.reducer;
