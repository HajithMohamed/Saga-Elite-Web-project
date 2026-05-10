import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  fetchManualPaymentById as fetchManualPaymentByIdApi,
  fetchManualPaymentMethodSummary as fetchManualPaymentMethodSummaryApi,
  fetchMyManualPaymentStatus as fetchMyManualPaymentStatusApi,
  fetchPendingManualPayments as fetchPendingManualPaymentsApi,
  generateManualPaymentReference as generateManualPaymentReferenceApi,
  lookupManualPayment as lookupManualPaymentApi,
  sendManualPaymentLink as sendManualPaymentLinkApi,
  submitManualPaymentProof as submitManualPaymentProofApi,
  submitManualPaymentReceipt as submitManualPaymentReceiptApi,
  verifyManualPayment as verifyManualPaymentApi,
} from "@/api/manualPaymentAPI";

const MANUAL_PAYMENT_STORAGE_KEY = "saga_manual_payment_context";
/** Plain reference fallback (master spec) when reading outside Redux */
const MANUAL_PAYMENT_REF_FALLBACK_KEY = "saga_manual_payment_ref";

const loadPersistedManualPayment = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(MANUAL_PAYMENT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const persistManualPayment = (state) => {
  if (typeof window === "undefined") {
    return;
  }

  const payload = {
    currentPayment: state.currentPayment || null,
    lastGeneratedReference: state.lastGeneratedReference || null,
    paymentContext: state.paymentContext || null,
  };

  window.sessionStorage.setItem(MANUAL_PAYMENT_STORAGE_KEY, JSON.stringify(payload));
  const ref =
    state.paymentContext?.referenceNumber ||
    state.lastGeneratedReference ||
    state.currentPayment?.referenceNumber ||
    "";
  if (ref) {
    window.sessionStorage.setItem(MANUAL_PAYMENT_REF_FALLBACK_KEY, String(ref));
  }
};

const clearPersistedManualPayment = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(MANUAL_PAYMENT_STORAGE_KEY);
  window.sessionStorage.removeItem(MANUAL_PAYMENT_REF_FALLBACK_KEY);
};

const persistedManualPayment = loadPersistedManualPayment();

const initialState = {
  currentPayment: persistedManualPayment?.currentPayment || null,
  pendingPayments: [],
  pagination: {
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
  },
  lastGeneratedReference: persistedManualPayment?.lastGeneratedReference || null,
  paymentContext: persistedManualPayment?.paymentContext || null,
  isGenerating: false,
  isSubmitting: false,
  isFetching: false,
  isAdminLoading: false,
  isVerifying: false,
  methodSummary: { byMethod: [], totals: { count: 0, totalAmount: 0 } },
  isSummaryLoading: false,
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
  async ({ referenceNumber, proofUrl, email }, thunkAPI) => {
    try {
      return await submitManualPaymentProofApi({ referenceNumber, proofUrl, email });
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error, "Failed to submit proof"));
    }
  },
);

export const submitManualPaymentReceipt = createAsyncThunk(
  "manualPayment/submitReceipt",
  async ({ referenceNumber, file, email }, thunkAPI) => {
    try {
      return await submitManualPaymentReceiptApi({ referenceNumber, file, email });
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error, "Failed to submit receipt"));
    }
  },
);

export const fetchMyManualPaymentStatus = createAsyncThunk(
  "manualPayment/fetchMyStatus",
  async (arg, thunkAPI) => {
    const { referenceNumber, email } =
      typeof arg === "string" ? { referenceNumber: arg } : arg || {};
    try {
      return await fetchMyManualPaymentStatusApi(referenceNumber, { email });
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error, "Failed to fetch payment status"));
    }
  },
);

export const sendManualPaymentLink = createAsyncThunk(
  "manualPayment/sendLink",
  async ({ slug, email }, thunkAPI) => {
    try {
      return await sendManualPaymentLinkApi({ slug, email });
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error, "Failed to send payment link"));
    }
  },
);

