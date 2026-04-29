import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  fetchManualPaymentById as fetchManualPaymentByIdApi,
  fetchMyManualPaymentStatus as fetchMyManualPaymentStatusApi,
  fetchPendingManualPayments as fetchPendingManualPaymentsApi,
  generateManualPaymentReference as generateManualPaymentReferenceApi,
  submitManualPaymentProof as submitManualPaymentProofApi,
  verifyManualPayment as verifyManualPaymentApi,
} from "@/api/manualPaymentAPI";

const initialState = {
  currentPayment: null,
  pendingPayments: [],
  pagination: {
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
  },
  lastGeneratedReference: null,
  isGenerating: false,
  isSubmitting: false,
  isFetching: false,
  isAdminLoading: false,
  isVerifying: false,
  error: null,
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

export const generateManualPaymentReference = createAsyncThunk(
  "manualPayment/generateReference",
  async ({ orderId, amount }, thunkAPI) => {
    try {
      return await generateManualPaymentReferenceApi({ orderId, amount });
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error, "Failed to generate payment reference"));
    }
  },
);

export const submitManualPaymentProof = createAsyncThunk(
  "manualPayment/submitProof",
  async ({ referenceNumber, proofUrl }, thunkAPI) => {
    try {
      return await submitManualPaymentProofApi({ referenceNumber, proofUrl });
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error, "Failed to submit proof"));
    }
  },
);

export const fetchMyManualPaymentStatus = createAsyncThunk(
  "manualPayment/fetchMyStatus",
  async (referenceNumber, thunkAPI) => {
    try {
      return await fetchMyManualPaymentStatusApi(referenceNumber);
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error, "Failed to fetch payment status"));
    }
  },
);

export const fetchPendingManualPayments = createAsyncThunk(
  "manualPayment/fetchPending",
  async (params, thunkAPI) => {
    try {
      return await fetchPendingManualPaymentsApi(params);
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error, "Failed to load pending payments"));
    }
  },
);

export const fetchManualPaymentById = createAsyncThunk(
  "manualPayment/fetchById",
  async (paymentId, thunkAPI) => {
    try {
      return await fetchManualPaymentByIdApi(paymentId);
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error, "Failed to load payment details"));
    }
  },
);

export const verifyManualPayment = createAsyncThunk(
  "manualPayment/verify",
  async ({ paymentId, action, rejectionReason, adminNotes }, thunkAPI) => {
    try {
      return await verifyManualPaymentApi({ paymentId, action, rejectionReason, adminNotes });
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error, "Failed to verify payment"));
    }
  },
);

const removePaymentFromQueue = (queue, paymentId) => queue.filter((payment) => payment._id !== paymentId);

const manualPaymentSlice = createSlice({
  name: "manualPayment",
  initialState,
  reducers: {
    clearCurrentPayment: (state) => {
      state.currentPayment = null;
    },
    resetManualPaymentError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateManualPaymentReference.pending, (state) => {
        state.isGenerating = true;
        state.error = null;
      })
      .addCase(generateManualPaymentReference.fulfilled, (state, action) => {
        state.isGenerating = false;
        const payload = action.payload?.data || {};
        state.currentPayment = {
          ...(payload.manualPayment || payload),
          bankDetails: payload.bankDetails || payload.manualPayment?.bankDetails || null,
        };
        state.lastGeneratedReference = payload.referenceNumber || payload.manualPayment?.referenceNumber || null;
      })
      .addCase(generateManualPaymentReference.rejected, (state, action) => {
        state.isGenerating = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(submitManualPaymentProof.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(submitManualPaymentProof.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.currentPayment = action.payload?.data || state.currentPayment;
      })
      .addCase(submitManualPaymentProof.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchMyManualPaymentStatus.pending, (state) => {
        state.isFetching = true;
        state.error = null;
      })
      .addCase(fetchMyManualPaymentStatus.fulfilled, (state, action) => {
        state.isFetching = false;
        state.currentPayment = action.payload?.data || null;
      })
      .addCase(fetchMyManualPaymentStatus.rejected, (state, action) => {
        state.isFetching = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchPendingManualPayments.pending, (state) => {
        state.isAdminLoading = true;
        state.error = null;
      })
      .addCase(fetchPendingManualPayments.fulfilled, (state, action) => {
        state.isAdminLoading = false;
        state.pendingPayments = action.payload?.data?.payments || [];
        state.pagination = action.payload?.data?.pagination || initialState.pagination;
      })
      .addCase(fetchPendingManualPayments.rejected, (state, action) => {
        state.isAdminLoading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchManualPaymentById.pending, (state) => {
        state.isAdminLoading = true;
        state.error = null;
      })
      .addCase(fetchManualPaymentById.fulfilled, (state, action) => {
        state.isAdminLoading = false;
        state.currentPayment = action.payload?.data || null;
      })
      .addCase(fetchManualPaymentById.rejected, (state, action) => {
        state.isAdminLoading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(verifyManualPayment.pending, (state) => {
        state.isVerifying = true;
        state.error = null;
      })
      .addCase(verifyManualPayment.fulfilled, (state, action) => {
        state.isVerifying = false;
        const updatedPayment = action.payload?.data || null;

        if (updatedPayment) {
          state.currentPayment = updatedPayment;
          state.pendingPayments = removePaymentFromQueue(state.pendingPayments, updatedPayment._id);
        }
      })
      .addCase(verifyManualPayment.rejected, (state, action) => {
        state.isVerifying = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { clearCurrentPayment, resetManualPaymentError } = manualPaymentSlice.actions;

export default manualPaymentSlice.reducer;