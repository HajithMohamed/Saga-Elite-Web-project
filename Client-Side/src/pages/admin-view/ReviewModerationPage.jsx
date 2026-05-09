import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Search,
  Flag,
  Star,
  Image as ImageIcon,
  Tag,
} from "lucide-react";
import {
  fetchAdminReviews,
  categorizeReview,
  replyToReview,
  featureReview,
  fetchReviewAnalytics,
} from "@/store/reviewSlice";
import { toast } from "@/hooks/use-toast";
import StarRating from "@/components/Review/StarRating";
import { useSocketEvent } from "@/hooks/use-socket-events";
import { AdminPage } from "@/components/admin-components/AdminUI";
import { pageVariants } from "@/components/admin-components/_shared/animations";
import { SkeletonGrid } from "@/components/admin-components/_shared/SkeletonCard";

const CATEGORY_OPTIONS = [
  { value: "uncategorized", label: "Uncategorized" },
  { value: "fit", label: "Fit" },
  { value: "quality", label: "Quality" },
  { value: "delivery", label: "Delivery" },
  { value: "style", label: "Style" },
  { value: "value", label: "Value" },
];

const FILTER_TABS = [
  { value: "all", label: "All", category: null },
  { value: "uncategorized", label: "Uncategorized", category: "uncategorized" },
  { value: "fit", label: "Fit", category: "fit" },
  { value: "quality", label: "Quality", category: "quality" },
  { value: "delivery", label: "Delivery", category: "delivery" },
  { value: "style", label: "Style", category: "style" },
  { value: "value", label: "Value", category: "value" },
  { value: "flagged", label: "Flagged", category: null },
  { value: "5star", label: "5 ★", category: null },
  { value: "low", label: "1–2 ★", category: null },
  { value: "media", label: "With Photos", category: null },
  { value: "featured", label: "Featured", category: null },
];

const QUICK_REPLIES = [
  "Thank you for your kind words! We're so glad you love it.",
  "We're sorry to hear this — please contact us on WhatsApp so we can make it right.",
  "Thank you for the feedback! We'll use this to improve our next drop.",
];

const SENTIMENT_STYLES = {
  positive: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  neutral: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  negative: "border-[#ffb4ab]/40 bg-[#ffb4ab]/10 text-[#ffb4ab]",
};

const applyClientSideFilter = (reviews, filter) => {
  switch (filter) {
    case "all":
    case "uncategorized":
    case "fit":
    case "quality":
    case "delivery":
    case "style":
    case "value":
      return reviews;
    case "flagged":
      return reviews.filter((r) => r.isFlagged);
    case "5star":
      return reviews.filter((r) => r.rating === 5);
    case "low":
      return reviews.filter((r) => r.rating <= 2);
    case "media":
      return reviews.filter(
        (r) => Array.isArray(r.images) && r.images.length > 0
      );
    case "featured":
      return reviews.filter((r) => r.isFeatured);
    default:
      return reviews;
  }
};

const tabToCategoryParam = (filter) => {
  const tab = FILTER_TABS.find((t) => t.value === filter);
  return tab?.category || undefined;
};

