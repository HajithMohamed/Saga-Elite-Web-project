import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";
import { API_V1_URL as API_BASE } from "@/lib/api";

const unwrapAxiosError = (error) => {
  const serverMsg = error?.response?.data?.message;
  return serverMsg || error.message || "Request failed";
};

const initialState = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
};

export const registerUserAction = createAsyncThunk(
  "auth/register",
  async (formData, thunkAPI) => {
    try {
      const response = await axiosInstance.post(`/auth/register`, formData);
      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(unwrapAxiosError(err));
    }
  }
);

export const verifyOtpAction = createAsyncThunk(
  "auth/otp-verify",
  async (formData, thunkAPI) => {
    try {
      const apiResponse = await axiosInstance.post(`/auth/otp-verify`, formData);
      if (apiResponse.data?.token) {
        localStorage.setItem('authToken', apiResponse.data.token);
      }
      return apiResponse.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(unwrapAxiosError(error));
    }
  }
);

export const resendOtpAction = createAsyncThunk(
  "auth/resend-otp",
  async (formData, thunkAPI) => {
    try {
      const apiResponse = await axiosInstance.post(`/auth/resend-otp`, formData);
      return apiResponse.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(unwrapAxiosError(error));
    }
  }
);

export const loginUserAction = createAsyncThunk(
  "auth/login",
  async (formData, thunkAPI) => {
    try {
      const apiResponse = await axiosInstance.post(`/auth/login`, formData);
      if (apiResponse.data?.token) {
        localStorage.setItem('authToken', apiResponse.data.token);
      }
      return apiResponse.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(unwrapAxiosError(error));
    }
  }
);

export const checkAuthAction = createAsyncThunk(
  "auth/checkauth",
  async (_, thunkAPI) => {
    try {
      const response = await axiosInstance.get(`/auth/check-auth`);
      return response.data;
    } catch (error) {
      if (error?.response?.status === 401) {
        localStorage.removeItem('authToken');
        return { success: false };
      }
      return thunkAPI.rejectWithValue(unwrapAxiosError(error));
    }
  }
);

export const forgotPasswordAction = createAsyncThunk(
  "auth/forgot-password",
  async (formData, thunkAPI) => {
    try {
      const apiResponse = await axiosInstance.post(`/auth/forgot-password`, formData);
      return apiResponse.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(unwrapAxiosError(error));
    }
  }
);

export const resetPasswordAction = createAsyncThunk(
  "auth/reset-password",
  async (formData, thunkAPI) => {
    try {
      const apiResponse = await axiosInstance.post(`/auth/reset-password`, formData);
      if (apiResponse.data?.token) {
        localStorage.setItem('authToken', apiResponse.data.token);
      }
      return apiResponse.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(unwrapAxiosError(error));
    }
  }
);

export const resendResetPasswordOtpAction = createAsyncThunk(
  "auth/resend-reset-otp",
  async (formData, thunkAPI) => {
    try {
      const apiResponse = await axiosInstance.post(`/auth/resend-reset-otp`, formData);
      return apiResponse.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(unwrapAxiosError(error));
    }
  }
);

export const verifyResetOtpAction = createAsyncThunk(
  "auth/verify-reset-otp",
  async (formData, thunkAPI) => {
    try {
      const apiResponse = await axiosInstance.post(`/auth/verify-reset-otp`, formData);
      return apiResponse.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(unwrapAxiosError(error));
    }
  }
);

export const googleSignInAction = createAsyncThunk(
  "auth/google-sign-in",
  async ({ accessToken }, thunkAPI) => {
    try {
      const apiResponse = await axiosInstance.post(
        `/google/sign-in`,
        { accessToken }
      );
      if (apiResponse.data?.token) {
        localStorage.setItem('authToken', apiResponse.data.token);
      }
      return apiResponse.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(unwrapAxiosError(error));
    }
  }
);

export const googleSignUpAction = createAsyncThunk(
  "auth/google-sign-up",
  async ({ accessToken }, thunkAPI) => {
    try {
      const apiResponse = await axiosInstance.post(
        `/google/sign-up`,
        { accessToken }
      );
      if (apiResponse.data?.token) {
        localStorage.setItem('authToken', apiResponse.data.token);
      }
      return apiResponse.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(unwrapAxiosError(error));
    }
  }
);

export const facebookSignInAction = createAsyncThunk(
  "auth/facebook-sign-in",
  async ({ accessToken }, thunkAPI) => {
    try {
      const apiResponse = await axiosInstance.post(
        `/facebook/sign-in`,
        { accessToken }
      );
      if (apiResponse.data?.token) {
        localStorage.setItem('authToken', apiResponse.data.token);
      }
      return apiResponse.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(unwrapAxiosError(error));
    }
  }
);

export const facebookSignUpAction = createAsyncThunk(
  "auth/facebook-sign-up",
  async ({ accessToken }, thunkAPI) => {
    try {
      const apiResponse = await axiosInstance.post(
        `/facebook/sign-up`,
        { accessToken }
      );
      if (apiResponse.data?.token) {
        localStorage.setItem('authToken', apiResponse.data.token);
      }
      return apiResponse.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(unwrapAxiosError(error));
    }
  }
);

