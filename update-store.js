const fs = require('fs');
let c = fs.readFileSync('Client-Side/src/store/order-slice/index.js', 'utf8');

const thunkStr = `
export const fetchDashboardStats = createAsyncThunk(
  "order/fetchDashboardStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/order/dashboard-stats");
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
`;

c = c.replace(/export const updateOrderStatus = createAsyncThunk\(/, thunkStr + "\nexport const updateOrderStatus = createAsyncThunk(");
c = c.replace(/adminPagination: \{\},\n/, "adminPagination: {},\n  dashboardStats: null,\n");

const extraRep = `
      // Dashboard stats
      .addCase(fetchDashboardStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboardStats = action.payload;
        state.error = null;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(updateOrderStatus.pending`;

c = c.replace(/\.addCase\(updateOrderStatus\.pending/, extraRep);
fs.writeFileSync('Client-Side/src/store/order-slice/index.js', c);
const fs = require('fs');
let c = fs.readFileSync('Client-Side/src/store/order-slice/index.js', 'utf8');

const thunkStr = `
export const fetchDashboardStats = createAsyncThunk(
  "order/fetchDashboardStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/order/dashboard-stats");
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
`;

c = c.replace(/export const updateOrderStatus = createAsyncThunk\(/, thunkStr + "\nexport const updateOrderStatus = createAsyncThunk(");
c = c.replace(/adminPagination: \{\},\n/, "adminPagination: {},\n  dashboardStats: null,\n");

const extraRep = `
      // Dashboard stats
      .addCase(fetchDashboardStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboardStats = action.payload;
        state.error = null;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(updateOrderStatus.pending`;

c = c.replace(/\.addCase\(updateOrderStatus\.pending/, extraRep);
fs.writeFileSync('Client-Side/src/store/order-slice/index.js', c);
