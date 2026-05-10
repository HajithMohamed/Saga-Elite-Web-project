import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Camera, BadgeCheck, Search, X } from "lucide-react";
import RatingSummary from "./RatingSummary";
import ReviewCard, { ReviewCardSkeleton } from "./ReviewCard";
import ReviewForm from "./ReviewForm";
import {
  fetchProductReviews,
  fetchUserReviews,
  submitReview,
  voteReviewHelpful,
  deleteReview,
  flagReview,
} from "@/store/reviewSlice";
import { fetchUserOrders } from "@/store/order-slice";
import { toast } from "@/hooks/use-toast";

const sortOptions = [
  { label: "Most Recent", value: "recent" },
  { label: "Most Helpful", value: "helpful" },
  { label: "Highest Rated", value: "rating_high" },
  { label: "Lowest Rated", value: "rating_low" },
];

const CATEGORY_OPTIONS = [
  { value: "fit", label: "Fit" },
  { value: "quality", label: "Quality" },
  { value: "delivery", label: "Delivery" },
  { value: "style", label: "Style" },
  { value: "value", label: "Value" },
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
  const { userOrders } = useSelector((state) => state.order);
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [ratingFilter, setRatingFilter] = useState(null);
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);
  const [withPhotos, setWithPhotos] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [category, setCategory] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const reviewList = productReviews?.[productId] || [];
  const stats = ratingStats?.[productId] || initialStats;
  const pagination = productPagination?.[productId];
  const categoryBreakdown = stats?.categoryBreakdown || {};

  // Debounce search input (350ms) so we don't spam the API on every keystroke.
  useEffect(() => {
    const handle = setTimeout(() => setSearchQuery(searchInput.trim()), 350);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const filterPayload = useMemo(
    () => ({
      productId,
      rating: ratingFilter,
      sort,
      withPhotos,
      verifiedOnly,
      category,
      q: searchQuery,
    }),
    [productId, ratingFilter, sort, withPhotos, verifiedOnly, category, searchQuery]
  );

  useEffect(() => {
    if (!productId) return;
    dispatch(fetchProductReviews({ ...filterPayload, page: 1 }));
    setPage(1);
  }, [dispatch, filterPayload]);

  useEffect(() => {
    if (!productId || page === 1) return;
    dispatch(fetchProductReviews({ ...filterPayload, page }));
  }, [dispatch, filterPayload, page]);

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
        order.status === "delivered" &&
        order.items?.some((item) =>
          String(item.product?._id || item.product) === String(productId)
        )
    );
  }, [userOrders, productId]);

  const canReview = Boolean(isAuthenticated && eligibleOrder && !userHasReview);

  const handleLoadMore = () => setPage((prev) => prev + 1);

  const handleSubmit = async (formData) => {
    const response = await dispatch(submitReview(formData)).unwrap();
    dispatch(fetchProductReviews({ ...filterPayload, page: 1 }));
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
      dispatch(fetchProductReviews({ ...filterPayload, page: 1 }));
      dispatch(fetchUserReviews());
    } catch (error) {
      toast({
        title: "Unable to delete",
        description: error || "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleFlag = async (reviewId, reason) => {
    try {
      await dispatch(flagReview({ reviewId, reason })).unwrap();
      toast({
        title: "Review reported",
        description: "Thank you for your report. Our team will review it shortly.",
      });
    } catch (error) {
      toast({
        title: "Failed to report",
        description: error || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const activeFilterCount =
    (ratingFilter ? 1 : 0) +
    (withPhotos ? 1 : 0) +
    (verifiedOnly ? 1 : 0) +
    (category ? 1 : 0) +
    (searchQuery ? 1 : 0);

  const clearAllFilters = () => {
    setRatingFilter(null);
    setWithPhotos(false);
    setVerifiedOnly(false);
    setCategory(null);
    setSearchInput("");
  };

  return (
    <div className="space-y-6">
      <RatingSummary
        stats={stats}
        onFilterChange={(rating) => setRatingFilter(rating)}
      />

      <div className="rounded-3xl border border-white/10 bg-[#0b0b0b] p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setWithPhotos((prev) => !prev)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] transition-colors ${
              withPhotos
                ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]"
                : "border-white/10 text-white/60 hover:border-white/20 hover:text-white"
            }`}
          >
            <Camera className="h-3.5 w-3.5" /> With photos
          </button>
          <button
            type="button"
            onClick={() => setVerifiedOnly((prev) => !prev)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] transition-colors ${
              verifiedOnly
                ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]"
                : "border-white/10 text-white/60 hover:border-white/20 hover:text-white"
            }`}
          >
            <BadgeCheck className="h-3.5 w-3.5" /> Verified only
          </button>
          {CATEGORY_OPTIONS.map((option) => {
            const count = categoryBreakdown[option.value] || 0;
            const isActive = category === option.value;
            if (count === 0 && !isActive) return null;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  setCategory(isActive ? null : option.value)
                }
                className={`rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] transition-colors ${
                  isActive
                    ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]"
                    : "border-white/10 text-white/60 hover:border-white/20 hover:text-white"
                }`}
              >
                {option.label} · {count}
              </button>
            );
          })}
          {activeFilterCount > 0 ? (
            <button
              type="button"
              onClick={clearAllFilters}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-white/50 hover:text-white"
            >
              <X className="h-3 w-3" /> Clear ({activeFilterCount})
            </button>
          ) : null}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search within reviews"
            className="w-full rounded-full border border-white/10 bg-black/30 py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-white/40 focus:border-[#D4AF37]/50 focus:outline-none"
          />
        </div>
      </div>

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
              onFlag={handleFlag}
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