export const lookupManualPayment = createAsyncThunk(
  "manualPayment/lookup",
  async ({ email, identifier }, thunkAPI) => {
    try {
      return await lookupManualPaymentApi({ email, identifier });
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error, "Could not find a matching payment"));
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

export const fetchManualPaymentMethodSummary = createAsyncThunk(
  "manualPayment/fetchMethodSummary",
  async (params = {}, thunkAPI) => {
    try {
      return await fetchManualPaymentMethodSummaryApi(params);
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error, "Failed to load payment summary"));
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
      state.paymentContext = null;
      state.lastGeneratedReference = null;
      clearPersistedManualPayment();
    },
    resetManualPaymentError: (state) => {
      state.error = null;
    },
    storeManualPaymentContext: (state, action) => {
      state.paymentContext = action.payload || null;
      persistManualPayment(state);
    },
    setManualPaymentEmail: (state, action) => {
      const email = (action.payload || "").trim().toLowerCase();
      state.paymentContext = {
        ...(state.paymentContext || {}),
        email: email || null,
      };
      persistManualPayment(state);
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
        state.lastGeneratedReference =
          action.payload?.referenceNumber ||
          payload.referenceNumber ||
          payload.manualPayment?.referenceNumber ||
          null;
        state.paymentContext = {
          orderId: action.payload?.orderId || payload.orderId || payload.manualPayment?.orderId || null,
          amount: action.payload?.amount || payload.amount || payload.manualPayment?.amount || null,
          slug:
            action.payload?.slug ||
            payload.slug ||
            payload.manualPayment?.slug ||
            null,
          referenceNumber:
            action.payload?.referenceNumber ||
            payload.referenceNumber ||
            payload.manualPayment?.referenceNumber ||
            null,
        };
        persistManualPayment(state);
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
        state.lastGeneratedReference =
          action.payload?.data?.referenceNumber || state.lastGeneratedReference;
        state.paymentContext = {
          orderId:
            action.payload?.data?.orderId?._id ||
            action.payload?.data?.orderId ||
            state.paymentContext?.orderId ||
            null,
          amount: action.payload?.data?.amount || state.paymentContext?.amount || null,
          slug: action.payload?.data?.slug || state.paymentContext?.slug || null,
          referenceNumber:
            action.payload?.data?.referenceNumber ||
            state.lastGeneratedReference ||
            null,
        };
        persistManualPayment(state);
      })
      .addCase(submitManualPaymentProof.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(submitManualPaymentReceipt.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(submitManualPaymentReceipt.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.currentPayment = action.payload?.data || state.currentPayment;
        state.lastGeneratedReference =
          action.payload?.data?.referenceNumber || state.lastGeneratedReference;
        state.paymentContext = {
          orderId:
            action.payload?.data?.orderId?._id ||
            action.payload?.data?.orderId ||
            state.paymentContext?.orderId ||
            null,
          amount: action.payload?.data?.amount || state.paymentContext?.amount || null,
          slug: action.payload?.data?.slug || state.paymentContext?.slug || null,
          referenceNumber:
            action.payload?.data?.referenceNumber ||
            state.lastGeneratedReference ||
            null,
        };
        persistManualPayment(state);
      })
      .addCase(submitManualPaymentReceipt.rejected, (state, action) => {
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
        state.lastGeneratedReference =
          action.payload?.data?.referenceNumber || state.lastGeneratedReference;
        state.paymentContext = {
          orderId:
            action.payload?.data?.orderId?._id ||
            action.payload?.data?.orderId ||
            state.paymentContext?.orderId ||
            null,
          amount: action.payload?.data?.amount || state.paymentContext?.amount || null,
          slug: action.payload?.data?.slug || state.paymentContext?.slug || null,
          referenceNumber:
            action.payload?.data?.referenceNumber ||
            state.lastGeneratedReference ||
            null,
        };
        persistManualPayment(state);
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
        state.paymentContext = {
          orderId:
            action.payload?.data?.orderId?._id ||
            action.payload?.data?.orderId ||
            state.paymentContext?.orderId ||
            null,
          amount: action.payload?.data?.amount || state.paymentContext?.amount || null,
          slug: action.payload?.data?.slug || state.paymentContext?.slug || null,
          referenceNumber:
            action.payload?.data?.referenceNumber ||
            state.lastGeneratedReference ||
            null,
        };
        persistManualPayment(state);
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
          state.lastGeneratedReference =
            updatedPayment.referenceNumber || state.lastGeneratedReference;
          state.paymentContext = {
            orderId:
              updatedPayment.orderId?._id ||
              updatedPayment.orderId ||
              state.paymentContext?.orderId ||
              null,
            amount: updatedPayment.amount || state.paymentContext?.amount || null,
            slug: updatedPayment.slug || state.paymentContext?.slug || null,
            referenceNumber:
              updatedPayment.referenceNumber ||
              state.lastGeneratedReference ||
              null,
          };
          persistManualPayment(state);
        }
      })
      .addCase(verifyManualPayment.rejected, (state, action) => {
        state.isVerifying = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchManualPaymentMethodSummary.pending, (state) => {
        state.isSummaryLoading = true;
      })
      .addCase(fetchManualPaymentMethodSummary.fulfilled, (state, action) => {
        state.isSummaryLoading = false;
        state.methodSummary = action.payload?.data || initialState.methodSummary;
      })
      .addCase(fetchManualPaymentMethodSummary.rejected, (state, action) => {
        state.isSummaryLoading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const {
  clearCurrentPayment,
  resetManualPaymentError,
  storeManualPaymentContext,
  setManualPaymentEmail,
} = manualPaymentSlice.actions;

export default manualPaymentSlice.reducer;
