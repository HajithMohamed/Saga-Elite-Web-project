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
  async(formData, thunkAPI)=>{
    try {
      const apiResponse = await axios.post(`${API_BASE}/auth/forgot-password`,formData,{
        withCredentials : true
      })
      return apiResponse.data
    } catch (error) {
      const serverMsg = error?.response?.data?.message;
        const message = serverMsg || error.message || "Forgot password request failed";
        return thunkAPI.rejectWithValue(message);
    }
  }
)

export const resetPasswordAction = createAsyncThunk('auth/reset-password',
  async(formData, thunkAPI)=>{
    try {
      const apiResponse = await axios.post(`${API_BASE}/auth/reset-password`,formData,{
        withCredentials : true
      })
      return apiResponse.data
    } catch (error) {
      const serverMsg = error?.response?.data?.message;
        const message = serverMsg || error.message || "Password reset failed";
        return thunkAPI.rejectWithValue(message);
    }
  }
)

export const resendResetPasswordOtpAction = createAsyncThunk('auth/resend-reset-otp',
  async(formData, thunkAPI)=>{
    try {
      const apiResponse = await axios.post(`${API_BASE}/auth/resend-reset-otp`,formData,{
        withCredentials : true
      })
      return apiResponse.data
    } catch (error) {
      const serverMsg = error?.response?.data?.message;
        const message = serverMsg || error.message || "Failed to resend reset OTP";
        return thunkAPI.rejectWithValue(message);
    }
  }
)

export const verifyResetOtpAction = createAsyncThunk('auth/verify-reset-otp',
  async(formData, thunkAPI)=>{
    try {
      const apiResponse = await axios.post(`${API_BASE}/auth/verify-reset-otp`,formData,{
        withCredentials : true
      })
      return apiResponse.data
    } catch (error) {
      const serverMsg = error?.response?.data?.message;
        const message = serverMsg || error.message || "OTP verification failed";
        return thunkAPI.rejectWithValue(message);
    }
  }
)

export const googleSignInAction = createAsyncThunk(
  "auth/google-sign-in",
  async ({ accessToken }, thunkAPI) => {
    try {
      const apiResponse = await axios.post(
        `${API_BASE}/google/sign-in`,
        { accessToken },
        { withCredentials: true }
      );
      return apiResponse.data;
    } catch (error) {
      const serverMsg = error?.response?.data?.message;
      const message = serverMsg || error.message || "Google sign-in failed";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const googleSignUpAction = createAsyncThunk(
  "auth/google-sign-up",
  async ({ accessToken }, thunkAPI) => {
    try {
      const apiResponse = await axios.post(
        `${API_BASE}/google/sign-up`,
        { accessToken },
        { withCredentials: true }
      );
      return apiResponse.data;
    } catch (error) {
      const serverMsg = error?.response?.data?.message;
      const message = serverMsg || error.message || "Google sign-up failed";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const changePasswordAction = createAsyncThunk(
  "auth/change-password",
  async (formData, thunkAPI) => {
    try {
      const apiResponse = await axios.post(
        `${API_BASE}/auth/change-password`,
        formData,
        { withCredentials: true }
      );
      return apiResponse.data;
    } catch (error) {
      const serverMsg = error?.response?.data?.message;
      const message = serverMsg || error.message || "Password change failed";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// thunk action for logging the user out
export const logoutUserAction = createAsyncThunk(
  'auth/logout',
  async (_, thunkAPI) => {
    try {
      const response = await axios.post(
        `${API_BASE}/auth/logout`,
        {},
        {
          withCredentials: true,
        },
      );
      return response.data;
    } catch (err) {
      const serverMsg = err?.response?.data?.message;
      const message = serverMsg || err.message || 'Logout failed';
      return thunkAPI.rejectWithValue(message);
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
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
        const isSuccess = action.payload.success || action.payload.status === "success";
        state.user = isSuccess ? action.payload.data?.user : null;
        state.isAuthenticated = !!isSuccess;
      })
      .addCase(checkAuthAction.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      }).addCase(forgotPasswordAction.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(forgotPasswordAction.fulfilled, (state, action) => {
        state.isLoading = false;
        // Don't change auth state for forgot password
      })
      .addCase(forgotPasswordAction.rejected, (state) => {
        state.isLoading = false;
        // Don't change auth state for forgot password
      }).addCase(resetPasswordAction.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(resetPasswordAction.fulfilled, (state, action) => {
        state.isLoading = false;
        // Password reset successful, but user needs to login again
      })
      .addCase(resetPasswordAction.rejected, (state) => {
        state.isLoading = false;
      }).addCase(resendResetPasswordOtpAction.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(resendResetPasswordOtpAction.fulfilled, (state, action) => {
        state.isLoading = false;
      })
      .addCase(resendResetPasswordOtpAction.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(verifyResetOtpAction.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(verifyResetOtpAction.fulfilled, (state, action) => {
        state.isLoading = false;
      })
      .addCase(verifyResetOtpAction.rejected, (state, action) => {
        state.isLoading = false;
      })
      // logout handling
      .addCase(logoutUserAction.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUserAction.fulfilled, (state) => {
        state.isLoading = false;
        // reset to initial state on successful logout
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(logoutUserAction.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(googleSignInAction.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(googleSignInAction.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data.user;
        state.isAuthenticated = true;
      })
      .addCase(googleSignInAction.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(googleSignUpAction.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(googleSignUpAction.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data.user;
        state.isAuthenticated = true;
      })
      .addCase(googleSignUpAction.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(changePasswordAction.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(changePasswordAction.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(changePasswordAction.rejected, (state) => {
        state.isLoading = false;
      });
    }
});

export const { setUser } = authSlice.actions;

export default authSlice.reducer;
