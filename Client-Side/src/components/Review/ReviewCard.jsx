import React, { useMemo, useState } from "react";
import { CheckCircle2, ImageOff, ThumbsUp } from "lucide-react";
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
  currentUserId,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [lightbox, setLightbox] = useState(null);

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
    <div className="rounded-3xl border border-white/10 bg-[#0b0b0b] p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white">{displayName}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/50">
            {review?.verifiedPurchase && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#D4AF37]/10 px-2 py-1 text-[#D4AF37]">
                <CheckCircle2 className="h-3 w-3" /> Verified purchase
              </span>
            )}
            <span>{reviewDate}</span>
          </div>
        </div>
        <StarRating value={review?.rating || 0} readOnly size="sm" />
      </div>

      <div className="mt-4 space-y-3">
        <p className="text-base font-semibold text-white">
          {review?.title || ""}
        </p>
        <p className="text-sm leading-relaxed text-white/70">{shownContent}</p>
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]"
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
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#111]"
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
        <div className="mt-4 flex items-center gap-2 text-xs text-white/30">
          <ImageOff className="h-4 w-4" />
          No images
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onHelpfulVote && onHelpfulVote(review)}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition-colors ${
            hasVoted
              ? "border-[#D4AF37] bg-[#D4AF37]/20 text-[#f0d58a]"
              : "border-white/10 text-white/70 hover:border-[#D4AF37]/50"
          }`}
        >
          <ThumbsUp className="h-3 w-3" />
          Helpful ({review?.helpfulCount || 0})
        </button>

        <div className="flex flex-wrap items-center gap-3">
          {isOwnReview && review?.status && (
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                statusStyle[review.status] || "bg-white/10 text-white/70"
              }`}
            >
              {review.status}
            </span>
          )}
          {isOwnReview && (
            <div className="flex items-center gap-2">
              {review?.status === "pending" && (
                <button
                  type="button"
                  onClick={() => onEdit && onEdit(review)}
                  className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/70 hover:border-[#D4AF37]/50"
                >
                  Edit
                </button>
              )}
              <button
                type="button"
                onClick={() => onDelete && onDelete(review)}
                className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-rose-200 hover:border-rose-400/70"
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
            className="absolute right-6 top-6 rounded-full border border-white/20 bg-black/50 px-4 py-2 text-xs font-semibold text-white"
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
    </div>
  );
};

export const ReviewCardSkeleton = () => (
  <div className="animate-pulse rounded-3xl border border-white/10 bg-[#0b0b0b] p-6">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-4 w-32 rounded-full bg-white/10" />
        <div className="h-3 w-24 rounded-full bg-white/10" />
      </div>
      <div className="h-4 w-24 rounded-full bg-white/10" />
    </div>
    <div className="mt-4 space-y-3">
      <div className="h-4 w-40 rounded-full bg-white/10" />
      <div className="h-3 w-full rounded-full bg-white/10" />
      <div className="h-3 w-5/6 rounded-full bg-white/10" />
    </div>
    <div className="mt-4 grid grid-cols-3 gap-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="h-24 rounded-2xl bg-white/10" />
      ))}
    </div>
  </div>
);

export default ReviewCard;
