import React, { useMemo, useState } from "react";
import { CheckCircle2, ImageOff, ThumbsUp, Flag } from "lucide-react";
import StarRating from "./StarRating";

const getDisplayName = (user) => {
  const firstName = user?.firstName?.trim();
  const lastName = user?.lastName?.trim();

  if (firstName) {
    const lastInitial = lastName ? `${lastName.charAt(0)}.` : "";
    return `${firstName} ${lastInitial}`.trim();
  }

  const emailName = user?.email?.split("@")[0] || "Customer";
  const parts = emailName.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]} ${parts[1].charAt(0)}.`;
  }
  return parts[0] ? parts[0] : "Customer";
};

const statusStyle = {
  pending: "bg-yellow-500/15 text-yellow-200",
  approved: "bg-emerald-500/15 text-emerald-200",
  rejected: "bg-rose-500/15 text-rose-200",
};

const ReviewCard = ({
  review,
  onHelpfulVote,
  isOwnReview = false,
  onEdit,
  onDelete,
  onFlag,
  currentUserId,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [isFlagging, setIsFlagging] = useState(false);
  const [flagReason, setFlagReason] = useState("");

  const displayName = useMemo(
    () => getDisplayName(review?.userId),
    [review?.userId]
  );
  const reviewDate = review?.createdAt
    ? new Date(review.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const content = review?.content || "";
  const isLong = content.length > 200;
  const shownContent = expanded || !isLong ? content : `${content.slice(0, 200)}...`;

  const hasVoted = review?.helpfulVotes?.some(
    (vote) => vote.toString() === currentUserId
  );

  return (
    <div className="rounded-3xl border border-ink/10 bg-page p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ink">{displayName}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink/50">
            {review?.verifiedPurchase && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gold-deep/10 px-2 py-1 text-gold-ink2">
                <CheckCircle2 className="h-3 w-3" /> Verified purchase
              </span>
            )}
            <span>{reviewDate}</span>
          </div>
        </div>
        <StarRating value={review?.rating || 0} readOnly size="sm" />
      </div>

      <div className="mt-4 space-y-3">
        <p className="text-base font-semibold text-ink">
          {review?.title || ""}
        </p>
        <p className="text-sm leading-relaxed text-ink/70">{shownContent}</p>
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-ink2"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        )}
      </div>

      {Array.isArray(review?.images) && review.images.length > 0 ? (
        <div className="mt-4 grid grid-cols-3 gap-3">
          {review.images.map((img, index) => (
            <button
              key={`${img}-${index}`}
              type="button"
              onClick={() => setLightbox(img)}
              className="relative overflow-hidden rounded-2xl border border-ink/10 bg-panel"
            >
              <img
                src={img}
                alt={`Review ${index + 1}`}
                className="h-24 w-full object-cover"
              />
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-2 text-xs text-ink/30">
          <ImageOff className="h-4 w-4" />
          No images
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onHelpfulVote && onHelpfulVote(review)}
          className={`inline-flex items-center gap-1.5 se-label text-[9px] tracking-[0.24em] transition-colors ${
            hasVoted
              ? "text-gold-ink2"
              : "text-muted hover:text-cream"
          }`}
        >
          <ThumbsUp className="h-3 w-3" />
          Helpful ({review?.helpfulCount || 0})
        </button>

        <div className="flex flex-wrap items-center gap-3">
          {!isOwnReview && currentUserId && (
            <button
              type="button"
              onClick={() => setIsFlagging(true)}
              className="inline-flex items-center gap-2 rounded-full border border-ink/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink/70 hover:border-red-500/50 hover:text-red-400"
            >
              <Flag className="h-3 w-3" /> Report
            </button>
          )}
          {isOwnReview && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onEdit && onEdit(review)}
                className="rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-ink/70 hover:border-gold-ink2/50"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete && onDelete(review)}
                className="rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-rose-200 hover:border-rose-400/70"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute right-6 top-6 rounded-full border border-ink/20 bg-black/50 px-4 py-2 text-xs font-semibold text-ink"
          >
            Close
          </button>
          <img
            src={lightbox}
            alt="Review"
            className="max-h-[80vh] w-full max-w-3xl rounded-3xl object-contain"
          />
        </div>
      )}

      {isFlagging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
          <div className="w-full max-w-lg rounded-3xl bg-page p-6">
            <h2 className="text-lg font-semibold text-ink">Report Review</h2>
            <p className="mt-2 text-sm text-ink/60">
              Why are you reporting this review? (Spam, abusive, irrelevant, etc.)
            </p>
            <textarea
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              className="mt-4 min-h-[100px] w-full rounded-2xl border border-ink/10 bg-black/30 px-4 py-3 text-sm text-ink focus:border-red-500/50"
              placeholder="Provide a reason..."
            />
            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsFlagging(false)}
                className="rounded-full border border-ink/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink/60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onFlag && onFlag(review._id, flagReason);
                  setIsFlagging(false);
                  setFlagReason("");
                }}
                disabled={!flagReason.trim()}
                className="rounded-full bg-red-500/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-200 hover:bg-red-500/30 disabled:opacity-50"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ReviewCardSkeleton = () => (
  <div className="animate-pulse rounded-3xl border border-ink/10 bg-page p-6">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-4 w-32 rounded-full bg-ink/10" />
        <div className="h-3 w-24 rounded-full bg-ink/10" />
      </div>
      <div className="h-4 w-24 rounded-full bg-ink/10" />
    </div>
    <div className="mt-4 space-y-3">
      <div className="h-4 w-40 rounded-full bg-ink/10" />
      <div className="h-3 w-full rounded-full bg-ink/10" />
      <div className="h-3 w-5/6 rounded-full bg-ink/10" />
    </div>
    <div className="mt-4 grid grid-cols-3 gap-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="h-24 rounded-2xl bg-ink/10" />
      ))}
    </div>
  </div>
);

export default ReviewCard;
