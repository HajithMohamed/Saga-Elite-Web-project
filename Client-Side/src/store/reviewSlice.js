import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  fetchProductReviewsApi,
  fetchUserReviewsApi,
  submitReviewApi,
  voteReviewHelpfulApi,
  deleteReviewApi,
  fetchAdminReviewsApi,
  moderateReviewApi,
  updateReviewApi,
  flagReviewApi,
  replyToReviewApi,
  featureReviewApi,
  fetchReviewAnalyticsApi,
} from "@/api/reviewAPI";

const unwrapError = (error, fallback) => {
  const serverMsg = error?.response?.data?.message;
  return serverMsg || error.message || fallback;
};

const initialState = {
  productReviews: {},
  productPagination: {},
  ratingStats: {},
  userReviews: [],
  adminReviews: [],
  adminPagination: null,
  adminAnalytics: null,
  activeFilters: {
    productId: null,
    rating: null,
    sort: "recent",
    page: 1,
  },
  submitting: false,
  loading: false,
  error: null,
};

export const fetchProductReviews = createAsyncThunk(
  "review/fetchProductReviews",
  async ({ productId, rating, sort, page, limit = 10 }, thunkAPI) => {
    try {
      const response = await fetchProductReviewsApi({
        productId,
        rating,
        sort,
        page,
        limit,
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        unwrapError(error, "Failed to fetch reviews")
      );
    }
  }
);

export const fetchUserReviews = createAsyncThunk(
  "review/fetchUserReviews",
  async (_, thunkAPI) => {
    try {
      const response = await fetchUserReviewsApi();
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        unwrapError(error, "Failed to fetch user reviews")
      );
    }
  }
);

export const submitReview = createAsyncThunk(
  "review/submitReview",
  async (payload, thunkAPI) => {
    try {
      const response = await submitReviewApi(payload);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        unwrapError(error, "Failed to submit review")
      );
    }
  }
);

export const updateReview = createAsyncThunk(
  "review/updateReview",
  async ({ reviewId, ...payload }, thunkAPI) => {
    try {
      const response = await updateReviewApi(reviewId, payload);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        unwrapError(error, "Failed to update review")
      );
    }
  }
);

export const voteReviewHelpful = createAsyncThunk(
  "review/voteReviewHelpful",
  async (reviewId, thunkAPI) => {
    try {
      const response = await voteReviewHelpfulApi(reviewId);
      const userId = thunkAPI.getState().auth?.user?._id;
      return { ...response.data, reviewId, userId };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        unwrapError(error, "Failed to vote review")
      );
    }
  }
);

export const deleteReview = createAsyncThunk(
  "review/deleteReview",
  async (reviewId, thunkAPI) => {
    try {
      const response = await deleteReviewApi(reviewId);
      return { ...response.data, reviewId };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        unwrapError(error, "Failed to delete review")
      );
    }
  }
);

export const fetchAdminReviews = createAsyncThunk(
  "review/fetchAdminReviews",
  async ({ status, page, limit = 20, search }, thunkAPI) => {
    try {
      const response = await fetchAdminReviewsApi({ status, page, limit, search });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        unwrapError(error, "Failed to fetch admin reviews")
      );
    }
  }
);

export const flagReview = createAsyncThunk(
  "review/flagReview",
  async ({ reviewId, reason }, thunkAPI) => {
    try {
      const response = await flagReviewApi(reviewId, reason);
      return { ...response.data, reviewId };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        unwrapError(error, "Failed to flag review")
      );
    }
  }
);

export const moderateReview = createAsyncThunk(
  "review/moderateReview",
  async ({ reviewId, action, rejectionReason }, thunkAPI) => {
    try {
      const response = await moderateReviewApi(reviewId, {
        action,
        rejectionReason,
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        unwrapError(error, "Failed to moderate review")
      );
    }
  }
);

export const replyToReview = createAsyncThunk(
  "review/replyToReview",
  async ({ reviewId, brandReply }, thunkAPI) => {
    try {
      const response = await replyToReviewApi(reviewId, brandReply);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        unwrapError(error, "Failed to publish reply")
      );
    }
  }
);

