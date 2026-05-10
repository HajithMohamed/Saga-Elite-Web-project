import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { adminGlobalSearchApi } from "@/api/adminSearchAPI";

const EMPTY_RESULTS = {
  products: [],
  orders: [],
  customers: [],
  drops: [],
  coupons: [],
};

const unwrapError = (error, fallback) =>
  error?.response?.data?.message || error.message || fallback;

let inflightController = null;

export const runAdminSearch = createAsyncThunk(
  "adminSearch/run",
  async (rawQuery, thunkAPI) => {
    const query = String(rawQuery || "").trim();

    // Cancel any in-flight request from a previous keystroke.
    if (inflightController) {
      inflightController.abort();
    }
    const controller = new AbortController();
    inflightController = controller;

    if (query.length < 2) {
      inflightController = null;
      return { query, results: EMPTY_RESULTS };
    }

    try {
      const response = await adminGlobalSearchApi(query, { signal: controller.signal });
      if (controller === inflightController) inflightController = null;
      return { query, results: response.data?.data || EMPTY_RESULTS };
    } catch (error) {
      if (axios.isCancel?.(error) || error?.name === "CanceledError" || error?.code === "ERR_CANCELED") {
        return thunkAPI.rejectWithValue({ silent: true });
      }
      if (controller === inflightController) inflightController = null;
      return thunkAPI.rejectWithValue({ message: unwrapError(error, "Search failed") });
    }
  }
);

const adminSearchSlice = createSlice({
  name: "adminSearch",
  initialState: {
    query: "",
    results: EMPTY_RESULTS,
    loading: false,
    error: null,
  },
  reducers: {
    clearAdminSearch: (state) => {
      state.query = "";
      state.results = EMPTY_RESULTS;
      state.loading = false;
      state.error = null;
      if (inflightController) {
        inflightController.abort();
        inflightController = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(runAdminSearch.pending, (state, action) => {
        state.query = action.meta.arg;
        state.loading = true;
        state.error = null;
      })
      .addCase(runAdminSearch.fulfilled, (state, action) => {
        if (state.query !== action.payload.query) return; // stale
        state.loading = false;
        state.results = action.payload.results;
      })
      .addCase(runAdminSearch.rejected, (state, action) => {
        if (action.payload?.silent) return;
        state.loading = false;
        state.error = action.payload?.message || action.error?.message || "Search failed";
      });
  },
});

export const { clearAdminSearch } = adminSearchSlice.actions;
export default adminSearchSlice.reducer;
