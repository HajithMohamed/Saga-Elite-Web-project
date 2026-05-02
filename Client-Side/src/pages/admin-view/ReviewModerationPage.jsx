import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X, ChevronDown, Search, Flag } from "lucide-react";
import {
  fetchAdminReviews,
  moderateReview,
} from "@/store/reviewSlice";
import { toast } from "@/hooks/use-toast";
import StarRating from "@/components/Review/StarRating";
import { useSocketEvent } from "@/hooks/use-socket-events";
import { AdminPage } from "@/components/admin-components/AdminUI";

const statusTabs = ["pending", "approved", "rejected"];

const ReviewModerationPage = () => {
  const dispatch = useDispatch();
  const { adminReviews, adminPagination, loading } = useSelector(
    (state) => state.review
  );

  const [activeStatus, setActiveStatus] = useState("pending");
  const [expandedId, setExpandedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [rejecting, setRejecting] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    dispatch(fetchAdminReviews({ status: activeStatus, page: 1, search: debouncedSearch }));
    setSelectedIds([]);
  }, [dispatch, activeStatus, debouncedSearch]);

  useSocketEvent(
    "review:refresh",
    () => {
      dispatch(fetchAdminReviews({ status: activeStatus, page: 1, search: debouncedSearch }));
    },
    [dispatch, activeStatus, debouncedSearch]
  );

  const handleSelect = (reviewId) => {
    setSelectedIds((prev) =>
      prev.includes(reviewId)
        ? prev.filter((id) => id !== reviewId)
        : [...prev, reviewId]
    );
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(
        selectedIds.map((reviewId) =>
          dispatch(moderateReview({ reviewId, action: "approve" })).unwrap()
        )
      );
      toast({
        title: "Reviews approved",
        description: `Approved ${selectedIds.length} reviews.`,
      });
      dispatch(fetchAdminReviews({ status: activeStatus, page: 1, search: debouncedSearch }));
      setSelectedIds([]);
    } catch (error) {
      toast({
        title: "Bulk approve failed",
        description: error || "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) return;
    const reason = window.prompt("Reject reason (optional):", "Rejected by admin");
    if (reason === null) return;

    try {
      await Promise.all(
        selectedIds.map((reviewId) =>
          dispatch(moderateReview({ reviewId, action: "reject", rejectionReason: reason })).unwrap()
        )
      );
      toast({
        title: "Reviews rejected",
        description: `Rejected ${selectedIds.length} reviews.`,
      });
      dispatch(fetchAdminReviews({ status: activeStatus, page: 1, search: debouncedSearch }));
      setSelectedIds([]);
    } catch (error) {
      toast({
        title: "Bulk reject failed",
        description: error || "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleModerate = async (reviewId, action) => {
    try {
      await dispatch(
        moderateReview({ reviewId, action, rejectionReason })
      ).unwrap();
      toast({
        title: "Review updated",
        description: `Review ${action}d successfully.`,
      });
      setRejecting(null);
      setRejectionReason("");
      dispatch(fetchAdminReviews({ status: activeStatus, page: 1, search: debouncedSearch }));
    } catch (error) {
      toast({
        title: "Update failed",
        description: error || "Unable to update review",
        variant: "destructive",
      });
    }
  };

  const totalCount = adminPagination?.total || adminReviews.length;

  const hasSelected = selectedIds.length > 0;

  const groupedReviews = useMemo(() => adminReviews || [], [adminReviews]);

  return (
    <AdminPage
      eyebrow="Review moderation"
      title="Customer Reviews"
      description="Approve or reject reviews quickly with bulk actions and detailed context."
    >
      <div className="container mx-auto px-0 md:px-2">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">
              Review moderation
            </p>
            <h1 className="mt-2 text-3xl font-bold">Customer Reviews</h1>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
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
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!hasSelected}
                onClick={handleBulkApprove}
                className="rounded-full bg-[#D4AF37] px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={!hasSelected}
                onClick={handleBulkReject}
                className="rounded-full bg-rose-500/20 px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-rose-200 border border-transparent hover:border-rose-500/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-3">
          {statusTabs.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setActiveStatus(status)}
              className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${
                activeStatus === status
                  ? "bg-[#D4AF37] text-black"
                  : "border border-white/10 text-white/60"
              }`}
            >
              {status} {activeStatus === status ? `(${totalCount})` : ""}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-44 animate-pulse rounded-3xl bg-[#111]" />
            ))}
          </div>
        ) : groupedReviews.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-[#0b0b0b] p-10 text-white/60">
            No reviews for this status.
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence initial={false}>
            {groupedReviews.map((review) => {
              const isExpanded = expandedId === review._id;
              const productName = review.productId?.name || "Product";
              const reviewer = review.userId?.email || "Customer";
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
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(review._id)}
                        onChange={() => handleSelect(review._id)}
                        className="h-4 w-4"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{productName}</p>
                          {review.isFlagged && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-400">
                              <Flag className="h-3 w-3" /> Flagged
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/50">{reviewer}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <StarRating value={review.rating} readOnly size="sm" />
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

                  {isExpanded && (
                    <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                          {review.title}
                        </p>
                        <p className="mt-2 text-sm text-white/70">
                          {review.content}
                        </p>
                      </div>
                      {Array.isArray(review.images) && review.images.length > 0 && (
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
                      )}
                      {review.isFlagged && review.flagReason && (
                        <div className="mt-4 rounded-xl bg-red-500/10 p-3 border border-red-500/20">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-red-400">Flag Reason:</p>
                          <p className="mt-1 text-sm text-red-200">{review.flagReason}</p>
                        </div>
                      )}
                      
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => handleModerate(review._id, "approve")}
                          className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200"
                        >
                          <Check className="h-3 w-3" /> Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => setRejecting(review)}
                          className="inline-flex items-center gap-2 rounded-full bg-rose-500/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-200"
                        >
                          <X className="h-3 w-3" /> Reject
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {rejecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
          <div className="w-full max-w-lg rounded-3xl bg-[#0b0b0b] p-6">
            <h2 className="text-lg font-semibold">Reject review</h2>
            <p className="mt-2 text-sm text-white/60">
              Provide a reason to send to the customer.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              className="mt-4 min-h-[120px] w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white"
            />
            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setRejecting(null);
                  setRejectionReason("");
                }}
                className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleModerate(rejecting._id, "reject")}
                className="rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
              >
                Reject review
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPage>
  );
};

export default ReviewModerationPage;