export const featureReview = createAsyncThunk(
  "review/featureReview",
  async ({ reviewId, isFeatured }, thunkAPI) => {
    try {
      const response = await featureReviewApi(reviewId, isFeatured);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        unwrapError(error, "Failed to update featured flag")
      );
    }
  }
);

export const fetchReviewAnalytics = createAsyncThunk(
  "review/fetchReviewAnalytics",
  async (_, thunkAPI) => {
    try {
      const response = await fetchReviewAnalyticsApi();
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        unwrapError(error, "Failed to load review analytics")
      );
    }
  }
);

const reviewSlice = createSlice({
  name: "review",
  initialState,
  reducers: {
    clearReviewError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductReviews.fulfilled, (state, action) => {
        state.loading = false;
        const { reviews, stats } = action.payload;
        const { productId, page } = action.meta.arg;
        const existing = state.productReviews[productId] || [];
        state.productReviews[productId] =
          page && page > 1 ? [...existing, ...reviews] : reviews;
        state.ratingStats[productId] = stats;
        state.productPagination[productId] = action.payload.pagination || null;
      })
      .addCase(fetchProductReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchUserReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.userReviews = action.payload.reviews || [];
      })
      .addCase(fetchUserReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(submitReview.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(submitReview.fulfilled, (state, action) => {
        state.submitting = false;
        if (action.payload?.review) {
          state.userReviews = [action.payload.review, ...state.userReviews];
        }
      })
      .addCase(submitReview.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(updateReview.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(updateReview.fulfilled, (state, action) => {
        state.submitting = false;
        const updated = action.payload?.review;
        if (updated) {
          state.userReviews = state.userReviews.map((review) =>
            review._id === updated._id ? updated : review
          );
        }
      })
      .addCase(updateReview.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(voteReviewHelpful.fulfilled, (state, action) => {
        const { reviewId, helpful, count, userId } = action.payload;
        const updateReview = (review) => {
          if (review._id !== reviewId) return review;
          const helpfulVotes = Array.isArray(review.helpfulVotes)
            ? review.helpfulVotes
            : [];
          const updatedVotes = helpful
            ? [...new Set([...helpfulVotes, userId])]
            : helpfulVotes.filter((vote) => vote !== userId);
          return {
            ...review,
            helpfulCount: count,
            helpfulVotes: updatedVotes,
          };
        };

        Object.keys(state.productReviews).forEach((key) => {
          state.productReviews[key] = state.productReviews[key].map(updateReview);
        });

        state.userReviews = state.userReviews.map(updateReview);
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        const { reviewId } = action.payload;
        state.userReviews = state.userReviews.filter(
          (review) => review._id !== reviewId
        );
        Object.keys(state.productReviews).forEach((key) => {
          state.productReviews[key] = state.productReviews[key].filter(
            (review) => review._id !== reviewId
          );
        });
      })
      .addCase(fetchAdminReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.adminReviews = action.payload.reviews || [];
        state.adminPagination = action.payload.pagination || null;
      })
      .addCase(fetchAdminReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(moderateReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(moderateReview.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload?.review;
        if (updated) {
          state.adminReviews = state.adminReviews.map((review) =>
            review._id === updated._id ? updated : review
          );
        }
      })
      .addCase(moderateReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(replyToReview.fulfilled, (state, action) => {
        const updated = action.payload?.review;
        if (updated) {
          state.adminReviews = state.adminReviews.map((review) =>
            review._id === updated._id ? updated : review
          );
        }
      })
      .addCase(featureReview.fulfilled, (state, action) => {
        const updated = action.payload?.review;
        if (updated) {
          state.adminReviews = state.adminReviews.map((review) =>
            review._id === updated._id ? updated : review
          );
        }
      })
      .addCase(fetchReviewAnalytics.fulfilled, (state, action) => {
        state.adminAnalytics = action.payload?.data || null;
      });
  },
});

export const { clearReviewError } = reviewSlice.actions;

export default reviewSlice.reducer;
