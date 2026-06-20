import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { fetchAlertsApi, acknowledgeAlertApi, runAlertChecksApi } from "@/api/smartAlertsAPI";

const unwrapError = (error, fallback) =>
  error?.response?.data?.message || error.message || fallback;

const initialState = {
  alerts: [],
  loading: false,
  acknowledging: {},
  running: false,
  error: null,
};

export const fetchAlerts = createAsyncThunk(
  "smartAlerts/fetch",
  async (_, thunkAPI) => {
    try {
      const response = await fetchAlertsApi();
      return response.data?.data?.alerts || [];
    } catch (error) {
      return thunkAPI.rejectWithValue(unwrapError(error, "Failed to load alerts"));
    }
  }
);

export const acknowledgeAlert = createAsyncThunk(
  "smartAlerts/acknowledge",
  async (id, thunkAPI) => {
    try {
      await acknowledgeAlertApi(id);
      return id;
    } catch (error) {
      return thunkAPI.rejectWithValue({ id, message: unwrapError(error, "Failed to acknowledge") });
    }
  }
);

export const runAlertChecks = createAsyncThunk(
  "smartAlerts/run",
  async (_, thunkAPI) => {
    try {
      await runAlertChecksApi();
      return true;
    } catch (error) {
      return thunkAPI.rejectWithValue(unwrapError(error, "Failed to trigger checks"));
    }
  }
);

const smartAlertsSlice = createSlice({
  name: "smartAlerts",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAlerts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.loading = false;
        state.alerts = action.payload;
      })
      .addCase(fetchAlerts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(acknowledgeAlert.pending, (state, action) => {
        state.acknowledging[action.meta.arg] = true;
      })
      .addCase(acknowledgeAlert.fulfilled, (state, action) => {
        const id = action.payload;
        delete state.acknowledging[id];
        state.alerts = state.alerts.filter((a) => a._id !== id);
      })
      .addCase(acknowledgeAlert.rejected, (state, action) => {
        const id = action.payload?.id || action.meta.arg;
        delete state.acknowledging[id];
        state.error = action.payload?.message || action.error.message;
      })
      .addCase(runAlertChecks.pending, (state) => {
        state.running = true;
      })
      .addCase(runAlertChecks.fulfilled, (state) => {
        state.running = false;
      })
      .addCase(runAlertChecks.rejected, (state, action) => {
        state.running = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export default smartAlertsSlice.reducer;
