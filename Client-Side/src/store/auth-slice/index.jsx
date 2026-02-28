import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

// use Vite env variable for API url; fall back to the common local default
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const initialState = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
};

export const registerUserAction = createAsyncThunk(
  "auth/register",
  async (formData, thunkAPI) => {
    console.log("registerUserAction using API_BASE", API_BASE);
    try {
      const respose = await axios.post(
        `${API_BASE}/auth/register`,
        formData,
        {
          withCredentials: true,
        },
      );
      return respose.data;
    } catch (err) {
      // prefer server-sent message when available
      const serverMsg = err?.response?.data?.message;
      const message = serverMsg || err.message || "Registration failed";
      return thunkAPI.rejectWithValue(message);
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {},
  },
  extraReducers : (builder)=>{
    builder.addCase(registerUserAction.pending,(state)=>{
        state.isLoading = true
    }).addCase(registerUserAction.fulfilled,(state,action)=>{
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false
    }).addCase(registerUserAction.rejected,(state,action)=>{
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false
    })
  }
});

export const { setUser } = authSlice.actions;

export default authSlice.reducer;