const ReviewModerationPage = () => {
  const dispatch = useDispatch();
  const { adminReviews, adminPagination, adminAnalytics, loading } = useSelector(
    (state) => state.review
  );

  const [activeFilter, setActiveFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [replyOpenFor, setReplyOpenFor] = useState(null);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replySubmittingId, setReplySubmittingId] = useState(null);
  const [featureSubmittingId, setFeatureSubmittingId] = useState(null);
  const [categorizeSubmittingId, setCategorizeSubmittingId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const categoryParam = tabToCategoryParam(activeFilter);

  useEffect(() => {
    dispatch(
      fetchAdminReviews({
        status: "approved",
        category: categoryParam,
        page: 1,
        search: debouncedSearch,
        limit: 50,
      })
    );
  }, [dispatch, categoryParam, debouncedSearch]);

  useEffect(() => {
    dispatch(fetchReviewAnalytics());
  }, [dispatch]);

  useSocketEvent(
    "review:refresh",
    () => {
      dispatch(
        fetchAdminReviews({
          status: "approved",
          category: categoryParam,
          page: 1,
          search: debouncedSearch,
          limit: 50,
        })
      );
      dispatch(fetchReviewAnalytics());
    },
    [dispatch, categoryParam, debouncedSearch]
  );

  const handlePublishReply = async (review) => {
    const draft = replyDrafts[review._id] ?? review.brandReply ?? "";
    try {
      setReplySubmittingId(review._id);
      await dispatch(
        replyToReview({ reviewId: review._id, brandReply: draft })
      ).unwrap();
      toast({
        title: draft.trim() ? "Reply published" : "Reply removed",
      });
      setReplyOpenFor(null);
    } catch (error) {
      toast({
        title: "Reply failed",
        description: error || "Please try again",
        variant: "destructive",
      });
    } finally {
      setReplySubmittingId(null);
    }
  };

  const handleToggleFeature = async (review) => {
    try {
      setFeatureSubmittingId(review._id);
      await dispatch(
        featureReview({ reviewId: review._id, isFeatured: !review.isFeatured })
      ).unwrap();
    } catch (error) {
      toast({
        title: "Feature flag failed",
        description: error || "Please try again",
        variant: "destructive",
      });
    } finally {
      setFeatureSubmittingId(null);
    }
  };

  const handleCategorize = async (review, category) => {
    if (review.category === category) return;
    try {
      setCategorizeSubmittingId(review._id);
      await dispatch(
        categorizeReview({ reviewId: review._id, category })
      ).unwrap();
      toast({ title: "Category updated" });
    } catch (error) {
      toast({
        title: "Failed to categorize",
        description: error || "Please try again",
        variant: "destructive",
      });
    } finally {
      setCategorizeSubmittingId(null);
    }
  };

  const filteredReviews = useMemo(
    () => applyClientSideFilter(adminReviews || [], activeFilter),
    [adminReviews, activeFilter]
  );

  const totalCount = filteredReviews.length || adminPagination?.total || 0;

  const sentimentTotals = adminAnalytics?.sentimentBreakdown || {
    positive: 0,
    neutral: 0,
    negative: 0,
  };
  const sentimentSum =
    sentimentTotals.positive +
      sentimentTotals.neutral +
      sentimentTotals.negative || 1;
  const pct = (n) => Math.round((n / sentimentSum) * 100);
  const categoryBreakdown = adminAnalytics?.categoryBreakdown || {};

  return (
    <AdminPage
      eyebrow="Reviews"
      title="Customer Reviews"
      description="Read every review, browse by topic, and feature the best ones. Reviews publish automatically — your role is to organize and respond."
    >
      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        className="container mx-auto px-0 md:px-2"
      >
        {adminAnalytics ? (
          <div className="mb-6 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-[#4d4635]/60 bg-[#0e0e0e] p-4">
              <p className="text-[10px] uppercase tracking-[0.26em] text-[#99907c]">
                Total reviews
              </p>
              <p className="mt-2 text-2xl font-bold text-[#e5e2e1]">
                {adminAnalytics.totalApproved || 0}
              </p>
            </div>
            <div className="rounded-2xl border border-[#4d4635]/60 bg-[#0e0e0e] p-4">
              <p className="text-[10px] uppercase tracking-[0.26em] text-[#99907c]">
                Avg rating
              </p>
              <p className="mt-2 inline-flex items-center gap-1 text-2xl font-bold text-[#f2ca50]">
                <Star className="h-4 w-4 fill-[#f2ca50]" />
                {(adminAnalytics.averageRating || 0).toFixed(1)}
              </p>
            </div>
            <div className="rounded-2xl border border-[#4d4635]/60 bg-[#0e0e0e] p-4">
              <p className="text-[10px] uppercase tracking-[0.26em] text-[#99907c]">
                Uncategorized
              </p>
              <p className="mt-2 text-2xl font-bold text-amber-400">
                {categoryBreakdown.uncategorized || 0}
              </p>
            </div>
            <div className="rounded-2xl border border-[#4d4635]/60 bg-[#0e0e0e] p-4">
              <p className="text-[10px] uppercase tracking-[0.26em] text-[#99907c]">
                Featured
              </p>
              <p className="mt-2 text-2xl font-bold text-[#f2ca50]">
                {adminAnalytics.totalFeatured || 0}
              </p>
            </div>
            <div className="md:col-span-4 rounded-2xl border border-[#4d4635]/60 bg-[#0e0e0e] p-4">
              <div className="flex h-2 overflow-hidden rounded-full">
                <div
                  className="bg-emerald-400"
                  style={{ width: `${pct(sentimentTotals.positive)}%` }}
                />
                <div
                  className="bg-amber-400"
                  style={{ width: `${pct(sentimentTotals.neutral)}%` }}
                />
                <div
                  className="bg-[#ffb4ab]"
                  style={{ width: `${pct(sentimentTotals.negative)}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-[10px] tracking-[0.18em] uppercase text-[#99907c]">
                <span>Positive {pct(sentimentTotals.positive)}%</span>
                <span>Neutral {pct(sentimentTotals.neutral)}%</span>
                <span>Negative {pct(sentimentTotals.negative)}%</span>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">
              Customer Voice
            </p>
            <h1 className="mt-2 text-3xl font-bold">Reviews</h1>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
            <input
              type="text"
              placeholder="Search by product or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-3 rounded-full border border-white/10 bg-[#111] text-sm text-white placeholder:text-white/50 focus:border-[#D4AF37]/50 focus:outline-none w-full sm:w-64"
            />
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-2 border-b border-white/10 pb-4">
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab.value;
            const count =
              tab.category && categoryBreakdown[tab.category] !== undefined
                ? categoryBreakdown[tab.category]
                : null;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveFilter(tab.value)}
                className={`relative rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors ${
                  isActive
                    ? "border-[#f2ca50] bg-[#f2ca50]/10 text-[#f2ca50]"
                    : "border-white/10 text-white/60 hover:text-white hover:border-white/30"
                }`}
              >
                {tab.label}
                {count !== null ? ` (${count})` : ""}
                {isActive && count === null ? ` (${totalCount})` : ""}
              </button>
            );
          })}
        </div>

        {loading ? (
          <SkeletonGrid count={4} className="grid gap-4 md:grid-cols-2" />
        ) : filteredReviews.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-[#0b0b0b] p-10 text-white/60">
            No reviews match the current filter.
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {filteredReviews.map((review) => {
                const isExpanded = expandedId === review._id;
                const productName = review.productId?.name || "Product";
                const reviewer = review.userId?.email || "Customer";
                const replyOpen = replyOpenFor === review._id;
                const replyDraft =
                  replyDrafts[review._id] ?? review.brandReply ?? "";
                const reviewCategory = review.category || "uncategorized";
                return (
                  <motion.div
                    key={review._id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.22 }}
                    className="rounded-3xl border border-white/10 bg-[#0b0b0b] p-6"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold">{productName}</p>
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/5 px-2 py-0.5 text-[9px] uppercase tracking-wider text-[#D4AF37]">
                            <Tag className="h-3 w-3" /> {reviewCategory}
                          </span>
                          {review.sentiment ? (
                            <span
                              className={`px-2 py-0.5 text-[9px] tracking-[0.2em] uppercase border rounded-full ${
                                SENTIMENT_STYLES[review.sentiment] || ""
                              }`}
                            >
                              {review.sentiment}
                            </span>
                          ) : null}
                          {review.isFeatured ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#f2ca50]/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#f2ca50]">
                              <Star className="h-3 w-3 fill-[#f2ca50]" /> Featured
                            </span>
                          ) : null}
                          {review.isFlagged ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-400">
                              <Flag className="h-3 w-3" /> Flagged
                            </span>
                          ) : null}
                          {Array.isArray(review.images) &&
                          review.images.length > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[9px] uppercase tracking-wider text-white/70">
                              <ImageIcon className="h-3 w-3" />{" "}
                              {review.images.length}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-white/50">{reviewer}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <StarRating value={review.rating} readOnly size="sm" />
                        <select
                          value={reviewCategory}
                          disabled={categorizeSubmittingId === review._id}
                          onChange={(e) =>
                            handleCategorize(review, e.target.value)
                          }
                          className="rounded-full border border-white/10 bg-[#111] px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-white/80 focus:border-[#D4AF37]/50 focus:outline-none disabled:opacity-50"
                        >
                          {CATEGORY_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={featureSubmittingId === review._id}
                          onClick={() => handleToggleFeature(review)}
                          className={`rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] transition-colors ${
                            review.isFeatured
                              ? "border-[#f2ca50] bg-[#f2ca50]/10 text-[#f2ca50]"
                              : "border-white/10 text-white/60 hover:border-[#f2ca50]/40 hover:text-[#f2ca50]"
                          }`}
                        >
                          {review.isFeatured ? "Unfeature" : "Feature"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(isExpanded ? null : review._id)
                          }
                          className="text-xs uppercase tracking-[0.2em] text-[#D4AF37]"
                        >
                          <span className="inline-flex items-center gap-1">
                            Details <ChevronDown className="h-3 w-3" />
                          </span>
                        </button>
                      </div>
                    </div>

                    {isExpanded ? (
                      <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                            {review.title}
                          </p>
                          <p className="mt-2 text-sm text-white/70">
                            {review.content}
                          </p>
                        </div>
                        {Array.isArray(review.images) && review.images.length > 0 ? (
                          <div className="grid grid-cols-3 gap-3">
                            {review.images.map((img, index) => (
                              <img
                                key={`${review._id}-${index}`}
                                src={img}
                                alt="Review"
                                className="h-24 w-full rounded-2xl object-cover"
                              />
                            ))}
                          </div>
                        ) : null}
                        {review.isFlagged && review.flagReason ? (
                          <div className="rounded-xl bg-red-500/10 p-3 border border-red-500/20">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                              Flag Reason:
                            </p>
                            <p className="mt-1 text-sm text-red-200">
                              {review.flagReason}
                            </p>
                          </div>
                        ) : null}

                        {review.brandReply ? (
                          <div className="rounded-xl border border-[#f2ca50]/30 bg-[#f2ca50]/5 p-3">
                            <p className="text-[10px] uppercase tracking-[0.22em] text-[#f2ca50]">
                              Saga Elite — replied{" "}
                              {review.brandReplyAt
                                ? new Date(
                                    review.brandReplyAt
                                  ).toLocaleDateString()
                                : ""}
                            </p>
                            <p className="mt-1 text-sm text-[#e5e2e1]">
                              {review.brandReply}
                            </p>
                          </div>
                        ) : null}

                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              setReplyOpenFor(replyOpen ? null : review._id)
                            }
                            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 hover:text-[#f2ca50]"
                          >
                            {review.brandReply ? "Edit reply" : "+ Add brand reply"}
                          </button>
                        </div>

                        {replyOpen ? (
                          <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-4">
                            <textarea
                              value={replyDraft}
                              onChange={(e) =>
                                setReplyDrafts((prev) => ({
                                  ...prev,
                                  [review._id]: e.target.value,
                                }))
                              }
                              placeholder="Write your response as Saga Elite…"
                              rows={3}
                              maxLength={1000}
                              className="w-full resize-none border border-[#4d4635] bg-transparent p-3 text-sm text-[#e5e2e1] outline-none focus:border-[#f2ca50]"
                            />
                            <div className="mt-3 flex flex-wrap gap-2">
                              {QUICK_REPLIES.map((text) => (
                                <button
                                  key={text}
                                  type="button"
                                  onClick={() =>
                                    setReplyDrafts((prev) => ({
                                      ...prev,
                                      [review._id]: text,
                                    }))
                                  }
                                  className="rounded-full border border-[#4d4635] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#99907c] hover:border-[#f2ca50] hover:text-[#f2ca50]"
                                >
                                  Use template
                                </button>
                              ))}
                            </div>
                            <div className="mt-3 flex justify-end gap-2">
                              <button
                                type="button"
                                disabled={replySubmittingId === review._id}
                                onClick={() =>
                                  setReplyDrafts((prev) => ({
                                    ...prev,
                                    [review._id]: "",
                                  }))
                                }
                                className="rounded-full border border-white/10 px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] text-white/60"
                              >
                                Clear
                              </button>
                              <button
                                type="button"
                                disabled={replySubmittingId === review._id}
                                onClick={() => handlePublishReply(review)}
                                className="rounded-full bg-[#f2ca50] px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#0a0a0a] disabled:opacity-50"
                              >
                                {replySubmittingId === review._id
                                  ? "Publishing…"
                                  : "Publish reply"}
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </AdminPage>
  );
};

export default ReviewModerationPage;
