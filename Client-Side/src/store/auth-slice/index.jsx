import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

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
      const serverMsg = err?.response?.data?.message;
      const message = serverMsg || err.message || "Registration failed";
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const verifyOtpAction = createAsyncThunk(
  'auth/otp-verify',
  async(formData,thunkAPI)=>{
    try {
      const apiResponse = await axios.post(`${API_BASE}/auth/otp-verify`,formData,{
        withCredentials : true
      })
      return apiResponse.data;
    } catch (error) {
      const serverMsg = error?.response?.data?.message;
      const message = serverMsg || error.message || "OTP verification failed";
      return thunkAPI.rejectWithValue(message);
    }
  }
)

export const resendOtpAction = createAsyncThunk(
  'auth/resend-otp',
  async(formData,thunkAPI)=>{
    try {
      const apiResponse = await axios.post(`${API_BASE}/auth/resend-otp`,formData,{
        withCredentials : true
      })
      return apiResponse.data;
    } catch (error) {
      const serverMsg = error?.response?.data?.message;
      const message = serverMsg || error.message || "Resend OTP failed";
      return thunkAPI.rejectWithValue(message);
    }
  }
)

export const loginUserAction = createAsyncThunk('auth/login',
  async(formData, thunkAPI)=>{
    try {
      const apiResponse = await axios.post(`${API_BASE}/auth/login`,formData,{
        withCredentials:true
      })
      return apiResponse.data
    } catch (error) {
      const serverMsg = error?.response?.data?.message;
      const message = serverMsg || error.message || "Login Failed";
      return thunkAPI.rejectWithValue(message);
    }
  }

)

export const checkAuthAction = createAsyncThunk(
    "/auth/checkauth",
    async (_, thunkAPI) => {
      try {
        const response = await axios.get(`${API_BASE}/auth/check-auth`, {
          withCredentials: true,
        });
  
        return response.data;
      } catch (error) {
        const serverMsg = error?.response?.data?.message;
        const message = serverMsg || error.message || "Check Auth Failed";
        return thunkAPI.rejectWithValue(message);
      }
    }
);

export const forgotPasswordAction = createAsyncThunk('auth/forgot-password',
  async(formData)=>{
    try {
      const apiResponse = await axios.post(`${API_BASE}/auth/forgot-password`,formData,{
        withCredentials : true
      })
      return response.data
    } catch (error) {
      const serverMsg = error?.response?.data?.message;
        const message = serverMsg || error.message || "Forgot password request failed";
        return thunkAPI.rejectWithValue(message);
    }
  }
)

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
        state.user = action.payload.data;
        state.isAuthenticated = false
    }).addCase(registerUserAction.rejected,(state,action)=>{
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false
    })
    .addCase(verifyOtpAction.pending,(state)=>{
        state.isLoading = true
    }).addCase(verifyOtpAction.fulfilled,(state,action)=>{
        state.isLoading = false;
        state.user = action.payload.data.user;
        state.isAuthenticated = true
    }).addCase(verifyOtpAction.rejected,(state,action)=>{
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false
    })
    .addCase(resendOtpAction.pending,(state)=>{
        state.isLoading = true
    }).addCase(resendOtpAction.fulfilled,(state,action)=>{
        state.isLoading = false;
    }).addCase(resendOtpAction.rejected,(state,action)=>{
        state.isLoading = false;
    })
    .addCase(loginUserAction.pending,(state)=>{
        state.isLoading = true
    }).addCase(loginUserAction.fulfilled,(state,action)=>{
        state.isLoading = false;
        state.user = action.payload.data.user;
        state.isAuthenticated = true
    }).addCase(loginUserAction.rejected,(state,action)=>{
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false
    })    .addCase(checkAuthAction.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuthAction.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.success ? action.payload.data.user : null;
        state.isAuthenticated = action.payload.success;
      })
      .addCase(checkAuthAction.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      }).addCase(loginUserAction.rejected,(state,action)=>{
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false
    }).addCase(forgotPasswordAction.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(forgotPasswordAction.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.success ? action.payload.data.user : null;
        state.isAuthenticated = action.payload.success;
      })
      .addCase(forgotPasswordAction.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false
      }) 
    }
});

export const { setUser } = authSlice.actions;

export default authSlice.reducer;
