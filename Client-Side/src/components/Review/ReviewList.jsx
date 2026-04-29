import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import RatingSummary from "./RatingSummary";
import ReviewCard, { ReviewCardSkeleton } from "./ReviewCard";
import ReviewForm from "./ReviewForm";
import {
  fetchProductReviews,
  fetchUserReviews,
  submitReview,
  voteReviewHelpful,
  deleteReview,
} from "@/store/reviewSlice";
import { fetchUserOrders } from "@/store/order-slice";
import { toast } from "@/hooks/use-toast";

const sortOptions = [
  { label: "Most Recent", value: "recent" },
  { label: "Most Helpful", value: "helpful" },
  { label: "Highest Rated", value: "rating_high" },
  { label: "Lowest Rated", value: "rating_low" },
];

const ReviewList = ({ productId, initialStats }) => {
  const dispatch = useDispatch();
  const {
    productReviews,
    productPagination,
    ratingStats,
    loading,
    submitting,
    userReviews,
  } = useSelector((state) => state.review);
    (state) => state.review
  );
  const { userOrders } = useSelector((state) => state.order);
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [ratingFilter, setRatingFilter] = useState(null);
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);

  const reviewList = productReviews?.[productId] || [];
  const stats = ratingStats?.[productId] || initialStats;
  const pagination = productPagination?.[productId];

  useEffect(() => {
    if (!productId) return;
    dispatch(fetchProductReviews({ productId, rating: ratingFilter, sort, page: 1 }));
    setPage(1);
  }, [dispatch, productId, ratingFilter, sort]);

  useEffect(() => {
    if (!productId || page === 1) return;
    dispatch(fetchProductReviews({ productId, rating: ratingFilter, sort, page }));
  }, [dispatch, productId, ratingFilter, sort, page]);

  useEffect(() => {
    if (!isAuthenticated) return;
    dispatch(fetchUserOrders());
    dispatch(fetchUserReviews());
  }, [dispatch, isAuthenticated]);

  const currentUserId = user?._id;

  const userHasReview = useMemo(() => {
    return userReviews.some(
      (review) => String(review.productId?._id || review.productId) === String(productId)
    );
  }, [userReviews, productId]);

  const eligibleOrder = useMemo(() => {
    if (!userOrders?.length) return null;
    return userOrders.find(
      (order) =>
        order.status === "confirmed" &&
        order.items?.some((item) =>
          String(item.product?._id || item.product) === String(productId)
        )
    );
  }, [userOrders, productId]);

  const canReview = Boolean(isAuthenticated && eligibleOrder && !userHasReview);

  const handleLoadMore = () => setPage((prev) => prev + 1);

  const handleSubmit = async (formData) => {
    const response = await dispatch(submitReview(formData)).unwrap();
    dispatch(fetchProductReviews({ productId, rating: ratingFilter, sort, page: 1 }));
    dispatch(fetchUserReviews());
    return response;
  };

  const handleHelpfulVote = async (review) => {
    try {
      await dispatch(voteReviewHelpful(review._id)).unwrap();
    } catch (error) {
      toast({
        title: "Unable to vote",
        description: error || "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (review) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await dispatch(deleteReview(review._id)).unwrap();
      dispatch(fetchProductReviews({ productId, rating: ratingFilter, sort, page: 1 }));
      dispatch(fetchUserReviews());
    } catch (error) {
      toast({
        title: "Unable to delete",
        description: error || "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <RatingSummary
        stats={stats}
        onFilterChange={(rating) => setRatingFilter(rating)}
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 rounded-full border border-white/10 bg-[#0b0b0b] p-2">
          <button
            type="button"
            onClick={() => setRatingFilter(null)}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${
              ratingFilter === null
                ? "bg-[#D4AF37] text-black"
                : "text-white/60"
            }`}
          >
            All stars
          </button>
          {[5, 4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => setRatingFilter(rating)}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${
                ratingFilter === rating
                  ? "bg-[#D4AF37] text-black"
                  : "text-white/60"
              }`}
            >
              {rating} star
            </button>
          ))}
        </div>

        <select
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          className="rounded-full border border-white/10 bg-[#0b0b0b] px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/60"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {loading && page === 1 ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <ReviewCardSkeleton key={index} />
          ))}
        </div>
      ) : reviewList.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-[#0b0b0b] p-10 text-center text-white/70">
          No reviews yet. Be the first to review this product!
        </div>
      ) : (
        <div className="space-y-4">
          {reviewList.map((review) => (
            <ReviewCard
              key={review._id}
              review={review}
              onHelpfulVote={handleHelpfulVote}
              isOwnReview={review.userId?._id === currentUserId}
              currentUserId={currentUserId}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {reviewList.length > 0 && pagination?.hasMore && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loading}
            className="rounded-full border border-white/10 px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white/60 hover:border-[#D4AF37]/60"
          >
            {loading ? "Loading..." : "Load more"}
          </button>
        </div>
      )}

      {canReview && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">
            Share your experience
          </p>
          <ReviewForm
            productId={productId}
            orderId={eligibleOrder?._id}
            onSubmit={handleSubmit}
            onCancel={null}
            loading={submitting}
          />
        </div>
      )}
    </div>
  );
};

export default ReviewList;
