import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import ReviewForm from "@/components/Review/ReviewForm";
import ReviewCard from "@/components/Review/ReviewCard";
import {
  fetchUserReviews,
  deleteReview,
  updateReview,
} from "@/store/reviewSlice";
import { fetchUserOrders } from "@/store/order-slice";
import { toast } from "@/hooks/use-toast";

const MyReviewsPage = () => {
  const dispatch = useDispatch();
  const { userReviews, loading } = useSelector((state) => state.review);
  const { userOrders } = useSelector((state) => state.order);

  const [editingReview, setEditingReview] = useState(null);

  useEffect(() => {
    dispatch(fetchUserReviews());
    dispatch(fetchUserOrders());
  }, [dispatch]);

  const reviewedProductIds = useMemo(
    () => new Set(userReviews.map((review) => String(review.productId?._id || review.productId))),
    [userReviews]
  );

  const eligibleProducts = useMemo(() => {
    const items = [];
    userOrders.forEach((order) => {
      if (order.status !== "confirmed") return;
      order.items?.forEach((item) => {
        const productId = String(item.product?._id || item.product);
        if (!reviewedProductIds.has(productId)) {
          items.push({
            productId,
            name: item.product?.name || item.productName,
            slug: item.product?.slug || item.productSlug,
            image: item.product?.images?.[0]?.url || item.product?.primaryImage || "/placeholder.jpg",
            orderId: order._id,
          });
        }
      });
    });
    const uniqueMap = new Map();
    items.forEach((item) => {
      if (!uniqueMap.has(item.productId)) uniqueMap.set(item.productId, item);
    });
    return Array.from(uniqueMap.values());
  }, [userOrders, reviewedProductIds]);

  const handleDelete = async (review) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await dispatch(deleteReview(review._id)).unwrap();
      dispatch(fetchUserReviews());
    } catch (error) {
      toast({
        title: "Unable to delete",
        description: error || "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async (payload) => {
    const response = await dispatch(updateReview(payload)).unwrap();
    setEditingReview(null);
    dispatch(fetchUserReviews());
    return response;
  };

  return (
    <div className="min-h-screen bg-[#060606] text-white">
      <div className="container mx-auto max-w-7xl px-4 py-10">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">
            My reviews
          </p>
          <h1 className="mt-2 text-4xl font-semibold">Your Review History</h1>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-[#0b0b0b] p-10 text-white/60">
            Loading your reviews...
          </div>
        ) : userReviews.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-[#0b0b0b] p-10 text-white/60">
            You have not posted any reviews yet.
          </div>
        ) : (
          <div className="space-y-6">
            {userReviews.map((review) => (
              <div key={review._id} className="rounded-3xl border border-white/10 bg-[#0b0b0b] p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={review.productId?.images?.[0]?.url || "/placeholder.jpg"}
                      alt={review.productId?.name || "Product"}
                      className="h-16 w-14 rounded-2xl object-cover"
                    />
                    <div>
                      <p className="text-sm font-semibold">{review.productId?.name}</p>
                      <Link
                        to={`/shopping/product/${review.productId?.slug}`}
                        className="text-xs uppercase tracking-[0.2em] text-white/50"
                      >
                        View product
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <ReviewCard
                    review={review}
                    isOwnReview
                    onEdit={() => setEditingReview(review)}
                    onDelete={handleDelete}
                    currentUserId={review.userId?._id}
                  />
                </div>

                {editingReview?._id === review._id && (
                  <div className="mt-6">
                    <ReviewForm
                      productId={review.productId?._id}
                      orderId={review.orderId}
                      initialValues={review}
                      onSubmit={(data) =>
                        handleUpdate({ reviewId: review._id, ...data })
                      }
                      onCancel={() => setEditingReview(null)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-12">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">
            Write a review
          </p>
          {eligibleProducts.length === 0 ? (
            <div className="mt-4 rounded-3xl border border-white/10 bg-[#0b0b0b] p-8 text-white/60">
              No eligible purchases to review yet.
            </div>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {eligibleProducts.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-[#0b0b0b] p-6"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-16 w-14 rounded-2xl object-cover"
                    />
                    <div>
                      <p className="text-sm font-semibold">{item.name}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                        Eligible to review
                      </p>
                    </div>
                  </div>
                  <Link
                    to={`/product/${item.productId}/reviews`}
                    className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70"
                  >
                    Write review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyReviewsPage;
