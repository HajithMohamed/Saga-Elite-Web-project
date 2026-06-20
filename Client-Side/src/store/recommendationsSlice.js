import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  fetchRecommendationApi,
  fetchAllRecommendationsApi,
  regenerateRecommendationApi,
} from "@/api/recommendationsAPI";

const TYPES = ["reviews", "products", "drops", "analytics", "improvements", "ideas"];

const initialState = {
  byType: TYPES.reduce((acc, t) => ({ ...acc, [t]: null }), {}),
  loadingByType: TYPES.reduce((acc, t) => ({ ...acc, [t]: false }), {}),
  regeneratingByType: TYPES.reduce((acc, t) => ({ ...acc, [t]: false }), {}),
  errorByType: TYPES.reduce((acc, t) => ({ ...acc, [t]: null }), {}),
  bootstrapLoading: false,
};

const unwrapError = (error, fallback) =>
  error?.response?.data?.message || error.message || fallback;

export const fetchRecommendation = createAsyncThunk(
  "recommendations/fetchOne",
  async (type, thunkAPI) => {
    try {
      const response = await fetchRecommendationApi(type);
      return { type, recommendation: response.data?.data?.recommendation || null };
    } catch (error) {
      return thunkAPI.rejectWithValue({ type, message: unwrapError(error, "Failed to load recommendation") });
    }
  }
);

export const fetchAllRecommendations = createAsyncThunk(
  "recommendations/fetchAll",
  async (_, thunkAPI) => {
    try {
      const response = await fetchAllRecommendationsApi();
      return response.data?.data?.byType || {};
    } catch (error) {
      return thunkAPI.rejectWithValue(unwrapError(error, "Failed to load recommendations"));
    }
  }
);

export const regenerateRecommendation = createAsyncThunk(
  "recommendations/regenerateOne",
  async (type, thunkAPI) => {
    try {
      const response = await regenerateRecommendationApi(type);
      return { type, recommendation: response.data?.data?.recommendation || null };
    } catch (error) {
      return thunkAPI.rejectWithValue({ type, message: unwrapError(error, "Failed to regenerate recommendation") });
    }
  }
);

const recommendationsSlice = createSlice({
  name: "recommendations",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecommendation.pending, (state, action) => {
        state.loadingByType[action.meta.arg] = true;
        state.errorByType[action.meta.arg] = null;
      })
      .addCase(fetchRecommendation.fulfilled, (state, action) => {
        const { type, recommendation } = action.payload;
        state.loadingByType[type] = false;
        state.byType[type] = recommendation;
      })
      .addCase(fetchRecommendation.rejected, (state, action) => {
        const type = action.payload?.type || action.meta.arg;
        state.loadingByType[type] = false;
        state.errorByType[type] = action.payload?.message || action.error.message;
      })
      .addCase(fetchAllRecommendations.pending, (state) => {
        state.bootstrapLoading = true;
      })
      .addCase(fetchAllRecommendations.fulfilled, (state, action) => {
        state.bootstrapLoading = false;
        TYPES.forEach((type) => {
          if (Object.prototype.hasOwnProperty.call(action.payload, type)) {
            state.byType[type] = action.payload[type];
          }
        });
      })
      .addCase(fetchAllRecommendations.rejected, (state) => {
        state.bootstrapLoading = false;
      })
      .addCase(regenerateRecommendation.pending, (state, action) => {
        state.regeneratingByType[action.meta.arg] = true;
        state.errorByType[action.meta.arg] = null;
      })
      .addCase(regenerateRecommendation.fulfilled, (state, action) => {
        const { type, recommendation } = action.payload;
        state.regeneratingByType[type] = false;
        if (recommendation) state.byType[type] = recommendation;
      })
      .addCase(regenerateRecommendation.rejected, (state, action) => {
        const type = action.payload?.type || action.meta.arg;
        state.regeneratingByType[type] = false;
        state.errorByType[type] = action.payload?.message || action.error.message;
      });
  },
});

export default recommendationsSlice.reducer;