export const changePasswordAction = createAsyncThunk(
  "auth/change-password",
  async (formData, thunkAPI) => {
    try {
      const apiResponse = await axiosInstance.post(
        `/auth/change-password`,
        formData
      );
      return apiResponse.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(unwrapAxiosError(error));
    }
  }
);

export const logoutUserAction = createAsyncThunk(
  "auth/logout",
  async (_, thunkAPI) => {
    try {
      const response = await axiosInstance.post(`/auth/logout`, {});
      localStorage.removeItem('authToken');
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(unwrapAxiosError(error));
    }
  }
);

export const checkGuestAction = createAsyncThunk(
  "auth/checkGuest",
  async (email, thunkAPI) => {
    try {
      const response = await axiosInstance.post(`/auth/check-guest`, { email });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(unwrapAxiosError(error));
    }
  }
);

export const registerGuestAction = createAsyncThunk(
  "auth/registerGuest",
  async (email, thunkAPI) => {
    try {
      const response = await axiosInstance.post(`/auth/register-guest`, { email });
      if (response.data?.token) {
        localStorage.setItem('authToken', response.data.token);
      }
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(unwrapAxiosError(error));
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUserAction.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(registerUserAction.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data;
        state.isAuthenticated = false;
      })
      .addCase(registerUserAction.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      // OTP Verification
      .addCase(verifyOtpAction.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(verifyOtpAction.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data.user;
        state.isAuthenticated = true;
      })
      .addCase(verifyOtpAction.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      // Resend OTP
      .addCase(resendOtpAction.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(resendOtpAction.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(resendOtpAction.rejected, (state) => {
        state.isLoading = false;
      })
      // Login
      .addCase(loginUserAction.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loginUserAction.fulfilled, (state, action) => {
        state.isLoading = false;
        const isSuccess = action.payload.success || action.payload.status === "success";
        state.user = isSuccess ? (action.payload.data?.user ?? action.payload.data) : null;
        state.isAuthenticated = !!isSuccess;
      })
      .addCase(loginUserAction.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      // Check Auth
      .addCase(checkAuthAction.pending, (state) => {
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
      })
      // Forgot Password
      .addCase(forgotPasswordAction.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(forgotPasswordAction.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(forgotPasswordAction.rejected, (state) => {
        state.isLoading = false;
      })
      // Reset Password
      .addCase(resetPasswordAction.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(resetPasswordAction.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(resetPasswordAction.rejected, (state) => {
        state.isLoading = false;
      })
      // Resend Reset OTP
      .addCase(resendResetPasswordOtpAction.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(resendResetPasswordOtpAction.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(resendResetPasswordOtpAction.rejected, (state) => {
        state.isLoading = false;
      })
      // Verify Reset OTP
      .addCase(verifyResetOtpAction.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(verifyResetOtpAction.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(verifyResetOtpAction.rejected, (state) => {
        state.isLoading = false;
      })
      // Google Sign In
      .addCase(googleSignInAction.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(googleSignInAction.fulfilled, (state, action) => {
        state.isLoading = false;
        const user = action.payload.data?.user ?? action.payload.data ?? null;
        state.user = user;
        state.isAuthenticated = !!user;
      })
      .addCase(googleSignInAction.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      // Google Sign Up
      .addCase(googleSignUpAction.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(googleSignUpAction.fulfilled, (state, action) => {
        state.isLoading = false;
        const user = action.payload.data?.user ?? action.payload.data ?? null;
        state.user = user;
        state.isAuthenticated = !!user;
      })
      .addCase(googleSignUpAction.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      // Facebook Sign In
      .addCase(facebookSignInAction.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(facebookSignInAction.fulfilled, (state, action) => {
        state.isLoading = false;
        const user = action.payload.data?.user ?? action.payload.data ?? null;
        state.user = user;
        state.isAuthenticated = !!user;
      })
      .addCase(facebookSignInAction.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      // Facebook Sign Up
      .addCase(facebookSignUpAction.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(facebookSignUpAction.fulfilled, (state, action) => {
        state.isLoading = false;
        const user = action.payload.data?.user ?? action.payload.data ?? null;
        state.user = user;
        state.isAuthenticated = !!user;
      })
      .addCase(facebookSignUpAction.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      // Change Password
      .addCase(changePasswordAction.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(changePasswordAction.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(changePasswordAction.rejected, (state) => {
        state.isLoading = false;
      })
      // Logout
      .addCase(logoutUserAction.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUserAction.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        localStorage.removeItem('authToken');
      })
      .addCase(logoutUserAction.rejected, (state) => {
        state.isLoading = false;
        localStorage.removeItem('authToken');
      })
      // Check Guest
      .addCase(checkGuestAction.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkGuestAction.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(checkGuestAction.rejected, (state) => {
        state.isLoading = false;
      })
      // Register Guest
      .addCase(registerGuestAction.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(registerGuestAction.fulfilled, (state, action) => {
        state.isLoading = false;
        const isSuccess = action.payload.success || action.payload.status === "success";
        state.user = isSuccess ? (action.payload.data?.user ?? action.payload.data) : null;
        state.isAuthenticated = !!isSuccess;
      })
      .addCase(registerGuestAction.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { setUser } = authSlice.actions;
export default authSlice.reducer;
